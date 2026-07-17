const fs = require('fs');

function getMatchesFromRecord(personnel_list, search) {
    if (!search || search.length < 3 || !personnel_list) return [];
    
    const normalize = (text) => 
        (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
    const target = normalize(search).trim();
    const targetWords = target.split(/\s+/).filter(w => w.length >= 2);
    
    if (targetWords.length === 0) return [];

    let rawLines = personnel_list.split('\n');
    const avgLen = personnel_list.length / Math.max(rawLines.length, 1);

    if (avgLen > 200) {
        const attemptA = personnel_list
            .replace(/\s+(\d{1,3})\s+(DNI|N°|Nro\.?|CIP|RUC|\d{7,9})/gi, '\n$1 $2')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 2);

        const attemptB = personnel_list
            .replace(/(DNI\s+\d{1,3})\s+(?=[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z])/g, '$1\n')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 2);

        const best = attemptA.length >= attemptB.length ? attemptA : attemptB;

        if (best.length > rawLines.length) {
            rawLines = best;
        }
    }

    const matches = [];
    for (const line of rawLines) {
        const normalizedLine = normalize(line);
        if (!normalizedLine.trim()) continue;

        if (/^\d+$/.test(target)) {
            const dniRegex = new RegExp(`(?<!\\d)${target}(?!\\d)`);
            if (dniRegex.test(normalizedLine)) {
                matches.push(line.trim());
            }
        } else {
            if (targetWords.every(word => normalizedLine.includes(word))) {
                matches.push(line.trim());
            }
        }
    }
    return matches;
}

const julioText = `Avenida 28 de Julio, 873 Miraflores Lima Peru T +511.213.73.73 F +511.243.31.31 www.mapfreperu.com Nro. De Constancia MP/2026/13661375 Ubicación del Riesgo/Local/Obra : PISCO ASEGURADO(S) CONSTANCIA DE ASEGURAMIENTO Mediante la presente, dejamos constancia que la(s) persona(s) abajo nombrada(s) está(n) asegurada(s) en nuestra compañía, a nombre de la empresa CONSTRUCCION Y ADMINISTRACION S.A. bajo la Póliza de Pensiones No. 7012600013858 y contrato de Salud No. 7022600017359, con vigencia del 01/07/2026 hasta el 31/07/2026, con las coberturas de Pensiones y Salud por trabajo de riesgo según la ley Nº 26790 y normas complementarias. ALBERTIS MOREYRA RICARDO MIGUEL 45970110 DNI 1 ALCANTARA MEDINA ODAR ANTHONY 44051426 DNI 2 ALTAMIRANO GALA CRISTHIAN JOSE 43803226 DNI 3 CANCHERO CONDOR JAIME JORGE 45566621 DNI 61 CANCINO TUEROS JOSE LUIS 22196407 DNI 62 CARRASCO`;

console.log("Matches for CANCINO:", getMatchesFromRecord(julioText, "CANCINO"));

