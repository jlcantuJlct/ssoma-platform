const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, Header, Footer } = require("docx");

const doc = new Document({
    creator: "SSOMA Platform",
    title: "Acta SCSST CASA",
    styles: {
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                run: { font: "Arial", size: 16 }, // 8pt for tables
                paragraph: { spacing: { after: 0 } },
            },
        ],
    },
    sections: [{
        properties: {},
        children: [
            // HEADER TABLE
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "CASA", alignment: AlignmentType.CENTER, style: "Normal" })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ text: "ACTA DE REUNIÓN", alignment: AlignmentType.CENTER, style: "Normal" })], width: { size: 50, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [
                                new Paragraph({ text: "Código: F-SIG-010", style: "Normal" }),
                                new Paragraph({ text: "Versión: 02", style: "Normal" })
                            ], width: { size: 30, type: WidthType.PERCENTAGE } }),
                        ],
                    }),
                ],
            }),
            new Paragraph({ text: "" }),
            // METADATA TABLE
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Proyecto / Instalación:", bold: true })], width:{size:20,type:WidthType.PERCENTAGE} }), new TableCell({ children: [new Paragraph("Red Vial N°6")], columnSpan: 3 })] }),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Asunto:", bold: true })] }), new TableCell({ children: [new Paragraph("Reunión ordinaria del Sub Comité de Seguridad y Salud en el Trabajo")], columnSpan: 3 })] }),
                    new TableRow({ children: [
                        new TableCell({ children: [new Paragraph({ text: "Fecha:", bold: true })] }), 
                        new TableCell({ children: [new Paragraph("{fecha}")] }),
                        new TableCell({ children: [new Paragraph({ text: "Hora Inicio:", bold: true })] }),
                        new TableCell({ children: [new Paragraph("{hora_inicio}         Hora Fin: {hora_fin}")] })
                    ] }),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Lugar:", bold: true })] }), new TableCell({ children: [new Paragraph("{lugar}")], columnSpan: 3 })] }),
                ],
            }),
            new Paragraph({ text: "" }),
            // ASISTENCIA TABLE
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Asistencia", alignment: AlignmentType.CENTER, bold: true })], columnSpan: 2 })] }),
                    new TableRow({ children: [
                        new TableCell({ children: [new Paragraph({ text: "Nombres, Apellidos y Cargo", alignment: AlignmentType.CENTER, bold: true })], width: { size: 70, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: "Firma", alignment: AlignmentType.CENTER, bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    ] }),
                    new TableRow({ children: [
                        new TableCell({ children: [new Paragraph("{#asistentes}{nombre} - {cargo}")] }),
                        new TableCell({ children: [new Paragraph("{%firma}{/asistentes}")] }),
                    ] }),
                ],
            }),
            new Paragraph({ text: "Habiéndose verificado el quórum establecido en el artículo 69° del Decreto Supremo N°005-2012-TR, se inicia la reunión.", style: "Normal" }),
            new Paragraph({ text: "" }),
            // AGENDA TABLE
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Agenda", alignment: AlignmentType.CENTER, bold: true })] })] }),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("{#agenda}{numero}. {tema}{/agenda}")] })] }),
                ]
            }),
            new Paragraph({ text: "" }),
            // DESARROLLO DE LA AGENDA
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Desarrollo de la Agenda", alignment: AlignmentType.CENTER, bold: true })] })] }),
                    new TableRow({ children: [new TableCell({ children: [
                        new Paragraph("{#acuerdos}"),
                        new Paragraph({ text: "{numero}. {acuerdo}", style: "Normal" }),
                        new Paragraph("{/acuerdos}"),
                        new Paragraph({ text: "", style: "Normal" }),
                        new Paragraph({ text: "{%grafico_mensual}", alignment: AlignmentType.CENTER })
                    ] })] }),
                ]
            }),
            new Paragraph({ text: "" }),
            // ACUERDOS Y PEDIDOS
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Acuerdos y pedidos", alignment: AlignmentType.CENTER, bold: true })], columnSpan: 4 })] }),
                    new TableRow({ children: [
                        new TableCell({ children: [new Paragraph({ text: "N°", bold: true })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: "Actividad a ejecutar", bold: true })], width: { size: 55, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: "Responsable", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: "Fecha Límite", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    ] }),
                    new TableRow({ children: [
                        new TableCell({ children: [new Paragraph("{#acuerdos}{numero}")] }),
                        new TableCell({ children: [new Paragraph("Ver desarrollo en sección anterior")] }),
                        new TableCell({ children: [new Paragraph("{responsable}")] }),
                        new TableCell({ children: [new Paragraph("{fecha_cumplimiento}{/acuerdos}")] }),
                    ] }),
                ]
            })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("public/templates/scsst_acta_template.docx", buffer);
    console.log("CASA Template generated successfully!");
});
