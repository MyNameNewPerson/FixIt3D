// public/scripts/maps.js

let mapInstance = null;
let mastersData = null;

export async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Resize fix for Leaflet if already initialized
    if (mapInstance) {
        setTimeout(() => mapInstance.invalidateSize(), 200);
        return;
    }

    try {
        if (!mastersData) {
            console.log('Fetching masters data from API...');
            // Fetch from new API endpoint
            const response = await fetch('/api/masters');
            if (!response.ok) {
                // Fallback to static if API fails (e.g. during build)
                console.warn('API failed, falling back to static data');
                const staticRes = await fetch('/data/masters.json');
                if (staticRes.ok) {
                    const data = await staticRes.json();
                    mastersData = data.masters;
                }
            } else {
                const data = await response.json();
                mastersData = data.masters;
            }
            console.log('Masters data loaded:', mastersData ? mastersData.length : 0);
        }

        if (typeof L === 'undefined') {
            throw new Error('Leaflet is not loaded. Check internet connection or script tags.');
        }

        // Initial view: Russia (can be improved with IP geo)
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

            if (!masters || masters.length === 0) {
                mastersList.innerHTML = '<p style="padding:20px; text-align:center; color:var(--text-muted)">Мастеров не найдено</p>';
                return;
            }

            masters.forEach(master => {
                const isPremium = master.is_premium;
                const item = document.createElement('div');
                item.className = 'master-item-mini';
                if (isPremium) item.style.borderLeft = '4px solid gold';

                const nameText = isPremium ? `${master.name} ⭐` : master.name;
                const addrText = master.address || master.city || 'Адрес скрыт';

                // Prevent XSS by building DOM nodes instead of innerHTML for user content
                const contentDiv = document.createElement('div');
                contentDiv.style.display = 'flex';
                contentDiv.style.justifyContent = 'space-between';
                contentDiv.style.alignItems = 'center';

                const infoDiv = document.createElement('div');

                const h4 = document.createElement('h4');
                h4.textContent = nameText;
                if (isPremium) {
                    h4.style.color = 'var(--primary)';
                    h4.style.fontWeight = '800';
                }

                const p = document.createElement('p');
                p.textContent = addrText;

                infoDiv.appendChild(h4);
                infoDiv.appendChild(p);

                const btn = document.createElement('button');
                btn.className = 'btn-action-main';
                btn.style.padding = '4px 8px';
                btn.style.fontSize = '10px';
                btn.textContent = 'На карте';

                contentDiv.appendChild(infoDiv);
                contentDiv.appendChild(btn);
                item.appendChild(contentDiv);

                item.onclick = () => {
                    mapInstance.setView([master.lat, master.lng], 14);
                    const m = markers.find(m => m.masterId === master.id);
                    if (m) m.marker.openPopup();
                };
                mastersList.appendChild(item);
            });
        }

        if (mastersData) {
            mastersData.forEach(master => {
                if (master.lat && master.lng) {
                    // Custom Icon for Premium
                    const isPremium = master.is_premium;
                    const markerColor = isPremium ? 'gold' : '#3b82f6';

                    const icon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color:${markerColor}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    const marker = L.marker([master.lat, master.lng], { icon }).addTo(mapInstance);

                    // Popup Content
                    const popupContent = document.createElement('div');
                    popupContent.className = 'map-popup';
                    popupContent.style.padding = '5px';
                    popupContent.style.minWidth = '180px';

                    popupContent.innerHTML = `
                        <strong style="font-size:14px; color: ${isPremium ? '#d97706' : 'inherit'}">
                            ${master.name} ${isPremium ? '⭐' : ''}
                        </strong><br>
                        <span style="color:var(--text-muted); font-size:12px;">${master.address || 'Адрес скрыт'}</span><br>
                        <div id="contacts-${master.id}" style="margin-top: 8px;">
                            <button id="btn-show-${master.id}"
                                    style="background:var(--primary); color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:11px; width:100%;">
                                Показать контакты
                            </button>
                        </div>
                    `;

                    // Bind click event for "Show Contacts"
                    marker.bindPopup(popupContent);
                    marker.on('popupopen', () => {
                        const btn = document.getElementById(`btn-show-${master.id}`);
                        if (btn) {
                            btn.onclick = async () => {
                                btn.textContent = 'Загрузка...';
                                btn.disabled = true;
                                try {
                                    const res = await fetch(`/api/reveal-contact?id=${master.id}`);
                                    const data = await res.json();

                                    if (data.contacts) {
                                        const container = document.getElementById(`contacts-${master.id}`);
                                        container.innerHTML = `
                                            <div style="display:flex; flex-direction:column; gap:4px; margin-top:5px;">
                                                ${data.contacts.phone ? `<a href="tel:${data.contacts.phone}" style="color:var(--text-main); font-size:12px;">📞 ${data.contacts.phone}</a>` : ''}
                                                ${data.contacts.email ? `<a href="mailto:${data.contacts.email}" style="color:var(--text-main); font-size:12px;">✉️ ${data.contacts.email}</a>` : ''}
                                                ${data.contacts.website ? `<a href="${data.contacts.website}" target="_blank" style="color:var(--primary); font-size:12px;">🌐 Сайт</a>` : ''}
                                            </div>
                                        `;
                                    } else {
                                        btn.textContent = 'Ошибка';
                                    }
                                } catch (e) {
                                    console.error('Failed to reveal contacts', e);
                                    btn.textContent = 'Ошибка сети';
                                }
                            };
                        }
                    });

                    markers.push({ masterId: master.id, marker });
                }
            });

            renderMastersList(mastersData);
        }

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
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #fff1f2; border: 1px solid #fda4af; border-radius: 12px;">
                    <h3 style="color: #be123c; margin-bottom: 8px;">Ошибка загрузки карты</h3>
                    <p style="color: #9f1239; font-size: 14px;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #be123c; color: white; border: none; border-radius: 6px; cursor: pointer;">Попробовать снова</button>
                </div>
            `;
        }
    }
}
