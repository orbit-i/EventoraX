// Native Node.js Multi-Core Cluster Manager
// Can be launched via `node cluster.js` to spawn worker processes across all CPU cores with automatic worker respawn.

import cluster from 'node:cluster';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numCPUs = Math.min(os.cpus().length, 8); // Scale up to 8 workers

if (cluster.isPrimary) {
  console.log(`[Eventrye Primary Cluster] Master ${process.pid} is online. Forking across ${numCPUs} CPU cores...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`[Eventrye Worker] Worker ${worker.process.pid} is ready and listening.`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[Eventrye Cluster] Worker ${worker.process.pid} died (signal: ${signal || code}). Respawning immediately...`);
    cluster.fork();
  });
} else {
  // Workers share the same TCP server connection
  import('./server.js');
}
