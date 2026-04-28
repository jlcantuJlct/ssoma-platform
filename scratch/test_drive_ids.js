const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testFolders() {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    if (!fs.existsSync(keyPath)) {
        console.error("No service-account.json found");
        return;
    }

    const key = JSON.parse(fs.readFileSync(keyPath));
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: key.client_email,
            private_key: key.private_key
        },
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });

    const drive = google.drive({ version: 'v3', auth });

    const ids = [
        "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5",
        "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I"
    ];

    for (const id of ids) {
        try {
            const res = await drive.files.get({
                fileId: id,
                fields: 'id, name',
                supportsAllDrives: true
            });
            console.log(`✅ ID ${id} is accessible. Name: ${res.data.name}`);
        } catch (err) {
            console.log(`❌ ID ${id} error: ${err.message}`);
        }
    }
}

testFolders();
