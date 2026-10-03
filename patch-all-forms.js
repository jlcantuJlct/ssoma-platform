const fs = require('fs');
const glob = require('glob');

const forms = glob.sync('components/inspections/*CustomForm.tsx');

forms.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');

    // Replace the emailRes.ok line
    code = code.replace(
        /if \(!emailRes\.ok\) throw new Error\('.*?'\);/g,
        `if (!emailRes.ok) {
                            const errData = await emailRes.json().catch(() => ({}));
                            throw new Error(errData.error || 'Error enviando correo');
                        }`
    );

    // Replace the catch block
    code = code.replace(
        /\} catch \(e\) \{\s*console\.error\(e\);\s*alert\('El Excel se guardó, pero hubo un error al enviar el correo\.'\);\s*\}/g,
        `} catch (e: any) {
                        console.error(e);
                        alert('El Excel se guardó, pero hubo un error al enviar el correo => ' + (e.message || 'Desconocido'));
                    }`
    );

    // Some forms might have a different string
    code = code.replace(
        /\} catch \(e\) \{\s*console\.error\(e\);\s*alert\('Hubo un error al enviar el correo, pero el reporte se generó en la plataforma\.'\);\s*\}/g,
        `} catch (e: any) {
                        console.error(e);
                        alert('Hubo un error al enviar el correo, pero el reporte se generó => ' + (e.message || 'Desconocido'));
                    }`
    );
    
    // Also patch the already modified Estacion/Botiquin to match the exact string so we know it updated
    code = code.replace(
        /\} catch \(e: any\) \{\s*console\.error\(e\);\s*alert\('El Excel se guardó, pero hubo un error al enviar el correo: ' \+ e\.message\);\s*\}/g,
        `} catch (e: any) {
                        console.error(e);
                        alert('EL EXCEL SE GUARDO, PERO EL CORREO FALLO: ' + (e.message || 'Error Desconocido'));
                    }`
    );

    fs.writeFileSync(file, code);
    console.log("Patched " + file);
});
