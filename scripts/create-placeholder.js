const fs = require('fs');
const path = require('path');
const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
fs.writeFileSync(path.join('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform', 'public', 'placeholder.png'), pngData);
console.log("placeholder.png created.");
