export interface MonthlyData {
    plan: number[];
    executed: number[];
    accumulated?: number[];
}

export interface AuditLog {
    user: string;
    date: string;
    time: string;
    action: string;
}

export interface Activity {
    id: string;
    name: string;
    responsible: string;
    target: string;
    frequency: string;
    data: MonthlyData;
    progress: number;
    evidence?: (string | null)[]; // URL or filename per month
    history?: AuditLog[];
    managementArea?: string; // safety, health, environment
}

export interface Section {
    id: string;
    title: string;
    goal: string;
    indicator: string;
    activities: Activity[];
}

export interface DashboardData {
    sections: Section[];
    lastUpdated?: string;
}

export const MONTHS = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'
];

export type UploadContext = 'Formacion' | 'Inspeccion' | 'PMA' | 'Actividad' | string;
