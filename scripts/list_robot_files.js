
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function listAll() {
    console.log("🕵️‍♂️ Robot buscando carpetas compartidas...");

    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // Listar TODO lo que no esté en la papelera
        const res = await drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, owners)',
            pageSize: 20,
        });

        const files = res.data.files;
        if (files.length === 0) {
            console.log("❌ El Robot NO VE ninguna carpeta.");
            console.log("   (Esto confirma que no se ha compartido correctamente nada con él todavía)");
        } else {
            console.log("✅ ¡El Robot ve estas carpetas!:");
            files.forEach((file) => {
                console.log(`   📂 "${file.name}" (ID: ${file.id}) - Dueño: ${file.owners?.[0]?.emailAddress}`);
            });
            console.log("\nSi ves tu carpeta aquí, copia su ID.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

listAll();
