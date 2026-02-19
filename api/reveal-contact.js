import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Master ID is required' });
    }

    // 1. Check source first (lightweight check)
    const { data: masterMeta, error: metaError } = await supabase
      .from('masters')
      .select('source, contacts')
      .eq('id', id)
      .single();

    if (metaError || !masterMeta) {
      return res.status(404).json({ error: 'Master not found' });
    }

    let success = true;

    // 2. If OSM, return immediately (Free)
    if (masterMeta.source === 'osm') {
      success = true;
    }
    // 3. If User, perform Atomic Transaction
    else if (masterMeta.source === 'user') {
      const leadCost = 10;

      const { data: master, error: fetchError } = await supabase
        .from('masters')
        .select('balance, contacts')
        .eq('id', id)
        .single();

      if (fetchError || !master) return res.status(404).json({ error: 'Master not found' });

      if (master.balance < leadCost) {
        success = false;
        return res.status(402).json({ error: 'Insufficient Balance' });
      }

      // Optimistic update: match the specific balance we just saw
      const { data: updatedMaster, error: deductionError } = await supabase
        .from('masters')
        .update({ balance: master.balance - leadCost })
        .eq('id', id)
        .eq('balance', master.balance) // Optimistic Lock
        .select('contacts')
        .single();

      if (deductionError || !updatedMaster) {
        // Concurrency conflict or error
        success = false;
        return res.status(409).json({ error: 'Transaction conflict, please try again' });
      }

      success = true;
    }

    // 4. Log the Lead (if successful)
    if (success) {
       try {
         await supabase.rpc('increment_daily_stat', { col: 'leads' });
       } catch(e) {
         console.warn('Stats RPC missing', e.message);
       }
    }

    return res.status(200).json({ contacts: masterMeta.contacts });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
