// public/scripts/viewer.js

const modal = document.getElementById('model-modal');
const closeBtn = document.querySelector('.modal-close-v2');
const downloadBtn = document.getElementById('download-btn');

let currentModel = null;

window.openModelModal = function(model) {
    if (!model) return;
    currentModel = model;

    document.getElementById('modal-title').textContent = model.name;
    document.getElementById('modal-author').textContent = model.author;
    
    const viewer = document.getElementById('modal-viewer');
    const fallback = document.getElementById('modal-image-fallback');
    
    if (model.stl_url) {
        viewer.style.display = 'block';
        fallback.style.display = 'none';
        viewer.poster = model.image || '';
        viewer.src = model.stl_url;
    } else {
        viewer.style.display = 'none';
        fallback.style.display = 'block';
        fallback.src = model.image || '';
    }
    
    const externalLink = document.getElementById('external-link');
    externalLink.href = model.source_url;

    renderAffiliateLinks(model.name);
    renderServiceProviders();
    renderCalculator();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

downloadBtn.addEventListener('click', () => {
    if (!currentModel) return;
    // Track and redirect to source
    fetch(`/api/track-click?modelId=${currentModel.objectID}&type=download`);
    window.open(currentModel.source_url, '_blank');
});

function renderAffiliateLinks(name) {
    const container = document.getElementById('market-links');
    const block = document.getElementById('affiliate-block');
    
    // decide if we show marketplace links
    const keywords = ['spring', 'motor', 'gear', 'shaft', 'blade', 'electronics', 'pump', 'switch', 'handle', 'button', 'belt'];
    const matches = keywords.some(k => name.toLowerCase().includes(k));

    if (matches) {
        block.style.display = 'block';
        container.innerHTML = `
            <a href="https://www.amazon.com/s?k=${encodeURIComponent(name)}" target="_blank" class="market-link-v2">
                <span>Amazon</span>
                <span style="font-size:0.8rem; opacity:0.7">Найти →</span>
            </a>
            <a href="https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(name)}" target="_blank" class="market-link-v2">
                <span>AliExpress</span>
                <span style="font-size:0.8rem; opacity:0.7">Найти →</span>
            </a>
        `;
    } else {
        block.style.display = 'none';
    }
}

function calculateCost(volume = 50, density = 1.24, infill = 0.2) {
    const weight = volume * density * (infill + 0.1); // +10% for supports
    const cost = Math.max(150, weight * 15); // Min price 150 rub, 15 rub per gram
    return { weight, cost };
}

async function renderServiceProviders() {
    const container = document.getElementById('master-suggestion');
    container.innerHTML = '<p>Загрузка мастеров...</p>';

    try {
        const response = await fetch('/data/masters.json');
        const data = await response.json();

        // Use geolocation if possible
        let masters = data.masters;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                // Simple sort by distance (approximate)
                masters.sort((a, b) => {
                    const distA = Math.hypot(a.lat - latitude, a.lng - longitude);
                    const distB = Math.hypot(b.lat - latitude, b.lng - longitude);
                    return distA - distB;
                });
                renderMastersList(container, masters.slice(0, 2));
            }, () => {
                renderMastersList(container, masters.slice(0, 2));
            });
        } else {
            renderMastersList(container, masters.slice(0, 2));
        }
    } catch (error) {
        container.innerHTML = '<p>Мастера временно недоступны.</p>';
    }
}

function renderMastersList(container, masters) {
    const { cost } = calculateCost(currentModel.volume_cm3 || 50);

    container.innerHTML = masters.map(master => `
        <div class="master-suggestion-card">
            <div class="master-info">
                <h5>${master.name}</h5>
                <p>📍 ${master.city} • <span style="color:var(--accent)">~${Math.round(cost)} ₽</span></p>
            </div>
            <a href="https://wa.me/${master.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Привет! Хочу заказать 3D-печать модели: ' + currentModel.name + '. Ориентировочная цена: ' + Math.round(cost) + 'р')}"
               target="_blank" class="btn-accent" style="padding: 10px 20px; font-size:0.875rem;">
               Заказать
            </a>
        </div>
    `).join('');
}

function renderCalculator() {
    const container = document.getElementById('calc-ui');
    const result = document.getElementById('calc-result-v2');
    
    const volume = currentModel.volume_cm3 || 50;

    container.innerHTML = `
        <div class="calc-field">
            <label>Материал</label>
            <select id="calc-mat-v2">
                <option value="1.24">PLA (Стандарт)</option>
                <option value="1.27">PETG (Прочный)</option>
                <option value="1.04">ABS (Технический)</option>
            </select>
        </div>
        <div class="calc-field">
            <label>Заполнение (%)</label>
            <input type="number" id="calc-inf-v2" value="20" min="10" max="100" step="10">
        </div>
    `;

    const calculate = () => {
        const density = parseFloat(document.getElementById('calc-mat-v2').value);
        const infill = parseInt(document.getElementById('calc-inf-v2').value) / 100;

        const { weight, cost } = calculateCost(volume, density, infill);

        result.innerHTML = `Вес: ~${weight.toFixed(1)} г | Цена: ~${Math.round(cost)} ₽`;
    };

    document.getElementById('calc-mat-v2').addEventListener('change', calculate);
    document.getElementById('calc-inf-v2').addEventListener('input', calculate);
    calculate();
}
