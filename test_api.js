const http = require('http');

const data = JSON.stringify({
    moduleName: 'Inspección de Talleres',
    answers: {
        "0": { text: "Mecánica" },
        "1": { text: "Juan" }
    },
    template: [
        { text: "Área específica de inspección:", type: "question" },
        { text: "Inspector:", type: "question" }
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
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('BODY:', body.substring(0, 500)));
});

req.on('error', (e) => console.error(`problem with request: ${e.message}`));
req.write(data);
req.end();
