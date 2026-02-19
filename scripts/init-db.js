import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connection details - Use environment variable
const CONNECTION_STRING = process.env.DATABASE_URL;

async function setupDatabase() {
  if (!CONNECTION_STRING) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please add DATABASE_URL=postgres://... to your .env file.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    console.log('Connecting to Supabase...');
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
