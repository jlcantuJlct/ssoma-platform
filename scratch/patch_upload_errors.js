const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldFunc = /const processTemarioUpload = async \(file: File\) => \{[\s\S]*?if \(fileInputRef\.current\) fileInputRef\.current\.value = '';\n        }\n    };/;

const newFunc = `const processTemarioUpload = async (file: File) => {
        setIsUploadingTemario(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderName', \`Temarios_Mensuales/\${currentYear}/\${programMonthFilter}\`);
        formData.append('fileName', \`Temario_\${MONTHS[programMonthFilter]}_\${currentYear}.pdf\`);

        try {
            const uploadRes = await fetch('/api/upload-evidence', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                if (uploadRes.status === 413) throw new Error("El archivo es demasiado grande (Límite Vercel: 4.5MB). Por favor, comprímelo.");
                if (uploadRes.status === 504) throw new Error("El servidor tardó demasiado (Timeout). El PDF podría ser muy pesado para subirse a Drive desde Vercel.");
                
                try {
                    const errJson = JSON.parse(errText);
                    throw new Error(errJson.error || \`Error HTTP \${uploadRes.status}\`);
                } catch {
                    throw new Error(\`Error de servidor (\${uploadRes.status}): \${errText.substring(0,100)}\`);
                }
            }
            
            const uploadData = await uploadRes.json();

            if (uploadData.success || uploadData.path) {
                const driveUrl = uploadData.path;
                const saveRes = await fetch('/api/monthly-temarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ month: programMonthFilter, year: currentYear, url: driveUrl })
                });
                
                if (!saveRes.ok) {
                    const saveErrText = await saveRes.text();
                    try {
                        const saveErrJson = JSON.parse(saveErrText);
                        throw new Error("Base de datos: " + (saveErrJson.error || \`HTTP \${saveRes.status}\`));
                    } catch {
                        throw new Error(\`Error guardando URL en BD (\${saveRes.status})\`);
                    }
                }
                
                const saveData = await saveRes.json();
                
                if (saveData.success) {
                    setMonthlyTemarioUrl(driveUrl);
                    alert('✅ Temario mensual subido y guardado exitosamente.');
                } else {
                    alert('⚠️ Error al guardar la URL del temario: ' + saveData.error);
                }
            } else {
                alert('⚠️ Error subiendo el PDF a Drive: ' + uploadData.error);
            }
        } catch (err: any) {
            console.error(err);
            alert(\`⚠️ Fallo en la subida: \${err.message || 'Error de red o conexión'}\`);
        } finally {
            setIsUploadingTemario(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };`;

content = content.replace(oldFunc, newFunc);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched processTemarioUpload with better error handling.');
