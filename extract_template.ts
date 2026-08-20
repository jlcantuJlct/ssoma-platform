import fs from 'fs';
import client from './lib/db';

async function run() {
    const r = await client.fetchOne("SELECT file_data FROM program_templates WHERE tipo='capacitacion'");
    if(r && r.file_data) {
        fs.writeFileSync('C:/Users/jlcan/.gemini/antigravity/brain/14636b8b-b0b3-4139-b17b-da20288b5a87/scratch/template_capacitacion.xlsx', Buffer.from(r.file_data, 'base64'));
        console.log('Saved template_capacitacion.xlsx');
    } else {
        console.log('No template found');
    }
}
run();
