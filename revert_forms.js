const fs = require('fs');

function revertForms(filePath, moduleName) {
    let c = fs.readFileSync(filePath, 'utf8');

    const hallTarget = `                                hallazgos: badItemsList.map(([item, val], idx) => ({
                                    index: idx,
                                    descripcion: item + (itemComments[item] ? \`: \${itemComments[item]}\` : ''),
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: meta.responsable || firmas.responsableNombre || "Responsable",
                                    responsableEmail: user?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: fotosDefectos[item] && fotosDefectos[item].length > 0 ? { [item]: fotosDefectos[item] } : {}
                                }))`;
                                
    const hallRep = `                                hallazgos: [{
                                    index: 0,
                                    descripcion: badItemsList.map(([key]) => key + (itemComments[key] ? \`: \${itemComments[key]}\` : '')).join('\\n'),
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: meta.responsable || firmas.responsableNombre || "Responsable",
                                    responsableEmail: user?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: Object.keys(fotosDefectos).length > 0 ? fotosDefectos : {}
                                }]`;

    c = c.replace(hallTarget, hallRep);
    fs.writeFileSync(filePath, c);
}

revertForms('components/inspections/AlmacenCustomForm.tsx', 'Almacenes');
revertForms('components/inspections/TalleresCustomForm.tsx', 'Talleres');
console.log('Reverted forms to group hallazgos');
