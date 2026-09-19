const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'public/templates/digital/Inspección de campamento.xlsx'));
  const worksheet = workbook.worksheets[0];
  let items = [];
  
  // Re-run the generic parser logic from app/api/templates/parse/route.ts
  const evalKeywords = ['OK', 'R', 'M', 'F', 'N/A', 'MALO', 'BUENO', 'SI', 'NO', 'C', 'NC', 'CUMPLE', 'OPERATIVO', 'INOPERATIVO', 'B', 'REGULAR'];
  let checklistStartRow = -1;
  let detectedHeaders = [];

  const getSafeText = (cell) => {
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object') {
          if (cell.value.richText) {
              return cell.value.richText.map((rt) => rt.text).join('').trim();
          }
          if (cell.value.result !== undefined) {
              return String(cell.value.result).trim();
          }
      }
      return String(cell.value).trim();
  };

  worksheet.eachRow((row, rowNumber) => {
      const textValues = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
          textValues.push(getSafeText(cell).toUpperCase());
      });
      
      const matchCount = textValues.filter(v => evalKeywords.includes(v)).length;
      const hasDescHeader = textValues.some(v => v.includes('ITEM') || v.includes('DESCRIPCI') || v.includes('INSPECC') || v.includes('DETALLE'));
      
      if (checklistStartRow === -1 && (matchCount >= 2 || (hasDescHeader && matchCount >= 1))) {
          checklistStartRow = rowNumber + 1;
          detectedHeaders = textValues.filter(v => v !== '');
      }
  });

  const headerLimit = checklistStartRow !== -1 ? checklistStartRow : 15;
  for (let i = 1; i < headerLimit; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell) => {
          let val = getSafeText(cell);
          if (val && val.length > 3 && val.length < 80) {
              const lower = val.toLowerCase();
              if (lower.includes('código') || lower.includes('versión') || lower === 'c' || lower === 'nc') return;
              val = val.replace(/\(Incluir firma\)/gi, '').trim();
              if (val.endsWith(':') || lower.includes('inspector') || lower.includes('responsable') || lower.includes('ubicación') || lower.includes('planificada') || lower === 'otro' || lower.includes('fecha') || lower.includes('cargo') || lower.includes('área de') || lower.includes('area de')) {
                  if (!items.includes(val)) items.push(val);
              }
          }
      });
  }

  if (checklistStartRow !== -1) {
      for (let i = checklistStartRow; i <= worksheet.rowCount; i++) {
          const row = worksheet.getRow(i);
          let possibleItem = '';
          for (let col = 1; col <= 6; col++) {
              const val = getSafeText(row.getCell(col));
              if (val && val.length > 4 && isNaN(Number(val))) {
                  possibleItem = val;
                  break;
              }
          }
          if (possibleItem.startsWith('(*) NOTA') || possibleItem.startsWith('NOTA:')) break;
          if (possibleItem && possibleItem.length > 4 && possibleItem.length < 500) { 
              const exists = items.some(item => typeof item === 'string' ? item === possibleItem : item.text === possibleItem);
              if (!exists) items.push(possibleItem);
          }
      }
  }

  console.log(JSON.stringify(items, null, 2));
}
run();
