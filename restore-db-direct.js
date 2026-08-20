require('dotenv').config({ path: '.env.production' });
const { Client } = require('pg');
const fs = require('fs');

(async () => {
    const client = new Client({ connectionString: process.env.POSTGRES_URL });
    await client.connect();
    
    const fields = require('./recovered_fields.json');
    const docType = 'PAD_SAN_CLEMENTE_INTERNAL.docx';
    
    await client.query('DELETE FROM drafts WHERE doc_type = $1', [docType]);
    
    await client.query(
        'INSERT INTO drafts (doc_type, fields) VALUES ($1, $2)',
        [docType, JSON.stringify(fields)]
    );
    
    console.log('Restaurado exitosamente en Postgres mediante pg directo');
    process.exit(0);
})();
