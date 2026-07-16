const fs = require('fs');

const html = fs.readFileSync('C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/Informe mensual/VISOR_FOTOS.html', 'utf8');

const targetPhotos = [72, 109, 158, 159, 162, 165, 189, 190];

targetPhotos.forEach(i => {
    const tag = 'foto_' + String(i).padStart(3, '0');
    const idx = html.indexOf(`data-tag="{%${tag}}"`);
    
    if (idx > -1) {
        const snippet = html.substring(idx, idx + 1500);
        
        let section = "Sección no identificada";
        const sectionMatch = snippet.match(/card-section[^>]*>([^<]+)</);
        if (sectionMatch) {
            section = sectionMatch[1].replace('📂', '').trim();
        }
        
        let title = "Sin título";
        const titleMatch = snippet.match(/card-title[^>]*>([^<]+)</);
        if (titleMatch && !titleMatch[1].includes('sin título identificado')) {
            title = titleMatch[1].trim();
        }
        
        // Extract some context from before
        let contextBefore = "";
        const ctxMatch = snippet.match(/ctx-block before[^>]*>([\s\S]*?)<div class="ctx-image/);
        if (ctxMatch) {
            contextBefore = ctxMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 100);
        }
        
        console.log(`\n=== ${tag} ===`);
        console.log(`Sección: ${section}`);
        console.log(`Título: ${title}`);
        console.log(`Contexto previo: ...${contextBefore}...`);
    } else {
        console.log(`\n=== ${tag} === NO ENCONTRADO EN HTML`);
    }
});
