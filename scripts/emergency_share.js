const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function run() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // 1. Create Folder
        console.log("Creating Emergency Folder...");
        const file = await drive.files.create({
            requestBody: {
                name: 'SSOMA_ROBOT_FOLDER_2026',
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id, webViewLink',
            supportsAllDrives: true
        });
        const folderId = file.data.id;
        console.log(`✅ Folder Created: ${folderId}`);
        console.log(`🔗 Link: ${file.data.webViewLink}`);

        // 2. Share with User
        const userEmail = 'jlcantu.jlct@gmail.com';
        console.log(`Sharing with ${userEmail}...`);
        await drive.permissions.create({
            fileId: folderId,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: userEmail
            },
            supportsAllDrives: true
        });
        console.log("✅ Shared successfully!");
    } catch (e) {
        console.error("Error in emergency script:", e);
    }
}
run();
