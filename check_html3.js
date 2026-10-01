const http = require('http');
http.get('http://localhost:3000/digital-inspections/Maquinaria/fill', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Length:', data.length);
    });
});
