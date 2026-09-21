const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const t1 = `                                            {h.evidencia ? (
                                                <img src={h.evidencia} alt="Evidencia" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                            ) : (`;

const r1 = `                                            {h.evidencia ? (
                                                <>
                                                    <img src={h.evidencia} alt="Evidencia" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-bold text-xs flex-col gap-1">
                                                        <Camera size={24} />
                                                        Cambiar
                                                    </div>
                                                </>
                                            ) : (`;

const t2 = `                                            {h.evidenciaLevantamiento ? (
                                                <img src={h.evidenciaLevantamiento} alt="Levantamiento" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                            ) : (`;

const r2 = `                                            {h.evidenciaLevantamiento ? (
                                                <>
                                                    <img src={h.evidenciaLevantamiento} alt="Levantamiento" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-green-900/40 text-white font-bold text-xs flex-col gap-1">
                                                        <Camera size={24} />
                                                        Cambiar
                                                    </div>
                                                </>
                                            ) : (`;

if (code.includes(t1) && code.includes(t2)) {
    code = code.replace(t1, r1);
    code = code.replace(t2, r2);
    fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
    console.log('Fixed photo hover UI!');
} else {
    console.log('Target strings for photo hover not found.');
}
