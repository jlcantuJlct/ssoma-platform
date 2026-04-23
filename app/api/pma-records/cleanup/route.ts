import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        console.log('--- Cleaning PMA Duplicates (Fuzzy Logic) ---');

        // Fetch ALL records to deduplicate in JS for more flexibility
        const allRecords = await db.fetchAll('SELECT * FROM pma_evidence_records ORDER BY id DESC');
        
        const seenKeys = new Set();
        const idsToDelete = [];

        for (const r of allRecords) {
            // Robust key: Date + Responsible + Category + Location + Number of images
            let imagesCount = 0;
            try {
                const imgs = typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []);
                imagesCount = Array.isArray(imgs) ? imgs.length : 0;
            } catch (e) {
                imagesCount = 0;
            }

            const contentKey = `${r.date}|${r.responsible}|${r.category}|${r.location}|${imagesCount}`;
            
            if (seenKeys.has(contentKey)) {
                idsToDelete.push(r.id);
            } else {
                seenKeys.add(contentKey);
            }
        }

        let deletedTotal = 0;
        if (idsToDelete.length > 0) {
            for (const id of idsToDelete) {
                await db.execute('DELETE FROM pma_evidence_records WHERE id = ?', [id]);
                deletedTotal++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Cleanup complete. Deleted ${deletedTotal} duplicate records based on fuzzy matching.`,
            duplicatesDetected: idsToDelete.length
        });

    } catch (error: any) {
        console.error('Cleanup Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
