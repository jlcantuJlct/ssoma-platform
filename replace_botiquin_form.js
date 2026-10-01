const fs = require('fs');

let sectionsStr = `const sectionsToRender = [
    {
        title: 'Inspección de Botiquines',
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
            'Curitas (solo para Sede Central)'
        ]
    }
];`;

let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');

c = c.replace(/CocinaComedorCustomForm/g, 'BotiquinCustomForm');
c = c.replace(/INSPECCIÓN DE COCINA Y COMEDOR/g, 'INSPECCIÓN DE BOTIQUÍN');
c = c.replace(/isCocinaComedorMatrix/g, 'isBotiquinesMatrix');
c = c.replace(/Cocina y Comedor/g, 'Botiquín');
c = c.replace(/F-SIG-074/g, 'F-SIG-030');

// Replace sections
c = c.replace(/const sectionsToRender = \[\s*[\s\S]*?\s*\];/m, sectionsStr);

// Add Hora and Ubicación
c = c.replace(
    /\{renderMicInput\("Proyecto", "proyecto", meta\.proyecto\)\}/,
    `$&
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Hora</label>
                            <input type="time" value={meta.hora || ''} onChange={e => setMeta({...meta, hora: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                        </div>`
);

c = c.replace(
    /\{renderMicInput\("Área específica de inspección", "area", meta\.area\)\}/,
    `{renderMicInput("Ubicación del Botiquín", "ubicacion", meta.ubicacion)}`
);

c = c.replace(/meta\.area/g, `meta.ubicacion`);

fs.writeFileSync('components/inspections/BotiquinCustomForm.tsx', c);
console.log("Completely replaced BotiquinCustomForm with standard architecture");
