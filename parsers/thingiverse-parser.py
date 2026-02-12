import requests
import json
from datetime import datetime
import os
import random
import sys
import time

# --- Credentials ---
APP_TOKEN = os.environ.get("THINGIVERSE_TOKEN", "53dba3cff3fbbf0506e34d7fa855f40e")
THINGIVERSE_API = 'https://api.thingiverse.com'

JOKE_KEYWORDS = [
    "joke", "meme", "funny", "gag", "prank", "fake", "parody", "satire", "ironic", "not real", "fake part",
    "keychain", "logo", "decoration", "figurine", "statue", "ornament", "fan art", "toy", "miniature", "sign",
    "display", "stand", "desktop", "accessory", "charm", "pendant", "wall art", "poster", "non-functional"
]

FUNCTIONAL_KEYWORDS = [
    "gear", "knob", "handle", "bracket", "clip", "button", "lever", "mount", "adapter", "joint", "wheel",
    "shaft", "seal", "gasket", "spring", "latch", "hinge", "cap", "plug", "cover", "base", "housing", "shell",
    "replacement", "repair", "fix", "part", "impeller", "pulley", "bushing", "nozzle"
]

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
    'Kenwood': ['Kenwood+spare+part', 'Kenwood+repair'],
    'KitchenAid': ['KitchenAid+spare+part', 'KitchenAid+repair'],
    'DeLonghi': ['DeLonghi+spare+part', 'DeLonghi+repair'],
    'Tefal': ['Tefal+spare+part', 'Tefal+repair'],
    'Beko': ['Beko+spare+part', 'Beko+repair'],
    'General Parts': ['spare+part', 'repair', 'replacement+part', 'fix']
}

HOBBY_QUERIES = {
    'Tabletop': ['dnd', 'warhammer', 'miniature', 'terrain'],
    'Games': ['minecraft', 'pokemon', 'zelda', 'star+wars'],
    'Toys': ['toy', 'puzzle', 'lego'],
    'Decor': ['decoration', 'vase', 'art']
}

AUTO_QUERIES = {
    'Toyota': ['Toyota+part', 'Toyota+accessory'],
    'BMW': ['BMW+part', 'BMW+accessory'],
    'Mercedes': ['Mercedes+part', 'Mercedes+repair'],
    'Audi': ['Audi+part', 'Audi+repair'],
    'Volkswagen': ['VW+part', 'VW+repair'],
    'Tesla': ['Tesla+part', 'Tesla+accessory'],
    'Accessories': ['car+holder', 'cupholder', 'key+fob']
}

HOME_QUERIES = {
    'Makita': ['Makita+spare+part', 'Makita+repair'],
    'Karcher': ['Karcher+spare+part', 'Karcher+repair'],
    'DeWalt': ['DeWalt+part', 'DeWalt+adapter'],
    'Garden': ['garden+tool', 'hose+connector'],
    'Kitchen': ['organizer', 'hook', 'shelf']
}

def is_joke(name, description, mode):
    text = (name + " " + (description or "")).lower()
    for word in JOKE_KEYWORDS:
        if word in text:
            return True
    if mode == 'spare-parts':
        brands = ['bosch', 'dyson', 'samsung', 'lg', 'whirlpool', 'miele', 'ikea', 'kitchenaid']
        if any(b in text for b in brands):
            if not any(fk in text for fk in FUNCTIONAL_KEYWORDS):
                return True
    return False

def estimate_volume(name):
    name_l = name.lower()
    if any(x in name_l for x in ['small', 'tiny', 'knob', 'button', 'clip', 'gear']):
        return round(random.uniform(2, 10), 2)
    if any(x in name_l for x in ['large', 'big', 'housing', 'case', 'box', 'mount']):
        return round(random.uniform(80, 250), 2)
    return round(random.uniform(15, 60), 2)

def fetch_results(queries, mode, headers, existing_ids, max_pages=1, sort='relevant'):
    models = {}
    for category, terms in queries.items():
        for term in terms:
            print(f"[{mode}] Searching '{category}' for: '{term}' (sort={sort})...")
            for page in range(1, max_pages + 1):
                url = f'{THINGIVERSE_API}/search/{term}?sort={sort}&per_page=40&page={page}'
                try:
                    response = requests.get(url, headers=headers, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                except Exception as e:
                    print(f"  - Error: {e}")
                    break

                hits = data.get('hits', [])
                if not hits: break

                found_new_on_page = False
                hit_existing = False
                for item in hits:
                    model_id = f"thingiverse_{item['id']}"
                    
                    if model_id in existing_ids:
                        if sort == 'newest':
                            hit_existing = True
                            # In newest sort, once we hit an existing ID, we can stop this term entirely
                        continue

                    if not item.get('preview_image'): continue
                    if is_joke(item['name'], item.get('description'), mode): continue

                    brand = None
                    if mode == 'spare-parts' and category != 'General Parts':
                        for b in SPARE_PARTS_QUERIES.keys():
                            if b != 'General Parts' and b.lower() in item['name'].lower():
                                brand = b
                                break
                        if not brand: brand = category

                    found_new_on_page = True
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
                        'stl_url': None, # To be fetched lazily
                        'volume_cm3': estimate_volume(item['name']),
                        'indexed_at': datetime.now().isoformat()
                    }

                if hit_existing and sort == 'newest':
                    print(f"  - Hit existing model, stopping search for '{term}'")
                    break

                if not found_new_on_page and max_pages == 1:
                    break

            # Rate limiting friendly delay
            time.sleep(0.5)

    return models

def parse_thingiverse():
    is_full = '--full' in sys.argv
    is_initial = '--initial' in sys.argv

    # Logic:
    # - Initial: Relevant sort, multiple pages
    # - Update: Newest sort, stop when existing hit
    sort = 'relevant' if (is_initial or is_full) else 'newest'
    max_pages = 5 if (is_initial or is_full) else 1

    headers = {'Authorization': f'Bearer {APP_TOKEN}'}
    output_path = 'data/models-index.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    existing_models = {}
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for m in data:
                    existing_models[m['objectID']] = m
            print(f"Loaded {len(existing_models)} existing models.")
        except Exception as e:
            print(f"Error loading existing models: {e}")

    existing_ids = set(existing_models.keys())

    all_new_models = {}
    for queries, mode in [
        (SPARE_PARTS_QUERIES, 'spare-parts'),
        (HOBBY_QUERIES, 'hobby'),
        (AUTO_QUERIES, 'auto'),
        (HOME_QUERIES, 'home')
    ]:
        new_items = fetch_results(queries, mode, headers, existing_ids, max_pages=max_pages, sort=sort)
        all_new_models.update(new_items)

    new_count = 0
    for model_id, model_data in all_new_models.items():
        if model_id not in existing_models:
            existing_models[model_id] = model_data
            new_count += 1

    models_list = list(existing_models.values())
    # Always keep it sorted by popularity for the main view
    models_list.sort(key=lambda x: x.get('popularity', 0), reverse=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(models_list, f, ensure_ascii=False, indent=2)

    print(f"Update complete. Added {new_count} new models. Total: {len(models_list)}")

if __name__ == '__main__':
    parse_thingiverse()
