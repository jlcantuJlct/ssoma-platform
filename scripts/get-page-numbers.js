const fs = require('fs');
const PizZip = require('pizzip');
const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

const targetPhotos = [72, 109, 158, 159, 162, 165, 189, 190];
let pageCount = 1; // Word documents start at page 1

// We split the document into parts to count page breaks
const parts = xml.split(/<w:lastRenderedPageBreak\/>|<w:br w:type="page"\/>/);
console.log(`Total page breaks found: ${parts.length - 1}`);

// Now let's iterate and find which part contains the photo
targetPhotos.forEach(i => {
    let fotoCounter = 0;
    let foundPage = -1;
    
    // We need to count photos as we go through the parts
    for (let p = 0; p < parts.length; p++) {
        // Count photos in this part
        const matches = parts[p].match(/<w:drawing|<v:shape|pic:pic/g);
        if (matches) {
            if (fotoCounter < i && fotoCounter + matches.length >= i) {
                foundPage = p + 1; // +1 because part 0 is page 1
                break;
            }
            fotoCounter += matches.length;
        }
    }
    
    console.log(`Foto ${String(i).padStart(3, '0')} -> Página aproximada: ${foundPage > -1 ? foundPage : 'No determinada'}`);
});
