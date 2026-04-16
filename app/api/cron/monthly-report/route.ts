import { NextRequest, NextResponse } from 'next/server';
import { fetchMonthlyReportData } from '@/lib/reportDataFetch';
import { generateWordReport } from '@/lib/wordGenerator';
import fs from 'fs-extra';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        // 1. Authorization Check (Bearer token like the alerts cron)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'ssoma_cron_2026';
        
        // Allow manual trigger for testing if specific param is present
        const isManual = req.nextUrl.searchParams.get('manual') === 'true';
        
        if (!isManual && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Identify Period (April 2026)
        // We use America/Lima time
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed

        // 3. TARGET LOCATION: SAN CLEMENTE
        const location = "SAN CLEMENTE";

        console.log(`🤖 Iniciando generación automática de reporte: ${location} - ${month}/${year}`);

        // 4. Fetch Data
        const reportData = await fetchMonthlyReportData(month, year, location);

        // 5. Generate Word Buffer
        const buffer = await generateWordReport(reportData, true);

        if (!buffer) {
            throw new Error("No se pudo generar el buffer del reporte Word.");
        }

        // 6. SAVE TO DISK (User's Workspace folder 'Informe mesual')
        // We look for the main folder used by the user
        const DEST_ROOT = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/Informe mesual';
        
        // Ensure directory exists
        await fs.ensureDir(DEST_ROOT);

        const fileName = `INFORME_GESTIÓN_${location.replace(/\s+/g, '_')}_${reportData.monthName.toUpperCase()}_${year}.docx`;
        const finalPath = path.join(DEST_ROOT, fileName);

        await fs.writeFile(finalPath, buffer);

        console.log(`✅ Reporte generado y guardado en: ${finalPath}`);

        return NextResponse.json({
            success: true,
            message: `Reporte de ${location} para ${reportData.monthName} generado con éxito.`,
            path: finalPath,
            details: {
                inspections: reportData.stats.inspections,
                evidenceCount: reportData.evidence.length
            }
        });

    } catch (error: any) {
        console.error("❌ Error en Cron de Reporte Mensual:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
