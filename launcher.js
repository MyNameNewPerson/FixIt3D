import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('===================================================');
console.log('   FixIt3D - Launching System');
console.log('===================================================');

async function start() {
    try {
        // 1. Check dependencies
        if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
            console.log('[INFO] Installing dependencies, please wait...');
            execSync('npm install', { stdio: 'inherit' });
        }

        // 2. Kill process on port 3000 (Windows)
        console.log('[INFO] Preparing port 3000...');
        try {
            const netstat = execSync('netstat -aon').toString();
            const lines = netstat.split('\n');
            const line3000 = lines.find(line => line.includes(':3000') && line.includes('LISTENING'));

            if (line3000) {
                const parts = line3000.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                console.log(`[INFO] Stopping existing process (PID: ${pid})...`);
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            }
        } catch (e) {
            // Probably no process found, ignore
        }

        // 3. Open browser
        console.log('[INFO] Opening browser...');
        const startCmd = process.platform === 'win32' ? 'start' : 'open';
        setTimeout(() => {
            try {
                execSync(`${startCmd} http://localhost:3000`);
            } catch (e) {
                console.log('[WARN] Could not open browser automatically.');
            }
        }, 2000);

        // 4. Start server
        console.log('[SUCCESS] Starting server on http://localhost:3000');
        console.log('---------------------------------------------------');

        const server = spawn('node', ['server.js'], {
            stdio: 'inherit',
            shell: true
        });

        server.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.log(`\n[ERROR] Server exited with code ${code}`);
                process.exit(code);
            }
        });

    } catch (error) {
        console.error('\n[CRITICAL ERROR] Launcher failed:');
        console.error(error.message);
        process.exit(1);
    }
}

start();
