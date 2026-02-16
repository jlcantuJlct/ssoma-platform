
const fs = require('fs');
const path = require('path');

async function verifyNewBridge() {
    const URL = "https://script.google.com/macros/s/AKfycbz0pN0RHPQgp1hu8AX0FGFBK5cL59To9JRGl4AZw19Ub-jY3JgybaL50ELDN6UAuGHZcg/exec";
    const FOLDER_ID = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5";

    console.log("🚀 Verifying NEW Bridge with 2TB quota...");

    try {
        const payload = {
            filename: "Verificacion_Final_2TB_" + Date.now() + ".txt",
            mimeType: "text/plain",
            fileBase64: Buffer.from("Conexión exitosa usando los 2TB de la cuenta jlcantu.jlct@gmail.com").toString('base64'),
            folderId: FOLDER_ID
        };

        const response = await fetch(URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const data = await response.json();

        if (data.result === 'success') {
            console.log("\n✅ ¡PRUEBA EXITOSA!");
            console.log("El archivo ahora debería aparecer en tu Drive.");
            console.log("URL del archivo:", data.url);
        } else {
            console.error("\n❌ Error del Bridge:", data.error);
        }

    } catch (err) {
        console.error("\n❌ Error de red/petición:", err.message);
    }
}

verifyNewBridge();
