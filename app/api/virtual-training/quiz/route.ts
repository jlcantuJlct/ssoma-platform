export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        // answers es un objeto { questionId: optionId }
        const { trainingId, userName, answers } = await req.json();

        if (!trainingId || !userName || !answers) {
            return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
        }

        // Obtener las respuestas correctas de la base de datos
        const options = await db.fetchAll('SELECT o.* FROM virtual_training_options o JOIN virtual_training_questions q ON o.question_id = q.id WHERE q.training_id = ?', [trainingId]);

        let correctCount = 0;
        const totalQuestions = 20;

        // Evaluamos las respuestas
        for (const [qId, optId] of Object.entries(answers)) {
            const correctOpt = options.find((o: any) => o.question_id == qId && o.is_correct == true || o.is_correct == 1);
            if (correctOpt && correctOpt.id == optId) {
                correctCount++;
            }
        }

        // Calcular la nota sobre 20
        // Ahora el examen presenta exactamente 10 preguntas. Cada una vale 2 puntos.
        let score = correctCount * 2;
        const passed = score >= 16;

        // Guardar el resultado
        await db.execute(
            'INSERT INTO virtual_training_results (training_id, user_name, score, passed, selected_options) VALUES (?, ?, ?, ?, ?)',
            [trainingId, userName, score, passed ? 1 : 0, JSON.stringify(answers)]
        );

        return NextResponse.json({ success: true, score, passed });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
