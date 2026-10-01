const fs = require('fs');
let c = fs.readFileSync('components/inspections/InstalacionesElectricasCustomForm.tsx', 'utf8');

const newChecklist = `const sectionsToRender = [
    {
        title: 'Sistemas Eléctricos',
        items: [
            'Paneles de alta tensión cerrados y asegurados',
            'Paneles de control cerrados y asegurados',
            'Paneles de control accesibles y bien señalizados',
            'Buenas condiciones de aislamiento',
            'Registro de pruebas de instalación a tierra',
            'Cajas eléctricas en buena condición operacional',
            'Paneles eléctricos adaptados para bloqueo y etiquetado',
            'Generadores sobre base impermeable',
            'Puesta a tierra de grupos electrógenos',
            'Cableado adecuado en grupos electrógenos y tableros eléctricos'
        ]
    },
    {
        title: 'Instalaciones Eléctricas Provisionales',
        items: [
            'Circuitos eléctricos provisionales cuentan con línea a tierra',
            'Las extensiones eléctricas provisionales no cruzan por zonas de tránsito peatonal y/o vehicular; ni en zonas expuestas a bordes afilados, impactos aprisionamientos, rozamientos o fuentes de calor y proyección de chispas',
            'Los conductores eléctricos no están expuestos al contacto con el agua o la humedad.',
            'Instalaciones eléctricas a prueba de explosión en ambientes que contienen líquidos y/o gases inflamables, polvos o fibras combustibles que puedan causar fuego o explosiones en presencia de una fuente de ignición',
            'Toda extensión eléctrica temporal, sin excepción, cumple las siguientes especificaciones: Conductor tripolar vulcanizado flexible de calibre adecuado (mínimo: NMT 3x10) en toda su longitud.',
            'Los conductores empalmados son del mismo calibre y utilizan conectores adecuados revestidos con cinta vulcanizante y aislante.',
            'Los enchufes y tomacorrientes son del tipo industrial, blindado, con tapa rebatible y sellado en el empalme con el cable.',
            'Los tableros eléctricos cuentan con interruptores termomagnéticos e interruptores diferenciales de alta (30 mA) y baja (300 mA) sensibilidad'
        ]
    },
    {
        title: 'Equipamiento Interno del Tablero Eléctrico',
        items: [
            'Interruptor General 3 x 150 A de 25 kA, 220V',
            'Interruptor Termomagnético 3 x 60 A 10 kA, 220V',
            'Interruptor diferencial 2 x 40 A 6 kA, 220V de alta sensibilidad (30 mA)',
            'Juegos de Tomacorrientes + enchufe blindado 3 x 63 A 3 polos +T/380V',
            'Tomacorrientes doble hermético 16 A + T/220V',
            'Prensaestopas 1-1/2” p/ ingreso de cables de alimentación',
            'Bornera de línea tierra',
            'Lámpara Piloto 220V'
        ]
    }
];`;

const oldChecklistRegex = /const sectionsToRender = \[[\s\S]*?\];\s*(?=export default function)/m;
c = c.replace(oldChecklistRegex, newChecklist + '\n\n');

fs.writeFileSync('components/inspections/InstalacionesElectricasCustomForm.tsx', c);
console.log('Fixed checklist replacement in InstalacionesElectricasCustomForm');
