async function testBridge() {
    const url = "https://script.google.com/macros/s/AKfycbzapkKUP2aYCoVrDk5nkJUy03u3K10LRCV2Hmt2KyKlEsdHgi4vXseSEbaIiKcudVzW/exec";
    const payload = {
        filename: 'TEST_ROBOT_FIX.txt',
        mimetype: 'text/plain',
        fileBase64: Buffer.from('Prueba de reparacion de IDs').toString('base64'),
        folderId: "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I",
        folderName: "TEST_REPAIR",
        folderPath: "TEST_REPAIR"
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const text = await response.text();
        console.log("Response:", text);
    } catch (err) {
        console.log("Error:", err.message);
    }
}

testBridge();
