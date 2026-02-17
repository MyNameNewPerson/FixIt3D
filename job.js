// job.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);
const INDEX_PATH = path.join('data', 'models-index.json');

if (process.env.VERCEL) {
    console.log('[INFO] Vercel detected. Job scheduler will not run background tasks.');
    process.exit(0);
}

async function runParser(mode = '') {
    console.log(`[${new Date().toISOString()}] Starting Parsers (${mode})...`);
    try {
        const flag = mode === 'initial' ? '--initial' : '';

        // Thingiverse
        console.log('Running Thingiverse Parser...');
        const thingRes = await execPromise(`python3 parsers/thingiverse-parser.py ${flag}`);
        if (thingRes.stdout) console.log(thingRes.stdout);

        // Printables
        console.log('Running Printables Parser...');
        const printRes = await execPromise(`python3 parsers/printables-parser.py`);
        if (printRes.stdout) console.log(printRes.stdout);

        console.log(`[${new Date().toISOString()}] All parsers finished successfully.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Parser failed:`, error);
    }
}

// Check if index exists or is empty, run if needed
async function checkAndRunInitial() {
    let shouldRun = false;
    let mode = 'update';

    if (!fs.existsSync(INDEX_PATH)) {
        console.log('Model index missing, triggering initial parse...');
        shouldRun = true;
        mode = 'initial';
    } else {
        const stats = fs.statSync(INDEX_PATH);
        if (stats.size < 500) { // Nearly empty
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

// Every 12 hours
const INTERVAL = 12 * 60 * 60 * 1000;
setInterval(() => runParser('update'), INTERVAL);

console.log(`FixIt3D Job Scheduler started. Parser will run updates every 12 hours.`);
