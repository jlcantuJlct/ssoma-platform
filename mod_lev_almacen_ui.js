const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

const badItemsRegex = /const badItemsList = Object\.entries\(checklist\)\.filter\(\(\[_, val\]\) => \['R', 'M', 'F', 'RESUM', 'FUGA'\]\.includes\(val\)\);[\s\S]*?if \(!isEmailing\) {/m;

const newBadItemsLogic = `const badItemsList = Object.entries(checklist).filter(([_, val]) => ['X'].includes(val));
                let generatedLevantamientoLink = cachedLevantamientoLink;

                if (badItemsList.length > 0 && !generatedLevantamientoLink) {
                    try {
                        const descripcionPlural = badItemsList.map(([key]) => key).join('\\n');
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: 'Almacenes',
                                template: checklist,
                                answers: { ...meta, observaciones, firmas, fotosDefectos },
                                inspectionRecordId,
                                hallazgos: [{
                                    index: 0,
                                    descripcion: descripcionPlural,
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: meta.responsable || firmas.responsableNombre || "Responsable",
                                    responsableEmail: user?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: Object.keys(fotosDefectos).length > 0 ? fotosDefectos : {}
                                }]
                            })
                        });

                        if (lvRes.ok) {
                            const lvData = await lvRes.json();
                            if (lvData.items && lvData.items.length > 0) {
                                generatedLevantamientoLink = window.location.origin + '/levantamiento/' + lvData.items[0].token;
                                setCachedLevantamientoLink(generatedLevantamientoLink);
                            }
                        }
                    } catch(err) { console.error("Error generating levantamiento:", err); }
                }

                if (!isEmailing) {`;

c = c.replace(badItemsRegex, newBadItemsLogic);

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Fixed bad items and levantamiento payload logic in Almacen form');
