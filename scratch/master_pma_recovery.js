const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// 1. Cargar DB
const db = new Database(path.join(process.cwd(), 'ssoma.db'));

// 2. Cargar Credenciales
let credentials;
try {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(keyPath)) {
        credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    }
} catch (e) {}

const initialMap = {
    'JGM': 'Jose Galliquio Montesinos',
    'BJPV': 'Brayan Jeanpool Peña Villafuerte',
    'ASS': 'Adrian Suarez Soto',
    'JLC': 'Jose Luis Cancino',
    'JVL': 'Jesus Villalobos Levano'
};

async function masterRecovery() {
    if (!credentials) {
        console.error("❌ Error: No se encontró service-account.json");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log("🕵️‍♂️ Escaneando Drive en busca de archivos PMA...");
        
        // Buscamos archivos del mes de abril
        const res = await drive.files.list({
            q: "name contains 'PMA' and trashed = false",
            fields: 'files(id, name, webViewLink, createdTime)',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const driveFiles = res.data.files || [];
        console.log(`✅ Se analizaron ${driveFiles.length} archivos en la nube.`);

        // 3. Obtener registros vacíos de la DB
        const emptyRecords = db.prepare(`
            SELECT * FROM pma_evidence_records 
            WHERE (images IS NULL OR images = '' OR images = '[]')
            AND date LIKE '2026-04%'
        `).all();

        console.log(`📋 Registros vacíos de Abril detectados: ${emptyRecords.length}`);

        let totalRecovered = 0;

        for (const record of emptyRecords) {
            // Generar iniciales del responsable del registro
            const initials = record.responsible.split(' ').map(n => n[0]).join('').toUpperCase();
            const recordDate = record.date.substring(0, 10); // YYYY-MM-DD

            // Buscar archivos que coincidan
            const matches = driveFiles.filter(f => {
                const fileName = f.name.toUpperCase();
                // El nombre del archivo debe contener la fecha Y las iniciales
                return fileName.includes(recordDate) && fileName.includes(`_${initials}_`);
            });

            if (matches.length > 0) {
                const urls = matches.map(m => m.webViewLink);
                console.log(`✨ Recuperando ${urls.length} fotos para: ${record.responsible} (${recordDate})`);
                
                db.prepare(`UPDATE pma_evidence_records SET images = ? WHERE id = ?`)
                  .run(JSON.stringify(urls), record.id);
                
                totalRecovered++;
            }
        }

        console.log(`\n🎉 ¡OPERACIÓN EXITOSA!`);
        console.log(`✅ Registros restaurados: ${totalRecovered}`);
        console.log(`⚠️ Registros que aún faltan: ${emptyRecords.length - totalRecovered}`);
        console.log(`\nLos registros recuperados aparecerán en tu plataforma en unos instantes.`);

    } catch (err) {
        console.error("❌ Error en la recuperación:", err.message);
    }
}

masterRecovery();
