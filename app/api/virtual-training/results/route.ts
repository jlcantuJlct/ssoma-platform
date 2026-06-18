export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const trainingId = searchParams.get('trainingId');
        const userName = searchParams.get('userName');

        let query = `
            SELECT r.*, t.title as training_title 
            FROM virtual_training_results r 
            JOIN virtual_trainings t ON r.training_id = t.id 
            WHERE 1=1
        `;
        let params: any[] = [];

        if (trainingId) {
            query += ` AND r.training_id = ?`;
            params.push(trainingId);
        }

        if (userName) {
            query += ` AND r.user_name = ?`;
            params.push(userName);
        }

        query += ` ORDER BY r.id DESC`;

        const results = await db.fetchAll(query, params);
        
        // Formatear parseando los JSON
        const parsedResults = results.map((r: any) => ({
            ...r,
            selected_options: r.selected_options ? JSON.parse(r.selected_options) : {}
        }));

        return NextResponse.json({ success: true, results: parsedResults });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
