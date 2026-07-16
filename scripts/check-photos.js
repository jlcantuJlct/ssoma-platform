const html = require('fs').readFileSync('C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/Informe mensual/VISOR_FOTOS.html', 'utf8');

[4, 5, 7, 8, 9, 10, 11, 12, 13, 14].forEach(i => {
    const tag = 'foto_' + String(i).padStart(3, '0');
    const idx = html.indexOf(tag);
    if(idx > -1) {
        const snippet = html.substring(idx, idx + 600);
        const match = snippet.match(/ctx-block before[^>]*>([\s\S]*?)<\/div>\s*<div class="ctx-label/);
        console.log(tag + ' -> ' + (match ? match[1].replace(/<[^>]+>/g, '').trim() : ''));
    }
});
