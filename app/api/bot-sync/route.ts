import { NextRequest, NextResponse } from 'next/server';
import { uploadToDrive } from '@/lib/googleDrive';
import db from '@/lib/db';

// Ensure tables exist before inserting
async function ensureTables() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS monthly_stats_records (
            id SERIAL PRIMARY KEY,
            month INTEGER,
            year INTEGER,
            location VARCHAR(100),
            stat_key VARCHAR(50),
            stat_value REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(month, year, location, stat_key)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS report_annexes (
            id SERIAL PRIMARY KEY,
            month INTEGER,
            year INTEGER,
            location VARCHAR(100),
            annex_id INTEGER,
            label VARCHAR(255),
            file_path TEXT,
            is_permanent BOOLEAN DEFAULT FALSE,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function POST(req: NextRequest) {
    try {
        await ensureTables();
        const body = await req.json();
        const { month, year, location = 'SAN CLEMENTE', stats, fileBase64, fileName } = body;

        console.log(`🤖 Iniciando Sincronización de Bot Local para mes ${month}/${year}`);

        if (!fileBase64 || !stats || isNaN(month) || isNaN(year)) {
            return NextResponse.json({ success: false, error: 'Parámetros faltantes en el payload' }, { status: 400 });
        }

        const parsedStats = typeof stats === 'string' ? JSON.parse(stats) : stats;

        // 1. Convertir Base64 a File para Drive
        const buffer = Buffer.from(fileBase64, 'base64');
        const file = new File([buffer], fileName || 'Anexo9_Estadisticas.pdf', { type: 'application/pdf' });

        // 2. Subir a Google Drive
        const targetFolder = 'AUTOMATIZACION_SSOMA/ANEXOS';
        const targetName = `Anexo09_SST_${location.replace(/\s+/g, '_')}_${month}_${year}.pdf`;
        
        console.log("Subiendo PDF a Drive...");
        const uploadResult = await uploadToDrive(file, targetFolder, targetName) as any;
        
        if (uploadResult.error) {
            throw new Error(`Upload to Drive failed: ${uploadResult.errorMessage}`);
        }

        const publicPath = uploadResult.url || uploadResult.downloadUrl;

        // 3. Guardar en Base de Datos: Anexo 9
        console.log("Guardando Anexo en Base de Datos...");
        await db.execute(
            'DELETE FROM report_annexes WHERE month = ? AND year = ? AND location = ? AND annex_id = 9',
            [month, year, location]
        );
        await db.execute(
            `INSERT INTO report_annexes (month, year, location, annex_id, label, file_path, is_permanent)
             VALUES (?, ?, ?, 9, 'ESTADISTICAS SSOMA', ?, FALSE)`,
            [month, year, location, publicPath]
        );

        // 4. Guardar en Base de Datos: KPIs Estadísticos
        console.log("Guardando Estadísticas en Base de Datos...");
        for (const [key, val] of Object.entries(parsedStats)) {
            const numericVal = Number(val);
            if (!isNaN(numericVal)) {
                await db.execute(
                    `INSERT INTO monthly_stats_records (month, year, location, stat_key, stat_value)
                     VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(month, year, location, stat_key) 
                     DO UPDATE SET stat_value = EXCLUDED.stat_value`,
                    [month, year, location, key, numericVal]
                );
            }
        }

        console.log("✅ Sincronización Bot exitosa!");
        return NextResponse.json({ success: true, message: 'Datos y Anexo sincronizados exitosamente', pdfUrl: publicPath });

    } catch (e: any) {
        console.error('❌ Bot Sync Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
