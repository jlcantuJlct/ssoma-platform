import client from './lib/db';

async function checkDb() {
    try {
        const rows = await client.fetchAll("SELECT objective_id, length(data_json) as len, data_json FROM annual_program");
        console.log("TOTAL ROWS:", rows.length);
        for (const r of rows) {
            console.log(r.objective_id, "-> length:", r.len);
            if (r.data_json) {
                const parsed = JSON.parse(r.data_json);
                console.log(`  Items: ${parsed.length}`);
                if (parsed.length > 0) {
                    console.log(`  First item:`, JSON.stringify(parsed[0]).substring(0, 100));
                }
            }
        }
    } catch (e) {
        console.error("DB Error:", e);
    }
}

checkDb();
