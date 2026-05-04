import db from './db';

interface MonthlyReportData {
    monthName: string;
    year: number;
    location: string;
    stats: {
        inspections: number;
        ats: number;
        petar: number;
        hhc: number;
        // Manual stats from Command Center
        hht: number;
        accidents: Record<string, number>;
        waste: Record<string, number>;
    };
    pmaCompliance: any[];
    evidence: any[];
    annexes: any[];
    desvios: any[];
}

export async function fetchMonthlyReportData(month: number, year: number, location: string): Promise<MonthlyReportData> {
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = monthNames[month - 1];
    const datePrefix = `${year}-${month.toString().padStart(2, '0')}`;
    
    // CONSOLIDATION LOGIC: 
    // If location is SAN CLEMENTE, we also include Pisco, Chancadora and Campamento
    const isSanClemente = location.toUpperCase().includes('SAN CLEMENTE');
    
    const locationFilters = isSanClemente 
        ? ["%SAN CLEMENTE%", "%PISCO%", "%CHANCADORA%", "%CAMPAMENTO%"]
        : [`%${location.toUpperCase()}%`];

    // Exclusiones explícitas para San Clemente para evitar contaminación de datos
    const exclusions = isSanClemente ? ["%JAHUAY%", "%CHINCHAYSULLO%", "%ST6%"] : [];
    
    const generateWhere = (field: string) => {
        const inclusionPart = `(${locationFilters.map(() => `UPPER(${field}) LIKE ?`).join(' OR ')})`;
        if (exclusions.length === 0) return inclusionPart;
        const exclusionPart = exclusions.map(() => `UPPER(${field}) NOT LIKE ?`).join(' AND ');
        return `(${inclusionPart} AND ${exclusionPart})`;
    };

    // 1. Fetch System Stats
    const inspectionsRes = await db.fetchOne(
        `SELECT COUNT(*) as count FROM inspection_records WHERE (CAST(date AS TEXT) LIKE ? OR CAST(created_at AS TEXT) LIKE ?) AND ${generateWhere('zone')}`,
        [`${datePrefix}%`, `${datePrefix}%`, ...locationFilters]
    );

    const atsRes = await db.fetchOne(
        `SELECT COUNT(*) as count FROM ats_records WHERE CAST(date AS TEXT) LIKE ? AND ${generateWhere('location')}`,
        [`${datePrefix}%`, ...locationFilters]
    );

    const petarRes = await db.fetchOne(
        `SELECT COUNT(*) as count FROM petar_records WHERE CAST(date AS TEXT) LIKE ? AND ${generateWhere('location')}`,
        [`${datePrefix}%`, ...locationFilters]
    );

    const hhcRes = await db.fetchOne(
        `SELECT COUNT(*) as count FROM hhc_records WHERE CAST(date AS TEXT) LIKE ? AND ${generateWhere('lugar')}`,
        [`${datePrefix}%`, ...locationFilters]
    );

    // 2. Fetch Manual Stats from Command Center
    const manualStatsRes = await db.fetchAll(
        `SELECT stat_key, stat_value FROM monthly_stats_records WHERE month = ? AND year = ? AND location = ?`,
        [month, year, 'SAN CLEMENTE'] // Manual stats are keyed to the main project
    );

    const manualStats: any = {};
    manualStatsRes.forEach(s => manualStats[s.stat_key] = s.stat_value);

    // 3. PMA Compliance
    const pmaRecords = await db.fetchAll(
        `SELECT category as activity_name, responsible, 'OK' as status
         FROM pma_evidence_records
         WHERE CAST(date AS TEXT) LIKE ? AND ${generateWhere('location')}`,
        [`${datePrefix}%`, ...locationFilters]
    );

    // 4. Evidence & Annexes
    const evidence = await db.fetchAll(
        `SELECT * FROM evidence_center_records 
         WHERE CAST(date AS TEXT) LIKE ? AND ${generateWhere('zona')}`,
        [`${datePrefix}%`, ...locationFilters]
    );

    const annexes = await db.fetchAll(
        `SELECT * FROM report_annexes 
         WHERE (month = ? AND year = ? AND location = ?) 
         OR (is_permanent = TRUE AND location = ?)`,
        [month, year, 'SAN CLEMENTE', 'SAN CLEMENTE']
    );

    // 5. Desvios (Optional but useful for certain sections)
    const desvios = await db.fetchAll(
        `SELECT * FROM desvio_evidence_records WHERE ${generateWhere('location')} AND CAST(date AS TEXT) LIKE ?`,
        [...locationFilters, `${datePrefix}%`]
    );

    return {
        monthName,
        year,
        location,
        stats: {
            inspections: inspectionsRes?.count || 0,
            ats: atsRes?.count || 0,
            petar: petarRes?.count || 0,
            hhc: hhcRes?.count || 0,
            hht: manualStats['HHT'] || 0,
            accidents: {
                ATT: manualStats['ATT'] || 0,
                APP: manualStats['APP'] || 0,
                ATP: manualStats['ATP'] || 0,
                AM: manualStats['AM'] || 0,
                TDP: manualStats['TDP'] || 0,
                EO: manualStats['EO'] || 0,
                EP: manualStats['EP'] || 0,
            },
            waste: {
                PEL: manualStats['RES_PEL'] || 0,
                NO_PEL: manualStats['RES_NO_PEL'] || 0,
                APROV: manualStats['RES_APROV'] || 0,
            }
        },
        pmaCompliance: pmaRecords,
        evidence: evidence,
        annexes: annexes,
        desvios: desvios
    };
}
