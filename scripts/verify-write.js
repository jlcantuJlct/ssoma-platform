
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Hardcoded ID from the issue context
const ROOT_FOLDER_ID = '1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I';

async function verifyWriteAccess() {
    console.log("=== INICIANDO PRUEBA DE ESCRITURA (WRITE TEST) ===");

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ Error: service-account.json no encontrado.');
            return;
        }

        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            // USANDO LOS MISMOS SCOPES QUE PUSIMOS EN EL ARREGLO
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.readonly'
            ],
        });

        const drive = google.drive({ version: 'v3', auth });

        console.log(`🔐 Autenticado como: ${credentials.client_email}`);
        console.log(`📂 Intentando crear una carpeta de prueba dentro de: ${ROOT_FOLDER_ID}...`);

        const folderMetadata = {
            name: 'TEST_DEBUG_ANTIGRAVITY_' + Date.now(),
            mimeType: 'application/vnd.google-apps.folder',
            parents: [ROOT_FOLDER_ID]
        };

        const res = await drive.files.create({
            requestBody: folderMetadata,
            fields: 'id, name, webViewLink',
            supportsAllDrives: true
        });

        console.log(`✅ ¡ÉXITO! Carpeta creada.`);
        console.log(`   Nombre: ${res.data.name}`);
        console.log(`   ID: ${res.data.id}`);
        console.log(`   Link: ${res.data.webViewLink}`);
        console.log("\n🧹 Limpiando (borrando carpeta de prueba)...");

        await drive.files.delete({
            fileId: res.data.id,
            supportsAllDrives: true
        });
        console.log("✅ Carpeta de prueba eliminada correctamente.");
        console.log("\nCONCLUSIÓN: La cuenta de servicio TIENE permisos de escritura correctos.");

    } catch (error) {
        console.error('\n❌ ERROR FATAL:', error.message);
        if (error.response) {
            console.error('   Detalles:', JSON.stringify(error.response.data, null, 2));
        }
        console.log("\nCONCLUSIÓN: La cuenta de servicio NO tiene permisos de escritura o el ID de la carpeta es incorrecto.");
    }
}

verifyWriteAccess();
