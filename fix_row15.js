const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const isInternasBlock = `
        else if (isInternas) {
            const getAns = (label) => answers.find(a => a.text === label)?.text || '';
            const razon = getAns('Razon:');
            const ruc = getAns('Ruc:');
            const domicilio = getAns('Domicilio:');
            const actividad = getAns('Actividad:');
            const trabajadores = getAns('Trabajadores:');

            const proyecto = getAns('Proyecto:');
            const direccion = getAns('Dirección:');
            const respArea = getAns('Responsable Área:');
            const area = getAns('Área:');
            const tipo = getAns('Tipo:');
            const hora = getAns('Hora:');
            const fecha = getAns('Fecha:');
            const responsables = JSON.parse(getAns('Responsables:') || '[]');
            const hallazgos = JSON.parse(getAns('Hallazgos:') || '[]');
            const conclusiones = getAns('Conclusiones:');
            const regNombre = getAns('RegNombre:');
            const regCargo = getAns('RegCargo:');
            const regFecha = getAns('RegFecha:');
            const regFirma = answers.find(a => a.text === 'RegFirma:')?.signature || '';

            worksheet.getCell('A5').value = razon;
            worksheet.getCell('I5').value = ruc;
            worksheet.getCell('K5').value = domicilio;
            worksheet.getCell('P5').value = actividad;
            worksheet.getCell('T5').value = trabajadores;
            worksheet.getCell('A7').value = proyecto;
            worksheet.getCell('K7').value = direccion;
            worksheet.getCell('I9').value = respArea;
            worksheet.getCell('L9').value = area;
            
            // Tipo de inspección
            let tipoText = "    \\nPlaneada:                  No planeada:             Otro:";
            if (tipo === 'Planeada') tipoText = "    \\nPlaneada: X               No planeada:             Otro:";
            if (tipo === 'No planeada') tipoText = "    \\nPlaneada:                  No planeada: X           Otro:";
            if (tipo === 'Otro') tipoText = "    \\nPlaneada:                  No planeada:             Otro: X";
            worksheet.getCell('O9').value = tipoText;
            
            worksheet.getCell('T9').value = hora;
            worksheet.getCell('T10').value = fecha;

            const respCells = ['A9', 'A10', 'A11', 'A12', 'E9', 'E10', 'E11', 'E12'];
            responsables.forEach((r, idx) => {
                if (idx < 8 && r) {
                    worksheet.getCell(respCells[idx]).value = \`\${idx + 1}) \${r}\`;
                }
            });

            let currentRow = 15;
            hallazgos.forEach((h, idx) => {
                if (idx > 0) {
                    worksheet.duplicateRow(currentRow, 1, true);
                    currentRow++;
                }
                
                worksheet.getCell(\`A\${currentRow}\`).value = idx + 1;
                worksheet.getCell(\`B\${currentRow}\`).value = h.descripcion || '';
                
                if (h.riesgo === 'Bajo') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Bajo';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
                } else if (h.riesgo === 'Medio') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Medio';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAB308' } };
                } else if (h.riesgo === 'Alto') {
                    worksheet.getCell(\`J\${currentRow}\`).value = 'Alto';
                    worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                }

                worksheet.getCell(\`K\${currentRow}\`).value = h.categoria || '';
                worksheet.getCell(\`L\${currentRow}\`).value = h.accion || '';
                worksheet.getCell(\`N\${currentRow}\`).value = h.responsable || '';
                worksheet.getCell(\`P\${currentRow}\`).value = h.fecha || '';
                
                if (h.estado === 'Cerrado') {
                    worksheet.getCell(\`U\${currentRow}\`).value = 'Cerrado';
                    worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
                } else {
                    worksheet.getCell(\`U\${currentRow}\`).value = 'Abierto';
                    worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
                }

                if (h.evidencia) {
                    try {
                        const base64Data = h.evidencia.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        worksheet.addImage(imageId, { tl: { col: 6, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
                
                if (h.evidenciaLevantamiento) {
                    try {
                        const base64Data = h.evidenciaLevantamiento.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        // 16 is Q (0-indexed col internally? No, tl uses 0-indexed coords)
                        // A=0, B=1, ..., G=6, P=15, Q=16, U=20
                        worksheet.addImage(imageId, { tl: { col: 16, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
            });

            const offset = Math.max(0, hallazgos.length - 1);
            
            worksheet.getCell(\`A\${23 + offset}\`).value = conclusiones || '';
            worksheet.getCell(\`A\${26 + offset}\`).value = regNombre || '';
            worksheet.getCell(\`M\${26 + offset}\`).value = regCargo || '';
            worksheet.getCell(\`P\${26 + offset}\`).value = regFecha || '';
            
            if (regFirma) {
                try {
                    const base64Data = regFirma.replace(/^data:image\\/\\w+;base64,/, "");
                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                    worksheet.addImage(imageId, { tl: { col: 19, row: 24 + offset }, ext: { width: 180, height: 60 } });
                } catch(e) {}
            }
        }`;

// Replace existing isInternas block
const regex = /else if \(isInternas\) \{[\s\S]*?\}\s*(?=\/\/ --- MANEJADOR 4)/;
code = code.replace(regex, isInternasBlock + '\n        ');

fs.writeFileSync(path, code);
console.log("Updated row 15 mappings perfectly!");
