const { generateWordFromTemplate } = require('../lib/wordTemplateGenerator');
const fs = require('fs');

async function run() {
    try {
        const data = {
            MES_REPORTE: "ABRIL",
            ANIO_REPORTE: 2026,
            photos: [
                { url: "https://via.placeholder.com/500x350.png?text=Prueba1", description: "Foto 1", date: "2026-04-10" },
                { url: "https://via.placeholder.com/500x350.png?text=Prueba2", description: "Foto 2", date: "2026-04-11" }
            ]
        };
        const buffer = await generateWordFromTemplate(data);
        fs.writeFileSync("test_output.docx", buffer);
        console.log("Success!");
    } catch (e) {
        console.error(e);
    }
}
run();
