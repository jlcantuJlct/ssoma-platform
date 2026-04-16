import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const month = req.nextUrl.searchParams.get('month'); // e.g., "ABRIL", "MARZO"
    const baseDir = 'C:\\Users\\jlcan\\Desktop\\CASA 2026\\CERT. BAÑOS';

    if (!month) {
        return NextResponse.json({ success: false, error: 'Month parameter is required' }, { status: 400 });
    }

    try {
        const targetDir = path.join(baseDir, month.toUpperCase());
        
        if (!fs.existsSync(targetDir)) {
            return NextResponse.json({ success: true, files: [], message: 'Directory not found for this month' });
        }

        const files = fs.readdirSync(targetDir);
        
        // Detailed filtering based on location requirements for San Clemente
        const filteredFiles = files.filter(file => {
            const up = file.toUpperCase();
            // Include if it mentions San Clemente, Pisco or Chancadora
            const isRelevant = up.includes('SAN CLEMENTE') || up.includes('PISCO') || up.includes('CHANCADORA');
            // Exclude Jahuay or Chinchaysuyo explicitly if they happen to overlap (though relevancy check might handle it)
            const isExcluded = up.includes('JAHUAY') || up.includes('CHINCHAYSUYO');
            
            return isRelevant && !isExcluded;
        }).map(file => ({
            name: file,
            path: path.join(targetDir, file),
            size: fs.statSync(path.join(targetDir, file)).size
        }));

        return NextResponse.json({
            success: true,
            files: filteredFiles
        });

    } catch (error: any) {
        console.error('Local Scan Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
