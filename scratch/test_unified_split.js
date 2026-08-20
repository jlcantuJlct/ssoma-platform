const text = "1 DNI 11111111 PEREZ JUAN 2 DNI 22222222 GOMEZ ANA 6 DNI 71886242 VEGA RODRIGUEZ BENJY GESU DNI 70570587 VICENTE DE LA CRUZ GRABIEL ANGEL DNI 72874446 VICERREL RIOS CARLOS AN DRES DNI 41477003 VILCA VILLANUEVA FRANK MARCELO";

let textToSplit = text;
textToSplit = textToSplit.replace(/\s+(\d{1,4})\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '\n$1 $2 $3');
textToSplit = textToSplit.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ])\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '$1\n$2 $3');

let rawLines = textToSplit.split('\n').map(l => l.trim()).filter(l => l.length > 2);
console.log(rawLines);
