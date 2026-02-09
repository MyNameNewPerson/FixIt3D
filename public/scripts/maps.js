// public/scripts/maps.js

async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        const response = await fetch('/data/masters.json');
        if (!response.ok) throw new Error('Failed to load masters data');
        const data = await response.json();

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
            masters.forEach(master => {
                const item = document.createElement('div');
                item.className = 'master-item-mini';
                item.innerHTML = `
                    <h4>${master.name}</h4>
                    <p>${master.city}</p>
                    <p style="font-size:11px; margin-top:4px;">${master.equipment}</p>
                `;
                item.onclick = () => {
                    map.setView([master.lat, master.lng], 12);
                    markers.find(m => m.masterId === master.id).marker.openPopup();
                };
                mastersList.appendChild(item);
            });
        }

        data.masters.forEach(master => {
            if (master.lat && master.lng) {
                const marker = L.marker([master.lat, master.lng]).addTo(map);
                marker.bindPopup(`
                    <div class="map-popup" style="padding:10px;">
                        <strong style="font-size:16px;">${master.name}</strong><br>
                        <span style="color:var(--text-muted)">${master.city}</span><br>
                        <p style="font-size:12px; margin: 8px 0;">${master.equipment}</p>
                        <div style="margin-top: 12px; display:flex; gap:8px;">
                            <a href="https://wa.me/${master.whatsapp.replace(/\D/g, '')}" target="_blank"
                               style="background:#25D366; color:white; padding:6px 12px; border-radius:6px; font-weight:700; font-size:12px;">WhatsApp</a>
                            <a href="tel:${master.phone}"
                               style="background:var(--primary); color:white; padding:6px 12px; border-radius:6px; font-weight:700; font-size:12px;">Позвонить</a>
                        </div>
                    </div>
                `);
                markers.push({ masterId: master.id, marker });
            }
        });

        renderMastersList(data.masters);

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
            });
        }

    } catch (error) {
        console.error('Map error:', error);
        mapContainer.innerHTML = `<div style="padding: 40px; text-align: center;">Не удалось загрузить карту.</div>`;
    }
}

document.addEventListener('DOMContentLoaded', initMap);
