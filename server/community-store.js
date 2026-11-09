// Persistence layer for the Community chat feature.
// Supports both Supabase database and local JSON file fallback.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabase-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'community.json');

export const CHANNELS = [
  { id: 'general', name: 'general', desc: 'Discuss anything and everything secure coding.', icon: '💬' },
  { id: 'security-alerts', name: 'security-alerts', desc: 'Vulnerability alerts, CVE warnings, and security news.', icon: '🚨' },
  { id: 'coding-help', name: 'coding-help', desc: 'Get help with algorithms, compilers, and debugging code.', icon: '💻' },
  { id: 'feedback', name: 'feedback', desc: 'Share app suggestions, feature feedback, and reviews.', icon: '📢' }
];

const CHANNEL_IDS = new Set(CHANNELS.map((c) => c.id));

export function isValidChannel(channelId) {
  return CHANNEL_IDS.has(channelId);
}

const MAX_STORED_PER_CHANNEL = 500;

const SEED_MESSAGES = {
  general: [
    { channel: 'general', author: '@sec_wizard_99', avatar: '🧙‍♂️', role: 'pro', text: 'Welcome to Vericode AI secure coding channels! Discuss anything security-related here.', created_at: Date.now() - 3600000 * 24 * 3 },
    { channel: 'general', author: '@overflow_pwn', avatar: '💻', role: 'admin', text: 'Hey there! Let me know if you run into any runtime or compilation issues with the judge.', created_at: Date.now() - 3600000 * 24 * 2 },
    { channel: 'general', author: '@sec_wizard_99', avatar: '🧙‍♂️', role: 'pro', text: 'Has anyone solved the SQL Injection challenge yet? Its Socratic help was really useful.', created_at: Date.now() - 3600000 * 24 * 1 }
  ],
  'security-alerts': [
    { channel: 'security-alerts', author: '@sec_wizard_99', avatar: '🧙‍♂️', role: 'pro', text: 'Heads up: New vulnerability details published for OpenSSL. Patching recommended.', created_at: Date.now() - 3600000 * 12 }
  ],
  'coding-help': [],
  feedback: []
};

let nextId = 5;
let store = {}; // local in-memory store for fallback/caching

function emptyStore() {
  const s = {};
  for (const ch of CHANNELS) s[ch.id] = [];
  return s;
}

function seedIfEmpty() {
  let empty = true;
  for (const ch of CHANNELS) {
    if (store[ch.id] && store[ch.id].length > 0) {
      empty = false;
      break;
    }
  }
  if (empty) {
    // Add ids locally
    store = emptyStore();
    let idCounter = 1;
    for (const channelId of Object.keys(SEED_MESSAGES)) {
      store[channelId] = SEED_MESSAGES[channelId].map(msg => ({
        id: idCounter++,
        ...msg
      }));
    }
    nextId = idCounter;
    scheduleSaveLocal();
  }
}

function loadLocal() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      store = { ...emptyStore(), ...parsed };
      let maxId = 0;
      for (const ch of Object.keys(store)) {
        for (const msg of store[ch]) {
          if (msg.id > maxId) maxId = msg.id;
        }
      }
      nextId = maxId + 1;
      seedIfEmpty();
      return;
    }
  } catch (err) {
    console.error('Failed to load local community store:', err);
  }
  store = emptyStore();
  seedIfEmpty();
}

let saveScheduled = false;
function scheduleSaveLocal() {
  if (saveScheduled) return;
  saveScheduled = true;
  setTimeout(() => {
    saveScheduled = false;
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(store), 'utf-8');
    } catch (err) {
      console.error('Failed to persist local community store:', err);
    }
  }, 200);
}

// Initial local load (as a baseline fallback cache)
loadLocal();

// Async database seeding routine for Supabase
async function seedSupabaseIfEmpty() {
  if (!supabase) return;
  try {
    const { count, error } = await supabase
      .from('community_messages')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking if Supabase community_messages is empty:', error);
      return;
    }

    if (count === 0) {
      console.log('Seeding Supabase community messages with default seed messages...');
      const seedRows = [];
      for (const channelId of Object.keys(SEED_MESSAGES)) {
        for (const msg of SEED_MESSAGES[channelId]) {
          seedRows.push({
            channel: msg.channel,
            author: msg.author,
            avatar: msg.avatar,
            role: msg.role,
            text: msg.text,
            created_at: msg.created_at
          });
        }
      }
      const { error: insertError } = await supabase
        .from('community_messages')
        .insert(seedRows);
      if (insertError) {
        console.error('Error seeding Supabase community messages:', insertError);
      } else {
        console.log('Successfully seeded Supabase community messages!');
      }
    }
  } catch (err) {
    console.error('Failed to seed Supabase community messages:', err);
  }
}

// Fire off Supabase seeding on startup if connected
seedSupabaseIfEmpty();

export async function addMessage({ channel, author, avatar, role, text }) {
  if (!isValidChannel(channel)) throw new Error(`Unknown channel: ${channel}`);

  const message = {
    channel,
    author,
    avatar: avatar || '💻',
    role: role || '',
    text,
    created_at: Date.now()
  };

  // Local caching/fallback
  const localMessage = {
    id: nextId++,
    ...message
  };
  if (!store[channel]) store[channel] = [];
  store[channel].push(localMessage);
  if (store[channel].length > MAX_STORED_PER_CHANNEL) {
    store[channel] = store[channel].slice(-MAX_STORED_PER_CHANNEL);
  }
  scheduleSaveLocal();

  if (supabase) {
    const { data, error } = await supabase
      .from('community_messages')
      .insert(message)
      .select()
      .single();
    if (!error && data) {
      return data;
    }
    console.error('Supabase error inserting message:', error);
  }

  return localMessage;
}

// Returns messages oldest-first, most recent `limit` of them.
export async function getHistory(channel, limit = 50) {
  if (supabase) {
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && data) {
      // Reverse array since we query descending and client expects ascending order
      return data.reverse();
    }
    console.error('Supabase error getting history, using local fallback:', error);
  }
  const list = store[channel] || [];
  return list.slice(-limit);
}

// Computes message counts per author username across all channels
export async function getMessageCountsByAuthor() {
  if (supabase) {
    const { data, error } = await supabase
      .from('community_messages')
      .select('author');
    if (!error && data) {
      const counts = {};
      for (const row of data) {
        const author = row.author;
        if (author) {
          counts[author] = (counts[author] || 0) + 1;
        }
      }
      return counts;
    }
    console.error('Supabase error getting message counts, using local fallback:', error);
  }

  const counts = {};
  for (const channelId of Object.keys(store)) {
    if (store[channelId]) {
      for (const msg of store[channelId]) {
        const author = msg.author;
        if (author) {
          counts[author] = (counts[author] || 0) + 1;
        }
      }
    }
  }
  return counts;
}
