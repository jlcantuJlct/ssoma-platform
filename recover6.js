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
                if (cArgs.CodeContent && cArgs.CodeContent.includes('const KIT_ITEMS_MAPPING')) {
                    fs.writeFileSync('recovered_file_codecontent.tsx', cArgs.CodeContent);
                    console.log('Recovered from CodeContent at index', i);
                    process.exit(0);
                }
            }
        }
    } catch(e) {}
}
