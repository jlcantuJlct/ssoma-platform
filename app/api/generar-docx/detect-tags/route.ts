import { NextResponse } from 'next/server';
import PizZip from 'pizzip';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/generar-docx/detect-tags
 * Recibe un FormData con el archivo .docx y devuelve las etiquetas detectadas.
 *
 * PROBLEMA CONOCIDO: Word fragmenta el texto en múltiples <w:r> (runs),
 * por lo que "{%foto_001}" puede aparecer como "{%foto_" en un run y "001}" en otro.
 * SOLUCIÓN: Unir primero todos los <w:t> de cada párrafo <w:p> antes de buscar.
 */
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const templateFile = formData.get('template') as File | null;

        if (!templateFile) {
            return NextResponse.json({ error: 'No se recibió la plantilla.' }, { status: 400 });
        }

        const buffer = Buffer.from(await templateFile.arrayBuffer());
        const zip    = new PizZip(buffer);

        // Leer todos los XMLs relevantes: documento principal + cabeceras/pies de página
        const xmlFiles = [
            'word/document.xml',
            'word/header1.xml', 'word/header2.xml', 'word/header3.xml',
            'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml',
        ];

        const textTags  = new Set<string>();
        const imageTags = new Set<string>();

        for (const xmlPath of xmlFiles) {
            const xmlFile = zip.file(xmlPath);
            if (!xmlFile) continue;

            const xml = xmlFile.asText();

            // ── Estrategia 1: unir runs de cada párrafo ──────────────────────
            // Extraer todos los <w:p>...</w:p> y dentro de cada uno unir el texto de los <w:t>
            const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
            let paraMatch;

            while ((paraMatch = paraRegex.exec(xml)) !== null) {
                const paraXml = paraMatch[0];

                // Unir todo el texto de los <w:t> del párrafo (ignorando atributos xml:space)
                const textParts: string[] = [];
                const textRunRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
                let textMatch;
                while ((textMatch = textRunRegex.exec(paraXml)) !== null) {
                    textParts.push(
                        textMatch[1]
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g,  '<')
                            .replace(/&gt;/g,  '>')
                            .replace(/&quot;/g,'"')
                            .replace(/&apos;/g,"'")
                    );
                }

                const joinedText = textParts.join('');
                extractTags(joinedText, textTags, imageTags);
            }

            // ── Estrategia 2: texto plano completo (por si quedó algo fuera de párrafos) ──
            const plainText = xml
                .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (_m, t) =>
                    t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
                )
                .replace(/<[^>]+>/g, '');

            extractTags(plainText, textTags, imageTags);
        }

        // Las etiquetas de imagen no deben aparecer también en textTags
        imageTags.forEach(t => {
            textTags.delete(`%${t}`);
            textTags.delete(t);
        });

        // Ordenar: fotos en orden numérico si tienen número al final
        const sortedImageTags = Array.from(imageTags).sort((a, b) => {
            const na = parseInt(a.replace(/\D/g,'')) || 0;
            const nb = parseInt(b.replace(/\D/g,'')) || 0;
            return na - nb || a.localeCompare(b);
        });

        return NextResponse.json({
            textTags:  Array.from(textTags),
            imageTags: sortedImageTags,
        });

    } catch (e: any) {
        console.error('detect-tags error:', e);
        return NextResponse.json({ error: e.message || 'Error al analizar la plantilla.' }, { status: 500 });
    }
}

/**
 * Extrae etiquetas {campo} y {%imagen} de un texto ya limpio.
 */
function extractTags(text: string, textTags: Set<string>, imageTags: Set<string>) {
    // Etiquetas de imagen: {%nombre}
    const imgPattern = /\{%([^{}\s]+)\}/g;
    let m;
    while ((m = imgPattern.exec(text)) !== null) {
        imageTags.add(m[1].trim());
    }

    // Etiquetas de texto: {nombre} (sin % al inicio)
    const txtPattern = /\{([^%#{}/\s][^{}\s]*)\}/g;
    while ((m = txtPattern.exec(text)) !== null) {
        const tag = m[1].trim();
        
        // Identificar si es un UUID interno de Word (ej: BEBA8EAE-BF5A-486C-A8C5-ECC9F3942E4B)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tag);
        
        // Excluir etiquetas de control docxtemplater (#, /, @, .) y UUIDs
        if (!tag.startsWith('#') && !tag.startsWith('/') &&
            !tag.startsWith('@') && !tag.startsWith('.') && !isUUID) {
            textTags.add(tag);
        }
    }
}
