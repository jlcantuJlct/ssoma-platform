const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

const target1 = `        const row: any = await db.fetchOne(
            'SELECT * FROM hallazgo_levantamientos WHERE token = ? AND status = ?',
            [token, 'Abierto']
        );`;
const rep1 = `        const row: any = await db.fetchOne(
            'SELECT * FROM hallazgo_levantamientos WHERE token = ?',
            [token]
        );
        if (row && row.status === 'Cerrado') {
            return NextResponse.json({ success: false, error: 'Este hallazgo ya fue levantado en su totalidad' }, { status: 404 });
        }`;

c = c.replace(target1, rep1);

const target2 = `        // 1. Marcar el hallazgo como Cerrado en las respuestas guardadas`;
const rep2 = `        const lines = (row.description || '').split('\\n').filter((l: string) => l.trim().length > 0);
        let numRequired = lines.length;
        if (numRequired === 0) numRequired = 1;

        let numProvided = 1;
        if (numRequired > 1 && evidence.startsWith('{')) {
            try {
                const map = JSON.parse(evidence);
                // only count those with valid base64 strings
                numProvided = Object.values(map).filter((v: any) => v && v.length > 50).length;
            } catch(e){}
        }

        const isParcial = numProvided < numRequired;
        const finalStatus = isParcial ? 'Abierto' : 'Cerrado';
        
        // 1. Marcar el hallazgo como Cerrado en las respuestas guardadas`;

c = c.replace(target2, rep2);

const target3 = `        if (idx !== -1 && answers[idx]) {
            const hallazgos = JSON.parse(answers[idx].text || '[]');
            if (hallazgos[row.hallazgo_index]) {
                hallazgos[row.hallazgo_index].estado = 'Cerrado';
                hallazgos[row.hallazgo_index].evidenciaLevantamiento = evidence;
            }`;

const rep3 = `        if (idx !== -1 && answers[idx]) {
            const hallazgos = JSON.parse(answers[idx].text || '[]');
            if (hallazgos[row.hallazgo_index]) {
                hallazgos[row.hallazgo_index].estado = finalStatus;
                hallazgos[row.hallazgo_index].evidenciaLevantamiento = evidence;
            }`;

c = c.replace(target3, rep3);

const target4 = `        if (row.inspection_record_id) {
            try {
                await db.execute(
                    'UPDATE inspection_records SET evidence_pdf = ?, status = ? WHERE id = ?',
                    [driveUrl, 'Cerrado', row.inspection_record_id]
                );
            } catch (e) {
                console.error('Error actualizando registro de Control de Inspecciones:', e);
            }
        }

        // 3. Registrar el levantamiento en la base de datos
        await db.execute(
            'UPDATE hallazgo_levantamientos SET status = ?, evidence = ?, comentario = ?, closed_at = CURRENT_TIMESTAMP WHERE token = ?',
            ['Cerrado', evidence, comentario || '', token]
        );`;

const rep4 = `        if (row.inspection_record_id) {
            try {
                await db.execute(
                    'UPDATE inspection_records SET evidence_pdf = ?, status = ? WHERE id = ?',
                    [driveUrl, finalStatus, row.inspection_record_id]
                );
            } catch (e) {
                console.error('Error actualizando registro de Control de Inspecciones:', e);
            }
        }

        // 3. Registrar el levantamiento en la base de datos
        await db.execute(
            \`UPDATE hallazgo_levantamientos SET status = ?, evidence = ?, comentario = ?, closed_at = \${isParcial ? 'NULL' : 'CURRENT_TIMESTAMP'} WHERE token = ?\`,
            [finalStatus, evidence, comentario || '', token]
        );`;

c = c.replace(target4, rep4);

const target5 = `return NextResponse.json({ success: true, driveUrl });`;
const rep5 = `return NextResponse.json({ success: true, driveUrl, isParcial });`;

c = c.replace(target5, rep5);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Fixed route.ts for Levantamiento Parcial');
