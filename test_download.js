const fs = require('fs');
const http = require('http');

const data = require('./dump_inspecciones.js'); // Assuming it exports the JSON object

const postData = JSON.stringify(data);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/export-program-excel?tipo=inspeccion',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  const file = fs.createWriteStream('test_output.xlsx');
  res.pipe(file);
  
  file.on('finish', () => {
    file.close();
    console.log('File downloaded to test_output.xlsx');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
