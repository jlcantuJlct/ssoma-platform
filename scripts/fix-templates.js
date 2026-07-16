const fs = require('fs');
const PizZip = require('pizzip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const docs = [
    {
        name: 'PAD_SAN_CLEMENTE_PLANTILLA.docx',
        original: 'PAD_SAN CLEMENTE ultimo.docx',
        ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24]
    },
    {
        name: 'PAD_CHINCHAYSULLO_PLANTILLA.docx',
        original: 'PAD-CHINCHAYSULLO ultimo.docx',
        ignored: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232]
    },
    {
        name: 'PAD_JAHUAY_PLANTILLA.docx',
        original: 'Peaje Jahuay Ultimo.docx',
        ignored: [1, 2]
    },
    {
        name: 'PAD_BARANDAS_PLANTILLA.docx',
        original: 'MP Barandas Mayo .docx',
        ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19]
    }
];

const BASE_DIR = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual';

docs.forEach(docInfo => {
    try {
        console.log(`Procesando ${docInfo.original}...`);
        const buf = fs.readFileSync(`${BASE_DIR}\\${docInfo.original}`);
        const zip = new PizZip(buf);
        const xmlString = zip.file('word/document.xml').asText();

        const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
        
        // Count shapes: w:drawing, v:shape, pic:pic
        const elements = doc.getElementsByTagName('*');
        let shapeCounter = 0;
        let tagCounter = 0;
        
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.tagName === 'w:drawing' || el.tagName === 'v:shape' || el.tagName === 'pic:pic') {
                shapeCounter++;
                
                if (docInfo.ignored.includes(shapeCounter)) {
                    continue;
                }
                
                tagCounter++;
                const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
                
                // We want to replace this node with <w:r><w:t>{%tagName}</w:t></w:r>
                const rNode = doc.createElement('w:r');
                const tNode = doc.createElement('w:t');
                tNode.textContent = `{%${tagName}}`;
                rNode.appendChild(tNode);
                
                if (el.parentNode) {
                    el.parentNode.replaceChild(rNode, el);
                }
            }
        }
        
        let newXml = new XMLSerializer().serializeToString(doc);
        
        // Also replace mes año
        newXml = newXml.replace(/mes[ \u00A0]año/gi, '{mes_anio}');
        
        zip.file('word/document.xml', newXml);
        const outBuf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(`${BASE_DIR}\\${docInfo.name}`, outBuf);
        
        console.log(`✅ ${docInfo.name} guardado con ${tagCounter} fotos reemplazadas.`);
    } catch (e) {
        console.error(`Error procesando ${docInfo.original}:`, e);
    }
});
