export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const dni = url.searchParams.get('dni');
        
        if (!dni || dni.length < 8) {
            return NextResponse.json({ success: false, name: '' });
        }

        const records = await db.fetchAll('SELECT personnel_list FROM sctr_monthly_records ORDER BY id DESC LIMIT 5');
        
        for (const r of records) {
            if (!r.personnel_list) continue;
            
            const text = r.personnel_list.toUpperCase();
            
            let textToSplit = text;
            
            // 1. Separar cuando hay correlativo: "1 DNI 12345678"
            textToSplit = textToSplit.replace(/\s+(\d{1,4})\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '\n$1 $2 $3');
            
            // 2. Separar cuando hay letra seguida de documento: "JUAN DNI 12345678"
            textToSplit = textToSplit.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ])\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)\s+(\d{7,15})/gi, '$1\n$2 $3');

            // 3. Separar cuando el documento está al revés: "JUAN 12345678 DNI"
            textToSplit = textToSplit.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ])\s+(\d{7,15})\s+(DNI|CEX|PAS|RUC|CIP|N°|Nro\.?)/gi, '$1\n$2 $3');

            const lines = textToSplit.split('\n').map(l => l.trim()).filter(l => l.length > 2);
            
            for (const line of lines) {
                // Asegurarse de que el DNI coincida exactamente y no sea parte de un número más largo
                const dniRegex = new RegExp(`\\b${dni}\\b`);
                if (dniRegex.test(line)) {
                    let cleaned = line;
                    cleaned = cleaned.replace(/^\d+\s+/, '');
                    cleaned = cleaned.replace(new RegExp(`(DNI|CIP|RUC|NRO\\.?|N°)?\\s*${dni}\\b`, 'i'), '');
                    
                    const stopwords = ["AVENIDA", "JULIO", "MIRAFLORES", "LIMA", "PERU", "MAPFRE", "WWWMAPFREPEOM", "NRO", "CONSTANCIA", "UBICACION", "UBICACIÓN", "RIESGO", "RIESGOLOCALOBRA", "LOCAL", "OBRA", "ASEGURADO", "ASEGURADOS", "ASEGURAMIENTO", "ASEGURADAS", "COMPAÑIA", "COMPAÑÍA", "EMPRESA", "ADMINISTRACION", "CONSTCION", "POLIZA", "PÓLIZA", "PENSIONES", "SALUD", "VIGENCIA", "TRABAJO", "LEY", "NORMAS", "COMPLEMENTARIAS", "EXPIDE", "FINES", "PRESENTE", "DEJAMOS", "PERSONAS", "ABAJO", "NOMBRADAS", "ESTAN", "ESTÁN", "NUESTRA", "NOMBRE", "CONTRATO", "HASTA", "COBERTURAS", "SEGUN", "SEGÚN", "MP", "SA", "NO", "CON", "DEL", "EL", "POR", "Y", "EN", "A", "T", "F", "MEDIANTE", "QUE", "BAJO", "DNI", "CIP", "RUC", "NRO", "N°", "DE", "LA", "LOS", "LAS"];
                    
                    stopwords.forEach(sw => {
                        const regex = new RegExp(`\\b${sw}\\b`, 'gi');
                        cleaned = cleaned.replace(regex, ' ');
                    });
                    
                    cleaned = cleaned.replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '').trim().replace(/\s+/g, ' ');
                    
                    const words = cleaned.split(' ');
                    if (words.length > 5) {
                        cleaned = words.slice(0, 4).join(' '); // Tomar los primeros 4 que suelen ser nombres
                    }
                    
                    if (cleaned.length > 5) {
                        return NextResponse.json({ success: true, name: cleaned });
                    }
                }
            }
        }

        return NextResponse.json({ success: false, name: '' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
