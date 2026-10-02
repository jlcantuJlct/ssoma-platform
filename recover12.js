const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                const args = call.args || call.arguments;
                if (args && args.CodeContent && args.CodeContent.includes('const KIT_ITEMS_MAPPING') && !args.CodeContent.includes('recover12.js')) {
                    fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', args.CodeContent);
                    console.log('Restored KitAntiderrameCustomForm.tsx!!');
                    process.exit(0);
                }
            }
        }
    } catch(e) {}
}
