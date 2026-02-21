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

    if (model.image) {
        fallback.src = model.image;
    } else {
        fallback.src = fallbackUrl;
    }

    fallback.onerror = function() {
        if (this.src !== fallbackUrl) {
            this.src = fallbackUrl;
        }
        this.onerror = null;
    };

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

    // Bottom Sheet Logic for Mobile
    if (window.innerWidth <= 768) {
        modal.classList.add('active'); // Trigger slide-up
    }

    // History API (Block 5)
    // Only push state if we aren't already there (to avoid duplicates if user clicks multiple times)
    if (!history.state || !history.state.modal) {
        history.pushState({ modal: true, modelId: model.objectID }, '', '#model-' + model.objectID);
    }
};

function updateTreatstockLink(stlUrl) {
    const treatstockLink = `https://www.treatstock.com/my/print-model3d?utm_source=fixit3d&stl_url=${encodeURIComponent(stlUrl || '')}`;
    const printLink = document.getElementById('treatstock-link-print');
    const mapLink = document.getElementById('treatstock-link-map');

    if (printLink) printLink.href = treatstockLink;
    if (mapLink) mapLink.href = treatstockLink;
}

function closeModal() {
    modal.style.display = 'none';
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Clean up history if needed (only if current state is modal)
    if (history.state && history.state.modal) {
        history.back();
    }
}

// Handle Back Button
window.onpopstate = function(event) {
    if (!event.state || !event.state.modal) {
        // Just close visually without calling history.back() again
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

if (closeBtn) closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    // Backdrop click
    if (e.target.classList.contains('modal-backdrop')) {
        closeModal();
    }
});

if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        if (!currentModel) return;
        fetch(`/api/track-click?modelId=${currentModel.objectID}&type=download`);

        if (currentModel.stl_url) {
            window.location.href = currentModel.stl_url;
        } else {
            // Try fetch if missing
            if (currentModel.source === 'thingiverse') {
                const thingId = currentModel.objectID.split('_')[1];
                try {
                    const res = await fetch(`/api/get-thing-files?id=${thingId}`);
                    const files = await res.json();
                    if (files && files.length > 0) {
                        const stl = files.find(f => f.name.toLowerCase().endsWith('.stl'));
                        if (stl) {
                            window.location.href = stl.download_url;
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Download fetch failed', e);
                }
            }
            window.open(currentModel.source_url, '_blank');
        }
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
        // initMap(); // Handled by button now
        // If map is already visible, make sure it's sized right
        const mapDiv = document.getElementById('map');
        if (mapDiv && mapDiv.style.display !== 'none') {
            initMap();
        }
    }
}

const toggleMapBtn = document.getElementById('toggle-map-btn');
if (toggleMapBtn) {
    toggleMapBtn.addEventListener('click', () => {
        const mapDiv = document.getElementById('map');
        if (!mapDiv) return;

        const isHidden = mapDiv.style.display === 'none';
        if (isHidden) {
            mapDiv.style.display = 'block';
            toggleMapBtn.innerHTML = `🗺️ ${getTranslation('hide-map')}`;
            initMap();
        } else {
            mapDiv.style.display = 'none';
            toggleMapBtn.innerHTML = `🗺️ ${getTranslation('show-map')}`;
        }
    });
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

    let buttonsHtml = platforms.map(p => `
        <a href="${p.url}" target="_blank" class="market-btn ${isLikelyHardware ? 'highlight-buy' : ''}">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">${p.icon}</span>
                <span>${p.name}</span>
            </div>
            <span class="price-hint">${isLikelyHardware ? getTranslation('buy-original') : getTranslation('check-price')} ↗</span>
        </a>
    `).join('');

    // --- Contextual CPA Integration (Block 4) ---
    // Analyze model name/tags to suggest specific parts via /api/go
    const keywords = [
        { key: 'gear', target: 'filament_nylon', label: 'Купить Nylon (для шестеренок)' },
        { key: 'wheel', target: 'filament_tpu', label: 'Купить TPU (для колес)' },
        { key: 'bearing', target: 'bearing_608', label: 'Купить подшипники 608ZZ' },
        { key: 'screw', target: 'screws_m3', label: 'Купить набор винтов M3' },
        { key: 'bolt', target: 'screws_m3', label: 'Купить крепеж' },
        { key: 'led', target: 'led_strip', label: 'Купить LED ленту' },
        { key: 'lamp', target: 'led_strip', label: 'Купить подсветку' },
        { key: 'arduino', target: 'arduino', label: 'Купить Arduino' },
        { key: 'motor', target: 'servo', label: 'Купить сервопривод' }
    ];

    const contextBtns = [];
    const lowerName = (name + ' ' + (brand || '')).toLowerCase();

    keywords.forEach(kw => {
        if (lowerName.includes(kw.key)) {
            contextBtns.push(`
                <a href="/api/go?target=${kw.target}" target="_blank" class="market-btn recommended-part" style="border: 2px solid var(--primary); background: rgba(var(--primary-rgb), 0.1);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:20px;">💡</span>
                        <span style="font-weight:700; color:var(--primary);">${kw.label}</span>
                    </div>
                    <span class="price-hint">FixIt3D Choice ↗</span>
                </a>
            `);
        }
    });

    if (contextBtns.length > 0) {
        buttonsHtml += `
            <div style="width:100%; margin-top:12px; margin-bottom:8px; font-size:12px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">
                Рекомендуемые компоненты
            </div>
            ${contextBtns.join('')}
        `;
    }

    container.innerHTML = buttonsHtml;
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
        let basePrice = Math.max(350, Math.round(weight * 25 + 300));
        const currency = getTranslation('calc-currency');

        // Currency Conversion (Approximate 96 RUB = 1 USD)
        if (currency === '$') {
            basePrice = Math.round(basePrice / 96);
        }

        if (resultDiv) {
            // Indicate estimation if exact volume is unknown
            const prefix = !currentModel.volume_cm3 ? '~ ' : '';
            resultDiv.textContent = `${prefix}${basePrice} ${currency}`;
        }

        // Render recommended materials
        if (materialsContainer) {
            let specificFilaments = '';
            if (filamentData && filamentData[matType]) {
                specificFilaments = filamentData[matType].map(f => `
                    <a href="${f.link}" target="_blank" class="market-btn">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span>📦</span>
                            <span>${f.name}</span>
                        </div>
                        <span class="price-hint">Купить ↗</span>
                    </a>
                `).join('');
            }

            if (specificFilaments) {
                materialsContainer.innerHTML = `
                    <p style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Рекомендуемые катушки:</p>
                    <div class="market-list" style="margin-bottom: 16px;">${specificFilaments}</div>
                `;
            } else {
                materialsContainer.innerHTML = `
                    <p style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Найти ${matType} на маркетплейсах:</p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <a href="https://www.wildberries.ru/catalog/0/search.aspx?search=${matType}+plastic" target="_blank" class="market-btn-mini" style="background: #cb11ab; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">WB</a>
                        <a href="https://www.ozon.ru/search/?text=${matType}+plastic" target="_blank" class="market-btn-mini" style="background: #005bff; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Ozon</a>
                        <a href="https://aliexpress.ru/wholesale?SearchText=${matType}+filament" target="_blank" class="market-btn-mini" style="background: #ff4747; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">AliExpress</a>
                    </div>
                `;
            }
        }
    };

    matSelect.onchange = update;
    infInput.oninput = update;
    update();
}
