} else if (isEppCaidas) {
            if (!fs.existsSync(templatePath)) {
                return NextResponse.json({
                    error: "Plantilla no encontrada"
                }, {
                    status: 404
                });
            }
            const templateDef = data.template || [];
            const getAns = (key)=>templateDef.find((t)=>t.text === key)?.value || "";
            const getSig = (key)=>templateDef.find((t)=>t.text === key)?.signature || "";
            // General Data
            worksheet.getCell("C4").value = getAns("Proyecto:");
            worksheet.getCell("D5").value = getAns("Área de Trabajo:");
            worksheet.getCell("M5").value = getAns("Fecha:");
            worksheet.getCell("P5").value = getAns("Hora:");
            // Inspector Name
            worksheet.getCell("F6").value = getAns("JefeNombre:");
            // Table data
            let trabajadores = [];
            try {
                trabajadores = JSON.parse(getAns("Trabajadores") || "[]");
            } catch (e) {
                console.error("Error parsing Trabajadores:", e);
            }
            try {
                (__webpack_require__(/*! fs */ "fs").appendFileSync)("debug_epp.log", new Date().toISOString() + " | Parsed trabajadores length: " + trabajadores.length + "\
");
                (__webpack_require__(/*! fs */ "fs").appendFileSync)("debug_epp.log", new Date().toISOString() + " | Raw payload: " + getAns("Trabajadores") + "\
");
            } catch (e) {}
            let currentRow = 10;
            trabajadores.forEach((t, idx)=>{
                if (currentRow <= 19) {
                    worksheet.getCell(`A${currentRow}`).value = idx + 1;
                    worksheet.getCell(`B${currentRow}`).value = t.nombre || "";
                    worksheet.getCell(`G${currentRow}`).value = t.tipo || "";
                    worksheet.getCell(`H${currentRow}`).value = t.codigo || "";
                    worksheet.getCell(`I${currentRow}`).value = t.correas || "";
                    worksheet.getCell(`J${currentRow}`).value = t.costuras || "";
                    worksheet.getCell(`K${currentRow}`).value = t.anillos || "";
                    worksheet.getCell(`L${currentRow}`).value = t.mosquetones || "";
                    worksheet.getCell(`M${currentRow}`).value = t.hebillas || "";
                    worksheet.getCell(`N${currentRow}`).value = t.gatillo || "";
                    worksheet.getCell(`O${currentRow}`).value = t.observaciones || "";
                    // Force styles to ensure text is visible and centered
                    [
                        "A",
                        "B",
                        "G",
                        "H",
                        "I",
                        "J",
                        "K",
                        "L",
                        "M",
                        "N",
                        "O",
                        "P",
                        "Q"
                    ].forEach((col)=>{
                        const cell = worksheet.getCell(`${col}${currentRow}`);
                        // Clearing style removes conditional formatting which might hide text
                        const border = cell.border; // Preserve borders if possible, actually ExcelJS doesn't easily preserve if we overwrite style
                        cell.style = {};
                        cell.font = {
                            color: {
                                argb: "FF000000"
                            },
                            size: 9,
                            bold: false
                        };
                        if (col !== "B" && col !== "O" && col !== "P" && col !== "Q") {
                            cell.alignment = {
                                vertical: "middle",
                                horizontal: "center"
                            };
                        } else if (col === "O" || col === "P" || col === "Q") {
                            cell.alignment = {
                                vertical: "middle",
                                horizontal: "left",
                                wrapText: true
                            };
                        } else {
                            cell.alignment = {
                                vertical: "middle",
                                horizontal: "left"
                            };
                        }
                        cell.border = {
                            top: {
                                style: 'thin'
                            },
                            left: {
                                style: 'thin'
                            },
                            bottom: {
                                style: 'thin'
                            },
                            right: {
                                style: 'thin'
                            }
                        };
                    });
                    currentRow++;
                }
            });
            // Signatures
            const jefeFirma = getSig("JefeFirma:");
            if (jefeFirma && jefeFirma.startsWith("data:image")) {
                try {
                    const ext = jefeFirma.includes("jpeg") || jefeFirma.includes("jpg") ? "jpeg" : "png";
                    const base64Data = jefeFirma.replace(/^data:image\/\w+;base64,/, "");
                    const imgId = workbook.addImage({
                        base64: base64Data,
                        extension: ext
                    });
                    try {
                        worksheet.unMergeCells("F6:Q6");
                    } catch (e) {}
                    try {
                        worksheet.unMergeCells("F6:Q7");
                    } catch (e) {} // old code used Q7
                    worksheet.mergeCells("F6:M6");
                    // Put the name in F6 (already done above, but alignment ensures it looks good)
                    worksheet.getCell("F6").alignment = {
                        vertical: "middle",
                        horizontal: "center"
                    };
                    // Col 12 = M, row 5 = 6
                    worksheet.addImage(imgId, {
                        tl: {
                            col: 12,
                            row: 5
                        },
                        ext: {
                            width: 140,
                            height: 40
                        }
                    });
                } catch (e) {
                    console.error("[DEBUG] Error adding jefeFirma:", e);
                }
            } else {
                // Even if no signature, we should merge the cells correctly as requested
                try {
                    worksheet.unMergeCells("F6:Q6");
                } catch (e) {}
                try {
                    worksheet.mergeCells("F6:M6");
                } catch (e) {}
                worksheet.getCell("F6").alignment = {
                    vertical: "middle",
                    horizontal: "center"
                };
            }
            const ssmaNombre = getAns("SsmaNombre:");
            // User requested merge from F25 to Q25
            try {
                worksheet.unMergeCells("F25:Q25");
            } catch (e) {} // Unmerge first to avoid conflicts if needed
            try {
                worksheet.mergeCells("F25:Q25");
            } catch (e) {}
            worksheet.getCell("F25").value = ssmaNombre;
            worksheet.getCell("F25").alignment = {
                vertical: "middle",
                horizontal: "center"
            };
            const ssmaFirma = getSig("SsmaFirma:");
            if (ssmaFirma && ssmaFirma.startsWith("data:image")) {
                try {
                    const ext = ssmaFirma.includes("jpeg") || ssmaFirma.includes("jpg") ? "jpeg" : "png";
                    const base64Data = ssmaFirma.replace(/^data:image\/\w+;base64,/, "");
                    const imgId = workbook.addImage({
                        base64: base64Data,
                        extension: ext
                    });
                    // Col 14 = O, row 24 = 25
                    worksheet.addImage(imgId, {
                        tl: {
                            col: 14,
                            row: 24
                        },
                        ext: {
                            width: 140,
                            height: 40
                        }
                    });
                } catch (e) {
                    console.error("[DEBUG] Error adding ssmaFirma:", e);
                }
            }
            // Registro Fotográfico
            let photoRow = 28;
            let hasPhotos = false;
            trabajadores.forEach((t)=>{
                if (t.fotos && Array.isArray(t.fotos) && t.fotos.length > 0) {
                    if (!hasPhotos) {
                        worksheet.getCell("A27").value = "REGISTRO FOTOGRÁFICO DE OBSERVACIONES";
                        worksheet.getCell("A27").font = {
                            bold: true,
                            size: 14,
                            color: {
                                argb: "FFFFFFFF"
                            }
                        };
                        worksheet.getCell("A27").fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: {
                                argb: "FF002060"
                            }
                        };
                        worksheet.getCell("A27").alignment = {
                            vertical: "middle",
                            horizontal: "center"
                        };
                        worksheet.mergeCells("A27:O27");
                        hasPhotos = true;
                    }
                    worksheet.getCell(`A${photoRow}`).value = `Trabajador: ${t.nombre || "N/A"} - ${t.tipo || ""} (${t.codigo || ""}) | Observaciones: ${t.observaciones ? t.observaciones.replace(/\
/g, ' ') : "Ninguna"}`;
                    worksheet.getCell(`A${photoRow}`).font = {
                        bold: true
                    };
                    worksheet.mergeCells(`A${photoRow}:O${photoRow}`);
                    let currentPhotoCol = 0; // Start at column A (0)
                    t.fotos.forEach((fotoStr)=>{
                        if (fotoStr && fotoStr.startsWith("data:image")) {
                            try {
                                const ext = fotoStr.includes("jpeg") || fotoStr.includes("jpg") ? "jpeg" : "png";
                                const base64Data = fotoStr.replace(/^data:image\/\w+;base64,/, "");
                                const imgId = workbook.addImage({
                                    base64: base64Data,
                                    extension: ext
                                });
                                worksheet.addImage(imgId, {
                                    tl: {
                                        col: currentPhotoCol,
                                        row: photoRow
                                    },
                                    ext: {
                                        width: 320,
                                        height: 240
                                    }
                                });
                                currentPhotoCol += 6; // Move next photo to the right by ~6 columns
                                // If it goes beyond the page width, wrap it to the next row
                                if (currentPhotoCol > 12) {
                                    currentPhotoCol = 0;
                                    photoRow += 14;
                                }
                            } catch (e) {
                                console.error("[DEBUG] Error adding worker photo:", e);
                            }
                        }
                    });
                    photoRow += 14; // Leave space for the last row of images before the next worker
                }
            });
        } else if (isAntiderrame) {
            if (!fs.existsSync(templatePath)) {
                return NextResponse.json({
                    error: "Plantilla no encontrada"
                }, {
                    status: 404
                });
            }
            const templateDef = data.template || [];
            const getAns = (key)=>templateDef.find((t)=>t.text === key)?.value || "";
            const getSig = (key)=>templateDef.find((t)=>t.text === key)?.signature || "";
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
            kits.forEach((k, idx)=>{
                // Non-consumable (merged vertically in template)
                worksheet.getCell(`A${currentRow}`).value = idx + 1;
                worksheet.getCell(`B${currentRow}`).value = k.codigo || "";
                worksheet.getCell(`C${currentRow}`).value = k.ubicacion || "";
                worksheet.getCell(`D${currentRow}`).value = k.cilindro || "";
                worksheet.getCell(`E${currentRow}`).value = k.bandeja || "";
                worksheet.getCell(`K${currentRow}`).value = k.pala || "";
                worksheet.getCell(`L${currentRow}`).value = k.pico || "";
                worksheet.getCell(`R${currentRow}`).value = k.observaciones || "";
                // Consumable columns logic (Top cell = C/NC, Bottom cell = Faltante)
                const writeConsumable = (col, val)=>{
                    let topVal = "";
                    let bottomVal = "";
                    if (val === "C" || val === "NC") {
                        topVal = val;
                    } else if (val && val.trim() !== "") {
                        topVal = "NC";
                        bottomVal = val;
                    }
                    worksheet.getCell(`${col}${currentRow}`).value = topVal;
                    worksheet.getCell(`${col}${currentRow + 1}`).value = bottomVal;
                    // Basic alignment
                    worksheet.getCell(`${col}${currentRow}`).alignment = {
                        vertical: "middle",
                        horizontal: "center"
                    };
                    worksheet.getCell(`${col}${currentRow + 1}`).alignment = {
                        vertical: "middle",
                        horizontal: "center"
                    };
                };
                writeConsumable("F", k.panosBlancos);
                writeConsumable("G", k.panosAmarillos);
                writeConsumable("H", k.trapos);
                writeConsumable("I", k.bolsasRojas);
                writeConsumable("J", k.bolsasNegras);
                writeConsumable("M", k.guantesNitrilo);
                writeConsumable("N", k.guantesNeoprene);
                writeConsumable("O", k.salchichas);
                writeConsumable("P", k.respirador);
                writeConsumable("Q", k.trajes);
                // Basic centering for non-consumables without breaking merges
                [
                    "A",
                    "B",
                    "C",
                    "D",
                    "E",
                    "K",
                    "L"
                ].forEach((col)=>{
                    worksheet.getCell(`${col}${currentRow}`).alignment = {
                        vertical: "middle",
                        horizontal: "center"
                    };
                });
                worksheet.getCell(`R${currentRow}`).alignment = {
                    vertical: "middle",
                    horizontal: "left",
                    wrapText: true
                };
                // Auto-expand row height if observation is long
                if (k.observaciones && k.observaciones.length > 40) {
                    // Calculate approx extra lines needed (assuming ~30 chars per line in that column)
                    const lines = Math.ceil(k.observaciones.length / 30);
                    const totalRequiredHeight = lines * 15; // 15 points per line
                    // The block is 2 rows tall, so distribute the height
                    if (totalRequiredHeight > 30) {
                        worksheet.getRow(currentRow).height = totalRequiredHeight / 2;
                        worksheet.getRow(currentRow + 1).height = totalRequiredHeight / 2;
                    }
                }
                currentRow += 2; // Jump by 2 for the next kit because rows 11+12 are for item 1, 13+14 for item 2
            });
            // Signatures
            // Expand row heights so signatures fit inside the cell without bleeding
            worksheet.getRow(26).height = 45;
            worksheet.getRow(28).height = 45;
            // Inspeccionado por
            const inspNombre = getAns("InspeccionadoNombre:");
            const inspCargo = getAns("InspeccionadoCargo:");
            worksheet.getCell("C26").value = inspNombre;
            worksheet.getCell("C26").alignment = {
                vertical: "middle",
                horizontal: "center"
            };
            worksheet.getCell("I26").value = inspCargo;
            worksheet.getCell("I26").alignment = {
                vertical: "middle",
                horizontal: "center"
            };
            const inspFirma = getSig("InspeccionadoFirma:");
            if (inspFirma && inspFirma.startsWith("data:image")) {
                try {
                    const ext = inspFirma.includes("jpeg") || inspFirma.includes("jpg") ? "jpeg" : "png";
                    const base64Data = inspFirma.replace(/^data:image\/\w+;base64,/, "");
                    const imgId = workbook.addImage({
                        base64: base64Data,
                        extension: ext
                    });
                    worksheet.addImage(imgId, {
                        tl: {
                            col: 17,
                            row: 25
                        },
                        ext: {
                            width: 140,
                            height: 50
                        }
                    }); // R26 area
                } catch (e) {
                    console.error("[DEBUG] Error adding inspFirma:", e);
                }
            }
            // Responsable
            const respNombre = getAns("ResponsableNombre:");
            const respCargo = getAns("ResponsableCargo:");
            worksheet.getCell("C28").value = respNombre;
            worksheet.getCell("C28").alignment = {
                vertical: "middle",
                horizontal: "center"
            };
            worksheet.getCell("I28").value = respCargo;
            worksheet.getCell("I28").alignment = {
                vertical: "middle",
                horizontal: "center"
            };
            const respFirma = getSig("ResponsableFirma:");
            if (respFirma && respFirma.startsWith("data:image")) {
                try {
                    const ext = respFirma.includes("jpeg") || respFirma.includes("jpg") ? "jpeg" : "png";
                    const base64Data = respFirma.replace(/^data:image\/\w+;base64,/, "");
                    const imgId = workbook.addImage({
                        base64: base64Data,
                        extension: ext
                    });
                    worksheet.addImage(imgId, {
                        tl: {
                            col: 17,
                            row: 27
                        },
                        ext: {
                            width: 140,
                            height: 50
                        }
                    }); // R28 area
                } catch (e) {
                    console.error("[DEBUG] Error adding respFirma:", e);
                }
            }
            // Fotos
            let photoRow = 32;
            let hasPhotos = false;
            kits.forEach((k, idx)=>{
                if (k.fotos && Array.isArray(k.fotos) && k.fotos.length > 0) {
                    if (!hasPhotos) {
                        worksheet.getCell(`A${photoRow}`).value = "REGISTRO FOTOGRÁFICO DE OBSERVACIONES";
                        worksheet.getCell(`A${photoRow}`).font = {
                            bold: true,
                            size: 14,
                            color: {
                                argb: "FFFFFFFF"
                            }
                        };
                        worksheet.getCell(`A${photoRow}`).fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: {
                                argb: "FF002060"
                            }
                        };
                        worksheet.getCell(`A${photoRow}`).alignment = {
                            vertical: "middle",
                            horizontal: "center"
                        };
                        try {
                            worksheet.mergeCells(`A${photoRow}:T${photoRow}`);
                        } catch (e) {}
                        hasPhotos = true;
                        photoRow += 2;
                    }
                    worksheet.getCell(`A${photoRow}`).value = `Kit #${idx + 1} - ${k.codigo || "S/C"} | Observaciones: ${k.observaciones ? k.observaciones.replace(/\
/g, ' ') : "Ninguna"}`;
                    worksheet.getCell(`A${photoRow}`).font = {
                        bold: true
                    };
                    try {
                        worksheet.mergeCells(`A${photoRow}:T${photoRow}`);
                    } catch (e) {}
                    photoRow += 1;
                    let currentPhotoCol = 0;
                    k.fotos.forEach((fotoStr)=>{
                        if (fotoStr && fotoStr.startsWith("data:image")) {
                            try {
                                const ext = fotoStr.includes("jpeg") || fotoStr.includes("jpg") ? "jpeg" : "png";
                                const base64Data = fotoStr.replace(/^data:image\/\w+;base64,/, "");
                                const imgId = workbook.addImage({
                                    base64: base64Data,
                                    extension: ext
                                });
                                worksheet.addImage(imgId, {
                                    tl: {
                                        col: currentPhotoCol,
                                        row: photoRow
                                    },
                                    ext: {
                                        width: 320,
                                        height: 240
                                    }
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
        } else if (isEstacionEmergencia) {
            if (!fs.existsSync(templatePath)) {
                return NextResponse.json({
                    error: "Plantilla no encontrada"
                }, {
                    status: 404
                });
            }
            const templateDef = data.template || [];
            const getAns = (key)=>templateDef.find((t)=>t.text === key)?.value || "";
            const getSig = (key)=>templateDef.find((t)=>t.text === key)?.signature || "";
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
            let items = [];
            try {
                items = JSON.parse(getAns("Items:") || "[]");
            } catch (e) {
                console.error("Error parsing Items:", e);
            }
            items.forEach((val, idx)=>{
                const r = 15 + idx;
                // The value is "C", "NC", or "N/A".
                worksheet.getCell(`K${r}`).value = val === "C" ? "X" : "";
                worksheet.getCell(`L${r}`).value = val === "NC" ? "X" : "";
                worksheet.getCell(`M${r}`).value = val === "N/A" ? "X" : "";
                // Centering
                [
                    "K",
                    "L",
                    "M"
                ].forEach((c)=>{
                    worksheet.getCell(`${c}${r}`).alignment = {
                        vertical: "middle",
                        horizontal: "center"
                    };
                });
            });
            // Observaciones
            const obs = getAns("Observaciones:");
            worksheet.getCell("A43").value = obs;
            worksheet.getCell("A43").alignment = {
                vertical: "top",
                horizontal: "left",
                wrapText: true
            };
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
                    const imgId = workbook.addImage({
                        base64: base64Data,
                        extension: ext
                    });
                    worksheet.addImage(imgId, {
                        tl: {
                            col: 9,
                            row: 5
                        },
                        ext: {
                            width: 140,
                            height: 40
                        }
                    }); // J6 area
                } catch (e) {
                    console.error(e);
                }
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
                    const imgId = workbook.addImage({
                        base64: base64Data,
                        extension: ext
                    });
                    worksheet.addImage(imgId, {
                        tl: {
                            col: 9,
                            row: 6
                        },
                        ext: {
                            width: 140,
                            height: 40
                        }
                    }); // J7 area
                } catch (e) {
                    console.error(e);
                }
            }
            // Evidencia Fotográfica
            let photoRow = 52; // Put it below the notes block
            let fotos = [];
            try {
                fotos = JSON.parse(getAns("Fotos:") || "[]");
            } catch (e) {
                console.error("Error parsing fotos:", e);
            }
            if (fotos.length > 0) {
                worksheet.getCell(`A${photoRow}`).value = "REGISTRO FOTOGRÁFICO DE EVIDENCIA";
                worksheet.getCell(`A${photoRow}`).font = {
                    bold: true,
                    size: 14,
                    color: {
                        argb: "FFFFFFFF"
                    }
                };
                worksheet.getCell(`A${photoRow}`).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "FF002060"
                    }
                };
                worksheet.getCell(`A${photoRow}`).alignment = {
                    vertical: "middle",
                    horizontal: "center"
                };
                try {
                    worksheet.mergeCells(`A${photoRow}:M${photoRow}`);
                } catch (e) {}
                photoRow += 2;
                let currentPhotoCol = 0;
                fotos.forEach((fotoStr)=>{
                    if (fotoStr && fotoStr.startsWith("data:image")) {
                        try {
                            const ext = fotoStr.includes("jpeg") || fotoStr.includes("jpg") ? "jpeg" : "png";
                            const base64Data = fotoStr.replace(/^data:image\/\w+;base64,/, "");
                            const imgId = workbook.addImage({
                                base64: base64Data,
                                extension: ext
                            });
                            worksheet.addImage(imgId, {
                                tl: {
                                    col: currentPhotoCol,
                                    row: photoRow
                                },
                                ext: {
                                    width: 320,
                                    height: 240
                                }
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
        