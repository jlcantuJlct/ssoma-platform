const fs = require('fs');
const glob = require('glob');

const files = glob.sync('C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/app/**/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('<Download') || content.includes('Download size')) {
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
    let match;
    let replaced = false;
    while ((match = importRegex.exec(content)) !== null) {
      if (!match[1].includes('Download')) {
        const newImport = match[0].replace('}', ', Download }');
        content = content.replace(match[0], newImport);
        replaced = true;
      }
    }
    if (replaced) {
      fs.writeFileSync(file, content);
      console.log('Added Download to', file);
    }
  }
}
