import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Este endpoint crea todas las tablas necesarias
export async function GET() {
    try {
        // Tabla para registros HHC
        await db.execute(`
            CREATE TABLE IF NOT EXISTS hhc_records (
                id SERIAL PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                hhc INTEGER DEFAULT 0,
                hht INTEGER DEFAULT 0,
                hombres INTEGER DEFAULT 0,
                mujeres INTEGER DEFAULT 0,
                area VARCHAR(50) DEFAULT 'seguridad',
                tipo VARCHAR(50) DEFAULT 'capacitacion',
                tema TEXT,
                responsable VARCHAR(100),
                evidence_imgs TEXT,
                evidence_pdf TEXT,
                lugar VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla para programa de formación
        await db.execute(`
            CREATE TABLE IF NOT EXISTS training_program (
                id SERIAL PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                tema TEXT,
                area VARCHAR(50) DEFAULT 'seguridad',
                tipo VARCHAR(50) DEFAULT 'capacitacion',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla para programa anual
        await db.execute(`
            CREATE TABLE IF NOT EXISTS annual_program (
                id SERIAL PRIMARY KEY,
                objective_id VARCHAR(20) NOT NULL,
                data_json TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla para inspecciones (sync)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS inspections_records (
                id SERIAL PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                responsable VARCHAR(100),
                area VARCHAR(50),
                zona VARCHAR(200),
                tipo VARCHAR(100),
                description TEXT,
                evidence_imgs TEXT,
                evidence_pdf TEXT,
                status VARCHAR(50) DEFAULT 'Pendiente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla para inspection_records (actions.ts)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS inspection_records (
                id BIGINT PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                responsible VARCHAR(100),
                inspection_type VARCHAR(200),
                area VARCHAR(50),
                zone VARCHAR(200),
                status VARCHAR(50) DEFAULT 'Pendiente',
                observations TEXT,
                evidence_pdf TEXT,
                evidence_imgs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla para monthly_program
        await db.execute(`
            CREATE TABLE IF NOT EXISTS monthly_program (
                id VARCHAR(100) PRIMARY KEY,
                month INTEGER,
                responsible VARCHAR(100),
                inspection_type VARCHAR(200),
                quantity INTEGER DEFAULT 1,
                area VARCHAR(50)
            )
        `);

        // Tabla para activities
        await db.execute(`
            CREATE TABLE IF NOT EXISTS activities (
                id VARCHAR(100) PRIMARY KEY,
                objective_id VARCHAR(50),
                name TEXT,
                responsible VARCHAR(100),
                frequency VARCHAR(50),
                public_target VARCHAR(50),
                area VARCHAR(50),
                item_number INTEGER
            )
        `);

        // Tabla para progress
        await db.execute(`
            CREATE TABLE IF NOT EXISTS progress (
                id VARCHAR(100) PRIMARY KEY,
                activity_id VARCHAR(100),
                month INTEGER,
                plan_value INTEGER DEFAULT 0,
                executed_value INTEGER DEFAULT 0
            )
        `);

        // Tabla para evidence
        await db.execute(`
            CREATE TABLE IF NOT EXISTS evidence (
                id VARCHAR(100) PRIMARY KEY,
                activity_id VARCHAR(100),
                month INTEGER,
                file_path TEXT,
                file_type VARCHAR(50)
            )
        `);

        return NextResponse.json({
            success: true,
            message: 'Todas las tablas creadas correctamente'
        });
    } catch (error: any) {
        console.error('Error creating tables:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
