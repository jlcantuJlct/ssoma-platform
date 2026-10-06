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
          "Inspección de Equipos de Emergencia (Extintores) F-SIG-058 Registro de inspección de equipos de seguridad o emergencia (2).xlsx",
        );
        if (fs.existsSync(alt)) templatePath = alt;
      } else if (moduleName && moduleName.toLowerCase().includes("botiquin")) {
        const alt = path.join(
          process.cwd(),
          "public",
          "templates",
          "digital",
          "Inspecciones botiquines F-SIG-030 INSPECCIÓN DE BOTIQUÍN.xlsx",
        );
        if (fs.existsSync(alt)) templatePath = alt;
      } else if (data.isEppMatrix || (moduleName && moduleName.toLowerCase().includes("epp"))) {
        const alt = path.join(
          process.cwd(),
          "public",
          "templates",
          "digital",
          "Inspección de EPP básico o especifico (Cantidad refiere a la cantidad de personas) F-SIG-044 Inspección de EPP V03.xlsx",
        );
        if (fs.existsSync(alt)) templatePath = alt;
      }
    }
    let workbook = new ExcelJS.Workbook();

    // removed old isBotiquin
    const isEpp =
      data.isEppMatrix ||
      (moduleName && moduleName.toLowerCase().includes("epp"));
    const isExtintor =
      data.isExtinguisherMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("extintor") ||
          (moduleName.toLowerCase().includes("emergencia") && !moduleName.toLowerCase().includes("estaci"))));
    const isMachinery =
      data.isMachineryMatrix ||
      (moduleName &&
        (moduleName.toLowerCase().includes("maquinaria") ||
          moduleName.toLowerCase().includes("máquina") ||
          moduleName.toLowerCase().includes("vehículo") ||
          moduleName.toLowerCase().includes("vehiculo") ||
          moduleName.toLowerCase().includes("equipos") ||
          moduleName.toLowerCase().includes("maquina")));
    const normName = (moduleName || "").toLowerCase().trim();
    const isInternas = normName.includes("interna") && normName.includes("ssoma");

    const isAlmacen = data.isAlmacenMatrix || (moduleName && moduleName.toLowerCase().includes("almacen"));
    const isTalleres = data.isTalleresMatrix || (moduleName && (moduleName.toLowerCase().includes("taller") || moduleName.toLowerCase().includes("talleres")));
    const isCampamento = data.isCampamentoMatrix || (moduleName && (moduleName.toLowerCase().includes("campamento") || moduleName.toLowerCase().includes("campamentos")));
    const isInstalacionesElectricas = data.isInstalacionesElectricasMatrix || (moduleName && (moduleName.toLowerCase().includes("eléctrica") || moduleName.toLowerCase().includes("electrica")));
    const isCocinaComedor = data.isCocinaComedorMatrix || (moduleName && (moduleName.toLowerCase().includes("cocina") || moduleName.toLowerCase().includes("comedor")));
    const isLaboratorio = data.isLaboratorioMatrix || (moduleName && moduleName.toLowerCase().includes("laboratorio"));
    const isKitAntiderrame = data.isKitAntiderrameMatrix || (moduleName && moduleName.toLowerCase().includes('derrame'));
    if (isKitAntiderrame) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Kit antiderrames F-SIG-076 INSPECCION DE KIT ANTIDERRAME.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
      const isBotiquin = data.isBotiquinesMatrix || (moduleName && (moduleName.toLowerCase().includes("botiquin") || moduleName.toLowerCase().includes("botiquín")));
    const isEstacionEmergencia = data.isEstacionEmergenciaMatrix || (moduleName && (moduleName.toLowerCase().includes("estacion") || moduleName.toLowerCase().includes("estación")));
    if (isBotiquin) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspecciones botiquines F-SIG-030 INSPECCIÓN DE BOTIQUÍN.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isEstacionEmergencia) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspecciones Estaciones de emergencia (F-SIG-008) INSPECCIÓN DE ESTACIÒN DE PRIMEROS AUXILIOS.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }

    // Template Fallbacks
    if (isAlmacen) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de almacenes F-SIG-028 Inspeccion Almacén V09.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isTalleres) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de taller de soldadura mecanico F-SIG-079 Inspección de Talleres V02.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isCampamento) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de areas de campamento F-SIG-072.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (moduleName && (moduleName.toLowerCase().includes("vehículo") || moduleName.toLowerCase().includes("vehiculo"))) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.) F-OP-010 V02 22.12.16 Vehicul.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isMachinery && !(moduleName && (moduleName.toLowerCase().includes("vehículo") || moduleName.toLowerCase().includes("vehiculo")))) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspecciones y observaciones maquinaria Línea amarilla (Excavadoras, retro, cargador, tractor, moto niveladora, cisterna de agua.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isInstalacionesElectricas) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de generador, tableros eléctrico F-SIG-075 Inspeccion de Instalaciones Eléctricas V01.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isCocinaComedor) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspección de Cocina y comedor F-SIG-074 INSPECCIÓN DE COCINA Y COMEDOR.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }
    if (isLaboratorio) { const alt = path.join(process.cwd(), "public", "templates", "digital", "Inspeccion de laboratorio F-SIG-077 INSPECCIÓN DE LABORATORIO.xlsx"); if(fs.existsSync(alt)) templatePath = alt; }


    let worksheet: ExcelJS.Worksheet;

    if (fs.existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      worksheet = workbook.worksheets[0];
    } else {
      // Generar plantilla estructurada limpia desde cero si el archivo físico aún no fue subido
      worksheet = workbook.addWorksheet(moduleName || "Inspección");
    }

    // --- MANEJADOR 1: BOTIQUINES (Calibrado a F-SIG-030) ---
    if (false && fs.existsSync(templatePath)) {
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
    else if (isKitAntiderrame) {
      const meta = data.meta || data.answers || {};
      const kits = data.kits || data.template || [];

      if (fs.existsSync(templatePath)) {
        worksheet.getCell("C4").value = meta.proyecto || "RED VIAL 6";
        worksheet.getCell("J6").value = meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("G5").value = meta.tipoInspeccion === 'Planeada' ? 'X' : '';
        worksheet.getCell("K5").value = meta.tipoInspeccion === 'No Planeada' ? 'X' : '';
        worksheet.getCell("C6").value = meta.lugar || '';

        const allItems = kits.flatMap((k:any) => Object.values(k.items || {}));
        const hasNC = allItems.some((it:any) => it.status === 'NC');
        const hasF = allItems.some((it:any) => it.status === 'F');
        
        worksheet.getCell("D7").value = (!hasNC && !hasF) ? 'X' : '';
        worksheet.getCell("H7").value = hasNC ? 'X' : '';
        worksheet.getCell("M7").value = hasF ? 'X' : '';

        worksheet.getCell("C26").value = meta.inspector || "";
        worksheet.getCell("I26").value = meta.cargoInspector || "";
        worksheet.getCell("C28").value = meta.responsable || "";
        worksheet.getCell("I28").value = meta.cargoResponsable || "";

        if (meta.firmaInspector) {
          try {
            const f1Id = workbook.addImage({ base64: meta.firmaInspector.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
            worksheet.addImage(f1Id, { tl: { col: 16, row: 25 }, ext: { width: 120, height: 40 } });
          } catch(e){}
        }
        if (meta.firmaResponsable) {
          try {
            const f2Id = workbook.addImage({ base64: meta.firmaResponsable.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
            worksheet.addImage(f2Id, { tl: { col: 16, row: 27 }, ext: { width: 120, height: 40 } });
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
          worksheet.getCell(`B${row}`).value = kit.codigo || "";
          worksheet.getCell(`C${row}`).value = kit.ubicacion || "";
          worksheet.getCell(`R${row}`).value = kit.observaciones || "";

          if (kit.items) {
            Object.keys(KIT_COLS).forEach(itemName => {
              const col = KIT_COLS[itemName];
              const itemData = kit.items[itemName];
              if (itemData) {
                let cellVal = itemData.status || '';
                if (itemData.status === 'F' && itemData.missingQty) {
                  cellVal = `F(${itemData.missingQty})`;
                }
                worksheet.getCell(`${col}${row}`).value = cellVal;
              }
            });
          }
        });

        let currentImgRow = 32;
        const stripB64 = (b64: string) => b64.substring(b64.indexOf(",") + 1);

        kits.forEach((kit: any) => {
            if (kit.fotosDefectos && kit.fotosDefectos.length > 0) {
                worksheet.getCell("B" + currentImgRow).value = `EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA (Kit: ${kit.codigo || 'S/N'}):`;
                worksheet.getCell("B" + currentImgRow).font = { bold: true, size: 12 };
                worksheet.getCell("B" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                
                try { worksheet.mergeCells("J" + currentImgRow + ":P" + currentImgRow); } catch(e){}
                worksheet.getCell("J" + currentImgRow).value = "REGISTROS FOTOGRÁFICOS DEL LEVANTAMIENTO:";
                worksheet.getCell("J" + currentImgRow).font = { bold: true, size: 12 };
                worksheet.getCell("J" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };

                currentImgRow += 2;
                
                try {
                    let img1 = stripB64(kit.fotosDefectos[0]);
                    let imgLev = null;
                    if (data.evidenciaLevantamiento) {
                        if (data.evidenciaLevantamiento.startsWith('{')) {
                            try {
                                const map = JSON.parse(data.evidenciaLevantamiento);
                                const descLine = `- Kit ${kit.codigo || 'S/N'} (${kit.ubicacion || 'S/U'}):\n${kit.observaciones || ''}`;
                                if (map[descLine]) {
                                    imgLev = stripB64(map[descLine]);
                                }
                            } catch(e) {}
                        } else {
                            imgLev = stripB64(data.evidenciaLevantamiento);
                        }
                    }

                    if (img1) {
                        const imageId1 = workbook.addImage({ base64: img1, extension: "jpeg" });
                        worksheet.addImage(imageId1, { tl: { col: 1, row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                    }
                    if (imgLev) {
                        const imageId2 = workbook.addImage({ base64: imgLev, extension: "jpeg" });
                        worksheet.addImage(imageId2, { tl: { col: 9, row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                    }
                } catch(e) {}
                
                currentImgRow += 14;
            }
        });
      }
    }
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
      const observaciones = data.observaciones || (data.answers && data.answers.observaciones) || "";

      
      // Si existe la plantilla base, úsala para llenar.
      if (fs.existsSync(templatePath)) {
          // Agregar logo en la esquina superior izquierda
          try {
              const path = require('path');
              const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
              if (fs.existsSync(logoPath)) {
                  worksheet.getCell("A1").value = "";
                  worksheet.getCell("A2").value = "";
                  worksheet.getCell("A3").value = "";
                  const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
                  worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
              }
          } catch(e) {}

          // Llenar metadatos generales
          const setIfFound = (label, val, rowOffset=0, colOffset=1) => {
              for (let i = 1; i <= 100; i++) {
                  const r = worksheet.getRow(i);
                  let foundCol = -1;
                  r.eachCell((cell, colN) => {
                      if (cell.value) {
                          let t = '';
                          if (typeof cell.value === 'object' && cell.value.richText) t = cell.value.richText.map(rt => rt.text).join('').trim();
                          else t = cell.value.toString().trim();
                          if (t.includes(label)) foundCol = colN;
                      }
                  });
                  if (foundCol !== -1) {
                      worksheet.getRow(i + rowOffset).getCell(foundCol + colOffset).value = val;
                      return;
                  }
              }
          };

          setIfFound('Proyecto:', meta.proyecto);
          setIfFound('Equipo:', meta.equipo, 0, 2);
          setIfFound('Marca:', meta.marca, 0, 2);
          setIfFound('Modelo:', meta.modelo, 0, 1);
          setIfFound('Serie:', meta.serie, 0, 2);
          setIfFound('Serie / Placa:', meta.placa || meta.serie, 0, 2);
          setIfFound('Operador de Equipo:', meta.chofer || meta.operador, 0, 2);
          setIfFound('Chofer:', meta.chofer || meta.operador, 0, 2);
          setIfFound('Turno:', meta.turno, 0, 2);
          setIfFound('Fecha:', meta.fecha || new Date().toISOString().split('T')[0], 0, 1);
          
          const firmas = (data.answers && data.answers.firmas) ? data.answers.firmas : (data.firmas || {});
          const opName = firmas.operadorNombre || meta.chofer || meta.operador || "";
          const capName = firmas.capatazNombre || meta.capataz || "";
          
          for (let i = 60; i <= 75; i++) {
              const r = worksheet.getRow(i);
              r.eachCell((cell, colN) => {
                  if (cell.value) {
                      let text = '';
                      if (typeof cell.value === 'object' && cell.value.richText) text = cell.value.richText.map(rt => rt.text).join('');
                      else text = cell.value.toString();
                      
                      if (text.includes('Nombre y Firma del Colaborador')) {
                          worksheet.getRow(i).getCell(10).value = opName;
                          if (firmas.operadorFirma) {
                              try {
                                  const imgId = workbook.addImage({ base64: firmas.operadorFirma.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
                                  worksheet.addImage(imgId, { tl: { col: 19, row: i - 1 }, ext: { width: 120, height: 35 } });
                              } catch(e) {}
                          }
                      } else if (text.includes('Nombre y Firma del Capataz')) {
                          worksheet.getRow(i).getCell(10).value = capName;
                          if (firmas.capatazFirma) {
                              try {
                                  const imgId = workbook.addImage({ base64: firmas.capatazFirma.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
                                  worksheet.addImage(imgId, { tl: { col: 19, row: i - 1 }, ext: { width: 120, height: 35 } });
                              } catch(e) {}
                          }
                      }
                  }
              });
          }
    

          // Llenar checklist
          const seenInRow = new Set();
          
          const headersToExclude = new Set([
              'CHASIS', 'NEUMÁTICOS', 'CABINA OPERADOR', 'SEGURIDAD', 'FUGAS DE FLUIDO', 'NIVELES DE FLUIDO',
              'CAMIONETAS', 'TRANSPORTE PERSONAL', 'CISTERNA DE AGUA', 'CISTERNA DE COMBUSTIBLE',
              'CAMIONES BARANDA', 'CAMIONES VOLQUETES', 'TRACTO', 'CAMIONES LUBRICADORES', 'SEMIREMOLQUE',
              'VEHÍCULO EN GENERAL', 'OK', 'R', 'M', 'F', 'N/A', 'RESUM', 'FUGA'
          ]);

          
          
          for (let i = 13; i <= 60; i++) {
              const r = worksheet.getRow(i);
              r.eachCell((cell, colN) => {
                  // Only process the exact columns where item text resides!
                  if (colN !== 2 && colN !== 11 && colN !== 20) return;
                  
                  if (cell.value) {
                      let text = '';
                      if (typeof cell.value === 'object' && cell.value.richText) text = cell.value.richText.map(rt => rt.text).join('').trim();
                      else text = cell.value.toString().trim();
                      
                      if (!text) return;

                      // Map duplicates to unique keys used in the digital form
                      let lookupText = text;
                      if (lookupText === 'Combustible') {
                          if (i >= 49 && i <= 53) lookupText = 'Combustible (Fugas)';
                          else lookupText = 'Combustible (Niveles)';
                      }
                      if (lookupText === 'Asientos') {
                          if (colN === 10 || colN === 11) lookupText = 'Asientos (Personal)';
                      }
                      
                      const val = checklist[lookupText];
                      
                      // For checking missing items (auto-N/A)
                      if (!val && !headersToExclude.has(lookupText.toUpperCase())) {
                          let offset = -1;
                          if (i >= 49 && i <= 53 && colN === 2) offset = 1; // N/A is offset 1 for Fugas
                          else offset = 5; // N/A is offset 5 for standard
                          const targetCell = r.getCell(colN + offset);
                          targetCell.value = 'X';
                          targetCell.alignment = { horizontal: 'center', vertical: 'middle' };
                          targetCell.font = { bold: true };
                          return;
                      }

                      if (val) {
                          let offset = -1;
                          if (i >= 49 && i <= 53 && colN === 2) {
                              // Fugas section
                              if (val === 'N/A') offset = 1;
                              else if (val === 'RESUM') offset = 2;
                              else if (val === 'FUGA') offset = 3; // Col 5
                          } else {
                              // Standard section
                              if (val === 'OK') offset = 1;
                              else if (val === 'R') offset = 2;
                              else if (val === 'M') offset = 3;
                              else if (val === 'F') offset = 4;
                              else if (val === 'N/A') offset = 5;
                          }
                          
                          if (offset !== -1) {
                              const targetCell = r.getCell(colN + offset);
                              targetCell.value = 'X';
                              targetCell.alignment = { horizontal: 'center', vertical: 'middle' };
                              targetCell.font = { bold: true };
                          }
                      }
                  }
              });
          }

          // Llenar observaciones
          for (let i = 60; i <= 100; i++) {
              const r = worksheet.getRow(i);
              let found = false;
              r.eachCell((cell, colN) => {
                  let text = '';
                  if (cell.value) {
                      if (typeof cell.value === 'object' && cell.value.richText) text = cell.value.richText.map(rt => rt.text).join('');
                      else text = cell.value.toString();
                  }
                  if (text.includes('OBSERVACIONES:')) {
                      try { worksheet.mergeCells(i + 1, 1, i + 4, 26); } catch(e) {}
                      const obsCell = worksheet.getRow(i + 1).getCell(1);
                      obsCell.value = observaciones || "Sin observaciones adicionales.";
                      obsCell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                      obsCell.font = { color: { argb: 'FF000000' }, size: 10 };
                      found = true;
                  }
              });
              if (found) break; // Solo llenar el primer bloque de observaciones
          }


          // --- RENDERIZAR FOTOS DE DEFECTOS Y LEVANTAMIENTOS ---
          let currentImgRow = 94; // A partir de la fila 94
          
          const badItemsKeys = Object.keys(checklist).filter(k => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(checklist[k]));
          let evidenciasMapLocal = {};
          if (data.evidenciaLevantamiento && data.evidenciaLevantamiento.startsWith('{')) {
              try { evidenciasMapLocal = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
          }
          
          badItemsKeys.forEach((item) => {
              const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
              
              let matchImgLev = null;
              let levComment = "";
              if (data.comentarioLevantamiento && data.comentarioLevantamiento.startsWith('{')) {
                  try {
                      const commMap = JSON.parse(data.comentarioLevantamiento);
                      const matchComm = Object.entries(commMap).find(([k,v]) => k.includes(item) && v);
                      if (matchComm) levComment = matchComm[1];
                  } catch(e) {}
              }
              if (Object.keys(evidenciasMapLocal).length > 0) {
                  matchImgLev = Object.entries(evidenciasMapLocal).find(([k,v]) => k.includes(item) && v && typeof v === 'string' && v.length > 50);
              }

              if ((photos && photos.length > 0) || matchImgLev) {
                  try { worksheet.mergeCells("B" + currentImgRow + ":F" + currentImgRow); } catch(e){}
                  worksheet.getCell("B" + currentImgRow).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA: " + item;
                  worksheet.getCell("B" + currentImgRow).font = { bold: true, size: 10 };
                  worksheet.getCell("B" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                  
                  try { worksheet.mergeCells("H" + currentImgRow + ":K" + currentImgRow); } catch(e){}
                  worksheet.getCell("H" + currentImgRow).value = "EVIDENCIA DEL LEVANTAMIENTO";
                  worksheet.getCell("H" + currentImgRow).font = { bold: true, size: 10 };
                  worksheet.getCell("H" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                  currentImgRow += 2;
                  
                  try {
                      const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                      let colCursor = 1; // Col B
                      if (photos && photos.length > 0) {
                          for (let i = 0; i < photos.length; i++) {
                              if (photos[i] && typeof photos[i] === 'string' && photos[i].length > 50) {
                                  const imgBase64 = stripB64(photos[i]);
                                  const imgId = workbook.addImage({ base64: imgBase64, extension: "jpeg" });
                                  worksheet.addImage(imgId, { tl: { col: colCursor, row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                                  colCursor += 5;
                                  if (colCursor > 6) break; // Max 1 image per row for original to leave space for levantamiento
                              }
                          }
                      }
                      
                      if (matchImgLev) {
                          let imgLev = stripB64(matchImgLev[1]);
                          const imgId2 = workbook.addImage({ base64: imgLev, extension: "jpeg" });
                          worksheet.addImage(imgId2, { tl: { col: 7, row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                      }
                      
                      if (levComment) {
                          try { worksheet.mergeCells("H" + (currentImgRow + 13) + ":L" + (currentImgRow + 15)); } catch(e){}
                          worksheet.getCell("H" + (currentImgRow + 13)).value = "Comentario: " + levComment;
                          worksheet.getCell("H" + (currentImgRow + 13)).alignment = { wrapText: true, vertical: 'top' };
                          worksheet.getCell("H" + (currentImgRow + 13)).font = { size: 9 };
                      }
                      
                      currentImgRow += 16;
                  } catch (err) {
                      console.error("Error insertando fotos en vehiculo:", err);
                  }
              }
          });


      } else {
          // Fallback al formato generado desde cero si no encuentra la plantilla
          worksheet.mergeCells("A1:F2");
          const titleCell = worksheet.getCell("A1");
          titleCell.value = moduleName && moduleName.toLowerCase().includes('vehículo') ? "CHECKLIST DE INSPECCIÓN DE PRE-USO DE VEHÍCULOS Y EQUIPOS" : "CHECKLIST DE INSPECCIÓN DE PRE-USO DE MAQUINARIA";
          titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
          titleCell.alignment = { horizontal: "center", vertical: "middle" };
          titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD97706" } };

          worksheet.getCell("A4").value = "Equipo:";
          worksheet.getCell("B4").value = meta.equipo || "";
          worksheet.getCell("D4").value = "Fecha:";
          worksheet.getCell("E4").value = meta.fecha || new Date().toISOString().split("T")[0];
          worksheet.getCell("A5").value = "Marca/Modelo:";
          worksheet.getCell("B5").value = `${meta.marca || ""} ${meta.modelo || ""}`;
          worksheet.getCell("D5").value = "Placa/Serie:";
          worksheet.getCell("E5").value = meta.placa || meta.serie || "";
          worksheet.getCell("A6").value = "Operador/Chofer:";
          worksheet.getCell("B6").value = meta.chofer || meta.operador || "";
          worksheet.getCell("D6").value = "Turno:";
          worksheet.getCell("E6").value = meta.turno || "";
          ["A4", "D4", "A5", "D5", "A6", "D6"].forEach(c => worksheet.getCell(c).font = { bold: true });

          const headers = ["N°", "Componente / Sistema Evaluado", "Evaluación (OK / R / M / F / N/A)"];
          const headerRow = worksheet.getRow(8);
          headers.forEach((h, idx) => {
              const cell = headerRow.getCell(idx + 1);
              cell.value = h;
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
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
          worksheet.getCell(`A${rowIdx + 2}`).value = observaciones || "Sin observaciones adicionales.";
          worksheet.columns = [{ width: 6 }, { width: 45 }, { width: 28 }, { width: 15 }, { width: 15 }, { width: 15 }];
      }
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
        const cellR = worksheet.getCell(`J${currentRow}`);
        // Desvincular el estilo compartido clonándolo profundamente
        cellR.style = JSON.parse(JSON.stringify(cellR.style));
        if (h.riesgo === "Bajo") {
          cellR.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
          cellR.font = { ...cellR.font, color: { argb: "FFFFFFFF" }, bold: true };
        } else if (h.riesgo === "Medio") {
          cellR.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
          cellR.font = { ...cellR.font, color: { argb: "FF000000" }, bold: true };
        } else if (h.riesgo === "Alto") {
          cellR.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
          cellR.font = { ...cellR.font, color: { argb: "FFFFFFFF" }, bold: true };
        }
        worksheet.getCell(`K${currentRow}`).value = h.categoria;
        worksheet.getCell(`L${currentRow}`).value = h.accion;
        worksheet.getCell(`N${currentRow}`).value = h.responsable;
        worksheet.getCell(`P${currentRow}`).value = h.fecha;
        worksheet.getCell(`U${currentRow}`).value = h.estado;
        const cellE = worksheet.getCell(`U${currentRow}`);
        cellE.style = JSON.parse(JSON.stringify(cellE.style));
        if (h.estado === "Abierto") {
          cellE.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
          cellE.font = { ...cellE.font, color: { argb: "FFFFFFFF" }, bold: true };
        }
        if (h.estado === "Cerrado") {
          cellE.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
          cellE.font = { ...cellE.font, color: { argb: "FFFFFFFF" }, bold: true };
        }

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
    
      // --- MANEJADOR 5: ALMACEN MATRICIAL ---
      else if (isAlmacen || isTalleres || isCampamento || isInstalacionesElectricas || isCocinaComedor || isLaboratorio || isBotiquin || isEstacionEmergencia) {
          const meta = data.meta || data.answers || {};
          let checklist = data.checklist || (data.template && !Array.isArray(data.template) ? data.template : {});
          const cleanCheck = {};
          Object.keys(checklist).forEach(k => { cleanCheck[k.replace(/\s*\(Cant:\s*\d+\)\s*/g, '')] = checklist[k]; });
          checklist = cleanCheck;
          
          if (Object.keys(checklist).length === 0 && Array.isArray(data.template)) {
              data.template.forEach(item => {
                  if (item.type === 'radio' && item.value) {
                      checklist[item.text] = item.value;
                  }
              });
          }
          const firmas = data.firmas || meta.firmas || {};
          const observaciones = data.observaciones || meta.observaciones || "";
          
          if (fs.existsSync(templatePath)) {
              worksheet.getCell("A1").value = "";
              try {
                  const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
                  if (fs.existsSync(logoPath)) {
                      const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
                      worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
                  }
              } catch(e) {}
              
              if (isAlmacen || isTalleres) {
                  worksheet.getCell("C4").value = meta.proyecto || ""; worksheet.getCell("E5").value = meta.area || ""; worksheet.getCell("K5").value = meta.fecha || ""; worksheet.getCell("D6").value = meta.inspector || ""; worksheet.getCell("D8").value = meta.responsable || "";
              } else if (isInstalacionesElectricas) {
                  worksheet.getCell("C4").value = meta.proyecto || ""; worksheet.getCell("E5").value = meta.area || ""; worksheet.getCell("K5").value = meta.fecha || ""; worksheet.getCell("D6").value = meta.inspector || ""; worksheet.getCell("D8").value = meta.responsable || "";
              
                } else if (isBotiquin || isEstacionEmergencia) {
                    worksheet.getCell("C4").value = meta.proyecto || "";
                    worksheet.getCell("C5").value = meta.fecha || "";
                    worksheet.getCell("I5").value = meta.hora || "";
                    worksheet.getCell("D6").value = meta.inspector || "";
                    worksheet.getCell("D7").value = meta.cargo || "";
                    worksheet.getCell("D8").value = meta.ubicacion || meta.responsable || "";
                    
                    if (meta.tipoInspeccion === 'Planificada' || data.tipoInspeccion === 'Planificada') {
                        worksheet.getCell("A10").value = "x";
                    } else {
                        worksheet.getCell("A11").value = "x";
                    }
                    
                    if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {
                        try { const imgId = workbook.addImage({ base64: firmas.inspectorFirma.replace(/^data:image\/\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 5 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                    }
                    if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {
                        try { const imgId = workbook.addImage({ base64: firmas.responsableFirma.replace(/^data:image\/\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                    }
 } else if (isCampamento || isCocinaComedor || isLaboratorio) {
                  worksheet.getCell("E4").value = meta.proyecto || ""; worksheet.getCell("E5").value = meta.area || ""; worksheet.getCell("K5").value = meta.fecha || ""; worksheet.getCell("D6").value = meta.inspector || ""; worksheet.getCell(isCampamento ? "D7" : "D7").value = meta.cargo || ""; worksheet.getCell("D8").value = meta.responsable || "";
                  if (isCocinaComedor || isLaboratorio) {
                      if (meta.tipoInspeccion === 'Planificada' || data.tipoInspeccion === 'Planificada') worksheet.getCell("A10").value = "x";
                      else worksheet.getCell("A11").value = "x";
                  }
                  if (firmas.inspectorFirma && typeof firmas.inspectorFirma === 'string' && firmas.inspectorFirma.includes('data:image')) {
                      try { const imgId = workbook.addImage({ base64: firmas.inspectorFirma.replace(/^data:image\/\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 6 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                  }
                  if (firmas.responsableFirma && typeof firmas.responsableFirma === 'string' && firmas.responsableFirma.includes('data:image')) {
                      try { const imgId = workbook.addImage({ base64: firmas.responsableFirma.replace(/^data:image\/\w+;base64,/, ""), extension: 'png' }); worksheet.addImage(imgId, { tl: { col: 10, row: 7 }, ext: { width: 120, height: 40 } }); } catch(e) {}
                  }
              }
              
              let obsCellStart = "A83"; let obsCellEnd = "L86";
              if (isTalleres) { obsCellStart = "A39"; obsCellEnd = "M44"; }
              else if (isCampamento) { obsCellStart = "A57"; obsCellEnd = "M61"; }
              else if (isInstalacionesElectricas) { obsCellStart = "A47"; obsCellEnd = "M52"; }
              else if (isCocinaComedor) { obsCellStart = "A55"; obsCellEnd = "M59"; }
              else if (isLaboratorio) { obsCellStart = "A36"; obsCellEnd = "M42"; } else if (isBotiquin) { obsCellStart = "A36"; obsCellEnd = "M42"; } else if (isEstacionEmergencia) { obsCellStart = "A43"; obsCellEnd = "M47"; }
              
              try { 
                  if (isCampamento) { for(let r=57; r<=61; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isInstalacionesElectricas) { for(let r=47; r<=52; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isCocinaComedor) { for(let r=55; r<=59; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isLaboratorio) { for(let r=36; r<=42; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } } else if (isBotiquin) { for(let r=36; r<=42; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } } else if (isEstacionEmergencia) { for(let r=43; r<=47; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  else if (isTalleres) { for(let r=39; r<=44; r++) { try { worksheet.unMergeCells("A"+r+":M"+r); } catch(e){} } }
                  worksheet.mergeCells(obsCellStart + ":" + obsCellEnd); 
              } catch(e) {}
              
              worksheet.getCell(obsCellStart).value = observaciones;
              worksheet.getCell(obsCellStart).alignment = { wrapText: true, vertical: "top" };
              worksheet.getCell(obsCellStart).font = { name: "Arial", size: 10, color: { argb: "FF000000" } };
              worksheet.getCell(obsCellStart).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
              
              let currentImgRow = 90;
              if (isTalleres) currentImgRow = 50;
              else if (isCampamento) currentImgRow = 65;
              else if (isInstalacionesElectricas) currentImgRow = 54;
              else if (isCocinaComedor) currentImgRow = 61;
              else if (isLaboratorio) currentImgRow = 44; else if (isBotiquin) currentImgRow = 50; else if (isEstacionEmergencia) currentImgRow = 51;
              
              const badItemsKeys = Object.keys(checklist).filter(k => ['NC', 'X'].includes(checklist[k]));
              if ((data.fotosDefectos && data.fotosDefectos['General'] && data.fotosDefectos['General'].length > 0) || (isEstacionEmergencia && data.evidenciaLevantamiento)) {
                  if (!badItemsKeys.includes('General')) badItemsKeys.push('General');
              }
              let evidenciasMapLocal = {};
              if (data.evidenciaLevantamiento && data.evidenciaLevantamiento.startsWith('{')) {
                  try { evidenciasMapLocal = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
              }
              
              badItemsKeys.forEach((item) => {
                  const photos = data.fotosDefectos ? data.fotosDefectos[item] : null;
                  if ((photos && photos.length > 0) || (item === 'General' && data.evidenciaLevantamiento)) {
                      try { worksheet.mergeCells("B" + currentImgRow + ":G" + currentImgRow); } catch(e){}
                      worksheet.getCell("B" + currentImgRow).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA: " + item;
                      worksheet.getCell("B" + currentImgRow).font = { bold: true, size: 12 };
                      worksheet.getCell("B" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                      
                      if (data.evidenciaLevantamiento || data.comentarioLevantamiento) {
                          try { worksheet.mergeCells("H" + currentImgRow + ":L" + currentImgRow); } catch(e){}
                          worksheet.getCell("H" + currentImgRow).value = "EVIDENCIA DEL LEVANTAMIENTO";
                          worksheet.getCell("H" + currentImgRow).font = { bold: true, size: 12 };
                          worksheet.getCell("H" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                      }
                      currentImgRow += 2;
                      
                      try {
                          const stripB64 = (b64) => b64.substring(b64.indexOf(",") + 1);
                          let colCursor = 1;
                          if (photos && photos.length > 0) {
                              for (let i = 0; i < photos.length; i++) {
                                  if (photos[i] && typeof photos[i] === 'string' && photos[i].length > 50) {
                                      const imgBase64 = stripB64(photos[i]);
                                      const imgId = workbook.addImage({ base64: imgBase64, extension: "jpeg" });
                                      worksheet.addImage(imgId, { tl: { col: colCursor, row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                                      colCursor += 6;
                                      if (colCursor > 13) break; // Max 3 images per row
                                  }
                              }
                          }
                          
                          let matchImgLev = Object.entries(evidenciasMapLocal).find(([k,v]) => k.startsWith(item) && v && v.length > 50);
                          if (matchImgLev) {
                              let imgLev = stripB64(matchImgLev[1]);
                              const imgId2 = workbook.addImage({ base64: imgLev, extension: "jpeg" });
                              worksheet.addImage(imgId2, { tl: { col: Math.max(colCursor, 7), row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                          } else if (item === 'General' && data.evidenciaLevantamiento && !data.evidenciaLevantamiento.startsWith('{')) {
                              let imgLev = stripB64(data.evidenciaLevantamiento);
                              const imgId2 = workbook.addImage({ base64: imgLev, extension: "jpeg" });
                              worksheet.addImage(imgId2, { tl: { col: Math.max(colCursor, 7), row: currentImgRow - 1 }, ext: { width: 320, height: 240 } });
                          }
                      } catch (e) {}
                      currentImgRow += 13;
                  }
              });
              
              let isSingleLevantamiento = false;
              if (data.evidenciaLevantamiento && !data.evidenciaLevantamiento.startsWith('{')) {
                  isSingleLevantamiento = true;
              }
              const checkIsLevantado = (itemKey) => {
                  if (isSingleLevantamiento) return true;
                  const match = Object.entries(evidenciasMapLocal).find(([k,v]) => k.startsWith(itemKey) && v && v.length > 50);
                  return !!match;
              };
              
              const occurrenceTracker = {};
              worksheet.eachRow((row, rowNum) => {
                  const seenInRow = new Set();
                  row.eachCell((cell, colNum) => {
                      let strVal = '';
                      if (typeof cell.value === 'string') strVal = cell.value;
                      else if (cell.value && cell.value.richText) strVal = cell.value.richText.map(rt => rt.text).join('');
                      
                      if (strVal) {
                          const cellText = strVal.trim().replace(/\s+/g, ' ');
                          if (!seenInRow.has(cellText)) {
                              seenInRow.add(cellText);
                              occurrenceTracker[cellText] = (occurrenceTracker[cellText] || 0) + 1;
                          }
                          const expectedKey = cellText + '\u200B'.repeat(occurrenceTracker[cellText] - 1);
                          if (checklist[expectedKey]) {
                              const matchKey = expectedKey;
                              let val = checklist[matchKey];
                              let isLevantado = false;
                              if ((val === 'NC' || val === 'X') && checkIsLevantado(matchKey)) {
                                  isLevantado = true;
                              }
                              if (val === 'OK' || val === 'C' || isLevantado) worksheet.getCell(rowNum, 11).value = 'x';
                              if (val === 'NC' || val === 'X') worksheet.getCell(rowNum, 12).value = 'x';
                              if (val === 'N/A') worksheet.getCell(rowNum, 13).value = 'x';
                          }
                      }
                  });
              });
          }
      }

      // --- MANEJADOR 6: INSPECCIONES DIGITALES GENÉRICAS (Almacén, Escaleras, etc.) ---
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














