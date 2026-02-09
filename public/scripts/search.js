// public/scripts/search.js

let currentQuery = '';
let currentBrand = '';
let currentMode = 'spare-parts'; // 'spare-parts' or 'hobby'
let currentPage = 1;

const SPARE_PARTS_BRANDS = ['Bosch', 'Dyson', 'Ikea', 'Samsung', 'LG', 'Whirlpool', 'Philips', 'Braun', 'Miele', 'Xiaomi', 'Electrolux'];
const HOBBY_BRANDS = ['Tabletop', 'Games', 'Toys', 'Home', 'Decor', 'Cosplay', 'Art'];

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

    resultsCount.textContent = `${totalResults.toLocaleString()} моделей`;

    if (!hits || hits.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
                <h3 style="font-size: 24px; margin-bottom: 12px;">Ничего не найдено</h3>
                <p style="color: var(--text-muted)">Попробуйте другой запрос или измените фильтры.</p>
                <button onclick="resetFilters()" style="margin-top: 24px; background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Сбросить всё</button>
            </div>
        `;
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
                    <span class="btn-card-action">Посмотреть →</span>
                    <div class="card-popularity">⭐ ${model.popularity || 0}</div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (window.openModelModal) window.openModelModal(model);
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

    // Prev
    if (currentPage > 1) {
        const p = document.createElement('button');
        p.className = 'page-btn'; p.textContent = '←';
        p.onclick = () => searchModels(currentQuery, currentBrand, currentPage - 1);
        container.appendChild(p);
    }

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            searchModels(currentQuery, currentBrand, i);
            document.getElementById('models-section').scrollIntoView({ behavior: 'smooth' });
        });
        container.appendChild(btn);
    }

    // Next
    if (currentPage < totalPages) {
        const n = document.createElement('button');
        n.className = 'page-btn'; n.textContent = '→';
        n.onclick = () => searchModels(currentQuery, currentBrand, currentPage + 1);
        container.appendChild(n);
    }
}

function updateBrandFilters() {
    const container = document.getElementById('brand-filters');
    if (!container) return;
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

window.resetFilters = function() {
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    searchModels('', '');
    updateBrandFilters();
};

function switchMode(mode) {
    currentMode = mode;
    document.body.className = mode + '-mode';

    // Update active buttons in UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');
    const catalogTitle = document.getElementById('catalog-title');

    if (mode === 'hobby') {
        mainTitle.innerHTML = 'Создавайте <span class="text-gradient">шедевры</span> сами';
        mainSubtitle.textContent = 'Тысячи моделей для хобби, игр и декора. От настольных миниатюр до интерьерных решений.';
        catalogTitle.textContent = 'Каталог хобби-моделей';
    } else {
        mainTitle.innerHTML = 'Найдите деталь, которую <span class="text-gradient">нельзя купить</span>';
        mainSubtitle.textContent = 'Крупнейшая база 3D-моделей для ремонта бытовой техники. Скачайте файл и распечатайте деталь сами.';
        catalogTitle.textContent = 'Каталог запчастей';
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

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => searchModels(searchInput.value, ''));
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });
    }

    // Mode Switch UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
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
