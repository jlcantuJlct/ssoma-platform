
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const FOLDER_ID = '1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I'; 

async function testDriveFolderAccess() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        console.log(`🔍 Verificando acceso a la carpeta: ${FOLDER_ID}...`);
        const folderRes = await drive.files.get({
            fileId: FOLDER_ID,
            fields: 'id, name, mimeType',
        });
        console.log(`✅ Carpeta encontrada: ${folderRes.data.name} (ID: ${folderRes.data.id})`);
    } catch (error) {
        console.error('❌ Error verificando acceso a la carpeta:', error.message);
    }
}
testDriveFolderAccess();
