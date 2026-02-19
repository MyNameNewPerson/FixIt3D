import express from 'express';
import { supabase } from '../lib/supabase.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { invalidateConfig } from '../lib/config.js';

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());

// Middleware: Verify Supabase Auth Token (Access Token from Client)
async function verifySupabaseAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // Use Supabase Auth to verify the JWT
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Check if user is admin (by email check, or role if implemented)
  if (user.email !== 'admin@fixit3d.com') { // MVP: Hardcoded super-admin email check
      return res.status(403).json({ error: 'Forbidden: Not an admin' });
  }

  req.user = user;
  next();
}

// 1. GET STATS (Protected)
app.get('/api/admin/stats', verifySupabaseAuth, async (req, res) => {
  try {
    // 1. Daily Stats
    const { data: stats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    if (statsError) console.warn('Stats error:', statsError.message);

    // 2. Masters Overview
    const { count: mastersCount } = await supabase.from('masters').select('*', { count: 'exact', head: true });
    const { count: premiumCount } = await supabase.from('masters').select('*', { count: 'exact', head: true }).eq('is_premium', true);

    // 3. Balance Total
    const { data: balances } = await supabase.from('masters').select('balance').gt('balance', 0);
    const totalBalance = balances ? balances.reduce((acc, curr) => acc + (curr.balance || 0), 0) : 0;

    res.json({
      stats: stats || [],
      masters: {
        total: mastersCount,
        premium: premiumCount,
        total_balance: totalBalance
      }
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 2. GET CONFIG (Protected)
app.get('/api/admin/config', verifySupabaseAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('app_config').select('*').order('key');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE CONFIG (Protected)
app.post('/api/admin/config', verifySupabaseAuth, async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ error: 'Key and Value are required' });

  try {
    const { error } = await supabase.from('app_config').upsert({ key, value, updated_at: new Date() });
    if (error) throw error;

    invalidateConfig();

    await supabase.from('admin_logs').insert({
      action: 'UPDATE_CONFIG',
      details: { key, value },
      ip: req.ip || req.socket.remoteAddress
    });

    res.json({ success: true, message: 'Config updated' });
  } catch (err) {
    console.error('Update Config Error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// 4. VERIFY MASTER (Protected)
app.post('/api/admin/masters/verify', verifySupabaseAuth, async (req, res) => {
  const { id, is_premium } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });

  try {
    const { error } = await supabase
      .from('masters')
      .update({ is_premium: !!is_premium, verified: true })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('admin_logs').insert({
      action: 'VERIFY_MASTER',
      details: { id, is_premium },
      ip: req.ip
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
