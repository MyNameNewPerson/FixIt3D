import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connection details - US East 1 Pooler
const CONNECTION_STRING = 'postgres://postgres.ggrdkycsnxirzcuuxlea:Valusha19923003@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function setupDatabase() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    console.log('Connecting to Supabase (US East 1 Pooler)...');
    await client.connect();
    console.log('Connected.');

    const sqlPath = path.join(__dirname, '../supabase/full_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL schema...');
    // Execute the SQL file content
    await client.query(sql);

    console.log('Database schema created successfully!');
    console.log('Tables: models, masters, app_config, daily_stats, admin_logs created.');

  } catch (err) {
    console.error('Error setting up database:', err.message);
    if (err.message.includes('Tenant or user not found')) {
      console.log('\nNOTE: The project might be in a different region (e.g., eu-central-1, ap-southeast-1).');
      console.log('Please check your Supabase dashboard for the correct connection string (Pooler URL).');
    }
  } finally {
    await client.end();
  }
}

setupDatabase();
