
async function testAppBridge() {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzapkKUP2aYCoVrDk5nkJUy03u3K10LRCV2Hmt2KyKlEsdHgi4vXseSEbaIiKcudVzW/exec";

    console.log("🚀 Probando Puente Apps Script de la APP...");

    const payload = {
        filename: "Test_App_Bridge_" + Date.now() + ".txt",
        mimeType: "text/plain",
        fileBase64: Buffer.from("Prueba desde script de diagnostico").toString('base64'),
        folderId: "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I"
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const text = await response.text();
        console.log("📡 Respuesta cruda:", text);

        try {
            const json = JSON.parse(text);
            console.log("Parsed JSON:", json);
        } catch (e) {
            console.error("❌ No se pudo parsear JSON.");
        }
    } catch (error) {
        console.error("❌ Error de red:", error);
    }
}
testAppBridge();
