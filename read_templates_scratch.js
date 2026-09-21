const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const templateDir = path.join(process.cwd(), 'public', 'templates', 'digital');

const files = [
    'Inspección de Kit con derrames.xlsx',
    'Inspección de estación de emergencia.xlsx',
    'Inspección EPP contra caídas .xlsx',
    'Inspección de Almacén .xlsx',
    'Inspección de Laboratorio.xlsx',
    'Inspección de Talleres.xlsx',
    'Inspección de campamento.xlsx',
    'Inspección de instalaciones eléctricas.xlsx',
    'Botiquines.xlsx',
    'Extintores.xlsx',
    'Inspección de EPP.xlsx',
    'Inspección de maquinaria.xlsx',
];

function safeVal(cell) {
    try {
        if (!cell || cell.value === null || cell.value === undefined) return null;
        if (typeof cell.value === 'object' && cell.value.richText) {
            return cell.value.richText.map(r => r.text).join('');
        }
        if (typeof cell.value === 'object' && cell.value.result !== undefined) {
            return String(cell.value.result);
        }
        return String(cell.value);
    } catch(e) { return null; }
}

async function readTemplate(filename) {
    const filePath = path.join(templateDir, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`\n=== ${filename} === NOT FOUND`);
        return;
    }
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.worksheets[0];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`ARCHIVO: ${filename}`);
    console.log(`${'='.repeat(60)}`);
    
    for (let rowNum = 1; rowNum <= 60; rowNum++) {
        const row = ws.getRow(rowNum);
        const vals = [];
        for (let colNum = 1; colNum <= 15; colNum++) {
            const cell = row.getCell(colNum);
            const v = safeVal(cell);
            if (v && v.trim()) {
                vals.push(`[C${colNum}]${v.trim().substring(0, 50)}`);
            }
        }
        if (vals.length > 0) {
            console.log(`  F${rowNum}: ${vals.join(' | ')}`);
        }
    }
}

(async () => {
    for (const f of files) {
        await readTemplate(f);
    }
    console.log('\n\nLECTURA COMPLETA');
})();
