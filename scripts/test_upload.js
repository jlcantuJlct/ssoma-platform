const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function testUpload() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: keyFile.client_email,
                private_key: keyFile.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const FOLDER_ID = '1kxy2EaoAy9cUMmtFrJv8Z82r7UVoj2dl'; // ID CORRECTO

        console.log(`🚀 Attempting to upload 'TEST_FILE.txt' to folder ${FOLDER_ID}...`);

        const fileMetadata = {
            name: 'PRUEBA_CONEXION_ROBOT.txt',
            parents: [FOLDER_ID]
        };

        const media = {
            mimeType: 'text/plain',
            body: 'Hola, si ves esto es que el robot tiene acceso de escritura correcto.'
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink',
            supportsAllDrives: true
        });

        console.log(`✅ File Created! ID: ${file.data.id}`);
        console.log(`🔗 Link: ${file.data.webViewLink}`);
        console.log("👉 Please REFRESH your Google Drive folder now.");

    } catch (error) {
        console.error('❌ Upload Failed:', error);
    }
}

testUpload();
