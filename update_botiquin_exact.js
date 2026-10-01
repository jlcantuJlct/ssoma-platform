const fs = require('fs');
let c = fs.readFileSync('components/inspections/BotiquinCustomForm.tsx', 'utf8');

const newItems = `const INITIAL_BOTIQUIN_ITEMS: { name: string; qty: string }[] = [
    { name: 'Paquetes de guantes quirúrgicos', qty: '02' },
    { name: 'Frasco de yodopovidoma 120 ml solución antiséptico', qty: '01' },
    { name: 'Frasco de agua oxigenada mediano 120 ml', qty: '01' },
    { name: 'Frasco de alcohol mediano 250 ml', qty: '01' },
    { name: 'Paquetes de gasas esterilizadas de 10 cm x 10 cm', qty: '05' },
    { name: 'Paquetes de apósitos (05 para Sede Central)', qty: '08' },
    { name: 'Rollo de esparadrapo 5 cm x 4.5 cm', qty: '01' },
    { name: 'Rollos de venda elástica de 3 plg. X 5 yardas', qty: '02' },
    { name: 'Rollos de venda elástica de 4 plg. X 5 yardas', qty: '02' },
    { name: 'Paquete de algodón x 100 g', qty: '01' },
    { name: 'Venda triangular', qty: '01' },
    { name: 'Paletas baja lengua (para entabillado de dedos)', qty: '10' },
    { name: 'Frasco de solución de cloruro de sodio al 9/1000 x 1 l (para lavado de heridas)', qty: '01' },
    { name: 'Paquetes de gasa tipo jelonet (para quemaduras)', qty: '02' },
    { name: 'Frascos de colirio de 10 ml (01 para Sede Central)', qty: '02' },
    { name: 'Tijera punta roma', qty: '01' },
    { name: 'Pinza', qty: '01' },
    { name: 'Jabón germicida (solo para Sede Central)', qty: '01' },
    { name: 'Curitas (solo para Sede Central)', qty: '10' }
];`;

c = c.replace(/const INITIAL_BOTIQUIN_ITEMS: \{ name: string; qty: string \}.*?\s*];/s, newItems);

c = c.replace(
    /checklist: items\.reduce\(\(acc, item\) => \(\{ \.\.\.acc, \[item\.name\]: item\.eval \}\), \{\}\),/,
    `checklist: items.reduce((acc, item) => ({ ...acc, [item.name]: item.status }), {}),`
);

fs.writeFileSync('components/inspections/BotiquinCustomForm.tsx', c);
console.log("Updated BotiquinCustomForm string matching and payload!");
