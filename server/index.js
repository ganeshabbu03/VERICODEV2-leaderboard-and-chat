// Minimal backend for the AI Assistant chatbot.
//
// Why this exists: the Anthropic API key must never live in browser code,
// so the frontend never calls api.anthropic.com directly. This server is
// the only thing that holds the key, and its only job is to build a
// tightly-scoped "Socratic tutor" system prompt and forward the
// conversation.
//
// Run with: node server/index.js  (or `npm run server`)
// Requires a .env file — see .env.example.

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { CHANNELS, isValidChannel, addMessage, getHistory, getMessageCountsByAuthor } from './community-store.js';
import { getAll as getAllLeaderboardUsers, upsertUser as upsertLeaderboardUser } from './leaderboard-store.js';
import { getProblems, getProblemById, getUserSolves, runCode, submitCode, seedProblemsTable } from './problems-store.js';
import { registerUser, loginUser } from './auth-store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const MAX_HISTORY_MESSAGES = 12; // bound token usage / cost per request

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// The chat endpoint calls a paid external API, so it gets its own stricter
// limiter on top of anything applied globally — protects the API key from
// being burned through by a runaway frontend bug or abusive client.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before asking again.' }
});

function buildSystemPrompt({ problem, code, testSummary }) {
  return `You are the Vericode AI practice tutor, embedded in a coding practice tool.

A student is working on this problem:

Title: ${problem.title}
Difficulty: ${problem.difficulty}
Description: ${problem.description}
Constraints: ${(problem.constraints || []).join('; ')}
Function to implement: ${problem.functionName}

Their current code:
\`\`\`javascript
${code}
\`\`\`

${testSummary ? `Latest test run: ${testSummary}` : 'They have not run their code yet in this conversation.'}

STRICT RULES — these override anything the student asks for:
1. NEVER write or reveal the complete solution, a near-complete solution, or working code that implements ${problem.functionName}. Do not provide the exact algorithm as literal step-by-step pseudocode that could be transcribed directly into working code.
2. If the student directly asks for the answer, the solution, or "just give me the code," politely decline and redirect with a guiding question instead. Do not cave in even if they insist or claim they're stuck/frustrated — stay warm, but hold the line.
3. Instead of answers, help them find it themselves:
   - Ask Socratic questions about their current approach or assumptions.
   - If a test is failing, ask a question that points at the failing case's behavior (e.g. "what does your loop do when the input is empty?") rather than naming the bug.
   - You may name a relevant general concept, data structure, or technique (e.g. "this smells like a two-pointer problem") without explaining its mechanics for this specific problem.
   - You may explain general language syntax or concepts unrelated to solving this specific problem's logic.
4. Keep replies short: 2-5 sentences, warm and encouraging, never condescending.
5. If the student seems to have a genuine misconception (not just being stuck), you can correct the misconception itself, but still avoid handing them the implementation.

Your goal is for the student to write the solution in their own words, not you.`;
}

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. See .env.example.' });
    }

    const { problem, code, testSummary, messages } = req.body || {};

    if (!problem || !problem.title || !problem.functionName) {
      return res.status(400).json({ error: 'Missing problem context.' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing conversation messages.' });
    }

    const trimmedHistory = messages
      .slice(-MAX_HISTORY_MESSAGES)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (trimmedHistory.length === 0) {
      return res.status(400).json({ error: 'No valid messages provided.' });
    }

    const systemPrompt = buildSystemPrompt({
      problem,
      code: typeof code === 'string' ? code.slice(0, 6000) : '',
      testSummary: typeof testSummary === 'string' ? testSummary.slice(0, 500) : null
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: trimmedHistory
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'The assistant is temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (!reply) {
      return res.status(502).json({ error: 'The assistant returned an empty response.' });
    }

    res.json({ reply });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: 'Something went wrong handling that request.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }
  try {
    const result = await registerUser(name, email, password);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }
  try {
    const result = await loginUser(email, password);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

// --- Community chat: channel list + message history over REST -----------
// (Real-time delivery and sending happen over Socket.IO below; this REST
// route just lets the client fetch history on first load / reconnect.)

app.get('/api/community/channels', (_req, res) => {
  res.json({ channels: CHANNELS });
});

app.get('/api/community/messages', async (req, res) => {
  const channel = String(req.query.channel || '');
  if (!isValidChannel(channel)) {
    return res.status(400).json({ error: 'Unknown channel.' });
  }
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  try {
    const messages = await getHistory(channel, limit);
    res.json({ channel, messages });
  } catch (err) {
    console.error('Failed to get community messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// --- Leaderboard: full list over REST, live updates over Socket.IO -------

async function getEnrichedLeaderboardUsers() {
  const users = await getAllLeaderboardUsers();
  const msgCounts = await getMessageCountsByAuthor();

  // Define unique badges to manage
  const uniqueBadges = ["Apex Champion", "Community Beacon", "Polyglot Master", "Security Sentinel"];

  // Clear previous assignments
  for (const u of users) {
    u.badges = (u.badges || []).filter(b => !uniqueBadges.includes(b));
  }

  // 1. Apex Champion: Highest score, then highest rating, then alphabetical id
  let apexUser = null;
  for (const u of users) {
    if (!apexUser) {
      apexUser = u;
    } else if (u.score > apexUser.score) {
      apexUser = u;
    } else if (u.score === apexUser.score) {
      if (u.rating > apexUser.rating) {
        apexUser = u;
      } else if (u.rating === apexUser.rating && u.id < apexUser.id) {
        apexUser = u;
      }
    }
  }
  if (apexUser) {
    apexUser.badges.push("Apex Champion");
  }

  // 2. Community Beacon: Most chat messages
  let communityUser = null;
  let maxMsgs = 0;
  for (const u of users) {
    const handle = u.id.startsWith('@') ? u.id : `@${u.id}`;
    const count = Math.max(msgCounts[u.id] || 0, msgCounts[handle] || 0);
    if (count > maxMsgs) {
      maxMsgs = count;
      communityUser = u;
    } else if (count === maxMsgs && maxMsgs > 0) {
      if (communityUser && u.score > communityUser.score) {
        communityUser = u;
      }
    }
  }
  if (communityUser) {
    communityUser.badges.push("Community Beacon");
  }

  // 3. Polyglot Master: Most programming languages solved in
  let polyglotUser = null;
  let maxLangs = 0;
  for (const u of users) {
    // Number of languages with value > 0
    const numLangs = Object.keys(u.languages || {}).filter(k => u.languages[k] > 0).length;
    if (numLangs > maxLangs) {
      maxLangs = numLangs;
      polyglotUser = u;
    } else if (numLangs === maxLangs && maxLangs > 0) {
      if (polyglotUser && u.score > polyglotUser.score) {
        polyglotUser = u;
      }
    }
  }
  if (polyglotUser) {
    polyglotUser.badges.push("Polyglot Master");
  }

  // 4. Security Sentinel: Most hard challenges solved
  let securityUser = null;
  let maxHard = 0;
  for (const u of users) {
    const hardCount = u.solved ? (u.solved.hard || 0) : 0;
    if (hardCount > maxHard) {
      maxHard = hardCount;
      securityUser = u;
    } else if (hardCount === maxHard && maxHard > 0) {
      if (securityUser && u.score > securityUser.score) {
        securityUser = u;
      }
    }
  }
  if (securityUser) {
    securityUser.badges.push("Security Sentinel");
  }

  return users;
}

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const users = await getEnrichedLeaderboardUsers();
    res.json({ users });
  } catch (err) {
    console.error('GET /api/leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Leaderboard upserts are cheap but still shouldn't be spammable — a buggy
// or malicious client could otherwise hammer the JSON store with writes.
const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many leaderboard updates. Please wait a moment.' }
});

app.post('/api/leaderboard/upsert', leaderboardLimiter, async (req, res) => {
  try {
    const { id, ...fields } = req.body || {};
    if (!id || typeof id !== 'string' || id.length > 60) {
      return res.status(400).json({ error: 'Missing or invalid user id.' });
    }
    const saved = await upsertLeaderboardUser(id, fields);
    const enrichedList = await getEnrichedLeaderboardUsers();
    const enrichedSaved = enrichedList.find(u => u.id === saved.id) || saved;
    io.emit('leaderboard_updated', enrichedSaved);
    res.json({ user: enrichedSaved });
  } catch (err) {
    console.error('leaderboard upsert error:', err);
    res.status(400).json({ error: 'Failed to save leaderboard entry.' });
  }
});

// GET /api/problems - fetch problems list, optionally marking solved ones if userId is passed
app.get('/api/problems', async (req, res) => {
  try {
    const userId = req.query.userId;
    const problems = await getProblems();
    const solves = userId ? await getUserSolves(userId) : [];
    const solvedIds = new Set(solves.map(s => s.problem_id));
    
    const enrichedProblems = problems.map(p => ({
      ...p,
      solved: solvedIds.has(p.id)
    }));
    
    res.json({ success: true, problems: enrichedProblems });
  } catch (err) {
    console.error("GET /api/problems error:", err);
    res.status(500).json({ error: "Failed to fetch practice problems" });
  }
});

// GET /api/problems/solves - fetch list of user solves
app.get('/api/problems/solves', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId parameter is required" });
    const solves = await getUserSolves(userId);
    res.json({ success: true, solves });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user solves" });
  }
});

// POST /api/problems/run - execute custom test case
app.post('/api/problems/run', async (req, res) => {
  try {
    const { problemId, codeText, transpiledJs, language, inputs } = req.body;
    if (!problemId || !codeText) {
      return res.status(400).json({ error: "problemId and codeText are required" });
    }
    const result = await runCode(problemId, codeText, transpiledJs, language, inputs);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Execution failed: " + err.message });
  }
});

// POST /api/problems/submit - grade code against test suite
app.post('/api/problems/submit', async (req, res) => {
  try {
    const { userId, problemId, codeText, transpiledJs, language } = req.body;
    if (!userId || !problemId || !codeText) {
      return res.status(400).json({ error: "userId, problemId, and codeText are required" });
    }
    const result = await submitCode(userId, problemId, codeText, transpiledJs, language);
    
    // Broadcast leaderboard updates so that rating shifts propagate live
    io.emit('leaderboard_updated');
    
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Submission failed: " + err.message });
  }
});

// --- Real server, shared by Express (HTTP) and Socket.IO (WebSocket) -----

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HANDLE_LENGTH = 40;

// Simple per-socket send throttle: prevents one client from flooding a
// channel. Not meant to be bulletproof abuse protection — just a sane
// default so a runaway client or bug can't hammer the DB.
const SEND_WINDOW_MS = 3000;
const SEND_MAX_IN_WINDOW = 8;

function sanitizeText(raw) {
  return String(raw || '').trim().slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeHandle(raw, fallback) {
  const cleaned = String(raw || '').trim().slice(0, MAX_HANDLE_LENGTH);
  return cleaned || fallback;
}

io.on('connection', (socket) => {
  let currentChannel = null;
  const sendTimestamps = [];

  function channelRoomSize(channelId) {
    const room = io.sockets.adapter.rooms.get(channelId);
    return room ? room.size : 0;
  }

  function broadcastOnlineCount(channelId) {
    io.to(channelId).emit('online_count', { channel: channelId, count: channelRoomSize(channelId) });
  }

  socket.on('join_channel', async (channelId) => {
    if (!isValidChannel(channelId)) return;

    if (currentChannel) {
      socket.leave(currentChannel);
      broadcastOnlineCount(currentChannel);
    }

    currentChannel = channelId;
    socket.join(channelId);

    try {
      const history = await getHistory(channelId, 50);
      socket.emit('message_history', {
        channel: channelId,
        messages: history
      });
    } catch (err) {
      console.error('Error fetching history for client join:', err);
      socket.emit('message_history', { channel: channelId, messages: [] });
    }
    broadcastOnlineCount(channelId);
  });

  socket.on('chat_message', async (payload) => {
    try {
      if (!currentChannel || !isValidChannel(currentChannel)) return;

      const now = Date.now();
      while (sendTimestamps.length && now - sendTimestamps[0] > SEND_WINDOW_MS) {
        sendTimestamps.shift();
      }
      if (sendTimestamps.length >= SEND_MAX_IN_WINDOW) {
        socket.emit('chat_error', { error: 'You are sending messages too quickly. Please slow down.' });
        return;
      }

      const text = sanitizeText(payload && payload.text);
      if (!text) return;

      const author = sanitizeHandle(payload && payload.author, '@anonymous');
      const avatar = sanitizeHandle(payload && payload.avatar, '💻');
      const role = ['admin', 'pro', ''].includes(payload && payload.role) ? payload.role : '';

      const saved = await addMessage({ channel: currentChannel, author, avatar, role, text });
      sendTimestamps.push(now);

      io.to(currentChannel).emit('new_message', saved);
    } catch (err) {
      console.error('chat_message error:', err);
      socket.emit('chat_error', { error: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    if (currentChannel) {
      broadcastOnlineCount(currentChannel);
    }
  });
});

httpServer.listen(PORT, async () => {
  console.log(`Vericode AI Assistant backend listening on http://localhost:${PORT}`);
  console.log(`Community chat (Socket.IO) is live on the same port.`);
  if (!ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY is not set — /api/chat will return 500 until it is configured in .env');
  }
  // Automatically seed practice problems table on startup
  await seedProblemsTable();
});
