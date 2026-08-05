import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 200,
        headers: CORS_HEADERS
    });
}

const IGNORED_MAP: Record<string, number[]> = {
    // Shapes ignorados: portada, logos, coordenadas, mapa Google Earth, organigrama y tablas fijas (shapes 1-29)
    // Con esta lista, foto_001 = shape 30 = "Fotografía 8.1.1.1-1: Baños químicos" (primera foto real de campo)
    'PAD_SAN CLEMENTE ultimo.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 68],
    'PAD_SAN_CLEMENTE_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 68],
    'PAD_SAN_CLEMENTE_INTERNAL.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 68],
    'PAD_CHINCHAYSULLO_PLANTILLA.docx': [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232],
    'PAD_CHINCHAYSULLO_INTERNAL.docx': [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232],
    'PAD_BARANDAS_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19],
    'PAD_BARANDAS_INTERNAL.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19],
    'PAD_JAHUAY_PLANTILLA.docx': [1, 2],
    'PAD_JAHUAY_INTERNAL.docx': [1, 2],
    'MP6_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    'MP6_INTERNAL.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
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
        const docType = formData.get('docType') as string | null;

        let templateBuffer: Buffer;
        const fileName = templateFile?.name || '';
        let originalName = '';
        let templateName = '';

        if (docType && docType.endsWith('_INTERNAL.docx')) {
            // Lógica especial para plantillas pre-cargadas en el servidor
            if (docType === 'PAD_SAN_CLEMENTE_INTERNAL.docx') {
                templateName = 'PAD_SAN CLEMENTE ultimo.docx';
                originalName = 'PAD_SAN CLEMENTE ultimo.docx';
            } else if (docType === 'PAD_CHINCHAYSULLO_INTERNAL.docx') {
                templateName = 'PAD_CHINCHAYSULLO_PLANTILLA.docx';
                originalName = 'PAD-CHINCHAYSULLO ultimo.docx';
            } else if (docType === 'PAD_BARANDAS_INTERNAL.docx') {
                templateName = 'PAD_BARANDAS_PLANTILLA.docx';
                originalName = 'MP Barandas Mayo .docx';
            } else if (docType === 'PAD_JAHUAY_INTERNAL.docx') {
                templateName = 'PAD_JAHUAY_PLANTILLA.docx';
                originalName = 'Peaje Jahuay Ultimo.docx';
            } else if (docType === 'MP6_INTERNAL.docx') {
                templateName = 'MP6_PLANTILLA.docx';
                originalName = 'MP6 _ultimo.docx';
            }
            
            const localPath = path.join(process.cwd(), 'plantillas', originalName);
            templateBuffer = fs.readFileSync(localPath);
        } else {
            if (!templateFile) {
                return NextResponse.json({ error: 'No se recibió la plantilla.' }, { status: 400 });
            }
            templateName = fileName;
            templateBuffer = Buffer.from(await templateFile.arrayBuffer());
        }

        const textData: Record<string, string> = textDataStr ? JSON.parse(textDataStr) : {};
        const imageBuffers: Record<string, Buffer> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('img_')) {
                const tagName = key.replace('img_', '');
                if (value instanceof File) {
                    const buf = await value.arrayBuffer();
                    imageBuffers[tagName] = Buffer.from(buf);
                } else if (typeof value === 'string' && value.startsWith('http')) {
                    try {
                        const r = await fetch(value);
                        if (r.ok) {
                            const buf = await r.arrayBuffer();
                            imageBuffers[tagName] = Buffer.from(buf);
                        }
                    } catch (e) {
                        console.error('Failed to download image URL', value);
                    }
                }
            }
        }

        const imageTagsDataRaw = formData.get('imageTagsData') as string;
        if (imageTagsDataRaw) {
            try {
                const imageTagsData = JSON.parse(imageTagsDataRaw);
                
                // Procesar de 1 en 1 para no saturar la red local (solicitado por el usuario)
                for (const tag of imageTagsData) {
                    if (!tag.remoteUrl || !tag.name) continue;
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 12000);
                        const r = await fetch(tag.remoteUrl, { signal: controller.signal });
                        clearTimeout(timeoutId);
                        
                        if (r.ok) {
                            const buf = await r.arrayBuffer();
                            // Compresión extrema en el backend para evitar que el navegador colapse con un ZIP masivo
                            const compressedBuf = await sharp(Buffer.from(buf))
                                .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
                                .jpeg({ quality: 60 })
                                .toBuffer();
                            imageBuffers[tag.name] = compressedBuf;
                        }
                    } catch (e) {
                        console.warn(`Error descargando imagen ${tag.name} en el backend`, e);
                    }
                }
            } catch (e) {
                console.error("Error procesando imageTagsData", e);
            }
        }

        const zip = new PizZip(templateBuffer);

        // ── 1. Reemplazo de Textos con Docxtemplater ─────────────────────────
        // Antes de docxtemplater, normalizamos 'mes año' o 'MAYO 2026' a '{mes_anio}' manualmente si es necesario, 
        // pero docxtemplater ya lo hace si el usuario escribió la etiqueta.
        // Haremos un reemplazo rápido en texto para MAYO 2026 a mes_anio si no existe.
        if (textData['mes_anio']) {
            let docXmlStr = zip.file('word/document.xml').asText();
            // Buscar cualquier MES seguido de un año 202X (ej. MAYO 2026, JUNIO 2026) y reemplazarlo
            docXmlStr = docXmlStr.replace(/(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)[\s\u00A0]*202[0-9]/gi, '{mes_anio}');
            // Buscar también "mes año" genérico
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
        const fallbackSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f1f5f9" />
            <rect width="96%" height="94%" x="2%" y="3%" fill="none" stroke="#f87171" stroke-width="12" stroke-dasharray="20, 20" rx="10" ry="10" />
            <text x="50%" y="50%" font-family="sans-serif" font-size="50" font-weight="bold" fill="#f87171" text-anchor="middle" dominant-baseline="middle">Falta cargar foto</text>
        </svg>`;
        const fallbackBuffer = await sharp(Buffer.from(fallbackSvg)).png().toBuffer();

        let xmlString = renderedZip.file('word/document.xml').asText();
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
                        
                        // Si el usuario subió una imagen para este slot, o usamos el fallback si no hay
                        const newBuf = imageBuffers[tagName] || fallbackBuffer;
                        
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
                    
                    // Si no es imagen, dejamos el rId original
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
                ...CORS_HEADERS
            },
        });

    } catch (e: any) {
        console.error('generar-docx error:', e);
        return NextResponse.json({
            error: e.message || 'Error al generar el documento.',
            properties: e.properties,
        }, { status: 500, headers: CORS_HEADERS });
    }
}
// Dummy line to test
