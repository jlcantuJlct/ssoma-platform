export const maxDuration = 60;
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { moduleName, answers, template } = data;

    let templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "digital",
      `${moduleName}.xlsx`,
    );
    if (!fs.existsSync(templatePath)) {
      if (
        moduleName &&
        (moduleName.toLowerCase().includes("extintor") ||
          moduleName.toLowerCase().includes("emergencia"))
      ) {
        const alt = path.join(
          process.cwd(),
          "public",
          "templates",
          "digital",
          "Extintores.xlsx",
        );
        if (fs.existsSync(alt)) templatePath = alt;
      } else if (moduleName && moduleName.toLowerCase().includes("botiquin")) {
        const alt = path.join(
          process.cwd(),
          "public",
          "templates",
          "digital",
          "Botiquines.xlsx",
        );
        if (fs.existsSync(alt)) templatePath = alt;
      } else if (data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes("epp"))) {
        const alt = path.join(
          process.cwd(),
          "public",
          "templates",
          "digital",
          "Inspección de EPP.xlsx",
        );
        if (fs.existsSync(alt)) templatePath = alt;
      }
    }
    let workbook = new ExcelJS.Workbook();

    const isBotiquin =
      moduleName && moduleName.toLowerCase().includes("botiquin");
    const isEpp =
      data.isEppMatrix ||
      (moduleName && moduleName.toLowerCase().includes("epp"));
    const isExtintor =
      data.isExtinguisherMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("extintor") ||
          moduleName.toLowerCase().includes("emergencia")));
    const isMachinery =
      data.isMachineryMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("maquinaria") ||
          moduleName.toLowerCase().includes("máquina") ||
          moduleName.toLowerCase().includes("maquina")));
    const normName = (moduleName || "").toLowerCase().trim();
    const isInternas =
      normName.includes("interna") && normName.includes("ssoma");

    let worksheet: ExcelJS.Worksheet;

    if (fs.existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      worksheet = workbook.worksheets[0];
    } else {
      // Generar plantilla estructurada limpia desde cero si el archivo físico aún no fue subido
      worksheet = workbook.addWorksheet(moduleName || "Inspección");
    }

    // --- MANEJADOR 1: BOTIQUINES (Calibrado a F-SIG-030) ---
    if (isBotiquin && fs.existsSync(templatePath)) {
      // Reinsertar el logo
      worksheet.getCell("A1").value = "";
      try {
        const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
        if (fs.existsSync(logoPath)) {
          const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
          worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
        }
      } catch(e) {}

      const getVal = (kw: string) => {
        const idx = (template || []).findIndex((t: any) =>
          t.text.toLowerCase().includes(kw),
        );
        return idx !== -1 ? answers[idx]?.text || "" : "";
      };

      const getSignature = (kw: string) => {
        const idx = (template || []).findIndex((t: any) =>
          t.text.toLowerCase().includes(kw),
        );
        return idx !== -1 ? answers[idx]?.signature || "" : "";
      };

      worksheet.getCell("C4").value = getVal("proyecto");
      worksheet.getCell("C5").value = getVal("fecha");
      worksheet.getCell("I5").value = getVal("hora");
      worksheet.getCell("D6").value = getVal("inspector");
      worksheet.getCell("D7").value = getVal("responsable");
      worksheet.getCell("D8").value = getVal("ubicación");

      const inspSig = getSignature("inspector");
      if (inspSig) {
        try {
          const base64Data = inspSig.replace(/^data:image\/\w+;base64,/, "");
          const imageId = workbook.addImage({
            base64: base64Data,
            extension: "png",
          });
          worksheet.addImage(imageId, {
            tl: { col: 10, row: 5 },
            ext: { width: 120, height: 40 },
          });
        } catch (e) {
          console.error(e);
        }
      }

      const respSig = getSignature("responsable");
      if (respSig) {
        try {
          const base64Data = respSig.replace(/^data:image\/\w+;base64,/, "");
          const imageId = workbook.addImage({
            base64: base64Data,
            extension: "png",
          });
          worksheet.addImage(imageId, {
            tl: { col: 10, row: 6 },
            ext: { width: 120, height: 40 },
          });
        } catch (e) {
          console.error(e);
        }
      }

      const isPlanificada = (template || []).findIndex(
        (t: any) =>
          t.text.toLowerCase().includes("planificada") &&
          !t.text.toLowerCase().includes("no planificada"),
      );
      const isNoPlanificada = (template || []).findIndex(
        (t: any) =>
          t.text.toLowerCase().includes("no planificada") ||
          t.text.toLowerCase().includes("inopinada"),
      );

      if (isPlanificada !== -1 && answers[isPlanificada]?.text === "true")
        worksheet.getCell("A10").value = "X";
      if (isNoPlanificada !== -1 && answers[isNoPlanificada]?.text === "true")
        worksheet.getCell("A11").value = "X";

      let hallazgosText = "";
      let observacionesPrincipales = answers[29]?.text || "";

      (template || []).forEach((item: any, idx: number) => {
        if (idx >= 10 && idx <= 28) {
          const targetRow = 15 + (idx - 10);
          const ans = answers[idx]?.text;
          const qty = answers[idx]?.qty;
          
          if (qty) worksheet.getCell(`J${targetRow}`).value = qty;
          if (ans === "C") worksheet.getCell(`K${targetRow}`).value = "X";
          if (ans === "NC") {
            worksheet.getCell(`L${targetRow}`).value = "X";
            // Solo agregamos al hallazgosText si la observación principal no lo menciona ya
            if (!observacionesPrincipales.includes(item.text)) {
                hallazgosText += `- ${item.text}: NO CONFORME\n`;
            }
          }
          if (ans === "N/A") worksheet.getCell(`M${targetRow}`).value = "X";
        }
      });

      const finalObs = [
        observacionesPrincipales,
        hallazgosText ? `HALLAZGOS ADICIONALES:\n${hallazgosText.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");
        
      if (finalObs) {
        // En Excel, las filas 36 a 39 son líneas separadas. Dividimos por saltos de línea.
        const obsLines = finalObs.split('\n');
        let currentObsRow = 36;
        obsLines.forEach((line) => {
            if (currentObsRow <= 39 && line.trim()) {
                worksheet.getCell(`A${currentObsRow}`).value = line;
                currentObsRow++;
            } else if (currentObsRow === 36) { // fallback si es solo una línea muy larga
                worksheet.getCell("A36").value = line;
            }
        });
      }

      let currentPhotoRow = 48;
      if (data.fotosDefectos) {
        worksheet.getCell(`A${currentPhotoRow}`).value =
          "REGISTRO FOTOGRÁFICO DE HALLAZGOS:";
        worksheet.getCell(`A${currentPhotoRow}`).font = { bold: true };
        currentPhotoRow += 2;

        Object.keys(data.fotosDefectos).forEach((itemName) => {
          const fotos = data.fotosDefectos[itemName];
          if (fotos && fotos.length > 0) {
            worksheet.getCell(`A${currentPhotoRow}`).value =
              `Hallazgo: ${itemName}`;
            currentPhotoRow += 1;
            let colCursor = 1;
            fotos.forEach((fotoB64: string) => {
              try {
                const base64Data = fotoB64.replace(
                  /^data:image\/\w+;base64,/,
                  "",
                );
                const imageId = workbook.addImage({
                  base64: base64Data,
                  extension: "png",
                });
                worksheet.addImage(imageId, {
                  tl: { col: colCursor - 1, row: currentPhotoRow - 1 },
                  ext: { width: 300, height: 220 },
                });
                colCursor += 5;
                if (colCursor > 10) {
                  colCursor = 1;
                  currentPhotoRow += 13;
                }
              } catch (e) {
                console.error("Error attaching photo:", e);
              }
            });
            if (colCursor > 1) currentPhotoRow += 13;
          }
        });
      }

      // --- RENDERIZADO DE LEVANTAMIENTO DE OBSERVACIONES ---
      if (data.evidenciaLevantamiento) {
        let levPhotoRow = sigRow + 3;
        worksheet.getCell(`D${levPhotoRow}`).value = "REGISTRO DE LEVANTAMIENTO:";
        worksheet.getCell(`D${levPhotoRow}`).font = { bold: true };
        levPhotoRow += 2;
        if (data.comentarioLevantamiento) {
          worksheet.getCell(`D${levPhotoRow}`).value = `Comentario: ${data.comentarioLevantamiento}`;
          levPhotoRow += 2;
        }
        try {
          const base64Data = data.evidenciaLevantamiento.replace(/^data:image\/\w+;base64,/, "");
          const imageId = workbook.addImage({ base64: base64Data, extension: "png" });
          worksheet.addImage(imageId, { tl: { col: 3, row: levPhotoRow - 1 }, ext: { width: 300, height: 220 } });
        } catch (e) {
          console.error("Error attaching levantamiento photo:", e);
        }
      }
    }
    // --- MANEJADOR 2: EPP MATRICIAL ---
    else if (isEpp) {
      const meta = data.meta || data.answers || {};
      const workers = data.workers || data.template || [];

      if (fs.existsSync(templatePath)) {
        // Reinsertar logo
        worksheet.getCell("A1").value = "";
        try {
          const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
          if (fs.existsSync(logoPath)) {
            const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
            worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
          }
        } catch (e) {}

        // Datos Generales
        worksheet.getCell("E4").value = meta.proyecto || "RED VIAL 6";
        worksheet.getCell("Z4").value = meta.area || "";
        worksheet.getCell("J5").value = meta.responsable || meta.supervisor || meta.inspector || "";
        worksheet.getCell("Z5").value = meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("AO5").value = meta.nTrabajadores || "";
          worksheet.getCell("AO5").alignment = { horizontal: "center", vertical: "middle" };

        // EPP Columns Mapping
        const eppCols: any = {
          "Casco": "M", "Barbiquejo": "N", "Careta de esmerilar": "O", "Careta de soldador": "P",
          "Camisa": "Q", "Pantalón": "R", "Polo": "S", "Mandil": "T", "Escarpines": "U",
          "Lentes": "V", "Sobrelente": "W",
          "Guantes de cuero": "X", "Guantes de jebe": "Y", "Guantes dieléctricos": "Z", "Guantes de hilo": "AA",
          "Tapones": "AB", "Orejeras": "AC",
          "Mascarilla descartable": "AD", "Resp. c/filtro p/polvo": "AE", "Resp. c/filtro p/gases": "AF", "Resp. c/filtro p/humos": "AG",
          "Botines punta de acero": "AH", "Botines dieléctricos": "AI", "Botas de jebe": "AJ"
        };

        let row = 10;
        workers.forEach((w: any, i: number) => {
          worksheet.getCell(`A${row}`).value = i + 1;
          worksheet.getCell(`B${row}`).value = w.name || "";
          worksheet.getCell(`L${row}`).value = w.role || "";
          
          Object.keys(eppCols).forEach(epp => {
            const isBad = (w.badEpps || []).includes(epp);
            worksheet.getCell(`${eppCols[epp]}${row}`).value = isBad ? "NC" : "C";
          });

          worksheet.getCell(`AK${row}`).value = w.correction || "";
          worksheet.getCell(`AK${row}`).alignment = { wrapText: true, vertical: "middle", horizontal: "left" };
          worksheet.getCell(`AP${row}`).value = w.deadline || "";
          worksheet.getCell(`AS${row}`).value = w.verification || "";

          row++;
          if (row > 24) return;
        });

        // Observaciones
        worksheet.getCell("A28").value = meta.observaciones || "";

        // Evidencia fotográfica a partir de fila 32
        let currentImgRow = 31;
        const workersWithPhotos = workers.filter(w => w.fotoEvidencia);
          
          if (workersWithPhotos.length > 0 || data.evidenciaLevantamiento || data.comentarioLevantamiento) {
              worksheet.getCell(`D${currentImgRow}`).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA";
              worksheet.getCell(`D${currentImgRow}`).font = { bold: true, size: 12 };
              worksheet.getCell(`U${currentImgRow}`).value = "EVIDENCIA FOTOGRÁFICA DEL LEVANTAMIENTO";
              worksheet.getCell(`U${currentImgRow}`).font = { bold: true, size: 12 };
              currentImgRow += 2;
              
              if (data.comentarioLevantamiento) {
                  worksheet.getCell(`U${currentImgRow}`).value = "Comentario: " + data.comentarioLevantamiento;
                  currentImgRow += 2;
              }

              if (workersWithPhotos.length === 0 && data.evidenciaLevantamiento) {
                  try {
                      const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                      const evId = workbook.addImage({ base64: stripB64(data.evidenciaLevantamiento), extension: "png" });
                      worksheet.addImage(evId, {
                          tl: { col: 20, row: currentImgRow + 1 },
                          ext: { width: 300, height: 300 }
                      });
                  } catch(e) {}
                  currentImgRow += 16;
              }

              workersWithPhotos.forEach((w: any) => {
                worksheet.getCell(`D${currentImgRow}`).value = `Trabajador: ${w.name || "Sin nombre"}`;
                worksheet.getCell(`D${currentImgRow}`).font = { bold: true };
                
                try {
                    const stripB64 = (b64: string) => b64.substring(b64.indexOf(",") + 1);
                    const imageId = workbook.addImage({ base64: stripB64(w.fotoEvidencia), extension: "png" });
                    
                      worksheet.addImage(imageId, {
                          tl: { col: 3, row: currentImgRow + 1 },
                          ext: { width: 300, height: 300 }
                      });
                      if (data.evidenciaLevantamiento) {
                          const evId = workbook.addImage({ base64: stripB64(data.evidenciaLevantamiento), extension: "png" });
                          worksheet.addImage(evId, {
                              tl: { col: 20, row: currentImgRow + 1 },
                              ext: { width: 300, height: 300 }
                          });
                      }
                } catch(e) {}
                
                currentImgRow += 16;
            });
        }

      } else {
        // Fallback genérico si no hay plantilla física
        worksheet.mergeCells("A1:G2");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "REGISTRO DE INSPECCIÓN DE EQUIPOS DE PROTECCIÓN PERSONAL (EPP)";
        titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

        worksheet.getCell("A4").value = "Proyecto:";
        worksheet.getCell("B4").value = meta.proyecto || "RED VIAL 6";
        worksheet.getCell("D4").value = "Fecha:";
        worksheet.getCell("E4").value = meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("A5").value = "Supervisor SSOMA:";
        worksheet.getCell("B5").value = meta.supervisor || meta.inspector || "";
        worksheet.getCell("D5").value = "Área:";
        worksheet.getCell("E5").value = meta.area || "";

        ["A4", "D4", "A5", "D5"].forEach((c) => (worksheet.getCell(c).font = { bold: true }));

        const headers = ["N°", "Trabajador", "Cargo", "EPPs Observados / No Conforme"];
        const headerRow = worksheet.getRow(7);
        headers.forEach((h, idx) => {
          const cell = headerRow.getCell(idx + 1);
          cell.value = h;
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
          cell.alignment = { horizontal: "center" };
        });

        workers.forEach((w: any, idx: number) => {
          const r = worksheet.getRow(8 + idx);
          r.getCell(1).value = idx + 1;
          r.getCell(2).value = w.name || "";
          r.getCell(3).value = w.role || "";
          r.getCell(4).value = w.badEpps && w.badEpps.length > 0 ? w.badEpps.join(", ") : "CONFORME (100%)";
        });

        worksheet.columns = [
          { width: 6 },
          { width: 32 },
          { width: 22 },
          { width: 40 },
        ];
      }
    }
    // --- MANEJADOR 3: EXTINTORES Y EQUIPOS DE EMERGENCIA (Calibrado a F-SIG-058) ---
    else if (isExtintor) {
      const meta = data.meta || data.answers || {};

      if (fs.existsSync(templatePath)) {
        worksheet.getCell('A1').value = '';
        try {
          const logoPath = path.join(process.cwd(), 'public', 'templates', 'digital', 'official_casa_logo.jpg');
          if (fs.existsSync(logoPath)) {
            const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: 'jpeg' });
            worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
          }
        } catch(e) {}
      }
      const extinguishers = data.extinguishers || [];

      if (fs.existsSync(templatePath)) {
        // 1. Datos Generales (Cabecera)
        if (meta.registro) worksheet.getCell("B4").value = meta.registro;
        if (meta.fecha) worksheet.getCell("E4").value = meta.fecha;
        if (meta.actividadEconomica) {
          const c = worksheet.getCell("I4");
          c.value = meta.actividadEconomica;
          c.font = { name: "Arial", size: 9, color: { argb: "FF000000" }, bold: false };
        }

        if (meta.razonSocial) worksheet.getCell("A6").value = meta.razonSocial;
        if (meta.ruc) worksheet.getCell("C6").value = meta.ruc;
        if (meta.domicilio) worksheet.getCell("E6").value = meta.domicilio;
        if (meta.nTrabajadores) {
          const c = worksheet.getCell("I6");
          c.value = meta.nTrabajadores;
          c.font = { name: "Arial", size: 9, color: { argb: "FF000000" }, bold: false };
        }

        if (meta.proyecto) worksheet.getCell("B8").value = meta.proyecto;
        if (meta.ubicacionProyecto)
          worksheet.getCell("G8").value = meta.ubicacionProyecto;

        // 2. Equipos de Emergencia (Filas 11 en adelante)
        const totalExtinguishers = extinguishers.length;
        let sigDataRow = 23;

        // Si hay más de 10 extintores, insertamos filas adicionales manteniendo estilo
        if (totalExtinguishers > 10) {
          const extraCount = totalExtinguishers - 10;
          worksheet.spliceRows(21, 0, ...Array(extraCount).fill([]));
          const baseRow = worksheet.getRow(20);
          for (let r = 21; r < 21 + extraCount; r++) {
            const newRow = worksheet.getRow(r);
            newRow.height = 27;
            for (let c = 1; c <= 10; c++) {
              newRow.getCell(c).style = JSON.parse(
                JSON.stringify(baseRow.getCell(c).style || {}),
              );
            }
          }

          const sigRow = 21 + extraCount;
          try {
            worksheet.mergeCells(`A${sigRow}:J${sigRow}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`A${sigRow + 1}:C${sigRow + 1}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`D${sigRow + 1}:E${sigRow + 1}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`G${sigRow + 1}:H${sigRow + 1}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`I${sigRow + 1}:J${sigRow + 1}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`A${sigRow + 2}:C${sigRow + 2}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`D${sigRow + 2}:E${sigRow + 2}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`G${sigRow + 2}:H${sigRow + 2}`);
          } catch (e) {}
          try {
            worksheet.mergeCells(`I${sigRow + 2}:J${sigRow + 2}`);
          } catch (e) {}

          sigDataRow = 23 + extraCount;
        }

        extinguishers.forEach((ext: any, idx: number) => {
          const r = 11 + idx;
          worksheet.getCell(`A${r}`).value = ext.tipo || "";
          worksheet.getCell(`B${r}`).value = ext.codigo || "";
          worksheet.getCell(`C${r}`).value = ext.ubicacion || "";
          worksheet.getCell(`D${r}`).value = ext.agente || "";
          worksheet.getCell(`E${r}`).value = ext.fechaActual || "";
          worksheet.getCell(`F${r}`).value = ext.fechaProxima || "";
          worksheet.getCell(`G${r}`).value = ext.senalizacion || "C";
          worksheet.getCell(`H${r}`).value = ext.acceso || "C";
          worksheet.getCell(`I${r}`).value =
            ext.estado || ext.estadoGeneral || "C";
          worksheet.getCell(`J${r}`).value = ext.observaciones || "";

          ["B", "D", "E", "F", "G", "H", "I"].forEach((col) => {
            worksheet.getCell(`${col}${r}`).alignment = {
              horizontal: "center",
              vertical: "middle",
            };
          });
        });

        // 3. Responsable del Registro (Firmas)
        worksheet.getCell(`A${sigDataRow}`).value = meta.inspector || "";
        worksheet.getCell(`D${sigDataRow}`).value = meta.cargoInspector || "";
        worksheet.getCell(`G${sigDataRow}`).value =
          meta.fechaFirma || meta.fecha || "";

        worksheet.getCell(`A${sigDataRow}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`D${sigDataRow}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`G${sigDataRow}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        if (meta.firmaInspector) {
          try {
            const base64Data = meta.firmaInspector.replace(
              /^data:image\/\w+;base64,/,
              "",
            );
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: "png",
            });
            worksheet.addImage(imageId, {
              tl: { col: 8, row: sigDataRow - 1 },
              ext: { width: 140, height: 50 },
            });
          } catch (e) {
            console.error("Error al insertar firma de extintores:", e);
          }
        }

        let currentPhotoRow = sigDataRow + 3;
          // 4. Registro Fotográfico de Evidencias (si existen)
          if (data.fotosDefectos && Object.keys(data.fotosDefectos).length > 0) {
          worksheet.getCell(`A${currentPhotoRow}`).value =
            "REGISTRO FOTOGRÁFICO DE HALLAZGOS / INSPECCIÓN:";
          worksheet.getCell(`A${currentPhotoRow}`).font = { bold: true };
          currentPhotoRow += 2;

          Object.keys(data.fotosDefectos).forEach((itemName) => {
            const fotos = data.fotosDefectos[itemName];
            if (fotos && fotos.length > 0) {
              worksheet.getCell(`A${currentPhotoRow}`).value =
                `Equipo / Hallazgo: ${itemName}`;
              currentPhotoRow += 1;
              let colCursor = 1;
              fotos.forEach((fotoB64: string) => {
                try {
                  const base64Data = fotoB64.replace(
                    /^data:image\/\w+;base64,/,
                    "",
                  );
                  const imageId = workbook.addImage({
                    base64: base64Data,
                    extension: "png",
                  });
                  worksheet.addImage(imageId, {
                    tl: { col: colCursor - 1, row: currentPhotoRow - 1 },
                    ext: { width: 300, height: 220 },
                  });
                  colCursor += 5;
                  if (colCursor > 10) {
                    colCursor = 1;
                    currentPhotoRow += 13;
                  }
                } catch (e) {
                  console.error("Error attaching photo:", e);
                }
              });
              if (colCursor > 1) currentPhotoRow += 13;
            }
          });
        }

        // --- RENDERIZADO DE LEVANTAMIENTO DE OBSERVACIONES ---
        if (data.evidenciaLevantamiento) {
          let levPhotoRow = sigDataRow + 3; // Fila 26 si sigDataRow es 23
          
          worksheet.getCell(`D${levPhotoRow}`).value = "REGISTRO DE LEVANTAMIENTO:";
          worksheet.getCell(`D${levPhotoRow}`).font = { bold: true };
          levPhotoRow += 2;
          
          if (data.comentarioLevantamiento) {
            worksheet.getCell(`D${levPhotoRow}`).value = `Comentario: ${data.comentarioLevantamiento}`;
            levPhotoRow += 2;
          }

          try {
            const base64Data = data.evidenciaLevantamiento.replace(/^data:image\/\w+;base64,/, "");
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: "png",
            });
            worksheet.addImage(imageId, {
              tl: { col: 3, row: levPhotoRow - 1 },
              ext: { width: 300, height: 220 },
            });
          } catch (e) {
            console.error("Error attaching levantamiento photo:", e);
          }
        }
      } else {
        worksheet.mergeCells("A1:H2");
        const titleCell = worksheet.getCell("A1");
        titleCell.value =
          "REGISTRO DE INSPECCIÓN DE EXTINTORES Y EQUIPOS DE EMERGENCIA (F-SIG-058)";
        titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF991B1B" },
        };

        worksheet.getCell("A4").value = "Razón Social:";
        worksheet.getCell("B4").value =
          meta.razonSocial || "Construcción y Administración S.A.";
        worksheet.getCell("D4").value = "Fecha:";
        worksheet.getCell("E4").value =
          meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("A5").value = "Proyecto:";
        worksheet.getCell("B5").value = meta.proyecto || "RED VIAL 6";
        worksheet.getCell("D5").value = "Inspector:";
        worksheet.getCell("E5").value = meta.inspector || "";
        ["A4", "D4", "A5", "D5"].forEach(
          (c) => (worksheet.getCell(c).font = { bold: true }),
        );

        const headers = [
          "N°",
          "Tipo",
          "Código",
          "Ubicación",
          "Agente",
          "F. Actual",
          "F. Próxima",
          "Señaliz.",
          "Acceso",
          "Estado",
          "Observaciones",
        ];
        const headerRow = worksheet.getRow(7);
        headers.forEach((h, idx) => {
          const cell = headerRow.getCell(idx + 1);
          cell.value = h;
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDC2626" },
          };
          cell.alignment = { horizontal: "center" };
        });

        extinguishers.forEach((ext: any, idx: number) => {
          const r = worksheet.getRow(8 + idx);
          r.getCell(1).value = idx + 1;
          r.getCell(2).value = ext.tipo || "";
          r.getCell(3).value = ext.codigo || "";
          r.getCell(4).value = ext.ubicacion || "";
          r.getCell(5).value = ext.agente || "";
          r.getCell(6).value = ext.fechaActual || "";
          r.getCell(7).value = ext.fechaProxima || "";
          r.getCell(8).value = ext.senalizacion || "C";
          r.getCell(9).value = ext.acceso || "C";
          r.getCell(10).value = ext.estado || "C";
          r.getCell(11).value = ext.observaciones || "";
        });

        worksheet.columns = [
          { width: 6 },
          { width: 22 },
          { width: 14 },
          { width: 26 },
          { width: 14 },
          { width: 14 },
          { width: 14 },
          { width: 10 },
          { width: 10 },
          { width: 10 },
          { width: 30 },
        ];
      }
    }
    // --- MANEJADOR 4: MAQUINARIA Y EQUIPO PESADO ---
    else if (isMachinery) {
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
        `${meta.marca || ""} ${meta.modelo || ""}`;
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

      let rowIdx = 9;
      Object.keys(checklist).forEach((item, idx) => {
        const r = worksheet.getRow(rowIdx++);
        r.getCell(1).value = idx + 1;
        r.getCell(2).value = item;
        r.getCell(3).value = checklist[item];
        r.getCell(3).alignment = { horizontal: "center" };
      });

      worksheet.getCell(`A${rowIdx + 1}`).value = "OBSERVACIONES:";
      worksheet.getCell(`A${rowIdx + 1}`).font = { bold: true };
      worksheet.getCell(`A${rowIdx + 2}`).value =
        observaciones || "Sin observaciones adicionales.";

      worksheet.columns = [
        { width: 6 },
        { width: 45 },
        { width: 28 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];
    }
    // --- MANEJADOR INTERNAS ---
    else if (isInternas) {
      // Reinsertar el logo (ExcelJS pierde las imágenes incrustadas al reescribir el archivo)
      try {
        const logoPath = path.join(
          process.cwd(),
          "public",
          "templates",
          "digital",
          "logo_internas.jpg",
        );
        if (fs.existsSync(logoPath)) {
          const logoId = workbook.addImage({
            buffer: fs.readFileSync(logoPath),
            extension: "jpeg",
          });
          worksheet.addImage(logoId, {
            tl: { col: 1, row: 0 }, // Columna B, fila 1 (posición original del formato)
            ext: { width: 149, height: 61 },
          });
        }
      } catch (logoErr) {
        console.error("Error insertando logo:", logoErr);
      }

      // Buscar la respuesta por su etiqueta en el array 'template' (mismo índice)
      const getAns = (label: string) => {
        const idx = (template || []).findIndex(
          (t: any) => (t.text || "").trim() === label,
        );
        return idx !== -1 ? answers[idx]?.text || "" : "";
      };
      const getSig = (label: string) => {
        const idx = (template || []).findIndex(
          (t: any) => (t.text || "").trim() === label,
        );
        return idx !== -1 ? answers[idx]?.signature || "" : "";
      };
      const proyecto = getAns("Proyecto:");
      const direccion = getAns("Dirección:");
      const respArea = getAns("Responsable Área:");
      const area = getAns("Área:");
      const tipo = getAns("Tipo:");
      const hora = getAns("Hora:");
      const fecha = getAns("Fecha:");
      const responsables = JSON.parse(getAns("Responsables:") || "[]");
      const hallazgos = JSON.parse(getAns("Hallazgos:") || "[]");
      const conclusiones = getAns("Conclusiones:");
      const regNombre = getAns("RegNombre:");
      const regCargo = getAns("RegCargo:");
      const regFecha = getAns("RegFecha:");
      const regFirma = getSig("RegFirma:");

      worksheet.getCell("A7").value = proyecto;
      worksheet.getCell("K7").value = direccion;
      worksheet.getCell("I9").value = respArea;
      worksheet.getCell("L9").value = area;

      let tipoText =
        "    \\nPlaneada:                  No planeada:             Otro:";
      if (tipo === "Planeada")
        tipoText =
          "    \\nPlaneada: X               No planeada:             Otro:";
      if (tipo === "No planificada" || tipo === "No planeada")
        tipoText =
          "    \\nPlaneada:                  No planeada: X           Otro:";
      if (tipo === "Otro")
        tipoText =
          "    \\nPlaneada:                  No planeada:             Otro: X";
      worksheet.getCell("O9").value = tipoText;

      worksheet.getCell("T9").value = hora;
      worksheet.getCell("U9").value = fecha;
      // N° de trabajadores en el centro laboral (celda combinada T5:U5)
      worksheet.getCell("T5").value = getAns("N° Trabajadores:");

      const resCells = ["A9", "A10", "A11", "A12", "E9", "E10", "E11", "E12"];
      for (let i = 0; i < 8; i++) {
        if (responsables[i]) {
          worksheet.getCell(resCells[i]).value =
            `${i < 4 ? i + 1 : i + 1}) ${responsables[i]}`;
        }
      }

      // --- CENTRADO DE IMÁGENES EN CELDAS COMBINADAS ---
      const stripB64 = (b64: string) =>
        b64.substring(b64.indexOf(",") + 1);
      const colWidthPx = (c: number) => {
        const w = worksheet.getColumn(c).width;
        return w ? Math.round(w * 7 + 5) : 64;
      };
      const rowHeightPx = (r: number) => {
        const h = worksheet.getRow(r).height;
        return h ? (h * 4) / 3 : 20;
      };
      const getMergedBox = (col1: number, row1: number) => {
        const internal = (worksheet as any)._merges || {};
        for (const key of Object.keys(internal)) {
          const m = internal[key]?.model || internal[key];
          if (
            m &&
            m.left !== undefined &&
            col1 >= m.left &&
            col1 <= m.right &&
            row1 >= m.top &&
            row1 <= m.bottom
          ) {
            return m;
          }
        }
        return { left: col1, top: row1, right: col1, bottom: row1 };
      };
      const addCenteredImage = (
        b64: string,
        col1: number,
        row1: number,
        maxW = 100,
        maxH = 100,
        aspect = 1,
      ) => {
        try {
          const box = getMergedBox(col1, row1);
          let boxW = 0;
          for (let c = box.left; c <= box.right; c++) boxW += colWidthPx(c);
          let boxH = 0;
          for (let r = box.top; r <= box.bottom; r++) boxH += rowHeightPx(r);
          // Ajustar al área disponible respetando la proporción (aspect = ancho/alto)
          let w = Math.max(20, Math.min(maxW, boxW - 8));
          let h = w / aspect;
          if (h > Math.min(maxH, boxH - 8)) {
            h = Math.max(20, Math.min(maxH, boxH - 8));
            w = h * aspect;
          }
          const imageId = workbook.addImage({
            base64: stripB64(b64),
            extension: "png",
          });
          const offX = Math.max(0, (boxW - w) / 2);
          const offY = Math.max(0, (boxH - h) / 2);
          // Avanzar columna por columna hasta el píxel central (evita que la
          // fracción se calcule con el ancho de una sola columna angosta)
          let remX = offX;
          let anchorCol = box.left;
          while (anchorCol < box.right && remX > colWidthPx(anchorCol)) {
            remX -= colWidthPx(anchorCol);
            anchorCol++;
          }
          let remY = offY;
          let anchorRow = box.top;
          while (anchorRow < box.bottom && remY > rowHeightPx(anchorRow)) {
            remY -= rowHeightPx(anchorRow);
            anchorRow++;
          }
          worksheet.addImage(imageId, {
            tl: {
              col: anchorCol - 1 + remX / colWidthPx(anchorCol),
              row: anchorRow - 1 + remY / rowHeightPx(anchorRow),
            },
            ext: { width: w, height: h },
          });
        } catch (e) {}
      };

      // Grid logic
      let currentRow = 15;
      for (let i = 0; i < hallazgos.length; i++) {
        if (currentRow > 21) {
          break;
        }
        const h = hallazgos[i];
        worksheet.getCell(`A${currentRow}`).value = i + 1;
        worksheet.getCell(`B${currentRow}`).value = h.descripcion;
        worksheet.getCell(`J${currentRow}`).value = h.riesgo;
        if (h.riesgo === "Bajo")
          worksheet.getCell(`J${currentRow}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFc6efce" },
          };
        if (h.riesgo === "Medio")
          worksheet.getCell(`J${currentRow}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFffeb9c" },
          };
        if (h.riesgo === "Alto")
          worksheet.getCell(`J${currentRow}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFffc7ce" },
          };

        worksheet.getCell(`K${currentRow}`).value = h.categoria;
        worksheet.getCell(`L${currentRow}`).value = h.accion;
        worksheet.getCell(`N${currentRow}`).value = h.responsable;
        worksheet.getCell(`P${currentRow}`).value = h.fecha;
        worksheet.getCell(`U${currentRow}`).value = h.estado;
        if (h.estado === "Abierto")
          worksheet.getCell(`U${currentRow}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFffc7ce" },
          };
        if (h.estado === "Cerrado")
          worksheet.getCell(`U${currentRow}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFc6efce" },
          };

        // Fotos centradas en sus celdas combinadas
        if (h.evidencia || h.evidenciaLevantamiento) {
          worksheet.getRow(currentRow).height = 80;
          // Evidencia inicial -> columna G (celda combinada G:I)
          if (h.evidencia) addCenteredImage(h.evidencia, 7, currentRow);
          // Evidencia de levantamiento -> columna Q (celda combinada Q:T)
          if (h.evidenciaLevantamiento)
            addCenteredImage(h.evidenciaLevantamiento, 17, currentRow);
        }
        currentRow++;
      }

      // Cleanup remaining blank rows if any (from 15 to 21)
      for (let i = currentRow; i <= 21; i++) {
        worksheet.getCell(`A${i}`).value = "";
        worksheet.getCell(`B${i}`).value = "";
      }

      worksheet.getCell(`A23`).value = conclusiones;
      worksheet.getCell(`A26`).value = regNombre;
      worksheet.getCell(`M26`).value = regCargo;
      worksheet.getCell(`P26`).value = regFecha;

      if (regFirma) {
        try {
          // Firma digital más grande y centrada en la celda combinada T26:U26
          // (se respeta la altura original de la fila de la plantilla: 80.25pt ≈ 107px)
          addCenteredImage(regFirma, 20, 26, 280, 90, 4);
        } catch (e) {}
      }
    }
    // --- MANEJADOR 5: INSPECCIONES DIGITALES GENÉRICAS (Almacén, Escaleras, etc.) ---
    else {
      // Si no tiene plantilla física, creamos una vista tabular ordenada
      if (!fs.existsSync(templatePath)) {
        worksheet.mergeCells("A1:E2");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = `INSPECCIÓN DIGITAL: ${(moduleName || "GENERAL").toUpperCase()}`;
        titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0F172A" },
        };

        let curRow = 4;
        worksheet.getCell(`A${curRow}`).value = "Fecha:";
        worksheet.getCell(`B${curRow}`).value = new Date()
          .toISOString()
          .split("T")[0];
        worksheet.getCell(`A${curRow}`).font = { bold: true };
        curRow += 2;

        const headers = [
          "N°",
          "Ítem / Criterio",
          "Cantidad",
          "Respuesta / Evaluación",
        ];
        const hRow = worksheet.getRow(curRow++);
        headers.forEach((h, idx) => {
          const c = hRow.getCell(idx + 1);
          c.value = h;
          c.font = { bold: true, color: { argb: "FFFFFFFF" } };
          c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF334155" },
          };
        });

        (template || []).forEach((tItem: any, idx: number) => {
          const ans = answers ? answers[idx] : null;
          const r = worksheet.getRow(curRow++);
          r.getCell(1).value = idx + 1;
          r.getCell(2).value = tItem.text || "";
          r.getCell(3).value = ans?.qty || ans?.quantity || tItem.qty || "";
          r.getCell(4).value =
            ans?.text !== undefined
              ? ans.text
              : ans?.isConforme !== undefined
                ? ans.isConforme
                  ? "CUMPLE"
                  : "NO CUMPLE"
                : "";
        });

        worksheet.columns = [
          { width: 6 },
          { width: 45 },
          { width: 14 },
          { width: 25 },
          { width: 25 },
        ];
      }
    }
    const buffer = await workbook.xlsx.writeBuffer();

    if (data.saveToDrive) {
      const APPS_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbyzUxEDgad2mc2tfsWwfAlh4RHa0QKA_mJLcUN7AEe1jjEKOznkZ1myAIHe79zhxUB4/exec";
      const base64 = buffer.toString("base64");
      const fileName = `INSP_${moduleName}_${new Date().getTime()}.xlsx`;
      const folderPath = `INSPECCIONES/${new Date().getFullYear()}/${moduleName.toUpperCase()}`;

      const payload = {
        filename: fileName,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileBase64: base64,
        folderId: "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5",
        folderPath: folderPath,
        folderName: folderPath,
      };

      const driveRes = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain" },
        redirect: "follow",
      });

      let driveUrl = "";
      if (driveRes.ok) {
        const text = await driveRes.text();
        const driveData = JSON.parse(text);
        if (driveData.result === "success") {
          driveUrl = driveData.url || driveData.viewLink || "";
        }
      }

      return NextResponse.json({
        success: true,
        driveUrl,
        fileBase64: base64,
      });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Reporte_${moduleName}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("EXPORT EXCEL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}














