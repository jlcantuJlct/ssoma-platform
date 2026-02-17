
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// EL NUEVO ID QUE EL USUARIO QUIERE USAR
const TARGET_FOLDER_ID = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5';

async function verifyWriteTarget() {
    console.log("=== PRUEBA DE ESCRITURA EN CARPETA NUEVA ===");
    console.log(`Intentando escribir en ID: ${TARGET_FOLDER_ID}`);

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ service-account.json no encontrado.');
            return;
        }

        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 1. INTENTAR CREAR UNA CARPETA DE PRUEBA
        const fileMetadata = {
            name: 'TEST_ROBOT_ACCESS_' + Date.now(),
            mimeType: 'application/vnd.google-apps.folder',
            parents: [TARGET_FOLDER_ID]
        };

        console.log("📂 Intentando crear carpeta de prueba...");
        const res = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name, webViewLink',
            supportsAllDrives: true
        });

        console.log(`✅ ¡ÉXITO! Se pudo escribir.`);
        console.log(`   ID Creado: ${res.data.id}`);
        console.log(`   Link: ${res.data.webViewLink}`);

        // 2. BORRARLA PARA NO ENSUCIAR
        await drive.files.delete({ fileId: res.data.id, supportsAllDrives: true });
        console.log("🧹 Carpeta de prueba borrada correctamente.");
        console.log("\nCONCLUSION: El Robot TIENE PERMISOS CORRECTOS en la nueva carpeta.");

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO: NO SE PUEDE ESCRIBIR.');
        console.error('MENSAJE:', error.message);

        if (error.message.includes('insufficientFilePermissions') || error.message.includes('notFound')) {
            console.log("\n⚠️ CAUSA PROBABLE: El Robot NO ha sido invitado a esta carpeta.");
            console.log("SOLUCIÓN: Comparte la carpeta 'Evidencias SSOMA 2026' con el email del robot:");
            console.log("📧 obot-ssoma-nuevo@ssoma-app-485301.iam.gserviceaccount.com");
            console.log("Rol: 'Editor' (o 'Organizador de contenido')");
        }
    }
}

verifyWriteTarget();
