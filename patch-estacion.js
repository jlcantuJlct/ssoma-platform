const fs = require('fs');
let code = fs.readFileSync('components/inspections/EstacionEmergenciaCustomForm.tsx', 'utf8');

// Replace Component Name
code = code.replace(/BotiquinCustomForm/g, 'EstacionEmergenciaCustomForm');

// Replace module name and titles
code = code.replace(/moduleName: "Botiquín"/g, 'moduleName: "Estación de Emergencia"');
code = code.replace(/Inspección de Botiquín/g, 'Inspección de Estación de Primeros Auxilios');
code = code.replace(/isBotiquinesMatrix/g, 'isEstacionEmergenciaMatrix');
code = code.replace(/Botiquín/g, 'Estación de Emergencia');
code = code.replace(/botiquín/g, 'estación de emergencia');

// Update Sections
const newSections = `const sectionsToRender = [
    {
        title: 'INSPECCIÓN DE ESTACIÓN DE PRIMEROS AUXILIOS',
        items: [
            'Paquetes de guantes quirúrgicos',
            'Frasco de yodopovidoma 120 ml solución antiséptico',
            'Frasco de agua oxigenada mediano 120 ml',
            'Frasco de alcohol mediano 250 ml',
            'Paquetes de gasas esterilizadas de 10 cm x 10 cm',
            'Paquetes de apósitos (05 para Sede Central)',
            'Rollo de esparadrapo 5 cm x 4.5 cm',
            'Rollos de venda elástica de 3 plg. X 5 yardas',
            'Rollos de venda elástica de 4 plg. X 5 yardas',
            'Paquete de algodón x 100 g',
            'Venda triangular',
            'Paletas baja lengua (para entabillado de dedos)',
            'Frasco de solución de cloruro de sodio al 9/1000 x 1 l (para lavado de heridas)',
            'Paquetes de gasa tipo jelonet (para quemaduras)',
            'Frascos de colirio de 10 ml (01 para Sede Central)',
            'Tijera punta roma',
            'Pinza',
            'Jabón germicida (solo para Sede Central)',
            'Curitas (solo para Sede Central)',
            'Lava ojo portàtil',
            'Camilla rìgida - inmovilizador de cabeza',
            'frazada',
            'Collarìn regulable',
            'extintor',
            'Registro para control de entrada y salida e insumos',
            'Férula inmovilizadora'
        ]
    }
];`;

const oldSectionsRegex = /const sectionsToRender = \[[\s\S]*?\}\n\];/;
code = code.replace(oldSectionsRegex, newSections);

// Make sure the meta state includes `ubicacion` if it doesn't already.
// Botiquin already has `area`. We will use `area` for Ubicación.

fs.writeFileSync('components/inspections/EstacionEmergenciaCustomForm.tsx', code);
console.log("Patched EstacionEmergenciaCustomForm");
