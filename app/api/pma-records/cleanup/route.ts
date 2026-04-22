import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        console.log('--- Cleaning PMA Duplicates (Postgres) ---');

        // Find duplicates grouping by all key fields
        const duplicates = await db.fetchAll(`
            SELECT date, responsible, category, location, images, COUNT(*) as count
            FROM pma_evidence_records
            GROUP BY date, responsible, category, location, images
            HAVING COUNT(*) > 1
        `);

        let deletedTotal = 0;
        const details = [];

        for (const dup of duplicates) {
            // Get all IDs for this duplicate group
            const allInstances = await db.fetchAll(`
                SELECT id FROM pma_evidence_records
                WHERE (date = ? OR (date IS NULL AND ? = ''))
                  AND (responsible = ? OR (responsible IS NULL AND ? = ''))
                  AND (category = ? OR (category IS NULL AND ? = ''))
                  AND (location = ? OR (location IS NULL AND ? = ''))
                  AND (images = ? OR (images IS NULL AND ? = ''))
                ORDER BY id DESC
            `, [
                dup.date, dup.date, 
                dup.responsible, dup.responsible, 
                dup.category, dup.category, 
                dup.location, dup.location, 
                dup.images, dup.images
            ]);

            // Keep the first one (most recent), delete the rest
            const idsToDelete = allInstances.slice(1).map(i => i.id);
            
            if (idsToDelete.length > 0) {
                // Delete one by one or using IN clause
                for (const id of idsToDelete) {
                    await db.execute('DELETE FROM pma_evidence_records WHERE id = ?', [id]);
                    deletedTotal++;
                }
                details.push({ group: `${dup.date} | ${dup.responsible}`, deleted: idsToDelete.length });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Cleanup complete. Deleted ${deletedTotal} records.`,
            details 
        });

    } catch (error: any) {
        console.error('Cleanup Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
