export default async function handler(req, res) {
  const { target } = req.query;

  // Affiliate Mapping
  // Format: target_key -> URL
  const LINKS = {
    // Filaments
    'filament_pla': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=PLA+filament',
    'filament_petg': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=PETG+filament',
    'filament_abs': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=ABS+filament',
    'filament_tpu': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=TPU+filament',
    'filament_nylon': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=Nylon+filament',

    // Hardware
    'bearing_608': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=608ZZ+bearing',
    'bearing_linear': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=LM8UU+linear+bearing',
    'screws_m3': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=M3+screws+kit',
    'screws_m4': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=M4+screws+kit',
    'magnets': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=neodymium+magnets',

    // Electronics
    'arduino': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=Arduino+Nano',
    'esp32': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=ESP32',
    'led_strip': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=LED+strip+5V',
    'servo': 'https://www.aliexpress.com/wholesale?catId=0&initiative_id=SB_20230221000000&SearchText=SG90+servo'
  };

  const url = LINKS[target];

  if (url) {
    // Log click? (Future improvement)
    res.redirect(302, url);
  } else {
    // Fallback to home or generic search
    res.redirect(302, '/');
  }
}
