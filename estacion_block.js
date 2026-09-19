} else if (isEstacionEmergencia) {
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
      }

      const templateDef = data.template || [];
      const getAns = (key: string) => templateDef.find((t: any) => t.text === key)?.value || "";
      const getSig = (key: string) => templateDef.find((t: any) => t.text === key)?.signature || "";

      // General Data
      worksheet.getCell("C4").value = getAns("Proyecto:");
      worksheet.getCell("C5").value = getAns("Fecha:");
      worksheet.getCell("I5").value = getAns("Hora:");
      worksheet.getCell("D8").value = getAns("Ubicacion:");
      
      const tipo = getAns("Tipo:");
      if (tipo === "Planificada") {
        worksheet.getCell("A10").value = "X";
      } else if (tipo === "No Planificada") {
        worksheet.getCell("A11").value = "X";
      } else if (tipo === "Otro") {
        worksheet.getCell("A12").value = "X";
        worksheet.getCell("C12").value = getAns("OtroTipo:");
      }

      // Items Data (Array 0-25 goes to rows 15-40)
      let items: string[] = [];
      try {
        items = JSON.parse(getAns("Items:") || "[]");
      } catch (e) {
        console.error("Error parsing Items:", e);
      }

      items.forEach((val, idx) => {
        const r = 15 + idx;
        // The value is "C", "NC", or "N/A".
        worksheet.getCell(`K${r}`).value = val === "C" ? "X" : "";
        worksheet.getCell(`L${r}`).value = val === "NC" ? "X" : "";
        worksheet.getCell(`M${r}`).value = val === "N/A" ? "X" : "";
        
        // Centering
        ["K", "L", "M"].forEach(c => {
           worksheet.getCell(`${c}${r}`).alignment = { vertical: "middle", horizontal: "center" };
        });
      });

      // Observaciones
      const obs = getAns("Observaciones:");
      worksheet.getCell("A43").value = obs;
      worksheet.getCell("A43").alignment = { vertical: "top", horizontal: "left", wrapText: true };
      // Auto expand A43 height slightly if text is long
      if (obs && obs.length > 80) {
         const lines = Math.ceil(obs.length / 80);
         worksheet.getRow(43).height = lines * 15;
      }

      // Signatures
      // Inspector / Cargo at D6. Signature next to it, e.g. Col J row 6.
      const inspNombre = getAns("InspectorNombre:");
      worksheet.getCell("D6").value = inspNombre;
      
      const inspFirma = getSig("InspectorFirma:");
      if (inspFirma && inspFirma.startsWith("data:image")) {
        try {
          worksheet.getRow(6).height = 45; // Expand height to fit signature beautifully
          const ext = inspFirma.includes("jpeg") || inspFirma.includes("jpg") ? "jpeg" : "png";
          const base64Data = inspFirma.replace(/^data:image\/\w+;base64,/, "");
          const imgId = workbook.addImage({ base64: base64Data, extension: ext as any });
          worksheet.addImage(imgId, { tl: { col: 9, row: 5 }, ext: { width: 140, height: 40 } }); // J6 area
        } catch (e) { console.error(e); }
      }

      // Responsable at D7
      const respNombre = getAns("ResponsableNombre:");
      worksheet.getCell("D7").value = respNombre;
      
      const respFirma = getSig("ResponsableFirma:");
      if (respFirma && respFirma.startsWith("data:image")) {
        try {
          worksheet.getRow(7).height = 45; 
          const ext = respFirma.includes("jpeg") || respFirma.includes("jpg") ? "jpeg" : "png";
          const base64Data = respFirma.replace(/^data:image\/\w+;base64,/, "");
          const imgId = workbook.addImage({ base64: base64Data, extension: ext as any });
          worksheet.addImage(imgId, { tl: { col: 9, row: 6 }, ext: { width: 140, height: 40 } }); // J7 area
        } catch (e) { console.error(e); }
      }

      // Evidencia Fotográfica
      let photoRow = 52; // Put it below the notes block
      let fotos: string[] = [];
      try {
        fotos = JSON.parse(getAns("Fotos:") || "[]");
      } catch (e) { console.error("Error parsing fotos:", e); }

      if (fotos.length > 0) {
        worksheet.getCell(`A${photoRow}`).value = "REGISTRO FOTOGRÁFICO DE EVIDENCIA";
        worksheet.getCell(`A${photoRow}`).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        worksheet.getCell(`A${photoRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002060" } };
        worksheet.getCell(`A${photoRow}`).alignment = { vertical: "middle", horizontal: "center" };
        try { worksheet.mergeCells(`A${photoRow}:M${photoRow}`); } catch(e){}
        photoRow += 2;

        let currentPhotoCol = 0;
        fotos.forEach((fotoStr: string) => {
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
              if (currentPhotoCol > 10) {
                 currentPhotoCol = 0;
                 photoRow += 14; 
              }
            } catch (e) {}
          }
        });
      }