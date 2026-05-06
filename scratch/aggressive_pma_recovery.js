const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// 1. Conexiones
const localDb = new Database(path.join(process.cwd(), 'ssoma.db'));
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function aggressiveRecovery() {
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
        console.log("🕵️‍♂️ Escaneo AGRESIVO de Drive (Abril completo)...");
        
        const res = await drive.files.list({
            q: "name contains 'PMA' and trashed = false",
            fields: 'files(id, name, webViewLink, createdTime)',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const driveFiles = res.data.files || [];
        
        // 2. Obtener TODOS los registros de Abril de la DB (Locales y Nube)
        const emptyRecords = localDb.prepare(`
            SELECT * FROM pma_evidence_records 
            WHERE date LIKE '2026-04%'
        `).all();

        console.log(`📋 Analizando ${emptyRecords.length} registros de Abril...`);

        let recovered = 0;
        const pgClient = await pool.connect();

        for (const record of emptyRecords) {
            const initials = record.responsible.split(' ').map(n => n[0]).join('').toUpperCase();
            const recordDate = record.date.substring(0, 10);

            // Búsqueda flexible: Fecha + Iniciales O Fecha + Primer Nombre
            const firstName = record.responsible.split(' ')[0].toUpperCase();

            const matches = driveFiles.filter(f => {
                const fn = f.name.toUpperCase();
                const hasDate = fn.includes(recordDate);
                const hasInitials = fn.includes(`_${initials}_`);
                const hasName = fn.includes(firstName);
                return hasDate && (hasInitials || hasName);
            });

            if (matches.length > 0) {
                const urls = matches.map(m => m.webViewLink);
                
                // Actualizar Local
                localDb.prepare(`UPDATE pma_evidence_records SET images = ? WHERE id = ?`)
                       .run(JSON.stringify(urls), record.id);
                
                // Actualizar Vercel Postgres
                await pgClient.query(
                    `UPDATE pma_evidence_records SET images = $1 WHERE id = $2`,
                    [JSON.stringify(urls), record.id]
                );
                
                console.log(`✨ [OK] ${recordDate} - ${record.responsible}: ${urls.length} fotos.`);
                recovered++;
            }
        }

        console.log(`\n✅ Recuperación completada: ${recovered} registros actualizados.`);
        pgClient.release();
        await pool.end();

    } catch (err) {
        console.error("Error:", err.message);
    }
}

aggressiveRecovery();
