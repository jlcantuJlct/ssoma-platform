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
