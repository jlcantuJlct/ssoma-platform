const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

const target1 = `                    if (data.finding.driveUrl) setDriveUrl(data.finding.driveUrl);
                    
                    const splitted = (data.finding.description || "").split('\\n').filter(l => l.trim().length > 0);`;

const rep1 = `                    if (data.finding.driveUrl) setDriveUrl(data.finding.driveUrl);
                    
                    const splitted = (data.finding.description || "").split('\\n').filter(l => l.trim().length > 0);
                    
                    if (data.finding.evidenciaLevantamiento && data.finding.evidenciaLevantamiento.startsWith('{')) {
                        try {
                            setEvidenciasMap(JSON.parse(data.finding.evidenciaLevantamiento));
                        } catch(e){}
                    }
                    if (data.finding.comentario && data.finding.comentario.includes(': ')) {
                        try {
                            const cMap = {};
                            data.finding.comentario.split('\\n').forEach(line => {
                                const idx = line.indexOf(': ');
                                if (idx > 0) {
                                    cMap[line.substring(0, idx)] = line.substring(idx + 2);
                                }
                            });
                            setComentariosMap(cMap);
                        } catch(e){}
                    }`;

c = c.replace(target1, rep1);

const target2 = `            const data = await res.json();
            if (data.success) {
                setDone(true);
                setDriveUrl(data.driveUrl || '');
            } else {`;

const rep2 = `            const data = await res.json();
            if (data.success) {
                if (data.isParcial) {
                    alert('¡Avance guardado! Has subido evidencias parciales. El enlace seguirá activo para que subas las demás luego.');
                    window.location.reload();
                } else {
                    setDone(true);
                    setDriveUrl(data.driveUrl || '');
                }
            } else {`;

c = c.replace(target2, rep2);

const target3 = `                                    {evidenciasMap[line] || (lines.length === 1 && evidencia) ? (`;
const rep3 = `                                    {evidenciasMap[line] || (lines.length === 1 && evidencia) ? (`;

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed page.tsx for Levantamiento Parcial');
