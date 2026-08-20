const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = require("docx");

const doc = new Document({
    creator: "SSOMA Platform",
    title: "Acta SCSST",
    styles: {
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                basedOn: "Normal",
                next: "Normal",
                run: { font: "Arial", size: 22 }, // 11pt
                paragraph: { spacing: { after: 120 } },
            },
        ],
    },
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "ACTA DE REUNIÓN DEL SUBCOMITÉ DE SEGURIDAD Y SALUD EN EL TRABAJO",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Fecha: ", bold: true }),
                    new TextRun("{fecha}\t\t"),
                    new TextRun({ text: "Hora de Inicio: ", bold: true }),
                    new TextRun("{hora_inicio}\t\t"),
                    new TextRun({ text: "Hora de Fin: ", bold: true }),
                    new TextRun("{hora_fin}"),
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Lugar: ", bold: true }),
                    new TextRun("{lugar}"),
                ]
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "1. LISTA DE ASISTENTES", bold: true, heading: HeadingLevel.HEADING_2 }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "Nombre", bold: true })] }),
                            new TableCell({ children: [new Paragraph({ text: "Cargo", bold: true })] }),
                            new TableCell({ children: [new Paragraph({ text: "Tipo", bold: true })] }),
                            new TableCell({ children: [new Paragraph({ text: "Firma", bold: true })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("{#asistentes}{nombre}")] }),
                            new TableCell({ children: [new Paragraph("{cargo}")] }),
                            new TableCell({ children: [new Paragraph("{tipo}")] }),
                            new TableCell({ children: [new Paragraph("{%firma}{/asistentes}")] }),
                        ],
                    }),
                ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "2. AGENDA DE LA REUNIÓN", bold: true, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "{#agenda}{numero}. {tema}{/agenda}" }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "3. DESARROLLO Y ACUERDOS TOMADOS", bold: true, heading: HeadingLevel.HEADING_2 }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "N°", bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ text: "Acuerdo / Desarrollo", bold: true })], width: { size: 50, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ text: "Responsable", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ text: "Fecha", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("{#acuerdos}{numero}")] }),
                            new TableCell({ children: [new Paragraph("{acuerdo}")] }),
                            new TableCell({ children: [new Paragraph("{responsable}")] }),
                            new TableCell({ children: [new Paragraph("{fecha_cumplimiento}{/acuerdos}")] }),
                        ],
                    }),
                ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "4. GRÁFICOS Y ANEXOS DEL MES", bold: true, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "A continuación se presentan los gráficos de gestión generados por la plataforma correspondientes al mes evaluado.", alignment: AlignmentType.JUSTIFIED }),
            new Paragraph({ text: "{%grafico_mensual}", alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "{%chart_image}", alignment: AlignmentType.CENTER })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("public/templates/scsst_acta_template.docx", buffer);
    console.log("Template generated successfully!");
});
