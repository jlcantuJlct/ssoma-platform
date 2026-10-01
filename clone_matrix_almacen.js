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

let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

c = c.replace(/export default function MachineryCustomForm/g, "export default function AlmacenCustomForm");

// sections
const newSectionsDef = `const sectionsToRender = ${JSON.stringify(sections, null, 4)};`;
c = c.replace(/const sectionsToRender = \[[\s\S]*?\];/m, newSectionsDef);

// states: remove equipment, brand, model, series, operator, shift
// Add: inspector, cargo, responsable, area
const metaInitial = `const [meta, setMeta] = useState({
        proyecto: 'RED VIAL 6',
        fecha: new Date().toISOString().split('T')[0],
        area: '',
        inspector: user?.name || '',
        cargo: '',
        responsable: ''
    });`;
c = c.replace(/const \[meta, setMeta\] = useState\(\{[\s\S]*?\}\);/m, metaInitial);

// signatures
const firmasInitial = `const [firmas, setFirmas] = useState({
        inspectorFirma: '',
        responsableFirma: '',
        inspectorNombre: user?.name || '',
        responsableNombre: ''
    });`;
c = c.replace(/const \[firmas, setFirmas\] = useState\(\{[\s\S]*?\}\);/m, firmasInitial);

// signature modal states
c = c.replace(/const \[activeSignatureField, setActiveSignatureField\] = useState\<'operadorFirma' \| 'capatazFirma'\>\('operadorFirma'\);/g, `const [activeSignatureField, setActiveSignatureField] = useState<'inspectorFirma' | 'responsableFirma'>('inspectorFirma');`);

// user effect
c = c.replace(/setMeta\(prev => \(\{ \.\.\.prev, operador: user\.name \|\| '' \}\)\);/g, `setMeta(prev => ({ ...prev, inspector: user.name || '' }));`);
c = c.replace(/setFirmas\(prev => \(\{ \.\.\.prev, operadorNombre: user\.name \|\| '' \}\)\);/g, `setFirmas(prev => ({ ...prev, inspectorNombre: user.name || '' }));`);

// API payload
c = c.replace(/moduleName: 'Maquinaria',/g, "moduleName: 'Almacenes',");
c = c.replace(/isMachineryMatrix: true,/g, "isAlmacenMatrix: true,");
c = c.replace(/Machinery/g, "Almacen");
c = c.replace(/maquinaria/g, "almacen");
c = c.replace(/Maquinaria/g, "Almacenes");
c = c.replace(/inspectionType: 'Almacenes',/g, "inspectionType: 'Almacenes',"); // ensure

// input grid
const newGrid = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Proyecto</label>
                        <input type="text" value={meta.proyecto} disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Fecha de Inspección</label>
                        <input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Área de inspección específica</label>
                        <input type="text" value={meta.area} onChange={e => setMeta({...meta, area: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Inspector</label>
                        <input type="text" value={meta.inspector} onChange={e => {setMeta({...meta, inspector: e.target.value}); setFirmas({...firmas, inspectorNombre: e.target.value});}} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Cargo del Inspector</label>
                        <input type="text" value={meta.cargo} onChange={e => setMeta({...meta, cargo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Responsable de Área</label>
                        <input type="text" value={meta.responsable} onChange={e => {setMeta({...meta, responsable: e.target.value}); setFirmas({...firmas, responsableNombre: e.target.value});}} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" />
                    </div>
                </div>`;
const gridRegex = new RegExp('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">[\\s\\S]*?{/\\* Título Checklist \\*/}');
c = c.replace(gridRegex, newGrid + '\n\n                {/* Título Checklist */}');

// replace firm blocks
const sigBlock = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">FIRMA DEL INSPECTOR</label>
                        {firmas.inspectorFirma ? (
                            <div className="relative w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <img src={firmas.inspectorFirma} alt="Firma Inspector" className="w-full h-32 object-contain" />
                                <button onClick={() => setFirmas(prev => ({ ...prev, inspectorFirma: '' }))} className="absolute bottom-2 right-2 text-xs font-bold text-red-500 bg-white px-3 py-1 rounded-full shadow border border-red-100 hover:bg-red-50">Borrar</button>
                            </div>
                        ) : (
                            <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-400 bg-slate-50 transition-colors" onClick={() => { setActiveSignatureField('inspectorFirma'); setShowSignatureModal(true); }}>
                                <span className="text-slate-400 font-bold text-sm">Tocar para firmar</span>
                            </div>
                        )}
                        <input type="text" placeholder="Nombre del Inspector" value={firmas.inspectorNombre} onChange={e => setFirmas(prev => ({ ...prev, inspectorNombre: e.target.value }))} className="mt-4 w-full text-center text-sm font-bold text-slate-700 border-b border-slate-200 focus:border-emerald-500 outline-none pb-1 bg-transparent" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">FIRMA DEL RESPONSABLE</label>
                        {firmas.responsableFirma ? (
                            <div className="relative w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <img src={firmas.responsableFirma} alt="Firma Responsable" className="w-full h-32 object-contain" />
                                <button onClick={() => setFirmas(prev => ({ ...prev, responsableFirma: '' }))} className="absolute bottom-2 right-2 text-xs font-bold text-red-500 bg-white px-3 py-1 rounded-full shadow border border-red-100 hover:bg-red-50">Borrar</button>
                            </div>
                        ) : (
                            <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-400 bg-slate-50 transition-colors" onClick={() => { setActiveSignatureField('responsableFirma'); setShowSignatureModal(true); }}>
                                <span className="text-slate-400 font-bold text-sm">Tocar para firmar</span>
                            </div>
                        )}
                        <input type="text" placeholder="Nombre del Responsable" value={firmas.responsableNombre} onChange={e => setFirmas(prev => ({ ...prev, responsableNombre: e.target.value }))} className="mt-4 w-full text-center text-sm font-bold text-slate-700 border-b border-slate-200 focus:border-emerald-500 outline-none pb-1 bg-transparent" />
                    </div>
                </div>`;
const sigRegex = new RegExp('<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">[\\s\\S]*?{/\\* Action Buttons \\*/}');
c = c.replace(sigRegex, sigBlock + '\n\n                {/* Action Buttons */}');

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Successfully generated matrix-based AlmacenCustomForm');
