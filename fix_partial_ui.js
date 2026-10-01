const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

c = c.replace(/const \[done, setDone\] = useState\(false\);/, 'const [done, setDone] = useState(false);\n    const [isParcialState, setIsParcialState] = useState(false);');

const targetLogic = `            if (data.success) {
                if (data.isParcial) {
                    alert('¡Avance guardado! Has subido evidencias parciales. El enlace seguirá activo para que subas las demás luego.');
                    window.location.reload();
                } else {
                    setDone(true);
                    setDriveUrl(data.driveUrl || '');
                }
            }`;

const repLogic = `            if (data.success) {
                setIsParcialState(data.isParcial);
                setDone(true);
                setDriveUrl(data.driveUrl || '');
            }`;

c = c.replace(targetLogic, repLogic);

const targetUI = `<h2 className="text-2xl font-bold text-slate-800 mb-2">¡Observación Levantada!</h2>
                    <p className="text-slate-500 mb-6 text-sm">Tu evidencia fue registrada exitosamente y el área SSOMA fue notificada.</p>`;

const repUI = `<h2 className="text-2xl font-bold text-slate-800 mb-2">
                        {isParcialState ? '¡Avance Guardado!' : '¡Observación Levantada!'}
                    </h2>
                    <p className="text-slate-500 mb-6 text-sm">
                        {isParcialState 
                            ? 'Tu evidencia parcial fue registrada en el Excel. Puedes cerrar esta pestaña y volver a usar tu enlace luego para completar las observaciones restantes.' 
                            : 'Tu evidencia fue registrada exitosamente y el área SSOMA fue notificada.'}
                    </p>`;

c = c.replace(targetUI, repUI);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed Partial Success UI');
