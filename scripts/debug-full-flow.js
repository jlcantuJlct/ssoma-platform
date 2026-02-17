
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// --- HARDCODED TEST DATA (Simulando lo que envía el formulario) ---
const FORM_DATA = {
    objective: "OBJ 01: Programas de SCSST",
    activity: "Inspecciones de Seguridad",
    date: "2026-02-17",
    location: "PEAJE HAWUAY",
    responsible: "Jesus Villalogos" // JLC
};

const ROOT_ID = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5";

// --- LOGIC FROM UPLOADCLIENT.TS (Folder Gen) ---
function generateFolderName(form) {
    const safeObjective = form.objective.replace(/[^a-zA-Z0-9\s\-\_]/g, '').trim().toUpperCase();
    const safeActivity = form.activity.replace(/[^a-zA-Z0-9\s\-\_]/g, '').substring(0, 50).trim().toUpperCase();
    const safeLugar = form.location.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase();

    // Month
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const d = new Date(form.date + 'T12:00:00');
    const monthName = monthNames[d.getMonth()];

    // Structure
    return `${safeObjective}/${safeActivity}/${monthName}/${safeLugar}`;
}

// --- LOGIC FROM GOOGLEDRIVE.TS (Folder Nav) ---
async function ensureDriveFolderHierarchy(drive, parentId, pathStr) {
    const parts = pathStr.split('/').filter(p => p.trim() !== '');
    let currentParentId = parentId;

    console.log(`\n🔍 Navegando: '${pathStr}'`);
    console.log(`   Raíz ID: ${parentId}`);

    for (const part of parts) {
        process.stdout.write(`   > Carpeta '${part}'... `);

        const query = `mimeType='application/vnd.google-apps.folder' and name='${part}' and '${currentParentId}' in parents and trashed=false`;

        try {
            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (res.data.files && res.data.files.length > 0) {
                currentParentId = res.data.files[0].id;
                console.log(`✅ ENCONTRADA (${currentParentId})`);
            } else {
                console.log(`📂 NO EXISTE. Intentando crear...`);
                // CREATE
                const folderMetadata = {
                    name: part,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [currentParentId]
                };
                const newFolder = await drive.files.create({
                    requestBody: folderMetadata,
                    fields: 'id',
                    supportsAllDrives: true
                });
                currentParentId = newFolder.data.id;
                console.log(`     ✨ CREADA EXITOSAMENTE (${currentParentId})`);
            }
        } catch (e) {
            console.log(`\n❌ ERROR CONSTANTANDO CARPETA '${part}':`);
            console.log(`   ${e.message}`);
            return null; // Break chain
        }
    }
    return currentParentId;
}

// --- MAIN EXECUTION ---
async function run() {
    console.log("=== SIMULACIÓN DE FLUJO DE SUBIDA ===\n");

    // 1. Check Creds
    const keyPath = path.join(process.cwd(), 'service-account.json');
    if (!fs.existsSync(keyPath)) {
        console.error("❌ ERROR: No encuentro 'service-account.json' en esta carpeta.");
        return;
    }
    const creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    console.log(`✅ Credenciales leídas: ${creds.client_email}`);

    // 2. Generate Folder Name
    const targetPath = generateFolderName(FORM_DATA);
    console.log(`✅ Ruta Generada: ${targetPath}`);

    // 3. Authenticate
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    // 4. Navigate
    try {
        const finalId = await ensureDriveFolderHierarchy(drive, ROOT_ID, targetPath);

        console.log("\n--- RESULTADO ---");
        if (finalId) {
            console.log(`ID FINAL: ${finalId}`);
            if (finalId === ROOT_ID) {
                console.warn("⚠️ ALERTA: El ID Final es IGUAL a la Raíz. (La navegación falló silenciosamente o la ruta estaba vacía)");
            } else {
                console.log("✅ ÉXITO: El ID Final es diferente a la Raíz. La estructura funciona.");
                console.log(`   (Esto confirma que el Bot TIENE permisos para crear carpetas)`);
            }
        } else {
            console.error("❌ FALLÓ: No se obtuvo un ID final válido.");
        }

    } catch (e) {
        console.error("❌ ERROR CRÍTICO:", e);
    }
}

run();
