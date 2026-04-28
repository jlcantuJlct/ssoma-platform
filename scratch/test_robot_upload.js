const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

async function testRobotUpload() {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    const key = JSON.parse(fs.readFileSync(keyPath));
    const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    const folderId = "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I";
    const fileName = "TEST_ROBOT_DIRECT.txt";

    try {
        console.log("Attempting Robot upload to", folderId);
        const res = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: Readable.from('Test Content from Robot')
            },
            fields: 'id',
            supportsAllDrives: true
        });
        console.log("✅ Success! File ID:", res.data.id);
    } catch (err) {
        console.log("❌ Robot Error:", err.message);
    }
}

testRobotUpload();
