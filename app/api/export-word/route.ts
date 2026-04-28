export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { fetchMonthlyReportData } from '@/lib/reportDataFetch';
import { generateWordFromTemplate } from '@/lib/wordTemplateGenerator';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const location = searchParams.get('location') || 'SAN CLEMENTE';

    if (!month || !year) {
        return NextResponse.json({ error: 'Missing month or year' }, { status: 400 });
    }

    try {
        const data = await fetchMonthlyReportData(parseInt(month), parseInt(year), location);
        
        // Función para normalizar nombres de actividades en etiquetas válidas de Word
        const normalizeTag = (str: string) => {
            return str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
                .replace(/[^a-z0-9]/g, '_') // Quitar caracteres especiales
                .replace(/_+/g, '_') // Evitar múltiples guiones bajos
                .replace(/^_|_$/g, ''); // Quitar guiones bajos en los bordes
        };

        const templateData: any = {
            MES_REPORTE: data.monthName.toUpperCase(),
            ANIO_REPORTE: parseInt(year),
            photos: [] // Sigue disponible por si quieren todas juntas
        };

        const groupedPhotos: Record<string, any[]> = {};

        data.evidence.forEach(e => {
            const photoItem = {
                url: e.file_url,
                description: e.description || '',
                date: e.date || ''
            };
            
            // Agregar al arreglo general de todas las fotos
            templateData.photos.push(photoItem);

            // Agregar a la categoría específica por ACTIVIDAD (Ej. {#banos_quimicos})
            const activityTag = normalizeTag(e.activity || 'general');
            if(!groupedPhotos[activityTag]) groupedPhotos[activityTag] = [];
            groupedPhotos[activityTag].push(photoItem);

            // Agregar a la categoría híper-específica por ACTIVIDAD + ZONA (Ej. {#banos_quimicos_pad_san_clemente})
            if (e.zona) {
                const specificTag = normalizeTag(`${e.activity}_${e.zona}`);
                if(!groupedPhotos[specificTag]) groupedPhotos[specificTag] = [];
                groupedPhotos[specificTag].push(photoItem);
            }
        });

        // Expandir las fotos agrupadas como variables nativas para la plantilla
        Object.keys(groupedPhotos).forEach(tag => {
            templateData[tag] = groupedPhotos[tag];
        });

        const buffer = await generateWordFromTemplate(templateData);
        
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Informe_Mensual_SSOMA_${data.monthName}_${year}.docx"`,
            },
        });
    } catch (error: any) {
        console.error("Export error:", error);
        return NextResponse.json({ 
            error: 'Failed to generate word report', 
            details: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
}
