} else if (isAntiderrame) {
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
      }

      const templateDef = data.template || [];
      const getAns = (key: string) => templateDef.find((t: any) => t.text === key)?.value || "";
      const getSig = (key: string) => templateDef.find((t: any) => t.text === key)?.signature || "";

      // General Data
      worksheet.getCell("C4").value = getAns("Proyecto:");
      const tipo = getAns("Tipo de Inspección:");
      if (tipo === "Planeada") {
        worksheet.getCell("G5").value = "X"; // or whichever is the box
      } else if (tipo === "No Planeada") {
        worksheet.getCell("K5").value = "X"; // Adjusted based on image spacing
      }
      worksheet.getCell("C6").value = getAns("Lugar:");
      worksheet.getCell("J6").value = getAns("Fecha:");

      // Table Data
      let kits = [];
      try {
        kits = JSON.parse(getAns("Kits") || "[]");
      } catch (e) {
        console.error("Error parsing Kits:", e);
      }

      let currentRow = 11;
      kits.forEach((k: any, idx: number) => {
        // Items are typically in pairs of merged rows, so we write to the top row
        worksheet.getCell(`A${currentRow}`).value = idx + 1;
        worksheet.getCell(`B${currentRow}`).value = k.codigo || "";
        worksheet.getCell(`C${currentRow}`).value = k.ubicacion || "";
        worksheet.getCell(`D${currentRow}`).value = k.cilindro || "";
        worksheet.getCell(`E${currentRow}`).value = k.bandeja || "";
        worksheet.getCell(`F${currentRow}`).value = k.panosBlancos || "";
        worksheet.getCell(`G${currentRow}`).value = k.panosAmarillos || "";
        worksheet.getCell(`H${currentRow}`).value = k.trapos || "";
        worksheet.getCell(`I${currentRow}`).value = k.bolsasRojas || "";
        worksheet.getCell(`J${currentRow}`).value = k.bolsasNegras || "";
        worksheet.getCell(`K${currentRow}`).value = k.pala || "";
        worksheet.getCell(`L${currentRow}`).value = k.pico || "";
        worksheet.getCell(`M${currentRow}`).value = k.guantesNitrilo || "";
        worksheet.getCell(`N${currentRow}`).value = k.guantesNeoprene || "";
        worksheet.getCell(`O${currentRow}`).value = k.salchichas || "";
        worksheet.getCell(`P${currentRow}`).value = k.respirador || "";
        worksheet.getCell(`Q${currentRow}`).value = k.trajes || "";
        worksheet.getCell(`R${currentRow}`).value = k.observaciones || "";
        
        ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"].forEach(col => {
          const cell = worksheet.getCell(`${col}${currentRow}`);
          cell.style = {}; // Clear any bad conditional formatting
          cell.font = { color: { argb: "FF000000" }, size: 9 };
          if (col === "R") {
            cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          
          // Also apply to bottom row of the merged pair if needed
          const bottomCell = worksheet.getCell(`${col}${currentRow + 1}`);
          bottomCell.style = {};
          bottomCell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });

        currentRow += 2; // Jump by 2 for the next kit because rows 11+12 are for item 1, 13+14 for item 2
      });

      // Signatures
      // Inspeccionado por
      const inspNombre = getAns("InspeccionadoNombre:");
      const inspCargo = getAns("InspeccionadoCargo:");
      worksheet.getCell("C26").value = inspNombre;
      worksheet.getCell("C26").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getCell("I26").value = inspCargo;
      worksheet.getCell("I26").alignment = { vertical: "middle", horizontal: "center" };
      
      const inspFirma = getSig("InspeccionadoFirma:");
      if (inspFirma && inspFirma.startsWith("data:image")) {
        try {
          const ext = inspFirma.includes("jpeg") || inspFirma.includes("jpg") ? "jpeg" : "png";
          const base64Data = inspFirma.replace(/^data:image\/\w+;base64,/, "");
          const imgId = workbook.addImage({ base64: base64Data, extension: ext as any });
          worksheet.addImage(imgId, { tl: { col: 16, row: 24 }, ext: { width: 140, height: 40 } }); // Q25/26 area
        } catch (e) {
          console.error("[DEBUG] Error adding inspFirma:", e);
        }
      }

      // Responsable
      const respNombre = getAns("ResponsableNombre:");
      const respCargo = getAns("ResponsableCargo:");
      worksheet.getCell("C28").value = respNombre;
      worksheet.getCell("C28").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getCell("I28").value = respCargo;
      worksheet.getCell("I28").alignment = { vertical: "middle", horizontal: "center" };
      
      const respFirma = getSig("ResponsableFirma:");
      if (respFirma && respFirma.startsWith("data:image")) {
        try {
          const ext = respFirma.includes("jpeg") || respFirma.includes("jpg") ? "jpeg" : "png";
          const base64Data = respFirma.replace(/^data:image\/\w+;base64,/, "");
          const imgId = workbook.addImage({ base64: base64Data, extension: ext as any });
          worksheet.addImage(imgId, { tl: { col: 16, row: 26 }, ext: { width: 140, height: 40 } }); // Q27/28 area
        } catch (e) {
          console.error("[DEBUG] Error adding respFirma:", e);
        }
      }

      // Fotos
      let photoRow = 32;
      let hasPhotos = false;

      kits.forEach((k: any, idx: number) => {
        if (k.fotos && Array.isArray(k.fotos) && k.fotos.length > 0) {
          if (!hasPhotos) {
            worksheet.getCell(`A${photoRow}`).value = "REGISTRO FOTOGRÁFICO DE OBSERVACIONES";
            worksheet.getCell(`A${photoRow}`).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
            worksheet.getCell(`A${photoRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002060" } };
            worksheet.getCell(`A${photoRow}`).alignment = { vertical: "middle", horizontal: "center" };
            try { worksheet.mergeCells(`A${photoRow}:T${photoRow}`); } catch (e) {}
            hasPhotos = true;
            photoRow += 2;
          }

          worksheet.getCell(`A${photoRow}`).value = `Kit #${idx + 1} - ${k.codigo || "S/C"} | Observaciones: ${k.observaciones ? k.observaciones.replace(/\n/g, ' ') : "Ninguna"}`;
          worksheet.getCell(`A${photoRow}`).font = { bold: true };
          try { worksheet.mergeCells(`A${photoRow}:T${photoRow}`); } catch (e) {}
          photoRow += 1;

          let currentPhotoCol = 0;
          
          k.fotos.forEach((fotoStr: string) => {
            if (fotoStr && fotoStr.startsWith("data:image")) {
              try {
                const ext = fotoStr.includes("jpeg") || fotoStr.includes("jpg") ? "jpeg" : "png";
                const base64Data = fotoStr.replace(/^data:image\/\w+;base64,/, "");
                const imgId = workbook.addImage({ base64: base64Data, extension: ext as any });
                worksheet.addImage(imgId, {
                  tl: { col: currentPhotoCol, row: photoRow }, 
                  ext: { width: 320, height: 240 }
                });
                
                currentPhotoCol += 6;
                if (currentPhotoCol > 14) {
                   currentPhotoCol = 0;
                   photoRow += 14; 
                }
              } catch (e) {
                console.error("[DEBUG] Error adding kit photo:", e);
              }
            }
          });

          photoRow += 14; 
        }
      });

    } else if (isInternas) {
