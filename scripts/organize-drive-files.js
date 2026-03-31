
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// --- CONFIGURATION ---
const DRY_RUN = false; // Set to false to ACTUALLY move files
const ROOT_FOLDER_ID = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5'; // The folder to scan (where files are wrongly located)
// Note: Usually we scan the specific Shared Folder root. 

// --- AUTHENTICATION ---
function getDriveService() {
    let credentials;
    // Try service-account.json
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(keyPath)) {
            credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        }
    } catch (e) {
        console.error("Error creating creds:", e);
    }

    if (!credentials) {
        console.error("❌ No credentials found (service-account.json missing).");
        process.exit(1);
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return google.drive({ version: 'v3', auth });
}

// --- LOGIC ---

// Mappings from Filename Prefix to Folder Name
const AREA_MAP = {
    'Seg.': 'SEGURIDAD',
    'MA.': 'MEDIO_AMBIENTE',
    'Sal.': 'SALUD',
    'Gen.': 'GENERAL'
};

const TYPE_MAP = {
    'INSP': 'INSPECCIONES',
    'CAP': 'CAPACITACION',
    'SIM': 'SIMULACROS',
    'ATS': 'ATS',
    'PETA': 'PETAR'
};

const MONTH_NAMES = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

function getMonthName(dateStr) {
    // dateStr: YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length < 2) return 'GENERAL';
    const monthIndex = parseInt(parts[1], 10) - 1;
    return MONTH_NAMES[monthIndex] || 'GENERAL';
}

async function ensureFolder(drive, parentId, folderName) {
    // Check if exists
    const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
    const res = await drive.files.list({ q, fields: 'files(id, name)' });

    if (res.data.files.length > 0) {
        return res.data.files[0].id; // Return existing
    }

    if (DRY_RUN) return "MOCK_FOLDER_ID_" + folderName;

    // Create
    console.log(`Creating folder '${folderName}' inside ${parentId}...`);
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };
    const newFolder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id'
    });
    return newFolder.data.id;
}

async function ensureHierarchy(drive, rootId, pathParts) {
    let currentId = rootId;
    for (const part of pathParts) {
        currentId = await ensureFolder(drive, currentId, part);
    }
    return currentId;
}

async function moveFile(drive, fileId, currentParents, newParentId) {
    if (DRY_RUN) {
        console.log(`[DRY RUN] Would move file ${fileId} to folder ${newParentId}`);
        return;
    }

    // Move: addParents = new, removeParents = old
    // We need the previous parent ID to remove it. 
    // Usually files have 1 parent.
    const previousParents = currentParents.join(',');
    await drive.files.update({
        fileId: fileId,
        addParents: newParentId,
        removeParents: previousParents,
        fields: 'id, parents'
    });
    console.log(`✅ Moved file ${fileId} successfully.`);
}

async function main() {
    console.log(`🚀 STARTING ORGANIZATION SCRIPT (DRY RUN: ${DRY_RUN})`);
    const drive = getDriveService();

    // 1. List files in Root
    // We only want files, not folders.
    const query = `'${ROOT_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false`;

    console.log("Scanning root folder...");
    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name, parents)',
        pageSize: 1000
    });

    const files = res.data.files;
    console.log(`Found ${files.length} files in root.`);

    for (const file of files) {
        const name = file.name;
        // Parse Name: [Area][Type]_[Name]_[Date]_[Resp].ext
        // Regex is tricky due to variable lengths. 
        // Let's use split by '_' first.
        // Example: Seg.INSP_Extintores_2026-02-17_JLC.pdf

        // Split by _
        const parts = name.split('_');
        if (parts.length < 2) {
            // Only skip if really short or no separator
            // Try to find date signature anyway
            if (!name.match(/\d{4}/)) {
                console.warn(`⚠️ SKIP: Invalid format '${name}'`);
                continue;
            }
        }

        // Part 0: Check for prefixes (Seg.INSP)
        // If no dot found, assume it's a loose file and use default Area/Type.

        let areaFolder = 'GENERAL';
        let typeFolder = 'VARIOS';
        let activityNamePrefix = '';

        const p0 = parts[0];
        const dotIndex = p0.indexOf('.');

        if (dotIndex !== -1) {
            // Standard Format: Seg.INSP_...
            const areaPrefix = p0.substring(0, dotIndex + 1); // "Seg."
            const typePrefix = p0.substring(dotIndex + 1);    // "INSP"

            areaFolder = AREA_MAP[areaPrefix] || 'GENERAL';
            typeFolder = TYPE_MAP[typePrefix] || typePrefix;
        } else {
            // Loose File: Los_tachos_2026...
            // Treat everything before date as name.
            // console.log(`ℹ️ Loose File detected: '${name}'. Using defaults.`);
        }

        // Part 1: Activity Name (Could contain _ if we joined incorrectly? No, we split by _. Name might have been split.)
        // Re-assembling Name: It's everything between Type and Date.
        // Date is likely the 2nd to last or 3rd to last part? 
        // Date format: YYYY-MM-DD (3 parts if split by -? No, date uses - but we split by _)
        // Wait, date is YYYY-MM-DD. It doesn't contain _.
        // So Date is one part.

        // Find the part that looks like a date.
        // FIX: Allow date to be followed by extension (remove $ anchor) or other chars
        const dateIndex = parts.findIndex(p => p.match(/^\d{4}-\d{2}-\d{2}/));
        if (dateIndex === -1) {
            console.warn(`⚠️ SKIP: No date found in '${name}'`);
            continue;
        }

        const dateStr = parts[dateIndex];

        // Activity Name is everything between prefix (if any) and date.
        // If loose, it's everything from start to date.
        // actually 'parts' is split by _. 

        let activityNameParts;
        if (dotIndex !== -1) {
            // Parts [Seg.INSP, Name..., Date]
            activityNameParts = parts.slice(1, dateIndex);
        } else {
            // Parts [Name..., Date]
            activityNameParts = parts.slice(0, dateIndex);
        }

        const activityName = activityNameParts.join(' ').trim() || 'SIN_NOMBRE';

        // Resolve Folders
        const areaFolder = AREA_MAP[areaPrefix] || 'GENERAL';
        const typeFolder = TYPE_MAP[typePrefix] || typePrefix;
        const monthFolder = getMonthName(dateStr);
        const activityFolder = activityName.toUpperCase(); // "EXTINTORES"

        const targetHierarchy = [areaFolder, monthFolder, typeFolder, activityFolder];

        console.log(`\n📄 Processing: ${name}`);
        console.log(`   -> Path: ${targetHierarchy.join(' / ')}`);

        // Get/Create Target
        const targetId = await ensureHierarchy(drive, ROOT_FOLDER_ID, targetHierarchy);

        // Move
        await moveFile(drive, file.id, file.parents, targetId);
    }

    console.log("\n✅ SCAN COMPLETE.");
}

main().catch(console.error);
