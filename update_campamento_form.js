const fs = require('fs');
let c = fs.readFileSync('components/inspections/CampamentoCustomForm.tsx', 'utf8');

c = c.replace(/export default function AlmacenCustomForm/g, 'export default function CampamentoCustomForm');
c = c.replace(/moduleName: 'Almacenes'/g, "moduleName: 'Campamento'");
c = c.replace(/isAlmacenMatrix: true/g, "isCampamentoMatrix: true");
c = c.replace(/Inspección de Almacenes/g, 'Inspección de Campamento');
c = c.replace(/INSPECCIÓN DE ALMACENES/g, 'INSPECCIÓN DE CAMPAMENTO');
c = c.replace(/Área de inspección/g, 'Ubicación de Campamento');

const sectionsRegex = /const sectionsToRender = \[[\s\S]*?\];/;
const newSections = `const sectionsToRender = [
    {
        category: 'Exhibición de Documentos',
        items: [
            'Exhibición de la Política del SIG en el proyecto',
            'Exhibición de las Políticas Específicas de Integridad en el proyecto',
            'Exhibición del IPERC en áreas comunes',
            'Mapa de Riesgos exhibido',
            'Objetivos de Seguridad y Salud en el Trabajo exhibido',
            'Licencia de Funcionamiento en el ingreso del campamento o en la oficina de Administración',
            'Certificado de Defensa Civil (ITSE) del campamento vigente'
        ]
    },
    {
        category: 'Señales de Seguridad',
        items: [
            'Las áreas cuentan con señalización de seguridad y visible',
            'Señales de Obligatorios/informativos/Prohibición, etc.,estan en buen estado',
            'Los sistemas eléctricos se encuentran con señalización de riesgo eléctrico',
            'Puntos de reunión se encuentran indentificados y señalizados',
            'Las señalizaciones estan ubicadas de acuerdo al riesgo del área de trabajo',
            'Las señales de tablero eléctrico se encuentran en buen estado',
            'Las señales de seguridad son de acuerdo al estándar de la empresa',
            'Las acopios de RRSS se encuentran señalizados y en buen estado',
            'Los extintores y gabinetes contra incendios se encuentran señalizados',
            'Están las salidas de emergencia libre de obstáculos y señalizadas.',
            'Vias peatonales señalizadas'
        ]
    },
    {
        category: 'Sistemas Contra Incendio',
        items: [
            'Extintores portátiles de acuerdo al área',
            'Los extintores cuentan con codificación',
            'Los extintores se encuentran vigentes e inspeccionados',
            'Los extinotres cuentan con gabinete y/o colgador y estan en buen estado',
            'Los gabinetes contra incendio y mangueras se encuentran en buen estado',
            'Los extintores y gabinetes se encuentran señalizados',
            'Los equipos contra incendios se encuentran libres de obstáculos'
        ]
    },
    {
        category: 'Iluminación',
        items: [
            'Áreas de tránsito con iluminación adecuada y operativa',
            'Dispositivos de iluminación siempre limpios',
            'Iluminación de emergencia operativa'
        ]
    },
    {
        category: 'Tránsito peatonal',
        items: [
            'Superficies en buenas condiciones',
            'Vias peatonales señalizadas\\u200B', // zero-width space to prevent duplicate key
            'Vías peatonales libre de obstáculos',
            'Vías peatonales con superficie antideslizante'
        ]
    }
];`;
c = c.replace(sectionsRegex, newSections);

fs.writeFileSync('components/inspections/CampamentoCustomForm.tsx', c);
console.log('CampamentoCustomForm updated successfully');
