
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_PATH = path.join(__dirname, '../service-account.json');
const TARGET_ROOT_ID = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5'; // Carpeta Nueva (Evidencias SSOMA 2026)
const TEST_STRUCTURE = 'PRUEBA_ROBOT/ESTRUCTURA_TEST/FEBRERO';

async function forceCreateStructure() {
    console.log("🛠️ PRUEBA DE CREACIÓN DE ESTRUCTURA");
    console.log(`📂 Root ID: ${TARGET_ROOT_ID}`);
    console.log(`🛤️ Ruta a crear: ${TEST_STRUCTURE}`);

    if (!fs.existsSync(KEY_PATH)) {
        console.error("❌ No se encontró service-account.json");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_PATH,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        const parts = TEST_STRUCTURE.split('/');
        let currentParentId = TARGET_ROOT_ID;

        for (const part of parts) {
            console.log(`\n🔎 Procesando: '${part}' en padre '${currentParentId}'...`);

            // 1. Buscar si existe
            const q = `mimeType='application/vnd.google-apps.folder' and name='${part}' and '${currentParentId}' in parents and trashed=false`;
            const res = await drive.files.list({
                q: q,
                fields: 'files(id, name)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (res.data.files.length > 0) {
                console.log(`   ✅ Ya existe. ID: ${res.data.files[0].id}`);
                currentParentId = res.data.files[0].id;
            } else {
                console.log(`   📂 No existe. Intentando crear...`);
                const fileMetadata = {
                    name: part,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [currentParentId]
                };
                try {
                    const newFolder = await drive.files.create({
                        requestBody: fileMetadata,
                        fields: 'id',
                        supportsAllDrives: true
                    });
                    console.log(`   ✨ ¡CREADO CON ÉXITO! ID: ${newFolder.data.id}`);
                    currentParentId = newFolder.data.id;
                } catch (createErr) {
                    console.error("   ❌ ERROR CRÍTICO AL CREAR:");
                    console.error("      " + createErr.message);
                    console.error("\n   ⚠️ DIAGNÓSTICO: El Robot NO tiene permisos de 'Editor' en la carpeta padre.");
                    console.error("   👉 SOLUCIÓN: Asegúrate de que el Robot sea EDITOR en la carpeta Root y todas las subcarpetas.");
                    return;
                }
            }
        }
        console.log("\n✅✅ PRUEBA EXITOSA: El Robot PUEDE crear carpetas.");

    } catch (error) {
        console.error("❌ Error general:", error.message);
    }
}

forceCreateStructure();
