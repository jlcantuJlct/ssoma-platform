export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // Obtenemos los últimos 5 registros de SCTR para cubrir diferentes empresas/contratistas
        const records = await db.fetchAll('SELECT personnel_list FROM sctr_monthly_records ORDER BY id DESC LIMIT 5');
        
        const allNames = new Set<string>();

        records.forEach((r: any) => {
            if (!r.personnel_list) return;
            const text = r.personnel_list.toUpperCase();
            
            const attemptA = text
                .replace(/\s+(\d{1,3})\s+(DNI|N°|Nro\.?|CIP|RUC|\d{7,9})/gi, '\n$1 $2')
                .split('\n')
                .map((l: string) => l.trim())
                .filter((l: string) => l.length > 2);

            const attemptB = text
                .replace(/(DNI\s+\d{1,3})\s+(?=[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z])/g, '$1\n')
                .split('\n')
                .map((l: string) => l.trim())
                .filter((l: string) => l.length > 2);

            const best = attemptA.length >= attemptB.length ? attemptA : attemptB;
            
            const stopwords = ["AVENIDA", "JULIO", "MIRAFLORES", "LIMA", "PERU", "MAPFRE", "WWWMAPFREPEOM", "NRO", "CONSTANCIA", "UBICACION", "UBICACIÓN", "RIESGO", "RIESGOLOCALOBRA", "LOCAL", "OBRA", "ASEGURADO", "ASEGURADOS", "ASEGURAMIENTO", "ASEGURADAS", "COMPAÑIA", "COMPAÑÍA", "EMPRESA", "ADMINISTRACION", "CONSTCION", "POLIZA", "PÓLIZA", "PENSIONES", "SALUD", "VIGENCIA", "TRABAJO", "LEY", "NORMAS", "COMPLEMENTARIAS", "EXPIDE", "FINES", "PRESENTE", "DEJAMOS", "PERSONAS", "ABAJO", "NOMBRADAS", "ESTAN", "ESTÁN", "NUESTRA", "NOMBRE", "CONTRATO", "HASTA", "COBERTURAS", "SEGUN", "SEGÚN", "MP", "SA", "NO", "CON", "DEL", "EL", "POR", "Y", "EN", "A", "T", "F", "MEDIANTE", "QUE", "BAJO", "DNI", "CIP", "RUC", "NRO", "N°", "DE", "LA", "LOS", "LAS"];

            best.forEach((line: string) => {
                let cleaned = line.toUpperCase();
                
                stopwords.forEach(sw => {
                    const regex = new RegExp(`\\b${sw}\\b`, 'gi');
                    cleaned = cleaned.replace(regex, ' ');
                });

                cleaned = cleaned.replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '').trim().replace(/\s+/g, ' ');
                
                const words = cleaned.split(' ');
                if (words.length > 5) {
                    cleaned = words.slice(-4).join(' '); // Tomar solo los últimos 4 si es muy largo
                }

                if (cleaned.length > 8 && cleaned.includes(' ')) {
                    allNames.add(cleaned);
                }
            });
        });

        const namesArray = Array.from(allNames).sort();
        return NextResponse.json({ success: true, names: namesArray });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
