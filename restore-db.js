
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@vercel/postgres');
const fs = require('fs');

(async () => {
    const client = createClient();
    await client.connect();
    
    const fields = require('./recovered_fields.json');
    const docType = 'PAD_SAN_CLEMENTE_INTERNAL.docx';
    
    await client.query('DELETE FROM drafts WHERE doc_type = ', [docType]);
    
    await client.query(
        'INSERT INTO drafts (doc_type, fields) VALUES (, )',
        [docType, JSON.stringify(fields)]
    );
    
    console.log('Restaurado exitosamente en Postgres');
    process.exit(0);
})();
