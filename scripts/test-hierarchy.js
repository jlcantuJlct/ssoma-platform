
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ROOT_ID = '1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I';

async function testHierarchy() {
    console.log("=== DIAGNÓSTICO DE JERARQUÍA (HIERARCHY TEST) ===");
    console.log("Objetivo: Trazar si el robot puede 'ver' la carpeta SEGURIDAD.");

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ service-account.json no encontrado.');
            return;
        }

        const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.readonly'
            ],
        });

        const drive = google.drive({ version: 'v3', auth });

        // PASO 1: Listar TODO en la raíz para ver nombres EXACTOS
        console.log(`\n📂 1. Listando contenidos de Raíz (${ROOT_ID}):`);
        const rootList = await drive.files.list({
            q: `'${ROOT_ID}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = rootList.data.files;
        console.log(`   Encontrados ${files.length} items.`);

        let seguridadId = null;

        files.forEach(f => {
            console.log(`   - [${f.mimeType === 'application/vnd.google-apps.folder' ? 'DIR' : 'FILE'}] '${f.name}' (ID: ${f.id})`);
            if (f.name.trim().toUpperCase() === 'SEGURIDAD') {
                seguridadId = f.id;
            }
        });

        if (!seguridadId) {
            console.log("\n⚠️ ALERTA: No veo una carpeta llamada 'SEGURIDAD' exactamenente. ¿Quizás tiene espacios?");
        } else {
            console.log(`\n✅ Carpeta SEGURIDAD detectada con ID: ${seguridadId}`);

            // PASO 2: Probar la Query EXACTA del código
            console.log("\n🧪 2. Probando QUERY EXACTA del código principal...");
            const targetName = 'SEGURIDAD';
            const query = `mimeType='application/vnd.google-apps.folder' and name='${targetName}' and '${ROOT_ID}' in parents and trashed=false`;

            console.log(`   Query: "${query}"`);

            const queryRes = await drive.files.list({
                q: query,
                fields: 'files(id, name)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (queryRes.data.files.length > 0) {
                console.log(`   ✅ Query ÉXITOSA. El código debería encontrarla.`);
                console.log(`      Resultado: ${JSON.stringify(queryRes.data.files[0])}`);
            } else {
                console.log(`   ❌ Query FALLIDA. El código NO la encuentra usando search explícito.`);
                console.log(`      Esto explica por qué falla la subida.`);
            }
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }
}

testHierarchy();
