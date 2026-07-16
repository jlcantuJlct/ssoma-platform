const fs = require('fs');
const path = require('path');

function searchInDir(dir, pattern) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                searchInDir(fullPath, pattern);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(pattern)) {
                console.log(`Found "${pattern}" in: ${fullPath}`);
            }
        }
    }
}

searchInDir(path.join(process.cwd(), 'app'), 'objectives/');
searchInDir(path.join(process.cwd(), 'components'), 'objectives/');
