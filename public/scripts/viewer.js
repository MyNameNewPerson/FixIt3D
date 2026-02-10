// public/scripts/viewer.js

import { getTranslation } from './i18n.js';

const modal = document.getElementById('model-modal');
const closeBtn = document.querySelector('.close-modal-btn');
const downloadBtn = document.getElementById('download-btn');
const externalLink = document.getElementById('external-link');
const findMasterBtn = document.getElementById('find-master-btn');

let currentModel = null;

window.openModelModal = function(model) {
    if (!model) return;
    currentModel = model;

    // Reset tabs
    switchTab('print');

    // Basic Info
    document.getElementById('modal-title').textContent = model.name;
    document.getElementById('modal-author').textContent = model.author;
    document.getElementById('modal-brand').textContent = model.brand || 'General';
    
    // Visuals
    const viewer = document.getElementById('modal-viewer');
    const fallback = document.getElementById('modal-image-fallback');
    
    const fallbackUrl = 'https://via.placeholder.com/800x600?text=Preview+Unavailable';
    if (model.stl_url) {
        viewer.style.display = 'block';
        fallback.style.display = 'none';
        viewer.src = model.stl_url;
        viewer.poster = model.image || fallbackUrl;
    } else {
        viewer.style.display = 'none';
        fallback.style.display = 'block';
        fallback.src = model.image || fallbackUrl;
        fallback.onerror = function() { this.src = fallbackUrl; this.onerror = null; };
    }

    // Reset Master Status
    const masterStatus = document.getElementById('master-status');
    if (masterStatus) {
        masterStatus.textContent = getTranslation('order-sub', { count: Math.floor(Math.random() * 5) + 1 });
    }

    // External Links
    externalLink.href = model.source_url;

    // Features
    renderAffiliateLinks(model.name);
    initCalculator();

    // Show Modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-content-wrapper')) {
        closeModal();
    }
});

if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!currentModel) return;
        fetch(`/api/track-click?modelId=${currentModel.objectID}&type=download`);
        window.open(currentModel.source_url, '_blank');
    });
}

if (findMasterBtn) {
    findMasterBtn.addEventListener('click', () => {
        closeModal();
        document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
        // Optionally trigger geolocation or filter map here
    });
}

// Tab System
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = content.id === `tab-${tabId}` ? 'block' : 'none';
    });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function renderAffiliateLinks(name) {
    const container = document.getElementById('market-links');
    if (!container) return;
    
    // Check if part is printable or likely needs buying
    const nonPrintableKeywords = ['spring', 'motor', 'engine', 'logic board', 'display', 'glass', 'пружина', 'мотор', 'плата', 'стекло', 'металл', 'metal'];
    const isLikelyHardware = nonPrintableKeywords.some(k => name.toLowerCase().includes(k));

    const q = encodeURIComponent(name);
    const platforms = [
        { name: 'Amazon', url: `https://www.amazon.com/s?k=${q}&tag=fixit3d-20`, cls: '' },
        { name: 'AliExpress', url: `https://www.aliexpress.com/wholesale?SearchText=${q}`, cls: '' },
        { name: 'Yandex Market', url: `https://yandex.ru/products/search?text=${q}`, cls: '' },
        { name: 'Ozon', url: `https://www.ozon.ru/search/?text=${q}`, cls: '' }
    ];

    container.innerHTML = platforms.map(p => `
        <a href="${p.url}" target="_blank" class="market-btn ${isLikelyHardware ? 'highlight-buy' : ''}">
            <span>${p.name}</span>
            <span class="price-hint">${isLikelyHardware ? getTranslation('buy-original') : getTranslation('check-price')} ↗</span>
        </a>
    `).join('');
}

function initCalculator() {
    const matSelect = document.getElementById('calc-mat');
    const infInput = document.getElementById('calc-inf');
    const infVal = document.getElementById('inf-val');
    const resultDiv = document.getElementById('calc-result');
    
    if (!matSelect || !infInput) return;

    const volume = currentModel.volume_cm3 || 35;

    const update = () => {
        const density = parseFloat(matSelect.value);
        const infill = parseInt(infInput.value);
        if (infVal) infVal.textContent = `${infill}%`;

        const weight = volume * density * (infill/100 + 0.15);
        const price = Math.max(350, Math.round(weight * 25)); // adjusted price
        const currency = getTranslation('calc-currency');

        if (resultDiv) resultDiv.textContent = `${price} ${currency}`;
    };

    matSelect.onchange = update;
    infInput.oninput = update;
    update();
}
