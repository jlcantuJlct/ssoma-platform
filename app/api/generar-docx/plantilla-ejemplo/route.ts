import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export const dynamic = 'force-dynamic';

/**
 * GET /api/generar-docx/plantilla-ejemplo
 * Genera y devuelve un archivo .docx de plantilla de ejemplo
 * con etiquetas de texto e imagen predefinidas para SSOMA.
 */
export async function GET() {
    try {
        // Construimos el XML del documento Word desde cero usando el formato OOXML
        // Esta es una plantilla mínima funcional con etiquetas docxtemplater
        const docXml = buildDocumentXml();
        const relsXml = buildRelsXml();
        const contentTypesXml = buildContentTypesXml();
        const settingsXml = buildSettingsXml();
        const stylesXml = buildStylesXml();

        // Crear el ZIP (.docx)
        const zip = new PizZip();
        zip.folder('word');
        zip.folder('word/_rels');
        zip.folder('_rels');
        zip.folder('docProps');

        zip.file('[Content_Types].xml', contentTypesXml);
        zip.file('_rels/.rels', rootRels());
        zip.file('word/document.xml', docXml);
        zip.file('word/_rels/document.xml.rels', relsXml);
        zip.file('word/settings.xml', settingsXml);
        zip.file('word/styles.xml', stylesXml);

        const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="Plantilla_SSOMA_Ejemplo.docx"',
            },
        });
    } catch (e: any) {
        console.error('plantilla-ejemplo error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

function rootRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function buildRelsXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;
}

function buildContentTypesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;
}

function buildSettingsXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
</w:settings>`;
}

function buildStylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:pStyle w:val="Heading1"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="1F497D"/>
    </w:rPr>
  </w:style>
</w:styles>`;
}

function para(text: string, bold = false, size = '24', color = 'auto', center = false): string {
    const justification = center ? '<w:jc w:val="center"/>' : '';
    const boldTag = bold ? '<w:b/>' : '';
    return `<w:p>
      <w:pPr>${justification}</w:pPr>
      <w:r>
        <w:rPr>
          ${boldTag}
          <w:sz w:val="${size}"/>
          <w:color w:val="${color === 'auto' ? 'auto' : color}"/>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
}

function separator(): string {
    return `<w:p>
      <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr>
    </w:p>`;
}

function imageTag(tagName: string, label: string): string {
    return `<w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="22"/>
          <w:color w:val="555555"/>
        </w:rPr>
        <w:t xml:space="preserve">{%${tagName}}</w:t>
      </w:r>
    </w:p>
    ${para(label, false, '20', '888888', true)}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildDocumentXml(): string {
    const NS = 'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NS} mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14">
<w:body>

  ${para('INFORME SSOMA', true, '36', '1F497D', true)}
  ${para('Seguridad, Salud Ocupacional y Medio Ambiente', false, '24', '555555', true)}
  ${separator()}
  ${para('')}

  ${para('📋 INFORMACIÓN GENERAL', true, '28', '2E7D32')}
  ${para('Proyecto: {proyecto}', false, '24', 'auto')}
  ${para('Área / Zona: {area}', false, '24', 'auto')}
  ${para('Responsable: {responsable}', false, '24', 'auto')}
  ${para('Fecha: {fecha}', false, '24', 'auto')}
  ${para('Sede: {sede}', false, '24', 'auto')}
  ${para('')}

  ${separator()}
  ${para('')}

  ${para('📝 DESCRIPCIÓN DE LA ACTIVIDAD', true, '28', '2E7D32')}
  ${para('{descripcion}', false, '24', 'auto')}
  ${para('')}

  ${para('✅ ACCIONES CORRECTIVAS / SOLUCIÓN', true, '28', '2E7D32')}
  ${para('{solucion}', false, '24', 'auto')}
  ${para('')}

  ${separator()}
  ${para('')}

  ${para('📸 REGISTRO FOTOGRÁFICO', true, '28', '2E7D32')}
  ${para('')}

  ${para('Foto Antes:', true, '24', '444444')}
  ${imageTag('foto_antes', 'Fotografía del estado inicial')}
  ${para('')}

  ${para('Foto Después:', true, '24', '444444')}
  ${imageTag('foto_despues', 'Fotografía del estado final / solución')}
  ${para('')}

  ${para('Foto de Evidencia Adicional:', true, '24', '444444')}
  ${imageTag('foto_evidencia', 'Fotografía de evidencia complementaria')}
  ${para('')}

  ${separator()}
  ${para('')}

  ${para('📌 OBSERVACIONES', true, '28', '2E7D32')}
  ${para('{observaciones}', false, '24', 'auto')}
  ${para('')}

  ${para('Firma del Responsable: _______________________', false, '24', 'auto')}
  ${para('')}

  <w:sectPr>
    <w:pgSz w:w="12240" w:h="15840"/>
    <w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080"/>
  </w:sectPr>
</w:body>
</w:document>`;
}
