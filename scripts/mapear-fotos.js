/**
 * MAPEADOR DE IMÁGENES DEL INFORME SSOMA
 * ========================================
 * Lee el documento Word original y genera una tabla completa
 * que muestra qué título/contexto corresponde a cada slot de imagen.
 *
 * EJECUCIÓN:
 *   node scripts/mapear-fotos.js
 */

const fs   = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const OUTPUT_HTML = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\MAPA_FOTOS.html';

// ── Leer el docx ──────────────────────────────────────────────────────────────
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

// ── Dividir en párrafos ───────────────────────────────────────────────────────
const paragraphs = [];
const paraRegex  = /<w:p[ >][\s\S]*?<\/w:p>/g;
let   match;

while ((match = paraRegex.exec(xml)) !== null) {
    const rawXml = match[0];

    // ¿Tiene imagen?
    const hasImage = rawXml.includes('<w:drawing') ||
                     rawXml.includes('<v:shape')   ||
                     rawXml.includes('pic:pic');

    // Extraer texto limpio del párrafo
    const text = rawXml
        .replace(/<\/w:p>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g,  '&')
        .replace(/&lt;/g,   '<')
        .replace(/&gt;/g,   '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\s+/g,    ' ')
        .trim();

    paragraphs.push({ text, hasImage });
}

// ── Para cada imagen, encontrar el contexto cercano ───────────────────────────
// Buscamos hasta 5 párrafos hacia atrás para encontrar el título de la fotografía
const CONTEXT_LINES_BACK = 6;
const imageSlots = [];

paragraphs.forEach((para, idx) => {
    if (!para.hasImage) return;

    let contextBefore = '';
    let titleFoto     = '';
    let sectionTitle  = '';

    // Buscar hacia atrás
    for (let j = idx - 1; j >= Math.max(0, idx - CONTEXT_LINES_BACK); j--) {
        const prevText = paragraphs[j].text;
        if (!prevText) continue;

        if (!contextBefore) contextBefore = prevText;

        // Detectar si es título de fotografía
        if (/fotografía|foto|imagen|fig\./i.test(prevText)) {
            titleFoto = prevText;
            break;
        }
        // Detectar si es título de cuadro o sección
        if (/cuadro|sección|programa|subprograma|^[0-9]+\./i.test(prevText)) {
            sectionTitle = prevText;
        }
    }

    // Buscar también hacia adelante (a veces el pie de foto viene después)
    let captionAfter = '';
    for (let j = idx + 1; j <= Math.min(paragraphs.length - 1, idx + 3); j++) {
        const nextText = paragraphs[j].text;
        if (!nextText || paragraphs[j].hasImage) break;
        if (/fuente|fotografía|foto/i.test(nextText)) {
            captionAfter = nextText;
            break;
        }
    }

    imageSlots.push({
        slotNumber: imageSlots.length + 1,
        titleFoto:  titleFoto  || contextBefore || '(sin título detectado)',
        captionAfter,
        sectionTitle,
        paragraphIndex: idx,
    });
});

// ── Mostrar en consola ────────────────────────────────────────────────────────
console.log('\n========================================================');
console.log('   MAPA DE FOTOGRAFÍAS — PAD SAN CLEMENTE');
console.log('========================================================\n');
imageSlots.forEach(slot => {
    const tag = `{%foto_${String(slot.slotNumber).padStart(3,'0')}}`;
    const titulo = slot.titleFoto.substring(0, 80);
    const fuente = slot.captionAfter ? ` → ${slot.captionAfter.substring(0,50)}` : '';
    console.log(`${tag.padEnd(14)} │ ${titulo}${fuente}`);
});

// ── Generar HTML visual ───────────────────────────────────────────────────────
const rows = imageSlots.map(slot => {
    const tag = `{%foto_${String(slot.slotNumber).padStart(3,'0')}}`;
    const esImportante = /fotografía|foto n°/i.test(slot.titleFoto);
    const rowClass     = esImportante ? 'important' : '';

    return `
    <tr class="${rowClass}">
        <td class="slot">${tag}</td>
        <td class="titulo">${escHtml(slot.titleFoto)}</td>
        <td class="fuente">${escHtml(slot.captionAfter || '')}</td>
        <td class="seccion">${escHtml(slot.sectionTitle || '')}</td>
    </tr>`;
}).join('\n');

function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Mapa de Fotografías — PAD San Clemente</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: #0a0f18;
    color: #e2e8f0;
    padding: 2rem;
  }
  h1 {
    font-size: 1.6rem;
    font-weight: 800;
    color: #34d399;
    margin-bottom: 0.5rem;
  }
  p.sub {
    color: #64748b;
    font-size: 0.85rem;
    margin-bottom: 2rem;
  }
  .badge {
    display: inline-block;
    background: #1e3a2f;
    color: #34d399;
    border: 1px solid #34d399;
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 0.75rem;
    font-weight: 700;
    margin-right: 6px;
  }
  .stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .stat-card {
    background: #0d1829;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 0.8rem 1.2rem;
    min-width: 140px;
  }
  .stat-card .num { font-size: 1.8rem; font-weight: 900; color: #34d399; }
  .stat-card .lbl { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

  .search-box {
    margin-bottom: 1rem;
  }
  .search-box input {
    width: 100%;
    max-width: 420px;
    padding: 0.55rem 1rem;
    border-radius: 8px;
    border: 1px solid #1e3a2f;
    background: #0d1829;
    color: #e2e8f0;
    font-size: 0.9rem;
    outline: none;
  }
  .search-box input:focus { border-color: #34d399; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }
  thead th {
    background: #0d1829;
    color: #34d399;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.7rem 0.8rem;
    border-bottom: 2px solid #1e3a2f;
    text-align: left;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  tbody tr {
    border-bottom: 1px solid #111827;
    transition: background 0.15s;
  }
  tbody tr:hover { background: #0f1f30; }
  tbody tr.important { border-left: 3px solid #34d399; }
  td { padding: 0.55rem 0.8rem; vertical-align: top; }
  td.slot {
    font-family: 'Cascadia Code', 'Fira Code', monospace;
    font-size: 0.78rem;
    color: #93c5fd;
    white-space: nowrap;
    font-weight: 700;
    background: #0d1829;
  }
  td.titulo { color: #e2e8f0; max-width: 480px; }
  td.fuente { color: #64748b; font-style: italic; max-width: 260px; font-size: 0.75rem; }
  td.seccion { color: #475569; font-size: 0.72rem; max-width: 180px; }
  .highlight { background: #7c3aed33; border-radius: 3px; }

  .tip {
    background: #0d1829;
    border: 1px solid #1e3a2f;
    border-left: 3px solid #34d399;
    border-radius: 8px;
    padding: 0.8rem 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.82rem;
    color: #94a3b8;
    line-height: 1.6;
  }
  .tip strong { color: #34d399; }
</style>
</head>
<body>
<h1>🗺️ Mapa de Fotografías — PAD San Clemente</h1>
<p class="sub">Generado automáticamente · Informe mensual SSOMA · ${new Date().toLocaleDateString('es-PE', {day:'2-digit',month:'long',year:'numeric'})}</p>

<div class="stats">
  <div class="stat-card"><div class="num">${imageSlots.length}</div><div class="lbl">Total de Fotos</div></div>
  <div class="stat-card"><div class="num">${imageSlots.filter(s => /fotografía/i.test(s.titleFoto)).length}</div><div class="lbl">Fotos identificadas</div></div>
  <div class="stat-card"><div class="num">1</div><div class="lbl">Campo de texto ({mes_anio})</div></div>
</div>

<div class="tip">
  <strong>💡 Cómo usar esta tabla:</strong> Busca la fotografía que necesitas actualizar,
  anota su etiqueta <code>{%foto_NNN}</code> y sube la imagen correspondiente
  en el <strong>Generador Dinámico de Informes</strong> de la plataforma SSOMA (<code>/generador-informes</code>).
  Las filas <span style="color:#34d399;font-weight:700;">resaltadas en verde</span> corresponden a fotografías con título identificado.
</div>

<div class="search-box">
  <input type="text" id="searchInput" placeholder="🔍 Buscar foto o palabra clave..." oninput="filterTable()" />
</div>

<table id="fotoTable">
  <thead>
    <tr>
      <th>Etiqueta</th>
      <th>Contexto / Título de Fotografía</th>
      <th>Pie de Foto / Fuente</th>
      <th>Sección</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<script>
function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#fotoTable tbody tr');
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
</script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
console.log(`\n✅ Mapa HTML generado en:\n   ${OUTPUT_HTML}`);
console.log('\n👉 Ábrelo en tu navegador para ver la tabla completa con buscador.\n');
