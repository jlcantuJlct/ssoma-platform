import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const data = await pdf(buffer);
        
        return NextResponse.json({ 
            success: true, 
            text: data.text,
            info: data.info,
            numpages: data.numpages
        });

    } catch (error: any) {
        console.error('Error parsing PDF:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
