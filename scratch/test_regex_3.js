let text = "45561104 DNI 45 BRAVO TITO KENYO ANYELO 47187583 DNI 46 BUSTAMANTE CIPRIAN LUIS ENRIQUE 40917640 DNI 47 CABALLA";
text = text.replace(/\s+(\d{7,15})\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{1,4})/gi, '\n$1 $2 $3');
console.log(text.split('\n'));
