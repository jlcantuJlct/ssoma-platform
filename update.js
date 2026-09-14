const { Pool } = require('pg');
const url = 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: url.replace('5432', '6543'), ssl: { rejectUnauthorized: false } });

pool.query("UPDATE inspection_modules SET status = 'active' WHERE name = 'Extintores'")
    .then(() => { console.log("Extintores activated!"); pool.end(); })
    .catch(console.error);
