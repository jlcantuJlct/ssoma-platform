import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { moduleName, actionType, items, authKey } = body;
        
        if (moduleName && moduleName.toLowerCase().includes('botiquin') && authKey !== '161976') {
            return NextResponse.json({ 
                success: false, 
                error: '🔒 Formato blindado: Se requiere la clave de autorización (161976) para guardar cambios en Botiquines.' 
            }, { status: 403 });
        }
        
        // actionType = 'new' (V1) or 'update' (V2, V3...)
        const idConfig = process.env.POSTGRES_URL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS templates_config (
                id ${idConfig},
                module_name TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                items_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get current max version
        const vRes = await db.fetchOne("SELECT MAX(version) as max_v FROM templates_config WHERE module_name = ?", [moduleName]);
        const currentVersion = vRes?.max_v || 0;
        
        const newVersion = currentVersion + 1;
        
        await db.execute(
            "INSERT INTO templates_config (module_name, version, items_json) VALUES (?, ?, ?)",
            [moduleName, newVersion, JSON.stringify(items)]
        );

        // Activar el módulo en la tabla de módulos para que ya no salga "En Configuración"
        await db.execute(
            "UPDATE inspection_modules SET status = 'active' WHERE name = ?",
            [moduleName]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Configuración guardada exitosamente.',
            newVersion 
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
