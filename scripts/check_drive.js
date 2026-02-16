const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function testDrive() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ No service-account.json found in root!');
            return;
        }

        const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
        console.log(`🔑 Found Credentials for: ${keyFile.client_email}`);

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: keyFile.client_email,
                private_key: keyFile.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Try to list files
        console.log('📡 Testing connection to Google Drive...');
        const res = await drive.files.list({
            pageSize: 5,
            fields: 'files(id, name)',
        });

        console.log('✅ Connection Successful!');
        console.log('📂 Files found in Service Account Root:', res.data.files.length);
        if (res.data.files.length > 0) {
            console.log('   - ' + res.data.files.map(f => f.name).join(', '));
        } else {
            console.log('   (Drive is empty)');
        }

        // Check Hardcoded Folder Access
        // ID from lib/googleDrive.ts
        const specificFolderId = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl';
        console.log(`\n🔍 Checking access to specific folder: ${specificFolderId}`);
        try {
            const folder = await drive.files.get({ fileId: specificFolderId, fields: 'name' });
            console.log(`✅ Access Confirmed! Folder Name: "${folder.data.name}"`);
        } catch (e) {
            console.error(`❌ Access Denied or Folder Not Found: ${e.message}`);
            console.error(`⚠️ ACTION REQUIRED: Share your Drive Folder with: ${keyFile.client_email}`);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testDrive();
