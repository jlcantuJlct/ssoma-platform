require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const docType = 'PAD_CHINCHAYSULLO_INTERNAL.docx';
        const result = await pool.query(`SELECT fields FROM report_drafts WHERE doc_type = $1`, [docType]);
        
        if (result.rows.length === 0) {
            console.log('No draft found for Chinchaysullo');
            return;
        }

        let fields = result.rows[0].fields;
        if (typeof fields === 'string') {
            fields = JSON.parse(fields);
        }

        const imageKeys = Object.keys(fields).filter(k => k.toLowerCase().includes('foto'));
        console.log("Images found in DB:");
        console.dir(imageKeys, { maxArrayLength: null });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

main();
