import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { moduleName, answers, template } = data;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inspección');

        if (moduleName.toLowerCase().includes('botiquin')) {
            // Replicar formato F-SIG-030
            worksheet.getColumn('A').width = 5;
            worksheet.getColumn('B').width = 60;
            worksheet.getColumn('C').width = 10;
            worksheet.getColumn('D').width = 10;
            worksheet.getColumn('E').width = 10;

            // Título
            worksheet.mergeCells('A1:E2');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'INSPECCIÓN DE BOTIQUÍN (Vista Previa)';
            titleCell.font = { name: 'Arial', size: 16, bold: true };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            // Extraer metadata de answers
            const getVal = (kw: string) => {
                const idx = template.findIndex((t: any) => t.text.toLowerCase().includes(kw));
                return idx !== -1 ? (answers[idx]?.text || '') : '';
            };

            const metaStart = 4;
            worksheet.getCell(`A${metaStart}`).value = 'Proyecto:';
            worksheet.getCell(`B${metaStart}`).value = getVal('proyecto');
            worksheet.getCell(`A${metaStart+1}`).value = 'Fecha:';
            worksheet.getCell(`B${metaStart+1}`).value = getVal('fecha');
            worksheet.getCell(`D${metaStart+1}`).value = 'Hora:';
            worksheet.getCell(`E${metaStart+1}`).value = getVal('hora');
            
            // Encabezados Tabla
            const tableStart = metaStart + 4;
            worksheet.getCell(`A${tableStart}`).value = 'Ítem';
            worksheet.getCell(`B${tableStart}`).value = 'Inspección de Botiquines';
            worksheet.getCell(`C${tableStart}`).value = 'Cant.';
            worksheet.getCell(`D${tableStart}`).value = 'C / NC / NA';
            
            const headerRow = worksheet.getRow(tableStart);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.eachCell(c => {
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000080' } }; // Azul oscuro
                c.alignment = { horizontal: 'center' };
                c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // Llenar Items
            let rowIdx = tableStart + 1;
            let itemNum = 1;
            
            template.forEach((item: any, idx: number) => {
                const text = item.text.toLowerCase();
                // Ignorar metadata en la tabla
                if (['proyecto', 'fecha', 'hora', 'inspector', 'cargo', 'responsable', 'ubicación'].some(k => text.includes(k))) return;
                
                if (text.includes('observaciones')) {
                    rowIdx++;
                    worksheet.mergeCells(`A${rowIdx}:E${rowIdx}`);
                    const obsTitle = worksheet.getCell(`A${rowIdx}`);
                    obsTitle.value = 'OBSERVACIONES';
                    obsTitle.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    obsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000080' } };
                    obsTitle.alignment = { horizontal: 'center' };
                    
                    rowIdx++;
                    worksheet.mergeCells(`A${rowIdx}:E${rowIdx+2}`);
                    const obsVal = worksheet.getCell(`A${rowIdx}`);
                    obsVal.value = answers[idx]?.text || '';
                    obsVal.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
                    rowIdx += 2;
                } else if (answers[idx]?.text === 'C' || answers[idx]?.text === 'NC' || answers[idx]?.text === 'N/A') {
                    // Item de checklist
                    worksheet.getCell(`A${rowIdx}`).value = itemNum++;
                    worksheet.getCell(`B${rowIdx}`).value = item.text;
                    worksheet.getCell(`C${rowIdx}`).value = answers[idx]?.qty || '';
                    worksheet.getCell(`D${rowIdx}`).value = answers[idx]?.text || '';
                    
                    // Estilos de fila
                    worksheet.getRow(rowIdx).eachCell({ includeEmpty: true }, (c, colNum) => {
                        if (colNum <= 4) {
                            c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                            if (colNum === 1 || colNum === 3 || colNum === 4) c.alignment = { horizontal: 'center' };
                        }
                    });
                    rowIdx++;
                }
            });
        } else {
            // Render genérico para otros módulos
            worksheet.getCell('A1').value = 'Módulo no configurado para preview exacto';
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="Vista_Previa_${moduleName}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
