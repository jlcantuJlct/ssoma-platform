const fs = require('fs');

async function test() {
    const dataStr = fs.readFileSync('C:/Users/jlcan/.gemini/antigravity/brain/14636b8b-b0b3-4139-b17b-da20288b5a87/scratch/dump_inspecciones.js', 'utf8');
    const jsonStr = dataStr.replace('module.exports = ', '').replace(/;$/, '').trim();
    const data = JSON.parse(jsonStr);

    const res = await fetch('http://localhost:3000/api/export-program-excel?tipo=inspeccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const buffer = await res.arrayBuffer();
    fs.writeFileSync('test.xlsx', Buffer.from(buffer));
    console.log('Saved to test.xlsx');
}
test();
