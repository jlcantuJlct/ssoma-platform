const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                if (call.name === 'default_api:write_to_file' && call.arguments.TargetFile && call.arguments.TargetFile.includes('KitAntiderrameCustomForm.tsx')) {
                    console.log('Found write_to_file at index', i, 'Length:', call.arguments.CodeContent.length);
                    fs.writeFileSync('recovered_kit.tsx', call.arguments.CodeContent);
                    process.exit(0);
                }
            }
        }
    } catch(e) {}
}
