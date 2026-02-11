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

JOKE_KEYWORDS = [
    "joke", "meme", "funny", "gag", "prank", "fake", "parody", "satire", "ironic", "not real", "fake part",
    "keychain", "logo", "decoration", "figurine", "statue", "ornament", "fan art", "toy", "miniature", "sign",
    "display", "stand", "desktop", "accessory", "charm", "pendant", "wall art", "poster", "non-functional",
    "figurine", "statue", "toy", "action figure", "decoration"
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
    'Indesit': ['Indesit+spare+part', 'Indesit+repair'],
    'Kenwood': ['Kenwood+spare+part', 'Kenwood+repair'],
    'Moulinex': ['Moulinex+spare+part', 'Moulinex+repair'],
    'KitchenAid': ['KitchenAid+spare+part', 'KitchenAid+repair'],
    'Bork': ['Bork+spare+part', 'Bork+repair'],
    'DeLonghi': ['DeLonghi+spare+part', 'DeLonghi+repair'],
    'Tefal': ['Tefal+spare+part', 'Tefal+repair'],
    'Rowenta': ['Rowenta+spare+part', 'Rowenta+repair'],
    'Beko': ['Beko+spare+part', 'Beko+repair'],
    'General Parts': ['spare+part', 'repair', 'replacement+part', 'fix', 'gears', 'knob', 'button', 'handle', 'bracket']
}

HOBBY_QUERIES = {
    'Tabletop': ['dnd', 'warhammer', 'miniature', 'terrain', 'pathfinder'],
    'Games': ['minecraft', 'pokemon', 'zelda', 'star+wars', 'cosplay', 'mario'],
    'Toys': ['toy', 'puzzle', 'action+figure', 'lego'],
    'Decor': ['decoration', 'vase', 'art', 'jewelry', 'sculpture']
}

AUTO_QUERIES = {
    'Toyota': ['Toyota+part', 'Toyota+accessory', 'Toyota+repair'],
    'BMW': ['BMW+part', 'BMW+accessory', 'BMW+repair'],
    'Mercedes': ['Mercedes+part', 'Mercedes+repair'],
    'Audi': ['Audi+part', 'Audi+repair'],
    'Volkswagen': ['VW+part', 'VW+repair'],
    'Tesla': ['Tesla+part', 'Tesla+accessory'],
    'Accessories': ['car+holder', 'cupholder', 'key+fob', 'clip', 'car+interior']
}

HOME_QUERIES = {
    'Makita': ['Makita+spare+part', 'Makita+repair', 'Makita+adapter'],
    'Karcher': ['Karcher+spare+part', 'Karcher+repair', 'Karcher+nozzle'],
    'DeWalt': ['DeWalt+part', 'DeWalt+adapter'],
    'Garden': ['garden+tool', 'hose+connector', 'irrigation'],
    'Kitchen': ['organizer', 'hook', 'shelf', 'drainer']
}

def is_joke(name, description, mode):
    text = (name + " " + (description or "")).lower()

    # Check for joke keywords
    for word in JOKE_KEYWORDS:
        if word in text:
            return True
    
    # Mode-specific strict filtering
    if mode == 'spare-parts':
        # If it contains a major brand name but NO functional keywords, it's likely decoration
        brands = ['bosch', 'dyson', 'samsung', 'lg', 'whirlpool', 'miele', 'ikea', 'kitchenaid']
        contains_brand = any(b in text for b in brands)

        if contains_brand:
            has_functional = any(fk in text for fk in FUNCTIONAL_KEYWORDS)
            if not has_functional:
                return True # Decoration/Logo/Sign

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
                    
                    if is_joke(item['name'], item.get('description'), mode):
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
    output_path = 'public/data/models-index.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Load existing models to avoid duplicates and implement incremental updates
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

    # Fetch results
    spare_parts = fetch_results(SPARE_PARTS_QUERIES, 'spare-parts', headers)
    hobby_parts = fetch_results(HOBBY_QUERIES, 'hobby', headers)
    auto_parts = fetch_results(AUTO_QUERIES, 'auto', headers)
    home_parts = fetch_results(HOME_QUERIES, 'home', headers)

    # Update existing models with new ones
    new_count = 0
    for category_data in [spare_parts, hobby_parts, auto_parts, home_parts]:
        for model_id, model_data in category_data.items():
            if model_id not in existing_models:
                existing_models[model_id] = model_data
                new_count += 1

    models_list = list(existing_models.values())

    # Sort by popularity or date if needed
    models_list.sort(key=lambda x: x.get('popularity', 0), reverse=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(models_list, f, ensure_ascii=False, indent=2)

    print(f"Update complete. Added {new_count} new models. Total: {len(models_list)}")

if __name__ == '__main__':
    parse_thingiverse()
