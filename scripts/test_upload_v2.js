
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

async function testUploadV2() {
    console.log("🚀 INICIANDO PRUEBA DE SUBIDA V2 (SupportsAllDrives)...");

    // 1. Configurar Auth
    const keyPath = path.join(process.cwd(), 'service-account.json');
    if (!fs.existsSync(keyPath)) {
        console.error("❌ No existe service-account.json");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 2. Datos de prueba
    const folderId = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl'; // Carpeta del usuario
    const fileName = 'Prueba_Final_Robot.txt';
    const content = 'Esta es una prueba de subida con supportsAllDrives: true';

    try {
        console.log(`📂 Intentando subir a carpeta: ${folderId}`);

        // Crear stream
        const stream = Readable.from(Buffer.from(content));

        const res = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: stream
            },
            fields: 'id, webViewLink, owners',
            supportsAllDrives: true // <--- LA CLAVE
        });

        console.log("✅ ¡ÉXITO ROTUNDO!");
        console.log(`📄 ID: ${res.data.id}`);
        console.log(`🔗 Link: ${res.data.webViewLink}`);
        console.log(`👤 Owner: ${res.data.owners?.[0]?.emailAddress}`);

    } catch (error) {
        console.error("\n❌ ERROR FINAL:");
        console.error(error.message);
        if (error.response?.data?.error) {
            console.error("Detalle:", JSON.stringify(error.response.data.error, null, 2));
        }
    }
}

testUploadV2();
