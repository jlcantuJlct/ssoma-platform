const fs = require('fs');
try {
    const stats = fs.statSync('./temp_pma.pdf');
    console.log("File size:", stats.size);
    const buf = fs.readFileSync('./temp_pma.pdf');
    console.log("Buffer created:", buf.length);
} catch (e) { console.error(e); }
