import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || '1'); // 1-12
    const location = searchParams.get('location') || 'SAN CLEMENTE';
    
    let fileName = 'F-SIG-011 Estadisticas de SST SC V05 15.07.21.xlsx';
    if (location.toUpperCase().includes('JAHUAY')) {
        fileName = 'F-SIG-011 Estadisticas de SST Jahuay V05 15.07.21.xlsx';
    } else if (location.toUpperCase().includes('MP')) {
        fileName = 'F-SIG-011 Estadisticas de SST MP ST6 V05 15.07.21.xlsx';
    }

    const baseDir = 'C:\\Users\\jlcan\\Desktop\\CASA 2026\\SGSST CASA 2026\\Estadisticas 2026';
    const filePath = path.join(baseDir, fileName);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ success: false, error: `File not found: ${fileName}` }, { status: 404 });
    }

    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Helper to get stats for a specific month column index
        const getStatsForCol = (colIdx: number) => {
            const getVal = (rowIdx: number) => {
                const val = data[rowIdx]?.[colIdx];
                return typeof val === 'number' ? val : 0;
            };

            return {
                EO: getVal(9),
                EP: getVal(10),
                T: getVal(11),
                HHT: getVal(13),
                AL: getVal(14),
                ATT: getVal(18),
                APP: getVal(19),
                ATP: getVal(20),
                AM: getVal(21),
                TDP: getVal(23),
            };
        };

        // Current month stats
        const currentStats = getStatsForCol(month + 2);

        // Full year stats (Jan to Dec columns 3 to 14)
        const fullYear: Record<string, any> = {};
        for (let i = 1; i <= 12; i++) {
            fullYear[i] = getStatsForCol(i + 2);
        }

        // Totals (Column 15)
        const totals = getStatsForCol(15);

        // Metadata (Project, responsible, etc.)
        const metadata = {
            project: data[4]?.[1] || 'Obras Adicionales',
            responsible: data[6]?.[7] || 'Jose Luis Cancino'
        };

        return NextResponse.json({ 
            success: true, 
            stats: currentStats, 
            fullYear,
            totals,
            metadata
        });

    } catch (e: any) {
        console.error('Excel extraction error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
