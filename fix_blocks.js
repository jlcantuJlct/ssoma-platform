const fs = require('fs');
let allBlocks = fs.readFileSync('all_blocks_clean.js', 'utf8');

if (allBlocks.trim().startsWith('} else if')) {
    allBlocks = allBlocks.replace(/^\s*\}\s*else if/, 'else if');
}

let broken = 'replace(/\\' + '\n' + '/g';
let broken2 = 'replace(/\\' + '\r\n' + '/g';
allBlocks = allBlocks.split(broken).join('replace(/\\\\n/g').split(broken2).join('replace(/\\\\n/g');

fs.writeFileSync('all_blocks_clean2.js', allBlocks);
