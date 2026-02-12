// public/scripts/viewer.js

import { getTranslation } from './i18n.js';
import { initMap } from './maps.js';

const modal = document.getElementById('model-modal');
const closeBtn = document.querySelector('.close-modal-btn');
const downloadBtn = document.getElementById('download-btn');
const externalLink = document.getElementById('external-link');
const findMasterBtn = document.getElementById('find-master-btn');

let currentModel = null;

window.openModelModal = async function(model) {
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

    // Show initial visual
    viewer.style.display = 'none';
    fallback.style.display = 'block';
    fallback.src = model.image || fallbackUrl;
    fallback.onerror = function() { this.src = fallbackUrl; this.onerror = null; };

    // Lazy load STL if missing
    if (!model.stl_url && model.source === 'thingiverse') {
        const thingId = model.objectID.split('_')[1];
        try {
            const res = await fetch(`/api/get-thing-files?id=${thingId}`);
            const files = await res.json();
            if (files && files.length > 0) {
                // Find first STL
                const stl = files.find(f => f.name.toLowerCase().endsWith('.stl'));
                if (stl) {
                    model.stl_url = stl.download_url;
                }
            }
        } catch (e) {
            console.error('Failed to lazy load STL:', e);
        }
    }

    // Update visuals if we have STL now
    if (model.stl_url) {
        viewer.style.display = 'block';
        fallback.style.display = 'none';
        viewer.src = model.stl_url;
        viewer.poster = model.image || fallbackUrl;
    }

    // Reset Master Status
    const masterStatus = document.getElementById('master-status');
    if (masterStatus) {
        masterStatus.textContent = getTranslation('order-sub', { count: Math.floor(Math.random() * 5) + 1 });
    }

    // External Links
    externalLink.href = model.source_url;

    // Treatstock affiliate link
    updateTreatstockLink(model.stl_url);

    // Features
    renderAffiliateLinks(model.name, model.brand);
    initCalculator();

    // Show Modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

function updateTreatstockLink(stlUrl) {
    const treatstockLink = `https://www.treatstock.com/my/print-model3d?utm_source=fixit3d&stl_url=${encodeURIComponent(stlUrl || '')}`;
    document.getElementById('treatstock-link-print').href = treatstockLink;
    document.getElementById('treatstock-link-map').href = treatstockLink;
}

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
        switchTab('map');
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

    if (tabId === 'map') {
        initMap();
    }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function cleanModelName(name) {
    if (!name) return '';
    return name
        .replace(/\.stl$/i, '')
        .replace(/\.obj$/i, '')
        .replace(/\.step$/i, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/v\d+(\.\d+)?/gi, '') // Remove v1, v1.2 etc
        .replace(/\(\d+\)/g, '')       // Remove (1), (2) etc
        .replace(/\s+/g, ' ')
        .trim();
}

function renderAffiliateLinks(name, brand) {
    const container = document.getElementById('market-links');
    if (!container) return;
    
    const cleanName = cleanModelName(name);
    const searchTerm = brand ? `${brand} ${cleanName}` : cleanName;
    const q = encodeURIComponent(searchTerm);

    // Check if part is printable or likely needs buying
    const nonPrintableKeywords = ['spring', 'motor', 'engine', 'logic board', 'display', 'glass', 'пружина', 'мотор', 'плата', 'стекло', 'металл', 'metal', 'screw', 'bolt'];
    const isLikelyHardware = nonPrintableKeywords.some(k => searchTerm.toLowerCase().includes(k));

    const platforms = [
        { name: 'Amazon', url: `https://www.amazon.com/s?k=${q}&tag=fixit3d-21`, icon: '🛒' },
        { name: 'AliExpress', url: `https://www.aliexpress.com/w/wholesale-${q.replace(/%20/g, '-')}.html`, icon: '📦' },
        { name: 'Yandex Market', url: `https://yandex.ru/products/search?text=${q}`, icon: '🇷🇺' },
        { name: 'Ozon', url: `https://www.ozon.ru/search/?text=${q}`, icon: '🔵' }
    ];

    container.innerHTML = platforms.map(p => `
        <a href="${p.url}" target="_blank" class="market-btn ${isLikelyHardware ? 'highlight-buy' : ''}">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">${p.icon}</span>
                <span>${p.name}</span>
            </div>
            <span class="price-hint">${isLikelyHardware ? getTranslation('buy-original') : getTranslation('check-price')} ↗</span>
        </a>
    `).join('');
}

async function initCalculator() {
    const matSelect = document.getElementById('calc-mat');
    const infInput = document.getElementById('calc-inf');
    const infVal = document.getElementById('inf-val');
    const resultDiv = document.getElementById('calc-result');
    const materialsContainer = document.getElementById('recommended-materials');
    
    if (!matSelect || !infInput) return;

    // Load materials data
    let filamentData = null;
    try {
        const res = await fetch('/data/filaments.json');
        if (res.ok) {
            filamentData = await res.json();
        }
    } catch (e) {
        console.warn('Failed to load filaments.json');
    }

    // Density values: PLA ~1.24, PETG ~1.27, ABS ~1.04
    const volume = currentModel.volume_cm3 || 35;

    const update = () => {
        const density = parseFloat(matSelect.value);
        const infill = parseInt(infInput.value);
        const matType = matSelect.options[matSelect.selectedIndex].text.split(' ')[0]; // Extract PLA, PETG, ABS

        if (infVal) infVal.textContent = `${infill}%`;

        // Estimation: (Volume * Density) * (Infill % + shell overhead)
        const weight = volume * density * (infill/100 + 0.15);

        // Realistic Cost: (Weight * 25 RUB per gram) + Service Base Fee (300 RUB)
        const basePrice = Math.max(350, Math.round(weight * 25 + 300));
        const currency = getTranslation('calc-currency');

        if (resultDiv) resultDiv.textContent = `${basePrice} ${currency}`;

        // Render recommended materials
        if (filamentData && materialsContainer && filamentData[matType]) {
            materialsContainer.innerHTML = `
                <p style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">🛒 Купить материал для печати:</p>
                <div class="market-list">
                    ${filamentData[matType].map(f => `
                        <a href="${f.link}" target="_blank" class="market-btn">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span>📦</span>
                                <span>${f.name} (${f.shop})</span>
                            </div>
                            <span class="price-hint">Купить ↗</span>
                        </a>
                    `).join('')}
                </div>
            `;
        }
    };

    matSelect.onchange = update;
    infInput.oninput = update;
    update();
}
