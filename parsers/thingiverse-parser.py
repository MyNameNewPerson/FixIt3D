import requests
import json
from datetime import datetime
import os
import random

# --- Ваши учетные данные ---
CLIENT_ID = "715eaf8d906e33fd03a8"
CLIENT_SECRET = "2ea12c3007691d5e4118e64df9f6814f"
APP_TOKEN = "53dba3cff3fbbf0506e34d7fa855f40e"
# -------------------------

THINGIVERSE_API = 'https://api.thingiverse.com'

JOKE_KEYWORDS = ["joke", "meme", "funny", "gag", "prank", "fake", "parody"]

SPARE_PARTS_QUERIES = {
    'Bosch': ['Bosch+spare+part', 'Bosch+repair'],
    'Dyson': ['Dyson+spare+part', 'Dyson+repair'],
    'Ikea': ['Ikea+spare+part', 'Ikea+repair'],
    'Samsung': ['Samsung+spare+part', 'Samsung+repair'],
    'LG': ['LG+spare+part', 'LG+repair'],
    'Whirlpool': ['Whirlpool+spare+part', 'Whirlpool+repair'],
    'Philips': ['Philips+spare+part', 'Philips+repair'],
    'Braun': ['Braun+spare+part', 'Braun+repair'],
    'Miele': ['Miele+spare+part', 'Miele+repair'],
    'Xiaomi': ['Xiaomi+spare+part', 'Xiaomi+repair'],
    'Electrolux': ['Electrolux+spare+part', 'Electrolux+repair'],
    'Indesit': ['Indesit+spare+part', 'Indesit+repair'],
    'Kenwood': ['Kenwood+spare+part', 'Kenwood+repair'],
    'Moulinex': ['Moulinex+spare+part', 'Moulinex+repair'],
    'General Parts': ['spare+part', 'repair', 'replacement+part', 'fix', 'gears', 'knob']
}

HOBBY_QUERIES = {
    'Tabletop': ['dnd', 'warhammer', 'miniature', 'terrain', 'pathfinder'],
    'Games': ['minecraft', 'pokemon', 'zelda', 'star+wars', 'cosplay', 'mario'],
    'Toys': ['toy', 'puzzle', 'action+figure', 'lego'],
    'Home': ['decoration', 'vase', 'art', 'jewelry', 'sculpture']
}

def is_joke(name, description):
    text = (name + " " + (description or "")).lower()
    for word in JOKE_KEYWORDS:
        if word in text:
            return True
    return False

def estimate_volume(name):
    name_l = name.lower()
    if any(x in name_l for x in ['small', 'tiny', 'knob', 'button', 'clip', 'gear']):
        return round(random.uniform(2, 10), 2)
    if any(x in name_l for x in ['large', 'big', 'housing', 'case', 'box', 'mount']):
        return round(random.uniform(80, 250), 2)
    return round(random.uniform(15, 60), 2)

def fetch_results(queries, mode, headers):
    models = {}
    for category, terms in queries.items():
        for term in terms:
            print(f"[{mode}] Searching '{category}' for: '{term}'...")
            for page in range(1, 4):
                url = f'{THINGIVERSE_API}/search/{term}?sort=relevant&per_page=40&page={page}'
                try:
                    response = requests.get(url, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                except Exception as e:
                    print(f"  - Error: {e}")
                    break

                hits = data.get('hits', [])
                if not hits:
                    break

                for item in hits:
                    if not item.get('preview_image'):
                        continue
                    
                    if is_joke(item['name'], item.get('description')):
                        continue

                    brand = None
                    if mode == 'spare-parts' and category != 'General Parts':
                        # Try to find brand in name, otherwise fallback to category
                        brand_found = False
                        for b in SPARE_PARTS_QUERIES.keys():
                            if b != 'General Parts' and b.lower() in item['name'].lower():
                                brand = b
                                brand_found = True
                                break
                        if not brand_found:
                            brand = category # Fallback

                    model_id = f"thingiverse_{item['id']}"
                    if model_id not in models:
                        models[model_id] = {
                            'objectID': model_id,
                            'name': item['name'],
                            'description': item.get('description', ''),
                            'brand': brand,
                            'category': category,
                            'mode': mode,
                            'source': 'thingiverse',
                            'source_url': item['public_url'],
                            'license': item.get('license'),
                            'author': item['creator']['name'] if item.get('creator') else 'Unknown',
                            'image': item['preview_image'],
                            'popularity': item.get('likes_count', 0),
                            'downloads': item.get('download_count', 0),
                            'stl_url': None,
                            'volume_cm3': estimate_volume(item['name']),
                            'indexed_at': datetime.now().isoformat()
                        }
    return models

def parse_thingiverse():
    headers = {'Authorization': f'Bearer {APP_TOKEN}'}

    spare_parts = fetch_results(SPARE_PARTS_QUERIES, 'spare-parts', headers)
    hobby_parts = fetch_results(HOBBY_QUERIES, 'hobby', headers)

    all_models = {**spare_parts, **hobby_parts}
    models_list = list(all_models.values())
    
    output_path = 'data/models-index.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(models_list, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(models_list)} total models to {output_path}")

if __name__ == '__main__':
    parse_thingiverse()
