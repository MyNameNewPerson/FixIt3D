// public/scripts/viewer.js

const modal = document.getElementById('model-modal');
const closeBtn = document.querySelector('.close-modal');
const downloadBtn = document.getElementById('download-btn');

let currentModel = null;

window.openModelModal = function(model) {
    if (!model) return;
    currentModel = model;

    document.getElementById('modal-title').textContent = model.name;
    document.getElementById('modal-author').querySelector('span').textContent = model.author;
    
    const viewer = document.getElementById('modal-viewer');
    viewer.poster = model.image || '';
    viewer.src = model.stl_url || ''; // In real app, we'd have a GLB/USDZ for the viewer
    
    const externalLink = document.getElementById('external-link');
    externalLink.href = model.source_url;

    renderCalculator();
    renderAffiliateLinks(model.name);
    renderServiceProviders();
    checkReadyMade(model.name);

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
    window.open(currentModel.source_url, '_blank');
    // In a real app, this would download the STL/ZIP
});

function renderAffiliateLinks(name) {
    const section = document.getElementById('buy-ready-section');
    const container = document.getElementById('market-links');
    
    // Simple logic to decide if we show marketplace links
    const keywords = ['spring', 'motor', 'gear', 'shaft', 'blade', 'electronics', 'pump', 'switch'];
    const needsMarketplace = keywords.some(k => name.toLowerCase().includes(k));
    
    if (needsMarketplace) {
        section.style.display = 'block';
        container.innerHTML = `
            <a href="https://www.amazon.com/s?k=${encodeURIComponent(name)}" target="_blank" class="market-link">
                Amazon <span>Купить</span>
            </a>
            <a href="https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(name)}" target="_blank" class="market-link">
                AliExpress <span>Купить</span>
            </a>
        `;
    } else {
        section.style.display = 'none';
    }
}

async function renderServiceProviders() {
    const container = document.getElementById('nearest-master');
    container.innerHTML = '<p>Поиск ближайшего мастера...</p>';

    try {
        const response = await fetch('/data/masters.json');
        const data = await response.json();

        // In a real app, use geolocation to find the closest one.
        // For demo, just pick the first one.
        const master = data.masters[0];

        container.innerHTML = `
            <div class="master-card">
                <h5>${master.name}</h5>
                <p>📍 ${master.city}</p>
                <a href="https://wa.me/${master.whatsapp.replace(/\D/g, '')}?text=Здравствуйте, хочу заказать печать детали ${currentModel.name}" target="_blank" class="btn-primary" style="display:inline-block; text-decoration:none;">Заказать печать</a>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<p>Не удалось найти мастеров.</p>';
    }
}

function checkReadyMade(name) {
    // Logic to show "Buy ready-made" notice
    const block = document.getElementById('buy-ready-section');
    if (name.toLowerCase().includes('motor') || name.toLowerCase().includes('spring')) {
        block.style.display = 'block';
    }
}

function renderCalculator() {
    const section = document.getElementById('calculator-section');
    const container = document.getElementById('calculator-controls');
    const result = document.getElementById('calculator-result');

    if (!currentModel.volume_cm3) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
                <label style="font-size:0.75rem; color:var(--text-muted)">Материал</label>
                <select id="calc-material" style="width:100%; padding:0.5rem; border-radius:0.5rem; border:1px solid var(--border)">
                    <option value="1.24">PLA</option>
                    <option value="1.27">PETG</option>
                    <option value="1.04">ABS</option>
                </select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:var(--text-muted)">Заполнение (%)</label>
                <input type="number" id="calc-infill" value="20" style="width:100%; padding:0.5rem; border-radius:0.5rem; border:1px solid var(--border)">
            </div>
        </div>
    `;

    const calc = () => {
        const density = parseFloat(document.getElementById('calc-material').value);
        const infill = parseFloat(document.getElementById('calc-infill').value) / 100;
        const weight = currentModel.volume_cm3 * density * infill;
        const cost = weight * 5; // 5 units per gram
        result.innerHTML = `Примерный вес: <strong>${weight.toFixed(1)}г</strong>. Ориентировочная стоимость: <strong>${cost.toFixed(0)} ₽</strong>`;
    };

    document.getElementById('calc-material').addEventListener('change', calc);
    document.getElementById('calc-infill').addEventListener('input', calc);
    calc();
}
