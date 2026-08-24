// Production launcher: forces NODE_ENV=production so the server serves the
// static dist/ bundle (NO Vite dev middleware, NO live-reload refreshes).
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
require('./dist/server.cjs');
