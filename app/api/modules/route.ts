import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const idConfig = process.env.POSTGRES_URL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        await db.execute(`
            CREATE TABLE IF NOT EXISTS inspection_modules (
                id ${idConfig},
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                icon TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if empty
        const countRes = await db.fetchOne("SELECT COUNT(*) as c FROM inspection_modules");
        if (Number(countRes.c) === 0) {
            await db.execute("INSERT INTO inspection_modules (name, description, icon, status) VALUES (?, ?, ?, ?)", 
                ['Vehículos y Equipos', 'Parte diario, lista de chequeo para volquetes, camionetas y maquinaria pesada.', 'truck', 'active']);
            await db.execute("INSERT INTO inspection_modules (name, description, icon, status) VALUES (?, ?, ?, ?)", 
                ['Extintores', 'Inspección mensual de equipos contra incendios.', 'extinguisher', 'coming_soon']);
            await db.execute("INSERT INTO inspection_modules (name, description, icon, status) VALUES (?, ?, ?, ?)", 
                ['Botiquines', 'Inspección de botiquines y primeros auxilios.', 'first-aid', 'coming_soon']);
        }
        
        const modules = await db.fetchAll("SELECT * FROM inspection_modules ORDER BY created_at ASC");
        return NextResponse.json({ success: true, modules });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, icon } = body;
        
        await db.execute("INSERT INTO inspection_modules (name, description, icon, status) VALUES (?, ?, ?, 'active')", [name, description, icon || 'file']);
        
        return NextResponse.json({ success: true, message: 'Módulo creado', module: { name, description, icon: icon || 'file', status: 'active' } });
    } catch(e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
