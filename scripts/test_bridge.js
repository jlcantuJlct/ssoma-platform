
const fs = require('fs');
const path = require('path');

async function testBridge() {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_cQwAMwLmTMZn3QXRtAZHc1-YWK6m7Jr1oIQo9eavFAqTd_p77Dl5P57XtYOqoUVtbw/exec";
    const folderId = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5";

    console.log("🚀 Testing Bridge with URL:", APPS_SCRIPT_URL);
    console.log("📂 Target Folder:", folderId);

    try {
        const payload = {
            filename: "Test_Bridge_Direct_" + Date.now() + ".txt",
            mimeType: "text/plain",
            fileBase64: Buffer.from("Contenido de prueba via Bridge").toString('base64'),
            folderId: folderId
        };

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Raw Response:", text);

        try {
            const data = JSON.parse(text);
            console.log("Parsed JSON:", data);
        } catch (e) {
            console.log("Response is not JSON.");
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

testBridge();
