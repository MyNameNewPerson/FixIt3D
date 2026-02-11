// public/scripts/maps.js

async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        console.log('Fetching masters data...');
        const response = await fetch('/data/masters.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Masters data loaded:', data);

        if (typeof L === 'undefined') {
            throw new Error('Leaflet is not loaded. Check internet connection or script tags.');
        }

        // Initial view: Russia
        const map = L.map('map', {
            scrollWheelZoom: false
        }).setView([55.75, 37.61], 4);

        L.tileLayer('https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap, ©CartoDB'
        }).addTo(map);

        const markers = [];
        const mastersList = document.getElementById('masters-list');

        function renderMastersList(masters) {
            if (!mastersList) return;
            mastersList.innerHTML = '';

            if (masters.length === 0) {
                mastersList.innerHTML = '<p style="padding:20px; text-align:center; color:var(--text-muted)">Мастеров не найдено</p>';
                return;
            }

            masters.forEach(master => {
                const item = document.createElement('div');
                item.className = 'master-item-mini';
                item.innerHTML = `
                    <h4>${master.name}</h4>
                    <p>${master.city}</p>
                    <p style="font-size:11px; margin-top:4px;">${master.equipment}</p>
                `;
                item.onclick = () => {
                    map.setView([master.lat, master.lng], 14);
                    const m = markers.find(m => m.masterId === master.id);
                    if (m) m.marker.openPopup();
                };
                mastersList.appendChild(item);
            });
        }

        data.masters.forEach(master => {
            if (master.lat && master.lng) {
                const marker = L.marker([master.lat, master.lng]).addTo(map);
                marker.bindPopup(`
                    <div class="map-popup" style="padding:10px; min-width:200px;">
                        <strong style="font-size:16px;">${master.name}</strong><br>
                        <span style="color:var(--text-muted)">${master.city}</span><br>
                        <p style="font-size:12px; margin: 8px 0;">${master.equipment}</p>
                        <div style="margin-top: 12px; display:flex; gap:8px;">
                            <a href="https://wa.me/${master.whatsapp.replace(/\D/g, '')}" target="_blank"
                               style="background:#25D366; color:white; padding:8px 12px; border-radius:6px; font-weight:700; font-size:12px; flex:1; text-align:center;">WhatsApp</a>
                            <a href="tel:${master.phone}"
                               style="background:var(--primary); color:white; padding:8px 12px; border-radius:6px; font-weight:700; font-size:12px; flex:1; text-align:center;">Позвонить</a>
                        </div>
                    </div>
                `);
                markers.push({ masterId: master.id, marker });
            }
        });

        renderMastersList(data.masters);

        // Map Search
        const searchInput = document.getElementById('map-city-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = data.masters.filter(m =>
                    m.city.toLowerCase().includes(query) ||
                    m.name.toLowerCase().includes(query)
                );
                renderMastersList(filtered);
            });
        }

        // Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                map.setView(userCoords, 11);
                L.circle(userCoords, {
                    color: 'var(--primary)',
                    fillColor: 'var(--primary)',
                    fillOpacity: 0.2,
                    radius: 2000
                }).addTo(map).bindPopup('Ваше местоположение');
            }, (err) => {
                console.warn('Geolocation failed:', err.message);
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => map.invalidateSize());

    } catch (error) {
        console.error('Map error:', error);
        mapContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; background: #fff1f2; border: 1px solid #fda4af; border-radius: 12px;">
                <h3 style="color: #be123c; margin-bottom: 8px;">Ошибка загрузки карты</h3>
                <p style="color: #9f1239; font-size: 14px;">${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #be123c; color: white; border: none; border-radius: 6px; cursor: pointer;">Попробовать снова</button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', initMap);
