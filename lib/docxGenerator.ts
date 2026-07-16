import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const IGNORED_MAP: Record<string, number[]> = {
    'PAD_SAN_CLEMENTE_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72],
    'PAD_SAN_CLEMENTE_INTERNAL.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72],
    'PAD_CHINCHAYSULLO_PLANTILLA.docx': [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232],
    'PAD_CHINCHAYSULLO_INTERNAL.docx': [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232],
    'PAD_BARANDAS_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19],
    'PAD_BARANDAS_INTERNAL.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19],
    'PAD_JAHUAY_PLANTILLA.docx': [1, 2],
    'PAD_JAHUAY_INTERNAL.docx': [1, 2]
};

function getTargetFromRel(rId: string, relsElements: any) {
    for (let i = 0; i < relsElements.length; i++) {
        if (relsElements[i].getAttribute('Id') === rId) {
            return relsElements[i].getAttribute('Target');
        }
    }
    return null;
}

function getMimeTypeAndExt(buf: ArrayBuffer): { ext: string, mime: string } {
    const bytes = new Uint8Array(buf);
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return { ext: 'png', mime: 'image/png' };
    }
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
        return { ext: 'jpeg', mime: 'image/jpeg' };
    }
    return { ext: 'png', mime: 'image/png' }; // default
}

export async function generateDocumentClientSide(
    templateBuffer: ArrayBuffer,
    templateName: string,
    textData: Record<string, string>,
    imageBuffers: Record<string, ArrayBuffer>
): Promise<Blob> {
    
    const zip = new PizZip(templateBuffer);

    if (textData['mes_anio']) {
        let docXmlStr = zip.file('word/document.xml')?.asText() || '';
        docXmlStr = docXmlStr.replace(/MAYO[\s\u00A0]*2026/gi, '{mes_anio}');
        docXmlStr = docXmlStr.replace(/mes[\s\u00A0]*año/gi, '{mes_anio}');
        zip.file('word/document.xml', docXmlStr);
    }

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });
    
    doc.render(textData);
    
    const renderedZip = doc.getZip();

    let xmlString = renderedZip.file('word/document.xml')?.asText() || '';
    const relsString = renderedZip.file('word/_rels/document.xml.rels')?.asText() || '';
    let contentTypesString = renderedZip.file('[Content_Types].xml')?.asText() || '';

    const relsDoc = new DOMParser().parseFromString(relsString, 'text/xml');
    const relsElements = relsDoc.getElementsByTagName('Relationship');

    const ignored = IGNORED_MAP[templateName] || [];
    let shapeCounter = 0;
    let tagCounter = 0;

    xmlString = xmlString.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
        if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
            shapeCounter++;
            if (ignored.includes(shapeCounter)) return parrafo;

            let updatedParrafo = parrafo;
            const regex = /(r:embed|r:id)="([^"]+)"/g;

            updatedParrafo = updatedParrafo.replace(regex, (match, attrName, rId) => {
                const target = getTargetFromRel(rId, relsElements);
                
                if (target && (target.includes('media/') || target.includes('image'))) {
                    tagCounter++;
                    const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
                    
                    if (imageBuffers[tagName]) {
                        const newBuf = imageBuffers[tagName];
                        const { ext, mime } = getMimeTypeAndExt(newBuf);
                        const newTarget = `media/${tagName}.${ext}`;
                        const newRId = `rId_${tagName}_${Date.now()}`;
                        
                        renderedZip.file(`word/${newTarget}`, newBuf);
                        
                        if (!contentTypesString.includes(`Extension="${ext}"`)) {
                            contentTypesString = contentTypesString.replace('</Types>', `<Default Extension="${ext}" ContentType="${mime}"/></Types>`);
                        }
                        
                        const relNode = relsDoc.createElement('Relationship');
                        relNode.setAttribute('Id', newRId);
                        relNode.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
                        relNode.setAttribute('Target', newTarget);
                        
                        const relationshipsNode = relsDoc.getElementsByTagName('Relationships')[0];
                        if (relationshipsNode) {
                            relationshipsNode.appendChild(relNode);
                        }
                        
                        return `${attrName}="${newRId}"`;
                    }
                }
                
                return match;
            });
            
            return updatedParrafo;
        }
        return parrafo;
    });

    renderedZip.file('word/document.xml', xmlString);
    renderedZip.file('word/_rels/document.xml.rels', new XMLSerializer().serializeToString(relsDoc));
    renderedZip.file('[Content_Types].xml', contentTypesString);

    const outputBlob = renderedZip.generate({
        type: 'blob',
        compression: 'DEFLATE',
    }) as Blob;

    return outputBlob;
}
