const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Intentar cargar credenciales
let credentials;
try {
    const keyPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(keyPath)) {
        credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } else {
        // Fallback a lib/credentials si existe (simulando getCredentials de googleDrive.ts)
        const credsFile = path.join(process.cwd(), 'lib', 'credentials.ts');
        // Esto es más complejo en Node puro sin TS-Node, así que dependemos de service-account.json o env
    }
} catch (e) {}

async function rescuePmaFiles() {
    if (!credentials && !process.env.GOOGLE_PRIVATE_KEY) {
        console.error("❌ No se encontraron credenciales para acceder a Drive.");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log("🕵️‍♂️ Buscando archivos PMA del 8 al 24 de Abril...");

    try {
        // Query: Archivos que contienen 'PMA' y NO están en la papelera
        // Nota: Google Drive API no filtra por 'createdTime' con precisión de rango en una sola query de forma simple, 
        // pero podemos filtrar en JS.
        const res = await drive.files.list({
            q: "name contains 'PMA' and trashed = false",
            fields: 'files(id, name, webViewLink, createdTime)',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = res.data.files || [];
        const startDate = new Date('2026-04-08T00:00:00Z');
        const endDate = new Date('2026-04-24T23:59:59Z');

        const found = files.filter(f => {
            const created = new Date(f.createdTime);
            return created >= startDate && created <= endDate;
        });

        console.log(`✅ Se encontraron ${found.length} archivos potenciales en Drive.`);
        console.log(JSON.stringify(found, null, 2));

    } catch (err) {
        console.error("❌ Error en el escaneo de Drive:", err.message);
    }
}

rescuePmaFiles();
