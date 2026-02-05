// public/scripts/search.js

async function searchModels(query = '', brand = '') {
    const grid = document.getElementById('models-grid');
    // Show skeletons
    grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(3);

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&brand=${encodeURIComponent(brand)}`);
        const data = await response.json();
        renderResults(data.hits);
    } catch (error) {
        console.error('Search error:', error);
        grid.innerHTML = '<p class="error">Ошибка загрузки моделей. Попробуйте позже.</p>';
    }
}

function renderResults(hits) {
    const grid = document.getElementById('models-grid');
    grid.innerHTML = '';

    if (!hits || hits.length === 0) {
        grid.innerHTML = '<p class="no-results">Модели не найдены. Попробуйте другой запрос.</p>';
        return;
    }

    hits.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.innerHTML = `
            <div class="model-card__image">
                <img src="${model.image || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${model.name}" loading="lazy">
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

    // Add event listeners to view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modelId = btn.getAttribute('data-id');
            const model = hits.find(h => h.objectID === modelId);
            window.openModelModal(model);
        });
    });
}

// Initial search
document.addEventListener('DOMContentLoaded', () => {
    searchModels();

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchBtn.addEventListener('click', () => {
        searchModels(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchModels(searchInput.value);
        }
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            searchModels(searchInput.value, btn.getAttribute('data-brand'));
        });
    });
});

export { searchModels };
