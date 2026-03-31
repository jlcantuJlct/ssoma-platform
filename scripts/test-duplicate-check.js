const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

async function testDuplicateCheck() {
    console.log("🚀 STARTING DUPLICATE CHECK TEST...");

    // 1. Configure Auth
    const keyPath = path.join(process.cwd(), 'service-account.json');
    if (!fs.existsSync(keyPath)) {
        console.error("❌ No service-account.json found");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 2. Constants
    // Use the Root Folder ID from lib/googleDrive.ts
    const folderId = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5';
    const fileName = 'DUPLICATE_TEST_FILE.txt';

    // 3. Clean up previous test (delete if exists)
    console.log("🧹 Cleaning up old files...");
    const qClean = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;
    const resClean = await drive.files.list({ q: qClean });
    if (resClean.data.files) {
        for (const f of resClean.data.files) {
            await drive.files.delete({ fileId: f.id });
            console.log(`Deleted old file: ${f.id}`);
        }
    }

    // 4. Create FIRST File
    console.log("📤 Uploading FIRST file...");
    const res1 = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [folderId]
        },
        media: {
            mimeType: 'text/plain',
            body: Readable.from(Buffer.from('File 1 content'))
        },
        fields: 'id'
    });
    console.log(`✅ File 1 Created: ${res1.data.id}`);

    // 5. TEST THE DUPLICATE LOGIC (Simulating lib/googleDrive.ts)
    console.log("🔍 Testing Duplicate Logic...");

    // THE QUERY I ADDED TO THE CODE:
    const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;

    // NOTE: Using supportsAllDrives just like in the code
    const resCheck = await drive.files.list({
        q: query,
        fields: 'files(id, webContentLink, webViewLink)',
        spaces: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
    });

    if (resCheck.data.files && resCheck.data.files.length > 0) {
        const existing = resCheck.data.files[0];
        console.log(`✅ SUCCESS: Found existing file!`);
        console.log(`   ID: ${existing.id}`);
        console.log(`   Match: ${existing.id === res1.data.id}`);

        if (existing.id === res1.data.id) {
            console.log("\n🎉 TEST PASSED: Duplicate detection logic works.");
        } else {
            console.warn("\n⚠️ FILE FOUND, BUT ID MISMATCH? (Maybe multiple duplicates existed?)");
        }
    } else {
        console.error("\n❌ TEST FAILED: Did not find the existing file using the query.");
    }
}

testDuplicateCheck().catch(console.error);
