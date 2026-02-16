
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function cleanAndRetry() {
    console.log("🧹 INICIANDO LIMPIEZA DEL ROBOT...");
    const keyPath = path.join(process.cwd(), 'service-account.json');

    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        // 1. Buscar archivos propios del Robot
        // 'me' in owners verifica que el archivo ocupe espacio del robot
        const listRes = await drive.files.list({
            q: "'me' in owners and trashed = false",
            fields: 'files(id, name, size)',
            pageSize: 50
        });

        const files = listRes.data.files;
        console.log(`📉 Encontrados ${files.length} archivos propiedad del Robot.`);

        let deletedCount = 0;
        for (const file of files) {
            console.log(`   🗑️ Eliminando: ${file.name} (${file.size || 0} bytes)`);
            try {
                await drive.files.delete({ fileId: file.id });
                deletedCount++;
            } catch (e) {
                console.log(`      ⚠️ No se pudo eliminar ${file.name}`);
            }
        }
        console.log(`✅ Se eliminaron ${deletedCount} archivos.`);

        // 2. Reintentar subir archivo de enlace
        const folderId = '1ucttJHG-xIei56GbVphCWATMFFxxXNxl';
        console.log("\n🔄 REINTENTANDO GENERAR ENLACE...");

        const upload = await drive.files.create({
            resource: {
                name: 'Enlace_Verificado_OK.txt',
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: 'Conexión restablecida y espacio liberado. ' + new Date().toISOString()
            },
            fields: 'id, webViewLink'
        });

        console.log(`\n🎉 ¡GENERACIÓN EXITOSA!`);
        console.log(`🔗 NUEVO ENLACE: ${upload.data.webViewLink}`);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error.message);
        if (error.response?.data?.error) {
            console.error(JSON.stringify(error.response.data.error, null, 2));
        }
    }
}

cleanAndRetry();
