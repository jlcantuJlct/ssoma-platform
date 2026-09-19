const fs = require('fs');
let text = fs.readFileSync('all_blocks.js', 'utf8');
text = text.split('\\n').join('\n').split('\\"').join('"').split('\\\\').join('\\');
fs.writeFileSync('all_blocks_clean.js', text);
