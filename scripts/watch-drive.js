const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ID de la carpeta Raíz (para saber si cayó ahí)
const ROOT_ID = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5";

function getCredentials() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(keyPath)) {
            return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        }
    } catch (e) { return null; }
}

async function getFolderName(drive, folderId) {
    if (!folderId) return "???";
    if (folderId === ROOT_ID) return "🔴 RAÍZ (INCORRECTO)";
    try {
        const res = await drive.files.get({ fileId: folderId, fields: 'name' });
        return `wd/${res.data.name}`;
    } catch (e) { return folderId; }
}

async function watchDrive() {
    const creds = getCredentials();
    if (!creds) { console.error("No creds"); return; }

    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    console.log("👀 MONITOREANDO DRIVE (Buscando archivos recientes)...");
    console.log("Sube el archivo ahora. Actualizaré cada 10 segundos.\n");

    setInterval(async () => {
        try {
            const res = await drive.files.list({
                q: "trashed=false and mimeType != 'application/vnd.google-apps.folder'", // Solo archivos, no carpetas
                orderBy: 'createdTime desc',
                pageSize: 3,
                fields: 'files(id, name, parents, createdTime)'
            });

            const files = res.data.files;
            if (files && files.length > 0) {
                console.log(`--- 🕒 ${new Date().toLocaleTimeString()} ---`);
                for (const file of files) {
                    const parentId = file.parents ? file.parents[0] : 'N/A';
                    const parentName = await getFolderName(drive, parentId);

                    console.log(`📄 Archivo: ${file.name}`);
                    console.log(`   📂 Carpeta: ${parentName}`);
                    console.log(`   ⏰ Hora: ${file.createdTime}`);
                    console.log("------------------------------------------------");
                }
            }
        } catch (e) {
            console.error("Error consultando Drive:", e.message);
        }
    }, 10000); // 10 segundos
}

watchDrive();
