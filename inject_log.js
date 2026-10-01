const fs = require('fs');
let c = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

c = c.replace(
    /const data = await res\.json\(\);\s*driveUrl = data\.driveUrl \|\| '';/,
    `const data = await res.json();
            if (!data.success) require('fs').writeFileSync('export_error.log', JSON.stringify(data));
            driveUrl = data.driveUrl || '';`
);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', c);
console.log('Injected error logging');
