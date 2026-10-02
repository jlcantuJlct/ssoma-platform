const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                const cArgs = call.arguments || call.args;
                if (!cArgs) continue;
                if (call.name === 'default_api:write_to_file' && cArgs.TargetFile && cArgs.TargetFile.includes('KitAntiderrameCustomForm.tsx') && cArgs.CodeContent.length > 5000) {
                    fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', cArgs.CodeContent);
                    console.log('Restored KitAntiderrameCustomForm.tsx from index', i);
                    process.exit(0);
                }
            }
        }
    } catch(e) {}
}
