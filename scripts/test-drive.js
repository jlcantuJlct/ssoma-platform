
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function testDriveConnection() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ Error: service-account.json no encontrado.');
            return;
        }

        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Intentar listar archivos para verificar acceso
        const res = await drive.files.list({
            pageSize: 5,
            fields: 'files(id, name)',
        });

        console.log('✅ Conexión exitosa a Google Drive.');
        console.log('Archivos recientes:', res.data.files);

    } catch (error) {
        console.error('❌ Error conectando a Google Drive:', error.message);
    }
}

testDriveConnection();
