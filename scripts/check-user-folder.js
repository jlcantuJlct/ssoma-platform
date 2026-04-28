
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const FOLDER_ID = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl'; 

async function checkId() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const res = await drive.files.get({
            fileId: FOLDER_ID,
            fields: 'id, name, mimeType',
        });
        console.log(`ID: ${res.data.id}`);
        console.log(`Name: ${res.data.name}`);
        console.log(`MimeType: ${res.data.mimeType}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}
checkId();
