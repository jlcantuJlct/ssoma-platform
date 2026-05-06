const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

let credentials;
try {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(keyPath)) {
        credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    }
} catch (e) {}

async function searchMayFiles() {
    if (!credentials) return console.error("No creds");

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log("🕵️‍♂️ Buscando archivos de MAYO (2026-05) en Drive...");
        
        const res = await drive.files.list({
            q: "name contains 'PMA' and trashed = false",
            fields: 'files(id, name, webViewLink, createdTime)',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = res.data.files || [];
        
        // Filtrar por Mayo
        const mayFiles = files.filter(f => f.createdTime.startsWith('2026-05'));
        
        // Filtrar por Marzo/Febrero también para completar el historial
        const marchFiles = files.filter(f => f.createdTime.startsWith('2026-03'));
        const febFiles = files.filter(f => f.createdTime.startsWith('2026-02'));

        console.log(`✅ Hallazgos en Drive:`);
        console.log(`📅 MAYO: ${mayFiles.length} archivos`);
        console.log(`📅 MARZO: ${marchFiles.length} archivos`);
        console.log(`📅 FEBRERO: ${febFiles.length} archivos`);

        if (mayFiles.length > 0) {
            console.log("\nMuestra de archivos de MAYO:");
            console.log(JSON.stringify(mayFiles.slice(0, 5), null, 2));
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

searchMayFiles();
