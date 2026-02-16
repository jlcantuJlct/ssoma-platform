
async function testBridge() {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx_cQwAMwLmTMZn3QXRtAZHc1-YWK6m7Jr1oIQo9eavFAqTd_p77Dl5P57XtYOqoUVtbw/exec";

    console.log("🚀 Probando Puente Apps Script (Fetch Nativo)...");

    // Crear un archivo falso en base64
    const fakeContent = "Prueba de conexión exitosa desde SSOMA Platform - V2";
    const base64File = Buffer.from(fakeContent).toString('base64');

    const payload = {
        filename: "Test_Via_AppsScript_V2.txt",
        mimeType: "text/plain",
        fileBase64: base64File
    };

    try {
        // Apps Script Redirects, so we need to follow them. Native fetch follows by default.
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        const text = await response.text();
        console.log("📡 Respuesta cruda:", text);

        try {
            const json = JSON.parse(text);
            if (json.result === 'success') {
                console.log("\n✅ ¡ÉXITO! Archivo subido.");
                console.log("🔗 URL Descarga:", json.url);
                console.log("👀 URL Vista:", json.viewLink);
            } else {
                console.error("\n❌ Error reportado por el script:", json.error);
            }
        } catch (e) {
            console.error("❌ No se pudo parsear JSON.");
        }

    } catch (error) {
        console.error("❌ Error de red:", error);
    }
}

testBridge();
