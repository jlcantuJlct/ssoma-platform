const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const isInternasBlock = `        // --- MANEJADOR INTERNAS ---
        else if (isInternas) {
            const getAns = (label: string) => answers.find((a: any) => a.text === label)?.text || '';
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
            const regFirma = answers.find((a: any) => a.text === 'RegFirma:')?.signature || '';

            worksheet.getCell('A7').value = proyecto;
            worksheet.getCell('K7').value = direccion;
            worksheet.getCell('I9').value = respArea;
            worksheet.getCell('L9').value = area;
            
            let tipoText = "    \\\\nPlaneada:                  No planeada:             Otro:";
            if (tipo === 'Planeada') tipoText = "    \\\\nPlaneada: X               No planeada:             Otro:";
            if (tipo === 'No planificada' || tipo === 'No planeada') tipoText = "    \\\\nPlaneada:                  No planeada: X           Otro:";
            if (tipo === 'Otro') tipoText = "    \\\\nPlaneada:                  No planeada:             Otro: X";
            worksheet.getCell('O9').value = tipoText;
            
            worksheet.getCell('T9').value = hora;
            worksheet.getCell('U9').value = fecha;

            const resCells = ['A9', 'A10', 'A11', 'A12', 'E9', 'E10', 'E11', 'E12'];
            for(let i = 0; i < 8; i++) {
                if (responsables[i]) {
                    worksheet.getCell(resCells[i]).value = \`\${i<4 ? i+1 : i+1}) \${responsables[i]}\`;
                }
            }

            // Grid logic
            let currentRow = 15;
            for (let i = 0; i < hallazgos.length; i++) {
                if (currentRow > 21) {
                    break;
                }
                const h = hallazgos[i];
                worksheet.getCell(\`A\${currentRow}\`).value = i + 1;
                worksheet.getCell(\`B\${currentRow}\`).value = h.descripcion;
                worksheet.getCell(\`J\${currentRow}\`).value = h.riesgo;
                if (h.riesgo === 'Bajo') worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFc6efce' } };
                if (h.riesgo === 'Medio') worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFffeb9c' } };
                if (h.riesgo === 'Alto') worksheet.getCell(\`J\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFffc7ce' } };
                
                worksheet.getCell(\`K\${currentRow}\`).value = h.categoria;
                worksheet.getCell(\`L\${currentRow}\`).value = h.accion;
                worksheet.getCell(\`N\${currentRow}\`).value = h.responsable;
                worksheet.getCell(\`P\${currentRow}\`).value = h.fecha;
                worksheet.getCell(\`U\${currentRow}\`).value = h.estado;
                if (h.estado === 'Abierto') worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFffc7ce' } };
                if (h.estado === 'Cerrado') worksheet.getCell(\`U\${currentRow}\`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFc6efce' } };
                
                // Photo Evidencia
                if (h.evidencia) {
                    try {
                        const base64Data = h.evidencia.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        // col 6 is G
                        worksheet.addImage(imageId, { tl: { col: 6, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
                
                // Photo Levantamiento
                if (h.evidenciaLevantamiento) {
                    try {
                        const base64Data = h.evidenciaLevantamiento.replace(/^data:image\\/\\w+;base64,/, "");
                        const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                        // col 16 is Q
                        worksheet.addImage(imageId, { tl: { col: 16, row: currentRow - 1 }, ext: { width: 100, height: 100 } });
                        worksheet.getRow(currentRow).height = 80;
                    } catch(e) {}
                }
                currentRow++;
            }

            // Cleanup remaining blank rows if any (from 15 to 21)
            for (let i = currentRow; i <= 21; i++) {
                worksheet.getCell(\`A\${i}\`).value = '';
                worksheet.getCell(\`B\${i}\`).value = '';
            }

            worksheet.getCell(\`A23\`).value = conclusiones;
            worksheet.getCell(\`A26\`).value = regNombre;
            worksheet.getCell(\`M26\`).value = regCargo;
            worksheet.getCell(\`P26\`).value = regFecha;
            
            if (regFirma) {
                try {
                    const base64Data = regFirma.replace(/^data:image\\/\\w+;base64,/, "");
                    const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                    // T26 -> col 19, row 25
                    worksheet.addImage(imageId, { tl: { col: 19, row: 25 }, ext: { width: 120, height: 35 } });
                } catch(e) {}
            }
        }
`;

const targetString = '        // --- MANEJADOR 5: INSPECCIONES DIGITALES GENÉRICAS';

if (!code.includes('else if (isInternas)')) {
    const idx = code.indexOf(targetString);
    if (idx !== -1) {
        // Insert right before MANEJADOR 5
        const newCode = code.slice(0, idx) + isInternasBlock + code.slice(idx);
        fs.writeFileSync(path, newCode);
        console.log('Injected isInternas perfectly via substring!');
    } else {
        console.log('Could not find injection target!');
    }
} else {
    console.log('Already injected!');
}
