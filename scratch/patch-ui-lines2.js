const fs = require('fs');

let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

const target1 = `<img
                                src={refSrc}
                                alt="Referencia"
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity pointer-events-none mix-blend-screen"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />`;

const replace1 = `<img
                                src={refSrc}
                                alt="Referencia"
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity pointer-events-none mix-blend-screen"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {/* Overlay a rayas diagonales para indicar que está vacío */}
                            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
                                 style={{ background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, transparent 10px, transparent 20px)' }}>
                            </div>`;

const target2 = `style={{ background: isDragOver ? 'rgba(59, 130, 246, 0.8)' : 'rgba(10, 15, 25, 0.75)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <ImageIcon size={14} style={{ color: isDragOver ? 'white' : 'hsl(215,20%,70%)' }} />
                            <p className="text-[9px] font-medium tracking-wider" style={{ color: isDragOver ? 'white' : 'hsl(215,20%,85%)' }}>
                                {isDragOver ? 'Suelta aquí' : 'Haz clic para subir foto'}
                            </p>`;

const replace2 = `style={{ background: isDragOver ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <ImageIcon size={14} style={{ color: isDragOver ? 'white' : '#fca5a5' }} />
                            <p className="text-[9px] font-medium tracking-wider" style={{ color: isDragOver ? 'white' : '#fca5a5' }}>
                                {isDragOver ? 'Suelta aquí' : 'Falta cargar foto'}
                            </p>`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);

fs.writeFileSync('app/generador-informes/page.tsx', code);
