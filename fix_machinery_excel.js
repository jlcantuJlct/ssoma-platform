const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const oldMachinery = `      else if (isMachinery) {
        const meta = data.meta || data.answers || {};
        const checklist = data.checklist || {};
        const observaciones = data.observaciones || "";

        worksheet.mergeCells("A1:F2");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "CHECKLIST DE INSPECCIÓN DE PRE-USO DE MAQUINARIA";
        titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD97706" },
        };

        worksheet.getCell("A4").value = "Equipo:";
        worksheet.getCell("B4").value = meta.equipo || "";
        worksheet.getCell("D4").value = "Fecha:";
        worksheet.getCell("E4").value =
          meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("A5").value = "Marca/Modelo:";
        worksheet.getCell("B5").value =
          \`\${meta.marca || ""} \${meta.modelo || ""}\`;
        worksheet.getCell("D5").value = "Placa/Serie:";
        worksheet.getCell("E5").value = meta.placa || "";
        worksheet.getCell("A6").value = "Operador/Chofer:";
        worksheet.getCell("B6").value = meta.chofer || meta.operador || "";
        worksheet.getCell("D6").value = "Horómetro:";
        worksheet.getCell("E6").value = meta.horometro || "";
        ["A4", "D4", "A5", "D5", "A6", "D6"].forEach(
          (c) => (worksheet.getCell(c).font = { bold: true }),
        );

        const headers = [
          "N°",
          "Componente / Sistema Evaluado",
          "Evaluación (OK / R / M / F / N/A)",
        ];
        const headerRow = worksheet.getRow(8);
        headers.forEach((h, idx) => {
          const cell = headerRow.getCell(idx + 1);
          cell.value = h;
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFB45309" },
          };
        });

        let r = 9;
        Object.entries(checklist).forEach(([item, val]: any, idx) => {
          worksheet.getCell(\`A\${r}\`).value = idx + 1;
          worksheet.getCell(\`B\${r}\`).value = item;
          worksheet.getCell(\`C\${r}\`).value = val;
          if (val !== "OK" && val !== "N/A") {
            worksheet.getCell(\`C\${r}\`).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFCA5A5" },
            };
          }
          r++;
        });

        r += 2;
        worksheet.getCell(\`A\${r}\`).value = "Observaciones Adicionales:";
        worksheet.getCell(\`A\${r}\`).font = { bold: true };
        worksheet.mergeCells(\`B\${r}:F\${r + 2}\`);
        worksheet.getCell(\`B\${r}\`).value = observaciones;
        worksheet.getCell(\`B\${r}\`).alignment = {
          vertical: "top",
          wrapText: true,
        };
      }`;

const newMachinery = `      else if (isMachinery) {
        const meta = data.meta || data.answers || {};
        const checklist = data.checklist || {};
        const observaciones = data.observaciones || "";
        const firmas = data.firmas || {};

        if (fs.existsSync(templatePath)) {
            // Reinsertar logo
            worksheet.getCell("A1").value = "";
            try {
                const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
                if (fs.existsSync(logoPath)) {
                    const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
                    worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
                }
            } catch(e) {}

            worksheet.getCell("B4").value = meta.proyecto || "RED VIAL 6";
            worksheet.getCell("B5").value = meta.equipo || meta.tipoEquipo || "";
            worksheet.getCell("K5").value = meta.marca || "";
            worksheet.getCell("P5").value = meta.modelo || "";
            worksheet.getCell("U5").value = meta.serie || meta.placa || "";
            worksheet.getCell("D6").value = meta.operador || meta.chofer || "";
            worksheet.getCell("K6").value = meta.turno || "";
            worksheet.getCell("P6").value = meta.fecha || new Date().toISOString().split("T")[0];

            const fugaItems = ['Aceite de Motor', 'Combustible', 'Trasmisión', 'Tornamesa', 'Motor de Vibración', 'Motor de Traslación', 'Diferenciales', 'Mandos finales', 'Cilindros dirección'];
            const getOffset = (item, val) => {
                if (fugaItems.includes(item)) {
                    if (val === 'N/A') return 2;
                    if (val === 'RESUM') return 3;
                    if (val === 'FUGA') return 4;
                } else {
                    if (val === 'OK') return 2;
                    if (val === 'R') return 3;
                    if (val === 'M') return 4;
                    if (val === 'F') return 5;
                    if (val === 'N/A') return 6;
                }
                return null;
            };

            // Mapeo dinámico de items
            worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
                row.eachCell({ includeEmpty: false }, (cell, colNum) => {
                    const text = (cell.value && typeof cell.value === 'object' && cell.value.richText) 
                        ? cell.value.richText.map(rt => rt.text).join('') 
                        : String(cell.value || '');
                    
                    // Buscar si este texto es un item del checklist
                    // Limpiamos los asteriscos para coincidir
                    const cleanText = text.trim();
                    if (checklist[cleanText]) {
                        const val = checklist[cleanText];
                        const offset = getOffset(cleanText, val);
                        if (offset !== null) {
                            worksheet.getCell(rowNum, colNum + offset).value = "x";
                            worksheet.getCell(rowNum, colNum + offset).font = { bold: true };
                            worksheet.getCell(rowNum, colNum + offset).alignment = { horizontal: "center", vertical: "middle" };
                        }
                    }
                });
            });

            worksheet.getCell("A79").value = observaciones;
            worksheet.getCell("A79").alignment = { wrapText: true, vertical: "top" };
            worksheet.getCell("J83").value = firmas.operadorNombre || meta.operador || "";
            worksheet.getCell("J84").value = firmas.capatazNombre || "";

        } else {
            // Generic Fallback
            worksheet.mergeCells("A1:F2");
            const titleCell = worksheet.getCell("A1");
            titleCell.value = "CHECKLIST DE INSPECCIÓN DE PRE-USO DE MAQUINARIA";
            titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
            titleCell.alignment = { horizontal: "center", vertical: "middle" };
            titleCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD97706" },
            };

            worksheet.getCell("A4").value = "Equipo:";
            worksheet.getCell("B4").value = meta.equipo || "";
            worksheet.getCell("D4").value = "Fecha:";
            worksheet.getCell("E4").value =
                meta.fecha || new Date().toISOString().split("T")[0];
            worksheet.getCell("A5").value = "Marca/Modelo:";
            worksheet.getCell("B5").value =
                \`\${meta.marca || ""} \${meta.modelo || ""}\`;
            worksheet.getCell("D5").value = "Placa/Serie:";
            worksheet.getCell("E5").value = meta.placa || "";
            worksheet.getCell("A6").value = "Operador/Chofer:";
            worksheet.getCell("B6").value = meta.chofer || meta.operador || "";
            worksheet.getCell("D6").value = "Horómetro:";
            worksheet.getCell("E6").value = meta.horometro || "";
            ["A4", "D4", "A5", "D5", "A6", "D6"].forEach(
                (c) => (worksheet.getCell(c).font = { bold: true }),
            );

            const headers = [
                "N°",
                "Componente / Sistema Evaluado",
                "Evaluación (OK / R / M / F / N/A)",
            ];
            const headerRow = worksheet.getRow(8);
            headers.forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFB45309" },
                };
            });

            let r = 9;
            Object.entries(checklist).forEach(([item, val], idx) => {
                worksheet.getCell(\`A\${r}\`).value = idx + 1;
                worksheet.getCell(\`B\${r}\`).value = item;
                worksheet.getCell(\`C\${r}\`).value = val;
                if (val !== "OK" && val !== "N/A") {
                worksheet.getCell(\`C\${r}\`).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFCA5A5" },
                };
                }
                r++;
            });

            r += 2;
            worksheet.getCell(\`A\${r}\`).value = "Observaciones Adicionales:";
            worksheet.getCell(\`A\${r}\`).font = { bold: true };
            worksheet.mergeCells(\`B\${r}:F\${r + 2}\`);
            worksheet.getCell(\`B\${r}\`).value = observaciones;
            worksheet.getCell(\`B\${r}\`).alignment = {
                vertical: "top",
                wrapText: true,
            };
        }
      }`;

c = c.replace(oldMachinery, newMachinery);

// I need to ensure templatePath for Machinery actually resolves!
const oldTemplateDef = `        } else if (data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes("epp"))) {
          const alt = path.join(
            process.cwd(),
            "public",
            "templates",
            "digital",
            "Inspección de EPP.xlsx",
          );
          if (fs.existsSync(alt)) templatePath = alt;
        }`;

const newTemplateDef = `        } else if (data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes("epp"))) {
          const alt = path.join(
            process.cwd(),
            "public",
            "templates",
            "digital",
            "Inspección de EPP.xlsx",
          );
          if (fs.existsSync(alt)) templatePath = alt;
        } else if (data.isMachineryMatrix || (moduleName && moduleName.toLowerCase().includes("maquinaria"))) {
          const alt = path.join(
            process.cwd(),
            "public",
            "templates",
            "digital",
            "Inspección de maquinaria.xlsx",
          );
          if (fs.existsSync(alt)) templatePath = alt;
        }`;

c = c.replace(oldTemplateDef, newTemplateDef);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed export-excel machinery');
