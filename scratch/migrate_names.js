
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function migrateNames() {
    console.log("Iniciando migración de nombres en el Programa Anual...");
    
    // Lista oficial
    const officialNames = [
        "Jose Luis Cancino Tueros",
        "Jose Galliquio Montesinos",
        "Albert Chuquispuma P.",
        "Jesus Villalovos V.",
        "Adrian Suarez L.",
        "Fabricio Galvez L.",
        "Benjy Vega E.",
        "Gladis Aroste C.",
        "Gerencia General"
    ];

    try {
        const records = await sql`SELECT * FROM annual_program`;
        let totalUpdates = 0;

        for (const row of records) {
            let changed = false;
            let items = [];
            try {
                items = JSON.parse(row.data_json);
            } catch(e) { continue; }

            items = items.map(item => {
                const rName = (item.responsible || item.responsable || '').toLowerCase();
                if (!rName) return item;

                let bestMatch = null;

                // Intentar buscar match
                for (const official of officialNames) {
                    const offLower = official.toLowerCase();
                    const offFirst = offLower.split(' ')[0];
                    const rFirst = rName.split(' ')[0];

                    if (offLower === rName || offLower.includes(rName) || rName.includes(offLower)) {
                        bestMatch = official;
                        break;
                    }
                    if ((offFirst === 'gladis' || offFirst === 'gladys') && (rFirst === 'gladis' || rFirst === 'gladys')) {
                        bestMatch = 'Gladis Aroste C.';
                        break;
                    }
                }

                if (bestMatch && (item.responsible !== bestMatch)) {
                    item.responsible = bestMatch;
                    item.responsable = bestMatch;
                    changed = true;
                    totalUpdates++;
                }

                return item;
            });

            if (changed) {
                await sql`UPDATE annual_program SET data_json = ${JSON.stringify(items)} WHERE id = ${row.id}`;
            }
        }

        console.log(`✅ Migración completada. ${totalUpdates} registros actualizados al formato oficial.`);
    } catch (e) {
        console.error("Error en la migración:", e);
    }
}

migrateNames();
