const fs = require('fs');

function fixFile(filePath, moduleName) {
    let c = fs.readFileSync(filePath, 'utf8');

    // Fix 1: Guard a.click() with !isEmailing
    const dlTarget = `                if (data.fileBase64) {
                    setCachedDriveUrl(data.driveUrl);
                    const byteCharacters = atob(data.fileBase64);`;
    const dlRep = `                if (data.fileBase64) {
                    setCachedDriveUrl(data.driveUrl);
                    if (!isEmailing) {
                        const byteCharacters = atob(data.fileBase64);`;
    c = c.replace(dlTarget, dlRep);

    const closeTarget = `                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                }`;
    const closeRep = `                    a.click();
                        window.URL.revokeObjectURL(url);
                        a.remove();
                    }
                }`;
    c = c.replace(closeTarget, closeRep);

    // Fix 2: hallazgos payload to array map
    const hallTarget = `const descripcionPlural = badItemsList.map(([key]) => key).join('\\n');
                    try {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: '${moduleName}',
                                template: checklist,
                                answers: { ...meta, observaciones, firmas, fotosDefectos },
                                inspectionRecordId: currentInspectionRecordId,
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
                        });`;
                        
    const hallRep = `try {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: '${moduleName}',
                                template: checklist,
                                answers: { ...meta, observaciones, firmas, fotosDefectos },
                                inspectionRecordId: currentInspectionRecordId,
                                hallazgos: badItemsList.map(([item, val], idx) => ({
                                    index: idx,
                                    descripcion: item + (itemComments[item] ? \`: \${itemComments[item]}\` : ''),
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: meta.responsable || firmas.responsableNombre || "Responsable",
                                    responsableEmail: user?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: fotosDefectos[item] && fotosDefectos[item].length > 0 ? { [item]: fotosDefectos[item] } : {}
                                }))
                            })
                        });`;
    
    // Some lines might differ slightly, let's use string operations instead of regex for complex blocks if needed
    // Actually, string replacement is precise.
    c = c.replace(hallTarget, hallRep);

    fs.writeFileSync(filePath, c);
}

fixFile('components/inspections/AlmacenCustomForm.tsx', 'Almacenes');
fixFile('components/inspections/TalleresCustomForm.tsx', 'Talleres');
console.log('Fixed download bug and hallazgos array logic in forms');
