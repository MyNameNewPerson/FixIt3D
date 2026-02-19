import express from 'express';
import { supabase } from '../lib/supabase.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { verifyPassword, signToken, verifyAdmin } from '../lib/auth.js';
import { getConfig, invalidateConfig } from '../lib/config.js'; // Import config helpers

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());

const SECRET = process.env.SESSION_SECRET || 'dev_secret_key';

// 1. LOGIN
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  if (verifyPassword(password)) {
    const token = signToken({ role: 'admin' });

    // Set cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 3600 * 1000 // 12 hours
    });

    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

// 2. GET STATS (Protected)
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    // 1. Daily Stats
    const { data: stats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    if (statsError) {
        // If RPC/Table missing, just return empty
        console.warn('Stats error:', statsError.message);
    }

    // 2. Masters Overview
    const { count: mastersCount } = await supabase
      .from('masters')
      .select('*', { count: 'exact', head: true });

    const { count: premiumCount } = await supabase
      .from('masters')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true);

    // 3. Balance Total (Fetch all balances > 0 and sum in JS)
    const { data: balances } = await supabase
      .from('masters')
      .select('balance')
      .gt('balance', 0);

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

// 3. GET CONFIG (Protected)
app.get('/api/admin/config', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .order('key');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE CONFIG (Protected)
app.post('/api/admin/config', verifyAdmin, async (req, res) => {
  const { key, value } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: 'Key and Value are required' });
  }

  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        key,
        value,
        updated_at: new Date()
      });

    if (error) throw error;

    // Invalidate local cache so next request fetches fresh data
    invalidateConfig(); // Call the exported function

    // Audit Log
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

// 5. VERIFY MASTER (Protected)
app.post('/api/admin/masters/verify', verifyAdmin, async (req, res) => {
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

// Export handler for Vercel
// Vercel handles requests by passing (req, res) to the exported function
export default app;
