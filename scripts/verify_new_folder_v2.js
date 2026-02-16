
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testDrive() {
    console.log("🔍 Verificando Acceso a la Carpeta Compartida ID: 1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5");

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) throw new Error("Falta service-account.json");

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folderId = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5';

        console.log(`📡 Conectando con Google...`);
        const folder = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, permissions'
        });

        console.log(`✅ ¡ÉXITO TOTAL! Carpeta encontrada: "${folder.data.name}"`);
        console.log("📝 Enviando archivo de prueba...");

        const upload = await drive.files.create({
            resource: {
                name: 'Prueba_Conexion_SSOMA.txt',
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: 'Conexión Correcta. El sistema ya puede cargar evidencias.'
            },
            fields: 'id, webViewLink',
        });

        console.log(`🚀 Archivo de prueba creado: ${upload.data.webViewLink}`);

    } catch (error) {
        console.error("\n❌ ERROR: Acceso denegado.");
        console.error("Asegúrate de haber compartido la carpeta con: robot-ssoma@ssoma-app-485301.iam.gserviceaccount.com");
    }
}

testDrive();
