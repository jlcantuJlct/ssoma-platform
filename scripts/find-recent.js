
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function findRecentFiles() {
    console.log("=== RASTREO DE ARCHIVOS RECIENTES ===");
    console.log("Buscando los últimos 10 archivos creados por el Robot en TODO el Drive...");

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ service-account.json no encontrado.');
            return;
        }

        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Listar archivos ordenados por fecha de creación (decendente)
        const res = await drive.files.list({
            q: "trashed=false",
            orderBy: 'createdTime desc',
            pageSize: 10,
            fields: 'files(id, name, parents, createdTime, webViewLink, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = res.data.files;

        if (files.length === 0) {
            console.log("⚠️ No se encontraron archivos recientes.");
        } else {
            console.log(`\n🔍 Encontrados ${files.length} archivos recientes:\n`);
            for (const f of files) {
                let parentName = 'RAÍZ (Sin padre)';
                if (f.parents && f.parents.length > 0) {
                    try {
                        const parent = await drive.files.get({
                            fileId: f.parents[0],
                            fields: 'name',
                            supportsAllDrives: true
                        });
                        parentName = `${parent.data.name} (${f.parents[0]})`;
                    } catch (e) {
                        parentName = `Error obteniendo nombre (${f.parents[0]})`;
                    }
                }

                console.log(`📄 [${f.name}]`);
                console.log(`   ID: ${f.id}`);
                console.log(`   Creado: ${f.createdTime}`);
                console.log(`   Tipo: ${f.mimeType}`);
                console.log(`   Carpeta Padre: ${parentName}`);
                console.log(`   Link: ${f.webViewLink}`);
                console.log("---------------------------------------------------");
            }
        }

    } catch (error) {
        console.error('❌ Error al buscar archivos:', error.message);
    }
}

findRecentFiles();
