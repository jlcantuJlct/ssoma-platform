
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TARGET_ID = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5'; // La Carpeta Nueva del Usuario
const MYSTERY_ID = '1Gyeof5X70I1W78pJcldXLuisIlq8VyP-'; // Donde aparecieron los archivos de hace 30m

async function checkFolders() {
    console.log("=== INSPECCIÓN DE CARPETAS ===");

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) return console.error('No credentials');
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(fs.readFileSync(keyPath, 'utf8')),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // 1. Check TARGET Folder
        console.log(`\n📂 1. Verificando CARPETA OBJETIVO (${TARGET_ID})...`);
        try {
            const res = await drive.files.list({
                q: `'${TARGET_ID}' in parents and trashed=false`,
                fields: 'files(id, name, createdTime, mimeType)',
                orderBy: 'createdTime desc',
                pageSize: 5,
                supportsAllDrives: true, includeItemsFromAllDrives: true
            });
            console.log(`   Items encontrados: ${res.data.files.length}`);
            res.data.files.forEach(f => console.log(`   - ${f.createdTime}: ${f.name} (${f.id})`));
        } catch (e) { console.log(`   ❌ Error leyendo Target: ${e.message}`); }

        // 2. Check MYSTERY Folder
        console.log(`\n👻 2. Verificando CARPETA MISTERIOSA (${MYSTERY_ID})...`);
        try {
            const res = await drive.files.list({
                q: `'${MYSTERY_ID}' in parents and trashed=false`,
                fields: 'files(id, name, createdTime)',
                orderBy: 'createdTime desc',
                pageSize: 5,
                supportsAllDrives: true, includeItemsFromAllDrives: true
            });

            // Get Name of Mystery Folder
            const meta = await drive.files.get({ fileId: MYSTERY_ID, fields: 'name, webViewLink', supportsAllDrives: true });
            console.log(`   Nombre Real: "${meta.data.name}"`);
            console.log(`   Link: ${meta.data.webViewLink}`);
            console.log(`   Items encontrados: ${res.data.files.length}`);
            res.data.files.forEach(f => console.log(`   - ${f.createdTime}: ${f.name}`));
        } catch (e) { console.log(`   ❌ Error leyendo Mystery: ${e.message}`); }

    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

checkFolders();
