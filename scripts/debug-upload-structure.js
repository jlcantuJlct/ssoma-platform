
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Mismo ID que configuramos
const ROOT_FOLDER_ID = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5";
const TEST_PATH = "SEGURIDAD/DEBUGGING/PRUEBA_ESTRUCTURA";

// Credenciales
function getCredentials() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(keyPath)) {
            const creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            return {
                client_email: creds.client_email,
                private_key: creds.private_key
            };
        }
    } catch (e) {
        console.error("Error leyendo credenciales:", e);
    }
    return null;
}

// LOGIC FROM LIB/GOOGLEDRIVE.TS (Simplified for debug)
async function ensureDriveFolderHierarchy(drive, parentId, pathStr) {
    const parts = pathStr.split('/').filter(p => p.trim() !== '');
    let currentParentId = parentId;

    console.log(`\n🔍 Navegando ruta: '${pathStr}' desde raíz '${parentId}'`);

    for (const part of parts) {
        // Query exacto que usa el codigo
        const query = `mimeType='application/vnd.google-apps.folder' and name='${part}' and '${currentParentId}' in parents and trashed=false`;

        console.log(`   > Buscando carpeta '${part}' en parent '${currentParentId}'...`);

        try {
            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (res.data.files && res.data.files.length > 0) {
                console.log(`     ✅ Encontrada: ${res.data.files[0].id}`);
                currentParentId = res.data.files[0].id;
            } else {
                console.log(`     📂 No existe. CREANDO '${part}'...`);
                const folderMetadata = {
                    name: part,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [currentParentId]
                };
                const newFolder = await drive.files.create({
                    requestBody: folderMetadata,
                    fields: 'id',
                    supportsAllDrives: true
                });
                console.log(`     ✨ CREADA: ${newFolder.data.id}`);
                currentParentId = newFolder.data.id;
            }
        } catch (opErr) {
            console.error(`     ❌ ERROR CRITICO operando carpeta '${part}':`, opErr.message);
            throw opErr;
        }
    }
    return currentParentId;
}

async function runTest() {
    const credentials = getCredentials();
    if (!credentials) {
        console.error("❌ No hay credenciales.");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log("=== INICIANDO TEST DE ESTRUCTURA ===");
        const finalId = await ensureDriveFolderHierarchy(drive, ROOT_FOLDER_ID, TEST_PATH);
        console.log("\nRESULTADO FINAL:");
        console.log(`ID Destino: ${finalId}`);
        console.log(`ID Raiz:    ${ROOT_FOLDER_ID}`);

        if (finalId === ROOT_FOLDER_ID) {
            console.error("❌ FALLO: El ID final es igual al Root. No se navegaron las carpetas.");
        } else {
            console.log("✅ EXITO: El ID final es diferente al Root (se creó subcarpeta).");
        }

    } catch (error) {
        console.error("❌ Error General:", error);
    }
}

runTest();
