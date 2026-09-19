const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    
    // Clean up old ones just in case
    await pool.query("DELETE FROM inspection_modules WHERE name = 'Inspecciones Internas SSOMA'");
    
    const resMod = await pool.query(
        "INSERT INTO inspection_modules (name, description, icon, status) VALUES ($1, $2, $3, $4) RETURNING id",
        ['Inspecciones Internas SSOMA', 'F-SIG-073 Inspecciones Internas de Seguridad', 'clipboard-list', 'active']
    );
    console.log("Inserted Module ID:", resMod.rows[0].id);

    const dummyJSON = JSON.stringify([
        { type: "title", text: "Inspecciones Internas" },
        { type: "question", text: "Dummy" }
    ]);
    
    await pool.query(
        "INSERT INTO templates_config (module_name, items_json) VALUES ($1, $2)",
        ['Inspecciones Internas SSOMA', dummyJSON]
    );
    
    console.log("DB configured!");
    pool.end();
}
run();
