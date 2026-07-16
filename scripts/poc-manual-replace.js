const fs = require('fs');
const PizZip = require('pizzip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

function getTargetFromRel(rId, relsElements) {
    for (let i = 0; i < relsElements.length; i++) {
        if (relsElements[i].getAttribute('Id') === rId) {
            return relsElements[i].getAttribute('Target');
        }
    }
    return null;
}

function replaceImagesInZip() {
    const originalDoc = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
    const ignored = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24];

    const buf = fs.readFileSync(originalDoc);
    const zip = new PizZip(buf);
    
    const xmlString = zip.file('word/document.xml').asText();
    const relsString = zip.file('word/_rels/document.xml.rels').asText();
    
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
    const relsDoc = new DOMParser().parseFromString(relsString, 'text/xml');
    const relsElements = relsDoc.getElementsByTagName('Relationship');
    
    const elements = doc.getElementsByTagName('*');
    let shapeCounter = 0;
    let tagCounter = 0;
    
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.tagName === 'w:drawing' || el.tagName === 'v:shape' || el.tagName === 'pic:pic') {
            shapeCounter++;
            if (ignored.includes(shapeCounter)) continue;
            
            tagCounter++;
            const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
            
            // let's say we only want to replace foto_001 for test
            if (tagCounter === 1) {
                let rId = null;
                const blip = el.getElementsByTagName('a:blip')[0];
                if (blip) rId = blip.getAttribute('r:embed');
                
                if (!rId) {
                    const imageData = el.getElementsByTagName('v:imagedata')[0];
                    if (imageData) rId = imageData.getAttribute('r:id');
                }
                
                if (rId) {
                    const target = getTargetFromRel(rId, relsElements);
                    console.log(`foto_001 corresponds to rId: ${rId}, Target: ${target}`);
                    
                    // Replace the buffer in the zip!
                    const newImageBuf = fs.readFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform\\public\\placeholder.png');
                    
                    // update zip
                    zip.file(`word/${target}`, newImageBuf);
                    console.log(`Replaced word/${target} with placeholder.png`);
                }
            }
        }
    }
    
    const outBuf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync('TEST_MANUAL_REPLACE.docx', outBuf);
    console.log("Saved TEST_MANUAL_REPLACE.docx");
}

replaceImagesInZip();
