
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testDrive() {
    console.log("🔍 Verificando Acceso a la Carpeta Compartida...");

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) throw new Error("Falta service-account.json");

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folderId = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl'; // NUEVO ID

        console.log(`📂 ID Carpeta: ${folderId}`);

        // Verificando acceso a la carpeta específica
        console.log("📡 Conectando con Google...");
        const folder = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, permissions'
        });

        console.log(`✅ ¡ÉXITO! Carpeta encontrada: "${folder.data.name}"`);
        console.log("📝 Intentando escribir archivo de prueba...");

        const upload = await drive.files.create({
            resource: {
                name: 'Conexion_Exitosa_Robot.txt',
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: 'La conexión entre el sistema SSOMA y esta carpeta es correcta. Fecha: ' + new Date().toISOString()
            },
            fields: 'id, webViewLink',
        });

        console.log(`🚀 Archivo subido correctamente: ${upload.data.webViewLink}`);
        console.log("✅ El sistema está listo para recibir evidencias.");

    } catch (error) {
        console.error("\n❌ ERROR DE VERIFICACIÓN:");
        console.error(error.message);
        console.log("\n⚠️ Asegúrate de haber compartido la carpeta con:");
        console.log("robot-ssoma@ssoma-app-485301.iam.gserviceaccount.com");
    }
}

testDrive();
