import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // MUST be Service Role Key

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY (Service Role) are required in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setup() {
  console.log('Starting Database Setup...');

  // 1. Create Admin User
  const adminEmail = 'admin@fixit3d.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Valusha19923003';

  console.log(`Creating/Updating admin user: ${adminEmail}...`);

  // Check if user exists (hacky way via listUsers if possible, or just try create)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
  } else {
    const existing = users.find(u => u.email === adminEmail);
    if (existing) {
      console.log('Admin user already exists. ID:', existing.id);
      // Optional: Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, { password: adminPassword });
      if (updateError) console.error('Failed to update admin password:', updateError.message);
      else console.log('Admin password updated.');
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      });
      if (createError) console.error('Failed to create admin user:', createError.message);
      else console.log('Admin user created successfully. ID:', newUser.user.id);
    }
  }

  // 2. Seed App Config
  console.log('Seeding App Configuration...');
  const initialConfig = [
    { key: 'filament_pla', value: 'https://www.aliexpress.com/wholesale?SearchText=PLA+filament', description: 'PLA Filament Link' },
    { key: 'filament_petg', value: 'https://www.aliexpress.com/wholesale?SearchText=PETG+filament', description: 'PETG Filament Link' },
    { key: 'bearing_608', value: 'https://www.aliexpress.com/wholesale?SearchText=608ZZ+bearing', description: '608ZZ Bearing Link' },
    { key: 'arduino', value: 'https://www.aliexpress.com/wholesale?SearchText=Arduino+Nano', description: 'Arduino Nano Link' }
  ];

  for (const item of initialConfig) {
    const { error } = await supabase.from('app_config').upsert(item, { onConflict: 'key' });
    if (error) console.error(`Error seeding ${item.key}:`, error.message);
  }
  console.log('App Configuration seeded.');

  console.log('\nSetup Complete.');
  console.log('---------------------------------------------------');
  console.log('IMPORTANT: Run the SQL structure manually in Supabase SQL Editor!');
  console.log('See supabase/full_setup.sql for the table definitions.');
  console.log('---------------------------------------------------');
}

setup();
