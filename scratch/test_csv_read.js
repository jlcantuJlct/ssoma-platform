const XLSX = require('xlsx');
const fs = require('fs');

const path = "C:\\Users\\jlcan\\Desktop\\CASA 2026\\SGSST CASA 2026\\Simulacro 2026\\Prog. Simulacro.csv";
const buffer = fs.readFileSync(path);

try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false });
    
    console.log("Sheet Name:", sheetName);
    console.log("First 5 rows:");
    console.log(JSON.stringify(worksheet.slice(0, 5), null, 2));
    
} catch (e) {
    console.error("Error reading file:", e);
}
