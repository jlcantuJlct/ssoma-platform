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

        const tagsToDelete = ['foto_001', 'foto_022', 'foto_023', 'foto_033'];
        let deletedCount = 0;

        for (const tag of tagsToDelete) {
            if (fields[tag]) {
                delete fields[tag];
                delete fields[`_uploaderInitials_${tag}`];
                delete fields[`_uploaderName_${tag}`];
                deletedCount++;
                console.log(`Deleted ${tag}`);
            }
        }

        if (deletedCount > 0) {
            await pool.query(`UPDATE report_drafts SET fields = $1 WHERE doc_type = $2`, [JSON.stringify(fields), docType]);
            console.log(`Successfully removed ${deletedCount} photos from Chinchaysullo draft.`);
        } else {
            console.log('None of the specified photos were found in the draft.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

main();
