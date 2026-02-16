
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function listFiles() {
    const keyPath = path.join(process.cwd(), 'service-account.json');

    if (!fs.existsSync(keyPath)) {
        console.error("No credentials file");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log("Consultando archivos visibles para el robot...");
        const res = await drive.files.list({
            pageSize: 10,
            fields: 'files(id, name, webViewLink, createdTime)',
            orderBy: 'createdTime desc'
        });

        console.log("Archivos encontrados:");
        if (res.data.files.length === 0) {
            console.log("No se encontraron archivos. (El robot no ve nada aún)");
        } else {
            res.data.files.forEach((file) => {
                console.log(`[${file.createdTime}] ${file.name}`);
                console.log(`   🔗 ${file.webViewLink}`);
            });
        }
    } catch (error) {
        console.error("Error listando:", error.message);
    }
}

listFiles();
