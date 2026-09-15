import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
                const file = formData.get('file') as File;
        const moduleName = formData.get('moduleName') as string;
        const authKey = formData.get('authKey') as string;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No se encontró el archivo Excel.' }, { status: 400 });
        }

        if (moduleName && moduleName.toLowerCase().includes('botiquin') && authKey !== '161976') {
            return NextResponse.json({ 
                success: false, 
                error: '🔒 Formato blindado: Se requiere la clave de autorización (161976) para refactorizar o alterar Botiquines.' 
            }, { status: 403 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Guardar el Excel físicamente si tenemos moduleName
        if (moduleName) {
            const fs = require('fs');
            const path = require('path');
            const dir = path.join(process.cwd(), 'public', 'templates', 'digital');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(path.join(dir, `${moduleName}.xlsx`), buffer);
        }

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

        // --- MOTOR DE ESCANEO UNIVERSAL ---
        // 1. Rastrear buscando patrones de encabezados típicos en formatos de seguridad
        const evalKeywords = ['OK', 'R', 'M', 'F', 'N/A', 'MALO', 'BUENO', 'SI', 'NO', 'C', 'NC', 'CUMPLE', 'OPERATIVO', 'INOPERATIVO', 'B', 'REGULAR'];
        
        worksheet.eachRow((row, rowNumber) => {
            const textValues: string[] = [];
            row.eachCell({ includeEmpty: false }, (cell) => {
                textValues.push(getSafeText(cell).toUpperCase());
            });
            
            // Contar cuántas columnas coinciden con palabras de evaluación (OK, Malo, Bueno, SI, NO, etc)
            const matchCount = textValues.filter(v => evalKeywords.includes(v)).length;
            const hasDescHeader = textValues.some(v => v.includes('ITEM') || v.includes('DESCRIPCI') || v.includes('INSPECC') || v.includes('DETALLE'));
            
            if (checklistStartRow === -1 && (matchCount >= 2 || (hasDescHeader && matchCount >= 1))) {
                checklistStartRow = rowNumber + 1; // Los ítems empiezan en la siguiente fila
                detectedHeaders = textValues.filter(v => v !== '');
            }
        });

        // FALLBACK UNIVERSAL: Si el formato es tan raro que no tiene las palabras típicas (Ej. Extintores horizontales)
        const isFallback = checklistStartRow === -1;
        if (isFallback) {
            checklistStartRow = 5;
        }

        // --- FASE PREVIA: EXTRAER METADATOS DE LA CABECERA ---
        // Extraemos campos típicos como Proyecto, Inspector, Ubicación, etc.
        const headerLimit = checklistStartRow !== -1 ? checklistStartRow : 15;
        for (let i = 1; i < headerLimit; i++) {
            const row = worksheet.getRow(i);
            row.eachCell((cell) => {
                let val = getSafeText(cell);
                if (val && val.length > 3 && val.length < 80) {
                    const lower = val.toLowerCase();
                    // Omitir campos estáticos que ya gestiona la plataforma
                    if (lower.includes('código') || lower.includes('versión') || lower === 'c' || lower === 'nc') {
                        return;
                    }
                    // Limpiar basura como "(Incluir firma)"
                    val = val.replace(/\(Incluir firma\)/gi, '').trim();
                    
                    // Si termina en ":" o es una etiqueta conocida
                    if (val.endsWith(':') || lower.includes('inspector') || lower.includes('responsable') || lower.includes('ubicación') || lower.includes('planificada') || lower === 'otro' || lower.includes('fecha') || lower.includes('cargo') || lower.includes('área de') || lower.includes('area de')) {
                        if (!detectedItems.includes(val)) {
                            detectedItems.push(val);
                        }
                    }
                }
            });
        }

        // 2. Extraer los ítems principales
        if (checklistStartRow !== -1) {
            for (let i = checklistStartRow; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);
                
                if (isFallback) {
                    // Modo aspiradora: Extraemos todas las celdas de texto de la fila (útil para formatos horizontales)
                    row.eachCell((cell) => {
                        const val = getSafeText(cell);
                        if (val.length > 3 && val.length < 50 && isNaN(Number(val))  ) {
                            if (!detectedItems.includes(val)) {
                                detectedItems.push(val);
                            }
                        }
                    });
                } else {
                    // Modo Vertical Clásico (Ej. Vehículos, Botiquines)
                    // Buscar la primera celda en las columnas 1 a 6 que tenga texto real descriptivo
                    let possibleItem = '';
                    let foundCol = -1;
                    for (let col = 1; col <= 6; col++) {
                        const val = getSafeText(row.getCell(col));
                        if (val && val.length > 4 && isNaN(Number(val))) {
                            possibleItem = val;
                            foundCol = col;
                            break;
                        }
                    }
                    
                    if (possibleItem.startsWith('(*) NOTA') || possibleItem.startsWith('NOTA:')) {
                        break;
                    }

                    if (possibleItem && possibleItem.length > 4 && possibleItem.length < 150 ) { 
                        // Buscar cantidad en las columnas inmediatas a la derecha
                        let possibleQuantity = '';
                        if (foundCol !== -1) {
                            for (let c = foundCol + 1; c <= foundCol + 5; c++) {
                                const qVal = getSafeText(row.getCell(c));
                                // Validar si es un número corto (Ej: "02", "1", "10")
                                if (qVal && qVal.length <= 3 && !isNaN(Number(qVal))) {
                                    possibleQuantity = qVal;
                                    break;
                                }
                            }
                        }

                        // Verificamos si ya existe el ítem (para no duplicar) comparando el texto
                        const exists = detectedItems.some((item: any) => typeof item === 'string' ? item === possibleItem : item.text === possibleItem);
                        if (!exists) {
                            if (possibleQuantity) {
                                detectedItems.push({ text: possibleItem, qty: possibleQuantity });
                            } else {
                                detectedItems.push(possibleItem);
                            }
                        }
                    }
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



