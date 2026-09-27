const fs = require('fs');
['components/inspections/EppCustomForm.tsx', 'components/inspections/MachineryCustomForm.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(
        /if \(\!emailRes\.ok\) throw new Error\('Error enviando correo'\);\s*alert\('✅ Correo enviado correctamente con el reporte ya revisado\.'\);\s*\} catch\(e\) \{/,
        "if (!emailRes.ok) throw new Error('Error enviando correo');\n                                alert('✅ Correo enviado correctamente con el reporte ya revisado.');\n                                window.location.href = '/inspections?openDigital=true';\n                            } catch(e) {"
    );
    fs.writeFileSync(file, content);
});
