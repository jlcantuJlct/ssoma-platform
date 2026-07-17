require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        let res = await pool.query(`SELECT id, record_id, date, images FROM desvio_evidence_records`);
        console.log(`Found ${res.rows.length} records.`);
        
        let uniqueImages = new Set();
        let totalPhotos = 0;
        
        for (let r of res.rows) {
            try {
                let imgs = JSON.parse(r.images);
                totalPhotos += imgs.length;
                imgs.forEach(i => uniqueImages.add(i));
            } catch(e){}
        }
        console.log(`Total records: ${res.rows.length}`);
        console.log(`Total photos: ${totalPhotos}`);
        console.log(`Unique photos: ${uniqueImages.size}`);
        
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
