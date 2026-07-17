require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const result = await pool.query(`SELECT * FROM annual_program`);
        
        const activities = {};

        for (const row of result.rows) {
            if (!row.data_json) continue;
            let data = [];
            try {
                data = JSON.parse(row.data_json);
            } catch (e) { continue; }
            
            for (const item of data) {
                if (!item.description) continue;
                
                const desc = item.description.trim();
                if (!activities[desc]) {
                    activities[desc] = { 
                        Q1_P: 0, Q1_E: 0,
                        Total_P: 0, Total_E: 0
                    };
                }

                activities[desc].Total_P++;
                let isExecuted = (item.status === 'Ejecutado' || item.status === 'Completado' || item.compliance === 100 || item.compliance === 1);
                if (isExecuted) activities[desc].Total_E++;

                if (item.date && (item.date.startsWith('2026-01') || item.date.startsWith('2026-02') || item.date.startsWith('2026-03'))) {
                    activities[desc].Q1_P++;
                    if (isExecuted) activities[desc].Q1_E++;
                }
            }
        }
        
        console.log(JSON.stringify(activities, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
