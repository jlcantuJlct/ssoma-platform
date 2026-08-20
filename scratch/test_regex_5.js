let textToSplit = "1 DNI 11111111 PEREZ JUAN 2 DNI 22222222 GOMEZ ANA 33333333 DNI 3 PEREZ LUIS 44444444 DNI 4 GOMEZ LAURA 55555555 DNI ROMERO CARLOS 66666666 DNI RAMIREZ JULIA";

textToSplit = textToSplit.replace(/\s+(\d{1,4})\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '\n$1 $2 $3');
textToSplit = textToSplit.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ])\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '$1\n$2 $3');
textToSplit = textToSplit.replace(/(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{1,4})\s+([A-ZÁÉÍÓÚÑ])/gi, '$1\n$2 $3');
textToSplit = textToSplit.replace(/(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ])/gi, '$1\n$2');

console.log(textToSplit.split('\n').map(l => l.trim()).filter(l => l.length > 2));
