import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { POST as generateExcel } from '@/app/api/export-excel/route';

export const dynamic = 'force-dynamic';

// GET: datos públicos del hallazgo (acceso por token seguro, sin login)
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await ctx.params;
        const row: any = await db.fetchOne(
            `SELECT token, module_name, description, riesgo, categoria, responsable, responsable_email, fecha_prog, status, template_json, answers_json, hallazgo_index, comentario, closed_at, evidence, fotos_defectos_json, inspection_record_id
             FROM hallazgo_levantamientos WHERE token = ?`,
            [token]
        );
        if (!row) {
            return NextResponse.json({ success: false, error: 'Enlace inválido o expirado' }, { status: 404 });
        }

        // Recuperar la foto de evidencia inicial del hallazgo (solo si sigue abierto)
        let evidencia_inicial = '';
        try {
            if (row.template_json) {
                const template = JSON.parse(row.template_json);
                const answers = JSON.parse(row.answers_json);
                const idx = template.findIndex((t: any) => (t.text || '').trim() === 'Hallazgos:');
                if (idx !== -1 && answers[idx]) {
                    const hallazgos = JSON.parse(answers[idx].text || '[]');
                    evidencia_inicial = hallazgos[row.hallazgo_index]?.evidencia || '';
                }
            }
        } catch (e) {
            console.warn('No se pudo recuperar la evidencia inicial:', e);
        }

        let driveUrl = '';
        if (row.inspection_record_id) {
            try {
                const rec: any = await db.fetchOne('SELECT evidence_pdf FROM inspection_records WHERE id = ?', [row.inspection_record_id]);
                if (rec && rec.evidence_pdf) driveUrl = rec.evidence_pdf;
            } catch(e) {}
        }

        return NextResponse.json({
            success: true,
            finding: {
                moduleName: row.module_name,
                description: row.description,
                riesgo: row.riesgo,
                categoria: row.categoria,
                responsable: row.responsable,
                responsableEmail: row.responsable_email,
                fechaProg: row.fecha_prog,
                status: row.status,
                evidencia: evidencia_inicial,
                evidenciaLevantamiento: row.evidence || '',
                comentario: row.comentario || '',
                driveUrl: driveUrl,
                closedAt: row.closed_at || null,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// POST: el responsable levanta la observación (evidencia + comentario)
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await ctx.params;
        const { evidence, comentario } = await req.json();

        if (!evidence) {
            return NextResponse.json({ success: false, error: 'La evidencia fotográfica es obligatoria' }, { status: 400 });
        }

        const row: any = await db.fetchOne(
            'SELECT * FROM hallazgo_levantamientos WHERE token = ? AND status = ?',
            [token, 'Abierto']
        );
        if (!row) {
            return NextResponse.json({ success: false, error: 'Este hallazgo ya fue levantado o el enlace no es válido' }, { status: 404 });
        }

        // 1. Marcar el hallazgo como Cerrado en las respuestas guardadas
        const template = JSON.parse(row.template_json || '[]');
        const answers = JSON.parse(row.answers_json || '[]');
        const idx = template.findIndex((t: any) => (t.text || '').trim() === 'Hallazgos:');
        if (idx !== -1 && answers[idx]) {
            const hallazgos = JSON.parse(answers[idx].text || '[]');
            if (hallazgos[row.hallazgo_index]) {
                hallazgos[row.hallazgo_index].estado = 'Cerrado';
                hallazgos[row.hallazgo_index].evidenciaLevantamiento = evidence;
            }
            answers[idx].text = JSON.stringify(hallazgos);
        }

        // 2. Regenerar el Excel con la observación levantada y subirlo a Drive
        let driveUrl = '';
        try {
            const mockReq = new Request(new URL('/api/export-excel', req.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    moduleName: row.module_name, 
                    template, 
                    answers, 
                    saveToDrive: true,
                    fotosDefectos: row.fotos_defectos_json ? JSON.parse(row.fotos_defectos_json) : null,
                    evidenciaLevantamiento: evidence,
                    comentarioLevantamiento: comentario
                }),
            });
            const res = await generateExcel(mockReq);
            const data = await res.json();
            driveUrl = data.driveUrl || '';
        } catch (e) {
            console.error('Error regenerando Excel:', e);
        }

        // 2.5. Actualizar el registro de Control de Inspecciones con el nuevo enlace
        //      (el mismo registro pasa a apuntar al Excel actualizado con el levantamiento)
        if (row.inspection_record_id) {
            try {
                await db.execute(
                    'UPDATE inspection_records SET evidence_pdf = ? WHERE id = ?',
                    [driveUrl, row.inspection_record_id]
                );
            } catch (e) {
                console.error('Error actualizando registro de Control de Inspecciones:', e);
            }
        }

        // 3. Registrar el levantamiento en la base de datos
        await db.execute(
            'UPDATE hallazgo_levantamientos SET status = ?, evidence = ?, comentario = ?, closed_at = CURRENT_TIMESTAMP WHERE token = ?',
            ['Cerrado', evidence, comentario || '', token]
        );

        // 4. Notificar a SSOMA por correo
        try {
            const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
            if (smtpUser) {
                await fetch(new URL('/api/send-email', req.url), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: [smtpUser],
                        subject: `✅ Hallazgo levantado - ${row.module_name}`,
                        text: `El responsable ${row.responsable} levantó la observación:\n\n"${row.description}"\n\nComentario: ${comentario || '-'}\n\nReporte actualizado: ${driveUrl || 'Pendiente'}`,
                        html: `<p>El responsable <b>${row.responsable}</b> levantó la siguiente observación:</p><p style="background:#fef3c7;padding:12px;border-radius:8px;"><i>"${row.description}"</i></p><p><b>Comentario del responsable:</b> ${comentario || '-'}</p>${driveUrl ? `<p>📄 <a href="${driveUrl}" style="color:#1a73e8;font-weight:bold;">Ver reporte actualizado en Drive</a></p>` : ''}`,
                    }),
                });
            }
        } catch (e) {
            console.error('Error notificando a SSOMA:', e);
        }

        return NextResponse.json({ success: true, driveUrl });
    } catch (e: any) {
        console.error('Error en levantamiento:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}


