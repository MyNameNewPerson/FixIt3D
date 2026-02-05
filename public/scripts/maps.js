// public/scripts/maps.js

async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        const response = await fetch('/data/masters.json');
        if (!response.ok) throw new Error('Failed to load masters data');
        const data = await response.json();

        // Initial view: Russia
        const map = L.map('map').setView([55.75, 37.61], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        data.masters.forEach(master => {
            if (master.lat && master.lng) {
                const marker = L.marker([master.lat, master.lng]).addTo(map);
                marker.bindPopup(`
                    <div class="map-popup">
                        <strong>${master.name}</strong><br>
                        ${master.city}<br>
                        <div style="margin-top: 10px;">
                            <a href="tel:${master.phone}" class="popup-link">📞 Позвонить</a><br>
                            <a href="https://wa.me/${master.whatsapp.replace(/\D/g, '')}" target="_blank" class="popup-link">💬 WhatsApp</a>
                        </div>
                    </div>
                `);
            }
        });

        // User Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                map.setView(userCoords, 10);
                L.marker(userCoords, {
                    icon: L.divIcon({
                        className: 'user-location',
                        html: '📍',
                        iconSize: [30, 30]
                    })
                }).addTo(map).bindPopup('Вы здесь');
            }, () => {
                console.log('Geolocation permission denied');
            });
        }

    } catch (error) {
        console.error('Map error:', error);
        mapContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; background: white; height: 100%;">
                <p>Не удалось загрузить карту мастерских.</p>
                <p>Пожалуйста, свяжитесь с нами для поиска мастера в вашем городе.</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', initMap);
