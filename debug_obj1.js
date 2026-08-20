const fs = require('fs');

async function debug() {
    const data = JSON.parse(fs.readFileSync('C:\\Users\\jlcan\\Desktop\\debug_capacitaciones_matrix.json', 'utf8'));
    // The debug file only has matrixObj2. I need to get obj1 from DB!
}
debug();
