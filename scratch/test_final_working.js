const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

async function testRobotWorking() {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    const key = JSON.parse(fs.readFileSync(keyPath));
    // The key file has 'obot-ssoma-nuevo'
    
    const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    const folderId = "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I"; // The one where Robot is Owner
    const fileName = "TEST_FINAL_REPAIR.txt";

    try {
        console.log("Attempting Robot upload to", folderId);
        const res = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: Readable.from('Reparacion completada: Email corregido e ID sincronizado.')
            },
            fields: 'id',
            supportsAllDrives: true
        });
        console.log("✅ Success! File ID:", res.data.id);
        
        // Clean up
        await drive.files.delete({ fileId: res.data.id, supportsAllDrives: true });
        console.log("✅ Cleaned up test file.");
        
    } catch (err) {
        console.log("❌ Robot Error:", err.message);
    }
}

testRobotWorking();
