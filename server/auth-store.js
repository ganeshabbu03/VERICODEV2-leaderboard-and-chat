import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabase } from './supabase-client.js';
import { getById, upsertUser } from './leaderboard-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'users.json');

let store = {}; // in-memory local cache/fallback

function loadLocal() {
  try {
    if (fs.existsSync(DB_PATH)) {
      store = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load local users database:', err);
  }
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
      console.error('Failed to persist local users database:', err);
    }
  }, 200);
}

loadLocal();

export function hashPassword(password) {
  const salt = 'vericode_salt_1337';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export async function registerUser(name, email, password) {
  const sanitizedEmail = email.trim().toLowerCase();
  const username = sanitizedEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');

  if (!username) {
    return { success: false, error: 'Could not resolve username from email address' };
  }

  // 1. Check if email or username already exists
  if (supabase) {
    const { data: existingEmail } = await supabase.from('users').select('id').eq('email', sanitizedEmail).maybeSingle();
    if (existingEmail) {
      return { success: false, error: 'Email address already registered' };
    }

    const { data: existingUsername } = await supabase.from('users').select('id').eq('id', username).maybeSingle();
    if (existingUsername) {
      return { success: false, error: 'Username derived from email is already taken' };
    }
  } else {
    for (const key in store) {
      if (store[key].email === sanitizedEmail) {
        return { success: false, error: 'Email address already registered' };
      }
    }
    if (store[username]) {
      return { success: false, error: 'Username derived from email is already taken' };
    }
  }

  const hashedPassword = hashPassword(password);
  const userRecord = {
    id: username,
    email: sanitizedEmail,
    password_hash: hashedPassword,
    created_at: Date.now()
  };

  // 2. Insert user
  if (supabase) {
    const { error: insertError } = await supabase.from('users').insert([userRecord]);
    if (insertError) {
      console.error('Supabase user insert error:', insertError);
      return { success: false, error: 'Failed to create user account' };
    }
  }

  // Always update in-memory cache
  store[username] = userRecord;
  scheduleSaveLocal();

  // 3. Create initial leaderboard profile
  const profileFields = {
    name: name || username,
    score: 0,
    rating: 1200,
    tier: 'Challenger',
    solved: { easy: 0, medium: 0, hard: 0 },
    languages: {},
    badges: [],
    country: 'US',
    flag: '🇺🇸',
    recent: 'Joined Vericode AI'
  };

  await upsertUser(username, profileFields);

  return {
    success: true,
    profile: {
      name: name || username,
      username: username,
      email: sanitizedEmail
    }
  };
}

export async function loginUser(email, password) {
  const sanitizedEmail = email.trim().toLowerCase();
  let userRecord = null;

  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('email', sanitizedEmail).maybeSingle();
    if (error) {
      console.error('Supabase fetch user error:', error);
    } else {
      userRecord = data;
    }
  }

  // Fallback to local store if not found or if database is offline
  if (!userRecord) {
    for (const key in store) {
      if (store[key].email === sanitizedEmail) {
        userRecord = store[key];
        break;
      }
    }
  }

  if (!userRecord) {
    return { success: false, error: 'Invalid email or password' };
  }

  const hashedPassword = hashPassword(password);
  if (userRecord.password_hash !== hashedPassword) {
    return { success: false, error: 'Invalid email or password' };
  }

  const profile = await getById(userRecord.id);

  return {
    success: true,
    profile: {
      name: profile ? profile.name : userRecord.id,
      username: userRecord.id,
      email: userRecord.email
    }
  };
}
