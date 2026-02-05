import requests
import json
from datetime import datetime
import os
import numpy
from stl import mesh

# Required dependencies:
# pip install requests numpy numpy-stl

PRINTABLES_API = 'https://api.printables.com/graphql'

QUERY = '''
query GetRepairModels($offset: Int!) {
  prints(
    tags: ["spare-part", "repair", "replacement"],
    licenseType: COMMERCIAL_USE_ALLOWED,
    limit: 100,
    offset: $offset,
    ordering: "-likes_count"
  ) {
    id
    name
    summary
    slug
    likesCount
    downloadsCount
    license {
      name
      url
    }
    images {
      filePath
    }
    user {
      publicUsername
    }
    stlFiles {
      url
    }
  }
}
'''

def get_stl_volume(stl_url):
    """Downloads an STL file and calculates its volume in cm³."""
    if not stl_url:
        return None
    try:
        # Download the file
        response = requests.get(stl_url, timeout=20)
        response.raise_for_status()
        
        # Load the STL from memory
        stl_mesh = mesh.Mesh.from_buffer(response.content)
        
        # Calculate volume and convert from mm³ to cm³
        volume_cm3 = stl_mesh.get_mass_properties()[0] / 1000
        
        # A basic sanity check for volume
        if volume_cm3 <= 0 or volume_cm3 > 50000:
             return None

        return round(volume_cm3, 2)
    except Exception as e:
        print(f"  - Could not calculate volume for {stl_url}. Error: {e}")
        return None

def extract_brand(name):
    """Извлекает бренд из названия модели"""
    brands = ['bosch', 'dyson', 'ikea', 'samsung', 'lg', 'whirlpool', 'philips', 'braun', 'miele']
    name_lower = name.lower()
    
    for brand in brands:
        if brand in name_lower:
            return brand.capitalize()
    
    return None

def parse_printables():
    all_models = []
    offset = 0
    
    while offset < 200:  # Reduced limit for demo purposes
        try:
            response = requests.post(PRINTABLES_API, json={
                'query': QUERY,
                'variables': {'offset': offset}
            })
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error fetching from Printables: {e}")
            break

        prints = data.get('data', {}).get('prints', [])
        
        if not prints:
            break
            
        for print_obj in prints:
            print(f"Processing: {print_obj['name']}")
            # Фильтр: минимум 10 лайков
            if print_obj.get('likesCount', 0) < 10:
                continue
            
            stl_url = print_obj['stlFiles'][0]['url'] if print_obj['stlFiles'] else None
            volume = get_stl_volume(stl_url)

            # Skip model if we couldn't get a valid volume
            if volume is None:
                print("  - Skipping, no valid volume.")
                continue

            brand = extract_brand(print_obj['name'])
            
            model = {
                'objectID': f"printables_{print_obj['id']}",
                'name': print_obj['name'],
                'description': print_obj['summary'],
                'brand': brand,
                'source': 'printables',
                'source_url': f"https://www.printables.com/model/{print_obj['slug']}",
                'license': print_obj['license']['name'],
                'author': print_obj['user']['publicUsername'],
                'image': print_obj['images'][0]['filePath'] if print_obj['images'] else None,
                'popularity': print_obj['likesCount'],
                'downloads': print_obj['downloadsCount'],
                'stl_url': stl_url,
                'volume_cm3': volume,
                'indexed_at': datetime.now().isoformat()
            }
            
            all_models.append(model)
        
        offset += 100
        print(f"Обработано: {offset} моделей")
    
    # Сохраняем локально
    with open('data/models-index.json', 'w', encoding='utf-8') as f:
        json.dump(all_models, f, ensure_ascii=False, indent=2)

    print(f"✅ Обработано {len(all_models)} моделей")

if __name__ == '__main__':
    parse_printables()
