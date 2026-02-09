import requests
import json
from datetime import datetime
import os

# --- Ваши учетные данные ---
CLIENT_ID = "715eaf8d906e33fd03a8"
CLIENT_SECRET = "2ea12c3007691d5e4118e64df9f6814f"
APP_TOKEN = "53dba3cff3fbbf0506e34d7fa855f40e"
# -------------------------

THINGIVERSE_API = 'https://api.thingiverse.com'

# Структура: 'Категория': ['поисковый запрос 1', 'запрос 2', ...]
SEARCH_CATEGORIES = {
    'Bosch': ['Bosch+spare+part', 'Bosch+repair'],
    'Dyson': ['Dyson+spare+part', 'Dyson+repair'],
    'Ikea': ['Ikea+spare+part', 'Ikea+repair'],
    'Samsung': ['Samsung+spare+part', 'Samsung+repair'],
    'LG': ['LG+spare+part', 'LG+repair'],
    'Whirlpool': ['Whirlpool+spare+part', 'Whirlpool+repair'],
    'Philips': ['Philips+spare+part', 'Philips+repair'],
    'Braun': ['Braun+spare+part', 'Braun+repair'],
    'Miele': ['Miele+spare+part', 'Miele+repair'],
    'General Parts': ['spare+part', 'repair', 'replacement+part', 'fix']
}

def parse_thingiverse():
    """
    Ищет на Thingiverse модели по категориям и сохраняет их.
    """
    all_models = {}  # Используем словарь для автоматического удаления дубликатов по ID
    
    headers = {
        'Authorization': f'Bearer {APP_TOKEN}'
    }
    
    for category, terms in SEARCH_CATEGORIES.items():
        for term in terms:
            print(f"Ищем в категории '{category}' по запросу: '{term}'...")
            
            for page in range(1, 6): # Fetch 5 pages
                print(f"  - Загружаем страницу {page}...")
                url = f'{THINGIVERSE_API}/search/{term}?sort=relevant&per_page=40&page={page}'
                
                try:
                    response = requests.get(url, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                except requests.exceptions.RequestException as e:
                    print(f"  - Ошибка при запросе: {e}")
                    break 

                if not data.get('hits'):
                    print("  - На этой странице моделей нет, завершаем.")
                    break

                for item in data.get('hits', []):
                    if not item.get('preview_image'):
                        continue
                    
                    model_id = f"thingiverse_{item['id']}"
                    
                    if model_id not in all_models:
                        all_models[model_id] = {
                            'objectID': model_id,
                            'name': item['name'],
                            'description': item.get('description', ''),
                            'brand': category if category != 'General Parts' else None,
                            'category': category,
                            'source': 'thingiverse',
                            'source_url': item['public_url'],
                            'license': item.get('license'),
                            'author': item['creator']['name'] if item.get('creator') else 'Unknown',
                            'image': item['preview_image'],
                            'popularity': item.get('likes_count', 0),
                            'downloads': item.get('download_count', 0),
                            'stl_url': None,
                            'volume_cm3': None,
                            'indexed_at': datetime.now().isoformat()
                        }

    models_list = list(all_models.values())
    
    output_path = 'data/models-index.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(models_list, f, ensure_ascii=False, indent=2)

    print(f"Найдено и сохранено {len(models_list)} уникальных моделей в {output_path}")

if __name__ == '__main__':
    parse_thingiverse()
