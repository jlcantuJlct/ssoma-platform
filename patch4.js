const fs = require('fs');
let file = fs.readFileSync('app/inspections/page.tsx', 'utf8');

const target = `                        }).catch(e => console.error("Error sending alert", e));`;
const replacement = `                        }).then(async (res) => {
                            if(res.ok) alert("Correo de alerta enviado a los responsables seleccionados");
                            else {
                                try {
                                    const err = await res.json();
                                    alert("Error interno enviando correo: " + (err.error || err.message || "Desconocido"));
                                } catch(e) {
                                    alert("Error interno enviando correo: Fallo desconocido");
                                }
                            }
                        }).catch(e => {
                            console.error("Error sending alert", e);
                            alert("Fallo de conexión al intentar enviar el correo");
                        });`;

file = file.replace(target, replacement);
fs.writeFileSync('app/inspections/page.tsx', file);
