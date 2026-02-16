
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const FOLDER_ID = '1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I'; // ID proporcionado por el usuario

async function testDriveFolderAccess() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ Error: service-account.json no encontrado.');
            return;
        }

        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });

        console.log(`🔍 Verificando acceso a la carpeta: ${FOLDER_ID}...`);

        // 1. Verificar si la carpeta existe y es accesible
        const folderRes = await drive.files.get({
            fileId: FOLDER_ID,
            fields: 'id, name, mimeType',
        });

        console.log(`✅ Carpeta encontrada: ${folderRes.data.name} (ID: ${folderRes.data.id})`);

        // 2. Listar archivos dentro de la carpeta
        console.log('📂 Listando archivos dentro de la carpeta...');
        const listRes = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and trashed = false`,
            pageSize: 10,
            fields: 'files(id, name, mimeType)',
        });

        if (listRes.data.files.length === 0) {
            console.log('ℹ️ La carpeta está vacía o no se encontraron archivos.');
        } else {
            console.log('📄 Archivos encontrados:');
            listRes.data.files.forEach(file => {
                console.log(`   - ${file.name} (${file.id})`);
            });
        }

    } catch (error) {
        console.error('❌ Error verificando acceso a la carpeta:', error.message);
        if (error.code === 404) {
            console.error('   Posible causa: La cuenta de servicio no tiene permiso para ver esta carpeta. Asegúrate de compartir la carpeta con el email de la cuenta de servicio.');
        }
    }
}

testDriveFolderAccess();
