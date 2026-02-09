// public/scripts/search.js

let currentQuery = '';
let currentBrand = '';
let currentMode = 'spare-parts'; // 'spare-parts' or 'hobby'
let currentPage = 1;

const SPARE_PARTS_BRANDS = ['Bosch', 'Dyson', 'Ikea', 'Samsung', 'LG', 'Whirlpool', 'Philips', 'Braun', 'Miele', 'Xiaomi', 'Electrolux'];
const HOBBY_BRANDS = ['Tabletop', 'Games', 'Toys', 'Home', 'Decor', 'Cosplay'];

async function searchModels(query = '', brand = '', page = 1) {
    const grid = document.getElementById('models-grid');
    grid.innerHTML = '<div class="card-skeleton"></div>'.repeat(8);

    currentQuery = query;
    currentBrand = brand;
    currentPage = page;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&brand=${encodeURIComponent(brand)}&mode=${currentMode}&page=${page}&per_page=12`);
        const data = await response.json();
        renderResults(data);
    } catch (error) {
        console.error('Search error:', error);
        grid.innerHTML = '<p class="error">Ошибка загрузки моделей. Пожалуйста, попробуйте позже.</p>';
    }
}

function renderResults({ hits, totalPages, currentPage, totalResults }) {
    const grid = document.getElementById('models-grid');
    const resultsCount = document.getElementById('results-count');
    grid.innerHTML = '';

    resultsCount.textContent = `${totalResults} моделей`;

    if (!hits || hits.length === 0) {
        grid.innerHTML = '<div class="no-results"><h3>Ничего не найдено</h3><p>Попробуйте изменить запрос или сбросить фильтры.</p></div>';
        document.getElementById('pagination-container').innerHTML = '';
        return;
    }

    hits.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.innerHTML = `
            <div class="card-image">
                <img src="${model.image || 'https://via.placeholder.com/400x300?text=FixIt3D'}" alt="${model.name}" loading="lazy" referrerpolicy="no-referrer">
                ${model.brand ? `<span class="card-badge">${model.brand}</span>` : ''}
            </div>
            <div class="card-body">
                <h3>${model.name}</h3>
                <p class="card-author">От ${model.author}</p>
                <div class="card-footer">
                    <span class="btn-card-action">Подробнее →</span>
                    <div class="card-popularity">⭐ ${model.popularity || 0}</div>
                </div>
            </div>
        `;

        // Make the whole card clickable
        card.addEventListener('click', () => {
            window.openModelModal(model);
        });

        grid.appendChild(card);
    });

    renderPagination(totalPages, currentPage);
}

function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination-container');
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchModels(currentQuery, currentBrand, i);
            document.getElementById('models-section').scrollIntoView({ behavior: 'smooth' });
        });
        container.appendChild(btn);
    }
}

function updateBrandFilters() {
    const container = document.getElementById('brand-filters');
    container.innerHTML = '<button class="filter-chip active" data-brand="">Все</button>';

    const brands = currentMode === 'spare-parts' ? SPARE_PARTS_BRANDS : HOBBY_BRANDS;

    brands.forEach(brand => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip';
        btn.setAttribute('data-brand', brand);
        btn.textContent = brand;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            searchModels(currentQuery, brand);
        });
        container.appendChild(btn);
    });
}

function switchMode(isHobby) {
    currentMode = isHobby ? 'hobby' : 'spare-parts';
    document.body.className = isHobby ? 'hobby-mode' : 'spare-parts-mode';

    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');
    const catalogTitle = document.getElementById('catalog-title');

    if (isHobby) {
        mainTitle.innerHTML = 'Создавайте <span class="text-gradient">шедевры</span> сами';
        mainSubtitle.textContent = 'Тысячи моделей для хобби, игр и декора. От настольных миниатюр до интерьерных решений.';
        catalogTitle.textContent = 'Топ моделей для хобби';
    } else {
        mainTitle.innerHTML = 'Найдите деталь, которую <span class="text-gradient">нельзя купить</span>';
        mainSubtitle.textContent = 'База из 5000+ 3D-моделей для ремонта бытовой техники и электроники. Печатайте сами или заказывайте у мастеров.';
        catalogTitle.textContent = 'Популярные запчасти';
    }

    currentBrand = '';
    updateBrandFilters();
    searchModels('', '');
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    updateBrandFilters();
    searchModels();

    // Search inputs
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchBtn.addEventListener('click', () => searchModels(searchInput.value, ''));
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });

    // Mode Toggle
    const modeToggle = document.getElementById('mode-toggle');
    modeToggle.addEventListener('change', () => {
        switchMode(modeToggle.checked);
    });

    // Tag clicks
    document.querySelectorAll('.search-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput.value = tag.textContent;
            searchModels(tag.textContent, '');
        });
    });
});
