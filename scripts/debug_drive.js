
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function debugDrive() {
    console.log("🔍 DIAGNÓSTICO DE DRIVE INICIADO");
    const keyPath = path.join(process.cwd(), 'service-account.json');

    if (!fs.existsSync(keyPath)) {
        console.error("❌ NO SE ENCUENTRA service-account.json");
        return;
    }

    try {
        const creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        console.log(`📧 Email en JSON local: ${creds.client_email}`);

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 1. Intentar listar archivos en "Shared with me"
        console.log("\n📁 Buscando carpetas compartidas con el robot...");
        const listRes = await drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder'",
            fields: 'files(id, name, owners)',
            pageSize: 10
        });

        if (listRes.data.files.length === 0) {
            console.log("⚠️ El robot no ve NINGUNA carpeta. Es posible que el 'listing' no funcione, pero el acceso directo sí.");
        } else {
            console.log("✅ El robot ve las siguientes carpetas:");
            listRes.data.files.forEach(f => console.log(`   - [${f.name}] (${f.id}) - Dueño: ${f.owners?.[0]?.emailAddress}`));
        }

        // 2. Intentar acceder específicamente a la carpeta del User
        const targetId = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl';
        console.log(`\n🎯 Probando acceso directo al ID: ${targetId}`);

        try {
            const folder = await drive.files.get({
                fileId: targetId,
                fields: 'id, name, permissions'
            });
            console.log(`✅ ¡ACCESO EXITOSO! Carpeta: "${folder.data.name}"`);

            // Intentar crear archivo
            console.log("📝 Intentando crear archivo de prueba...");
            const upload = await drive.files.create({
                resource: {
                    name: 'Enlace_Generado_Exitosamente.txt',
                    parents: [targetId]
                },
                media: {
                    mimeType: 'text/plain',
                    body: 'Enlace generado: ' + new Date().toISOString()
                },
                fields: 'id, webViewLink'
            });
            console.log(`🚀 ENLACE GENERADO: ${upload.data.webViewLink}`);

        } catch (err) {
            console.error(`❌ FALLÓ LA VERIFICACIÓN DE LA CARPETA ESPECÍFICA:`);
            console.error(`   Código: ${err.code}`);
            console.error(`   Mensaje: ${err.message}`);
            if (err.response && err.response.data && err.response.data.error) {
                console.error("   Detalle API:", JSON.stringify(err.response.data.error, null, 2));
            }
        }


    } catch (error) {
        console.error("❌ ERROR GENERAL:", error);
    }

    // 3. Test Apps Script Bridge
    console.log("\n🌉 Probando Apps Script Bridge...");
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_cQwAMwLmTMZn3QXRtAZHc1-YWK6m7Jr1oIQo9eavFAqTd_p77Dl5P57XtYOqoUVtbw/exec";

    try {
        // Use global fetch
        const fetch = global.fetch;


        const payload = {
            filename: 'Debug_Bridge_Test.txt',
            mimeType: 'text/plain',
            fileBase64: Buffer.from('Bridge test ' + new Date().toISOString()).toString('base64'),
            folderId: "1ucttJHG-xIei56GbVphCWATMFFxxXNxl"
        };

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const text = await response.text();
        console.log("Bridge Response Status:", response.status);
        console.log("Bridge Response Body:", text.slice(0, 500)); // Print first 500 chars

    } catch (err) {
        console.error("❌ Apps Script Test Failed:", err.message);
    }
}

debugDrive();
