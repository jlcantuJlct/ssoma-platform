const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\jlcan\\Desktop\\CASA 2026\\SGSST CASA 2026\\Estadisticas 2026\\F-SIG-011 Estadisticas de SST SC V05 15.07.21.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);
    
    // Process the first sheet
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log('--- EXCEL STRUCTURE ---');
    // Log the first 50 rows to catch the header and columns
    data.slice(0, 50).forEach((row, rowIndex) => {
        console.log(`Row ${rowIndex}:`, JSON.stringify(row));
    });

} catch (e) {
    console.error('Error reading excel:', e);
}
