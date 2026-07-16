const fs = require('fs');

async function testGenerate() {
    try {
        const formData = new FormData();
        // create a dummy file just to trigger the API
        const dummyBlob = new Blob(['dummy content']);
        formData.append('template', dummyBlob, 'PAD_BARANDAS_INTERNAL.docx');
        
        // append some tags
        formData.append('tags', JSON.stringify([
            { name: 'mes_anio', value: 'Junio 2026', type: 'text' },
            { name: 'foto_001', value: '/api/generar-docx/foto-referencia?tag=foto_001&doc=barandas', type: 'image' }
        ]));

        console.log("Enviando POST a http://localhost:3000/api/generar-docx ...");
        const res = await fetch('http://localhost:3000/api/generar-docx', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("API Error:", err);
            return;
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync('TEST_OUTPUT_BARANDAS.docx', buffer);
        console.log(`✅ Archivo guardado: TEST_OUTPUT_BARANDAS.docx (${buffer.length} bytes)`);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testGenerate();
