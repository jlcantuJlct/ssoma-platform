const http = require('http');

const payload = JSON.stringify({
    moduleName: 'Maquinaria',
    template: { 'Llantas delanteras (*)': 'OK', 'Asiento': 'R' },
    answers: { tipoEquipo: 'Excavadoras' },
    evidenciaLevantamiento: 'http://example.com/foto.jpg',
    comentarioLevantamiento: 'Levantado'
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/export-excel',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}, (res) => {
    let data = [];
    res.on('data', d => data.push(d));
    res.on('end', () => {
        const buffer = Buffer.concat(data);
        if (buffer.toString('utf8').startsWith('PK')) {
            console.log('Got ZIP/Excel raw bytes!');
        } else {
            const json = JSON.parse(buffer.toString('utf8'));
            require('fs').writeFileSync('test_levantamiento.xlsx', json.fileBase64, 'base64');
            console.log('Saved test_levantamiento.xlsx');
        }
    });
});
req.write(payload);
req.end();
