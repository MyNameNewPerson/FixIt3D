// public/scripts/search.js

let currentQuery = '';
let currentBrand = '';

async function searchModels(query = '', brand = '', page = 1) {
    const grid = document.getElementById('models-grid');
    grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(6); // Show more skeletons

    currentQuery = query;
    currentBrand = brand;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&brand=${encodeURIComponent(brand)}&page=${page}&per_page=18`);
        const data = await response.json();
        renderResults(data);
        
        // Плавная прокрутка к сетке с моделями
        if (page > 1) { // Прокручиваем только при смене страницы, а не при первой загрузке
            document.getElementById('models-grid').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Search error:', error);
        grid.innerHTML = '<p class="error">Ошибка загрузки моделей. Попробуйте позже.</p>';
    }
}

function renderResults({ hits, totalPages, currentPage, totalResults }) {
    const grid = document.getElementById('models-grid');
    const resultsHeader = document.querySelector('.section-header h2');
    grid.innerHTML = '';

    resultsHeader.textContent = `Найдено моделей: ${totalResults || 0}`;

    if (!hits || hits.length === 0) {
        grid.innerHTML = '<p class="no-results">Модели не найдены. Попробуйте другой запрос.</p>';
        document.getElementById('pagination-container').innerHTML = ''; // Clear pagination
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
                    <div class="popularity">⭐ ${model.popularity || 0}</div>
                    <button class="btn-primary view-btn" data-id="${model.objectID}">Посмотреть</button>
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

    const createPageLink = (page, text, disabled = false, active = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = text;
        if (!disabled) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                searchModels(currentQuery, currentBrand, page);
            });
        }
        li.appendChild(a);
        return li;
    };

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Previous button
    ul.appendChild(createPageLink(currentPage - 1, '‹', currentPage === 1));

    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if(endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        ul.appendChild(createPageLink(1, '1'));
        if(startPage > 2) ul.appendChild(createPageLink(0, '...', true));
    }

    for (let i = startPage; i <= endPage; i++) {
        ul.appendChild(createPageLink(i, i, false, i === currentPage));
    }
    
    if (endPage < totalPages) {
        if(endPage < totalPages - 1) ul.appendChild(createPageLink(0, '...', true));
        ul.appendChild(createPageLink(totalPages, totalPages));
    }

    // Next button
    ul.appendChild(createPageLink(currentPage + 1, '›', currentPage === totalPages));

    container.appendChild(ul);
}


// Initial search
document.addEventListener('DOMContentLoaded', () => {
    searchModels();

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchBtn.addEventListener('click', () => {
        searchModels(searchInput.value, ''); // Reset brand on new text search
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-brand=""]').classList.add('active');
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const brand = btn.getAttribute('data-brand');
            searchModels(searchInput.value, brand);
        });
    });
});
