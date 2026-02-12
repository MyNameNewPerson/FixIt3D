// public/scripts/maps.js

let mapInstance = null;
let mastersData = null;

export async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || mapInstance) {
        if (mapInstance) {
            setTimeout(() => mapInstance.invalidateSize(), 200);
        }
        return;
    }

    try {
        if (!mastersData) {
            console.log('Fetching masters data...');
            const response = await fetch('/data/masters.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            mastersData = data.masters;
            console.log('Masters data loaded:', mastersData);
        }

        if (typeof L === 'undefined') {
            throw new Error('Leaflet is not loaded. Check internet connection or script tags.');
        }

        // Initial view: Russia
        mapInstance = L.map('map', {
            scrollWheelZoom: false
        }).setView([55.75, 37.61], 4);

        L.tileLayer('https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap, ©CartoDB'
        }).addTo(mapInstance);

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
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4>${master.name}</h4>
                            <p>${master.city}</p>
                        </div>
                        <button class="btn-action-main" style="padding:4px 8px; font-size:10px;">Выбрать</button>
                    </div>
                `;
                item.onclick = () => {
                    mapInstance.setView([master.lat, master.lng], 14);
                    const m = markers.find(m => m.masterId === master.id);
                    if (m) m.marker.openPopup();
                };
                mastersList.appendChild(item);
            });
        }

        mastersData.forEach(master => {
            if (master.lat && master.lng) {
                const marker = L.marker([master.lat, master.lng]).addTo(mapInstance);
                marker.bindPopup(`
                    <div class="map-popup" style="padding:5px; min-width:150px;">
                        <strong style="font-size:14px;">${master.name}</strong><br>
                        <span style="color:var(--text-muted); font-size:12px;">${master.city}</span><br>
                        <div style="margin-top: 8px; display:flex; gap:4px;">
                            <a href="https://wa.me/${master.whatsapp.replace(/\D/g, '')}" target="_blank"
                               style="background:#25D366; color:white; padding:4px 8px; border-radius:4px; font-weight:700; font-size:10px; flex:1; text-align:center;">WhatsApp</a>
                        </div>
                    </div>
                `);
                markers.push({ masterId: master.id, marker });
            }
        });

        renderMastersList(mastersData);

        // Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                mapInstance.setView(userCoords, 11);
                L.circle(userCoords, {
                    color: 'var(--primary)',
                    fillColor: 'var(--primary)',
                    fillOpacity: 0.2,
                    radius: 2000
                }).addTo(mapInstance).bindPopup('Ваше местоположение');
            }, (err) => {
                console.warn('Geolocation failed:', err.message);
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => mapInstance.invalidateSize());

        // Initial invalidate
        setTimeout(() => {
            if (mapInstance) mapInstance.invalidateSize();
        }, 300);

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

