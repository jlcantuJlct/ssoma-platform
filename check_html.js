const http = require('http');
http.get('http://localhost:3000/digital-inspections/Maquinaria/fill', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (data.includes('Cuchara') && data.includes('Uñas')) {
            console.log('YES, Excavadoras items are rendered in HTML!');
        } else {
            console.log('NO, they are missing!');
        }
    });
});
