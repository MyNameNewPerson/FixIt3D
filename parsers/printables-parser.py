import requests
import json
from datetime import datetime
import os
import random

PRINTABLES_API = 'https://api.printables.com/graphql/'

JOKE_KEYWORDS = ["joke", "meme", "funny", "gag", "prank", "fake", "parody"]
BRANDS = ['Bosch', 'Dyson', 'Ikea', 'Samsung', 'LG', 'Whirlpool', 'Philips', 'Braun', 'Miele', 'Xiaomi', 'Electrolux', 'Indesit', 'Kenwood', 'Moulinex']
SPARE_KEYWORDS = ['repair', 'replacement', 'spare part', 'fix', 'gear', 'knob', 'mount', 'bracket', 'handle']
HOBBY_KEYWORDS = ['dnd', 'warhammer', 'miniature', 'terrain', 'minecraft', 'pokemon', 'zelda', 'star wars', 'cosplay', 'toy', 'puzzle', 'action figure', 'decoration', 'vase', 'art', 'jewelry']

QUERY = '''
query GetPopularModels($offset: Int!) {
  prints(
    limit: 100,
    offset: $offset
  ) {
    id
    name
    summary
    slug
    likesCount
    images {
      filePath
    }
    user {
      publicUsername
    }
  }
}
'''

def extract_brand(name):
    name_lower = name.lower()
    for brand in BRANDS:
        if brand.lower() in name_lower:
            return brand
    return None

def determine_mode(name, summary):
    text = (name + " " + (summary or "")).lower()
    for word in JOKE_KEYWORDS:
        if word in text: return "joke"
    for word in SPARE_KEYWORDS:
        if word in text: return "spare-parts"
    for word in HOBBY_KEYWORDS:
        if word in text: return "hobby"
    return "other"

def estimate_volume(name):
    name_l = name.lower()
    if any(x in name_l for x in ['small', 'tiny', 'knob', 'button', 'clip', 'gear']):
        return round(random.uniform(2, 10), 2)
    if any(x in name_l for x in ['large', 'big', 'housing', 'case', 'box', 'mount']):
        return round(random.uniform(80, 250), 2)
    return round(random.uniform(15, 60), 2)

def parse_printables():
    all_models = {}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
    }
    
    offset = 0
    while offset < 300:
        try:
            response = requests.post(PRINTABLES_API, json={
                'query': QUERY,
                'variables': {'offset': offset}
            }, headers=headers)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error fetching from Printables: {e}")
            break

        prints = data.get('data', {}).get('prints', [])
        if not prints: break
            
        for p in prints:
            mode = determine_mode(p['name'], p['summary'])
            if mode == "joke": continue
            
            brand = extract_brand(p['name'])
            if mode == "other":
                if brand: mode = "spare-parts"
                else: continue
            
            model_id = f"printables_{p['id']}"
            all_models[model_id] = {
                'objectID': model_id,
                'name': p['name'],
                'description': p['summary'],
                'brand': brand,
                'mode': mode,
                'source': 'printables',
                'source_url': f"https://www.printables.com/model/{p['slug']}",
                'license': 'Unknown',
                'author': p['user']['publicUsername'] if p.get('user') else 'Unknown',
                'image': p['images'][0]['filePath'] if p['images'] else None,
                'popularity': p.get('likesCount', 0),
                'downloads': 0,
                'stl_url': None,
                'volume_cm3': estimate_volume(p['name']),
                'indexed_at': datetime.now().isoformat()
            }
        offset += 100
    
    output_path = 'data/models-index.json'
    existing_models = []
    if os.path.exists(output_path):
        with open(output_path, 'r', encoding='utf-8') as f:
            try: existing_models = json.load(f)
            except: pass

    model_dict = {m['objectID']: m for m in existing_models}
    for m in all_models.values():
        model_dict[m['objectID']] = m

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(list(model_dict.values()), f, ensure_ascii=False, indent=2)

    print(f"Saved {len(model_dict)} total models to {output_path}")

if __name__ == '__main__':
    parse_printables()
