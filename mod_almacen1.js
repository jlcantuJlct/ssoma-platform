const fs = require('fs');

const sections = [
    {
        title: 'Consideraciones generales',
        items: [
            'Almacen limpio y ordenado',
            'Pasillos señalizados, libres de obstaculos y con iluminación adecuada',
            'Se prohibe el ingreso al personal no autorizado',
            'Áreas de carga y descarga claramente definidas y señalizadas',
            'Indicaciones de peso máximo en anaqueles y estantes se encuentran asegurados',
            'Estan definidos la zona de Productos conformes, no conformes y fuera de servicio',
            'Cuenta con un sistema para alcanzar el producto, material, etc. en la parte más alta',
            'Se encuentran bien apilados y ordenas los materiales, equipos, etc.',
            'Espacio suficiente entre pilas para que pase una persona',
            'Los articulos más pesados se almacenan en la parte más baja del anaquel',
            'Los materiales, equipos, insumos, etc. Se encuentran rotulados en los anaqueles',
            'Se cuenta con contendores para la segregación de residuso sólidos',
            'El personal realiza análisis de trabajo seguro (ATS)',
            'Condición de parihuelas adecuadas'
        ]
    },
    {
        title: 'Almacén de MATPEL',
        items: [
            'Cilindro de gas comprimido en posición vertical con sus válvulas protegidas',
            'Cilindros de gases comprimidos identificados con los colores normados',
            'Los cilindros de gas comprimido se encuentran en una zona aislada y asegurados',
            'Se cuentra con matriz de compatibilidad de productos químicos en una zona visible',
            'Productos químicos completamente cerrados y aislados',
            'Productos apilados e identificados en forma adecuada',
            'Productos quimicos cuando con clasificación MATPEL y Rombo NFPA 704',
            'Se cuenta con las hojas MSDS de los productos químicos',
            'El personal se encuentra capacitado en manipulación del productos químicos',
            'Personal usa el EPP adecuado para la manipulación de productos químicos',
            'Iluminación adecuada',
            'Se cuenta con dispositivo Kit antiderrame y se encuentra inspeccionado',
            'Se cuenta con extintor operativo e inspeccionado',
            'Se cuenta con señalización de seguridad de acuerdo al riesgo asociado'
        ]
    },
    {
        title: 'Señales de Seguridad',
        items: [
            'Cuenta con mapa de riesgo y evacuación exhibido',
            'Cuentan con señalización de seguridad y están en buen estado',
            'Las señales de seguridad son de acuerdo al riesgo asociado en el área de trabajo'
        ]
    },
    {
        title: 'Sistemas Contra Incendio',
        items: [
            'Se cuenta con extintores en almacenes de productos inflamable y/o combustible',
            'Los extinotres estan ubicados en puntos accesbles y de facil identificación',
            'Los extintores estan operativos y con Inspección mensual vigente',
            'Registro de pruebas del funcionamiento de equipos contra incendio',
            'Los extinotres se encuentran señalizados y códificados',
            'Equipos de emergencia se encuentran libres de obstáculos'
        ]
    },
    {
        title: 'Almacenamiento de Residuos',
        items: [
            'Almacen ordenado',
            'Acceso al personal permitido',
            'Se mantiene cerrado mientras no este en uso',
            'Espacio suficiente para la cantidad de residuos generados',
            'Condición de parihuelas adecuadas',
            'Uso de geomembramas (En caso aplique)',
            'Almacen temporal de residuos sólidos techado e impermeable',
            'Extintor PQS de 9 Kg con fechas vigentes en su PQS y Prueba Hidrostática',
            'Cuenta con kit antiderrame cerca al almacén temporal',
            'Almacén de RAEES de acuerdo a normativa legal vigente, ordenada y distribuida por zonas.',
            'Almacenamiento adecuado para los residuos biocontaminados',
            'Almacenes y zonas de residuos correctamente identificadas y señalizadas',
            'Envases con productos químicos debidamente rotulados, etiquetas incluyen precauciones de peligro (si lo requiere)',
            'Se cuenta con las hojas MSDS de los productos peligrosos',
            'Se cuenta con los controles establecidos en las hojas MSDS de los productos peligrosos',
            'Personal usa el EPP adecuado para la manipulación de los residuos',
            'Iluminación adecuada',
            'Se cuenta con un adecuado acopio de residuos',
            'Correcta segregación de residuos / Correcto uso de los contenedores de residuos',
            'Carteles de advertencia',
            'Matriz IPERC exhibida'
        ]
    }
];

let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

c = c.replace(/export default function BotiquinCustomForm/g, "export default function AlmacenCustomForm");

// Replace the sections array
const newSectionsDef = `const almacenSections = ${JSON.stringify(sections, null, 4)};`;
c = c.replace(/const botiquinSections = \[[\s\S]*?\];/m, newSectionsDef);

// Also replace mentions of botiquinSections
c = c.replace(/botiquinSections/g, 'almacenSections');

// We need to fix the meta state
// meta: { area: '', inspector: '', cargo: '', responsable: '', fecha: new Date().toISOString().split('T')[0] }
const metaRegex = /const \[meta, setMeta\] = useState\(\{[\s\S]*?\}\);/;
c = c.replace(metaRegex, `const [meta, setMeta] = useState({ area: '', inspector: '', cargo: '', responsable: '', fecha: new Date().toISOString().split('T')[0] });`);

// The firmas state needs to be inspectorFirma and responsableFirma
const firmasRegex = /const \[firmas, setFirmas\] = useState\(\{[\s\S]*?\}\);/;
c = c.replace(firmasRegex, `const [firmas, setFirmas] = useState({ inspectorFirma: '', responsableFirma: '', inspectorNombre: '', responsableNombre: '' });`);

// Inside useEffect for `user`, set inspectorName
c = c.replace(/setFirmas\(prev => \(\{ \.\.\.prev, inspectorNombre: user\.name \|\| '' \}\)\);/g, `setFirmas(prev => ({ ...prev, inspectorNombre: user.name || '' }));`);
c = c.replace(/setMeta\(prev => \(\{ \.\.\.prev, inspector: user\.name \|\| '' \}\)\);/g, `setMeta(prev => ({ ...prev, inspector: user.name || '' }));`);

// Module name
c = c.replace(/moduleName: 'Botiquines'/g, "moduleName: 'Almacenes'");
c = c.replace(/Botiquines/g, "Almacenes");

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Modified AlmacenCustomForm (pass 1)');
