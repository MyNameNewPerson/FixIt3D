// public/scripts/viewer.js

const modal = document.getElementById('model-modal');
const closeBtn = document.querySelector('.close-modal');
const downloadBtn = document.getElementById('download-btn');

let currentModel = null; // Store current model data

window.openModelModal = function(model) {
    if (!model) return;
    currentModel = model; // Save for calculator

    document.getElementById('modal-title').textContent = model.name;
    document.getElementById('modal-author').querySelector('span').textContent = model.author;
    document.getElementById('modal-description').textContent = model.description || 'Нет описания';
    
    const viewer = document.getElementById('modal-viewer');
    
    viewer.poster = model.image || 'https://via.placeholder.com/400x300?text=No+Image';

    if (model.stl_url) {
      viewer.src = `/api/get-model?url=${encodeURIComponent(model.stl_url)}`;
    } else {
      viewer.src = '';
    }
    
    const externalLink = document.getElementById('external-link');
    externalLink.href = model.source_url;

    downloadBtn.setAttribute('data-id', model.objectID);

    renderCalculator(); // Render the calculator UI

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

closeBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

downloadBtn.addEventListener('click', async () => {
    const modelId = downloadBtn.getAttribute('data-id');
    if (!modelId) return;

    downloadBtn.disabled = true;
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<span>⏳</span> Подготовка...';

    try {
        const response = await fetch(`/api/download?modelId=${modelId}`);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${modelId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        downloadBtn.innerHTML = '✅ Готово!';
        
        // Track click
        fetch(`/api/track-click?modelId=${modelId}&type=download`);

    } catch (error) {
        console.error('Download error:', error);
        alert('Ошибка при скачивании файла. Попробуйте позже.');
        downloadBtn.innerHTML = '❌ Ошибка';
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
        }, 3000);
    }
});

// --- CALCULATOR LOGIC ---

const materialDensities = {
    'PLA': 1.24,
    'PETG': 1.27,
    'ABS': 1.04,
    'TPU': 1.21
};

function calculateCost() {
    if (!currentModel || !currentModel.volume_cm3) return;

    const material = document.getElementById('calc-material').value;
    const spoolPrice = parseFloat(document.getElementById('calc-price').value);
    const spoolWeight = parseFloat(document.getElementById('calc-weight').value);
    const infill = parseFloat(document.getElementById('calc-infill').value);

    const resultEl = document.getElementById('calculator-result');

    if (isNaN(spoolPrice) || isNaN(spoolWeight) || isNaN(infill) || spoolWeight <= 0) {
        resultEl.textContent = 'Заполните все поля корректно.';
        return;
    }

    const density = materialDensities[material];
    const modelWeight = currentModel.volume_cm3 * (infill / 100) * density;
    const totalWeight = modelWeight * 1.15; // +15% for supports/raft/purge
    const pricePerGram = spoolPrice / spoolWeight;
    const estimatedCost = totalWeight * pricePerGram;

    resultEl.innerHTML = `Примерный вес: <strong>${totalWeight.toFixed(1)} г</strong><br>Примерная стоимость: <strong>${estimatedCost.toFixed(2)} ₽</strong>`;
    
    renderMaterialLinks(material); // Render links for the selected material
}

async function renderMaterialLinks(material) {
    const linksContainer = document.getElementById('material-links-section');
    linksContainer.innerHTML = '<h5>Где купить:</h5>';

    try {
        const response = await fetch('/data/filaments.json');
        const filaments = await response.json();
        const links = filaments[material];

        if (links && links.length > 0) {
            const list = document.createElement('ul');
            list.className = 'material-links-list';
            links.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener sponsored">${item.name} на <strong>${item.shop}</strong></a>`;
                list.appendChild(li);
            });
            linksContainer.appendChild(list);
        } else {
            linksContainer.innerHTML += '<p>Ссылки для этого материала не найдены.</p>';
        }
    } catch (error) {
        console.error('Error fetching filament links:', error);
        linksContainer.innerHTML += '<p>Не удалось загрузить ссылки.</p>';
    }
}

function renderCalculator() {
    const controlsContainer = document.getElementById('calculator-controls');
    const resultEl = document.getElementById('calculator-result');
    const calculatorSection = document.getElementById('calculator-section');

    if (!currentModel || !currentModel.volume_cm3) {
        calculatorSection.style.display = 'none';
        return;
    }
    
    calculatorSection.style.display = 'block';

    controlsContainer.innerHTML = `
        <div class="calc-row">
            <div class="calc-group">
                <label for="calc-material">Пластик:</label>
                <select id="calc-material">
                    ${Object.keys(materialDensities).map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
            </div>
            <div class="calc-group">
                <label for="calc-infill">Заполнение:</label>
                <input type="number" id="calc-infill" value="20" min="5" max="100" step="5">
                <span>%</span>
            </div>
        </div>
        <div class="calc-row">
            <div class="calc-group">
                <label for="calc-price">Цена катушки:</label>
                <input type="number" id="calc-price" value="1500" step="50">
                <span>₽</span>
            </div>
            <div class="calc-group">
                <label for="calc-weight">Вес катушки:</label>
                <input type="number" id="calc-weight" value="1000" step="250">
                <span>г</span>
            </div>
        </div>
    `;

    resultEl.innerHTML = ''; // Clear previous results

    // Add event listeners
    const materialSelector = document.getElementById('calc-material');
    materialSelector.addEventListener('change', () => {
        calculateCost();
        renderMaterialLinks(materialSelector.value);
    });
    document.getElementById('calc-infill').addEventListener('input', calculateCost);
    document.getElementById('calc-price').addEventListener('input', calculateCost);
    document.getElementById('calc-weight').addEventListener('input', calculateCost);

    // Initial calculation and link rendering
    calculateCost();
    renderMaterialLinks(materialSelector.value);
}

