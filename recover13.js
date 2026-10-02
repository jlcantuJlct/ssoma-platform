const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.step_index === 200 && obj.tool_calls) {
            for (const call of obj.tool_calls) {
                const cArgs = call.args || call.arguments;
                if (cArgs && cArgs.CodeContent) {
                    fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', cArgs.CodeContent);
                    console.log('Restored KitAntiderrameCustomForm.tsx from step 200!');
                    process.exit(0);
                }
            }
        }
    } catch(e) {}
}
