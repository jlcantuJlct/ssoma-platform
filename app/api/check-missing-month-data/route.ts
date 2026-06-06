export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

const MONTH_NAMES = [
    "01. ENERO", "02. FEBRERO", "03. MARZO", "04. ABRIL", "05. MAYO", "06. JUNIO",
    "07. JULIO", "08. AGOSTO", "09. SEPTIEMBRE", "10. OCTUBRE", "11. NOVIEMBRE", "12. DICIEMBRE"
];

const SIMPLE_MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export async function GET() {
    try {
        const now = new Date();
        // Timezone in Lima
        const limaDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }));
        
        const year = limaDate.getFullYear();
        const monthIndex = limaDate.getMonth(); // 0-11
        const monthPrefix = (monthIndex + 1).toString().padStart(2, '0');
        const monthLike = `${year}-${monthPrefix}-%`;
        const sctrMonth = `${monthPrefix}. ${SIMPLE_MONTH_NAMES[monthIndex].toUpperCase()}`; // Example: "06. JUNIO"
        const pmaMonth = SIMPLE_MONTH_NAMES[monthIndex]; // Example: "Junio"

        // Helper function to safely count records matching a date/month pattern
        const countQuery = async (table: string, whereClause: string, params: any[]) => {
            try {
                const res = await db.fetchOne(`SELECT COUNT(*) as c FROM ${table} WHERE ${whereClause}`, params);
                return Number(res?.c || 0);
            } catch (e) {
                // If table doesn't exist or query fails, return 0 (missing data)
                return 0;
            }
        };

        // We check if data exists for the current month
        const hhc = await countQuery('hhc_records', 'date LIKE ?', [monthLike]);
        const ats = await countQuery('ats_records', 'date LIKE ?', [monthLike]);
        const petar = await countQuery('petar_records', 'date LIKE ?', [monthLike]);
        const epp = await countQuery('epp_records', 'date LIKE ?', [monthLike]);
        const rep_ac = await countQuery('reporte_ac_records', 'date LIKE ?', [monthLike]);
        const acc = await countQuery('accidentes_records', 'date LIKE ?', [monthLike]);
        const insp = await countQuery('inspection_records', 'date LIKE ?', [monthLike]);
        
        const scsst = await countQuery('evidence_center_records', 'date LIKE ?', [monthLike]); // evidence
        const sctr = await countQuery('sctr_monthly_records', 'month LIKE ? AND year = ?', [`%${pmaMonth}%`, year]);
        
        const risstma = await countQuery('risstma_records', 'date LIKE ?', [monthLike]);
        const sim = await countQuery('simulacro_records', 'date LIKE ?', [monthLike]);
        const desvio = await countQuery('desvio_evidence_records', 'date LIKE ?', [monthLike]);
        const emo = await countQuery('evidence_center_records', 'date LIKE ? AND (activity LIKE "%EMO%" OR activity LIKE "%Médico%")', [monthLike]);
        
        const mon = await countQuery('monitoring_records', 'date LIKE ?', [monthLike]);
        const brig = await countQuery('brigadista_records', 'date LIKE ?', [monthLike]);
        const pma = await countQuery('pma_evidence_records', 'date LIKE ?', [monthLike]);
        
        const pesaje = await countQuery('pesaje_records', 'date LIKE ?', [monthLike]);
        const gest_res = await countQuery('residuos_certificados', 'month LIKE ? OR date LIKE ?', [`%${pmaMonth}%`, monthLike]);
        const manifiesto = await countQuery('manifiesto_records', 'date LIKE ?', [monthLike]);
        const auth_aux = await countQuery('auxiliar_auths', 'date LIKE ?', [monthLike]);
        
        const sstma_docs = await countQuery('sstma_docs_records', 'date LIKE ?', [monthLike]);
        const compras = await countQuery('compras_locales', 'date LIKE ?', [monthLike]);
        const informes = await countQuery('informes_records', 'date LIKE ?', [monthLike]);
        
        const accidentabilidad = await countQuery('accidentabilidad_records', 'month LIKE ? OR date LIKE ?', [`%${pmaMonth}%`, monthLike]);
        const actas = await countQuery('actas_supervision', 'date LIKE ?', [monthLike]);
        const equip = await countQuery('equipment_certs', 'date LIKE ?', [monthLike]);
        const cliente = await countQuery('cliente_comms_records', 'date LIKE ?', [monthLike]);

        // A response mapping the route IDs to a boolean: TRUE if missing (needs alert)
        const alerts = {
            '/analytics': hhc === 0, // HHC
            '/ats': ats === 0,
            '/petar': petar === 0,
            '/epp': epp === 0,
            '/reporte-ac': rep_ac === 0,
            '/accidentes': acc === 0,
            '/inspections': insp === 0,
            
            '/scsst': scsst === 0,
            '/sctr': sctr === 0,
            
            '/risstma': risstma === 0,
            '/simulacro': sim === 0,
            '/desvio': desvio === 0,
            '/evidence': emo === 0,
            
            '/monitoreos': mon === 0,
            '/brigadistas': brig === 0,
            '/pma': pma === 0,
            
            '/residuos': pesaje === 0,
            '/gestion-residuos': gest_res === 0,
            '/manifiesto': manifiesto === 0,
            '/autorizaciones-auxiliares': auth_aux === 0,
            
            '/sstma-docs': sstma_docs === 0,
            '/compras-locales': compras === 0,
            '/informes': informes === 0,
            '/reports': accidentabilidad === 0,
            '/actas-supervision': actas === 0,
            '/equipment-certs': equip === 0,
            '/cliente': cliente === 0,
        };

        return NextResponse.json({ success: true, alerts });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
