const http = require('http');
http.get('http://localhost:3000/digital-inspections/Maquinaria/fill', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (data.includes('Excavadoras')) {
            console.log('Excavadoras is in the source!');
        } else {
            console.log('Excavadoras NOT in source!');
        }
    });
});
