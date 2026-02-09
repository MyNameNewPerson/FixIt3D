// public/scripts/search.js

let currentQuery = '';
let currentBrand = '';
let currentMode = 'spare-parts';

const SPARE_PARTS_BRANDS = ['Bosch', 'Dyson', 'Ikea', 'Samsung', 'LG', 'Whirlpool', 'Philips', 'Braun', 'Miele', 'Xiaomi', 'Electrolux', 'Indesit', 'Kenwood', 'Moulinex'];
const HOBBY_BRANDS = ['Tabletop', 'Games', 'Toys', 'Home'];

async function searchModels(query = '', brand = '', page = 1) {
    const grid = document.getElementById('models-grid');
    grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(6);

    currentQuery = query;
    currentBrand = brand;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&brand=${encodeURIComponent(brand)}&mode=${currentMode}&page=${page}&per_page=18`);
        const data = await response.json();
        renderResults(data);
    } catch (error) {
        console.error('Search error:', error);
        grid.innerHTML = '<p class="error">Ошибка загрузки моделей. Попробуйте позже.</p>';
    }
}

function renderResults({ hits, totalPages, currentPage, totalResults }) {
    const grid = document.getElementById('models-grid');
    const resultsHeader = document.getElementById('results-count');
    grid.innerHTML = '';

    resultsHeader.textContent = `Найдено моделей: ${totalResults || 0}`;

    if (!hits || hits.length === 0) {
        grid.innerHTML = '<p class="no-results">Модели не найдены. Попробуйте другой запрос.</p>';
        document.getElementById('pagination-container').innerHTML = '';
        return;
    }

    hits.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.innerHTML = `
            <div class="model-card__image">
                <img src="${model.image || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${model.name}" loading="lazy">
                ${model.brand ? `<span class="brand-badge">${model.brand}</span>` : ''}
            </div>
            <div class="model-card__content">
                <h3>${model.name}</h3>
                <p class="author">От ${model.author}</p>
                <div class="model-card__footer">
                    <button class="btn-primary view-btn" data-id="${model.objectID}">Посмотреть</button>
                    <div class="popularity">⭐ ${model.popularity || 0}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modelId = btn.getAttribute('data-id');
            const model = hits.find(h => h.objectID === modelId);
            window.openModelModal(model);
        });
    });

    renderPagination(totalPages, currentPage);
}

function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination-container');
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Simplified pagination for space
    for (let i = 1; i <= totalPages; i++) {
        if (i > 10) break; // Limit pages
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#models';
        a.textContent = i;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            searchModels(currentQuery, currentBrand, i);
        });
        li.appendChild(a);
        ul.appendChild(li);
    }
    container.appendChild(ul);
}

function updateFilters() {
    const container = document.getElementById('brand-filters');
    container.innerHTML = '<button class="filter-btn active" data-brand="">Все</button>';

    const brands = currentMode === 'spare-parts' ? SPARE_PARTS_BRANDS : HOBBY_BRANDS;

    brands.forEach(brand => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.setAttribute('data-brand', brand);
        btn.textContent = brand;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            searchModels(currentQuery, brand);
        });
        container.appendChild(btn);
    });
}

function switchMode(mode) {
    currentMode = mode;
    currentBrand = '';

    // Update Hero text
    const title = document.getElementById('hero-title');
    const subtitle = document.getElementById('hero-subtitle');
    
    if (mode === 'spare-parts') {
        title.textContent = 'Найдите запчасть и вдохните жизнь в свои вещи';
        subtitle.textContent = 'База проверенных 3D-моделей для ремонта техники.';
    } else {
        title.textContent = 'Мир 3D-моделей для вашего хобби';
        subtitle.textContent = 'Фигурки, игры и декор для вашего творчества.';
    }

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    updateFilters();
    searchModels(currentQuery, '');
}

document.addEventListener('DOMContentLoaded', () => {
    updateFilters();
    searchModels();

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchBtn.addEventListener('click', () => {
        searchModels(searchInput.value, currentBrand);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });
});
