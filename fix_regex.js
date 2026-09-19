const fs = require('fs');
let content = fs.readFileSync('c:\\\\Users\\\\jlcan\\\\Desktop\\\\Seguimiento de plataforma de seguridad Antigravity\\\\ssoma-platform\\\\app\\\\api\\\\export-excel\\\\route.ts', 'utf8');

// find 'replace(/\' + '\n' + '/g'
let broken = 'replace(/\\' + '\n' + '/g';
content = content.split(broken).join('replace(/\\\\n/g');

fs.writeFileSync('c:\\\\Users\\\\jlcan\\\\Desktop\\\\Seguimiento de plataforma de seguridad Antigravity\\\\ssoma-platform\\\\app\\\\api\\\\export-excel\\\\route.ts', content);
