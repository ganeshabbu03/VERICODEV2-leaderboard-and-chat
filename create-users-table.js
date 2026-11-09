import { execSync } from 'child_process';

console.log('Installing pg module...');
try {
  execSync('npm install pg', { stdio: 'inherit' });
  console.log('pg module installed successfully.');
} catch (err) {
  console.error('Failed to install pg:', err);
  process.exit(1);
}

async function run() {
  try {
    const pg = await import('pg');
    const { Client } = pg.default || pg;

    // Connection config
    const client = new Client({
      host: 'db.esmhgqsqdqqafhdgpigi.supabase.co',
      port: 5432,
      user: 'postgres',
      password: 'VericodeAI@1',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      );
    `;

    console.log('Creating table public.users if not exists...');
    const res = await client.query(createTableQuery);
    console.log('Table created successfully:', res);
    await client.end();
  } catch (err) {
    console.error('Error executing query:', err);
  }
}

run();
