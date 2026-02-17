
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_PATH = path.join(__dirname, '../service-account.json');
const TARGET_FOLDER_ID = '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5'; // La nueva carpeta

async function checkPermissions() {
    console.log("🔍 Verificando permisos del Robot en la carpeta destino...");

    if (!fs.existsSync(KEY_PATH)) {
        console.error("❌ No se encontró service-account.json");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_PATH,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log(`📂 Intentando leer carpeta: ${TARGET_FOLDER_ID}`);
        const res = await drive.files.get({
            fileId: TARGET_FOLDER_ID,
            fields: 'id, name, capabilities, permissions'
        });

        console.log(`✅ ¡ACCESO CONFIRMADO!`);
        console.log(`   Nombre: ${res.data.name}`);
        console.log(`   Puede Editar: ${res.data.capabilities.canEdit}`);
        console.log(`   Puede Añadir Hijos: ${res.data.capabilities.canAddChildren}`);

        if (!res.data.capabilities.canAddChildren) {
            console.error("⚠️ EL ROBOT PUEDE VER LA CARPETA PERO NO PUEDE ESCRIBIR (SOLO LECTURA)");
            console.error("👉 SOLUCIÓN: Comparte la carpeta 'Evidencias SSOMA 2026' con el email del robot:");
            console.error("   abot-ssoma-nuevo@ssoma-app-485301.iam.gserviceaccount.com");
        } else {
            console.log("🚀 El Robot tiene permisos TOTALES. El problema no es permisos.");
        }

    } catch (error) {
        console.error("❌ ERROR DE ACCESO:");
        console.error(error.message);
        console.error("\n💡 CAUSA PROBABLE: El Robot NO ha sido invitado a esta carpeta.");
        console.error("👉 SOLUCIÓN: Ve a Drive, click derecho en la carpeta -> Compartir -> Pega este correo:");
        const creds = require(KEY_PATH);
        console.error(`   ${creds.client_email}`);
        console.error("    Dale permiso de EDITOR.");
    }
}

checkPermissions();
