import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('URL:', supabaseUrl);
console.log('KEY:', supabaseKey ? 'exists' : 'missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('Testing connection...');
  
  // Try fetching from different tables to see what exists
  const tables = ['users', 'leaderboard', 'problems', 'user_solves', 'community_messages'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}": Error -`, error.message, `(${error.code})`);
    } else {
      console.log(`Table "${table}": OK (columns: ${data && data.length > 0 ? Object.keys(data[0]).join(', ') : 'unknown (empty)'})`);
    }
  }
}

inspect();
