const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                if (call.arguments && call.arguments.CodeContent && call.arguments.CodeContent.includes('fs.writeFileSync(\'components/inspections/KitAntiderrameCustomForm.tsx')) {
                    console.log('Found write script at index', i);
                    fs.writeFileSync('recovered_script.txt', call.arguments.CodeContent);
                    process.exit(0);
                }
            }
        }
    } catch(e) {}
}
