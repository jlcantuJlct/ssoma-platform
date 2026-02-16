
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testNativeUpload() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

        console.log(`📡 Testing NATIVE API Upload with: ${creds.client_email}`);

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const folderId = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5';

        const fileMetadata = {
            name: 'Native_API_Test_' + Date.now() + '.txt',
            parents: [folderId]
        };
        const media = {
            mimeType: 'text/plain',
            body: 'Prueba de subida nativa directa.'
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink',
            supportsAllDrives: true
        });

        console.log("✅ SUCCESS!");
        console.log("File ID:", response.data.id);
        console.log("Link:", response.data.webViewLink);

    } catch (err) {
        console.error("❌ ERROR:", err.message);
        if (err.response && err.response.data) {
            console.error("API Error Detail:", JSON.stringify(err.response.data, null, 2));
        }
    }
}

testNativeUpload();
