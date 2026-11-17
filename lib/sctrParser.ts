/**
 * Utilitarios para el parseo y extracción de datos de pólizas y nóminas SCTR.
 * Soporta múltiples formatos de aseguradoras (Mapfre, Rímac, La Positiva, Pacífico, etc.),
 * incluyendo layouts tabulares y órdenes inversos en streams de texto de PDF.js.
 */

export function smartSplit(text: string): string[] {
    if (!text) return [];

    let t = text;

    // Normalizar saltos de línea
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Separar encabezados de páginas repetidos (Mapfre y similares)
    t = t.replace(/Avenida 28 de Julio[^\n]*?(?:MP\/\d+\/\d+|PISCO|ASEGURADO\(S\)|normas complementarias\.?)\s*/gi, '\n');
    t = t.replace(/Avenida 28 de Julio[^\n]*?www\.mapfreperu\.com[^\n]*?(?:MP\/\d+\/\d+)?\s*/gi, '\n');
    t = t.replace(/(normas complementarias\.?|ASEGURADO\(S\)|RIESGO\/LOCAL\/OBRA\s*:\s*[A-Z\s]+)\s+(?=[A-ZÁÉÍÓÚÑa-záéíóúñ])/gi, '$1\n');

    // 2. Separar pies de página y notas del último asegurado
    t = t.replace(/(\b\d{1,4})\s+(Se expide la presente|La presente cobertura|NOTA\s*:|Puede verificar)/gi, '$1\n$2');

    // 3. Patrón Mapfre stream: [NOMBRE] [NUMERO DNI] [TIPO] [CORRELATIVO] seguido del siguiente asegurado
    // Ejemplo: "CANCHERO CONDOR JAIME JORGE 45566621 DNI 66 CANCINO TUEROS JOSE LUIS 22196407 DNI 67"
    // El corte de persona debe ser DESPUÉS de "DNI 66" y ANTES del siguiente nombre.
    t = t.replace(/(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{1,4})\s+(?=[A-ZÁÉÍÓÚÑa-záéíóúñ])/gi, '$1 $2\n');

    // 4. Patrón sin correlativo: [NOMBRE] [NUMERO DNI] [TIPO] seguido del siguiente asegurado
    // Ejemplo: "JUAN PEREZ 12345678 DNI PEDRO GOMEZ 87654321 DNI"
    t = t.replace(/(\d{7,15})\s+(DNI|CEX|PAS|RUC|CIP)\s+(?=[A-ZÁÉÍÓÚÑa-záéíóúñ])/gi, '$1 $2\n');

    // 5. Patrón estándar con correlativo al inicio: "1 DNI 12345678 NOMBRE" o "66 DNI 45566621 NOMBRE"
    t = t.replace(/\s+(\d{1,4})\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '\n$1 $2 $3');

    // 6. Patrón sin correlativo al inicio: "NOMBRE DNI 12345678" -> DNI precede al nombre del nuevo asegurado
    // Ejemplo: "... PEREZ DNI 12345678 GOMEZ ..."
    t = t.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ])\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '$1\n$2 $3');

    // 7. Patrón correlativo seguido de número y luego DNI: "1 12345678 DNI"
    t = t.replace(/\s+(\d{1,4})\s+(\d{7,15})\s+(DNI|CEX|PAS|RUC|CIP)/gi, '\n$1 $2 $3');

    return t.split('\n').map(l => l.trim()).filter(l => l.length > 2);
}

export function extractDni(line: string): string | null {
    if (!line) return null;

    let dni: string | null = null;

    // Buscar tipo de documento seguido del número (DNI 12345678)
    const docAfter = line.match(/(?:DNI|CEX|PAS|CIP|RUC|N°|Nro\.?)\s*(\d{7,10})\b/i);
    if (docAfter) {
        dni = docAfter[1];
    } else {
        // Buscar número seguido del tipo de documento (12345678 DNI)
        const docBefore = line.match(/\b(\d{7,10})\s*(?:DNI|CEX|PAS|CIP|RUC)/i);
        if (docBefore) {
            dni = docBefore[1];
        } else {
            // DNI peruano estándar de 8 dígitos
            const raw8 = line.match(/\b\d{8}\b/);
            if (raw8) {
                dni = raw8[0];
            } else {
                // 7 a 9 dígitos
                const rawDigits = line.match(/\b\d{7,9}\b/);
                if (rawDigits) {
                    dni = rawDigits[0];
                }
            }
        }
    }

    if (!dni) return null;

    // Filtrar números de constancia de Mapfre como MP/2026/13496326
    if (line.includes(`MP/2026/${dni}`) || line.includes(`MP/2025/${dni}`)) {
        return null;
    }

    // Normalizar DNIs de 7 dígitos anteponiendo 0 (estándar Reniec)
    if (dni.length === 7) {
        dni = dni.padStart(8, '0');
    }

    return dni;
}

export function extractWorkerName(line: string, dni?: string | null): string {
    if (!line) return '';

    let cleaned = line;
    
    // Remover encabezados y textos legales de pólizas
    cleaned = cleaned.replace(/Avenida 28 de Julio.*?www\.mapfreperu\.com.*?MP\/\d+\/\d+/gi, ' ');
    cleaned = cleaned.replace(/Avenida 28 de Julio.*?www\.mapfreperu\.com/gi, ' ');
    cleaned = cleaned.replace(/Ubicación del Riesgo\/Local\/Obra\s*:\s*[A-Z\s]+/gi, ' ');
    cleaned = cleaned.replace(/CONSTANCIA DE ASEGURAMIENTO.*?normas complementarias\.?/gi, ' ');
    cleaned = cleaned.replace(/Se expide la presente.*?Director Unidad de Riesgos del Trabajo/gi, ' ');
    cleaned = cleaned.replace(/La presente cobertura no ampara.*?trabajador\./gi, ' ');
    cleaned = cleaned.replace(/Se expide la presente.*$/gi, ' ');
    cleaned = cleaned.replace(/NOTA\s*:.*$/gi, ' ');

    // Remover patrones de correlativos y tipo de documento
    cleaned = cleaned.replace(/\b\d{7,10}\s+(?:DNI|CEX|PAS|CIP|RUC)\s+\d{1,4}\b/gi, ' ');
    cleaned = cleaned.replace(/\b\d{1,4}\s+(?:DNI|CEX|PAS|CIP|RUC)\s+\d{7,10}\b/gi, ' ');
    cleaned = cleaned.replace(/(?:DNI|CEX|PAS|CIP|RUC|N°|Nro\.?)\s*\d{7,10}\b/gi, ' ');
    cleaned = cleaned.replace(/\b\d{7,10}\s*(?:DNI|CEX|PAS|CIP|RUC)/gi, ' ');

    if (dni) {
        cleaned = cleaned.replace(new RegExp(`\\b${dni}\\b`, 'g'), ' ');
        if (dni.startsWith('0')) {
            cleaned = cleaned.replace(new RegExp(`\\b${dni.slice(1)}\\b`, 'g'), ' ');
        }
    }

    // Remover correlativos aislados (números solos)
    cleaned = cleaned.replace(/\b\d+\b/g, ' ');

    // Remover palabras clave de documentos y pólizas
    cleaned = cleaned.replace(/\b(DNI|CEX|PAS|CIP|RUC|NRO|CONSTANCIA|ASEGURADO|ASEGURADOS)\b/gi, ' ');

    // Remover caracteres no alfabéticos y normalizar espacios
    cleaned = cleaned.replace(/[^A-ZÁÉÍÓÚÑa-záéíóúñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.toUpperCase();
}

export function formatWorkerLine(line: string): string {
    const dni = extractDni(line);
    const name = extractWorkerName(line, dni);
    if (dni && name) {
        return `DNI ${dni} ${name}`;
    }
    return line.trim();
}
