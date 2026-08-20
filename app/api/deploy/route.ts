import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
    // Solo permitir en entorno de desarrollo
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ success: false, error: 'Accion no permitida en produccion.' }, { status: 403 });
    }

    try {
        const { stdout, stderr } = await execPromise('git add . && git commit -m "Actualizacion rapida desde plataforma" && git push origin main');
        return NextResponse.json({ success: true, stdout, stderr });
    } catch (error: any) {
        // Puede fallar si no hay cambios (nothing to commit)
        if (error.stdout && error.stdout.includes('nothing to commit')) {
            return NextResponse.json({ success: true, message: 'No hay cambios nuevos para actualizar.' });
        }
        console.error('Error al actualizar en Vercel:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
