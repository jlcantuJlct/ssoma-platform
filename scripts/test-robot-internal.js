
// scripts/test-robot-internal.ts -> converted to js for execution
const { google } = require('googleapis');

// SIMULATE THE CREDENTIALS IMPORT (Copy-Paste from lib/credentials.ts to avoid TS compilation issues in this quick script)
// I will read the actual file to be sure I am testing what is on disk.
const fs = require('fs');
const path = require('path');

async function testInternalAuth() {
    console.log("🕵️ PRUEBA DE AUTENTICACIÓN INTERNA (ROBOT_CREDENTIALS)");

    // 1. Read lib/credentials.ts to extract key
    const credsPath = path.join(__dirname, '../lib/credentials.ts');
    const credsContent = fs.readFileSync(credsPath, 'utf8');

    // Extract client_email and private_key using regex
    const emailMatch = credsContent.match(/client_email:\s*"([^"]+)"/);
    const keyMatch = credsContent.match(/private_key:\s*"([^"]+)"/);

    if (!emailMatch || !keyMatch) {
        console.error("❌ No se pudieron extraer las credenciales del archivo .ts");
        return;
    }

    const client_email = emailMatch[1];
    let private_key = keyMatch[1];

    console.log(`📧 Email extraído: ${client_email}`);
    console.log(`🔑 Longitud Clave: ${private_key.length}`);

    // EXACT LOGIC FROM lib/googleDrive.ts
    // const privateKey = ROBOT_CREDENTIALS.private_key.replace(/\\n/g, '\n'); 
    const finalPrivateKey = private_key.replace(/\\n/g, '\n');

    console.log("🔄 Procesando saltos de línea...");

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: client_email,
                private_key: finalPrivateKey
            },
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        console.log("📡 Intentando listar archivos en Root...");
        const res = await drive.files.list({
            pageSize: 1,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        console.log("✅ AUTENTICACIÓN EXITOSA");
        console.log("📄 Archivo encontrado:", res.data.files[0] ? res.data.files[0].name : 'Ninguno');

    } catch (error) {
        console.error("❌ FALLÓ LA AUTENTICACIÓN INTERNA:");
        console.error(error.message);
        if (error.message.includes("PEM")) {
            console.error("💡 PISTA: El formato de la clave privada PEM es inválido.");
        }
    }
}

testInternalAuth();
