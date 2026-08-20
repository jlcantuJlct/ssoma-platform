import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'templates');
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'scsst_acta_template.docx');

export async function GET() {
    try {
        if (fs.existsSync(TEMPLATE_PATH)) {
            return NextResponse.json({ success: true, url: '/templates/scsst_acta_template.docx' });
        }
        return NextResponse.json({ success: true, url: null });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        if (!fs.existsSync(TEMPLATE_DIR)) {
            fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(TEMPLATE_PATH, buffer);

        return NextResponse.json({ success: true, url: '/templates/scsst_acta_template.docx' });
    } catch (error: any) {
        console.error('Error saving template:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
