import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Activity, MONTHS } from './types';
import { categorizeActivitiesByObjective } from './objective-categorization';

export function exportToPDF(activities: Activity[]) {
    // Usar formato A3 landscape para mayor espacio, o A4 con fuente muy pequeña.
    // El usuario quiere DETALLE COMPLETO. A3 es más seguro para 12 meses x 2 datos.
    const doc = new jsPDF('l', 'mm', 'a3');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Header
    doc.setFillColor(30, 41, 59); // Slate 900
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text('PROGRAMA ANUAL DE SSOMA 2025', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 20, { align: 'center' });

    let y = 35;

    // Table Header function
    const printTableHeader = (yPos: number) => {
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");

        let x = margin + 5;
        // Col: Actividad
        doc.text("ACTIVIDAD", x, yPos + 7);
        x += 100; // Ancho actividad

        // Col: Meta/Frec/Resp
        doc.text("META / FREC", x, yPos + 7);
        x += 35;

        // Cols: Meses
        const monthWidth = 18;
        MONTHS.forEach(m => {
            doc.text(m.substring(0, 3).toUpperCase(), x + (monthWidth / 2), yPos + 5, { align: 'center' });
            // Subheaders P/E
            doc.setFontSize(6);
            doc.text("P   |   E", x + (monthWidth / 2), yPos + 9, { align: 'center' });
            doc.setFontSize(8);
            x += monthWidth;
        });

        // Col: Total
        x += 5;
        doc.text("TOTAL P/E", x, yPos + 7);
        x += 25;
        doc.text("%", x, yPos + 7);
    };

    // Categorizar actividades
    const objectives = categorizeActivitiesByObjective(activities);

    objectives.forEach(obj => {
        // Verificar espacio para título de grupo y header (aprox 30mm)
        if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
        }

        // Título de Sección (Objetivo)
        doc.setFillColor(16, 185, 129); // Emerald 500
        doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(obj.title, margin + 5, y + 5.5);
        y += 8;

        // Imprimir Header de Tabla debajo de cada objetivo
        printTableHeader(y);
        y += 12;

        obj.activities.forEach(activity => {
            // Calcular altura necesaria (puede variar por nombre largo)
            const actNameLines = doc.splitTextToSize(activity.name, 95);
            const rowHeight = Math.max(10, actNameLines.length * 4 + 4);

            if (y > pageHeight - rowHeight - 10) {
                doc.addPage();
                y = 20;
                printTableHeader(y);
                y += 12;
            }

            // Filas alternas
            doc.setFillColor(255, 255, 255);
            // doc.rect(margin, y, pageWidth - (margin*2), rowHeight, 'F'); // Opcional background

            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);

            // Actividad Name
            let x = margin + 5;
            doc.text(actNameLines, x, y + 4);
            x += 100;

            // Meta / Frecuencia
            doc.setFontSize(7);
            doc.text(`${activity.target} / ${activity.frequency}`, x, y + 4);
            doc.text(activity.responsible || 'Resp.', x, y + 8);
            x += 35;

            // Meses Data
            const monthWidth = 18;
            activity.data.plan.forEach((plan, idx) => {
                const exec = activity.data.executed[idx];

                // Fondo si hay plan o ejecución
                if (plan > 0 || exec > 0) {
                    doc.setFillColor(plan > 0 ? 240 : 255, plan > 0 ? 253 : 255, plan > 0 ? 244 : 255); // Light green bg if planned
                    doc.roundedRect(x + 2, y + 1, monthWidth - 4, rowHeight - 2, 1, 1, 'F');
                }

                doc.setTextColor(100, 116, 139); // Slate 500
                doc.setFont("helvetica", "bold");
                doc.text(plan.toString(), x + 4, y + 5); // Plan

                doc.setTextColor(exec > 0 ? 16 : 148, exec > 0 ? 185 : 163, exec > 0 ? 129 : 184); // Emerald 500 if >0 else Slate 400
                doc.text(exec.toString(), x + 12, y + 5); // Executed

                x += monthWidth;
            });

            // Totals
            x += 5;
            const totalPlan = activity.data.plan.reduce((a, b) => a + b, 0);
            const totalExec = activity.data.executed.reduce((a, b) => a + b, 0);
            const percent = totalPlan > 0 ? Math.round((totalExec / totalPlan) * 100) : 0;

            doc.setTextColor(30, 41, 59);
            doc.text(`${totalPlan} / ${totalExec}`, x, y + 5);
            x += 25;

            // Percent Badge
            if (percent > 0) {
                doc.setFillColor(percent >= 100 ? 22 : 245, percent >= 100 ? 163 : 158, percent >= 100 ? 74 : 11);
                doc.setTextColor(percent >= 100 ? 255 : 120, percent >= 100 ? 255 : 60, percent >= 100 ? 255 : 30);
                // Simple text for PDF simplicity
            }
            doc.text(`${percent}%`, x, y + 5);


            // Line separator
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

            y += rowHeight;
        });

        y += 5; // Espacio entre grupos
    });

    doc.save(`Programa_Anual_SSOMA_2025.pdf`);
}

export function exportToExcel(activities: Activity[]) {
    const objectives = categorizeActivitiesByObjective(activities);
    const flatData: any[] = [];

    objectives.forEach(obj => {
        // Separador de objetivo
        flatData.push({
            'ACTIVIDAD': obj.title.toUpperCase(),
            'META': '', 'FRECUENCIA': '', 'RESPONSABLE': '',
            'ENE (P)': '', 'ENE (E)': '',
            'FEB (P)': '', 'FEB (E)': '',
            'MAR (P)': '', 'MAR (E)': '',
            'ABR (P)': '', 'ABR (E)': '',
            'MAY (P)': '', 'MAY (E)': '',
            'JUN (P)': '', 'JUN (E)': '',
            'JUL (P)': '', 'JUL (E)': '',
            'AGO (P)': '', 'AGO (E)': '',
            'SET (P)': '', 'SET (E)': '',
            'OCT (P)': '', 'OCT (E)': '',
            'NOV (P)': '', 'NOV (E)': '',
            'DIC (P)': '', 'DIC (E)': '',
            'TOTAL PLAN': '', 'TOTAL EJEC': '', '% CUMP': ''
        });

        obj.activities.forEach(a => {
            const row: any = {
                'ACTIVIDAD': a.name,
                'META': a.target,
                'FRECUENCIA': a.frequency,
                'RESPONSABLE': a.responsible
            };

            let totalP = 0;
            let totalE = 0;

            MONTHS.forEach((m, idx) => {
                const monthKey = m.substring(0, 3).toUpperCase();
                row[`${monthKey} (P)`] = a.data.plan[idx];
                row[`${monthKey} (E)`] = a.data.executed[idx];
                totalP += a.data.plan[idx];
                totalE += a.data.executed[idx];
            });

            row['TOTAL PLAN'] = totalP;
            row['TOTAL EJEC'] = totalE;
            row['% CUMP'] = totalP > 0 ? `${Math.round((totalE / totalP) * 100)}%` : '0%';

            flatData.push(row);
        });
    });

    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Programa SSOMA 2025");
    XLSX.writeFile(wb, `Programa_Anual_SSOMA_2025.xlsx`);
}
