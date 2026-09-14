require('dotenv').config({path: '.env.local'});
const { default: db } = require('./lib/db.ts'); 
async function run(){ 
    try {
        const res = await db.execute(`SELECT version, items_json FROM templates_config WHERE module_name = 'Botiquines' ORDER BY version DESC LIMIT 1`); 
        console.log(res.rows[0].items_json.substring(0, 1000)); 
        process.exit(0); 
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
} 
run();
