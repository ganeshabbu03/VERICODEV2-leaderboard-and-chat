// Persistence layer for the Leaderboard feature.
// Supports both Supabase database and local JSON file fallback.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabase-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'leaderboard.json');

const SEED_USERS = [];

let store = {}; // local in-memory store for fallback/caching

function seedIfEmpty() {
  // Empty as we want a clean leaderboard with no mock data
}

function loadLocal() {
  try {
    if (fs.existsSync(DB_PATH)) {
      store = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      
      // Purge any local mock data
      for (const key in store) {
        if (key.startsWith('seed_')) {
          delete store[key];
        }
      }
      return;
    }
  } catch (err) {
    console.error('Failed to load local leaderboard store:', err);
  }
  store = {};
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
      console.error('Failed to persist local leaderboard store:', err);
    }
  }, 200);
}

// Initial local load (as a baseline fallback cache)
loadLocal();

// Async database seeding & purging routine for Supabase
async function seedSupabaseIfEmpty() {
  if (!supabase) return;
  try {
    // Purge any existing mock users starting with 'seed_'
    console.log('Cleaning up existing mock users from Supabase leaderboard...');
    const { error: deleteError } = await supabase
      .from('leaderboard')
      .delete()
      .like('id', 'seed_%');
      
    if (deleteError) {
      console.error('Failed to purge mock users from Supabase:', deleteError);
    } else {
      console.log('✅ Successfully purged mock users from Supabase leaderboard.');
    }
  } catch (err) {
    console.error('Failed to clear Supabase leaderboard:', err);
  }
}

// Fire off Supabase seeding on startup if connected
seedSupabaseIfEmpty();

const MAX_NAME_LENGTH = 40;
const MAX_BADGES = 20;
const VALID_TIERS = new Set(['Guardian', 'Knight', 'Challenger']);

function clampInt(n, min, max) {
  const v = Math.round(Number(n) || 0);
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex) {
  if (!hex) return "255, 255, 255";
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return isNaN(r) || isNaN(g) || isNaN(b) ? "255, 255, 255" : `${r}, ${g}, ${b}`;
}

export async function getAll() {
  if (supabase) {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*');
    if (!error && data) {
      // Sync cache in memory
      for (const u of data) {
        store[u.id] = u;
      }
      return data;
    }
    console.error('Supabase error fetching leaderboard, using local fallback:', error);
  }
  return Object.values(store);
}

export async function getById(id) {
  if (supabase) {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) {
      store[id] = data;
      return data;
    }
  }
  return store[id] || null;
}

export async function upsertUser(id, fields) {
  if (!id || typeof id !== 'string') throw new Error('Missing user id');

  const existing = (supabase ? await getById(id) : store[id]) || {};

  const solvedIn = fields.solved || {};
  const solved = {
    easy: clampInt(solvedIn.easy, 0, 100000),
    medium: clampInt(solvedIn.medium, 0, 100000),
    hard: clampInt(solvedIn.hard, 0, 100000)
  };

  const languagesIn = fields.languages && typeof fields.languages === 'object' ? fields.languages : {};
  const languages = {};
  for (const [lang, pct] of Object.entries(languagesIn).slice(0, 10)) {
    languages[String(lang).slice(0, 20)] = clampInt(pct, 0, 100);
  }

  const badges = Array.isArray(fields.badges)
    ? fields.badges.slice(0, MAX_BADGES).map((b) => String(b).slice(0, 40))
    : (existing.badges || []);

  const tier = VALID_TIERS.has(fields.tier) ? fields.tier : (existing.tier || 'Challenger');

  const updated = {
    id,
    name: String(fields.name || existing.name || id).slice(0, MAX_NAME_LENGTH),
    avatarId: clampInt(fields.avatarId, 1, 4) || existing.avatarId || 1,
    score: clampInt(fields.score, 0, 10_000_000),
    rating: clampInt(fields.rating, 0, 10_000_000),
    tier,
    solved,
    languages: Object.keys(languages).length ? languages : (existing.languages || {}),
    badges,
    country: String(fields.country || existing.country || '').slice(0, 4).toUpperCase(),
    flag: String(fields.flag || existing.flag || '🌐').slice(0, 8),
    recent: String(fields.recent || existing.recent || '').slice(0, 200),
    updated_at: Date.now()
  };

  store[id] = updated;
  scheduleSaveLocal();

  if (supabase) {
    const { error } = await supabase
      .from('leaderboard')
      .upsert(updated);
    if (error) {
      console.error('Supabase error upserting leaderboard row:', error);
    }
  }

  return updated;
}
