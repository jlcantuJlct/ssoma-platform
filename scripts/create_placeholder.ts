import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import fs from 'fs';
import path from 'path';

async function createPlaceholder() {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: 'INFORME MENSUAL SSOMA',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [
                        new TextRun('Mes: {MES_REPORTE}\n'),
                        new TextRun('Año: {ANIO_REPORTE}\n'),
                    ],
                }),
                new Paragraph({
                    text: 'ANEXO FOTOGRAFICO',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: '{#photos}'
                }),
                new Paragraph({
                    text: '{%url}'
                }),
                new Paragraph({
                    text: '{/photos}'
                })
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(process.cwd(), 'public', 'templates', 'Plantilla_Base.docx'), buffer);
    console.log("Plantilla placeholder creada con éxito.");
}

createPlaceholder();
