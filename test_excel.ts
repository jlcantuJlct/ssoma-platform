import db from './lib/db';
import ExcelJS from 'exceljs';

async function run() {
    const records = await db.fetchAll("SELECT tipo, file_data FROM program_templates WHERE tipo IN ('capacitacion', 'inspeccion')");
    for (const row of records) {
        if (!row.file_data) continue;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(Buffer.from(row.file_data, 'base64'));
        const ws = wb.worksheets[0];
        console.log('--- TIPO:', row.tipo, '---');
        for (let i = 5; i <= 10; i++) {
            const r = ws.getRow(i);
            const vals: string[] = [];
            r.eachCell((c, colNumber) => {
                let v = c.value;
                if (typeof v === 'object' && v !== null && 'richText' in v) {
                    v = (v as any).richText.map((rt: any) => rt.text).join('');
                }
                vals.push(`${colNumber}:${v}`);
            });
            console.log(`Row ${i}:`, vals.join(' | '));
        }
    }
}
run().catch(console.error);
