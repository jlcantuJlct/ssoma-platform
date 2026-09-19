/**
 * Genera un PDF de inspección de Botiquín usando jspdf-autotable.
 * Devuelve el base64 del PDF listo para adjuntar en un correo.
 */
export async function generateBotiquinPDF(params: {
    proyecto: string;
    fecha: string;
    hora: string;
    inspector: string;
    cargo: string;
    responsable: string;
    ubicacion: string;
    isPlanificada: boolean;
    isNoPlanificada: boolean;
    items: { id: number; name: string; qty: string; status: 'C' | 'NC' | 'N/A' | null }[];
    observaciones: string;
    moduleName?: string;
}): Promise<string> {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;

    // ---- HEADER ----
    doc.setFillColor(31, 41, 80);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('INSPECCIÓN DE BOTIQUÍN', pageW / 2, 11, { align: 'center' });

    // ---- DATOS GENERALES ----
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let y = 24;

    const labelW = 42;
    const valueW = 70;
    const col2X = margin + labelW + valueW + 5;

    const drawField = (label: string, value: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, yy);
        doc.setFont('helvetica', 'normal');
        doc.text(value || '—', x + labelW, yy, { maxWidth: valueW });
    };

    drawField('Proyecto:', params.proyecto, margin, y);
    drawField('Fecha:', params.fecha, col2X, y);
    y += 6;
    drawField('Inspector:', params.inspector, margin, y);
    drawField('Hora:', params.hora, col2X, y);
    y += 6;
    drawField('Cargo:', params.cargo, margin, y);
    drawField('Responsable:', params.responsable, col2X, y);
    y += 6;
    drawField('Ubicación:', params.ubicacion, margin, y);
    const tipoInsp = params.isPlanificada ? 'Planificada' : params.isNoPlanificada ? 'No Planificada' : '—';
    drawField('Tipo Inspección:', tipoInsp, col2X, y);
    y += 8;

    // ---- TABLA DE ÍTEMS ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 80);
    doc.text('VERIFICACIÓN DE INSUMOS DEL BOTIQUÍN', margin, y);
    y += 4;

    const tableBody = params.items.map((item) => [
        item.id.toString(),
        item.name,
        item.qty,
        item.status === 'C' ? '✓' : '',
        item.status === 'NC' ? '✗' : '',
        item.status === 'N/A' ? '—' : '',
    ]);

    autoTable(doc, {
        startY: y,
        head: [['#', 'Ítem', 'Cant.', 'C', 'NC', 'N/A']],
        body: tableBody,
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [31, 41, 80], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 105 },
            2: { cellWidth: 14, halign: 'center' },
            3: { cellWidth: 10, halign: 'center', textColor: [20, 150, 70] },
            4: { cellWidth: 10, halign: 'center', textColor: [200, 30, 30] },
            5: { cellWidth: 10, halign: 'center', textColor: [100, 100, 100] },
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didDrawPage: (data: any) => {
            // Footer on each page
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(
                `SSOMA Platform — Generado el ${new Date().toLocaleDateString('es-PE')} — Página ${data.pageNumber}`,
                pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' }
            );
        }
    });

    const finalY: number = (doc as any).lastAutoTable?.finalY ?? 150;

    // ---- OBSERVACIONES ----
    if (params.observaciones && params.observaciones.trim()) {
        let obsY = finalY + 8;
        if (obsY > 260) { doc.addPage(); obsY = 20; }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(31, 41, 80);
        doc.text('OBSERVACIONES', margin, obsY);
        obsY += 4;

        doc.setFillColor(255, 243, 205);
        doc.setDrawColor(200, 160, 0);
        const obsLines = doc.splitTextToSize(params.observaciones, pageW - margin * 2 - 4);
        const obsHeight = obsLines.length * 4.5 + 6;
        doc.roundedRect(margin, obsY, pageW - margin * 2, obsHeight, 2, 2, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 60, 0);
        doc.text(obsLines, margin + 2, obsY + 5);
    }

    // Return as base64
    const pdfBase64 = doc.output('datauristring');
    return pdfBase64;
}
