// public/scripts/search.js
import { getTranslation, getCurrentLanguage, setLanguage } from './i18n.js';

let currentQuery = '';
let currentBrand = '';
let currentMode = 'spare-parts'; // 'spare-parts', 'hobby', 'auto', 'home'
let currentPage = 1;

const SPARE_PARTS_BRANDS = ['Bosch', 'Dyson', 'Ikea', 'Samsung', 'LG', 'Whirlpool', 'Philips', 'Braun', 'Miele', 'Xiaomi', 'Electrolux', 'Indesit', 'Kenwood', 'Moulinex', 'KitchenAid', 'Bork', 'DeLonghi', 'Tefal', 'Rowenta', 'Beko'];
const HOBBY_BRANDS = ['Tabletop', 'Games', 'Toys', 'Decor', 'Cosplay', 'Art'];
const AUTO_BRANDS = ['Toyota', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Tesla', 'Accessories'];
const HOME_BRANDS = ['Makita', 'Karcher', 'DeWalt', 'Garden', 'Kitchen'];

async function searchModels(query = '', brand = '', page = 1) {
    const grid = document.getElementById('models-grid');
    if (!grid) return;
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
        grid.innerHTML = `<p class="error">${getTranslation('no-results')}</p>`;
    }
}

function renderResults({ hits, totalPages, currentPage, totalResults }) {
    const grid = document.getElementById('models-grid');
    const resultsCount = document.getElementById('results-count');
    if (!grid || !resultsCount) return;
    grid.innerHTML = '';

    resultsCount.textContent = getTranslation('results-count', { count: totalResults.toLocaleString() });

    const statsTotal = document.getElementById('stats-total');
    if (statsTotal && totalResults > 0 && !currentQuery && !currentBrand) {
        statsTotal.innerHTML = getTranslation('hero-stats', { count: totalResults.toLocaleString() });
    }

    if (!hits || hits.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>${getTranslation('no-results')}</h3>
                <p>${getTranslation('no-results-sub')}</p>
                <button id="reset-filters-btn" class="btn-reset">${getTranslation('reset-filters')}</button>
            </div>
        `;
        document.getElementById('reset-filters-btn')?.addEventListener('click', resetFilters);
        document.getElementById('pagination-container').innerHTML = '';
        return;
    }

    hits.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card';
        const fallbackImg = 'https://via.placeholder.com/400x300?text=Preview+Unavailable';

        card.innerHTML = `
            <div class="card-image">
                <img src="${model.image || fallbackImg}"
                     alt="${model.name}"
                     loading="lazy"
                     referrerpolicy="no-referrer"
                     onerror="this.src='${fallbackImg}'; this.onerror=null;">
                ${model.brand ? `<span class="card-badge">${model.brand}</span>` : ''}
            </div>
            <div class="card-body">
                <h3>${model.name}</h3>
                <p class="card-author">${getTranslation('modal-author')}: ${model.author}</p>
                <div class="card-footer">
                    <span class="btn-card-action">${getTranslation('view-details')}</span>
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
    if (!container) return;
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
    container.innerHTML = `<button class="filter-chip active" data-brand="">${getTranslation('all-brands')}</button>`;
    
    let brands = [];
    if (currentMode === 'spare-parts') brands = SPARE_PARTS_BRANDS;
    else if (currentMode === 'hobby') brands = HOBBY_BRANDS;
    else if (currentMode === 'auto') brands = AUTO_BRANDS;
    else if (currentMode === 'home') brands = HOME_BRANDS;

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

function updatePopularTags() {
    const container = document.getElementById('popular-tags');
    if (!container) return;

    const label = document.createElement('span');
    label.setAttribute('data-i18n', 'hero-popular');
    label.textContent = getTranslation('hero-popular');

    container.innerHTML = '';
    container.appendChild(label);

    let tags = [];
    if (currentMode === 'spare-parts') tags = ['Bosch', 'Dyson', getTranslation('tag-gear'), 'Samsung'];
    else if (currentMode === 'hobby') tags = ['D&D', 'Warhammer', 'Marvel', 'Pokemon'];
    else if (currentMode === 'auto') tags = ['Toyota', 'BMW', 'Tesla', 'Cupholder'];
    else if (currentMode === 'home') tags = ['Makita', 'Karcher', 'Hook', 'Organizer'];

    tags.forEach(t => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'search-tag';
        a.textContent = t;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const input = document.getElementById('search-input');
            if (input) {
                input.value = t;
                searchModels(t, '');
            }
        });
        container.appendChild(document.createTextNode(' '));
        container.appendChild(a);
    });
}

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
        if (mainTitle) mainTitle.innerHTML = getTranslation('hobby-hero-title');
        if (mainSubtitle) mainSubtitle.textContent = getTranslation('hobby-hero-subtitle');
        if (catalogTitle) catalogTitle.textContent = getTranslation('catalog-title-hobby');
    } else if (mode === 'auto') {
        if (mainTitle) mainTitle.innerHTML = getTranslation('auto-hero-title');
        if (mainSubtitle) mainSubtitle.textContent = getTranslation('auto-hero-subtitle');
        if (catalogTitle) catalogTitle.textContent = getTranslation('catalog-title-auto');
    } else if (mode === 'home') {
        if (mainTitle) mainTitle.innerHTML = getTranslation('home-hero-title');
        if (mainSubtitle) mainSubtitle.textContent = getTranslation('home-hero-subtitle');
        if (catalogTitle) catalogTitle.textContent = getTranslation('catalog-title-home');
    } else {
        if (mainTitle) mainTitle.innerHTML = getTranslation('hero-title');
        if (mainSubtitle) mainSubtitle.textContent = getTranslation('hero-subtitle');
        if (catalogTitle) catalogTitle.textContent = getTranslation('catalog-title-spare');
    }

    currentBrand = '';
    updatePopularTags();
    updateBrandFilters();
    searchModels('', '');
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    updatePopularTags();
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

    // Language Toggle
    const langToggleContainer = document.getElementById('lang-toggle-modern');
    if (langToggleContainer) {
        const updateLangUI = (lang) => {
            langToggleContainer.querySelectorAll('.lang-link').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });
        };

        updateLangUI(getCurrentLanguage());

        langToggleContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-link');
            if (btn) {
                const lang = btn.dataset.lang;
                setLanguage(lang);
                updateLangUI(lang);
            }
        });
    }
});

// Listen for language changes to refresh dynamic content
window.addEventListener('languageChanged', () => {
    searchModels(currentQuery, currentBrand, currentPage);
    updateBrandFilters();
    switchMode(currentMode);
});
