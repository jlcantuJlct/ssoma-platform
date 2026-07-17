const dns = require('dns').promises;

// Potential variations for the 20-character reference code
// Visual reading: izxufmamzeomzyjqjlnc
// Let's generate permutations for ambiguous letters:
// Pos 0: i or l or 1
// Pos 14: j or i
// Pos 15: q or g or p
// Pos 16: j or i
// Pos 17: l or i or 1 or t
// Pos 18: n or u
// Pos 19: c or o

const pos0 = ['i', 'l', '1'];
const pos14 = ['j', 'i'];
const pos15 = ['q', 'g'];
const pos16 = ['j', 'i'];
const pos17 = ['l', 'i', '1', 't'];
const pos18 = ['n', 'u'];
const pos19 = ['c', 'o'];

async function checkRef(ref) {
    const host = `db.${ref}.supabase.co`;
    try {
        await dns.lookup(host);
        console.log(`FOUND VALID REF: ${ref} (Host: ${host})`);
        return ref;
    } catch (e) {
        // Not found
        return null;
    }
}

async function run() {
    console.log("Starting reference code check...");
    const base = "zxufmamzeomzy"; // middle part which is very clear
    // We want to construct pos0 + base + pos14 + pos15 + pos16 + pos17 + pos18 + pos19
    const candidates = [];
    for (const p0 of pos0) {
        for (const p14 of pos14) {
            for (const p15 of pos15) {
                for (const p16 of pos16) {
                    for (const p17 of pos17) {
                        for (const p18 of pos18) {
                            for (const p19 of pos19) {
                                const ref = `${p0}${base}${p14}${p15}${p16}${p17}${p18}${p19}`;
                                candidates.push(ref);
                            }
                        }
                    }
                }
            }
        }
    }
    
    console.log(`Generated ${candidates.length} candidates. Resolving...`);
    
    // Run in chunks
    const chunkSize = 20;
    for (let i = 0; i < candidates.length; i += chunkSize) {
        const chunk = candidates.slice(i, i + chunkSize);
        const results = await Promise.all(chunk.map(checkRef));
        const found = results.filter(Boolean);
        if (found.length > 0) {
            console.log("Success! Found:", found);
            break;
        }
    }
    console.log("Finished checking candidates.");
}

run();
