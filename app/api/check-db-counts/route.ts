import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sctr = await db.fetchOne('SELECT COUNT(*) as c FROM sctr_monthly_records').catch(() => ({c:0}));
        const brig = await db.fetchOne('SELECT COUNT(*) as c FROM brigadista_records').catch(() => ({c:0}));
        const insp = await db.fetchOne('SELECT COUNT(*) as c FROM inspection_records').catch(() => ({c:0}));
        const hhc = await db.fetchOne('SELECT COUNT(*) as c FROM hhc_records').catch(() => ({c:0}));
        const pma = await db.fetchOne('SELECT COUNT(*) as c FROM pma_evidence_records').catch(() => ({c:0}));
        const ats = await db.fetchOne('SELECT COUNT(*) as c FROM ats_records').catch(() => ({c:0}));
        const sim = await db.fetchOne('SELECT COUNT(*) as c FROM simulacro_records').catch(() => ({c:0}));

        return NextResponse.json({
            sctr: sctr.c,
            brigadistas: brig.c,
            inspecciones: insp.c,
            hhc: hhc.c,
            pma: pma.c,
            ats: ats.c,
            simulacros: sim.c,
            total_estimado: Number(sctr.c) + Number(brig.c) + Number(insp.c) + Number(hhc.c) + Number(pma.c) + Number(ats.c) + Number(sim.c)
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
