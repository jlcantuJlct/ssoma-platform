const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let found = false;
for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                if (call.name === 'default_api:write_to_file' || call.name === 'write_to_file') {
                    const args = call.args || call.arguments;
                    if (args && args.TargetFile && args.TargetFile.includes('KitAntiderrameCustomForm.tsx')) {
                        if (args.CodeContent && args.CodeContent.includes('const KIT_ITEMS_MAPPING')) {
                            fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', args.CodeContent);
                            console.log('Successfully recovered original Grid rewrite from transcript!');
                            found = true;
                            break;
                        }
                    }
                }
            }
        }
        if (found) break;
    } catch(e) {}
}
