import { NextResponse } from 'next/server';
import { fetchMonthlyReportData } from '@/lib/reportDataFetch';
import { generateWordReport } from '@/lib/wordGenerator';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const location = searchParams.get('location') || 'SAN CLEMENTE';

    if (!month || !year) {
        return NextResponse.json({ error: 'Missing month or year' }, { status: 400 });
    }

    try {
        const data = await fetchMonthlyReportData(parseInt(month), parseInt(year), location);
        const buffer = await generateWordReport(data, true) as Buffer;
        
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Informe_Mensual_SSOMA_${data.monthName}_${year}.docx"`,
            },
        });
    } catch (error: any) {
        console.error("Export error:", error);
        return NextResponse.json({ error: 'Failed to generate word report', details: error.message }, { status: 500 });
    }
}
