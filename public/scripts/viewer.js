// public/scripts/viewer.js

const modal = document.getElementById('model-modal');
const closeBtn = document.querySelector('.close-modal');
const downloadBtn = document.getElementById('download-btn');
const externalLink = document.getElementById('external-link');

let currentModel = null;

window.openModelModal = function(model) {
    if (!model) return;
    currentModel = model;

    // Basic Info
    document.getElementById('modal-title').textContent = model.name;
    document.getElementById('modal-author').textContent = model.author;
    
    // Visuals
    const viewer = document.getElementById('modal-viewer');
    const fallback = document.getElementById('modal-image-fallback');
    
    if (model.stl_url) {
        viewer.style.display = 'block';
        fallback.style.display = 'none';
        viewer.src = model.stl_url;
        viewer.poster = model.image || '';
    } else {
        viewer.style.display = 'none';
        fallback.style.display = 'block';
        fallback.src = model.image || 'https://via.placeholder.com/800x600?text=No+Preview';
    }

    // External Links
    externalLink.href = model.source_url;

    // Features
    renderAffiliateLinks(model.name);
    renderMasterSuggestion();
    initCalculator();

    // Show Modal
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
    // Tracking
    fetch(`/api/track-click?modelId=${currentModel.objectID}&type=download`);
    window.open(currentModel.source_url, '_blank');
});

function renderAffiliateLinks(name) {
    const container = document.getElementById('market-links');
    const block = document.getElementById('affiliate-block');
    
    // Decide if we show marketplace links (mostly for spare parts)
    const keywords = ['spare', 'repair', 'replacement', 'part', 'bosch', 'dyson', 'samsung', 'gear', 'knob', 'handle', 'pump'];
    const isFunctional = keywords.some(k => name.toLowerCase().includes(k));
    
    if (isFunctional) {
        block.style.display = 'block';
        const q = encodeURIComponent(name);
        container.innerHTML = `
            <a href="https://www.amazon.com/s?k=${q}" target="_blank" class="market-btn">
                <span>Amazon</span>
                <span style="opacity:0.5">→</span>
            </a>
            <a href="https://www.aliexpress.com/wholesale?SearchText=${q}" target="_blank" class="market-btn">
                <span>AliExpress</span>
                <span style="opacity:0.5">→</span>
            </a>
        `;
    } else {
        block.style.display = 'none';
    }
}

async function renderMasterSuggestion() {
    const container = document.getElementById('master-suggestion');
    container.innerHTML = '<p style="font-size:0.875rem; color:var(--text-muted)">Загрузка мастеров...</p>';

    try {
        const response = await fetch('/data/masters.json');
        const data = await response.json();

        // Use geolocation to find closest (simplified here: random for demo)
        const master = data.masters[Math.floor(Math.random() * data.masters.length)];

        container.innerHTML = `
            <div class="master-info-mini">
                <p style="font-weight:700; color:#166534">${master.name}</p>
                <p style="font-size:0.75rem; color:#15803d">${master.city} • Рядом с вами</p>
            </div>
            <a href="https://wa.me/${master.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Привет! Хочу заказать 3D-печать модели: ' + currentModel.name)}"
               target="_blank" class="btn-primary" style="padding: 8px 16px; font-size:0.75rem; flex:none; width:auto">
               Заказать
            </a>
        `;
    } catch (error) {
        container.innerHTML = '<p style="font-size:0.875rem; color:var(--text-muted)">Мастера временно недоступны.</p>';
    }
}

function initCalculator() {
    const matSelect = document.getElementById('calc-mat');
    const infInput = document.getElementById('calc-inf');
    const infVal = document.getElementById('inf-val');
    const resultDiv = document.getElementById('calc-result');

    const volume = currentModel.volume_cm3 || 35; // default fallback

    const update = () => {
        const density = parseFloat(matSelect.value);
        const infill = parseInt(infInput.value);
        infVal.textContent = `${infill}%`;

        // Rough formula: weight = volume * density * (infill/100 + shells)
        const weight = volume * density * (infill/100 + 0.15);
        const price = Math.max(350, Math.round(weight * 18)); // min 350 rub, 18 rub/gram

        resultDiv.textContent = `~ ${price} ₽`;
    };

    matSelect.onchange = update;
    infInput.oninput = update;
    update();
}
