
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function testUpload() {
    console.log("1. Buscando credenciales...");
    const keyPath = path.join(process.cwd(), 'service-account.json');

    if (!fs.existsSync(keyPath)) {
        console.error("❌ ERROR: No encuentro el archivo service-account.json en " + process.cwd());
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // ID de la carpeta compartido por el usuario
    const folderId = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl';

    console.log(`2. Intentando subir archivo de prueba a la carpeta: ${folderId}`);

    try {
        const res = await drive.files.create({
            requestBody: {
                name: 'Prueba_Conexion_SSOMA.txt',
                parents: [folderId], // Intenta guardar DIRECTAMENTE en la carpeta
            },
            media: {
                mimeType: 'text/plain',
                body: 'Si puedes leer esto, la conexión del Robot SSOMA funciona correctamente.',
            },
        });

        console.log("✅ ¡ÉXITO! Archivo creado.");
        console.log("ID del archivo:", res.data.id);
        console.log("Nombre:", res.data.name);
        console.log("Por favor revisa tu carpeta de Google Drive, debería haber un archivo de texto nuevo.");

    } catch (error) {
        console.error("❌ ERROR AL SUBIR:");
        console.error(error.message);

        if (error.message.includes('File not found') || error.message.includes('Permission')) {
            console.log("\n--- DIAGNÓSTICO ---");
            console.log("El robot NO PUEDE VER la carpeta.");
            console.log("Probablemente olvidaste compartir la carpeta con el robot.");
            console.log("Corre para compartir: robot-ssoma@ssoma-app-485301.iam.gserviceaccount.com");
        }
    }
}

testUpload();
