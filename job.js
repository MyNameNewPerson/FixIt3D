// job.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

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

// Check for --now flag
if (process.argv.includes('--now')) {
    runParser();
}

// Every 12 hours
const INTERVAL = 12 * 60 * 60 * 1000;
setInterval(runParser, INTERVAL);

console.log(`FixIt3D Job Scheduler started. Parser will run every 12 hours.`);
console.log(`Use "node job.js --now" to run it immediately.`);
