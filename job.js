// job.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);
const INDEX_PATH = path.join('data', 'models-index.json');

async function runParser() {
    console.log(`[${new Date().toISOString()}] Starting Thingiverse Parser...`);
    try {
        const { stdout, stderr } = await execPromise('python3 parsers/thingiverse-parser.py');
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`[${new Date().toISOString()}] Parser finished successfully.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Parser failed:`, error);
    }
}

// Check if index exists or is empty, run if needed
async function checkAndRunInitial() {
    let shouldRun = false;
    if (!fs.existsSync(INDEX_PATH)) {
        console.log('Model index missing, triggering initial parse...');
        shouldRun = true;
    } else {
        const stats = fs.statSync(INDEX_PATH);
        if (stats.size < 100) { // Nearly empty
            console.log('Model index seems empty, triggering initial parse...');
            shouldRun = true;
        }
    }

    if (shouldRun || process.argv.includes('--now')) {
        await runParser();
    }
}

checkAndRunInitial();

// Every 12 hours
const INTERVAL = 12 * 60 * 60 * 1000;
setInterval(runParser, INTERVAL);

console.log(`FixIt3D Job Scheduler started. Parser will run every 12 hours.`);
