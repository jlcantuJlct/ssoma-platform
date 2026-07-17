const fs = require('fs');
let c = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

const oldCacheBlock = `const cacheKey = \`ref_url_\${docType}_\${tagName}\`;
    const [src, setSrc] = React.useState<string>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(cacheKey) || '';
        }
        return '';
    });`;

c = c.replace(oldCacheBlock, "const [src, setSrc] = React.useState<string>('');");
c = c.replace(/sessionStorage\.setItem\(cacheKey, url\);/g, '');
c = c.replace(/const url = `\/\$\{folder\}\/\$\{tagName\}\.\$\{ext\}`;/g, 'const url = `/${folder}/${tagName}.${ext}?v=2`;');

fs.writeFileSync('app/generador-informes/page.tsx', c);
