export const maxDuration = 60;
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { moduleName, answers, template } = data;

        let templatePath = path.join(process.cwd(), 'public', 'templates', 'digital', `${moduleName}.xlsx`);
        if (!fs.existsSync(templatePath)) {
            if (moduleName && (moduleName.toLowerCase().includes('extintor') || moduleName.toLowerCase().includes('emergencia'))) {
                const alt = path.join(process.cwd(), 'public', 'templates', 'digital', 'Extintores.xlsx');
                if (fs.existsSync(alt)) templatePath = alt;
            } else if (moduleName && moduleName.toLowerCase().includes('botiquin')) {
                const alt = path.join(process.cwd(), 'public', 'templates', 'digital', 'Botiquines.xlsx');
                if (fs.existsSync(alt)) templatePath = alt;
            }
        }
        let workbook = new ExcelJS.Workbook();
        
        const isBotiquin = moduleName && moduleName.toLowerCase().includes('botiquin');
        const isEpp = data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes('epp'));
        const isExtintor = data.isExtinguisherMatrix || (moduleName && (moduleName.toLowerCase().includes('extintor') || moduleName.toLowerCase().includes('emergencia')));
        const isMachinery = data.isMachineryMatrix || (moduleName && (moduleName.toLowerCase().includes('maquinaria') || moduleName.toLowerCase().includes('máquina') || moduleName.toLowerCase().includes('maquina')));

        let worksheet: ExcelJS.Worksheet;

        if (fs.existsSync(templatePath)) {
            await workbook.xlsx.readFile(templatePath);
            worksheet = workbook.worksheets[0];
        } else {
            // Generar plantilla estructurada limpia desde cero si el archivo físico aún no fue subido
            worksheet = workbook.addWorksheet(moduleName || 'Inspección');
        }

        // --- MANEJADOR 1: BOTIQUINES (Calibrado a F-SIG-030) ---
        if (isBotiquin && fs.existsSync(templatePath)) {
            const getVal = (kw: string) => {
                const idx = (template || []).findIndex((t: any) => t.text.toLowerCase().includes(kw));
                return idx !== -1 ? (answers[idx]?.text || '') : '';
            };

            const getSignature = (kw: string) => {
                const idx = (template || []).findIndex((t: any) => t.text.toLowerCase().includes(kw));
                return idx !== -1 ? (answers[idx]?.signature || '') : '';
            };

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
                    worksheet.addImage(imageId, { tl: { col: 10, row: 5 }, ext: { width: 120, height: 40 } });
                } catch(e) { console.error(e); }
            }

            const respSig = getSignature('responsable');
            if (respSig) {
                try {
                    const base64Data = respSig.replace(/^data:image\/\w+;base64,/, "");
                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 40 } });
                } catch(e) { console.error(e); }
            }
            
            const isPlanificada = (template || []).findIndex((t: any) => t.text.toLowerCase().includes('planificada') && !t.text.toLowerCase().includes('no planificada'));
            const isNoPlanificada = (template || []).findIndex((t: any) => t.text.toLowerCase().includes('no planificada') || t.text.toLowerCase().includes('inopinada'));

            if (isPlanificada !== -1 && answers[isPlanificada]?.text === 'true') worksheet.getCell('A10').value = 'X';
            if (isNoPlanificada !== -1 && answers[isNoPlanificada]?.text === 'true') worksheet.getCell('A11').value = 'X';
            
            let hallazgosText = '';
            let observacionesPrincipales = '';
            let itemStartRow = 15;
            
            (template || []).forEach((item: any, idx: number) => {
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

            const finalObs = [observacionesPrincipales, hallazgosText ? `HALLAZGOS:\n${hallazgosText}` : ''].filter(Boolean).join('\n\n');
            if (finalObs) {
                worksheet.getCell('A36').value = finalObs;
                worksheet.getCell('A36').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            }

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
                        let colCursor = 1;
                        fotos.forEach((fotoB64: string) => {
                            try {
                                const base64Data = fotoB64.replace(/^data:image\/\w+;base64,/, "");
                                const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                                worksheet.addImage(imageId, {
                                    tl: { col: colCursor - 1, row: currentPhotoRow - 1 },
                                    ext: { width: 300, height: 220 }
                                });
                                colCursor += 5;
                                if (colCursor > 10) { colCursor = 1; currentPhotoRow += 13; }
                            } catch(e) { console.error('Error attaching photo:', e); }
                        });
                        if (colCursor > 1) currentPhotoRow += 13;
                    }
                });
            }
        } 
        // --- MANEJADOR 2: EPP MATRICIAL ---
        else if (isEpp) {
            const meta = data.meta || {};
            const workers = data.workers || [];

            worksheet.mergeCells('A1:G2');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'REGISTRO DE INSPECCIÓN DE EQUIPOS DE PROTECCIÓN PERSONAL (EPP)';
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

            worksheet.getCell('A4').value = 'Proyecto:';
            worksheet.getCell('B4').value = meta.proyecto || 'RED VIAL 6';
            worksheet.getCell('D4').value = 'Fecha:';
            worksheet.getCell('E4').value = meta.fecha || new Date().toISOString().split('T')[0];
            worksheet.getCell('A5').value = 'Supervisor SSOMA:';
            worksheet.getCell('B5').value = meta.supervisor || meta.inspector || '';
            worksheet.getCell('D5').value = 'Área:';
            worksheet.getCell('E5').value = meta.area || '';

            ['A4', 'D4', 'A5', 'D5'].forEach(c => worksheet.getCell(c).font = { bold: true });

            const headers = ['N°', 'Trabajador', 'DNI', 'Cargo', 'EPPs Observados / No Conforme', 'Firma'];
            const headerRow = worksheet.getRow(7);
            headers.forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
                cell.alignment = { horizontal: 'center' };
            });

            workers.forEach((w: any, idx: number) => {
                const r = worksheet.getRow(8 + idx);
                r.getCell(1).value = idx + 1;
                r.getCell(2).value = w.workerName || '';
                r.getCell(3).value = w.dni || '';
                r.getCell(4).value = w.cargo || '';
                r.getCell(5).value = (w.badEpps && w.badEpps.length > 0) ? w.badEpps.join(', ') : 'CONFORME (100%)';
                r.getCell(6).value = w.firma ? '[Firma Digital]' : 'Firmado';
            });

            worksheet.columns = [
                { width: 6 }, { width: 32 }, { width: 14 }, { width: 22 }, { width: 40 }, { width: 16 }, { width: 16 }
            ];
        }
        // --- MANEJADOR 3: EXTINTORES Y EQUIPOS DE EMERGENCIA (Calibrado a F-SIG-058) ---
        else if (isExtintor) {
            const meta = data.meta || {};
            const extinguishers = data.extinguishers || [];

            if (fs.existsSync(templatePath)) {
                // 1. Datos Generales (Cabecera)
                if (meta.registro) worksheet.getCell('B4').value = meta.registro;
                if (meta.fecha) worksheet.getCell('E4').value = meta.fecha;
                if (meta.actividadEconomica) worksheet.getCell('I4').value = meta.actividadEconomica;

                if (meta.razonSocial) worksheet.getCell('A6').value = meta.razonSocial;
                if (meta.ruc) worksheet.getCell('C6').value = meta.ruc;
                if (meta.domicilio) worksheet.getCell('E6').value = meta.domicilio;
                if (meta.nTrabajadores) worksheet.getCell('I6').value = meta.nTrabajadores;

                if (meta.proyecto) worksheet.getCell('B8').value = meta.proyecto;
                if (meta.ubicacionProyecto) worksheet.getCell('G8').value = meta.ubicacionProyecto;

                // 2. Equipos de Emergencia (Filas 11 en adelante)
                const totalExtinguishers = extinguishers.length;
                let sigDataRow = 23;

                // Si hay más de 10 extintores, insertamos filas adicionales manteniendo estilo
                if (totalExtinguishers > 10) {
                    const extraCount = totalExtinguishers - 10;
                    worksheet.spliceRows(21, 0, ...Array(extraCount).fill([]));
                    const baseRow = worksheet.getRow(20);
                    for (let r = 21; r < 21 + extraCount; r++) {
                        const newRow = worksheet.getRow(r);
                        newRow.height = 27;
                        for (let c = 1; c <= 10; c++) {
                            newRow.getCell(c).style = JSON.parse(JSON.stringify(baseRow.getCell(c).style || {}));
                        }
                    }

                    const sigRow = 21 + extraCount;
                    try { worksheet.mergeCells(`A${sigRow}:J${sigRow}`); } catch(e){}
                    try { worksheet.mergeCells(`A${sigRow+1}:C${sigRow+1}`); } catch(e){}
                    try { worksheet.mergeCells(`D${sigRow+1}:E${sigRow+1}`); } catch(e){}
                    try { worksheet.mergeCells(`G${sigRow+1}:H${sigRow+1}`); } catch(e){}
                    try { worksheet.mergeCells(`I${sigRow+1}:J${sigRow+1}`); } catch(e){}
                    try { worksheet.mergeCells(`A${sigRow+2}:C${sigRow+2}`); } catch(e){}
                    try { worksheet.mergeCells(`D${sigRow+2}:E${sigRow+2}`); } catch(e){}
                    try { worksheet.mergeCells(`G${sigRow+2}:H${sigRow+2}`); } catch(e){}
                    try { worksheet.mergeCells(`I${sigRow+2}:J${sigRow+2}`); } catch(e){}

                    sigDataRow = 23 + extraCount;
                }

                extinguishers.forEach((ext: any, idx: number) => {
                    const r = 11 + idx;
                    worksheet.getCell(`A${r}`).value = ext.tipo || '';
                    worksheet.getCell(`B${r}`).value = ext.codigo || '';
                    worksheet.getCell(`C${r}`).value = ext.ubicacion || '';
                    worksheet.getCell(`D${r}`).value = ext.agente || '';
                    worksheet.getCell(`E${r}`).value = ext.fechaActual || '';
                    worksheet.getCell(`F${r}`).value = ext.fechaProxima || '';
                    worksheet.getCell(`G${r}`).value = ext.senalizacion || 'C';
                    worksheet.getCell(`H${r}`).value = ext.acceso || 'C';
                    worksheet.getCell(`I${r}`).value = ext.estado || ext.estadoGeneral || 'C';
                    worksheet.getCell(`J${r}`).value = ext.observaciones || '';

                    ['B', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
                        worksheet.getCell(`${col}${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
                    });
                });

                // 3. Responsable del Registro (Firmas)
                worksheet.getCell(`A${sigDataRow}`).value = meta.inspector || '';
                worksheet.getCell(`D${sigDataRow}`).value = meta.cargoInspector || '';
                worksheet.getCell(`G${sigDataRow}`).value = meta.fechaFirma || meta.fecha || '';

                worksheet.getCell(`A${sigDataRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`D${sigDataRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`G${sigDataRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

                if (meta.firmaInspector) {
                    try {
                        const base64Data = meta.firmaInspector.replace(/^data:image\/\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, {
                            tl: { col: 8, row: sigDataRow - 1 },
                            ext: { width: 140, height: 50 }
                        });
                    } catch(e) {
                        console.error('Error al insertar firma de extintores:', e);
                    }
                }

                // 4. Registro Fotográfico de Evidencias (si existen)
                if (data.fotosDefectos && Object.keys(data.fotosDefectos).length > 0) {
                    let currentPhotoRow = sigDataRow + 3;
                    worksheet.getCell(`A${currentPhotoRow}`).value = "REGISTRO FOTOGRÁFICO DE HALLAZGOS / INSPECCIÓN:";
                    worksheet.getCell(`A${currentPhotoRow}`).font = { bold: true };
                    currentPhotoRow += 2;

                    Object.keys(data.fotosDefectos).forEach(itemName => {
                        const fotos = data.fotosDefectos[itemName];
                        if (fotos && fotos.length > 0) {
                            worksheet.getCell(`A${currentPhotoRow}`).value = `Equipo / Hallazgo: ${itemName}`;
                            currentPhotoRow += 1;
                            let colCursor = 1;
                            fotos.forEach((fotoB64: string) => {
                                try {
                                    const base64Data = fotoB64.replace(/^data:image\/\w+;base64,/, "");
                                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                                    worksheet.addImage(imageId, {
                                        tl: { col: colCursor - 1, row: currentPhotoRow - 1 },
                                        ext: { width: 300, height: 220 }
                                    });
                                    colCursor += 5;
                                    if (colCursor > 10) { colCursor = 1; currentPhotoRow += 13; }
                                } catch(e) { console.error('Error attaching photo:', e); }
                            });
                            if (colCursor > 1) currentPhotoRow += 13;
                        }
                    });
                }
            } else {
                worksheet.mergeCells('A1:H2');
                const titleCell = worksheet.getCell('A1');
                titleCell.value = 'REGISTRO DE INSPECCIÓN DE EXTINTORES Y EQUIPOS DE EMERGENCIA (F-SIG-058)';
                titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
                titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
                titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } };

                worksheet.getCell('A4').value = 'Razón Social:'; worksheet.getCell('B4').value = meta.razonSocial || 'Construcción y Administración S.A.';
                worksheet.getCell('D4').value = 'Fecha:'; worksheet.getCell('E4').value = meta.fecha || new Date().toISOString().split('T')[0];
                worksheet.getCell('A5').value = 'Proyecto:'; worksheet.getCell('B5').value = meta.proyecto || 'RED VIAL 6';
                worksheet.getCell('D5').value = 'Inspector:'; worksheet.getCell('E5').value = meta.inspector || '';
                ['A4', 'D4', 'A5', 'D5'].forEach(c => worksheet.getCell(c).font = { bold: true });

                const headers = ['N°', 'Tipo', 'Código', 'Ubicación', 'Agente', 'F. Actual', 'F. Próxima', 'Señaliz.', 'Acceso', 'Estado', 'Observaciones'];
                const headerRow = worksheet.getRow(7);
                headers.forEach((h, idx) => {
                    const cell = headerRow.getCell(idx + 1);
                    cell.value = h;
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
                    cell.alignment = { horizontal: 'center' };
                });

                extinguishers.forEach((ext: any, idx: number) => {
                    const r = worksheet.getRow(8 + idx);
                    r.getCell(1).value = idx + 1;
                    r.getCell(2).value = ext.tipo || '';
                    r.getCell(3).value = ext.codigo || '';
                    r.getCell(4).value = ext.ubicacion || '';
                    r.getCell(5).value = ext.agente || '';
                    r.getCell(6).value = ext.fechaActual || '';
                    r.getCell(7).value = ext.fechaProxima || '';
                    r.getCell(8).value = ext.senalizacion || 'C';
                    r.getCell(9).value = ext.acceso || 'C';
                    r.getCell(10).value = ext.estado || 'C';
                    r.getCell(11).value = ext.observaciones || '';
                });

                worksheet.columns = [
                    { width: 6 }, { width: 22 }, { width: 14 }, { width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 30 }
                ];
            }
        }
        // --- MANEJADOR 4: MAQUINARIA Y EQUIPO PESADO ---
        else if (isMachinery) {
            const meta = data.meta || {};
            const checklist = data.checklist || {};
            const observaciones = data.observaciones || '';

            worksheet.mergeCells('A1:F2');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'CHECKLIST DE INSPECCIÓN DE PRE-USO DE MAQUINARIA';
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };

            worksheet.getCell('A4').value = 'Equipo:'; worksheet.getCell('B4').value = meta.equipo || '';
            worksheet.getCell('D4').value = 'Fecha:'; worksheet.getCell('E4').value = meta.fecha || new Date().toISOString().split('T')[0];
            worksheet.getCell('A5').value = 'Marca/Modelo:'; worksheet.getCell('B5').value = `${meta.marca || ''} ${meta.modelo || ''}`;
            worksheet.getCell('D5').value = 'Placa/Serie:'; worksheet.getCell('E5').value = meta.placa || '';
            worksheet.getCell('A6').value = 'Operador/Chofer:'; worksheet.getCell('B6').value = meta.chofer || meta.operador || '';
            worksheet.getCell('D6').value = 'Horómetro:'; worksheet.getCell('E6').value = meta.horometro || '';
            ['A4', 'D4', 'A5', 'D5', 'A6', 'D6'].forEach(c => worksheet.getCell(c).font = { bold: true });

            const headers = ['N°', 'Componente / Sistema Evaluado', 'Evaluación (OK / R / M / F / N/A)'];
            const headerRow = worksheet.getRow(8);
            headers.forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
            });

            let rowIdx = 9;
            Object.keys(checklist).forEach((item, idx) => {
                const r = worksheet.getRow(rowIdx++);
                r.getCell(1).value = idx + 1;
                r.getCell(2).value = item;
                r.getCell(3).value = checklist[item];
                r.getCell(3).alignment = { horizontal: 'center' };
            });

            worksheet.getCell(`A${rowIdx + 1}`).value = 'OBSERVACIONES:';
            worksheet.getCell(`A${rowIdx + 1}`).font = { bold: true };
            worksheet.getCell(`A${rowIdx + 2}`).value = observaciones || 'Sin observaciones adicionales.';

            worksheet.columns = [{ width: 6 }, { width: 45 }, { width: 28 }, { width: 15 }, { width: 15 }, { width: 15 }];
        }
        // --- MANEJADOR 5: INSPECCIONES DIGITALES GENÉRICAS (Almacén, Escaleras, etc.) ---
        else {
            // Si no tiene plantilla física, creamos una vista tabular ordenada
            if (!fs.existsSync(templatePath)) {
                worksheet.mergeCells('A1:E2');
                const titleCell = worksheet.getCell('A1');
                titleCell.value = `INSPECCIÓN DIGITAL: ${(moduleName || 'GENERAL').toUpperCase()}`;
                titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
                titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
                titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

                let curRow = 4;
                worksheet.getCell(`A${curRow}`).value = 'Fecha:';
                worksheet.getCell(`B${curRow}`).value = new Date().toISOString().split('T')[0];
                worksheet.getCell(`A${curRow}`).font = { bold: true };
                curRow += 2;

                const headers = ['N°', 'Ítem / Criterio', 'Cantidad', 'Respuesta / Evaluación'];
                const hRow = worksheet.getRow(curRow++);
                headers.forEach((h, idx) => {
                    const c = hRow.getCell(idx + 1);
                    c.value = h;
                    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
                });

                (template || []).forEach((tItem: any, idx: number) => {
                    const ans = answers ? answers[idx] : null;
                    const r = worksheet.getRow(curRow++);
                    r.getCell(1).value = idx + 1;
                    r.getCell(2).value = tItem.text || '';
                    r.getCell(3).value = ans?.qty || ans?.quantity || tItem.qty || '';
                    r.getCell(4).value = ans?.text !== undefined ? ans.text : (ans?.isConforme !== undefined ? (ans.isConforme ? 'CUMPLE' : 'NO CUMPLE') : '');
                });

                worksheet.columns = [{ width: 6 }, { width: 45 }, { width: 14 }, { width: 25 }, { width: 25 }];
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












