const { createPool } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function extract() {
    const pool = createPool({
        connectionString: process.env.POSTGRES_URL,
    });

    console.log("Conectando a Postgres...");
    
    try {
        // Buscar actividades de los objetivos de inspección
        // Primero buscamos los IDs de los objetivos
        const objectives = await pool.query("SELECT id, name FROM objectives WHERE name ILIKE '%inspecci%'");
        console.log("Objetivos encontrados:", objectives.rows.map(o => o.name));

        if (objectives.rows.length > 0) {
            const ids = objectives.rows.map(o => o.id);
            const activities = await pool.query("SELECT name, objective_id, area FROM activities WHERE objective_id = ANY($1)", [ids]);
            
            const results = {};
            activities.rows.forEach(row => {
                if (!results[row.objective_id]) results[row.objective_id] = [];
                results[row.objective_id].push(row.name);
            });
            console.log("ACTIVITIES BY OBJECTIVE:");
            console.log(JSON.stringify(results, null, 2));
        }

        // También revisar annual_program por si acaso
        const annual = await pool.query("SELECT objective_id, data_json FROM annual_program WHERE objective_id IN ('obj3', 'obj6', 'obj8', 'obj10', 'obj11')");
        if (annual.rows.length > 0) {
            console.log("ANNUAL_PROGRAM DATA:");
            annual.rows.forEach(r => {
                const data = JSON.parse(r.data_json);
                const unique = [...new Set(data.map(i => i.description))];
                console.log(`Objective ${r.objective_id}:`, JSON.stringify(unique, null, 2));
            });
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

extract();
