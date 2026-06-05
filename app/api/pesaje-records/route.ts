export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// URL del Puente Apps Script (el mismo que usa el resto de la plataforma)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzUxEDgad2mc2tfsWwfAlh4RHa0QKA_mJLcUN7AEe1jjEKOznkZ1myAIHe79zhxUB4/exec";
const BACKUP_FOLDER = "BACKUPS/Pesaje de Residuos";
const BACKUP_FILE   = "pesaje_records_backup.csv";

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pesaje_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            waste_type VARCHAR(100),
            weight REAL,
            location VARCHAR(200),
            category VARCHAR(50),
            files JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// ── BACKUP AUTOMÁTICO A GOOGLE DRIVE ────────────────────────────────────────
// Genera un CSV con TODOS los registros y lo sube a Drive.
// Se llama en background después de cada CREATE / UPDATE / DELETE.
async function backupToDrive() {
    try {
        // 1. Leer todos los registros actuales
        const rows = await db.fetchAll(
            'SELECT id, date, waste_type, weight, location, category, created_at FROM pesaje_records ORDER BY date DESC, id DESC'
        );

        // 2. Construir CSV
        const header = 'ID,Fecha,Tipo de Residuo,Peso,Ubicacion,Categoria,Creado\n';
        const csvBody = rows.map((r: any) =>
            `${r.id},"${r.date}","${r.waste_type}",${r.weight},"${r.location}","${r.category}","${r.created_at || ''}"`
        ).join('\n');
        const csv = header + csvBody;

        // 3. Convertir a Base64
        const base64 = Buffer.from(csv, 'utf-8').toString('base64');

        // 4. Subir a Drive vía Apps Script Bridge
        const payload = {
            filename:   BACKUP_FILE,
            mimetype:   'text/csv',
            fileBase64: base64,
            folderId:   '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5',  // Raíz del Drive SIG CASA
            folderPath: BACKUP_FOLDER,
            folderName: BACKUP_FOLDER,
            overwrite:  true   // Sobreescribir el mismo archivo para no acumular versiones
        };

        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        const text = await res.text();
        const data = JSON.parse(text);

        if (data.result === 'success') {
            console.log(`✅ Backup Pesaje → Drive: ${data.viewLink || data.url}`);
        } else {
            console.error('⚠️ Backup Drive falló (no crítico):', data.error);
        }
    } catch (e: any) {
        // El backup NO debe detener la operación principal
        console.error('⚠️ Error en backup Drive (no crítico):', e.message);
    }
}
// ────────────────────────────────────────────────────────────────────────────

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM pesaje_records ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            wasteType: r.waste_type,
            weight: Number(r.weight),
            location: r.location,
            category: r.category,
            files: r.files ? (typeof r.files === 'string' ? JSON.parse(r.files) : r.files) : []
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching pesaje records:', error);
        return NextResponse.json({ success: false, error: error.message, records: [] }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // MODO ACCION (Delta Sync)
        if (body.action) {
            if (body.action === 'CREATE') {
                const r = body.record;
                if (!r) throw new Error('Falta el record para CREATE');

                const res = await db.execute(
                    `INSERT INTO pesaje_records (date, waste_type, weight, location, category, files)
                     VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
                    [
                        r.date || '',
                        r.wasteType || '',
                        Number(r.weight) || 0,
                        r.location || '',
                        r.category || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                const newId = res.rows?.[0]?.id || res.rows?.[0]?.lastInsertRowid;

                // Backup en background (no bloquea la respuesta)
                backupToDrive();

                return NextResponse.json({ success: true, id: newId });
            }

            if (body.action === 'UPDATE') {
                const r = body.record;
                if (!r || !r.id) throw new Error('Falta el record o su ID para UPDATE');

                await db.execute(
                    `UPDATE pesaje_records 
                     SET date = ?, waste_type = ?, weight = ?, location = ?, category = ?, files = ?
                     WHERE id = ?`,
                    [
                        r.date || '',
                        r.wasteType || '',
                        Number(r.weight) || 0,
                        r.location || '',
                        r.category || '',
                        JSON.stringify(r.files || []),
                        r.id
                    ]
                );

                // Backup en background
                backupToDrive();

                return NextResponse.json({ success: true });
            }

            if (body.action === 'DELETE') {
                const id = body.id || (body.record && body.record.id);
                if (!id) throw new Error('Falta el ID para DELETE');
                await db.execute('DELETE FROM pesaje_records WHERE id = ?', [id]);

                // Backup en background
                backupToDrive();

                return NextResponse.json({ success: true });
            }
        }

        // MODO ARRAY (bulk upload)
        if (body.records && Array.isArray(body.records)) {
            let count = 0;
            for (const r of body.records) {
                await db.execute(
                    `INSERT INTO pesaje_records (date, waste_type, weight, location, category, files)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.wasteType || '',
                        Number(r.weight) || 0,
                        r.location || '',
                        r.category || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                count++;
            }

            // Backup tras carga masiva
            backupToDrive();

            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    } catch (error: any) {
        console.error('Error saving pesaje records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
