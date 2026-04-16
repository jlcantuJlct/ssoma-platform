const mammoth = require("mammoth");

const normalizeTag = (str) => {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]/g, '_') 
        .replace(/_+/g, '_') 
        .replace(/^_|_$/g, ''); 
};

mammoth.extractRawText({path: "C:\\Users\\jlcan\\Desktop\\CASA 2026\\Informe San Clemente\\Marzo 2026\\PAD_SAN CLEMENTE - 12.04.26 B VF2.docx"})
    .then(function(result){
        const text = result.value; 
        const lines = text.split('\n');
        
        console.log("=== FOTOGRAFÍAS ENCONTRADAS EN EL INFORME ===");
        
        let photoCount = 0;
        lines.forEach(line => {
            if (line.toLowerCase().includes('fotografía') && line.includes(':')) {
                photoCount++;
                console.log(`\n[Encontrado]: ${line.trim()}`);
                
                // Extraer lo que está después de los dos puntos
                const parts = line.split(':');
                if(parts.length > 1) {
                    const description = parts.slice(1).join(':').trim();
                    console.log(`  Descripción de la foto: "${description}"`);
                    
                    // Sugerir etiqueta (el usuario debe emparejar la actividad de la DB)
                    // Ej. "Baños químicos instalado PAD San Clemente."
                    // Podría ser actividad "Baños químicos" y zona "PAD San Clemente"
                    // Vamos a imprimir sugerencias genéricas y la etiqueta normalizada
                    const tag = normalizeTag(description.replace(/\./g, ''));
                    console.log(`  -> Etiqueta sugerida para agrupar esto: {#${tag}}`);
                }
            }
        });
        
        console.log(`\nTotal de fotografías detectadas: ${photoCount}`);
    })
    .catch(err => console.error(err));
