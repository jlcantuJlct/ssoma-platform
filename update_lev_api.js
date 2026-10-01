const fs = require('fs');

let route = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

route = route.replace(
    /let driveUrl = '';\s*try \{\s*const mockReq/m,
    `let driveUrl = '';\n        let fileBase64 = '';\n        try {\n            const mockReq`
);

route = route.replace(
    /driveUrl = data\.driveUrl \|\| '';\s*\} catch \(e\) \{/m,
    `driveUrl = data.driveUrl || '';\n            fileBase64 = data.fileBase64 || '';\n        } catch (e) {`
);

route = route.replace(
    /return NextResponse\.json\(\{ success: true, driveUrl, isParcial \}\);/g,
    `return NextResponse.json({ success: true, driveUrl, isParcial, fileBase64 });`
);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', route);
console.log("Updated levantamiento API");
