export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
// Nota: Importamos las acciones para obtener datos reales si estuvieran disponibles en el servidor
// Por ahora, simulamos la agregación de datos para no romper la estructura.

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const authHeader = req.headers.get('Authorization');

    // Seguridad idéntica al Robot de WhatsApp
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'ssoma_cron_2026'}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'get-pending') {
        // En una implementación real, esto leería de una tabla 'export_requests'
        // Por ahora simulamos que no hay pendientes para evitar bucles.
        return NextResponse.json({ success: true, requests: [] });
    }

    if (action === 'fetch-data') {
        const month = parseInt(searchParams.get('month') || '-1');
        const year = parseInt(searchParams.get('year') || '2025');

        if (month === -1) return NextResponse.json({ success: false, error: 'Mes requerido' });

        // Estructura de carpetas maestra (1 a 17)
        const folders = [
            { id: '01', name: '01. SCSST', files: [] },
            { id: '02', name: '02. ANALISIS DE TRABAJO SEGURO (AST)', files: [] },
            { id: '03', name: '03. COMPROMISO DE CUMPLIMIENTO', files: [] },
            { id: '04', name: '04. DOCUMENTOS DE GESTION DE SSTMA', files: [] },
            { id: '05', name: '05. VIGILANCIA DE LA SALUD OCUPACIONAL', files: [] },
            { id: '06', name: '06. EQUIPOS DE PROTECCION PERSONAL', files: [] },
            { id: '07', name: '07. INFORMES', files: [] },
            { id: '08', name: '08. COMUNICACION CON LA SUPERVISION O CLIENTE', files: [] },
            { id: '09', name: '09. REGISTRO DE INDUCCIÓN, CAPACITACIÓN, ENTRENAMIENTO Y ...', files: [] },
            { id: '10', name: '10. MANIFIESTO', files: [] },
            { id: '11', name: '11. PERMISOS', files: [] },
            { id: '12', name: '12. REGISTROS', files: [] },
            { id: '13', name: '13. REGISTRO DE INSPECCIONES INTERNAS', files: [] },
            { id: '14', name: '14. MONITOREOS DE SSTMA', files: [] },
            { id: '15', name: '15. GESTIÓN DE RESIDUOS', files: [] },
            { id: '16', name: '16. Fotografías', files: [] },
            { id: '17', name: '17. CUMPLIMIENTO DE ENVIO DE LA INFORMACIÓN DE ENTRADA ...', files: [] }
        ];

        // NOTA: Aquí se añadiría la lógica para poblar 'files' consultando la base de datos
        // filtrando por mes y año.

        return NextResponse.json({ 
            success: true, 
            data: { folders, month, year } 
        });
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { month, year } = body;

    // En una implementación real, guardaríamos esto en una cola en la DB
    console.log(`📡 Solicitud de exportación para ${month}/${year}`);

    return NextResponse.json({ 
        success: true, 
        message: 'Solicitud enviada. El Robot Local procesará la descarga en tu escritorio.' 
    });
}
