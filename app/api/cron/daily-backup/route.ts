export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Permitir hasta 60s en Vercel Hobby

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import JSZip from 'jszip';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzUxEDgad2mc2tfsWwfAlh4RHa0QKA_mJLcUN7AEe1jjEKOznkZ1myAIHe79zhxUB4/exec";
const BACKUP_FOLDER = "BACKUPS/Base de Datos (Diario)";

export async function GET(req: Request) {
    try {
        // Validación básica de seguridad si se llama manualmente o por Cron
        const authHeader = req.headers.get('authorization');
        const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
        const isManual = req.url.includes('manual=true'); // Permitir forzarlo manualmente con ?manual=true

        if (!isCron && !isManual) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        console.log("🔄 Iniciando Backup Diario Completo de la Base de Datos...");
        const start = Date.now();

        // 1. Obtener lista de tablas
        const resTables = await db.fetchAll(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        const tables = resTables.map((r: any) => r.table_name);

        const zip = new JSZip();
        let totalRows = 0;

        // 2. Extraer datos y generar CSVs
        for (const table of tables) {
            const data = await db.fetchAll(`SELECT * FROM ${table}`);
            if (!data || data.length === 0) continue;
            
            totalRows += data.length;
            const keys = Object.keys(data[0]);
            const header = keys.join(',') + '\n';
            
            const body = data.map((r: any) => keys.map(k => {
                let val = r[k];
                if (val === null || val === undefined) return '';
                if (typeof val === 'object') {
                    try { val = JSON.stringify(val); } catch (e) { val = String(val); }
                }
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')).join('\n');
            
            zip.file(`${table}.csv`, header + body);
        }

        // 3. Generar archivo ZIP (Base64)
        const base64Zip = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `SSOMA_DB_Backup_${dateStr}.zip`;

        // 4. Subir a Google Drive
        const payload = {
            filename: fileName,
            mimetype: 'application/zip',
            fileBase64: base64Zip,
            folderId: '1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5',
            folderPath: BACKUP_FOLDER,
            folderName: BACKUP_FOLDER
        };

        console.log(`📤 Subiendo backup (${(base64Zip.length/1024).toFixed(2)} KB)...`);
        
        const resDrive = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const driveData = await resDrive.json();
        
        if (driveData.result === 'success') {
            console.log(`✅ Backup completado en ${(Date.now() - start)/1000}s. URL: ${driveData.url}`);
            return NextResponse.json({
                success: true,
                message: `Backup creado exitosamente`,
                tables: tables.length,
                rows: totalRows,
                url: driveData.url
            });
        } else {
            throw new Error(driveData.error || 'Error desconocido al subir a Drive');
        }

    } catch (error: any) {
        console.error('❌ Error en Backup Diario:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
