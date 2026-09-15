import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { moduleName, answers, template } = data;

        const templatePath = path.join(process.cwd(), 'public', 'templates', 'digital', `${moduleName}.xlsx`);
        let workbook = new ExcelJS.Workbook();
        
        if (fs.existsSync(templatePath)) {
            await workbook.xlsx.readFile(templatePath);
        } else {
            // Fallback en caso de que no hayan subido plantilla
            return NextResponse.json({ error: 'La plantilla Excel original no se encuentra en el servidor. Ve a Inspecciones y usa "Actualizar Formato" para subir el archivo en blanco.' }, { status: 404 });
        }

        const worksheet = workbook.worksheets[0];

        // Extraer metadata de answers
        const getVal = (kw: string) => {
            const idx = template.findIndex((t: any) => t.text.toLowerCase().includes(kw));
            return idx !== -1 ? (answers[idx]?.text || '') : '';
        };

        if (moduleName.toLowerCase().includes('botiquin')) {
            // Mapeo F-SIG-030 basado en la imagen del usuario
            worksheet.getCell('C4').value = getVal('proyecto');
            worksheet.getCell('C5').value = getVal('fecha');
            worksheet.getCell('I5').value = getVal('hora');
            worksheet.getCell('C6').value = getVal('inspector');
            worksheet.getCell('C7').value = getVal('responsable');
            worksheet.getCell('C8').value = getVal('ubicación');
            
            // Inspección planificada (A10, A11, D12) - Mapearemos con X si tenemos la data
            
            // Llenar Items
            // La fila 15 es el primer ítem en el formato F-SIG-030
            let itemStartRow = 15;
            
            template.forEach((item: any, idx: number) => {
                const text = item.text.toLowerCase();
                if (['proyecto', 'fecha', 'hora', 'inspector', 'cargo', 'responsable', 'ubicación', 'planificada'].some(k => text.includes(k))) return;
                
                if (text.includes('observaciones') || text.includes('comentario')) {
                    // Colocar observaciones en la fila 36 (o la que corresponda, buscaremos la palabra Observaciones)
                    let obsRow = 36;
                    for (let i = 25; i <= 45; i++) {
                        const cellText = worksheet.getCell(`A${i}`).value?.toString().toLowerCase() || '';
                        const cellB = worksheet.getCell(`B${i}`).value?.toString().toLowerCase() || '';
                        if (cellText.includes('observaciones') || cellB.includes('observaciones')) {
                            obsRow = i + 1;
                            break;
                        }
                    }
                    worksheet.getCell(`A${obsRow}`).value = answers[idx]?.text || '';
                } else if (answers[idx]?.text === 'C' || answers[idx]?.text === 'NC' || answers[idx]?.text === 'N/A') {
                    // Buscar la fila correcta para este ítem buscando su texto en la columna B
                    let foundRow = -1;
                    for(let r = 14; r <= 35; r++) {
                        const bVal = worksheet.getCell(`B${r}`).value?.toString().toLowerCase() || '';
                        if (bVal && text.includes(bVal.substring(0, 15).trim())) {
                            foundRow = r;
                            break;
                        }
                    }
                    
                    const targetRow = foundRow !== -1 ? foundRow : itemStartRow++;
                    
                    const ans = answers[idx]?.text;
                    const qty = answers[idx]?.qty;
                    
                    // Cantidad en la columna J
                    if (qty) worksheet.getCell(`J${targetRow}`).value = qty;
                    
                    // X en la columna K, L, M
                    if (ans === 'C') worksheet.getCell(`K${targetRow}`).value = 'X';
                    if (ans === 'NC') worksheet.getCell(`L${targetRow}`).value = 'X';
                    if (ans === 'N/A') worksheet.getCell(`M${targetRow}`).value = 'X';
                }
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="Reporte_${moduleName}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
