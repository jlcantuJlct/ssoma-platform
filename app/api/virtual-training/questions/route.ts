export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const trainingId = searchParams.get('trainingId');
        
        if (!trainingId) {
            return NextResponse.json({ success: false, error: 'trainingId requerido' }, { status: 400 });
        }

        const questions = await db.fetchAll('SELECT * FROM virtual_training_questions WHERE training_id = ?', [trainingId]);
        const options = await db.fetchAll('SELECT o.* FROM virtual_training_options o JOIN virtual_training_questions q ON o.question_id = q.id WHERE q.training_id = ?', [trainingId]);

        // Retornar las preguntas agrupadas
        const quiz = questions.map((q: any) => ({
            ...q,
            options: options.filter((o: any) => o.question_id === q.id).map((o: any) => ({
                id: o.id,
                option_text: o.option_text,
                // Ocultamos la respuesta correcta en la vista general (se validará en el servidor)
                is_correct: o.is_correct
            }))
        }));

        return NextResponse.json({ success: true, quiz });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { trainingId, questions } = await req.json();

        if (!trainingId || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
        }

        // Eliminar las existentes para sobreescribir (forma más simple)
        const existing = await db.fetchAll('SELECT id FROM virtual_training_questions WHERE training_id = ?', [trainingId]);
        for (const q of existing) {
            await db.execute('DELETE FROM virtual_training_options WHERE question_id = ?', [q.id]);
            await db.execute('DELETE FROM virtual_training_questions WHERE id = ?', [q.id]);
        }

        // Insertar nuevas
        for (const q of questions) {
            const qRes = await db.execute(
                'INSERT INTO virtual_training_questions (training_id, question_text) VALUES (?, ?)',
                [trainingId, q.question_text]
            );
            const questionId = qRes.rows?.[0]?.id || qRes.lastInsertRowid; // Depende si es sqlite o pg

            // Workaround sqlite vs pg id
            let finalQId = questionId;
            if (!finalQId) {
                const inserted = await db.fetchOne('SELECT id FROM virtual_training_questions WHERE training_id = ? ORDER BY id DESC LIMIT 1', [trainingId]);
                finalQId = inserted.id;
            }

            for (const o of q.options) {
                await db.execute(
                    'INSERT INTO virtual_training_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                    [finalQId, o.option_text, o.is_correct ? 1 : 0]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
