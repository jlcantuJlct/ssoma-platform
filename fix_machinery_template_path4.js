const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const idx = c.indexOf('let workbook = new ExcelJS.Workbook();');
if (idx !== -1) {
    const insertStr = `      if (data.isMachineryMatrix || (moduleName && moduleName.toLowerCase().includes("maquinaria"))) {
        const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de maquinaria.xlsx");
        if (fs.existsSync(alt)) templatePath = alt;
      }
      `;
    c = c.substring(0, idx) + insertStr + c.substring(idx);
    fs.writeFileSync('app/api/export-excel/route.ts', c);
    console.log('Inserted template path');
} else {
    console.log('Not found let workbook');
}
