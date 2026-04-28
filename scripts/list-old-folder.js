
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const FOLDER_ID = '1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I'; 

async function listFiles() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        console.log(`📂 Listando archivos en: ${FOLDER_ID}...`);
        const listRes = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and trashed = false`,
            pageSize: 5,
            fields: 'files(id, name, createdTime)',
        });

        if (listRes.data.files.length === 0) {
            console.log('ℹ️ Carpeta vacía.');
        } else {
            listRes.data.files.forEach(file => {
                console.log(`   - ${file.name} (Created: ${file.createdTime})`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}
listFiles();
