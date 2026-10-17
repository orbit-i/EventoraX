// PM2 Production Cluster Ecosystem Configuration
// Enables multi-process concurrency, automatic load balancing across CPU cores, zero-downtime rolling reloads, and self-healing restarts.

module.exports = {
  apps: [
    {
      name: 'eventorax-api-cluster',
      script: './server.js',
      instances: 'max', // Scales automatically across all available CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      // Rolling reload settings
      listen_timeout: 8000,
      kill_timeout: 5000,
      wait_ready: true,
      restart_delay: 2000,
      exp_backoff_restart_delay: 100,
      // Logging
      error_file: './logs/pm2-cluster-err.log',
      out_file: './logs/pm2-cluster-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
