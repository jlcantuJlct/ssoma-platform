const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const injection = `    else if (isKitAntiderrame) {
      const meta = data.meta || data.answers || {};
      const kits = data.kits || data.template || [];

      if (fs.existsSync(templatePath)) {
        worksheet.getCell("C4").value = meta.proyecto || "RED VIAL 6";
        worksheet.getCell("I6").value = meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("D5").value = meta.tipoInspeccion === 'Planeada' ? 'X' : '';
        worksheet.getCell("H5").value = meta.tipoInspeccion === 'No Planeada' ? 'X' : '';
        worksheet.getCell("C6").value = meta.lugar || '';

        worksheet.getCell("C25").value = meta.inspector || "";
        worksheet.getCell("I25").value = meta.cargoInspector || "";
        worksheet.getCell("C27").value = meta.responsable || "";
        worksheet.getCell("I27").value = meta.cargoResponsable || "";

        if (meta.firmaInspector) {
          try {
            const f1Id = workbook.addImage({ base64: meta.firmaInspector, extension: "png" });
            worksheet.addImage(f1Id, { tl: { col: 14, row: 23 }, ext: { width: 120, height: 40 } });
          } catch(e){}
        }
        if (meta.firmaResponsable) {
          try {
            const f2Id = workbook.addImage({ base64: meta.firmaResponsable, extension: "png" });
            worksheet.addImage(f2Id, { tl: { col: 14, row: 25 }, ext: { width: 120, height: 40 } });
          } catch(e){}
        }

        const KIT_COLS = {
          'Cilindro de Kit antiderrame': 'D',
          'Bandeja Anti derrame de madera o metal': 'E',
          'Paños absorbentes (blanco)': 'F',
          'Paños absorbentes (Amarillo)': 'G',
          'Trapos Industriales': 'H',
          'Bolsas Rojas': 'I',
          'Bolsas Negras': 'J',
          'Pala': 'K',
          'Pico': 'L',
          'Guantes de nitrilo': 'M',
          'Guantes de Neoprene': 'N',
          'Salchichas absorventes': 'O',
          'Respirador media Cara O Mascarrilla descartable': 'P',
          'Trajes Tivek': 'Q'
        };

        let startRow = 11;
        kits.forEach((kit, idx) => {
          const row = startRow + (idx * 2);
          worksheet.getCell(\`B\${row}\`).value = kit.codigo || "";
          worksheet.getCell(\`C\${row}\`).value = kit.ubicacion || "";
          worksheet.getCell(\`R\${row}\`).value = kit.observaciones || "";

          if (kit.items) {
            Object.keys(KIT_COLS).forEach(itemName => {
              const col = KIT_COLS[itemName];
              const itemData = kit.items[itemName];
              if (itemData) {
                let cellVal = itemData.status || '';
                if (itemData.status === 'F' && itemData.missingQty) {
                  cellVal = \`F(\${itemData.missingQty})\`;
                }
                worksheet.getCell(\`\${col}\${row}\`).value = cellVal;
              }
            });
          }
        });
      }
    }
`;

code = code.replace('    else if (isEpp) {', injection + '    else if (isEpp) {');
fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log('injected logic!');
