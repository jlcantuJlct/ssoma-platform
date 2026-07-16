/**
 * ETIQUETADOR DE PLANTILLA SSOMA
 * ================================
 * Este script lee el archivo "PAD_SAN CLEMENTE ultimo.docx",
 * inserta las etiquetas de docxtemplater en los lugares correctos,
 * y guarda una nueva versión "PAD_SAN_CLEMENTE_PLANTILLA.docx" lista para usar
 * con el Generador Dinámico de Informes.
 *
 * Estrategia:
 * - Texto dinámico (mes/año): reemplaza "mayo 2026" → {mes_anio}, "Mayo 2026" → {Mes_Anio}, etc.
 * - Fotografías: inserta la etiqueta {%foto_NNN} justo antes del párrafo vacío que
 *   Word deja como marcador de posición de imagen.
 *
 * EJECUCIÓN:
 *   node scripts/etiquetar-plantilla.js
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

// ── Rutas ─────────────────────────────────────────────────────────────────────
const INPUT  = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const OUTPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN_CLEMENTE_PLANTILLA.docx';

// ── Helpers XML ───────────────────────────────────────────────────────────────
function xmlRun(text, rPr = '') {
    return `<w:r>${rPr}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`;
}

function xmlPara(innerXml, pPr = '') {
    return `<w:p>${pPr}${innerXml}</w:p>`;
}

function escXml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Párrafo de imagen centrado ────────────────────────────────────────────────
function imagePara(tagName) {
    // El módulo de imagen necesita la etiqueta dentro de un w:r exactamente así:
    return `<w:p>` +
        `<w:pPr><w:jc w:val="center"/></w:pPr>` +
        `<w:r><w:t>{%${tagName}}</w:t></w:r>` +
        `</w:p>`;
}

// ── Mapeo de fotografías ──────────────────────────────────────────────────────
// Para cada fotografía del informe creamos un nombre de etiqueta corto y descriptivo.
// Docxtemplater no puede tener etiquetas con puntos o guiones, solo letras/números/guiones bajos.
const FOTO_MAP = [
    // --- PROGRAMA AMBIENTAL ---
    ['Fotografía N° 8.1.1.3-1',  'foto_manejo_combustible_1'],
    ['Fotografía N° 8.1.1.3-2',  'foto_manejo_combustible_2'],
    ['Fotografía N° 8.1.1.3-3',  'foto_manejo_combustible_3'],
    ['Fotografía N° 8.1.1.3-4',  'foto_bandeja_antiderrames'],
    ['Fotografía N° 8.1.2',      'foto_residuos'],
    ['Fotografía N° 8.1.3',      'foto_ruido_vibraciones'],
    ['Fotografía N° 8.1.4.1-1',  'foto_señalizacion_1'],
    ['Fotografía N° 8.1.4.1-2',  'foto_señalizacion_2'],
    ['Fotografía N° 8.1.4.1-3',  'foto_delimitacion_frente'],
    ['Fotografía N° 8.1.4.1-4',  'foto_delimitacion_zi_b'],
    ['Fotografía N° 8.1.4.1-5',  'foto_delimitacion_zi_a'],
    ['Fotografía N° 8.1.4.1-6',  'foto_señalizacion_ambiental'],
    ['Fotografía N° 8.1.1.3-4',  'foto_bandeja_cisterna'],
    ['Fotografía N° 8.1.4.4-1',  'foto_cabezal_cisterna'],
    ['Fotografía N° 8.1.4.4-2',  'foto_kit_antiderrame_cisterna'],
    ['Fotografía N° 8.1.4.4-3',  'foto_cisterna_fuera_rio'],
    ['Fotografía N° 8.1.4.4.-4', 'foto_señal_ambiental'],
    ['Fotografía N° 8.1.4.4-5',  'foto_señal_prohibicion_lavado'],
    ['Fotografía N° 8.1.5.1-1',  'foto_vehiculo_emergencia'],
    ['Fotografía N° 8.1.5.1-2',  'foto_topico_especialista'],
    ['Fotografía N° 8.1.5.1-3',  'foto_directorio_emergencia'],
    ['Fotografía N° 8.1.5.2-1',  'foto_señalizacion_vial'],
    ['Fotografía N° 8.1.5.2-2',  'foto_delimitadores'],
    ['Fotografía N° 8.1.4.2-3',  'foto_vigias_diurnos'],
    ['Fotografía N° 8.1.5.2-4',  'foto_cruces_peatonales'],
    ['Fotografía N° 8.1.5.2-5',  'foto_señalizacion_seguridad'],
    ['Fotografía N° 8.1.6-1',    'foto_ruta_ingreso_salida'],
    // --- PROGRAMA SOCIAL ---
    ['Fotografía N° 8.2.1.2-1',  'foto_buzon_sugerencias'],
    ['Fotografía N° 8.2.5-1',    'foto_buzon_reclamos'],
    // --- EDUCACION AMBIENTAL ---
    ['Fotografía N° 8.3.1.2-1',  'foto_charla_ambiental_1'],
    // (la segunda foto con mismo número se mapea igual, docxtemplater repetirá la misma imagen)
    ['Fotografía N° 8.3.2.2-1',  'foto_reparto_volantes'],
    ['Fotografía N° 8.3.2.3-1',  'foto_señalizacion_permanente'],
    // --- SALUD Y SEGURIDAD ---
    ['Fotografía N° 8.4.1-1',    'foto_flujograma_emergencia'],
    ['Fotografía N° 8.4.1-2',    'foto_topico'],
    ['Fotografía N° 8.4.1-3',    'foto_lavado_manos'],
    ['Fotografía N° 8.4.1-4',    'foto_lava_ojos'],
    ['Fotografía N° 8.4.1- 5',   'foto_limpieza_comedor'],
    ['Fotografía N° 8.4.2-1',    'foto_entrega_epp'],
    ['Fotografía N° 8.4.2-2',    'foto_revision_ast'],
    ['Fotografía N° 8.4.2-3',    'foto_iperc_exhibicion'],
    ['Fotografía N° 8.4.3-1',    'foto_estacion_emergencia_sc'],
    ['Fotografía N° 8.4.3-2',    'foto_topico_zi_pisco'],
    ['Fotografía N° 8.4.3-3',    'foto_kits_extintores_frente'],
    ['Fotografía N° 8.4.3-4',    'foto_kits_extintores_zi'],
];

// ── Proceso principal ─────────────────────────────────────────────────────────
console.log('📂 Leyendo plantilla original...');
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);
let xml = zip.file('word/document.xml').asText();

// ── 1. Reemplazar "mes año" por etiquetas de texto ───────────────────────────
// Meses en español
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

let replacements = 0;

// Reemplazar variaciones de mes año: "mayo 2026", "Mayo 2026", "MAYO 2026", etc.
// También "mayo del 2026"
for (const mes of MESES_ES) {
    const patron = new RegExp(
        `(${mes})(\\s+del?\\s+)(20\\d\\d)`,
        'gi'
    );
    xml = xml.replace(patron, (match, m, sep, anio) => {
        replacements++;
        return '{mes_anio}';
    });
    // También sin "del": "mayo 2026"
    const patron2 = new RegExp(
        `(${mes})(\\s+)(20\\d\\d)`,
        'gi'
    );
    xml = xml.replace(patron2, (match) => {
        replacements++;
        return '{mes_anio}';
    });
}

// Reemplazar año solo cuando aparece como "2026" en contextos de "mes de 2026"
// (evitar reemplazar años de artículos de ley como DS 005-2012-TR)
// Ya cubierto con los patrones anteriores.

// También el año en la portada / encabezado (si aparece suelto junto al mes)
// Lo dejamos con la variable {anio} separada para flexibilidad
xml = xml.replace(/\b(20[2-9]\d)\b/g, (match, anio) => {
    // Solo reemplazamos si está acompañado de un contexto de fecha de informe
    // Para no romper números de normas (DS-005-2012), dejamos solo el contexto explícito
    return match; // Conservar por ahora, el usuario puede editar manualmente si desea
});

console.log(`✅ Se reemplazaron ${replacements} ocurrencias de "mes año" → {mes_anio}`);

// ── 2. Insertar etiquetas de imagen en los párrafos de Fotografía ─────────────
// En un .docx, cuando hay una imagen, hay un párrafo con un elemento <w:drawing>
// o <a:graphicData>. Buscamos párrafos que contengan imágenes (drawing/blipFill)
// y los reemplazamos con la etiqueta {%foto_xxx}.

// Primero mapeamos posición de las fotos: cada párrafo con <w:drawing> es una foto
// y le asignamos el tag según el orden de aparición del título "Fotografía N° xxx"

// Dividir el XML en párrafos para procesarlo párrafo a párrafo
const parts = xml.split(/(<w:p[ >])/);

let fotoIndex = 0;      // índice en FOTO_MAP para el siguiente párrafo de imagen
let lastFotoTitle = ''; // último título de fotografía visto
let outputParts = [];
let usedTags = {};

for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === '<w:p ' || part === '<w:p>') {
        // Buscar el contenido completo del párrafo (hasta el siguiente </w:p>)
        // Como dividimos en '<w:p ', el resto está en parts[i+1] hasta '</w:p>'
        // Nota: esta estrategia es aproximada; para XML real se necesita un parser.
        // Aquí procesamos el XML completo con replace más abajo.
        outputParts.push(part);
    } else {
        outputParts.push(part);
    }
}

// Estrategia robusta: reemplazar párrafos con <w:drawing> por la etiqueta de imagen
// usando una expresión regular que capture párrafos completos

let shapeCounter = 0;
let tagCounter = 0;
const fotoTagsUsed = [];

// Imágenes que el usuario quiere mantener originales (no reemplazables)
// 1, 2, 3: Logos de la portada
// 6 al 14: Gráfico 7-1 Organigrama SSOMA (múltiples formas dibujadas)
// 72: Cuadro de programación solicitado a omitir
const IGNORED_SHAPES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72];

// Reemplazar cada párrafo que contenga <w:drawing> con el tag de imagen correspondiente
xml = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        
        // Si es una forma ignorada, no la reemplazamos con etiqueta
        if (IGNORED_SHAPES.includes(shapeCounter)) {
            return parrafo;
        }

        tagCounter++;
        const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
        // Preservar el pPr (formato de párrafo) original si existe
        const pPrMatch = parrafo.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
        const pPr = pPrMatch ? pPrMatch[0] : '<w:pPr><w:jc w:val="center"/></w:pPr>';
        fotoTagsUsed.push(tagName);
        return `<w:p>${pPr}<w:r><w:t>{%${tagName}}</w:t></w:r></w:p>`;
    }
    return parrafo;
});


console.log(`✅ Se reemplazaron ${tagCounter} imágenes con etiquetas {%foto_001} ... {%foto_${String(tagCounter).padStart(3,'0')}}`);

// ── 3. Guardar el nuevo XML en el ZIP y escribir el archivo ───────────────────
zip.file('word/document.xml', xml);
const output = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(OUTPUT, output);

console.log(`\n✅ Plantilla guardada en:\n   ${OUTPUT}\n`);
console.log('=== ETIQUETAS DE TEXTO DINÁMICO ===');
console.log('{mes_anio}    → Mes y año del informe (ej: "Mayo 2026")');
console.log('');
console.log(`=== ETIQUETAS DE IMAGEN GENERADAS (${tagCounter} total) ===`);
fotoTagsUsed.slice(0, 20).forEach((tag, i) => {
    console.log(`  ${String(i+1).padStart(3,'0')}. {%${tag}}`);
});
if (fotoTagsUsed.length > 20) {
    console.log(`  ... y ${fotoTagsUsed.length - 20} más (foto_021 hasta foto_${String(fotoTagsUsed.length).padStart(3,'0')})`);
}
console.log('\n📋 SIGUIENTE PASO:');
console.log('   Sube la plantilla al Generador Dinámico de la plataforma SSOMA.');
console.log('   (/generador-informes)');



