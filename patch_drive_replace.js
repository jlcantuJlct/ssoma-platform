const fs = require('fs');

const files = [
    'components/inspections/BotiquinCustomForm.tsx',
    'components/inspections/EstacionEmergenciaCustomForm.tsx',
    'components/inspections/KitAntiderrameCustomForm.tsx',
    'components/inspections/ExtinguisherCustomForm.tsx',
    'components/inspections/MachineryCustomForm.tsx',
    'components/inspections/EppCustomForm.tsx',
    'app/digital-inspections/[module]/fill/page.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Pattern to match the existing logic:
    // const bodyWithLink = driveLink
    //     ? `${customEmailData.message}\n\n📎 Enlace al reporte en Drive:\n${driveLink}`
    //     : customEmailData.message;
    const oldCode = /const bodyWithLink = driveLink[\s\S]*?\:\scustomEmailData\.message;/g;
    
    const newCode = `const bodyWithLink = customEmailData.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                ? customEmailData.message.replace(
                                    '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                                    driveLink ? '📎 Enlace al reporte en Drive:\\n' + driveLink : ''
                                )
                                : (driveLink ? customEmailData.message + '\\n\\n📎 Enlace al reporte en Drive:\\n' + driveLink : customEmailData.message);`;
                            
    if (code.match(oldCode)) {
        code = code.replace(oldCode, newCode);
        fs.writeFileSync(file, code);
        console.log('Patched', file);
    } else {
        console.log('Skipped', file);
    }
});
