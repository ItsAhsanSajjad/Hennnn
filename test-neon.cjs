require('dotenv/config');
const { neonConfig, Pool } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const t = setTimeout(() => { console.error('HUNG: no DB response in 25s'); process.exit(2); }, 25000);
pool.query('select 1 as ok')
  .then(r => { clearTimeout(t); console.log('SUCCESS', r.rows); process.exit(0); })
  .catch(e => { clearTimeout(t); console.error('ERROR:', e.message); process.exit(1); });
