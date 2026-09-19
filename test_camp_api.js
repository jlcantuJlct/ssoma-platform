const http = require('http');

const data = JSON.stringify({
    moduleName: 'Inspección de campamento',
    answers: {
        "0": { text: "RED VIAL 6" },
        "1": { text: "Campamento Principal" },
        "2": { text: "2026-09-17" },
        "3": { text: "Juan Perez", signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" },
        "4": { text: "Supervisor" },
        "5": { text: "Maria Lopez", signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" },
        "6": { text: "true" }, 
        "10": { isConforme: true }, // Exhibición de la Política del SIG
        "11": { isConforme: false }, // Exhibición de las Políticas Específicas
        "12": { text: "N/A" } // Exhibición del IPERC
    },
    template: [
        { text: "Proyecto:", type: "question" },
        { text: "Ubicación de Campamento:", type: "question" },
        { text: "Fecha", type: "question" },
        { text: "Inspector", type: "question" },
        { text: "Cargo", type: "question" },
        { text: "Responsable de Áreas", type: "question" },
        { text: "Inspección planificada", type: "question" },
        { text: "Inspección no planificada", type: "question" },
        { text: "Exhibición de Documentos", type: "title" },
        { text: "Exhibición de la Política del SIG en el proyecto", type: "question" },
        { text: "Exhibición de las Políticas Específicas de Integridad en el proyecto", type: "question" },
        { text: "Exhibición del IPERC en áreas comunes", type: "question" }
    ],
    saveToDrive: false
});

const options = {
    hostname: 'localhost',
    port: 3006,
    path: '/api/export-excel',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('BODY:', body.substring(0, 100)));
});

req.on('error', (e) => console.error(`problem with request: ${e.message}`));
req.write(data);
req.end();
