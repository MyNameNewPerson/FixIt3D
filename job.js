// job.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);
const INDEX_PATH = path.join('data', 'models-index.json');

async function runParser(mode = '') {
    console.log(`[${new Date().toISOString()}] Starting Thingiverse Parser (${mode})...`);
    try {
        const flag = mode === 'initial' ? '--initial' : '';
        // Prefer Node.js parser
        const { stdout, stderr } = await execPromise(`node parsers/thingiverse-parser.js ${flag}`);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`[${new Date().toISOString()}] Parser finished successfully.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Parser failed: ${error.message}`);
    }
}

async function checkAndRunInitial() {
    // Skip if running on Vercel
    if (process.env.VERCEL) {
        console.log('[job] Running on Vercel, skipping background scheduler.');
        return;
    }

    let shouldRun = false;
    let mode = 'update';

    if (!fs.existsSync(INDEX_PATH)) {
        console.log('Model index missing, triggering initial parse...');
        shouldRun = true;
        mode = 'initial';
    } else {
        const stats = fs.statSync(INDEX_PATH);
        if (stats.size < 500) {
            console.log('Model index seems empty, triggering initial parse...');
            shouldRun = true;
            mode = 'initial';
        }
    }

    if (process.argv.includes('--now')) {
        shouldRun = true;
        mode = 'initial';
    }

    if (shouldRun) {
        await runParser(mode);
    }
}

checkAndRunInitial();

// Only set interval if not on Vercel
if (!process.env.VERCEL) {
    const INTERVAL = 12 * 60 * 60 * 1000;
    setInterval(() => runParser('update'), INTERVAL);
    console.log(`FixIt3D Job Scheduler started. Updates every 12 hours.`);
}
