
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testDrive() {
    console.log("🔍 Probando Acceso a Google Drive...");

    try {
        // Credenciales desde archivo local
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            throw new Error("No se encuentra service-account.json");
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Intentar listar archivos para verificar auth
        const res = await drive.files.list({
            pageSize: 5,
            fields: 'files(id, name)',
        });

        console.log("✅ Autenticación Exitosa. Archivos visibles por el Robot:");
        res.data.files.forEach(f => console.log(` - ${f.name} (${f.id})`));

        // Intentar subir un archivo de prueba
        console.log("\n⬆️ Intentando subir archivo de prueba...");
        const folderId = '1P1rpHQ70Ri-tky27S1PTTWCfrpHQ70Ri'; // El ID hardcoded

        const fileMetadata = {
            name: 'Test_Conexion_Robot.txt',
            parents: [folderId]
        };
        const media = {
            mimeType: 'text/plain',
            body: 'Hola, soy el Robot SSOMA verificando permisos.',
        };

        const upload = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        console.log(`✅ SUBIDA EXITOSA: ${upload.data.webViewLink}`);
        console.log("🎉 El sistema de Drive está operativo.");

    } catch (error) {
        console.error("\n❌ ERROR DE CONEXIÓN CON DRIVE:");
        console.error(error.message);

        if (error.message.includes('permission') || error.code === 403) {
            console.log("\n⚠️ CAUSA PROBABLE: El Robot no tiene permiso en la carpeta.");
            console.log("👉 SOLUCIÓN: Comparte tu carpeta de Drive con este email:");
            console.log("   robot-ssoma@ssoma-app-485301.iam.gserviceaccount.com");
        }
    }
}

testDrive();
