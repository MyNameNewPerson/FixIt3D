// public/scripts/search.js

let currentQuery = '';
let currentBrand = '';
let currentMode = 'spare-parts';

const SPARE_PARTS_BRANDS = ['Bosch', 'Dyson', 'Ikea', 'Samsung', 'LG', 'Whirlpool', 'Philips', 'Braun', 'Miele', 'Xiaomi', 'Electrolux', 'Indesit', 'Kenwood', 'Moulinex'];
const HOBBY_BRANDS = ['Tabletop', 'Games', 'Toys', 'Home'];

async function searchModels(query = '', brand = '', page = 1) {
    const grid = document.getElementById('models-grid');
    grid.innerHTML = '<div class="skeleton-v2"></div>'.repeat(8);

    currentQuery = query;
    currentBrand = brand;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&brand=${encodeURIComponent(brand)}&mode=${currentMode}&page=${page}&per_page=16`);
        const data = await response.json();
        renderResults(data);
    } catch (error) {
        console.error('Search error:', error);
        grid.innerHTML = '<p class="error">Ошибка загрузки моделей.</p>';
    }
}

function renderResults({ hits, totalPages, currentPage, totalResults }) {
    const grid = document.getElementById('models-grid');
    const resultsHeader = document.getElementById('results-count');
    grid.innerHTML = '';

    resultsHeader.textContent = currentMode === 'spare-parts' ? `Найдено запчастей: ${totalResults}` : `Найдено моделей: ${totalResults}`;

    if (!hits || hits.length === 0) {
        grid.innerHTML = '<p class="no-results">Ничего не найдено. Попробуйте другой запрос.</p>';
        document.getElementById('pagination-container').innerHTML = '';
        return;
    }

    hits.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card-v2';
        card.innerHTML = `
            <div class="card-img-v2">
                <img src="${model.image || 'https://via.placeholder.com/400x300?text=FixIt3D'}" alt="${model.name}" loading="lazy">
                ${model.brand ? `<span class="card-badge-v2">${model.brand}</span>` : ''}
            </div>
            <div class="card-content-v2">
                <h3>${model.name}</h3>
                <p class="card-author-v2">От ${model.author}</p>
                <div class="card-footer-v2">
                    <button class="btn-view-v2" data-id="${model.objectID}">Открыть</button>
                    <div class="card-popularity">⭐ ${model.popularity || 0}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    document.querySelectorAll('.btn-view-v2').forEach(btn => {
        btn.addEventListener('click', () => {
            const model = hits.find(h => h.objectID === btn.dataset.id);
            window.openModelModal(model);
        });
    });

    renderPagination(totalPages, currentPage);
}

function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination-container');
    container.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn-v2 ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            searchModels(currentQuery, currentBrand, i);
            document.getElementById('models').scrollIntoView({ behavior: 'smooth' });
        });
        container.appendChild(btn);
    }
}

function updateFilters() {
    const container = document.getElementById('brand-filters');
    container.innerHTML = '<button class="filter-chip active" data-brand="">Все бренды</button>';

    const brands = currentMode === 'spare-parts' ? SPARE_PARTS_BRANDS : HOBBY_BRANDS;

    brands.forEach(brand => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip';
        btn.setAttribute('data-brand', brand);
        btn.textContent = brand;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            searchModels(currentQuery, brand);
        });
        container.appendChild(btn);
    });
}

function switchMode(mode) {
    currentMode = mode;
    currentBrand = '';

    const title = document.getElementById('hero-title');
    const subtitle = document.getElementById('hero-subtitle');
    
    if (mode === 'spare-parts') {
        title.textContent = 'Верните технику к жизни с помощью 3D-печати';
        subtitle.textContent = 'Более 3000 проверенных моделей для ремонта и вашего творчества.';
    } else {
        title.textContent = 'Мир 3D-моделей для вашего хобби';
        subtitle.textContent = 'Фигурки, аксессуары и декор для ваших проектов.';
    }

    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    updateFilters();
    searchModels('', '');
}

document.addEventListener('DOMContentLoaded', () => {
    updateFilters();
    searchModels();

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchBtn.addEventListener('click', () => searchModels(searchInput.value, ''));
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });

    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });
});
