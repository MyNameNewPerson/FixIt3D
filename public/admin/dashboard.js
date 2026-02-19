import { createClient } from '@supabase/supabase-js';

// Load Supabase configuration
// For admin panel usage, we need the public anon key to initiate auth flow.
// However, the backend API will verify the token using its service role logic or just standard JWT verification.
// Wait, we are in a static JS file here. We can't use process.env.
// We'll rely on the user to replace these or fetch them.
// But wait, the user provided the URL and Key in the prompt.
// URL: https://ggrdkycsnxirzcuuxlea.supabase.co
// Key: sb_publishable_KOJIELK08yqV0jKpbWyVNg_q7UngE3u
// This is likely a placeholder key structure or a real one. We will use it.

const SUPABASE_URL = 'https://ggrdkycsnxirzcuuxlea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KOJIELK08yqV0jKpbWyVNg_q7UngE3u';

let supabase;

document.addEventListener('DOMContentLoaded', async () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error('Supabase SDK not loaded');
        return;
    }

    // check session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        showDashboard();
    } else {
        // Show login
        document.getElementById('login-screen').classList.add('active');
    }

    // Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');
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
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
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
        document.getElementById('stat-masters').textContent = data.masters.total;
        document.getElementById('stat-premium').textContent = data.masters.premium;
        document.getElementById('stat-balance').textContent = `$${data.masters.total_balance}`;

        // Fill Table
        const tbody = document.getElementById('daily-stats-body');
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
    } catch (e) {
        console.error('Stats load error', e);
    }
}

window.showSection = function(id) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.getElementById(`section-${id}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    // rudimentary active state toggle
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.toLowerCase().includes(id));
    if (btn) btn.classList.add('active');

    if (id === 'config') loadConfig();
}

async function loadConfig() {
    const list = document.getElementById('config-list');
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
    const value = document.getElementById(`val-${key}`).value;
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
    const id = document.getElementById('master-search').value;
    if (!id) return;

    const detail = document.getElementById('master-detail');
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
    await supabase.auth.signOut();
    location.reload();
};
