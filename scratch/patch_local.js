const fs = require('fs');
let code = fs.readFileSync('app/desvio/page.tsx', 'utf8');

if (!code.includes("localStorage.removeItem('desvio_evidence_records');")) {
    code = code.replace(
        "useEffect(() => {",
        "useEffect(() => {\n        localStorage.removeItem('desvio_evidence_records'); // AUTO-KILL GHOSTS"
    );
    fs.writeFileSync('app/desvio/page.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Already patched");
}
