const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

const oldBadItems = `const badItemsArray = badItemsList.map(([item, val], index) => ({
                    index: index + 1,
                    descripcion: item + " - " + val,
                    riesgo: "Medio",
                    categoria: "Mantenimiento",
                    responsable: "Área de Mantenimiento",
                    responsableEmail: customEmailData.to[0] || "admin@empresa.com",
                    fecha: meta.fecha,
                    fotosDefectos: fotosDefectos[item] || []
                }));`;

const newBadItems = `const badItemsArray = [{
                    index: 1,
                    descripcion: badItemsList.map(([item, val]) => item + " (" + val + ")").join('\\n'),
                    riesgo: "Medio",
                    categoria: "Mantenimiento",
                    responsable: "Área de Mantenimiento",
                    responsableEmail: customEmailData.to[0] || "admin@empresa.com",
                    fecha: meta.fecha,
                    fotosDefectos: fotosDefectos // Pass the whole object
                }];`;

c = c.replace(oldBadItems, newBadItems);
fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Grouped machinery hallazgos into one');
