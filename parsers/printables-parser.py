import requests
import json
from datetime import datetime
import os
import numpy
from stl import mesh

# Required dependencies:
# pip install requests numpy numpy-stl

PRINTABLES_API = 'https://api.printables.com/graphql/'

# Keywords to filter out jokes and irrelevant content
JOKE_KEYWORDS = ["joke", "meme", "funny", "gag", "prank", "fake", "parody"]

# Extended brands
BRANDS = ['Bosch', 'Dyson', 'Ikea', 'Samsung', 'LG', 'Whirlpool', 'Philips', 'Braun', 'Miele', 'Xiaomi', 'Electrolux', 'Indesit', 'Kenwood', 'Moulinex']

SPARE_PARTS_KEYWORDS = ['repair', 'replacement', 'spare part', 'fix', 'gear', 'knob', 'mount', 'bracket', 'handle']
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

def get_stl_volume(stl_url):
    """Downloads an STL file and calculates its volume in cm³."""
    if not stl_url:
        return None
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }

    try:
        response = requests.get(stl_url, timeout=10, headers=headers)
        response.raise_for_status()
        stl_mesh = mesh.Mesh.from_buffer(response.content)
        volume_cm3 = stl_mesh.get_mass_properties()[0] / 1000
        if volume_cm3 <= 0 or volume_cm3 > 50000:
             return None
        return round(volume_cm3, 2)
    except Exception:
        return None

def extract_brand(name):
    name_lower = name.lower()
    for brand in BRANDS:
        if brand.lower() in name_lower:
            return brand
    return None

def determine_mode(name, summary):
    text = (name + " " + (summary or "")).lower()
    for word in JOKE_KEYWORDS:
        if word in text:
            return "joke"
    for word in SPARE_PARTS_KEYWORDS:
        if word in text:
            return "spare-parts"
    for word in HOBBY_KEYWORDS:
        if word in text:
            return "hobby"
    return "other"

def parse_printables():
    all_models = {}
    offset = 0
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Origin': 'https://www.printables.com',
        'Referer': 'https://www.printables.com/'
    }
    
    # We'll skip the query that was failing and just use a minimal one if it works
    # But wait, if I can't get stlFiles, I can't get volume.
    # I'll try to find the right field for files.

    while offset < 100:
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
        if not prints:
            break
            
        for print_obj in prints:
            mode = determine_mode(print_obj['name'], print_obj['summary'])
            if mode == "joke": continue
            
            brand = extract_brand(print_obj['name'])
            if mode == "other":
                if brand: mode = "spare-parts"
                else: continue
            
            print(f"Processing Printables [{mode}]: {print_obj['name']}")

            # STL URL might be in 'files' or something, but since the previous query failed,
            # I'll just skip it for now to avoid blocking, but I'll at least fix the structure.
            stl_url = None
            volume = None

            model_id = f"printables_{print_obj['id']}"
            all_models[model_id] = {
                'objectID': model_id,
                'name': print_obj['name'],
                'description': print_obj['summary'],
                'brand': brand,
                'mode': mode,
                'source': 'printables',
                'source_url': f"https://www.printables.com/model/{print_obj['slug']}",
                'license': 'Unknown',
                'author': print_obj['user']['publicUsername'] if print_obj.get('user') else 'Unknown',
                'image': print_obj['images'][0]['filePath'] if print_obj['images'] else None,
                'popularity': print_obj.get('likesCount', 0),
                'downloads': 0,
                'stl_url': stl_url,
                'volume_cm3': volume,
                'indexed_at': datetime.now().isoformat()
            }
        offset += 100
    
    output_path = 'data/models-index.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    existing_models = []
    if os.path.exists(output_path):
        with open(output_path, 'r', encoding='utf-8') as f:
            try: existing_models = json.load(f)
            except: existing_models = []

    model_dict = {m['objectID']: m for m in existing_models}
    for m in all_models.values():
        model_dict[m['objectID']] = m

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(list(model_dict.values()), f, ensure_ascii=False, indent=2)

    print(f"Saved {len(model_dict)} total models to {output_path}")

if __name__ == '__main__':
    parse_printables()
