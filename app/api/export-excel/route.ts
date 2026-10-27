export const maxDuration = 60;
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { moduleName, answers, template } = data;

    const cleanStr = (s: string) =>
      (s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const normName = cleanStr(moduleName);

    const isCaidas = Boolean(
      data.isCaidasMatrix ||
      normName.includes("caida") ||
      normName.includes("arnes") ||
      normName.includes("017")
    );
    const isEpp = Boolean(
      data.isEppMatrix ||
      (normName.includes("epp") && !isCaidas)
    );
    const isExtintor = Boolean(
      data.isExtinguisherMatrix ||
      normName.includes("extintor") ||
      normName.includes("058") ||
      (normName.includes("emergencia") && !normName.includes("estacion"))
    );
    const isVehiculo = Boolean(
      normName.includes("vehiculo") ||
      normName.includes("camion") ||
      normName.includes("volquete") ||
      normName.includes("010")
    );
    const isMachinery = Boolean(
      data.isMachineryMatrix ||
      normName.includes("maquinaria") ||
      normName.includes("maquina") ||
      normName.includes("015") ||
      normName.includes("linea amarilla") ||
      normName.includes("pesada") ||
      normName.includes("equipos") ||
      isVehiculo
    );
    const isInternas = Boolean(
      data.isInternasMatrix ||
      normName.includes("interna") ||
      normName.includes("073") ||
      (normName.includes("soma") && normName.includes("intern"))
    );
    const isAlmacen = Boolean(data.isAlmacenMatrix || normName.includes("almacen") || normName.includes("028"));
    const isTalleres = Boolean(data.isTalleresMatrix || normName.includes("taller") || normName.includes("079"));
    const isCampamento = Boolean(data.isCampamentoMatrix || normName.includes("campamento") || normName.includes("072"));
    const isInstalacionesElectricas = Boolean(data.isInstalacionesElectricasMatrix || normName.includes("electrica") || normName.includes("075"));
    const isCocinaComedor = Boolean(data.isCocinaComedorMatrix || normName.includes("cocina") || normName.includes("comedor") || normName.includes("074"));
    const isLaboratorio = Boolean(data.isLaboratorioMatrix || normName.includes("laboratorio") || normName.includes("077"));
    const isKitAntiderrame = Boolean(data.isKitAntiderrameMatrix || normName.includes("derrame") || normName.includes("076"));
    const isBotiquin = Boolean(data.isBotiquinesMatrix || normName.includes("botiquin") || normName.includes("030"));
    const isEstacionEmergencia = Boolean(data.isEstacionEmergenciaMatrix || normName.includes("estacion") || normName.includes("008"));
    const isTop = Boolean(data.isTopMatrix || normName.includes("060") || normName.includes("tarjeta") || normName.includes("observacion preventiva") || normName === "top");

    const templateDir = path.join(process.cwd(), "public", "templates", "digital");
    let templatePath = path.join(templateDir, `${moduleName}.xlsx`);

    // Si no existe con el nombre exacto de módulo, resolver por plantilla física oficial
    if (!fs.existsSync(templatePath)) {
      if (isTop) {
        templatePath = path.join(templateDir, "F-SIG-060 Tarj Obs Preventiva de Seguridad V01 07.11.2022.XLSX");
      } else if (isCaidas) {
        templatePath = path.join(templateDir, "Inspección de Equipo contra caídas (arnés, línea de vida, etc.) F-OP-017 INSPECCIÓN DE EQUIPOS CONTRA CAIDA.xlsx");
      } else if (isInternas) {
        const alt = path.join(templateDir, "Inspecciones Internas  de seguridad, saluden el trabajo y medio ambiente (F-SIG-073).xlsx");
        const alt2 = path.join(templateDir, "Inspecciones Internas de seguridad, salud en el trabajo y medio ambiente (F-SIG-073).xlsx");
        templatePath = fs.existsSync(alt) ? alt : (fs.existsSync(alt2) ? alt2 : path.join(templateDir, "Inspecciones Internas SSOMA.xlsx"));
      } else if (isEstacionEmergencia) {
        templatePath = path.join(templateDir, "Inspecciones Estaciones de emergencia (F-SIG-008) INSPECCIÓN DE ESTACIÒN DE PRIMEROS AUXILIOS.xlsx");
      } else if (isKitAntiderrame) {
        templatePath = path.join(templateDir, "Inspección de Kit antiderrames F-SIG-076 INSPECCION DE KIT ANTIDERRAME.xlsx");
      } else if (isBotiquin) {
        templatePath = path.join(templateDir, "Inspecciones botiquines F-SIG-030 INSPECCIÓN DE BOTIQUÍN.xlsx");
      } else if (isExtintor) {
        templatePath = path.join(templateDir, "Inspección de Equipos de Emergencia (Extintores) F-SIG-058 Registro de inspección de equipos de seguridad o emergencia (2).xlsx");
      } else if (isAlmacen) {
        templatePath = path.join(templateDir, "Inspección de almacenes F-SIG-028 Inspeccion Almacén V09.xlsx");
      } else if (isTalleres) {
        templatePath = path.join(templateDir, "Inspección de taller de soldadura mecanico F-SIG-079 Inspección de Talleres V02.xlsx");
      } else if (isCampamento) {
        templatePath = path.join(templateDir, "Inspección de areas de campamento F-SIG-072.xlsx");
      } else if (isInstalacionesElectricas) {
        templatePath = path.join(templateDir, "Inspección de generador, tableros eléctrico F-SIG-075 Inspeccion de Instalaciones Eléctricas V01.xlsx");
      } else if (isCocinaComedor) {
        templatePath = path.join(templateDir, "Inspección de Cocina y comedor F-SIG-074 INSPECCIÓN DE COCINA Y COMEDOR.xlsx");
      } else if (isLaboratorio) {
        templatePath = path.join(templateDir, "Inspeccion de laboratorio F-SIG-077 INSPECCIÓN DE LABORATORIO.xlsx");
      } else if (isVehiculo) {
        templatePath = path.join(templateDir, "Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.) F-OP-010 V02 22.12.16 Vehicul.xlsx");
      } else if (isMachinery) {
        templatePath = path.join(templateDir, "Inspecciones y observaciones maquinaria Línea amarilla (Excavadoras, retro, cargador, tractor, moto niveladora, cisterna de agua.xlsx");
      } else if (isEpp) {
        templatePath = path.join(templateDir, "Inspección de EPP básico o especifico (Cantidad refiere a la cantidad de personas) F-SIG-044 Inspección de EPP V03.xlsx");
      }
    }

    let workbook = new ExcelJS.Workbook();
    const topMarkedOvals = new Set<string>();
    let topHasActo = false;
    let topHasCondicion = false;


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
            let img1 = (kit.fotosDefectos && kit.fotosDefectos.length > 0) ? stripB64(kit.fotosDefectos[0]) : null;
            let imgLev = null;
            if (data.evidenciaLevantamiento) {
                if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.startsWith('{')) {
                    try {
                        const map = JSON.parse(data.evidenciaLevantamiento);
                        const matchKey = Object.keys(map).find(k => k.includes(kit.codigo || 'S/N') || (kit.ubicacion && k.includes(kit.ubicacion)));
                        if (matchKey && map[matchKey] && map[matchKey].length > 50) {
                            imgLev = stripB64(map[matchKey]);
                        }
                    } catch(e) {}
                } else if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.length > 50) {
                    imgLev = stripB64(data.evidenciaLevantamiento);
                }
            }

            if (img1 || imgLev) {
                worksheet.getCell("B" + currentImgRow).value = `EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA (Kit: ${kit.codigo || 'S/N'}):`;
                worksheet.getCell("B" + currentImgRow).font = { bold: true, size: 12 };
                worksheet.getCell("B" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                
                try { worksheet.mergeCells("J" + currentImgRow + ":P" + currentImgRow); } catch(e){}
                worksheet.getCell("J" + currentImgRow).value = "REGISTROS FOTOGRÁFICOS DEL LEVANTAMIENTO:";
                worksheet.getCell("J" + currentImgRow).font = { bold: true, size: 12 };
                worksheet.getCell("J" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };

                currentImgRow += 2;
                
                try {
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

        // Evidencia fotográfica a partir de la fila 32 (condición insegura a la izquierda, levantamiento en paralelo a la derecha)
        const stripB64 = (b64: string) => b64.includes(",") ? b64.substring(b64.indexOf(",") + 1) : b64;
        const getB64Ext = (b64: string): 'png' | 'jpeg' => (b64 && b64.includes('image/png')) ? 'png' : 'jpeg';

        // 1. Extraer mapa de levantamiento (si existe)
        const getWorkerLevantamiento = (workerName: string): { img: string | null; comment: string | null } => {
            if (!data.evidenciaLevantamiento) return { img: null, comment: data.comentarioLevantamiento || null };
            let img: string | null = null;
            let comment: string | null = data.comentarioLevantamiento || null;

            if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.startsWith('{')) {
                try {
                    const map = JSON.parse(data.evidenciaLevantamiento);
                    const cleanName = workerName.trim().toLowerCase();
                    const matchK = Object.keys(map).find(k => cleanName && (k.toLowerCase().includes(cleanName) || cleanName.includes(k.toLowerCase())));
                    img = matchK ? map[matchK] : (Object.values(map)[0] as string);
                } catch(e) {}
            } else if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.length > 50) {
                img = data.evidenciaLevantamiento;
            }

            if (typeof data.comentarioLevantamiento === 'string' && data.comentarioLevantamiento.startsWith('{')) {
                try {
                    const comMap = JSON.parse(data.comentarioLevantamiento);
                    const cleanName = workerName.trim().toLowerCase();
                    const matchK = Object.keys(comMap).find(k => cleanName && (k.toLowerCase().includes(cleanName) || cleanName.includes(k.toLowerCase())));
                    comment = matchK ? comMap[matchK] : (Object.values(comMap)[0] as string);
                } catch(e) {}
            }

            return { img, comment };
        };

        // 2. Construir lista unificada de pares de fotos (Observación vs Levantamiento)
        interface EppPhotoEntry {
            workerName: string;
            obsTitle: string;
            obsImg: string | null;
            levImg: string | null;
            levComment: string | null;
        }
        const photoEntries: EppPhotoEntry[] = [];

        // De trabajadores evaluados
        workers.forEach((w: any, idx: number) => {
            const obsPhoto = w.fotoEvidencia || w.foto || w.photo || w.evidencia || null;
            const wName = w.name?.trim() || `Trabajador ${idx + 1}`;
            const badStr = Array.isArray(w.badEpps) && w.badEpps.length > 0 ? w.badEpps.join(", ") : "";
            const { img: levImg, comment: levComment } = getWorkerLevantamiento(wName);

            if (obsPhoto || levImg || badStr) {
                photoEntries.push({
                    workerName: wName,
                    obsTitle: `${wName}${w.role ? ` (${w.role})` : ''}: ${badStr || 'EPP observado'}`,
                    obsImg: obsPhoto,
                    levImg: levImg,
                    levComment: levComment
                });
            }
        });

        // De fotosDefectos si vinieron fotos adicionales
        if (data.fotosDefectos && typeof data.fotosDefectos === 'object') {
            for (const [key, val] of Object.entries(data.fotosDefectos)) {
                const photos = Array.isArray(val) ? val : [val];
                photos.forEach((ph: any) => {
                    if (typeof ph === 'string' && ph.length > 50) {
                        const alreadyExists = photoEntries.some(e => e.obsImg === ph);
                        if (!alreadyExists) {
                            const { img: levImg, comment: levComment } = getWorkerLevantamiento(key);
                            photoEntries.push({
                                workerName: key,
                                obsTitle: key,
                                obsImg: ph,
                                levImg: levImg,
                                levComment: levComment
                            });
                        }
                    }
                });
            }
        }

        // Si sólo hay levantamiento y ninguna foto de trabajador
        if (photoEntries.length === 0 && data.evidenciaLevantamiento) {
            const { img: levImg, comment: levComment } = getWorkerLevantamiento("");
            if (levImg) {
                photoEntries.push({
                    workerName: "Levantamiento general",
                    obsTitle: "Condición observada",
                    obsImg: null,
                    levImg: levImg,
                    levComment: levComment
                });
            }
        }

        // 3. Renderizar a partir de la fila 32 con condición insegura a la izquierda y levantamiento a la derecha
        if (photoEntries.length > 0) {
            // Fila 32: Encabezados en paralelo
            worksheet.mergeCells("B32:L32");
            const headerLeft = worksheet.getCell("B32");
            headerLeft.value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA";
            headerLeft.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
            headerLeft.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
            headerLeft.alignment = { horizontal: "center", vertical: "middle" };

            worksheet.mergeCells("T32:AD32");
            const headerRight = worksheet.getCell("T32");
            headerRight.value = "EVIDENCIA FOTOGRÁFICA DEL LEVANTAMIENTO";
            headerRight.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
            headerRight.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
            headerRight.alignment = { horizontal: "center", vertical: "middle" };

            worksheet.getRow(32).height = 24;

            let currentImgRow = 33;

            photoEntries.forEach((entry) => {
                // Títulos individuales de la fila
                worksheet.mergeCells(`B${currentImgRow}:L${currentImgRow}`);
                const cellTitleLeft = worksheet.getCell(`B${currentImgRow}`);
                cellTitleLeft.value = entry.obsTitle;
                cellTitleLeft.font = { bold: true, size: 9 };
                cellTitleLeft.alignment = { horizontal: "left", vertical: "middle" };

                worksheet.mergeCells(`T${currentImgRow}:AD${currentImgRow}`);
                const cellTitleRight = worksheet.getCell(`T${currentImgRow}`);
                cellTitleRight.value = entry.levComment ? `Subsanado: ${entry.levComment}` : (entry.levImg ? "Levantamiento subsanado" : "Pendiente de subsanación");
                cellTitleRight.font = { bold: true, size: 9 };
                cellTitleRight.alignment = { horizontal: "left", vertical: "middle" };

                worksheet.getRow(currentImgRow).height = 20;

                const photoRowIndex = currentImgRow; // 0-indexed row for addImage (row currentImgRow + 1 in Excel)

                // Foto de la Observación (Columna B = col 1)
                if (entry.obsImg && entry.obsImg.length > 50) {
                    try {
                        const ext = getB64Ext(entry.obsImg);
                        const imgId = workbook.addImage({ base64: stripB64(entry.obsImg), extension: ext });
                        worksheet.addImage(imgId, {
                            tl: { col: 1, row: photoRowIndex },
                            ext: { width: 320, height: 240 }
                        });
                    } catch(e) {
                        console.error("Error embedding EPP obs photo:", e);
                    }
                }

                // Foto del Levantamiento (Columna T = col 19, PARALELO)
                if (entry.levImg && entry.levImg.length > 50) {
                    try {
                        const ext = getB64Ext(entry.levImg);
                        const levId = workbook.addImage({ base64: stripB64(entry.levImg), extension: ext });
                        worksheet.addImage(levId, {
                            tl: { col: 19, row: photoRowIndex },
                            ext: { width: 320, height: 240 }
                        });
                    } catch(e) {
                        console.error("Error embedding EPP lev photo:", e);
                    }
                }

                currentImgRow += 14;
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
    // --- MANEJADOR EPP CONTRA CAÍDAS (ARNÉS, LÍNEA DE VIDA - Calibrado a F-OP-017) ---
    else if (isCaidas) {
      const meta = data.meta || data.answers || {};
      const rawItems = data.items || data.template || data.workers || [];
      const items: any[] = Array.isArray(rawItems) ? rawItems : [];
      const firmas = data.firmas || meta.firmas || {};

      if (fs.existsSync(templatePath)) {
        worksheet.getCell("A1").value = "";

        // Reinsertar logo oficial si existe
        try {
          const logoPath = path.join(process.cwd(), "public", "templates", "digital", "official_casa_logo.jpg");
          if (fs.existsSync(logoPath)) {
            const logoId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "jpeg" });
            worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 45 } });
          }
        } catch (e) {}

        // 1. Datos Generales de Encabezado (F-OP-017)
        // C4: Proyecto
        worksheet.getCell("C4").value = meta.proyecto || "RED VIAL 6";
        worksheet.getCell("C4").alignment = { vertical: "middle", horizontal: "left" };

        // D5: Área de Trabajo
        worksheet.getCell("D5").value = meta.area || "";
        worksheet.getCell("D5").alignment = { vertical: "middle", horizontal: "left" };

        // M5: Fecha
        worksheet.getCell("M5").value = meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("M5").alignment = { vertical: "middle", horizontal: "center" };

        // P5: Hora
        worksheet.getCell("P5").value = meta.hora || new Date().toTimeString().substring(0, 5);
        worksheet.getCell("P5").alignment = { vertical: "middle", horizontal: "center" };

        // F6: Inspeccionado por Jefe de Grupo / Cargo / Firma
        const inspectorText = (meta.inspeccionadoPor || meta.inspector || "") + (meta.cargoInspector ? " - " + meta.cargoInspector : "");
        worksheet.getCell("F6").value = inspectorText;
        worksheet.getCell("F6").alignment = { vertical: "middle", horizontal: "left" };

        // F25: Verificado por Responsable de SSMA
        worksheet.getCell("F25").value = meta.verificadoPor || meta.responsableSSMA || meta.supervisor || "";
        worksheet.getCell("F25").alignment = { vertical: "middle", horizontal: "left" };

        // Firmas
        const firmaInspector = firmas.inspector || meta.firmaInspector || meta.firmaJefeGrupo;
        if (firmaInspector && firmaInspector.length > 50) {
          try {
            const ext = getB64Ext(firmaInspector);
            const fId = workbook.addImage({ base64: stripB64(firmaInspector), extension: ext });
            worksheet.addImage(fId, { tl: { col: 12, row: 5 }, ext: { width: 140, height: 45 } });
          } catch (e) {}
        }

        const firmaVerificador = firmas.verificador || meta.firmaVerificador || meta.firmaSupervisor || firmas.supervisor;
        if (firmaVerificador && firmaVerificador.length > 50) {
          try {
            const ext = getB64Ext(firmaVerificador);
            const fId2 = workbook.addImage({ base64: stripB64(firmaVerificador), extension: ext });
            worksheet.addImage(fId2, { tl: { col: 12, row: 24 }, ext: { width: 140, height: 45 } });
          } catch (e) {}
        }

        // 2. Llenado de Filas de Inspección (Filas 10 a 19 - máx 10 items o dinámico)
        // Col A (1): N°
        // Col B (2, merge B:F): TRABAJADOR
        // Col G (7): ARNÉS (A) / LÍNEA (L)
        // Col H (8): CÓDIGO
        // Col I (9): CORREAS
        // Col J (10): COSTURAS
        // Col K (11): ANILLOS EN "D"
        // Col L (12): MOSQUETONES
        // Col M (13): HEBILLAS
        // Col N (14): GATILLO
        // Col O (15, merge O:Q): OBSERVACIONES
        const startRow = 10;
        const maxTemplateRows = 10;
        const count = Math.max(items.length, maxTemplateRows);

        for (let i = 0; i < count; i++) {
          const rowNum = startRow + i;
          const it = items[i];
          if (!it && i >= maxTemplateRows) break;

          worksheet.getCell(`A${rowNum}`).value = i + 1;
          worksheet.getCell(`A${rowNum}`).alignment = { horizontal: "center", vertical: "middle" };

          if (it) {
            worksheet.getCell(`B${rowNum}`).value = it.trabajador || "";
            worksheet.getCell(`B${rowNum}`).alignment = { horizontal: "left", vertical: "middle" };

            worksheet.getCell(`G${rowNum}`).value = (it.tipo || "A").toUpperCase();
            worksheet.getCell(`G${rowNum}`).alignment = { horizontal: "center", vertical: "middle" };

            worksheet.getCell(`H${rowNum}`).value = it.codigo || "";
            worksheet.getCell(`H${rowNum}`).alignment = { horizontal: "center", vertical: "middle" };

            const setCriteria = (colLetter: string, val: string | undefined) => {
              const cell = worksheet.getCell(`${colLetter}${rowNum}`);
              const v = (val || "V").toUpperCase();
              cell.value = v;
              cell.alignment = { horizontal: "center", vertical: "middle" };
              if (v === "X") {
                cell.font = { bold: true, color: { argb: "FFDC2626" } };
              } else {
                cell.font = { bold: true, color: { argb: "FF16A34A" } };
              }
            };

            setCriteria("I", it.correas);
            setCriteria("J", it.costuras);
            setCriteria("K", it.anillos);
            setCriteria("L", it.mosquetones);
            setCriteria("M", it.hebillas);
            setCriteria("N", it.gatillo);

            worksheet.getCell(`O${rowNum}`).value = it.observaciones || "";
            worksheet.getCell(`O${rowNum}`).alignment = { horizontal: "left", vertical: "middle" };
          }
        }

        // 3. Extracción de pares de Fotos (Observación vs Levantamiento)
        const getCaidasLevantamiento = (key: string): { img: string | null; comment: string | null } => {
          if (!data.evidenciaLevantamiento) return { img: null, comment: data.comentarioLevantamiento || null };
          let img: string | null = null;
          let comment: string | null = data.comentarioLevantamiento || null;

          if (typeof data.evidenciaLevantamiento === "string" && data.evidenciaLevantamiento.startsWith("{")) {
            try {
              const map = JSON.parse(data.evidenciaLevantamiento);
              const cleanKey = key.trim().toLowerCase();
              const matchK = Object.keys(map).find(
                (k) => cleanKey && (k.toLowerCase().includes(cleanKey) || cleanKey.includes(k.toLowerCase()))
              );
              img = matchK ? map[matchK] : (Object.values(map)[0] as string);
            } catch (e) {}
          } else if (typeof data.evidenciaLevantamiento === "string" && data.evidenciaLevantamiento.length > 50) {
            img = data.evidenciaLevantamiento;
          }

          if (typeof data.comentarioLevantamiento === "string" && data.comentarioLevantamiento.startsWith("{")) {
            try {
              const comMap = JSON.parse(data.comentarioLevantamiento);
              const cleanKey = key.trim().toLowerCase();
              const matchK = Object.keys(comMap).find(
                (k) => cleanKey && (k.toLowerCase().includes(cleanKey) || cleanKey.includes(k.toLowerCase()))
              );
              comment = matchK ? comMap[matchK] : (Object.values(comMap)[0] as string);
            } catch (e) {}
          }

          return { img, comment };
        };

        interface CaidasPhotoEntry {
          key: string;
          obsTitle: string;
          obsImg: string | null;
          levImg: string | null;
          levComment: string | null;
        }
        const photoEntries: CaidasPhotoEntry[] = [];

        // Extraer fotos de los ítems de inspección
        items.forEach((it: any, idx: number) => {
          const defCriteria: string[] = [];
          if (it.correas === "X") defCriteria.push("Correas");
          if (it.costuras === "X") defCriteria.push("Costuras");
          if (it.anillos === "X") defCriteria.push('Anillos en "D"');
          if (it.mosquetones === "X") defCriteria.push("Mosquetones");
          if (it.hebillas === "X") defCriteria.push("Hebillas");
          if (it.gatillo === "X") defCriteria.push("Gatillo");

          const hasDefect = defCriteria.length > 0;
          const itKey = `${it.trabajador || "Trabajador " + (idx + 1)} [${it.tipo === "A" ? "Arnés" : "Línea"} ${it.codigo || ""}]`;
          const obsPhoto = it.fotoEvidencia || it.evidencia || it.foto || null;
          const { img: levImg, comment: levComment } = getCaidasLevantamiento(itKey);

          if (obsPhoto || levImg || hasDefect) {
            photoEntries.push({
              key: itKey,
              obsTitle: `${itKey}: ${hasDefect ? "Defecto en " + defCriteria.join(", ") : "Observación"} ${it.observaciones ? "(" + it.observaciones + ")" : ""}`,
              obsImg: obsPhoto,
              levImg: levImg,
              levComment: levComment,
            });
          }
        });

        // Extraer fotos de fotosDefectos si vinieron por separado
        if (data.fotosDefectos && typeof data.fotosDefectos === "object") {
          for (const [key, val] of Object.entries(data.fotosDefectos)) {
            const photos = Array.isArray(val) ? val : [val];
            photos.forEach((ph: any) => {
              if (typeof ph === "string" && ph.length > 50) {
                const already = photoEntries.some((e) => e.obsImg === ph);
                if (!already) {
                  const { img: levImg, comment: levComment } = getCaidasLevantamiento(key);
                  photoEntries.push({
                    key,
                    obsTitle: key,
                    obsImg: ph,
                    levImg,
                    levComment,
                  });
                }
              }
            });
          }
        }

        // Si sólo hay evidencia de levantamiento sin fotos de ítems
        if (photoEntries.length === 0 && data.evidenciaLevantamiento) {
          const { img: levImg, comment: levComment } = getCaidasLevantamiento("");
          if (levImg) {
            photoEntries.push({
              key: "Levantamiento general",
              obsTitle: "Condición observada",
              obsImg: null,
              levImg,
              levComment,
            });
          }
        }

        // 4. Renderizar a partir de la fila 28 en paralelo: Observación izquierda | Levantamiento derecha
        if (photoEntries.length > 0) {
          worksheet.mergeCells("B28:H28");
          const headerLeft = worksheet.getCell("B28");
          headerLeft.value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA";
          headerLeft.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
          headerLeft.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
          headerLeft.alignment = { horizontal: "center", vertical: "middle" };

          worksheet.mergeCells("J28:P28");
          const headerRight = worksheet.getCell("J28");
          headerRight.value = "EVIDENCIA FOTOGRÁFICA DEL LEVANTAMIENTO";
          headerRight.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
          headerRight.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
          headerRight.alignment = { horizontal: "center", vertical: "middle" };

          worksheet.getRow(28).height = 24;

          let currentImgRow = 29;

          photoEntries.forEach((entry) => {
            // Título individual fila izquierda
            worksheet.mergeCells(`B${currentImgRow}:H${currentImgRow}`);
            const cellTitleLeft = worksheet.getCell(`B${currentImgRow}`);
            cellTitleLeft.value = entry.obsTitle;
            cellTitleLeft.font = { bold: true, size: 9 };
            cellTitleLeft.alignment = { horizontal: "left", vertical: "middle" };

            // Título individual fila derecha
            worksheet.mergeCells(`J${currentImgRow}:P${currentImgRow}`);
            const cellTitleRight = worksheet.getCell(`J${currentImgRow}`);
            cellTitleRight.value = entry.levComment
              ? `Subsanado: ${entry.levComment}`
              : entry.levImg
                ? "Levantamiento subsanado"
                : "Pendiente de subsanación";
            cellTitleRight.font = { bold: true, size: 9 };
            cellTitleRight.alignment = { horizontal: "left", vertical: "middle" };

            worksheet.getRow(currentImgRow).height = 20;

            const photoRowIndex = currentImgRow; // 0-indexed row for addImage

            // Foto Observación (Columna B = col 1)
            if (entry.obsImg && entry.obsImg.length > 50) {
              try {
                const ext = getB64Ext(entry.obsImg);
                const imgId = workbook.addImage({ base64: stripB64(entry.obsImg), extension: ext });
                worksheet.addImage(imgId, {
                  tl: { col: 1, row: photoRowIndex },
                  ext: { width: 320, height: 240 },
                });
              } catch (e) {
                console.error("Error embedding Caidas obs photo:", e);
              }
            }

            // Foto Levantamiento (Columna J = col 9)
            if (entry.levImg && entry.levImg.length > 50) {
              try {
                const ext = getB64Ext(entry.levImg);
                const levId = workbook.addImage({ base64: stripB64(entry.levImg), extension: ext });
                worksheet.addImage(levId, {
                  tl: { col: 9, row: photoRowIndex },
                  ext: { width: 320, height: 240 },
                });
              } catch (e) {
                console.error("Error embedding Caidas lev photo:", e);
              }
            }

            currentImgRow += 14;
          });
        }
      } else {
        // Fallback genérico si no se encuentra la plantilla F-OP-017
        worksheet.mergeCells("A1:G2");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "INSPECCIÓN DE EQUIPO CONTRA CAÍDAS (F-OP-017)";
        titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD97706" } };

        worksheet.getCell("A4").value = "Proyecto:";
        worksheet.getCell("B4").value = meta.proyecto || "RED VIAL 6";
        worksheet.getCell("D4").value = "Fecha:";
        worksheet.getCell("E4").value = meta.fecha || new Date().toISOString().split("T")[0];
        worksheet.getCell("A5").value = "Inspeccionado por:";
        worksheet.getCell("B5").value = meta.inspeccionadoPor || meta.inspector || "";
        worksheet.getCell("D5").value = "Área:";
        worksheet.getCell("E5").value = meta.area || "";

        const headers = ["N°", "Trabajador", "Tipo", "Código", "Correas", "Costuras", 'Anillos "D"', "Mosquetones", "Hebillas", "Gatillo", "Observaciones"];
        const headerRow = worksheet.getRow(8);
        headers.forEach((h, idx) => {
          const cell = headerRow.getCell(idx + 1);
          cell.value = h;
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
        });

        items.forEach((it: any, idx: number) => {
          const r = worksheet.getRow(9 + idx);
          r.getCell(1).value = idx + 1;
          r.getCell(2).value = it.trabajador || "";
          r.getCell(3).value = it.tipo || "";
          r.getCell(4).value = it.codigo || "";
          r.getCell(5).value = it.correas || "V";
          r.getCell(6).value = it.costuras || "V";
          r.getCell(7).value = it.anillos || "V";
          r.getCell(8).value = it.mosquetones || "V";
          r.getCell(9).value = it.hebillas || "V";
          r.getCell(10).value = it.gatillo || "V";
          r.getCell(11).value = it.observaciones || "";
        });
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
          let levPhotoRow = Math.max(currentPhotoRow + 1, sigDataRow + 3);
          
          worksheet.getCell(`D${levPhotoRow}`).value = "REGISTRO DE LEVANTAMIENTO:";
          worksheet.getCell(`D${levPhotoRow}`).font = { bold: true };
          levPhotoRow += 2;
          
          if (data.comentarioLevantamiento && !data.comentarioLevantamiento.startsWith('{')) {
            worksheet.getCell(`D${levPhotoRow}`).value = `Comentario: ${data.comentarioLevantamiento}`;
            levPhotoRow += 2;
          }

          let extLevMap: Record<string, string> = {};
          if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.startsWith('{')) {
            try { extLevMap = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
          } else if (typeof data.evidenciaLevantamiento === 'object') {
            extLevMap = data.evidenciaLevantamiento;
          }

          if (Object.keys(extLevMap).length > 0) {
            Object.entries(extLevMap).forEach(([k, b64]) => {
              if (b64 && typeof b64 === 'string' && b64.length > 50) {
                try {
                  worksheet.getCell(`D${levPhotoRow}`).value = `Levantamiento: ${k}`;
                  worksheet.getCell(`D${levPhotoRow}`).font = { bold: true };
                  levPhotoRow += 1;
                  const cleanB64 = b64.replace(/^data:image\/\w+;base64,/, "");
                  const imageId = workbook.addImage({ base64: cleanB64, extension: "png" });
                  worksheet.addImage(imageId, {
                    tl: { col: 3, row: levPhotoRow - 1 },
                    ext: { width: 300, height: 220 },
                  });
                  levPhotoRow += 13;
                } catch(e) {
                  console.error("Error attaching individual levantamiento photo:", e);
                }
              }
            });
          } else if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.length > 50) {
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
              levPhotoRow += 13;
            } catch (e) {
              console.error("Error attaching levantamiento photo:", e);
            }
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
      const checklist = data.checklist || (typeof data.template === 'object' && !Array.isArray(data.template) ? data.template : (data.answers?.checklist || {}));
      const observaciones = data.observaciones || (data.answers && data.answers.observaciones) || "";
      const firmas = data.firmas || meta.firmas || (data.answers && data.answers.firmas) || {};

      
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
          const setIfFound = (label: string, val: any, rowOffset: number = 0, colOffset: number = 1) => {
              for (let i = 1; i <= 100; i++) {
                  const r = worksheet.getRow(i);
                  let foundCol = -1;
                  r.eachCell((cell, colN) => {
                      if (cell.value) {
                          let t = '';
                          const cv: any = cell.value;
                          if (cv && cv.richText) t = cv.richText.map((rt: any) => rt.text).join('').trim();
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
          
          let opSigned = false;
          let capSigned = false;

          for (let i = 60; i <= 106; i++) {
              const r = worksheet.getRow(i);
              r.eachCell((cell, colN) => {
                  if (cell.value) {
                      const cv: any = cell.value;
                      const text: string = cv?.richText ? cv.richText.map((rt: any) => rt.text).join('').trim() : (cv ? cv.toString().trim() : '');
                      
                      // Bloque Operador / Colaborador (Filas 69 en Vehículos o 83 en Maquinaria)
                      if (!opSigned && (text.includes('Nombre y Firma del Operador') || text.includes('Nombre y Firma del Colaborador'))) {
                          const targetCell = r.getCell(10);
                          targetCell.value = opName || "";
                          targetCell.font = { bold: true, size: 10 };
                          targetCell.alignment = { vertical: 'middle', horizontal: 'left' };

                          if (firmas.operadorFirma) {
                              try {
                                  const imgId = workbook.addImage({ base64: firmas.operadorFirma.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
                                  worksheet.addImage(imgId, { tl: { col: 17, row: i - 1 + 0.1 }, ext: { width: 140, height: 36 } });
                              } catch(e) {}
                          }
                          opSigned = true;
                      } 
                      // Bloque Capataz / Responsable SSMA (Filas 70 en Vehículos o 84 en Maquinaria)
                      else if (!capSigned && text.includes('Nombre y Firma del Capataz')) {
                          const targetCell = r.getCell(10);
                          targetCell.value = capName || "";
                          targetCell.font = { bold: true, size: 10 };
                          targetCell.alignment = { vertical: 'middle', horizontal: 'left' };

                          if (firmas.capatazFirma) {
                              try {
                                  const imgId = workbook.addImage({ base64: firmas.capatazFirma.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
                                  worksheet.addImage(imgId, { tl: { col: 17, row: i - 1 + 0.1 }, ext: { width: 140, height: 36 } });
                              } catch(e) {}
                          }
                          capSigned = true;
                      }
                  }
              });
          }

          // Para Maquinaria Pesada: llenar también la firma inferior de Parte Diario (Fila 104) si existe
          if (!isVehiculo) {
              try {
                  const r104 = worksheet.getRow(104);
                  if (opName && !r104.getCell(1).value) {
                      r104.getCell(1).value = opName;
                      r104.getCell(1).font = { bold: true, size: 9 };
                      r104.getCell(1).alignment = { horizontal: 'center', vertical: 'bottom' };
                      if (firmas.operadorFirma) {
                          const imgId = workbook.addImage({ base64: firmas.operadorFirma.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
                          worksheet.addImage(imgId, { tl: { col: 2.5, row: 103.1 }, ext: { width: 110, height: 32 } });
                      }
                  }
                  if (capName && !r104.getCell(10).value) {
                      r104.getCell(10).value = capName;
                      r104.getCell(10).font = { bold: true, size: 9 };
                      r104.getCell(10).alignment = { horizontal: 'center', vertical: 'bottom' };
                      if (firmas.capatazFirma) {
                          const imgId = workbook.addImage({ base64: firmas.capatazFirma.replace(/^data:image\/\w+;base64,/, ""), extension: "png" });
                          worksheet.addImage(imgId, { tl: { col: 11.5, row: 103.1 }, ext: { width: 110, height: 32 } });
                      }
                  }
              } catch(e) {}
          }

          // Llenar checklist
          const headersToExclude = new Set([
              'MAQUINARIA PESADA EN GENERAL', 'TRACTOR DE ORUGA', 'EXCAVADORAS', 'RETROEXCAVADORAS',
              'RODILLO COMPACTADOR / TANDEM', 'MOTONIVELADORA', 'MINICARGADOR', 'CARGADOR FRONTAL',
              'FRESADORA', 'ESPARCIDOR DE ASFALTO', 'PAVIMENTADORA', 'CAMIÓN IMPRIMADOR', 'DISTRIBUIDOR DE ASFALTO',
              'RODILLO NEUMÁTICO', 'CHASIS', 'NEUMÁTICOS', 'ACCESO', 'CABINA OPERADOR', 'SEGURIDAD',
              'FUGAS DE FLUIDO', 'NIVELES DE FLUIDO', 'IMPLEMENTO', 'IMPLEMENTO DELANTERO', 'IMPLEMENTO POSTERIOR',
              'TREN DE RODAMIENTO', 'TAMBOR DE FRESADO', 'INSTALACIÓN DE ROCIO', 'CINTA TRANSPORTADORA',
              'CAMIONETAS', 'TRANSPORTE PERSONAL', 'CISTERNA DE AGUA', 'CISTERNA DE COMBUSTIBLE',
              'CAMIONES BARANDA', 'CAMIONES VOLQUETES', 'TRACTO', 'CAMIONES LUBRICADORES', 'SEMIREMOLQUE',
              'VEHÍCULO EN GENERAL', 'OK', 'R', 'M', 'F', 'N/A', 'RESUM', 'FUGA'
          ]);

          const maxChecklistRow = isVehiculo ? 60 : 73;

          for (let i = 14; i <= maxChecklistRow; i++) {
              const r = worksheet.getRow(i);
              r.eachCell((cell, colN) => {
                  // Only process the exact columns where item text resides!
                  if (colN !== 2 && colN !== 11 && colN !== 20) return;
                  
                  if (cell.value) {
                      const cv: any = cell.value;
                      const text: string = cv?.richText ? cv.richText.map((rt: any) => rt.text).join('').trim() : (cv ? cv.toString().trim() : '');
                      
                      if (!text) return;

                      // Si la columna siguiente NO está vacía (contiene 'OK', 'RESUM', 'N/A' o texto de cabecera combinada),
                      // significa que esta fila es una CABECERA DE SECCIÓN o TÍTULO DE EQUIPO y NUNCA debe marcarse con 'X'.
                      const nextCellVal: any = r.getCell(colN + 1).value;
                      const nextText: string = nextCellVal?.richText ? nextCellVal.richText.map((rt: any) => rt.text).join('').trim() : (nextCellVal ? nextCellVal.toString().trim() : '');
                      
                      if (nextText !== '') return;

                      // Filtro de títulos y encabezados de tabla
                      if (headersToExclude.has(text.toUpperCase())) return;

                      // Mapeo de duplicados a llaves únicas usadas en el formulario digital
                      let lookupText = text;
                      if (isVehiculo) {
                          if (lookupText === 'Combustible') {
                              if (i >= 49 && i <= 53) lookupText = 'Combustible (Fugas)';
                              else lookupText = 'Combustible (Niveles)';
                          }
                          if (lookupText === 'Asientos') {
                              if (colN === 11) lookupText = 'Asientos (Personal)';
                          }
                      }
                      
                      const val = checklist[lookupText] || checklist[text] || 'N/A';
                      const isFuga = isVehiculo ? (colN === 2 && i >= 49 && i <= 53) : (colN === 2 && i >= 38 && i <= 46);

                      let offset = -1;
                      if (isFuga) {
                          // Sección Fugas: Columna N/A = +1, RESUM = +2, FUGA = +3
                          if (val === 'N/A') offset = 1;
                          else if (val === 'RESUM') offset = 2;
                          else if (val === 'FUGA') offset = 3;
                      } else {
                          // Sección Estándar: OK = +1, R = +2, M = +3, F = +4, N/A = +5
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
              });
          }

          // Llenar observaciones
          for (let i = 60; i <= 100; i++) {
              const r = worksheet.getRow(i);
              let found = false;
              r.eachCell((cell, colN) => {
                  let text = '';
                  if (cell.value) {
                      const cv: any = cell.value;
                      if (cv && cv.richText) text = cv.richText.map((rt: any) => rt.text).join('');
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
          let currentImgRow = 106; // A partir de la fila 106 (debajo de firmas y parte diario)

          const cleanKey = (s: string) => {
              if (!s) return '';
              return s.replace(/^[\s\-\•\*\(\)\d\.\:\[\]]+/, '')
                      .replace(/\s*\((?:[RMF]|RESUM|FUGA)\)\s*$/i, '')
                      .replace(/\s*\(en caso aplique\)\s*/i, '')
                      .replace(/[\u200B]/g, '')
                      .trim()
                      .toLowerCase();
          };

          const matchItemKeys = (itemA: string, itemB: string) => {
              const cA = cleanKey(itemA);
              const cB = cleanKey(itemB);
              if (!cA || !cB) return false;
              return cA === cB || cA.includes(cB) || cB.includes(cA);
          };

          const allFotosDefectos: Record<string, string[]> = {
              ...(data.answers?.fotosDefectos || {}),
              ...(meta.fotosDefectos || {}),
              ...(data.fotosDefectos || {})
          };

          let evidenciasMapLocal: Record<string, string> = {};
          let singleLevantamientoB64: string | null = null;
          if (data.evidenciaLevantamiento) {
              if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.startsWith('{')) {
                  try { evidenciasMapLocal = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
              } else if (typeof data.evidenciaLevantamiento === 'object') {
                  evidenciasMapLocal = data.evidenciaLevantamiento;
              } else if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.length > 50) {
                  singleLevantamientoB64 = data.evidenciaLevantamiento;
              }
          }

          let comentariosMapLocal: Record<string, string> = {};
          let singleComentario: string = "";
          if (data.comentarioLevantamiento) {
              if (typeof data.comentarioLevantamiento === 'string' && data.comentarioLevantamiento.startsWith('{')) {
                  try { comentariosMapLocal = JSON.parse(data.comentarioLevantamiento); } catch(e) {}
              } else if (typeof data.comentarioLevantamiento === 'object') {
                  comentariosMapLocal = data.comentarioLevantamiento;
              } else {
                  singleComentario = data.comentarioLevantamiento;
              }
          }

          // 1. Obtener items con defectos desde checklist
          const badItemsKeys = Object.keys(checklist).filter(k => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(checklist[k]));
          const itemsToRender: string[] = [...badItemsKeys];

          // 2. Agregar items de allFotosDefectos que no estén aún en itemsToRender
          Object.keys(allFotosDefectos).forEach(fdKey => {
              const already = itemsToRender.some(it => matchItemKeys(it, fdKey));
              if (!already && allFotosDefectos[fdKey] && allFotosDefectos[fdKey].length > 0) {
                  itemsToRender.push(fdKey);
              }
          });

          // 3. Agregar items de evidenciasMapLocal que no estén aún en itemsToRender
          Object.keys(evidenciasMapLocal).forEach(evKey => {
              const already = itemsToRender.some(it => matchItemKeys(it, evKey));
              if (!already && evidenciasMapLocal[evKey] && evidenciasMapLocal[evKey].length > 50) {
                  itemsToRender.push(evKey);
              }
          });

          // 4. Fallback si no hay items específicos pero sí hay evidencia única
          if (itemsToRender.length === 0 && (singleLevantamientoB64 || Object.keys(allFotosDefectos).length > 0)) {
              itemsToRender.push("Observación General");
          }

          itemsToRender.forEach((item) => {
              // Buscar fotos originales de la condición insegura
              let photos: string[] = allFotosDefectos[item] || [];
              if (!photos || photos.length === 0) {
                  const m = Object.entries(allFotosDefectos).find(([k, v]) => matchItemKeys(k, item) && Array.isArray(v) && v.length > 0);
                  if (m) photos = m[1];
              }

              // Buscar foto del levantamiento
              let imgLev: string | null = null;
              if (Object.keys(evidenciasMapLocal).length > 0) {
                  if (evidenciasMapLocal[item] && evidenciasMapLocal[item].length > 50) {
                      imgLev = evidenciasMapLocal[item];
                  } else {
                      const m = Object.entries(evidenciasMapLocal).find(([k, v]) => matchItemKeys(k, item) && typeof v === 'string' && v.length > 50);
                      if (m) imgLev = m[1];
                  }
              } else if (singleLevantamientoB64) {
                  imgLev = singleLevantamientoB64;
              }

              // Buscar comentario del levantamiento
              let levComment = "";
              if (Object.keys(comentariosMapLocal).length > 0) {
                  if (comentariosMapLocal[item]) {
                      levComment = comentariosMapLocal[item];
                  } else {
                      const m = Object.entries(comentariosMapLocal).find(([k, v]) => matchItemKeys(k, item) && v);
                      if (m) levComment = m[1];
                  }
              } else if (singleComentario) {
                  levComment = singleComentario;
              }

              if ((photos && photos.length > 0) || imgLev) {
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
                      const stripB64 = (b64: string) => b64.substring(b64.indexOf(",") + 1);
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
                      
                      if (imgLev) {
                          let imgLevClean = stripB64(imgLev);
                          const imgId2 = workbook.addImage({ base64: imgLevClean, extension: "jpeg" });
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
                      console.error("Error insertando fotos en maquinaria/vehiculo:", err);
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
      // Limpiar posible error #VALUE! de la celda de imagen original
      for (let r = 1; r <= 2; r++) {
        for (let c = 1; c <= 4; c++) {
          worksheet.getRow(r).getCell(c).value = "";
        }
      }

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
              
              const cleanKeyM5 = (s: string) => {
                  if (!s) return '';
                  return s.replace(/^[\s\-\•\*\(\)\d\.\:\[\]]+/, '')
                          .replace(/\s*\((?:NC|X)\)\s*$/i, '')
                          .replace(/[\u200B]/g, '')
                          .trim()
                          .toLowerCase();
              };

              const matchItemKeysM5 = (itemA: string, itemB: string) => {
                  const cA = cleanKeyM5(itemA);
                  const cB = cleanKeyM5(itemB);
                  if (!cA || !cB) return false;
                  return cA === cB || cA.includes(cB) || cB.includes(cA);
              };

              const allFotosDefectosM5: Record<string, string[]> = {
                  ...(data.answers?.fotosDefectos || {}),
                  ...(meta.fotosDefectos || {}),
                  ...(data.fotosDefectos || {})
              };

              let evidenciasMapLocal: Record<string, string> = {};
              let singleLevantamientoB64: string | null = null;
              if (data.evidenciaLevantamiento) {
                  if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.startsWith('{')) {
                      try { evidenciasMapLocal = JSON.parse(data.evidenciaLevantamiento); } catch(e) {}
                  } else if (typeof data.evidenciaLevantamiento === 'object') {
                      evidenciasMapLocal = data.evidenciaLevantamiento;
                  } else if (typeof data.evidenciaLevantamiento === 'string' && data.evidenciaLevantamiento.length > 50) {
                      singleLevantamientoB64 = data.evidenciaLevantamiento;
                  }
              }

              const badItemsKeys = Object.keys(checklist).filter(k => ['NC', 'X'].includes(checklist[k]));
              const itemsToRender: string[] = [...badItemsKeys];

              Object.keys(allFotosDefectosM5).forEach(fdKey => {
                  const already = itemsToRender.some(it => matchItemKeysM5(it, fdKey));
                  if (!already && allFotosDefectosM5[fdKey] && allFotosDefectosM5[fdKey].length > 0) {
                      itemsToRender.push(fdKey);
                  }
              });

              Object.keys(evidenciasMapLocal).forEach(evKey => {
                  const already = itemsToRender.some(it => matchItemKeysM5(it, evKey));
                  if (!already && evidenciasMapLocal[evKey] && evidenciasMapLocal[evKey].length > 50) {
                      itemsToRender.push(evKey);
                  }
              });

              if (itemsToRender.length === 0 && (singleLevantamientoB64 || Object.keys(allFotosDefectosM5).length > 0)) {
                  itemsToRender.push('General');
              }
              
              itemsToRender.forEach((item) => {
                  let photos = allFotosDefectosM5[item] || [];
                  if (!photos || photos.length === 0) {
                      const m = Object.entries(allFotosDefectosM5).find(([k, v]) => matchItemKeysM5(k, item) && Array.isArray(v) && v.length > 0);
                      if (m) photos = m[1];
                  }

                  let matchImgLev: string | null = null;
                  if (Object.keys(evidenciasMapLocal).length > 0) {
                      if (evidenciasMapLocal[item] && evidenciasMapLocal[item].length > 50) {
                          matchImgLev = evidenciasMapLocal[item];
                      } else {
                          const m = Object.entries(evidenciasMapLocal).find(([k, v]) => matchItemKeysM5(k, item) && typeof v === 'string' && v.length > 50);
                          if (m) matchImgLev = m[1];
                      }
                  } else if (singleLevantamientoB64) {
                      matchImgLev = singleLevantamientoB64;
                  }

                  if ((photos && photos.length > 0) || matchImgLev) {
                      try { worksheet.mergeCells("B" + currentImgRow + ":G" + currentImgRow); } catch(e){}
                      worksheet.getCell("B" + currentImgRow).value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN INSEGURA: " + item;
                      worksheet.getCell("B" + currentImgRow).font = { bold: true, size: 12 };
                      worksheet.getCell("B" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                      
                      if (matchImgLev || data.evidenciaLevantamiento || data.comentarioLevantamiento) {
                          try { worksheet.mergeCells("H" + currentImgRow + ":L" + currentImgRow); } catch(e){}
                          worksheet.getCell("H" + currentImgRow).value = "EVIDENCIA DEL LEVANTAMIENTO";
                          worksheet.getCell("H" + currentImgRow).font = { bold: true, size: 12 };
                          worksheet.getCell("H" + currentImgRow).alignment = { wrapText: true, vertical: 'middle' };
                      }
                      currentImgRow += 2;
                      
                      try {
                          const stripB64 = (b64: string) => b64.substring(b64.indexOf(",") + 1);
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
                          
                          if (matchImgLev) {
                              let imgLev = stripB64(matchImgLev);
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
      // --- MANEJADOR 7: TARJETA DE OBSERVACIÓN PREVENTIVA DE SEGURIDAD (Calibrado a F-SIG-060) ---
      else if (isTop) {
        const meta = data.meta || data.answers || data || {};
        const actosChecked: string[] = Array.isArray(meta.actos_checked)
          ? meta.actos_checked
          : meta.acto
            ? [meta.acto]
            : [];
        const condicionesChecked: string[] = Array.isArray(meta.condiciones_checked)
          ? meta.condiciones_checked
          : meta.condicion
            ? [meta.condicion]
            : [];

        topHasActo = actosChecked.filter(Boolean).length > 0;
        topHasCondicion = condicionesChecked.filter(Boolean).length > 0;

        if (fs.existsSync(templatePath)) {
          const reportNum = meta.reportNumber || meta.id || "001";
          const proyecto = meta.proyecto || "RED VIAL 6";
          const reportadoPor = meta.responsible || meta.inspector || "";
          const fecha = meta.date || meta.fecha || new Date().toISOString().split("T")[0];
          const hora = meta.hora || new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
          const lugar = meta.location || meta.lugar || "";

          worksheet.getCell("G4").value = `N° De Reporte : ${reportNum}`;
          worksheet.getCell("A5").value = `Proyecto / Instalación: ${proyecto}`;
          worksheet.getCell("A6").value = `Reportado por: ${reportadoPor}`;
          worksheet.getCell("F6").value = `Fecha: ${fecha}`;
          worksheet.getCell("H6").value = `Hora: ${hora}`;
          worksheet.getCell("A7").value = `Lugar: ${lugar}`;

          // Descripción observada (Filas 10 a 13, columnas B:G)
          try { worksheet.mergeCells("B11:G11"); } catch (e) {}
          const rawDesc = (
            meta.descripcion ||
            [...actosChecked, ...condicionesChecked].filter(Boolean).join(" / ") ||
            ""
          ).trim();
          const splitTextIntoLines = (txt: string, maxLen: number, maxLines: number) => {
            if (!txt) return [];
            const paragraphs = txt.split(/\r?\n/);
            const lines: string[] = [];
            for (const p of paragraphs) {
              let rem = p.trim();
              while (rem.length > maxLen && lines.length < maxLines - 1) {
                let cut = rem.lastIndexOf(" ", maxLen);
                if (cut <= 0) cut = maxLen;
                lines.push(rem.slice(0, cut).trim());
                rem = rem.slice(cut).trim();
              }
              if (rem) {
                if (lines.length < maxLines) lines.push(rem);
                else lines[maxLines - 1] += " " + rem;
              }
            }
            return lines.slice(0, maxLines);
          };

          const descLines = splitTextIntoLines(rawDesc, 90, 4);
          [10, 11, 12, 13].forEach((r, idx) => {
            const c = worksheet.getCell(`B${r}`);
            c.value = descLines[idx] || "";
            c.font = { name: "Arial", size: 9 };
            c.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
          });

          // Acción Inmediata (Filas 15 a 17, columnas A:G)
          const rawAccion = (meta.accion_inmediata || meta.accionInmediata || "").trim();
          const accionLines = splitTextIntoLines(rawAccion, 100, 3);
          [15, 16, 17].forEach((r, idx) => {
            const c = worksheet.getCell(`A${r}`);
            c.value = accionLines[idx] || "";
            c.font = { name: "Arial", size: 9 };
            c.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
          });

          const normStr = (s: string) =>
            String(s || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]/g, "");

          // Clasificación Condición Insegura (Filas 20 a 24, textos en B,D,F,H -> marca solo en el círculo Oval)
          for (let r = 20; r <= 24; r++) {
            for (const c of [2, 4, 6, 8]) {
              const cellText = String(worksheet.getRow(r).getCell(c).value || "");
              if (cellText && condicionesChecked.some((item) => normStr(item) === normStr(cellText))) {
                topMarkedOvals.add(`${c - 2},${r - 1}`);
              }
            }
          }

          // Clasificación Acto Inseguro (Filas 28 a 32, textos en B,D,F,H -> marca solo en el círculo Oval)
          for (let r = 28; r <= 32; r++) {
            for (const c of [2, 4, 6, 8]) {
              const cellText = String(worksheet.getRow(r).getCell(c).value || "");
              if (cellText && actosChecked.some((item) => normStr(item) === normStr(cellText))) {
                topMarkedOvals.add(`${c - 2},${r - 1}`);
              }
            }
          }

          // Evidencia fotográfica opcional debajo de la tarjeta (fila 36)
          if (meta.fotoEvidencia && typeof meta.fotoEvidencia === "string" && meta.fotoEvidencia.includes("base64,")) {
            try {
              worksheet.mergeCells("A36:D36");
              const evHeader = worksheet.getCell("A36");
              evHeader.value = "EVIDENCIA FOTOGRÁFICA DE LA CONDICIÓN:";
              evHeader.font = { name: "Arial", size: 10, bold: true };
              const base64Data = meta.fotoEvidencia.replace(/^data:image\/\w+;base64,/, "");
              const imgId = workbook.addImage({ base64: base64Data, extension: "jpeg" });
              worksheet.addImage(imgId, {
                tl: { col: 0, row: 37 },
                ext: { width: 340, height: 240 },
              });
            } catch (e) {
              console.error("Error adjuntando foto TOP:", e);
            }
          }

          if (data.evidenciaLevantamiento) {
            try {
              let levB64 = data.evidenciaLevantamiento;
              if (typeof levB64 === 'string' && levB64.startsWith('{')) {
                try { levB64 = Object.values(JSON.parse(levB64))[0] as string; } catch(e) {}
              }
              if (levB64 && typeof levB64 === 'string' && levB64.length > 50) {
                worksheet.mergeCells("E36:H36");
                const levHeader = worksheet.getCell("E36");
                levHeader.value = "EVIDENCIA DEL LEVANTAMIENTO:";
                levHeader.font = { name: "Arial", size: 10, bold: true };
                const cleanB64 = levB64.replace(/^data:image\/\w+;base64,/, "");
                const imgId = workbook.addImage({ base64: cleanB64, extension: "jpeg" });
                worksheet.addImage(imgId, {
                  tl: { col: 4, row: 37 },
                  ext: { width: 340, height: 240 },
                });
              }
            } catch (e) {
              console.error("Error adjuntando foto levantamiento TOP:", e);
            }
          }
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
    let buffer: any = await workbook.xlsx.writeBuffer();

    // Preservar formas (círculos Oval, casillas Rectángulo e ilustraciones originales) de F-SIG-060
    if (isTop && fs.existsSync(templatePath)) {
      try {
        const JSZip = require("jszip");
        const origZip = await JSZip.loadAsync(fs.readFileSync(templatePath));
        const outZip = await JSZip.loadAsync(buffer);
        if (origZip.files["xl/drawings/drawing1.xml"] && outZip.files["xl/drawings/drawing1.xml"]) {
          const origDrawingXml = await origZip.files["xl/drawings/drawing1.xml"].async("string");
          const outDrawingXml = await outZip.files["xl/drawings/drawing1.xml"].async("string");

          // Extraer fotos adicionales (ej. rId3) si se agregó fotoEvidencia
          const extraPicAnchors: string[] = [];
          for (const part of outDrawingXml.split("</xdr:twoCellAnchor>")) {
            const idx = part.indexOf("<xdr:twoCellAnchor");
            if (idx === -1) continue;
            const anchor = part.slice(idx) + "</xdr:twoCellAnchor>";
            if (anchor.includes('r:embed="rId3"') || anchor.includes('r:embed="rId4"')) {
              extraPicAnchors.push(anchor);
            }
          }

          // Reconstruir drawing1.xml a partir del original para conservar intactos Picture 171, Imagen 45, 40 Ovals y 2 Rectángulos
          const rebuiltAnchors: string[] = [];
          for (const part of origDrawingXml.split("</xdr:twoCellAnchor>")) {
            const idx = part.indexOf("<xdr:twoCellAnchor");
            if (idx === -1) continue;
            let anchorXml = part.slice(idx) + "</xdr:twoCellAnchor>";
            if (anchorXml.includes("<xdr:sp ")) {
              const colMatch = anchorXml.match(/<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
              const nameMatch = anchorXml.match(/name="([^"]+)"/);
              const col0 = colMatch ? Number(colMatch[1]) : -1;
              const row0 = colMatch ? Number(colMatch[2]) : -1;
              const shapeName = nameMatch ? nameMatch[1] : "";

              const isRectActo = shapeName.includes("40") && topHasActo;
              const isRectCond = shapeName.includes("41") && topHasCondicion;
              const isMarkedOval = shapeName.includes("Oval") && topMarkedOvals.has(`${col0},${row0}`);

              if (isRectActo || isRectCond || isMarkedOval) {
                anchorXml = anchorXml.replace(
                  /<a:solidFill><a:schemeClr val="bg1"\/><\/a:solidFill>/g,
                  '<a:solidFill><a:srgbClr val="F97316"/></a:solidFill>'
                );
                anchorXml = anchorXml.replace(
                  /<xdr:txBody>[\s\S]*?<\/xdr:txBody>/,
                  '<xdr:txBody><a:bodyPr vertOverflow="overflow" horzOverflow="overflow" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="es-PE" sz="900" b="1"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:rPr><a:t>X</a:t></a:r></a:p></xdr:txBody>'
                );
              }
            }
            rebuiltAnchors.push(anchorXml);
          }

          const finalDrawingXml =
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
            rebuiltAnchors.join("") +
            extraPicAnchors.join("") +
            "</xdr:wsDr>";

          outZip.file("xl/drawings/drawing1.xml", finalDrawingXml);
          buffer = await outZip.generateAsync({ type: "nodebuffer" });
        }
      } catch (zipErr) {
        console.error("Error restaurando formas F-SIG-060:", zipErr);
      }
    }

    if (data.saveToDrive) {
      const APPS_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbyzUxEDgad2mc2tfsWwfAlh4RHa0QKA_mJLcUN7AEe1jjEKOznkZ1myAIHe79zhxUB4/exec";
      const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      const base64 = nodeBuf.toString("base64");
      const meta = data.meta || data.answers || data || {};
      const monthNames = [
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
      ];
      const dObj = (meta.date || meta.fecha) ? new Date((meta.date || meta.fecha) + "T12:00:00") : new Date();
      const monthName = !isNaN(dObj.getTime()) ? monthNames[dObj.getMonth()] : "GENERAL";
      const cleanProj = String(meta.proyecto || "RED VIAL 6").replace(/[^a-zA-Z0-9\s-_]/g, "").trim().toUpperCase();
      const cleanLoc = String(meta.location || meta.lugar || "GENERAL").replace(/[^a-zA-Z0-9\s-_]/g, "").trim().toUpperCase();

      const fileName = isTop
        ? `F-SIG-060_TOP_${meta.date || new Date().toISOString().split("T")[0]}_${meta.reportNumber || new Date().getTime()}.xlsx`
        : `INSP_${moduleName}_${new Date().getTime()}.xlsx`;
      const folderPath = isTop
        ? `${cleanProj}/SEGURIDAD/${monthName}/TARJETAS_TOP/${cleanLoc}`
        : `INSPECCIONES/${new Date().getFullYear()}/${moduleName.toUpperCase()}`;

      // Guardado en disco local (D:/ si existe, o en .data/reports del proyecto)
      try {
        const localTargetDir = fs.existsSync("D:/")
          ? path.join("D:/Evidencia del sistema de gestion CASA 2026", folderPath)
          : path.join(process.cwd(), ".data", "reports", folderPath);
        fs.mkdirSync(localTargetDir, { recursive: true });
        fs.writeFileSync(path.join(localTargetDir, fileName), nodeBuf);
      } catch (localErr) {
        console.warn("No se pudo guardar copia local en disco:", localErr);
      }

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

      let driveUrl = "";
      try {
        const driveRes = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "text/plain" },
          redirect: "follow",
        });

        if (driveRes.ok) {
          const text = await driveRes.text();
          const driveData = JSON.parse(text);
          if (driveData.result === "success") {
            driveUrl = driveData.viewLink || driveData.url || "";
          }
        }
      } catch (driveErr) {
        console.warn("Modo Offline / Google Drive no disponible:", (driveErr as any)?.message || driveErr);
      }

      return NextResponse.json({
        success: true,
        driveUrl,
        fileBase64: base64,
        fileName,
        isOffline: !driveUrl
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














