import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const IGNORED_MAP: Record<string, number[]> = {
    // Shapes ignorados: portada, logos, coordenadas, mapa Google Earth, organigrama y tablas fijas (shapes 1-29)
    // Con esta lista, foto_001 = shape 30 = "Fotografía 8.1.1.1-1: Baños químicos" (primera foto real de campo)
    'PAD_SAN_CLEMENTE_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72],
    'PAD_CHINCHAYSULLO_PLANTILLA.docx': [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232],
    'PAD_BARANDAS_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19],
    'PAD_JAHUAY_PLANTILLA.docx': [1, 2]
};

function getTargetFromRel(rId: string, relsElements: any) {
    for (let i = 0; i < relsElements.length; i++) {
        if (relsElements[i].getAttribute('Id') === rId) {
            return relsElements[i].getAttribute('Target');
        }
    }
    return null;
}

function getMimeTypeAndExt(buf: Buffer): { ext: string, mime: string } {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
        return { ext: 'png', mime: 'image/png' };
    }
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
        return { ext: 'jpeg', mime: 'image/jpeg' };
    }
    return { ext: 'png', mime: 'image/png' }; // default
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const templateFile = formData.get('template') as File | null;
        const textDataStr  = formData.get('textData')  as string | null;

        let templateBuffer: Buffer;
        const fileName = templateFile?.name || '';
        let originalName = '';
        let templateName = '';

        if (fileName.includes('INTERNAL')) {
            if (fileName.includes('CHINCHAYSULLO')) {
                templateName = 'PAD_CHINCHAYSULLO_PLANTILLA.docx';
                originalName = 'PAD-CHINCHAYSULLO ultimo.docx';
            } else if (fileName.includes('JAHUAY')) {
                templateName = 'PAD_JAHUAY_PLANTILLA.docx';
                originalName = 'Peaje Jahuay Ultimo.docx';
            } else if (fileName.includes('BARANDAS')) {
                templateName = 'PAD_BARANDAS_PLANTILLA.docx';
                originalName = 'MP Barandas Mayo .docx';
            } else {
                templateName = 'PAD_SAN_CLEMENTE_PLANTILLA.docx';
                originalName = 'PAD_SAN CLEMENTE ultimo.docx';
            }
            
            const localPath = path.join(
                'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual',
                originalName // USAMOS EL ORIGINAL!
            );
            templateBuffer = fs.readFileSync(localPath);
        } else {
            if (!templateFile) {
                return NextResponse.json({ error: 'No se recibió la plantilla.' }, { status: 400 });
            }
            templateBuffer = Buffer.from(await templateFile.arrayBuffer());
        }

        const textData: Record<string, string> = textDataStr ? JSON.parse(textDataStr) : {};
        const imageBuffers: Record<string, Buffer> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('img_') && value instanceof File) {
                const tagName = key.replace('img_', '');
                imageBuffers[tagName] = Buffer.from(await value.arrayBuffer());
            }
        }

        const zip = new PizZip(templateBuffer);

        // ── 1. Reemplazo de Textos con Docxtemplater ─────────────────────────
        // Antes de docxtemplater, normalizamos 'mes año' o 'MAYO 2026' a '{mes_anio}' manualmente si es necesario, 
        // pero docxtemplater ya lo hace si el usuario escribió la etiqueta.
        // Haremos un reemplazo rápido en texto para MAYO 2026 a mes_anio si no existe.
        if (textData['mes_anio']) {
            let docXmlStr = zip.file('word/document.xml').asText();
            docXmlStr = docXmlStr.replace(/MAYO[\s\u00A0]*2026/gi, '{mes_anio}');
            docXmlStr = docXmlStr.replace(/mes[\s\u00A0]*año/gi, '{mes_anio}');
            zip.file('word/document.xml', docXmlStr);
        }

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
        
        doc.render(textData);
        // Volvemos a extraer el zip renderizado
        const renderedZip = doc.getZip();

        // ── 2. Inyección de Imágenes directamente en ZIP ─────────────────────
        if (originalName) {
            const xmlString = renderedZip.file('word/document.xml').asText();
            const relsString = renderedZip.file('word/_rels/document.xml.rels').asText();
            let contentTypesString = renderedZip.file('[Content_Types].xml').asText();

            const relsDoc = new DOMParser().parseFromString(relsString, 'text/xml');
            const relsElements = relsDoc.getElementsByTagName('Relationship');

            const ignored = IGNORED_MAP[templateName] || [];
            let shapeCounter = 0;
            let tagCounter = 0;

            // ── CORRECCIÓN: procesar TODOS los r:embed de cada párrafo ──────────
            // Word agrupa múltiples imágenes en un mismo <w:p> (párrafo).
            // El motor antiguo solo detectaba el primer r:embed; ahora iteramos todos.
            // shapeCounter sigue siendo por párrafo (para el IGNORED_MAP),
            // pero tagCounter incrementa por cada imagen individual.
            xmlString = xmlString.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
                if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
                    shapeCounter++;
                    if (ignored.includes(shapeCounter)) return parrafo;

                    let updatedParrafo = parrafo;
                    const regex = /(r:embed|r:id)="([^"]+)"/g;

                    updatedParrafo = updatedParrafo.replace(regex, (match, attrName, rId) => {
                        const target = getTargetFromRel(rId, relsElements);
                        
                        // Si el rel apunta a una imagen en la carpeta media
                        if (target && (target.includes('media/') || target.includes('image'))) {
                            tagCounter++;
                            const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
                            
                            // Si el usuario subió una imagen para este slot
                            if (imageBuffers[tagName]) {
                                const newBuf = imageBuffers[tagName];
                                const { ext, mime } = getMimeTypeAndExt(newBuf);
                                const newTarget = `media/${tagName}.${ext}`;
                                const newRId = `rId_${tagName}_${Date.now()}`; // Forzar unicidad
                                
                                // Inyectar el nuevo archivo físico en el zip
                                renderedZip.file(`word/${newTarget}`, newBuf);
                                
                                // Actualizar el ContentTypes si la extensión es nueva
                                if (!contentTypesString.includes(`Extension="${ext}"`)) {
                                    contentTypesString = contentTypesString.replace('</Types>', `<Default Extension="${ext}" ContentType="${mime}"/></Types>`);
                                }
                                
                                // Crear un nuevo Relationship
                                const relNode = relsDoc.createElement('Relationship');
                                relNode.setAttribute('Id', newRId);
                                relNode.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
                                relNode.setAttribute('Target', newTarget);
                                
                                const relationshipsNode = relsDoc.getElementsByTagName('Relationships')[0];
                                if (relationshipsNode) {
                                    relationshipsNode.appendChild(relNode);
                                }
                                
                                // Reemplazar el atributo en el XML para que apunte al NUEVO rId
                                return `${attrName}="${newRId}"`;
                            }
                        }
                        
                        // Si no es imagen o no hay imagen del usuario, dejamos el rId original
                        return match;
                    });
                    
                    return updatedParrafo;
                }
                return parrafo;
            });

            // GUARDAR EL XML PRINCIPAL ACTUALIZADO (antes esto faltaba)
            renderedZip.file('word/document.xml', xmlString);

            renderedZip.file('word/_rels/document.xml.rels', new XMLSerializer().serializeToString(relsDoc));
            renderedZip.file('[Content_Types].xml', contentTypesString);
        }

        const outputBuffer = renderedZip.generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        const outName = `Informe_SSOMA_${new Date().toISOString().split('T')[0]}.docx`;

        return new NextResponse(outputBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${outName}"`,
            },
        });

    } catch (e: any) {
        console.error('generar-docx error:', e);
        return NextResponse.json({
            error: e.message || 'Error al generar el documento.',
            properties: e.properties,
        }, { status: 500 });
    }
}
