export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { fetchMonthlyReportData } from '@/lib/reportDataFetch';
import { generateWordFromTemplate } from '@/lib/wordTemplateGenerator';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

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
            stats: data.stats,
            photos: [] 
        };

        const groupedPhotos: Record<string, any[]> = {};

        // Pre-cargar todos los datos para evitar problemas de asincronía en el template
        data.evidence.forEach(e => {
            const photoItem = {
                url: e.file_url,
                description: e.description || '',
                date: e.date || '',
                zona: e.zona || ''
            };
            
            // Agregar al arreglo general
            templateData.photos.push(photoItem);

            // Agrupar por tags
            const activityTag = normalizeTag(e.activity || 'general');
            if(!groupedPhotos[activityTag]) groupedPhotos[activityTag] = [];
            groupedPhotos[activityTag].push(photoItem);

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

        console.log("Datos de plantilla preparados.");

        // ESPECIAL: Si es San Clemente, usamos el Procesador Inteligente de Python
        if (location.toUpperCase() === 'SAN CLEMENTE') {
            console.log("Utilizando Procesador Inteligente de Python para San Clemente...");
            
            const templatePath = path.resolve(process.cwd(), 'public/templates/Plantilla_PMA_SanClemente.docx');
            const outputPath = path.resolve(process.cwd(), `public/templates/TEMP_REPORT_${Date.now()}.docx`);
            const dataString = JSON.stringify(data);
            const scriptPath = path.resolve(process.cwd(), 'lib/report_processor.py');

            // Ejecutar el script de Python
            // Comandos: python script_path template_path output_path data_json
            const command = `python "${scriptPath}" "${templatePath}" "${outputPath}" '${dataString.replace(/'/g, "'\\''")}'`;
            
            try {
                await execPromise(command);
                const buffer = fs.readFileSync(outputPath);
                
                // Limpiar archivo temporal
                fs.unlinkSync(outputPath);

                return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'Content-Disposition': `attachment; filename="Informe_PMA_San_Clemente_${data.monthName}_${year}.docx"`,
                    },
                });
            } catch (pyError: any) {
                console.error("Error en el procesador de Python:", pyError);
                throw new Error(`Error en el motor de Python: ${pyError.message}`);
            }
        }

        // Caso General: Usar docxtemplater estándar
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
            error: error.message || 'Failed to generate word report', 
            details: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
}
