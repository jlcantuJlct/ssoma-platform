
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// El ID del archivo reciente encontrado (del log anterior)
const START_FILE_ID = '1GDgV20PrIo0E7W2C3d5Bj7rC2uPIjofO';
const TARGET_ROOT_ID = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5';

async function traceLineage() {
    console.log("=== TRAZADO DE RUTA (LINEAGE TRACE) ===");
    console.log(`Rastreando origen del archivo: ${START_FILE_ID}`);

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) return console.error('No credentials');

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(fs.readFileSync(keyPath, 'utf8')),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        let currentId = START_FILE_ID;
        let depth = 0;
        let foundTarget = false;

        console.log("\n📍 RUTA DESCUBIERTA (Desde el archivo hacia arriba):");

        while (currentId && depth < 10) {
            try {
                const res = await drive.files.get({
                    fileId: currentId,
                    fields: 'id, name, parents, webViewLink, mimeType',
                    supportsAllDrives: true
                });

                const file = res.data;
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                const icon = isFolder ? '📂' : '📄';
                const isTarget = (file.id === TARGET_ROOT_ID);

                console.log(`${"  ".repeat(depth)} ${icon} [${file.name}]`);
                console.log(`${"  ".repeat(depth)}    ID: ${file.id}`);

                if (isTarget) {
                    console.log(`${"  ".repeat(depth)}    🎯 ¡AQUI ESTA TU CARPETA OBJETIVO!`);
                    foundTarget = true;
                }

                if (file.parents && file.parents.length > 0) {
                    currentId = file.parents[0];
                    depth++;
                } else {
                    console.log(`${"  ".repeat(depth)}    ⛔ Nivel Superior (Sin padres visibles o es Root)`);
                    currentId = null;
                }

                if (foundTarget) break;

            } catch (e) {
                console.log(`❌ Error leyendo ID ${currentId}: ${e.message}`);
                break;
            }
        }

        console.log("\n===========================================");
        if (foundTarget) {
            console.log("✅ CONCLUSION: El archivo SI está dentro de tu carpeta objetivo.");
            console.log("   Está muy profundo en subcarpetas. Revisa la ruta mostrada arriba.");
        } else {
            console.log("❌ CONCLUSION: El archivo NO está en tu carpeta objetivo.");
            console.log("   Se está guardando en otro lugar (ver ruta arriba).");
        }

    } catch (error) {
        console.error('ERROR GLOBAL:', error.message);
    }
}

traceLineage();
