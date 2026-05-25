export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS manifiesto_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            manifest_number VARCHAR(100),
            transport_company VARCHAR(200),
            waste_type VARCHAR(200),
            quantity VARCHAR(50),
            unit VARCHAR(20),
            location VARCHAR(200),
            files JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    try {
        await db.execute(`ALTER TABLE manifiesto_records ADD COLUMN items JSONB DEFAULT '[]'::jsonb;`);
    } catch(e) {}
    try {
        await db.execute(`ALTER TABLE manifiesto_records ADD COLUMN document_type VARCHAR(100) DEFAULT 'Manifiesto';`);
    } catch(e) {}
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM manifiesto_records ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            manifestNumber: r.manifest_number,
            transportCompany: r.transport_company,
            wasteType: r.waste_type,
            quantity: r.quantity,
            unit: r.unit,
            location: r.location,
            files: r.files ? (typeof r.files === 'string' ? JSON.parse(r.files) : r.files) : [],
            items: r.items ? (typeof r.items === 'string' ? JSON.parse(r.items) : r.items) : [],
            documentType: r.document_type || 'Manifiesto'
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching manifiesto records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // 1. MODO ACCION (Delta Sync)
        if (body.action) {
            if (body.action === 'CREATE') {
                const r = body.record;
                if (!r) throw new Error('Falta el record para CREATE');
                
                const legacyWaste = r.wasteType || (r.items && r.items[0]?.wasteType) || '';
                const legacyQty = r.quantity || (r.items && r.items[0]?.quantity) || '';
                const legacyUnit = r.unit || (r.items && r.items[0]?.unit) || 'kg';

                const res = await db.execute(
                    `INSERT INTO manifiesto_records (date, manifest_number, transport_company, waste_type, quantity, unit, location, files, items, document_type)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                    [
                        r.date || '',
                        r.manifestNumber || '',
                        r.transportCompany || '',
                        legacyWaste,
                        legacyQty,
                        legacyUnit,
                        r.location || '',
                        JSON.stringify(r.files || []),
                        JSON.stringify(r.items || []),
                        r.documentType || 'Manifiesto'
                    ]
                );
                const newId = res.rows?.[0]?.id;
                return NextResponse.json({ success: true, id: newId });
            }
            
            if (body.action === 'UPDATE') {
                const r = body.record;
                if (!r || !r.id) throw new Error('Falta el record o su ID para UPDATE');

                const legacyWaste = r.wasteType || (r.items && r.items[0]?.wasteType) || '';
                const legacyQty = r.quantity || (r.items && r.items[0]?.quantity) || '';
                const legacyUnit = r.unit || (r.items && r.items[0]?.unit) || 'kg';

                await db.execute(
                    `UPDATE manifiesto_records 
                     SET date = ?, manifest_number = ?, transport_company = ?, waste_type = ?, quantity = ?, unit = ?, location = ?, files = ?, items = ?, document_type = ?
                     WHERE id = ?`,
                    [
                        r.date || '',
                        r.manifestNumber || '',
                        r.transportCompany || '',
                        legacyWaste,
                        legacyQty,
                        legacyUnit,
                        r.location || '',
                        JSON.stringify(r.files || []),
                        JSON.stringify(r.items || []),
                        r.documentType || 'Manifiesto',
                        r.id
                    ]
                );
                return NextResponse.json({ success: true });
            }

            if (body.action === 'DELETE') {
                const id = body.id || (body.record && body.record.id);
                if (!id) throw new Error('Falta el ID para DELETE');
                await db.execute('DELETE FROM manifiesto_records WHERE id = ?', [id]);
                return NextResponse.json({ success: true });
            }
        }

        // 2. MODO ARRAY (reemplazo masivo por compatibilidad temporal)
        if (body.records && Array.isArray(body.records)) {
            await db.execute('TRUNCATE TABLE manifiesto_records RESTART IDENTITY');
            let count = 0;
            for (const r of body.records) {
                // Ensure legacy fields have something if they used items
                const legacyWaste = r.wasteType || (r.items && r.items[0]?.wasteType) || '';
                const legacyQty = r.quantity || (r.items && r.items[0]?.quantity) || '';
                const legacyUnit = r.unit || (r.items && r.items[0]?.unit) || 'kg';

                await db.execute(
                    `INSERT INTO manifiesto_records (date, manifest_number, transport_company, waste_type, quantity, unit, location, files, items, document_type)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.manifestNumber || '',
                        r.transportCompany || '',
                        legacyWaste,
                        legacyQty,
                        legacyUnit,
                        r.location || '',
                        JSON.stringify(r.files || []),
                        JSON.stringify(r.items || []),
                        r.documentType || 'Manifiesto'
                    ]
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    } catch (error: any) {
        console.error('Error saving manifiesto records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
