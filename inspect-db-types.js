import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkData() {
  const { data: leaderboardData, error: lErr } = await supabase.from('leaderboard').select('*').limit(1);
  console.log('Leaderboard sample:', leaderboardData, lErr);

  const { data: communityData, error: cErr } = await supabase.from('community_messages').select('*').limit(1);
  console.log('Community sample:', communityData, cErr);
}

checkData();
