import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const templatePath = 'C:/Users/jlcan/.gemini/antigravity/brain/75aba137-b120-44c8-9e07-c25fe322df15/.user_uploaded/media_1795392426771_d01bd7ae.xlsx';
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found at ' + templatePath }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // 1. CARÁTULA
    const wsCaratula = workbook.getWorksheet('Carátula');
    if (wsCaratula) {
      for (let r = 12; r <= 15; r++) {
        const row = wsCaratula.getRow(r);
        for (let c = 1; c <= 7; c++) {
          if (row.getCell(c).value) {
            row.getCell(c).value = 'Informe del Subcomité de SST – Trimestre III (Julio – Septiembre 2026)';
          }
        }
      }
      wsCaratula.getCell('B18').value = '06 de Octubre de 2026';
    }

    // 2. MIEMBROS
    const wsMiembros = workbook.getWorksheet('Miembros');
    if (wsMiembros) {
      const notaCell = wsMiembros.getCell('A13');
      notaCell.value = 'Durante el Tercer Trimestre 2026 (julio – septiembre 2026), el Subcomité de Seguridad y Salud en el Trabajo (SCSST – periodo 2024–2026) continuó operando con normalidad y con el 100 % de sus seis (06) miembros titulares (03 representantes del empleador y 03 representantes de los trabajadores), sin registrarse cambios, renuncias ni inconvenientes en su conformación ni quórum reglamentario.';
    }

    // 3. REUNIONES
    const wsReuniones = workbook.getWorksheet('Reuniones');
    if (wsReuniones) {
      wsReuniones.getCell('H4').value = '20/07/2026';
      wsReuniones.getCell('I4').value = '17/08/2026';
      wsReuniones.getCell('J4').value = '21/09/2026';

      const notaCell = wsReuniones.getCell('A8');
      notaCell.value = 'Se cumplió al 100 % con las nueve (09) sesiones ordinarias mensuales acumuladas al cierre del Tercer Trimestre 2026: Trimestre I (16/01/2026, 23/02/2026 y 14/03/2026), Trimestre II (18/04/2026, 25/05/2026 y 29/06/2026) y Trimestre III (20/07/2026, 17/08/2026 y 21/09/2026) en el Campamento Pisco, contando en todas ellas con la asistencia del 100 % de los miembros titulares (quórum reglamentario conforme al Art. 69° del D.S. N° 005-2012-TR y Art. 22° del D.S. N° 011-2019-TR).';
    }

    // 4. INSPECCIONES
    const wsInspecciones = workbook.getWorksheet('Inspecciones');
    if (wsInspecciones) {
      const r8 = wsInspecciones.getRow(8);
      r8.getCell(1).value = 'Tercera Inspección Planeada SCSST (Campamento y Frentes de Obra)';
      r8.getCell(2).value = '22/09/2026';
      r8.getCell(3).value = 'Subcomité de SST / Área SSOMA';
      r8.getCell(4).value = '08';
      r8.getCell(5).value = '08';
      r8.getCell(6).value = '100 %';
      r8.getCell(7).value = '100 %';

      const notaCell = wsInspecciones.getCell('A14');
      if (notaCell) {
        notaCell.value = 'Al cierre del Tercer Trimestre 2026 se ejecutó la 3.ª inspección planeada de seguridad del SCSST en el Campamento Pisco y frentes de trabajo de la Red Vial N° 6, identificándose 8 desviaciones operacionales, las cuales fueron levantadas y cerradas al 100 % dentro de los plazos establecidos.';
      }
    }

    // 5. SIMULACROS
    const wsSimulacros = workbook.getWorksheet('Simulacros');
    if (wsSimulacros) {
      const r8 = wsSimulacros.getRow(8);
      r8.getCell(1).value = 'Simulacro Nacional Multipeligro - Sismo y Tsunami';
      r8.getCell(2).value = '15/08/2026';
      r8.getCell(3).value = 'Campamento Pisco y Frentes de Obra';
      r8.getCell(4).value = 'Personal de Obra, Subcontratistas y SCSST';
      r8.getCell(5).value = 'Óptima (Evacuación en 2 min 45 seg)';
      r8.getCell(6).value = '100 %';

      const notaCell = wsSimulacros.getCell('A12');
      if (notaCell) {
        notaCell.value = 'Durante el Tercer Trimestre 2026 se llevó a cabo exitosamente el Simulacro Nacional Multipeligro del 15/08/2026, con participación activa del personal de obra, brigadistas y miembros del SCSST, evaluado con nivel de eficacia satisfactorio.';
      }
    }

    // 6. CAPACITACIONES
    const wsCapacitaciones = workbook.getWorksheet('Capacitaciones');
    if (wsCapacitaciones) {
      const notaCell = wsCapacitaciones.getCell('A12');
      if (notaCell) {
        notaCell.value = 'Durante el Tercer Trimestre 2026 se continuó con el desarrollo de las inducciones, charlas de 5 minutos y capacitaciones específicas de SST, acumulando las Horas Hombre de Capacitación (HHC) requeridas y manteniendo el 100 % de cumplimiento del plan anual de formación.';
      }
    }

    // 7. TOPS (Actos y Condiciones Inseguras)
    const wsTOPS = workbook.getWorksheet('TOPS');
    if (wsTOPS) {
      const rNota = wsTOPS.getCell('A46');
      if (rNota) {
        rNota.value = 'Durante el Tercer Trimestre 2026 (julio, agosto y septiembre) se registraron un total de 48 Tarjetas de Observación Preventiva (TOP) F-SIG-060: 20 en julio, 12 en agosto y 16 en septiembre, superando en todos los meses la meta mínima establecida de 10 tarjetas mensuales (100 % de cumplimiento). Del total trimestral, 8 corresponden a Actos Inseguros y 40 a Condiciones Inseguras, todas con medidas de control inmediatas implementadas y cerradas.';
      }
    }

    // 8. PROGRAMA DE SSMA
    const wsPrograma = workbook.getWorksheet('Programa de SSMA');
    if (wsPrograma) {
      const notaCell = wsPrograma.getCell('A22');
      if (notaCell) {
        notaCell.value = 'Se alcanzó el 100 % de cumplimiento en todas las actividades del Programa de SSTMA programadas para el Tercer Trimestre 2026, destacando las 3 reuniones ordinarias del SCSST (20/07, 17/08 y 21/09), el simulacro de agosto y la 3.ª inspección planeada de septiembre 2026.';
      }
    }

    // 9. INVESTIGACIÓN DE ACCIDENTES
    const wsInvestig = workbook.getWorksheet('Investig. Accid.');
    if (wsInvestig) {
      const r8 = wsInvestig.getRow(8);
      r8.getCell(1).value = 'Ninguno (0 accidentes registrados en Trimestre III)';
      r8.getCell(2).value = '-';
      r8.getCell(3).value = 'No aplica';
      r8.getCell(4).value = 'N/A';
      r8.getCell(5).value = 'Ninguno (0 incidentes peligrosos en Trimestre III)';
      r8.getCell(6).value = '-';
      r8.getCell(7).value = 'No aplica';
      r8.getCell(8).value = 'N/A';

      const notaCell = wsInvestig.getCell('A25');
      if (notaCell) {
        notaCell.value = 'Durante el Tercer Trimestre 2026 (julio, agosto y septiembre) no se registraron accidentes de trabajo incapacitantes, accidentes leves, accidentes mortales, incidentes peligrosos ni enfermedades ocupacionales en la obra Red Vial N° 6, manteniéndose el programa "Cero Accidentes" e índices de accidentabilidad en 0.00.';
      }
    }

    // 10. ESTADÍSTICA
    const wsEstadistica = workbook.getWorksheet('Estadística');
    if (wsEstadistica) {
      // IF, IS, IA en 0 para JUL (col 8 / H), AGO (col 9 / I), SEP (col 10 / J)
      wsEstadistica.getCell('H5').value = 0;
      wsEstadistica.getCell('I5').value = 0;
      wsEstadistica.getCell('J5').value = 0;

      wsEstadistica.getCell('H6').value = 0;
      wsEstadistica.getCell('I6').value = 0;
      wsEstadistica.getCell('J6').value = 0;

      wsEstadistica.getCell('H7').value = 0;
      wsEstadistica.getCell('I7').value = 0;
      wsEstadistica.getCell('J7').value = 0;

      const notaCell = wsEstadistica.getCell('A45');
      if (notaCell) {
        notaCell.value = 'Al cierre del Tercer Trimestre 2026 (julio – septiembre 2026), los índices de accidentabilidad acumulados se mantienen en IF = 0.00, IS = 0.00 e IA = 0.00, reflejando el estricto cumplimiento preventivo en obra.';
      }
    }

    // Guardar en la carpeta public para descarga directa
    const publicDownloadsDir = path.join(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(publicDownloadsDir)) {
      fs.mkdirSync(publicDownloadsDir, { recursive: true });
    }
    const outputPath = path.join(publicDownloadsDir, 'Informe_Subcomite_SST_Trimestre_III_Jul_Set_2026.xlsx');
    await workbook.xlsx.writeFile(outputPath);

    // También guardar en el root de public
    const publicRootPath = path.join(process.cwd(), 'public', 'Informe_Subcomite_SST_Trimestre_III_Jul_Set_2026.xlsx');
    await workbook.xlsx.writeFile(publicRootPath);

    const buffer = await workbook.xlsx.writeBuffer();

    const url = new URL(req.url);
    if (url.searchParams.get('download') === '1') {
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Disposition': 'attachment; filename="Informe_Subcomite_SST_Trimestre_III_Jul_Set_2026.xlsx"',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Informe Trimestre III (Julio - Septiembre 2026) generado exitosamente',
      downloadUrl: '/Informe_Subcomite_SST_Trimestre_III_Jul_Set_2026.xlsx',
      localPath: outputPath
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
