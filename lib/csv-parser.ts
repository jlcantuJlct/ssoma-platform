import Papa from 'papaparse';
import { Activity, Section, MonthlyData, DashboardData } from './types';

// Map identifying keywords to Section IDs
const SECTION_KEYWORDS: Record<string, string> = {
    'SUBCOMITÉ DE SEGURIDAD': 'scsst',
    'Formación': 'training',
    'Inspecciones': 'inspections',
    'PROGRAMA DE IDENTIFICACIÓN DE ACTOS': 'rac',
    'Programa de Actividades de Salud': 'health',
    'PREPARACION Y RESPUESTA ANTE EMERGENCIA': 'emergency',
    'AUDITORIAS DE SEGURIDAD': 'audits',
    'Actividades medio ambiente': 'environment'
};

const MONTH_COL_START = 8; // Index for January (based on 'ENE' column)

export const parseCSV = (csvContent: string): DashboardData => {
    const lines = Papa.parse(csvContent, {
        header: false,
        skipEmptyLines: false
    }).data as string[][];

    const sections: Section[] = [];
    let currentSection: Partial<Section> | null = null;
    let currentActivities: Activity[] = [];

    // State for parsing pairs of rows (Plan/Executed)
    let pendingActivity: Partial<Activity> | null = null;

    for (let i = 0; i < lines.length; i++) {
        const row = lines[i];
        const firstCell = row[0]?.trim();
        const secondCell = row[1]?.trim();

        // Detect Section Headers
        if (firstCell && (firstCell.includes('I.') || firstCell.includes('II.') || firstCell.includes('III.') || firstCell.includes('IV.') || firstCell.includes('V.') || firstCell.includes('VI.'))) {
            // Identify section type based on text
            let sectionId = '';
            const fullLine = row.join(' ');
            for (const [bs, id] of Object.entries(SECTION_KEYWORDS)) {
                if (fullLine.includes(bs)) {
                    sectionId = id;
                    break;
                }
            }

            if (sectionId) {
                // Save previous section if exists
                if (currentSection) {
                    currentSection.activities = currentActivities;
                    sections.push(currentSection as Section);
                }

                // Start new section
                currentSection = {
                    id: sectionId,
                    title: firstCell,
                    goal: '',
                    indicator: '',
                    activities: []
                };
                currentActivities = [];
                pendingActivity = null;
                continue;
            }
        }

        // Capture Goals and Indicators (Usually appear before the section list, but in this specific CSV they appear BEFORE the headers sometimes, need to be careful.
        // Actually in the provided CSV, "Objetivo General" and "Meta" appear before "I. SUBCOMITÉ".
        // Let's attach them to the *next* section or the *current*?
        // The CSV structure: Goal/Meta -> Section Header -> Table.
        // So when we hit "Meta:", we can store it in a temporary variable to assign to the NEXT section found.

        if (!currentSection) continue; // Skip until first section found? 
        // Wait, the CSV has Meta blocks BEFORE Section blocks.
        // e.g. Line 9: "Objetivo General 1...", Line 10: "Meta...", Line 14: "I. SUBCOMITÉ..."

        // Let's refine: We might need a global "nextSectionMeta" state.

        // Strategy: Just parse the Activity rows within a section.
        // Activity Row detection:
        // It has a number in Col 0 (ITEM) usually, or it's a "Plan" row.

        const isPlanRow = row[6]?.trim() === 'Planeado';
        const isExecRow = row[6]?.trim() === 'Ejecutado';

        if (isPlanRow) {
            // Start of a new activity OR new plan row
            // Ensure we have a name. Sometimes name is in col 1.
            const name = row[1]?.trim();
            const responsible = row[3]?.trim();
            const target = row[4]?.trim(); // Publico Objetivo

            // If no name and we insist it's a new item, skip. 
            // But sometimes "Planeado" row IS the item row.

            if (name) {
                // New Activity
                if (pendingActivity) {
                    // We had one pending without execution? Push it.
                    currentActivities.push(pendingActivity as Activity);
                }

                pendingActivity = {
                    id: `${row[0]?.trim() || 'item'}-${i}`,
                    name: name,
                    responsible: responsible,
                    target: target,
                    frequency: row[5]?.trim(),
                    data: {
                        plan: parseMonthValues(row),
                        executed: []
                    },
                    progress: 0
                };
            }
        } else if (isExecRow && pendingActivity) {
            // Execution row for the pending activity
            pendingActivity.data!.executed = parseMonthValues(row);

            // Parse Progress % from original row if available or calculate?
            // Row 17 has "% Avance" at some column.
            // Col 21 (index 21) seems to be "% Avance" in line 16 header
            // Let's try to grab it from the Plan row (pendingActivity)

            // Calculate simple progress or use CSV?
            // CSV has it. Let's look for "%" in the row.
            // Actually usually it is in the Plan row, col 23?
            // We will calculate it ourselves for now to be safe: Executed / Plan.

            currentActivities.push(pendingActivity as Activity);
            pendingActivity = null;
        }
    }

    // Push last section
    if (currentSection) {
        currentSection.activities = currentActivities;
        sections.push(currentSection as Section);
    }

    return { sections };
};

function parseMonthValues(row: string[]): number[] {
    // Columns 8 (Jan) to 19 (Dec)
    const values: number[] = [];
    for (let m = 0; m < 12; m++) {
        const val = row[MONTH_COL_START + m];
        const num = parseFloat(val);
        values.push(isNaN(num) ? 0 : num);
    }
    return values;
}
