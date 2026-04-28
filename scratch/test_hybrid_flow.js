const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

async function testHybridFlow() {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    const key = JSON.parse(fs.readFileSync(keyPath));
    const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    const rootId = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5";
    const subfolderName = "TEST_HYBRID_" + Date.now();

    try {
        console.log("1. Robot creating subfolder...");
        const folderRes = await drive.files.create({
            requestBody: {
                name: subfolderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [rootId]
            },
            fields: 'id',
            supportsAllDrives: true
        });
        const subfolderId = folderRes.data.id;
        console.log("✅ Subfolder created:", subfolderId);

        console.log("2. Robot sharing subfolder with anyone...");
        await drive.permissions.create({
            fileId: subfolderId,
            requestBody: { role: 'writer', type: 'anyone' },
            supportsAllDrives: true
        });
        console.log("✅ Subfolder shared.");

        console.log("3. Bridge attempting upload to subfolder...");
        const bridgeUrl = "https://script.google.com/macros/s/AKfycbzapkKUP2aYCoVrDk5nkJUy03u3K10LRCV2Hmt2KyKlEsdHgi4vXseSEbaIiKcudVzW/exec";
        const payload = {
            filename: 'TEST_FILE.txt',
            mimeType: 'text/plain',
            fileBase64: Buffer.from('Contenido hibrido').toString('base64'),
            folderId: subfolderId,
            folderName: "" // No extra path
        };

        const response = await fetch(bridgeUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const text = await response.text();
        console.log("Bridge Response:", text);

    } catch (err) {
        console.log("❌ Error:", err.message);
    }
}

testHybridFlow();
