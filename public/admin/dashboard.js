document.addEventListener('DOMContentLoaded', () => {
    // Check if we have a token (simple cookie check or just try to fetch stats)
    checkAuth();

    // Login Form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('dashboard-screen').classList.add('active');
            loadStats();
        } else {
            alert('Invalid Password');
        }
    });
});

async function checkAuth() {
    try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('dashboard-screen').classList.add('active');
            loadStats();
        }
    } catch (e) {
        console.log('Not authenticated');
    }
}

async function loadStats() {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();

    // Fill Dashboard Cards
    document.getElementById('stat-masters').textContent = data.masters.total;
    document.getElementById('stat-premium').textContent = data.masters.premium;
    document.getElementById('stat-balance').textContent = `$${data.masters.total_balance}`;

    // Fill Table
    const tbody = document.getElementById('daily-stats-body');
    tbody.innerHTML = '';
    data.stats.forEach(day => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${day.date}</td>
            <td>${day.visits}</td>
            <td>${day.leads}</td>
            <td>${day.clicks_affiliate}</td>
        `;
        tbody.appendChild(row);
    });
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.getElementById(`section-${id}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    // Simple way to toggle active nav state would be better, but this is MVP

    if (id === 'config') loadConfig();
}

async function loadConfig() {
    const res = await fetch('/api/admin/config');
    const data = await res.json();
    const list = document.getElementById('config-list');
    list.innerHTML = '';

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'config-item';
        div.innerHTML = `
            <div class="config-head">
                <strong>${item.key}</strong>
                <small>${item.description || ''}</small>
            </div>
            <div class="config-body">
                <input type="text" value="${item.value}" id="val-${item.key}">
                <button onclick="saveConfig('${item.key}')">Save</button>
            </div>
        `;
        list.appendChild(div);
    });
}

async function saveConfig(key) {
    const value = document.getElementById(`val-${key}`).value;
    const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
    if (res.ok) {
        alert('Saved!');
        loadConfig();
    } else {
        alert('Error saving config');
    }
}

async function lookupMaster() {
    const id = document.getElementById('master-search').value;
    if (!id) return;

    // In a real app, we'd have a specific GET endpoint for admin master details.
    // For MVP, we'll implement a simple verify toggle assuming we know the ID.
    const detail = document.getElementById('master-detail');
    detail.innerHTML = `
        <div class="master-card-admin">
            <h4>Master ID: ${id}</h4>
            <p>Actions:</p>
            <button onclick="togglePremium('${id}', true)">Set Premium</button>
            <button onclick="togglePremium('${id}', false)">Remove Premium</button>
        </div>
    `;
}

async function togglePremium(id, state) {
    const res = await fetch('/api/admin/masters/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_premium: state })
    });
    if (res.ok) alert('Updated!');
    else alert('Error updating master');
}

function logout() {
    // Clear cookie (client-side attempt, though HttpOnly prevents full clear via JS)
    // Server should have a logout route, but for MVP reload effectively logs out if token expired
    // or just clear local state
    document.cookie = 'admin_token=; Max-Age=0; path=/;';
    location.reload();
}
