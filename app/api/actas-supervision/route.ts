export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';
import crypto from 'crypto';

// Crear tablas si no existen
async function ensureTables() {
    // Tabla de Actas (Cabecera)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS actas_supervision (
            id VARCHAR(50) PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            place VARCHAR(200),
            report_number VARCHAR(100) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla de Levantamientos (Detalle)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS actas_levantamiento (
            id VARCHAR(50) PRIMARY KEY,
            report_id VARCHAR(50),
            report_number VARCHAR(100),
            date VARCHAR(20) NOT NULL,
            place VARCHAR(200),
            responsible VARCHAR(100),
            lifting_number INT,
            evidence_img TEXT,
            evidence_pdf TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todos los registros
export async function GET() {
    try {
        await ensureTables();
        const actas = await db.fetchAll('SELECT * FROM actas_supervision ORDER BY date DESC, created_at DESC');
        const levantamientos = await db.fetchAll('SELECT * FROM actas_levantamiento ORDER BY date DESC, created_at DESC');

        return NextResponse.json({ 
            success: true, 
            actas, 
            levantamientos,
            records: levantamientos // Alias para compatibilidad con el Robot (descarga de evidencias)
        });
    } catch (error: any) {
        console.error('Error fetching Actas records:', error);
        return NextResponse.json({ success: true, actas: [], levantamientos: [] });
    }
}

// POST - Acciones CRUD
export async function POST(req: NextRequest) {
    try {
        await ensureTables();
        const body = await req.json();
        const { action, type, data, id, userName } = body;
        const actingUser = userName || 'Usuario';

        if (action === 'create') {
            const newId = crypto.randomUUID();
            if (type === 'acta') {
                await db.execute(
                    `INSERT INTO actas_supervision (id, date, place, report_number)
                     VALUES (?, ?, ?, ?)`,
                    [newId, data.date, data.place, data.reportNumber]
                );
                await logActivity(actingUser, `NUEVA ACTA SUPERVISIÓN: ${data.reportNumber}`, 'Actas', `Lugar: ${data.place}`);
            } else if (type === 'levantamiento') {
                await db.execute(
                    `INSERT INTO actas_levantamiento (id, report_number, date, place, responsible, lifting_number, evidence_img, evidence_pdf)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newId, 
                        data.reportNumber, 
                        data.date, 
                        data.place, 
                        data.responsible, 
                        data.liftingNumber, 
                        data.evidenceImg || '', 
                        data.evidencePdf || ''
                    ]
                );
                await logActivity(actingUser, `NUEVO LEVANTAMIENTO: ${data.reportNumber} - #${data.liftingNumber}`, 'Actas', `Responsable: ${data.responsible}`);
            }
            return NextResponse.json({ success: true, id: newId });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            
            if (type === 'acta') {
                await db.execute('DELETE FROM actas_supervision WHERE id=?', [id]);
                await logActivity(actingUser, `ELIMINACIÓN ACTA`, 'Actas', `ID: ${id}`);
            } else {
                await db.execute('DELETE FROM actas_levantamiento WHERE id=?', [id]);
                await logActivity(actingUser, `ELIMINACIÓN LEVANTAMIENTO`, 'Actas', `ID: ${id}`);
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error in Actas API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
