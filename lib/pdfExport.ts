import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ColumnDef {
    header: string;
    dataKey: string;
}

export function exportTableToPDF(
    title: string,
    columns: ColumnDef[],
    data: any[],
    filename: string
) {
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add date generated
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);

    // Map data to match column dataKeys, ensuring strings
    const rows = data.map(item => {
        const row: any = {};
        columns.forEach(col => {
            const val = item[col.dataKey];
            row[col.dataKey] = val !== null && val !== undefined ? String(val) : '';
        });
        return row;
    });

    autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: rows.map(r => columns.map(c => r[c.dataKey])),
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] }, // slate-900
    });

    doc.save(filename);
}

export function exportRecordToPDF(
    title: string,
    record: Record<string, any>,
    filename: string
) {
    const doc = new jsPDF('portrait');
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add date generated
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);

    const body = Object.entries(record)
        .filter(([key]) => key !== 'id' && key !== 'files') // Exclude some internal fields
        .map(([key, value]) => [
            key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), // Simple formatting
            value !== null && value !== undefined ? String(value) : 'N/A'
        ]);

    autoTable(doc, {
        head: [['Campo', 'Valor']],
        body: body,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 }
        }
    });

    doc.save(filename);
}

export function generateRecordPDFBlobUrl(
    title: string,
    record: Record<string, any>,
    workspace?: string
): string {
    const doc = new jsPDF('portrait');
    
    // Cabecera estilizada
    doc.setFillColor(249, 115, 22); // Orange #f97316
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text("TARJETA DE OBSERVACIÓN PREVENTIVA (TOP / STOP)", 14, 11);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`CÓDIGO: F-SIG-060 | VERSIÓN: 01 | PROYECTO: ${(workspace || 'RED VIAL 6').toUpperCase()}`, 14, 18);

    const r = record;
    const dataRows = [
        ['N° Registro / ID', String(r.id || '')],
        ['Fecha del Reporte', String(r.date || 'N/A')],
        ['¿Quién Reporta? / Responsable', r.is_anonymous || r.responsible === 'ANÓNIMO' ? 'ANÓNIMO (Confidencial)' : String(r.responsible || 'N/A')],
        ['Ubicación del Evento', String(r.location || 'N/A')],
        ['Tipo de Observación', r.acto ? 'ACTO INSEGURO' : (r.condicion ? 'CONDICIÓN INSEGURA' : 'OBSERVACIÓN')],
        ['Clasificación Detallada', String(r.acto || r.condicion || 'N/A')],
        ['Persona Observada / Involucrada', String(r.persona_observada || 'No especificada')],
        ['Cantidad Observada', String(r.cantidad || 1)],
        ['Descripción Detallada', String(r.descripcion || 'Sin descripción adicional')],
        ['Acción Inmediata Correctiva', String(r.accion_inmediata || 'No registrada')]
    ];

    autoTable(doc, {
        startY: 30,
        head: [['Campo', 'Detalle de la Observación']],
        body: dataRows,
        theme: 'grid',
        styles: { fontSize: 9.5, cellPadding: 4, textColor: [30, 41, 59] },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 65, fillColor: [248, 250, 252] },
            1: { cellWidth: 120 }
        }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado automáticamente por Plataforma SSOMA - ${new Date().toLocaleString('es-PE')}`, 14, Math.min(finalY + 15, 285));

    return doc.output('bloburl').toString();
}
