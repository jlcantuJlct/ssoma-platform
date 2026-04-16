import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    ImageRun,
    HeadingLevel,
    PageBreak,
    VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';

// Updated interface to match reportDataFetch output
export interface ReportData {
    monthName: string;
    year: number;
    location: string;
    stats: {
        inspections: number;
        ats: number;
        petar: number;
        hhc: number;
        hht: number;
        accidents: Record<string, number>;
        waste: Record<string, number>;
    };
    pmaCompliance: any[];
    evidence: any[];
    annexes: any[];
    desvios: any[];
}

// Helper to download images from URL to ArrayBuffer for docx injection
async function fetchImageBuffer(src: string): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(src);
        if (!res.ok) return null;
        const blob = await res.blob();
        return await blob.arrayBuffer();
    } catch (error) {
        console.error("Error fetching image for Word:", error);
        return null;
    }
}

// Helpers for Word Elements
function createParagraph(text: string, bold: boolean = false, size: number = 22, align: AlignmentType = AlignmentType.LEFT) {
    return new Paragraph({
        alignment: align,
        spacing: { after: 120 },
        children: [new TextRun({ text, bold, size, font: "Arial" })]
    });
}

function createHeading(text: string, level: HeadingLevel) {
    return new Paragraph({
        text,
        heading: level,
        spacing: { before: 240, after: 120 }
    });
}

function createTableCell(content: string, bold = false, fill = "FFFFFF", color = "000000") {
    return new TableCell({
        children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: content, bold, size: 18, color, font: "Arial" })]
        })],
        shading: { fill },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100 }
    });
}

function createTable(headers: string[], rows: (string | number)[][], widths?: number[]) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: headers.map((h, i) => createTableCell(h, true, "1E40AF", "FFFFFF"))
            }),
            ...rows.map(row =>
                new TableRow({
                    children: row.map(cell => createTableCell(String(cell)))
                })
            )
        ]
    });
}

// Generate the Document
export async function generateWordReport(data: ReportData, isServerSide = false) {
    const { monthName, year, location, stats, pmaCompliance, evidence, annexes, desvios } = data;

    // Calculate Statistics
    const accidentsTotal = (stats.accidents.ATT || 0) + (stats.accidents.APP || 0) + (stats.accidents.ATP || 0) + (stats.accidents.AM || 0);
    const IF = stats.hht > 0 ? (accidentsTotal * 1000000) / stats.hht : 0;
    const IS = stats.hht > 0 ? ((stats.accidents.TDP || 0) * 1000000) / stats.hht : 0;
    const IA = (IF * IS) / 1000;

    const docChildren: any[] = [];

    // --- PORTADA ---
    docChildren.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000, after: 1000 },
            children: [new TextRun({ text: "CONCESIÓN DEL TRAMO VIAL PUENTE PUCUSANA – CERRO AZUL – ICA", bold: true, size: 28, font: "Arial" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 1000 },
            children: [new TextRun({ text: "RED VIAL 6", bold: true, size: 24, font: "Arial", color: "1E40AF" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000, after: 400 },
            children: [new TextRun({ text: `INFORME DE GESTIÓN MENSUAL SSOMA`, bold: true, size: 36, font: "Arial" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 1000 },
            children: [new TextRun({ text: `${location.toUpperCase()}`, bold: true, size: 32, font: "Arial", color: "1E40AF" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: `${monthName.toUpperCase()} ${year}`, bold: true, size: 28, font: "Arial" })]
        }),
        new Paragraph({ children: [new PageBreak()] })
    );

    // --- 1. RESUMEN EJECUTIVO & 3. ESTADÍSTICAS ---
    docChildren.push(
        createHeading("1. RESUMEN EJECUTIVO", HeadingLevel.HEADING_1),
        createParagraph(`Durante el mes de ${monthName} del ${year}, se ha dado cumplimiento a las actividades de prevención y control ambiental en el área de ${location}.`),
        
        createHeading("3. ESTADÍSTICAS DE SEGURIDAD Y SALUD", HeadingLevel.HEADING_1),
        createParagraph("A continuación se detallan los indicadores de accidentabilidad del período:"),
        createTable(["INDICADOR", "VALOR MENSUAL", "UNIDAD"], [
            ["Horas Hombre Trabajadas (HHT)", stats.hht, "Horas"],
            ["Índice de Frecuencia (IF)", IF.toFixed(2), "N° Acc. / HH"],
            ["Índice de Severidad (IS)", IS.toFixed(2), "Días / HH"],
            ["Índice de Accidentabilidad (IA)", IA.toFixed(2), "IF * IS / 1000"],
            ["Accidentes con Lesión", accidentsTotal, "N° Casos"],
            ["Días Perdidos", stats.accidents.TDP || 0, "Días"]
        ]),

        createHeading("4. GESTIÓN DE LA PREVENCIÓN", HeadingLevel.HEADING_1),
        createParagraph("Registro de actividades preventivas realizadas en campo:"),
        createTable(["DOCUMENTO", "CANTIDAD", "SITIO"], [
            ["Inspecciones de Seguridad", stats.inspections, "Consolidado"],
            ["Registros ATS / APR", stats.ats, "Consolidado"],
            ["Permisos de Trabajo (PETAR)", stats.petar, "Consolidado"],
            ["Control de Personal (HHC)", stats.hhc, "Consolidado"]
        ]),
        new Paragraph({ children: [new PageBreak()] })
    );

    // --- 8. EJECUCIÓN DEL PLAN DE MANEJO AMBIENTAL ---
    docChildren.push(
        createHeading("8. EJECUCIÓN DEL PLAN DE MANEJO AMBIENTAL", HeadingLevel.HEADING_1),
        createHeading("8.1. MANEJO DE RESIDUOS SÓLIDOS", HeadingLevel.HEADING_2),
        createParagraph("Cuantificación de residuos generados durante el período:"),
        createTable(["CATEGORÍA", "CANTIDAD (KG)", "ESTADO"], [
            ["Residuos Peligrosos", stats.waste.PEL || 0, "Recolección/EPS"],
            ["Residuos No Peligrosos", stats.waste.NO_PEL || 0, "Relleno Sanitario"],
            ["Residuos Aprovechables", stats.waste.APROV || 0, "Segregación"],
            ["TOTAL GENERADO", (stats.waste.PEL || 0) + (stats.waste.NO_PEL || 0) + (stats.waste.APROV || 0), "-"]
        ]),

        createHeading("8.6. CUMPLIMIENTO PMA", HeadingLevel.HEADING_2),
        createTable(["ACTIVIDAD PMA", "RESPONSABLE", "EVIDENCIA"], 
            pmaCompliance.map(p => [p.activity_name, p.responsible || 'Antigravity', p.status || 'OK'])
        )
    );

    // --- ANEXOS & PANEL FOTOGRÁFICO ---
    const photoEvidence = evidence.slice(0, 16);
    if (photoEvidence.length > 0) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        createHeading("ANEXO: PANEL FOTOGRÁFICO", HeadingLevel.HEADING_1);
        
        for (let i = 0; i < photoEvidence.length; i++) {
            const e = photoEvidence[i];
            const buffer = await fetchImageBuffer(e.file_url);
            if (buffer) {
                docChildren.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 },
                        children: [
                            new ImageRun({ data: buffer, transformation: { width: 400, height: 250 } }),
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: `Imagen ${i+1}: ${e.description}`, bold: true, size: 16, font: "Arial" }),
                            new TextRun({ text: `\nLugar: ${e.location} | Fecha: ${e.date}`, break: 1, size: 14, font: "Arial" })
                        ]
                    })
                );
            }
        }
    }

    // --- LISTADO DE ANEXOS DOCUMENTARIOS ---
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    createHeading("LISTADO DE ANEXOS (ARCHIVOS ADJUNTOS)", HeadingLevel.HEADING_1);
    createParagraph("Los siguientes documentos han sido cargados y validados en la plataforma como parte de la sustentación mensual:");
    
    if (annexes.length > 0) {
        createTable(["N° ANEXO", "DESCRIPCIÓN", "TIPO"], 
            annexes.map(a => [a.annex_id, a.label, a.is_permanent ? 'Permanente' : 'Mensual'])
        ).rows.forEach(row => docChildren.push(row));
    } else {
        docChildren.push(createParagraph("No se registran anexos documentarios para este período."));
    }

    const doc = new Document({
        title: `Informe Mensual ${monthName} - ${location}`,
        sections: [{ children: docChildren }]
    });

    if (isServerSide) {
        return await Packer.toBuffer(doc);
    } else {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Informe_Mensual_Consolidado_${location.replace(/\s+/g, '_')}_${monthName}_${year}.docx`);
    }
}
