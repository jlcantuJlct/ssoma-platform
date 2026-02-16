
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function checkFolders() {
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ service-account.json no encontrado.');
            return;
        }

        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const folderIds = [
            '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5', // Configurado actualmente en código
            '1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I'  // Mencionado en historial
        ];

        for (const id of folderIds) {
            console.log(`\nVerificando ID: ${id}...`);
            try {
                const res = await drive.files.get({
                    fileId: id,
                    fields: 'id, name, capabilities, owners'
                });
                console.log(`✅ Acceso confirmado a '${res.data.name}'`);
                console.log(`   Puede editar: ${res.data.capabilities.canEdit}`);
                console.log(`   Puede añadir hijos: ${res.data.capabilities.canAddChildren}`);
                console.log(`   Dueños: ${res.data.owners.map(o => o.emailAddress).join(', ')}`);
            } catch (error) {
                console.error(`❌ Error accediendo a ${id}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

checkFolders();
