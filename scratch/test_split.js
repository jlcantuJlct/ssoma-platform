const text = "6 DNI 71886242 VEGA RODRIGUEZ BENJY GESU DNI 70570587 VICENTE DE LA CRUZ GRABIEL ANGEL DNI 72874446 VICERREL RIOS CARLOS";

let rawLines = text.split('\n');

const attemptA = text
    .replace(/\s+(\d{1,3})\s+(DNI|N°|Nro\.?|CIP|RUC|\d{7,9})/gi, '\n$1 $2')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

const attemptB = text
    .replace(/(DNI\s+\d{1,3})\s+(?=[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z])/g, '$1\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

const attemptC = text
    .replace(/\s+(DNI|CEX|PAS|RUC)\s+(\d{8,9})/gi, '\n$1 $2')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

console.log("A:", attemptA.length, "B:", attemptB.length, "C:", attemptC.length);

let best = rawLines;
if (attemptA.length > best.length) best = attemptA;
if (attemptB.length > best.length) best = attemptB;
if (attemptC.length > best.length) best = attemptC;

console.log("Best length:", best.length);
console.log("Best:", best);
