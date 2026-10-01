const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

const regex = /<h1 className="text-2xl font-bold text-slate-800 mb-2">¡Observación Levantada!<\/h1>\s*<p className="text-slate-500 mb-6 text-sm">\s*Tu evidencia fue registrada exitosamente y el área SSOMA fue notificada.\s*<\/p>/;

const repUI = `<h1 className="text-2xl font-bold text-slate-800 mb-2">
                        {isParcialState ? '¡Avance Guardado!' : '¡Observación Levantada!'}
                    </h1>
                    <p className="text-slate-500 mb-6 text-sm">
                        {isParcialState 
                            ? 'Tu evidencia parcial fue registrada en el Excel. Puedes cerrar esta pestaña y volver a usar tu enlace luego para completar las observaciones restantes.' 
                            : 'Tu evidencia fue registrada exitosamente y el área SSOMA fue notificada.'}
                    </p>`;

c = c.replace(regex, repUI);
fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed UI replacement');
