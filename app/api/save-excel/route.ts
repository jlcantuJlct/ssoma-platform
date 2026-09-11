import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzUxEDgad2mc2tfsWwfAlh4RHa0QKA_mJLcUN7AEe1jjEKOznkZ1myAIHe79zhxUB4/exec";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const templatePath = path.join(process.cwd(), 'public', 'temp_vehiculos.xlsx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.worksheets[0];

    // 1. Inyectar Cabecera
    if (data.proyecto) worksheet.getCell('B4').value = data.proyecto;
    if (data.equipo) worksheet.getCell('B5').value = data.equipo;
    if (data.chofer) worksheet.getCell('B6').value = data.chofer;
    if (data.marca) worksheet.getCell('K5').value = data.marca;
    if (data.turno) worksheet.getCell('K6').value = data.turno;
    if (data.modelo) worksheet.getCell('Q5').value = data.modelo;
    if (data.fecha) worksheet.getCell('Q6').value = data.fecha;
    if (data.placa) worksheet.getCell('V5').value = data.placa;

    // 2. Inyectar Lista de Chequeo
    if (data.checklist && Array.isArray(data.checklist)) {
      const labelColumns = [1, 10, 19];
      const valOffsets: Record<string, number> = { 'OK': 2, 'R': 3, 'M': 4, 'F': 5, 'N/A': 6, 'N/A_FUGA': 2, 'RESUM': 3, 'FUGA': 4 };

      worksheet.eachRow((row, rowNumber) => {
        for (const col of labelColumns) {
          const cellValue = row.getCell(col).value;
          if (typeof cellValue === 'string' && cellValue.trim().length > 0) {
            const labelText = cellValue.trim();
            const answer = data.checklist.find((item: any) => item.label === labelText);
            if (answer && valOffsets[answer.value]) {
              const targetCol = col + valOffsets[answer.value];
              const markCell = row.getCell(targetCol);
              markCell.value = 'X';
              markCell.alignment = { horizontal: 'center', vertical: 'middle' };
              markCell.font = { bold: true };
            }
          }
        }
      });
    }

    // 3. Inyectar Observaciones, Parte Diario y FIRMAS
    let firmaColabId: number | null = null;
    let firmaCapatazId: number | null = null;
    
    if (data.firma_colaborador) {
        const base64Data = data.firma_colaborador.replace(/^data:image\/\w+;base64,/, "");
        firmaColabId = workbook.addImage({ buffer: Buffer.from(base64Data, 'base64'), extension: 'png' });
    }
    if (data.firma_capataz) {
        const base64Data = data.firma_capataz.replace(/^data:image\/\w+;base64,/, "");
        firmaCapatazId = workbook.addImage({ buffer: Buffer.from(base64Data, 'base64'), extension: 'png' });
    }

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        // EVITAR CELDAS COMBINADAS
        if (cell.isMerged && cell.address !== cell.master.address) return;

        const val = cell.value?.toString().trim();
        if (!val) return;
        
        if (val === 'OBSERVACIONES:') {
            const obsCell = worksheet.getCell(rowNumber, colNumber + 2);
            obsCell.value = data.observaciones || '';
            obsCell.alignment = { wrapText: true, vertical: 'top' };
        }
        
      });
    });

    // Inyectar Firmas directamente en fila 69 y 70 (Columna J = 10)
    if (data.nombre_colaborador) worksheet.getCell(69, 10).value = data.nombre_colaborador;
    if (firmaColabId !== null) {
        worksheet.addImage(firmaColabId, {
            tl: { col: 9, row: 67.8 }, // Ajuste visual sobre la fila 69
            ext: { width: 160, height: 50 }
        });
    }

    if (data.nombre_capataz) worksheet.getCell(70, 10).value = data.nombre_capataz;
    if (firmaCapatazId !== null) {
        worksheet.addImage(firmaCapatazId, {
            tl: { col: 9, row: 68.8 }, // Ajuste visual sobre la fila 70
            ext: { width: 160, height: 50 }
        });
    }

    // -- Generar Correlativo Único --
    let recordCount = 0;
    try {
        const res = await db.fetchOne('SELECT COUNT(*) as count FROM vehicle_inspection_records');
        if (res) recordCount = res.count;
    } catch (e) {
        // La tabla podría no existir aún en la primera ejecución
    }
    const correlativo = `INSP-VEH-${new Date().getFullYear()}-${String(recordCount + 1).padStart(4, '0')}`;

    // Colocar el correlativo en el Excel en la celda Serie (V6)
    worksheet.getCell('V6').value = correlativo;
    worksheet.getCell('V6').font = { bold: true, color: { argb: 'FF0000FF' } }; // Azul/Rojo para destacar

    // -- Inyectar Fotos al final del documento --
    if (data.fotosEstructuradas && data.fotosEstructuradas.length > 0) {
        let lastRow = worksheet.lastRow ? worksheet.lastRow.number + 5 : 60;
        
        // Título de sección de fotos
        worksheet.getCell(`B${lastRow}`).value = 'EVIDENCIA FOTOGRÁFICA DE HALLAZGOS';
        worksheet.getCell(`B${lastRow}`).font = { bold: true, size: 14 };
        lastRow += 2;

        data.fotosEstructuradas.forEach((foto: any) => {
            try {
                // Escribir la descripción de la foto en la celda
                worksheet.getCell(`B${lastRow}`).value = foto.label;
                worksheet.getCell(`B${lastRow}`).font = { bold: true, color: { argb: 'FFCC0000' } };
                lastRow += 1; // Espacio para la imagen debajo

                if (foto.base64) {
                    const b64Data = foto.base64.replace(/^data:image\/\w+;base64,/, "");
                    const imageId = workbook.addImage({ buffer: Buffer.from(b64Data, 'base64'), extension: 'jpeg' });
                    worksheet.addImage(imageId, { 
                        tl: { col: 1, row: lastRow }, // Columna B
                        ext: { width: 400, height: 300 }
                    });
                    lastRow += 18; // Espaciado para la siguiente foto
                } else {
                    worksheet.getCell(`B${lastRow}`).value = '(Sin evidencia fotográfica adjunta)';
                    worksheet.getCell(`B${lastRow}`).font = { italic: true, color: { argb: 'FF666666' } };
                    lastRow += 2;
                }
            } catch (e) {
                console.error("Error inyectando foto", e);
            }
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    // -- Subir a Google Drive --
    const base64 = buffer.toString('base64');
    const fileName = `${correlativo}_${data.equipo}_${data.placa}.xlsx`;
    const folderPath = `INSPECCIONES/${new Date().getFullYear()}/EQUIPOS`;
    
    const payload = {
        filename: fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileBase64: base64,
        folderId: "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5",
        folderPath: folderPath,
        folderName: folderPath
    };

    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain' },
        redirect: 'follow'
    });

    if (!response.ok) throw new Error('Error al conectar con Google Drive');
    const text = await response.text();
    const driveData = JSON.parse(text);
    if (driveData.result !== 'success') throw new Error(driveData.error || 'Error subiendo archivo');
    const driveUrl = driveData.url || driveData.viewLink;

    // -- Guardar registro en Base de Datos --
    await db.execute(`
        CREATE TABLE IF NOT EXISTS vehicle_inspection_records (
            id BIGINT PRIMARY KEY,
            correlativo VARCHAR(60),
            fecha VARCHAR(50),
            proyecto VARCHAR(100),
            equipo VARCHAR(100),
            marca VARCHAR(100),
            modelo VARCHAR(100),
            placa VARCHAR(50),
            chofer VARCHAR(100),
            turno VARCHAR(50),
            observaciones TEXT,
            nombre_colaborador VARCHAR(100),
            nombre_capataz VARCHAR(100),
            drive_url TEXT,
            status VARCHAR(50) DEFAULT 'Completado',
            fotos_levantamiento TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    try { await db.execute(`ALTER TABLE vehicle_inspection_records ADD COLUMN fotos_levantamiento TEXT DEFAULT '[]'`); } catch(e){}
    try { await db.execute(`ALTER TABLE vehicle_inspection_records ADD COLUMN status VARCHAR(50) DEFAULT 'Completado'`); } catch(e){}

    await db.execute(`
        INSERT INTO vehicle_inspection_records (id, correlativo, fecha, proyecto, equipo, marca, modelo, placa, chofer, turno, observaciones, nombre_colaborador, nombre_capataz, drive_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        Date.now(),
        correlativo,
        data.fecha,
        data.proyecto,
        data.equipo,
        data.marca,
        data.modelo,
        data.placa,
        data.chofer,
        data.turno,
        data.observaciones || '',
        data.nombre_colaborador || data.chofer || '',
        data.nombre_capataz || '',
        driveUrl,
        data.observaciones ? 'Con Observaciones' : 'Completado'
    ]);

    return NextResponse.json({ success: true, url: driveUrl, correlativo });

  } catch (error) {
    console.error('Error guardando excel:', error);
    return NextResponse.json({ error: 'Error procesando y subiendo el documento' }, { status: 500 });
  }
}
