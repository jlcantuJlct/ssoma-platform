const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Assuming running from ssoma-platform root or scripts dir
// If running from scripts/, ../service-account.json is in ssoma-platform root
const KEY_PATH = path.join(__dirname, '../service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Folder IDs to check
const USER_TARGET_ID = '1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I'; // The one user mentioned
const CODE_DEFAULT_ID = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5'; // The one in googleDrive.ts

async function checkAccess() {
    console.log('--- Verificando Acceso del Bot ---');
    console.log(`📂 Buscando clave en: ${KEY_PATH}`);

    if (!fs.existsSync(KEY_PATH)) {
        console.error('❌ No se encontró service-account.json');
        // Try looking one level up just in case
        const keyPathUp = path.join(__dirname, '../../service-account.json');
        if (fs.existsSync(keyPathUp)) {
            console.log(`✅ Encontrado en nivel superior: ${keyPathUp}`);
            return runAuth(keyPathUp);
        }
        return;
    }
    return runAuth(KEY_PATH);
}

async function runAuth(keyFile) {
    try {
        const creds = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
        console.log(`🤖 Identidad del Bot: ${creds.client_email}`);

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFile,
            scopes: SCOPES,
        });

        const drive = google.drive({ version: 'v3', auth });

        // Check User Target
        await checkFolder(drive, USER_TARGET_ID, 'USER_TARGET (Carpeta mencionada 1eJ7...)');

        // Check Code Default
        await checkFolder(drive, CODE_DEFAULT_ID, 'CODE_DEFAULT (Carpeta en código 1j6w...)');
    } catch (e) {
        console.error("❌ Error inicializando bot:", e.message);
    }
}

async function checkFolder(drive, folderId, label) {
    try {
        console.log(`\n🔍 Verificando ${label}: ${folderId}...`);
        const res = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, capabilities, owners, webViewLink, permissions',
            supportsAllDrives: true
        });

        console.log(`✅ ACCESO CONFIRMADO.`);
        console.log(`   Nombre: ${res.data.name}`);
        console.log(`   Link: ${res.data.webViewLink}`);
        console.log(`   Puede Editar: ${res.data.capabilities.canEdit ? 'SI' : 'NO'}`);
        console.log(`   Puede Añadir Hijos: ${res.data.capabilities.canAddChildren ? 'SI' : 'NO'}`);

        // Verificar si el bot es dueño o escritor
        const botEmail = res.config.auth.credentials.client_email;
        // console.log("Permisos:", res.data.permissions); 

    } catch (error) {
        console.error(`❌ ACCESO DENEGADO o NO EXISTE.`);
        if (error.response) {
            console.error(`   Error: ${error.response.status} - ${error.response.statusText}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

checkAccess();
