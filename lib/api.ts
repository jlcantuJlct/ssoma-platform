
import db from './db';

export interface Objective {
    id: string;
    name: string;
    description: string;
    year: number;
    category: string;
    progress?: number; // Calculated field
}

export interface Activity {
    id: string;
    objective_id: string;
    item_number: string;
    name: string;
    responsible: string;
    public_target: string;
    frequency: string;
    progress_records?: Progress[];
}

export interface Progress {
    id: string;
    activity_id: string;
    month: number;
    plan_value: number;
    executed_value: number;
}

export async function getObjectives(year: number = 2025): Promise<Objective[]> {
    const objectives = await db.fetchAll('SELECT * FROM objectives WHERE year = ?', [year]) as Objective[];

    // Calculate overall progress per objective
    const results = await Promise.all(objectives.map(async (obj) => {
        const activities = await db.fetchAll('SELECT id FROM activities WHERE objective_id = ?', [obj.id]) as { id: string }[];
        if (activities.length === 0) return { ...obj, progress: 0 };

        let totalPlan = 0;
        let totalExec = 0;

        for (const act of activities) {
            const prog = await db.fetchOne('SELECT SUM(plan_value) as p, SUM(executed_value) as e FROM progress WHERE activity_id = ?', [act.id]) as { p: number, e: number };
            totalPlan += prog?.p || 0;
            totalExec += prog?.e || 0;
        }

        const percentage = totalPlan > 0 ? (totalExec / totalPlan) * 100 : 0;
        return { ...obj, progress: parseFloat(percentage.toFixed(2)) };
    }));

    return results;
}

export async function getObjectiveDetails(id: string) {
    const objective = await db.fetchOne('SELECT * FROM objectives WHERE id = ?', [id]) as Objective;
    if (!objective) return null;

    const activities = await db.fetchAll('SELECT * FROM activities WHERE objective_id = ? ORDER BY CAST(item_number AS FLOAT)', [id]) as Activity[];

    const activitiesWithProgress = await Promise.all(activities.map(async (act) => {
        const records = await db.fetchAll('SELECT * FROM progress WHERE activity_id = ? ORDER BY month ASC', [act.id]) as Progress[];
        return { ...act, progress_records: records };
    }));

    return { ...objective, activities: activitiesWithProgress };
}

export async function getObjectiveStats(id: string) {
    // Returns aggregated stats for charts
    const details = await getObjectiveDetails(id);
    if (!details) return null;

    // Aggregate by month
    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, plan: 0, executed: 0 }));

    details.activities.forEach(act => {
        act.progress_records?.forEach(rec => {
            if (rec.month >= 1 && rec.month <= 12) {
                monthlyStats[rec.month - 1].plan += rec.plan_value;
                monthlyStats[rec.month - 1].executed += rec.executed_value;
            }
        });
    });

    return monthlyStats;
}
