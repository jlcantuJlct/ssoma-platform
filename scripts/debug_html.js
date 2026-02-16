
const fs = require('fs');

async function debugHtml() {
    const URL = "https://script.google.com/macros/s/AKfycbz0pN0RHPQgp1hu8AX0FGFBK5cL59To9JRGl4AZw19Ub-jY3JgybaL50ELDN6UAuGHZcg/exec";
    const FOLDER_ID = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5";

    console.log("🧐 Examining the HTML response from Bridge...");

    try {
        const payload = {
            filename: "Debug_HTML.txt",
            mimeType: "text/plain",
            fileBase64: Buffer.from("Debug").toString('base64'),
            folderId: FOLDER_ID
        };

        const response = await fetch(URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const text = await response.text();
        fs.writeFileSync('bridge_debug.html', text);
        console.log("✅ HTML saved to bridge_debug.html");
        console.log("Status:", response.status);

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

debugHtml();
