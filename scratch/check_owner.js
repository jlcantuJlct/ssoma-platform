const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkOwner() {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    const key = JSON.parse(fs.readFileSync(keyPath));
    const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    try {
        const res = await drive.files.list({
            q: "name = 'TEST_ROBOT_FIX.txt'",
            fields: 'files(id, name, owners)',
            supportsAllDrives: true
        });

        if (res.data.files && res.data.files.length > 0) {
            console.log("File found:", res.data.files[0].id);
            console.log("Owners:", JSON.stringify(res.data.files[0].owners));
        } else {
            console.log("File not found");
        }
    } catch (err) {
        console.log("Error:", err.message);
    }
}

checkOwner();
