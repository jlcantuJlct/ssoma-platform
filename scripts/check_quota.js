
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function checkQuotaAndPermissions() {
    const keyPath = path.join(process.cwd(), 'service-account.json');

    if (!fs.existsSync(keyPath)) {
        console.error("❌ No service-account.json found.");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        // 1. Check Root Quota (Robot's quota)
        console.log("🔍 Checking Robot's Storage Quota...");
        const about = await drive.about.get({ fields: 'storageQuota, user' });
        const quota = about.data.storageQuota;
        const user = about.data.user;

        console.log(`🤖 Robot User: ${user.emailAddress}`);
        console.log(`📊 Usage: ${(quota.usage / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📉 Limit: ${(quota.limit / 1024 / 1024).toFixed(2)} MB`);

        if (quota.limit && Number(quota.usage) >= Number(quota.limit)) {
            console.error("❌ ROBOT ACCOUNT IS FULL (Storage Quota Exceeded)");
        } else {
            console.log("✅ Robot account has space (or no limit).");
        }

        // 2. Check Target Folder
        // Trying to find the target folder ID from previous context or generic search
        // User mentioned "1ucttJHG-xIei56GbVphCWATMFFxxXNxl" in previous turn logs as target
        const targetId = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl';

        console.log(`\n🔍 Checking Target Folder: ${targetId}`);
        const folder = await drive.files.get({
            fileId: targetId,
            fields: 'id, name, owners, capabilities'
        });

        const owner = folder.data.owners?.[0];
        console.log(`mj Name: ${folder.data.name}`);
        console.log(`👤 Owner: ${owner?.emailAddress} (${owner?.displayName})`);

        if (folder.data.capabilities.canAddChildren) {
            console.log("✅ Robot has permission to add files here.");
        } else {
            console.error("❌ Robot DOES NOT have permission to add files here (Read-only?).");
        }

        // Note: We cannot directly check the OWNER's quota via the API from the Robot's perspective,
        // but if the Robot is empty and the upload fails, it is 99% the Owner's Drive that is full.

    } catch (error) {
        console.error("❌ Error running checks:", error.message);
        if (error.response && error.response.data) {
            console.error("   API Error:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

checkQuotaAndPermissions();
