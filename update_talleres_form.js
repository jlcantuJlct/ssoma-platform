const fs = require('fs');
let c = fs.readFileSync('components/inspections/TalleresCustomForm.tsx', 'utf8');

c = c.replace(/export default function AlmacenCustomForm/g, 'export default function TalleresCustomForm');
c = c.replace(/moduleName: 'Almacenes'/g, "moduleName: 'Talleres'");
c = c.replace(/isAlmacenMatrix: true/g, "isTalleresMatrix: true");

const sectionsRegex = /const sectionsToRender = \[[\s\S]*?\];/;
const newSections = `const sectionsToRender = [
    {
        category: 'Talleres Mecánico, Eléctrico, Carpintería y Soldadura',
        items: [
            'Orden y limpieza',
            'Àrea impermeabilizada',
            'Taller mecánico separado de soldadura',
            'Extintores operativos e inspeccionados',
            'Disposición de residuos sólidos y líquidos',
            'Correcta segregación de residuos / Correcto uso de los contenedores de residuos',
            'Buen estado de herramientas e inspeccionada',
            'No uso de herramientas hechizas',
            'Buen estado de equipos de izaje',
            'Buen estado de equipos de esmerilar y con guardas',
            'Ventilación / extracción de aire en buen estado',
            'Delimitación / señalización',
            'Divisiones o biombos en caso de soldadura',
            'Espacios adecuados y en buenas condiciones',
            'Productos químicos con hojas de datos de seguridad (MSDS).',
            'El personal usa el EPP adecuado de acuerdo a la actividad que realiza',
            'Los trabajos tienen ATS y *PETAR.',
            'Se cuenta con kit antiderrames de MATPEL',
            'Envases con productos químicos debidamente rotulados',
            'Herramientas manuales, eléctricas y/o equipos portátiles han sido inspeccionadas y cuentan con la cinta de inspección correspondiente al color del mes y en caso de defectuosas genera el (F-OP-019) Verificación de Herramientas Manuales, Eléctricas y Equipos Portátiles',
            'Candado, tenaza y/o tarjeta de bloqueo es utilizado en las unidades para la realización de los mantenimientos tanto preventivo como correctivo.'
        ]
    }
];`;
c = c.replace(sectionsRegex, newSections);

fs.writeFileSync('components/inspections/TalleresCustomForm.tsx', c);
console.log('TalleresCustomForm updated successfully');
