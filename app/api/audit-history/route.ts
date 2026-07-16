export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('user');

        if (!username) {
            return NextResponse.json({ success: false, error: 'Usuario no especificado' }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'data', 'audit_history.json');
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ success: true, history: [] });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (!fileContent) {
            return NextResponse.json({ success: true, history: [] });
        }

        const history = JSON.parse(fileContent);
        
        // Filtrar por el nombre de usuario (puede ser el nombre completo o username dependiendo de cómo se guardó)
        // Por seguridad, hacemos un substring / includes.
        const userHistory = history.filter((log: any) => {
            if (!log.user_name) return false;
            return log.user_name.toLowerCase().includes(username.toLowerCase());
        });

        // Retornar los últimos 10
        return NextResponse.json({ success: true, history: userHistory.slice(0, 10) });

    } catch (error: any) {
        console.error('Error fetching audit history:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
