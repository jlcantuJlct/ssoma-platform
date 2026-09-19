const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function run() {
  try {
    const res = await pool.query("SELECT items_json FROM templates_config WHERE id = 12");
    let items = JSON.parse(res.rows[0].items_json);
    
    // Find index of "Candado, tenaza..."
    const idx = items.findIndex(item => item.text && item.text.includes("Candado, tenaza"));
    
    if (idx !== -1) {
        // Insert missing item before it
        items.splice(idx, 0, {
            text: "Herramientas manuales, eléctricas y/o equipos portátiles han sido inspeccionadas y cuentan con la cinta de inspección correspondiente al color del mes y en caso de defectuosas genera el (F-OP-019) Verificación de Herramientas Manuales, Eléctricas y Equipos Portátiles",
            type: "question"
        });
        
        await pool.query("UPDATE templates_config SET items_json = $1 WHERE id = 12", [JSON.stringify(items)]);
        console.log("Updated items_json in DB.");
    } else {
        console.log("Could not find anchor item.");
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
