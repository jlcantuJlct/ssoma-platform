require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function initDB() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        const query = `
            CREATE TABLE IF NOT EXISTS report_drafts (
                doc_type VARCHAR(255) PRIMARY KEY,
                fields JSONB NOT NULL DEFAULT '{}'::jsonb,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await client.query(query);
        console.log('Table report_drafts created successfully.');
    } catch (err) {
        console.error('Error initializing DB:', err);
    } finally {
        await client.end();
    }
}

initDB();
