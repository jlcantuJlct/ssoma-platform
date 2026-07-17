const xlsx = require('xlsx');
const wb = xlsx.readFile('programa_formacion_test.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// Busquemos las fechas y los temas.
// Cada fila parece tener una fecha o un tema.
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row.length) continue;
    
    // Tratamos de buscar algo relacionado con Junio
    for (let j = 0; j < row.length; j++) {
        const cell = String(row[j]).toLowerCase();
        if (cell.includes('jun') || cell.includes('/06/') || cell.includes('-06-')) {
            console.log(`Fila ${i}:`, row);
        }
    }
}
