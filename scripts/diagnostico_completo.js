const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function runDiagnostic() {
    console.log("==========================================");
    console.log("   DIAGNOSTICO DE CONEXION SSOMA DRIVE    ");
    console.log("==========================================");

    // 1. VERIFICAR CREDENCIALES
    console.log("\n1. Verificando Credenciales...");
    const keyPath = path.join(__dirname, '../service-account.json');
    if (!fs.existsSync(keyPath)) {
        console.error("❌ ERROR: No se encontró 'service-account.json' en la raíz.");
        return;
    }
    console.log("✅ Archivo 'service-account.json' encontrado.");

    let auth;
    try {
        auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const client = await auth.getClient();
        console.log("✅ Cliente de Autenticación creado correctamente.");
    } catch (e) {
        console.error("❌ ERROR DE AUTENTICACIÓN:", e.message);
        return;
    }

    const drive = google.drive({ version: 'v3', auth });

    // 2. VERIFICAR CARPETA RAIZ
    console.log("\n2. Verificando Carpeta Raíz...");
    // ID Hardcoded que usa el sistema
    const ROOT_ID = "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I";

    let rootName = "";

    try {
        const res = await drive.files.get({
            fileId: ROOT_ID,
            fields: 'id, name, capabilities',
            supportsAllDrives: true
        });
        console.log(`✅ Conexión a Drive EXITOSA.`);
        console.log(`📂 Nombre de la Carpeta Raíz: '${res.data.name}'`);
        console.log(`🔑 ID: ${res.data.id}`);
        rootName = res.data.name;

        if (res.data.capabilities.canAddChildren) {
            console.log("✅ Permiso de ESCROTURA: SI");
        } else {
            console.warn("⚠️ ALERTA: No parece tener permiso de escritura en la raíz.");
        }

    } catch (e) {
        console.error("❌ ERROR CONECTANDO A DRIVE:", e.message);
        console.log("   -> Posible causa: El ID de carpeta no existe o el Robot no tiene acceso.");
        return; // No podemos seguir si no hay drive
    }

    // 3. PRUEBA DE SUBIDA (Pequeña)
    console.log("\n3. Prueba de Subida (Test File)...");
    try {
        const fileMetadata = {
            name: 'TEST_DIAGNOSTICO_SSOMA.txt',
            parents: [ROOT_ID]
        };
        const media = {
            mimeType: 'text/plain',
            body: 'Este es un archivo de prueba para verificar la subida.'
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
            supportsAllDrives: true
        });
        console.log(`✅ Archivo de prueba SUBIDO correctamente. ID: ${file.data.id}`);

        // Limpieza
        await drive.files.delete({ fileId: file.data.id, supportsAllDrives: true });
        console.log("✅ Archivo de prueba ELIMINADO (Limpieza).");

    } catch (e) {
        console.error("❌ ERROR SUBIENDO ARCHIVO:", e.message);
    }

    // 4. PRUEBA DE APPS SCRIPT BRIDGE
    console.log("\n4. Prueba de Apps Script Bridge...");
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzapkKUP2aYCoVrDk5nkJUy03u3K10LRCV2Hmt2KyKlEsdHgi4vXseSEbaIiKcudVzW/exec";

    try {
        const fetch = (await import('node-fetch')).default;

        const payload = {
            filename: 'TEST_BRIDGE_DIAG.txt',
            mimeType: 'text/plain',
            fileBase64: Buffer.from('Prueba Bridge').toString('base64'),
            folderId: ROOT_ID,
            folderName: 'DIAGNOSTICO_BRIDGE'
        };

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const text = await response.text();
        console.log(`📡 Respuesta del Bridge (Status ${response.status}):`);
        console.log(text.substring(0, 100) + "...");

        if (text.includes("success") || text.includes("viewLink")) {
            console.log("✅ Bridge Funcionando.");
        } else {
            console.warn("⚠️ Bridge podría estar fallando o devolviendo HTML.");
        }

    } catch (e) {
        // node-fetch might not be installed, ignore if so as it's secondary
        console.warn("ℹ️ No se pudo probar Bridge (probablemente falta node-fetch), pero Drive nativo funciona.");
    }

    console.log("\n==========================================");
    console.log("   DIAGNOSTICO FINALIZADO                 ");
    console.log("==========================================");
}

runDiagnostic();
