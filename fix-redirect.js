const fs = require('fs');
let content = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf-8');

// 1. Fix onSend block where cachedDriveUrl exists
const onSendTarget = `if (!emailRes.ok) throw new Error('Error enviando correo');
                                  alert('✅ Correo enviado correctamente con el reporte ya revisado.');
                              } catch(e) {`;
const onSendReplacement = `if (!emailRes.ok) throw new Error('Error enviando correo');
                                  alert('✅ Correo enviado correctamente con el reporte ya revisado.');
                                  window.location.href = '/inspections?openDigital=true';
                              } catch(e) {`;
content = content.replace(onSendTarget, onSendReplacement);

// 2. Fix handleSaveAndDownload block for direct email
const directEmailTarget = `if (!emailRes.ok) throw new Error('Error al enviar correo');
                        } catch (e) {`;
const directEmailReplacement = `if (!emailRes.ok) throw new Error('Error al enviar correo');
                            alert('✅ Correo enviado correctamente.');
                            window.location.href = '/inspections?openDigital=true';
                        } catch (e) {`;
content = content.replace(directEmailTarget, directEmailReplacement);

// 3. Fix handleSaveAndDownload block for non-email (cancel button)
const cancelTarget = `if (window.confirm('¡Descarga y guardado exitoso!\\n\\n1. Por favor abre el Excel que se acaba de descargar y revísalo.\\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo ahora mismo (SIN crear duplicados).\\n3. Si quieres salir, haz clic en "Cancelar".')) {
                        setShowEmailModal(true);
                    }
                }`;
const cancelReplacement = `if (window.confirm('¡Descarga y guardado exitoso!\\n\\n1. Por favor abre el Excel que se acaba de descargar y revísalo.\\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo ahora mismo (SIN crear duplicados).\\n3. Si quieres salir, haz clic en "Cancelar".')) {
                        setShowEmailModal(true);
                    } else {
                        window.location.href = '/inspections?openDigital=true';
                    }
                }`;
content = content.replace(cancelTarget, cancelReplacement);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', content);
