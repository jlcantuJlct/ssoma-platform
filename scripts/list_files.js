
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function listFilesInFolder() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const folderId = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5';

        console.log(`🔍 Checking files inside folder: ${folderId}`);

        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, owners, createdTime, webViewLink)',
            orderBy: 'createdTime desc',
            pageSize: 10
        });

        if (res.data.files.length === 0) {
            console.log("❌ LA CARPETA ESTÁ VACÍA.");
        } else {
            console.log(`✅ SE ENCONTRARON ${res.data.files.length} ARCHIVOS:`);
            res.data.files.forEach(f => {
                console.log(`- ${f.name} (${f.createdTime})`);
                console.log(`  Propietario: ${f.owners?.[0]?.emailAddress}`);
                console.log(`  Link: ${f.webViewLink}`);
            });
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

listFilesInFolder();
