const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function run() {
    try {
        await pool.query(
            "INSERT INTO inspection_modules (name, description, icon, status) VALUES ($1, $2, $3, $4)",
            ['Inspección de Instalaciones Eléctricas', 'Inspección de sistemas, tableros y provisionales', 'zap', 'active']
        );
        console.log('Added to inspection_modules!');
    } catch(e) { console.error(e.message); }
    pool.end();
}
run();
