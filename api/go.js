import { getConfig } from '../lib/config.js';
import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  const { target } = req.query;

  // Use the helper from lib/config.js which uses cache
  let url = await getConfig(target);

  // Fallback defaults if DB is empty or key missing
  if (!url) {
    const defaults = {
        'filament_pla': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=PLA+filament',
        'filament_petg': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=PETG+filament',
        'filament_abs': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=ABS+filament',
        'filament_tpu': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=TPU+filament',
        'filament_nylon': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=Nylon+filament',

        'bearing_608': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=608ZZ+bearing',
        'bearing_linear': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=LM8UU+linear+bearing',
        'screws_m3': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=M3+screws+kit',
        'screws_m4': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=M4+screws+kit',
        'magnets': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=neodymium+magnets',

        'arduino': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=Arduino+Nano',
        'esp32': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=ESP32',
        'led_strip': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=LED+strip+5V',
        'servo': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=SG90+servo'
    };
    url = defaults[target];
  }

  if (url) {
    // Log Stats (Awaiting for Serverless compatibility)
    try {
        await supabase.rpc('increment_daily_stat', { col: 'clicks_affiliate' });
    } catch (e) {
        console.warn('Stats RPC failed:', e.message);
    }

    res.redirect(302, url);
  } else {
    // Generic fallback
    res.redirect(302, '/');
  }
}
