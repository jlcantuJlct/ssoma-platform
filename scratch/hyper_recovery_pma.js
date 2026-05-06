const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const localDb = new Database(path.join(process.cwd(), 'ssoma.db'));
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function hyperRecovery() {
    let credentials;
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(keyPath)) {
            credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        }
    } catch (e) {}

    if (!credentials) return console.error("No creds");

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log("🕵️‍♂️ Iniciando SÚPER-ESCANEO de Drive (Feb - Mayo)...");
        
        const res = await drive.files.list({
            q: "trashed = false",
            fields: 'files(id, name, webViewLink, createdTime, parents)',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const driveFiles = res.data.files || [];
        console.log(`📂 Archivos analizados en Drive: ${driveFiles.length}`);

        const emptyRecords = localDb.prepare(`
            SELECT * FROM pma_evidence_records 
            WHERE images = '[]' OR images IS NULL
        `).all();

        console.log(`📋 Registros vacíos detectados: ${emptyRecords.length}`);

        let recovered = 0;
        const pgClient = await pool.connect();

        for (const record of emptyRecords) {
            const initials = record.responsible.split(' ').map(n => n[0]).join('').toUpperCase();
            const recordDate = (record.date || "").substring(0, 10);
            if (!recordDate) continue;

            const firstName = record.responsible.split(' ')[0].toUpperCase();

            const matches = driveFiles.filter(f => {
                const fn = f.name.toUpperCase();
                const ct = (f.createdTime || "").substring(0, 10);
                
                const dateInName = fn.includes(recordDate.replace(/-/g, ''));
                const dateFullInName = fn.includes(recordDate);
                const dateInCreated = ct === recordDate;
                
                const hasInitials = fn.includes(initials);
                const hasName = fn.includes(firstName);

                return (dateInName || dateFullInName || dateInCreated) && (hasInitials || hasName);
            });

            if (matches.length > 0) {
                const urls = matches.map(m => m.webViewLink);
                
                localDb.prepare(`UPDATE pma_evidence_records SET images = ? WHERE id = ?`)
                       .run(JSON.stringify(urls), record.id);
                
                await pgClient.query(
                    `UPDATE pma_evidence_records SET images = $1 WHERE id = $2`,
                    [JSON.stringify(urls), record.id]
                );
                
                console.log(`✨ [RESTORED] ${recordDate} - ${record.responsible}: ${urls.length} fotos.`);
                recovered++;
            }
        }

        console.log(`\n✅ Proceso completado. ${recovered} registros rescatados.`);
        pgClient.release();
        await pool.end();

    } catch (err) {
        console.error("Error:", err.message);
    }
}

hyperRecovery();
