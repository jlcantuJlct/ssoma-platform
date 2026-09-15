export const maxDuration = 60;
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

                const getSignature = (kw: string) => {
            const idx = template.findIndex((t: any) => t.text.toLowerCase().includes(kw));
            return idx !== -1 ? (answers[idx]?.signature || '') : '';
        };

                        if (moduleName.toLowerCase().includes('botiquin')) {
            worksheet.getCell('C4').value = getVal('proyecto');
            worksheet.getCell('C5').value = getVal('fecha');
            worksheet.getCell('I5').value = getVal('hora');
            worksheet.getCell('D6').value = getVal('inspector');
            worksheet.getCell('D7').value = getVal('responsable');
            worksheet.getCell('D8').value = getVal('ubicación');
            
            const inspSig = getSignature('inspector');
            if (inspSig) {
                try {
                    const base64Data = inspSig.replace(/^data:image\/\w+;base64,/, "");
                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 9, row: 5 }, ext: { width: 120, height: 40 } });
                } catch(e) { console.error(e); }
            }

            const respSig = getSignature('responsable');
            if (respSig) {
                try {
                    const base64Data = respSig.replace(/^data:image\/\w+;base64,/, "");
                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 9, row: 6 }, ext: { width: 120, height: 40 } });
                } catch(e) { console.error(e); }
            }
            
            // Inspección planificada (A10, A11) 
            const isPlanificada = template.findIndex((t: any) => t.text.toLowerCase().includes('planificada') && !t.text.toLowerCase().includes('no planificada'));
            const isNoPlanificada = template.findIndex((t: any) => t.text.toLowerCase().includes('no planificada') || t.text.toLowerCase().includes('inopinada'));

            if (isPlanificada !== -1 && answers[isPlanificada]?.text === 'true') worksheet.getCell('A10').value = 'X';
            if (isNoPlanificada !== -1 && answers[isNoPlanificada]?.text === 'true') worksheet.getCell('A11').value = 'X';
            
            let hallazgosText = '';
            let observacionesPrincipales = '';
            
            let itemStartRow = 15;
            
            template.forEach((item: any, idx: number) => {
                const text = item.text.toLowerCase();
                if (['proyecto', 'fecha', 'hora', 'inspector', 'cargo', 'responsable', 'ubicación', 'planificada'].some(k => text.includes(k))) return;
                
                if (text.includes('observaciones') || text.includes('comentario')) {
                    observacionesPrincipales = answers[idx]?.text || '';
                    return;
                }
                
                if (answers[idx]?.text === 'C' || answers[idx]?.text === 'NC' || answers[idx]?.text === 'N/A') {
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
                    if (qty) worksheet.getCell(`J${targetRow}`).value = qty;
                    if (ans === 'C') worksheet.getCell(`K${targetRow}`).value = 'X';
                    if (ans === 'NC') {
                        worksheet.getCell(`L${targetRow}`).value = 'X';
                        hallazgosText += `- ${item.text}: NO CONFORME\n`;
                    }
                    if (ans === 'N/A') worksheet.getCell(`M${targetRow}`).value = 'X';
                }
            });

            // Combinar observaciones y hallazgos
            const finalObs = [observacionesPrincipales, hallazgosText ? `HALLAZGOS:\n${hallazgosText}` : ''].filter(Boolean).join('\n\n');
            if (finalObs) {
                // Escribir en la celda A35 que está dentro del cuadro de observaciones
                worksheet.getCell('A36').value = finalObs;
                worksheet.getCell('A36').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            }

            // Añadir Fotos en la fila 48
            let currentPhotoRow = 48;
            if (data.fotosDefectos) {
                worksheet.getCell(`A${currentPhotoRow}`).value = "REGISTRO FOTOGRÁFICO DE HALLAZGOS:";
                worksheet.getCell(`A${currentPhotoRow}`).font = { bold: true };
                currentPhotoRow += 2;

                Object.keys(data.fotosDefectos).forEach(itemName => {
                    const fotos = data.fotosDefectos[itemName];
                    if (fotos && fotos.length > 0) {
                        worksheet.getCell(`A${currentPhotoRow}`).value = `Hallazgo: ${itemName}`;
                        currentPhotoRow += 1;
                        
                        let colCursor = 1; // A=1
                        
                        fotos.forEach((fotoB64: string) => {
                            try {
                                const base64Data = fotoB64.replace(/^data:image\/\w+;base64,/, "");
                                const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                                
                                worksheet.addImage(imageId, {
                                    tl: { col: colCursor - 1, row: currentPhotoRow - 1 },
                                    ext: { width: 300, height: 220 }
                                });
                                
                                colCursor += 5; // Move right for the next photo
                                if (colCursor > 10) {
                                    colCursor = 1;
                                    currentPhotoRow += 13;
                                }
                            } catch(e) { console.error('Error attaching photo:', e); }
                        });
                        
                        if (colCursor > 1) {
                            currentPhotoRow += 13;
                        }
                    }
                });
            }
        }
const buffer = await workbook.xlsx.writeBuffer();

        if (data.saveToDrive) {
            const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzUxEDgad2mc2tfsWwfAlh4RHa0QKA_mJLcUN7AEe1jjEKOznkZ1myAIHe79zhxUB4/exec";
            const base64 = buffer.toString('base64');
            const fileName = `INSP_${moduleName}_${new Date().getTime()}.xlsx`;
            const folderPath = `INSPECCIONES/${new Date().getFullYear()}/${moduleName.toUpperCase()}`;
            
            const payload = {
                filename: fileName,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                fileBase64: base64,
                folderId: "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5",
                folderPath: folderPath,
                folderName: folderPath
            };

            const driveRes = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'text/plain' },
                redirect: 'follow'
            });

            let driveUrl = '';
            if (driveRes.ok) {
                const text = await driveRes.text();
                const driveData = JSON.parse(text);
                if (driveData.result === 'success') {
                    driveUrl = driveData.url || driveData.viewLink || '';
                }
            }

            return NextResponse.json({
                success: true,
                driveUrl,
                fileBase64: base64
            });
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="Reporte_${moduleName}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

    } catch (error: any) {
        console.error('EXPORT EXCEL ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}












