// Frees port 3000 (or PORT env) by killing whatever is listening on it.
// Usage: npm run freeport  ->  then start whichever server you want.
const { execSync } = require('child_process');

const port = process.env.PORT || '3000';

try {
  const out = execSync(`netstat -aon -p tcp`).toString();
  const pids = new Set();

  for (const line of out.split('\n')) {
    const cols = line.trim().split(/\s+/);
    // TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
    if (
      cols.length >= 5 &&
      (cols[1] === `0.0.0.0:${port}` || cols[1] === `[::]:${port}` || cols[1] === `127.0.0.1:${port}`) &&
      cols[3] === 'LISTENING'
    ) {
      pids.add(cols[4]);
    }
  }

  if (pids.size === 0) {
    console.log(`Port ${port} is already free.`);
  } else {
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`);
        console.log(`Killed PID ${pid} (was holding port ${port}).`);
      } catch {
        console.warn(`Could not kill PID ${pid}; close it manually from Task Manager.`);
      }
    }
  }
} catch (err) {
  console.error('Failed to inspect ports:', err.message);
}
