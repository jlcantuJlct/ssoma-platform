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
    PageBreak
} from 'docx';
import { saveAs } from 'file-saver';

// Define the interface for the data we expect
export interface ReportData {
    month: string;
    year: number;
    reportImages: any[];
    currentInspections: any[];
    currentATS: any[];
    currentPETAR: any[];
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

function createTable(headers: string[], rows: string[][]) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            // Header Row
            new TableRow({
                children: headers.map(h => new TableCell({
                    children: [createParagraph(h, true, 20, AlignmentType.CENTER)],
                    shading: { fill: "D9D9D9" }
                }))
            }),
            // Data Rows
            ...rows.map(row =>
                new TableRow({
                    children: row.map(cell => new TableCell({
                        children: [createParagraph(cell, false, 20, AlignmentType.CENTER)]
                    }))
                })
            )
        ]
    });
}

// Generate the Document
export async function generateWordReport(data: ReportData) {
    const { month, year, reportImages, currentInspections, currentATS, currentPETAR } = data;

    // Pre-fetch images to buffers
    const docxImages: any[] = [];
    for (const img of reportImages) {
        const buffer = await fetchImageBuffer(img.preview);
        if (buffer) {
            docxImages.push({
                buffer,
                description: img.description,
                category: img.category
            });
        }
    }

    const docChildren: any[] = [];

    // --- PORTADA ---
    docChildren.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 4000, after: 1000 },
            children: [new TextRun({ text: "INFORME MENSUAL DEL PLAN DE MANEJO AMBIENTAL Y SSOMA", bold: true, size: 36, font: "Arial" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: `${month.toUpperCase()} - ${year}`, bold: true, size: 28, font: "Arial" })]
        }),
        new Paragraph({ children: [new PageBreak()] })
    );

    // --- INTRODUCCIÓN GENERAL ---
    docChildren.push(
        createHeading("1. INTRODUCCIÓN Y ANTECEDENTES", HeadingLevel.HEADING_1),
        createParagraph(`El presente documento constituye el informe de cumplimiento correspondiente al mes de ${month} del ${year}.`),
        createParagraph("Estructura base del informe para ser completada con la información en sitio e información recopilada directamente desde la plataforma Antigravity SSOMA."),

        createHeading("2. REGISTROS OPERATIVOS DE SSOMA EN PLATAFORMA", HeadingLevel.HEADING_1),
        createParagraph("La plataforma tecnológica registró durante el mes la siguiente actividad documentaria para la obra:"),
        createTable(["TIPO DE DOCUMENTO", "CANTIDAD EMITIDA", "ESTADO"], [
            ["Inspecciones de Seguridad", currentInspections.length.toString(), "Completado"],
            ["Análisis de Trabajo Seguro (ATS)", currentATS.length.toString(), "Completado"],
            ["Permisos Escritos para Trabajos de Alto Riesgo (PETAR)", currentPETAR.length.toString(), "Completado"]
        ]),
        new Paragraph({ children: [new PageBreak()] })
    );

    // --- 8. EJECUCIÓN DEL PLAN DE MANEJO AMBIENTAL ---
    docChildren.push(
        createHeading("8. EJECUCIÓN DEL PLAN DE MANEJO AMBIENTAL", HeadingLevel.HEADING_1),
        createHeading("8.1. PROGRAMA DE PREVENCIÓN Y MITIGACIÓN", HeadingLevel.HEADING_2),
        createHeading("8.1.1. Manejo de Residuos y Efluentes", HeadingLevel.HEADING_3),
        createParagraph("A continuación, las métricas de generación. (Complete las cifras exactas obtenidas en campo para el cierre mensual)."),
        createTable(["TIPO DE RESIDUO", "CANTIDAD GENERADA (Kg/Mes)", "DESTINO FINAL / DISPOSICIÓN"], [
            ["Residuos No Peligrosos (Domésticos, Papel, Cartón)", " ", "Relleno Sanitario Autorizado"],
            ["Residuos Peligrosos (Industrial, Hidrocarburos)", " ", "EO-RS Autorizada"],
            ["Residuos Metálicos o Asfalto", " ", "Comercialización / Reuso"]
        ]),
        createParagraph(" ")
    );

    // Efluentes & Baños Photos (Category PMA, description has 'baño' or 'lavamano' or 'residuo' or 'contenedor')
    const residuoImages = docxImages.filter(i => i.category.includes('PMA') && (
        i.description.toLowerCase().includes('baño') ||
        i.description.toLowerCase().includes('lavamano') ||
        i.description.toLowerCase().includes('residuo') ||
        i.description.toLowerCase().includes('contenedor') ||
        i.description.toLowerCase().includes('basura')
    ));
    if (residuoImages.length > 0) {
        docChildren.push(createHeading("Fotografías: Disposición de Residuos y Efluentes", HeadingLevel.HEADING_4));
        residuoImages.forEach(img => {
            docChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({ data: img.buffer, transformation: { width: 350, height: 250 } }),
                    new TextRun({ text: `\n${img.description}`, break: 1, size: 18 })
                ]
            }));
        });
    }

    // --- 8.2 ASUNTOS SOCIALES ---
    docChildren.push(
        new Paragraph({ children: [new PageBreak()] }),
        createHeading("8.2. PROGRAMA DE ASUNTOS SOCIALES", HeadingLevel.HEADING_1),
        createParagraph("Información sobre relacionamiento comunitario, buzón de quejas y man de obra local."),
        createTable(["Personal en San Clemente", "Personal en Ica", "Personal en Lima"], [
            [" ", " ", " "]
        ]),
        createParagraph(" ")
    );

    const socialImages = docxImages.filter(i => i.category.includes('PMA') && (
        i.description.toLowerCase().includes('buzon') ||
        i.description.toLowerCase().includes('reclamo') ||
        i.description.toLowerCase().includes('social')
    ));
    if (socialImages.length > 0) {
        docChildren.push(createHeading("Fotografías: Relacionamiento Comunitario (Buzones y Actas)", HeadingLevel.HEADING_4));
        socialImages.forEach(img => {
            docChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({ data: img.buffer, transformation: { width: 350, height: 250 } }),
                    new TextRun({ text: `\n${img.description}`, break: 1, size: 18 })
                ]
            }));
        });
    }

    // --- 8.3 CAPACITACIÓN ---
    docChildren.push(
        new Paragraph({ children: [new PageBreak()] }),
        createHeading("8.3. PROGRAMA DE CAPACITACIÓN, EDUCACIÓN", HeadingLevel.HEADING_1),
        createParagraph("Evidencia de charlas participativas dictadas en sitio (Charlas Ambientales y ATS vinculados a la cultura preventiva).")
    );

    const charlaImages = docxImages.filter(i => i.category.includes('ATS') || (i.category.includes('PMA') && i.description.toLowerCase().includes('charla')));
    if (charlaImages.length > 0) {
        docChildren.push(createHeading("Fotografías de Capacitación (ATS y Difusiones)", HeadingLevel.HEADING_4));
        charlaImages.forEach(img => {
            docChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({ data: img.buffer, transformation: { width: 350, height: 250 } }),
                    new TextRun({ text: `\n${img.description} [Ref: ${i.category}]`, break: 1, size: 18 })
                ]
            }));
        });
    }

    // --- 8.4 CONTINGENCIAS ---
    docChildren.push(
        new Paragraph({ children: [new PageBreak()] }),
        createHeading("8.4. PREVENCIÓN DE PÉRDIDAS Y CONTINGENCIAS", HeadingLevel.HEADING_1),
        createParagraph("Registros físicos y evidencia in-situ del establecimiento de control de contingencias (Salud ocupacional, Tópicos, Equipos de emergencia)."),
        createTable(["Equipo / Instalación", "Inspecciones Acumuladas en Plataforma", "Estado de Mantenimiento"], [
            ["Tópico de Emergencias", " ", " "],
            ["Estación y Equipo Antiderrames", " ", " "],
            ["Extintores (Red y Obra)", " ", " "]
        ]),
        createParagraph(" ")
    );

    const continImages = docxImages.filter(i => i.category.includes('PMA') && (
        i.description.toLowerCase().includes('emergencia') ||
        i.description.toLowerCase().includes('topico') ||
        i.description.toLowerCase().includes('tópico') ||
        i.description.toLowerCase().includes('extintor') ||
        i.description.toLowerCase().includes('botiquin') ||
        i.description.toLowerCase().includes('epp')
    ));
    if (continImages.length > 0) {
        docChildren.push(createHeading("Fotografías: Elementos de Contingencia", HeadingLevel.HEADING_4));
        continImages.forEach(img => {
            docChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({ data: img.buffer, transformation: { width: 350, height: 250 } }),
                    new TextRun({ text: `\n${img.description}`, break: 1, size: 18 })
                ]
            }));
        });
    }

    // COMPILING THE FINAL DOCUMENT
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: docChildren
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Informe_Mensual_PMA_${month}_${year}.docx`);
}
