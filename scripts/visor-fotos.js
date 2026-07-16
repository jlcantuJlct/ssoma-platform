/**
 * VISOR DE CONTEXTO DE FOTOGRAFÍAS — PAD SAN CLEMENTE
 * =====================================================
 * Genera un HTML visual con tarjetas por cada imagen,
 * mostrando el contexto completo (párrafos antes y después)
 * para que el usuario pueda validar y corregir el mapeo.
 */

const fs     = require('fs');
const PizZip = require('pizzip');

const INPUT       = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const OUTPUT_HTML = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\VISOR_FOTOS.html';

// ── Leer el docx ──────────────────────────────────────────────────────────────
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

// ── Parsear párrafos ──────────────────────────────────────────────────────────
const paragraphs = [];
const paraRegex  = /<w:p[ >][\s\S]*?<\/w:p>/g;
let match;

while ((match = paraRegex.exec(xml)) !== null) {
    const raw = match[0];
    const hasImage = raw.includes('<w:drawing') || raw.includes('<v:shape') || raw.includes('pic:pic');
    
    // Detectar si es título de sección principal
    const hasBold = raw.includes('<w:b/>') || raw.includes('<w:b ');
    const hasHeading = raw.includes('w:styleId="Heading') || raw.includes('w:val="heading');

    const text = raw
        .replace(/<\/w:p>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ').trim();

    paragraphs.push({ text, hasImage, hasBold, hasHeading });
}

// ── Detectar secciones principales ───────────────────────────────────────────
// Vamos acumulando la sección actual mientras recorremos párrafos
function detectSection(paragraphs, idx) {
    // Buscar hacia atrás el último título de sección (texto en negrita o que empieza con 8.)
    for (let j = idx - 1; j >= Math.max(0, idx - 40); j--) {
        const t = paragraphs[j].text;
        if (/^(PROGRAMA|Subprograma|8\.[0-9]|ANEXO)/i.test(t) || paragraphs[j].hasHeading || (paragraphs[j].hasBold && t.length < 120)) {
            return t.substring(0, 100);
        }
    }
    return '';
}

// ── Construir las tarjetas de cada imagen ────────────────────────────────────
const CONTEXT_BACK    = 8;
const CONTEXT_FORWARD = 4;

const imageCards = [];
let fotoCounter  = 0;

paragraphs.forEach((para, idx) => {
    if (!para.hasImage) return;
    fotoCounter++;

    const tag = `{%foto_${String(fotoCounter).padStart(3, '0')}}`;

    // Contexto anterior (hasta 8 párrafos)
    const contextBefore = [];
    for (let j = Math.max(0, idx - CONTEXT_BACK); j < idx; j++) {
        if (paragraphs[j].text) contextBefore.push({ text: paragraphs[j].text, hasBold: paragraphs[j].hasBold });
    }

    // Contexto posterior (hasta 4 párrafos)
    const contextAfter = [];
    for (let j = idx + 1; j <= Math.min(paragraphs.length - 1, idx + CONTEXT_FORWARD); j++) {
        if (paragraphs[j].hasImage) break;
        if (paragraphs[j].text) contextAfter.push({ text: paragraphs[j].text, hasBold: paragraphs[j].hasBold });
    }

    // Título de la fotografía (el párrafo más cercano que diga "Fotografía")
    let titleFoto = '';
    for (let j = idx - 1; j >= Math.max(0, idx - 6); j--) {
        if (/fotografía|foto n°|imagen n°/i.test(paragraphs[j].text)) {
            titleFoto = paragraphs[j].text;
            break;
        }
    }
    // Si no hay título antes, buscar después
    if (!titleFoto) {
        for (let j = idx + 1; j <= Math.min(paragraphs.length - 1, idx + 3); j++) {
            if (/fotografía|foto n°/i.test(paragraphs[j].text)) {
                titleFoto = paragraphs[j].text;
                break;
            }
        }
    }

    const section = detectSection(paragraphs, idx);

    // Tipo de imagen: logo/cuadro vs fotografía real
    const isRealPhoto = /fotografía|foto n°|imagen n°/i.test(titleFoto);
    const isCuadro    = !isRealPhoto && contextBefore.some(c => /cuadro|cronograma|cuadro n°/i.test(c.text));

    imageCards.push({
        tag, titleFoto, contextBefore, contextAfter, section, isRealPhoto, isCuadro, idx,
    });
});

// ── Generar HTML ──────────────────────────────────────────────────────────────
function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderContext(lines, highlightFoto = false) {
    return lines.map(l => {
        const isFoto    = /fotografía|foto n°/i.test(l.text);
        const isFuente  = /^fuente:/i.test(l.text);
        const cls       = isFoto ? 'ctx-foto' : isFuente ? 'ctx-fuente' : l.hasBold ? 'ctx-bold' : 'ctx-normal';
        return `<div class="ctx-line ${cls}">${escHtml(l.text.substring(0, 120))}</div>`;
    }).join('');
}

const totalReal   = imageCards.filter(c => c.isRealPhoto).length;
const totalCuadro = imageCards.filter(c => c.isCuadro).length;
const totalOtros  = imageCards.length - totalReal - totalCuadro;

const cards = imageCards.map(card => {
    const typeClass = card.isRealPhoto ? 'card-foto' : card.isCuadro ? 'card-cuadro' : 'card-otro';
    const typeBadge = card.isRealPhoto
        ? '<span class="badge badge-foto">📸 Fotografía</span>'
        : card.isCuadro
            ? '<span class="badge badge-cuadro">📊 Cuadro/Tabla</span>'
            : '<span class="badge badge-otro">🖼️ Otro elemento</span>';

    const titleDisplay = card.titleFoto
        ? `<div class="card-title">${escHtml(card.titleFoto)}</div>`
        : `<div class="card-title muted">(sin título identificado)</div>`;

    const sectionDisplay = card.section
        ? `<div class="card-section">📂 ${escHtml(card.section.substring(0, 80))}</div>`
        : '';

    return `
    <div class="card ${typeClass}" data-tag="${card.tag}" data-real="${card.isRealPhoto}" data-cuadro="${card.isCuadro}">
        <div class="card-header">
            <div class="card-tag">${card.tag}</div>
            ${typeBadge}
        </div>
        ${sectionDisplay}
        ${titleDisplay}
        <div class="ctx-wrapper">
            <div class="ctx-label">Contexto anterior</div>
            <div class="ctx-block before">
                ${renderContext(card.contextBefore)}
                <div class="ctx-image">▶ IMAGEN AQUÍ ◀</div>
            </div>
            <div class="ctx-label">Contexto posterior</div>
            <div class="ctx-block after">
                ${renderContext(card.contextAfter)}
            </div>
        </div>
        <div class="card-note">
            <label>📝 Nota / Corrección:</label>
            <input type="text" class="note-input" placeholder="Escribe aquí si necesitas corregir esta foto..." />
        </div>
    </div>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Visor de Fotos — PAD San Clemente SSOMA</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', system-ui, sans-serif; background: #060d18; color: #e2e8f0; padding: 1.5rem; }

/* ── Header ── */
.header { margin-bottom: 1.5rem; }
.header h1 { font-size: 1.7rem; font-weight: 900; color: #34d399; }
.header p  { color: #64748b; font-size: 0.85rem; margin-top: 0.3rem; }

/* ── Stats ── */
.stats { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.stat  { background: #0d1829; border: 1px solid #1e293b; border-radius: 10px; padding: 0.8rem 1.2rem; min-width: 130px; }
.stat .num { font-size: 2rem; font-weight: 900; }
.stat .lbl { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-green .num { color: #34d399; }
.stat-blue  .num { color: #60a5fa; }
.stat-orange .num { color: #fb923c; }
.stat-gray  .num  { color: #94a3b8; }

/* ── Toolbar ── */
.toolbar { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; align-items: center; }
.toolbar input { flex: 1; min-width: 200px; max-width: 380px; padding: 0.55rem 1rem; border-radius: 8px; border: 1px solid #1e3a2f; background: #0d1829; color: #e2e8f0; font-size: 0.9rem; outline: none; }
.toolbar input:focus { border-color: #34d399; }
.filter-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #1e293b; background: #0d1829; color: #94a3b8; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; font-weight: 600; }
.filter-btn:hover, .filter-btn.active { background: #1e3a2f; color: #34d399; border-color: #34d399; }
.filter-btn.f-cuadro.active  { background: #1e2a4a; color: #60a5fa; border-color: #60a5fa; }
.filter-btn.f-otro.active    { background: #2a1e1e; color: #fb923c; border-color: #fb923c; }
.export-btn { margin-left: auto; padding: 0.5rem 1.2rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #059669, #0d9488); color: white; font-size: 0.85rem; font-weight: 700; cursor: pointer; }

/* ── Grid ── */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 1.2rem; }

/* ── Card ── */
.card { background: #0d1829; border-radius: 14px; border: 1px solid #1e293b; padding: 1rem 1.1rem; border-left-width: 4px; }
.card-foto   { border-left-color: #34d399; }
.card-cuadro { border-left-color: #60a5fa; }
.card-otro   { border-left-color: #fb923c; }

.card-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; }
.card-tag    { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 0.88rem; font-weight: 800; color: #93c5fd; background: #0a1628; padding: 3px 10px; border-radius: 6px; }
.badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 5px; }
.badge-foto   { background: #1e3a2f; color: #34d399; }
.badge-cuadro { background: #1e2a4a; color: #60a5fa; }
.badge-otro   { background: #2a1e1e; color: #fb923c; }

.card-section { font-size: 0.72rem; color: #4b6280; margin-bottom: 0.35rem; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-title   { font-size: 0.88rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.6rem; line-height: 1.4; }
.card-title.muted { color: #475569; font-style: italic; }

.ctx-wrapper  { margin-bottom: 0.7rem; }
.ctx-label    { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; font-weight: 700; margin-bottom: 0.25rem; margin-top: 0.5rem; }
.ctx-block    { background: #060d18; border-radius: 8px; padding: 0.5rem 0.7rem; font-size: 0.75rem; line-height: 1.55; }
.ctx-line     { padding: 1px 0; }
.ctx-normal   { color: #475569; }
.ctx-bold     { color: #94a3b8; font-weight: 600; }
.ctx-foto     { color: #34d399; font-weight: 700; }
.ctx-fuente   { color: #334155; font-style: italic; }
.ctx-image    { margin: 4px 0; padding: 5px 10px; background: #1e293b; border-radius: 6px; text-align: center; font-weight: 800; font-size: 0.78rem; color: #60a5fa; letter-spacing: 0.06em; }

.card-note    { display: flex; flex-direction: column; gap: 4px; }
.card-note label { font-size: 0.7rem; color: #334155; }
.note-input   { padding: 0.4rem 0.7rem; border-radius: 7px; border: 1px solid #1e293b; background: #060d18; color: #e2e8f0; font-size: 0.78rem; outline: none; }
.note-input:focus { border-color: #7c3aed; }

/* ── Hidden ── */
.card.hidden { display: none !important; }

/* ── Tip ── */
.tip { background: #0d1829; border: 1px solid #1e3a2f; border-left: 3px solid #34d399; border-radius: 8px; padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.82rem; color: #94a3b8; line-height: 1.7; }
.tip strong { color: #34d399; }
</style>
</head>
<body>

<div class="header">
    <h1>📸 Visor de Fotografías — PAD San Clemente</h1>
    <p>Informe mensual SSOMA · Generado el ${new Date().toLocaleDateString('es-PE', {day:'2-digit',month:'long',year:'numeric'})} · ${imageCards.length} imágenes detectadas</p>
</div>

<div class="stats">
    <div class="stat stat-green"><div class="num">${totalReal}</div><div class="lbl">📸 Fotografías reales</div></div>
    <div class="stat stat-blue"><div class="num">${totalCuadro}</div><div class="lbl">📊 Cuadros / Tablas</div></div>
    <div class="stat stat-orange"><div class="num">${totalOtros}</div><div class="lbl">🖼️ Otros elementos</div></div>
    <div class="stat stat-gray"><div class="num">${imageCards.length}</div><div class="lbl">Total imágenes</div></div>
</div>

<div class="tip">
    <strong>💡 Cómo validar:</strong> Cada tarjeta muestra el texto que rodea a la imagen en el documento.
    La <span style="color:#34d399">línea azul</span> "<strong>▶ IMAGEN AQUÍ ◀</strong>" marca exactamente dónde está colocada la foto.
    Las filas con borde <span style="color:#34d399">verde</span> son fotografías identificadas. Las <span style="color:#60a5fa">azules</span> son cuadros o tablas (generalmente no necesitan cambio). Las <span style="color:#fb923c">naranjas</span> son otros elementos (logos, íconos de diseño).
    <br/>Puedes escribir notas de corrección en cada tarjeta y luego usar el botón <strong>Exportar Correcciones</strong>.
</div>

<div class="toolbar">
    <input type="text" id="searchInput" placeholder="🔍 Buscar por número, título o palabra clave..." oninput="applyFilters()" />
    <button class="filter-btn active" id="btn-all" onclick="setFilter('all')">Todos (${imageCards.length})</button>
    <button class="filter-btn f-foto" id="btn-foto" onclick="setFilter('foto')">📸 Fotografías (${totalReal})</button>
    <button class="filter-btn f-cuadro" id="btn-cuadro" onclick="setFilter('cuadro')">📊 Cuadros (${totalCuadro})</button>
    <button class="filter-btn f-otro" id="btn-otro" onclick="setFilter('otro')">🖼️ Otros (${totalOtros})</button>
    <button class="export-btn" onclick="exportarNotas()">📥 Exportar Correcciones</button>
</div>

<div class="grid" id="grid">
    ${cards}
</div>

<script>
let currentFilter = 'all';

function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + f).classList.add('active');
    applyFilters();
}

function applyFilters() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const isReal   = card.dataset.real   === 'true';
        const isCuadro = card.dataset.cuadro === 'true';
        const text     = card.textContent.toLowerCase();

        const passFilter =
            currentFilter === 'all'    ||
            (currentFilter === 'foto'   && isReal)   ||
            (currentFilter === 'cuadro' && isCuadro) ||
            (currentFilter === 'otro'   && !isReal && !isCuadro);

        const passSearch = !q || text.includes(q);

        card.classList.toggle('hidden', !(passFilter && passSearch));
    });
}

function exportarNotas() {
    const notas = [];
    document.querySelectorAll('.card').forEach(card => {
        const nota = card.querySelector('.note-input').value.trim();
        if (nota) {
            notas.push(card.dataset.tag + ' → ' + nota);
        }
    });
    if (notas.length === 0) {
        alert('No has escrito ninguna nota de corrección todavía.');
        return;
    }
    const blob = new Blob([notas.join('\\n')], { type: 'text/plain;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'correcciones_fotos.txt';
    a.click();
}
</script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
console.log(`\n✅ Visor generado (${imageCards.length} tarjetas):\n   ${OUTPUT_HTML}\n`);
console.log(`   📸 Fotografías reales identificadas : ${totalReal}`);
console.log(`   📊 Cuadros / tablas                : ${totalCuadro}`);
console.log(`   🖼️  Otros elementos                 : ${totalOtros}`);
