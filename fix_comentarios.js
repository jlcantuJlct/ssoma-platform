const fs = require('fs');
let c = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

const target1 = `                    if (data.finding.comentario && data.finding.comentario.includes(': ')) {
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

const rep1 = `                    if (data.finding.comentario && data.finding.comentario.startsWith('{')) {
                        try { setComentariosMap(JSON.parse(data.finding.comentario)); } catch(e){}
                    } else if (data.finding.comentario && data.finding.comentario.includes(': ')) {
                        try {
                            const cMap = {};
                            data.finding.comentario.split('\\n').forEach(line => {
                                const parts = line.split(': ');
                                if (parts.length > 1) {
                                    // fuzzy match key if the original line had a colon
                                    const val = parts.slice(1).join(': ');
                                    const matchingLine = splitted.find(l => l.startsWith(parts[0]));
                                    if (matchingLine) cMap[matchingLine] = val;
                                }
                            });
                            setComentariosMap(cMap);
                        } catch(e){}
                    }`;

c = c.replace(target1, rep1);

const target2 = `const finalComentario = lines.length > 1 ? Object.entries(comentariosMap).map(([k,v]) => \`\${k}: \${v}\`).join('\\n') : comentario;`;
const rep2 = `const finalComentario = lines.length > 1 ? JSON.stringify(comentariosMap) : comentario;`;

c = c.replace(target2, rep2);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', c);
console.log('Fixed comentariosMap bug');
