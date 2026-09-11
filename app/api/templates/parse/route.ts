import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No se encontró el archivo Excel.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0]; // Usar la primera hoja por defecto
        
        let detectedItems: string[] = [];
        let detectedHeaders: string[] = [];
        let checklistStartRow = -1;

        // Función segura para extraer texto sin crashear por culpa de ExcelJS interno
        const getSafeText = (cell: ExcelJS.Cell | undefined): string => {
            if (!cell || cell.value === null || cell.value === undefined) return '';
            if (typeof cell.value === 'object') {
                if ((cell.value as any).richText) {
                    return (cell.value as any).richText.map((rt: any) => rt.text).join('').trim();
                }
                if ((cell.value as any).result !== undefined) {
                    return String((cell.value as any).result).trim();
                }
            }
            return String(cell.value).trim();
        };

        // --- MOTOR DE ESCANEO BÁSICO (MVP) ---
        // 1. Rastrear buscando patrones de encabezados típicos de inspección
        worksheet.eachRow((row, rowNumber) => {
            const textValues: string[] = [];
            row.eachCell({ includeEmpty: false }, (cell) => {
                textValues.push(getSafeText(cell).toUpperCase());
            });
            
            // Si la fila contiene OK y alguna otra (R, M, F, MALO, BUENO), y AÚN no hemos encontrado el encabezado
            if (checklistStartRow === -1 && textValues.includes('OK') && (textValues.includes('R') || textValues.includes('M') || textValues.includes('F') || textValues.includes('MALO') || textValues.includes('N/A'))) {
                checklistStartRow = rowNumber + 1; // Los ítems empiezan en la siguiente fila
                detectedHeaders = textValues.filter(v => v !== '');
            }
        });

        // 2. Extraer los ítems de la lista de chequeo si encontramos el encabezado
        if (checklistStartRow !== -1) {
            for (let i = checklistStartRow; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);
                // Asumimos que el ítem de inspección suele estar en las primeras 3 columnas y es un texto largo
                const possibleItem = getSafeText(row.getCell(1)) || getSafeText(row.getCell(2)) || getSafeText(row.getCell(3));
                
                // FRENOS DEL MOTOR: Si encontramos la palabra observaciones o notas al pie, nos detenemos.
                if (possibleItem.toUpperCase().includes('OBSERVACIONES') || possibleItem.startsWith('(*)')) {
                    break;
                }

                // Ignoramos celdas pequeñas (ej. solo números de enumeración) o celdas de firmas, o párrafos enormes
                if (possibleItem && possibleItem.length > 4 && possibleItem.length < 100 && !possibleItem.toLowerCase().includes('firma')) { 
                    detectedItems.push(possibleItem);
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                totalRows: worksheet.rowCount,
                detectedHeaders,
                detectedItemsCount: detectedItems.length,
                allItems: detectedItems,
                message: checklistStartRow !== -1 
                    ? `He detectado ${detectedItems.length} preguntas de inspección puras.`
                    : 'No encontré un formato de lista claro. El motor necesita entrenamiento para este diseño.'
            }
        });

    } catch (error: any) {
        console.error('Error parseando excel:', error);
        
        let errorMessage = 'Error interno procesando el archivo.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return NextResponse.json({ 
            success: false, 
            error: `Error interno: ${errorMessage}` 
        }, { status: 500 });
    }
}
