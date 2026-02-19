// Load Supabase configuration
// For admin panel usage, we need the public anon key to initiate auth flow.
// However, the backend API will verify the token using its service role logic or just standard JWT verification.

const SUPABASE_URL = 'https://ggrdkycsnxirzcuuxlea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KOJIELK08yqV0jKpbWyVNg_q7UngE3u';

let supabase;

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure window.supabase is available (loaded via CDN in index.html)
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error('Supabase SDK not loaded');
        alert('Critical Error: Supabase SDK could not be loaded. Please check your internet connection.');
        return;
    }

    // Check if we are already logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        showDashboard();
    } else {
        // Show login screen
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('active');
    }

    // Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const btn = loginForm.querySelector('button');

            if (!emailInput || !passwordInput || !btn) return;

            const email = emailInput.value;
            const password = passwordInput.value;
            const originalText = btn.textContent;

            btn.textContent = 'Verifying...';
            btn.disabled = true;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert('Login Failed: ' + error.message);
                btn.textContent = originalText;
                btn.disabled = false;
            } else {
                // Success
                showDashboard();
            }
        });
    }
});

function showDashboard() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    if (loginScreen) loginScreen.classList.remove('active');
    if (dashboardScreen) dashboardScreen.classList.add('active');

    loadStats();
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return {};
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
}

async function loadStats() {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/stats', { headers });

        if (res.status === 401 || res.status === 403) {
            alert('Session expired or unauthorized');
            logout();
            return;
        }

        const data = await res.json();

        // Fill Dashboard Cards
        const statMasters = document.getElementById('stat-masters');
        const statPremium = document.getElementById('stat-premium');
        const statBalance = document.getElementById('stat-balance');

        if (statMasters) statMasters.textContent = data.masters.total;
        if (statPremium) statPremium.textContent = data.masters.premium;
        if (statBalance) statBalance.textContent = `$${data.masters.total_balance}`;

        // Fill Table
        const tbody = document.getElementById('daily-stats-body');
        if (tbody) {
            tbody.innerHTML = '';
            if (data.stats && data.stats.length > 0) {
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
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No stats recorded yet</td></tr>';
            }
        }
    } catch (e) {
        console.error('Stats load error', e);
    }
}

window.showSection = function(id) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    const targetSection = document.getElementById(`section-${id}`);
    if (targetSection) targetSection.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    // rudimentary active state toggle
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.toLowerCase().includes(id));
    if (btn) btn.classList.add('active');

    if (id === 'config') loadConfig();
}

async function loadConfig() {
    const list = document.getElementById('config-list');
    if (!list) return;

    list.innerHTML = 'Loading...';

    try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/config', { headers });
        const data = await res.json();

        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = 'No configuration items found.';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'config-item';
            div.innerHTML = `
                <div class="config-head">
                    <strong>${item.key}</strong>
                    <small style="margin-left:10px; color:#aaa;">${item.description || ''}</small>
                </div>
                <div class="config-body">
                    <input type="text" value="${item.value}" id="val-${item.key}">
                    <button onclick="saveConfig('${item.key}')">Save</button>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (e) {
        list.innerHTML = 'Error loading config.';
    }
}

window.saveConfig = async function(key) {
    const inputVal = document.getElementById(`val-${key}`);
    if (!inputVal) return;

    const value = inputVal.value;
    const headers = await getAuthHeaders();

    const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, value })
    });

    if (res.ok) {
        alert('Saved!');
    } else {
        alert('Error saving config');
    }
};

window.lookupMaster = function() {
    const searchInput = document.getElementById('master-search');
    if (!searchInput) return;

    const id = searchInput.value;
    if (!id) return;

    const detail = document.getElementById('master-detail');
    if (detail) {
        detail.innerHTML = `
            <div class="master-card-admin">
                <h4>Master ID: ${id}</h4>
                <p style="margin: 10px 0;">Manage Premium Status:</p>
                <div style="display:flex; gap:10px;">
                    <button onclick="togglePremium('${id}', true)" style="background:#10b981; color:white; border:none; padding:8px 16px; cursor:pointer;">Set Premium</button>
                    <button onclick="togglePremium('${id}', false)" style="background:#ef4444; color:white; border:none; padding:8px 16px; cursor:pointer;">Remove Premium</button>
                </div>
            </div>
        `;
    }
};

window.togglePremium = async function(id, state) {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/masters/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, is_premium: state })
    });
    if (res.ok) alert('Updated successfully!');
    else alert('Error updating master');
};

window.logout = async function() {
    if (supabase) {
        await supabase.auth.signOut();
    }
    location.reload();
};
