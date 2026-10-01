const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

// Replace the entire signatures block
const sigBlockRegex = /<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">[\s\S]*?<div className="fixed bottom-0 left-0 right-0 p-4 bg-white\/80/m;

const newSigBlock = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                            {renderMicInput("Nombre del Inspector", "inspectorNombre", firmas.inspectorNombre, true)}
                            <div className="mt-4 flex-1 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Inspector</label>
                                <SignaturePad onSave={(val: string) => setFirmas(prev => ({...prev, inspectorFirma: val}))} />
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                            {renderMicInput("Nombre del Responsable", "responsableNombre", firmas.responsableNombre, true)}
                            <div className="mt-4 flex-1 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Responsable</label>
                                <SignaturePad onSave={(val: string) => setFirmas(prev => ({...prev, responsableFirma: val}))} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80`;

c = c.replace(sigBlockRegex, newSigBlock);

// Remove the modal code
const modalRegex = /{showSignatureModal && \([\s\S]*?\)}\s*<\/div>\s*\);\s*\}/m;
c = c.replace(modalRegex, '</div>\n    );\n}');

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Fixed digital signature pads');
