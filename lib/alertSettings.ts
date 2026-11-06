import db from '@/lib/db';

export const DEFAULT_SUPERVISOR_CC = [
    { email: 'jlcantu.jlct@gmail.com', name: 'Jose Luis Cancino' },
    { email: 'jcancino@casacontratistas.com', name: 'J. Cancino' },
    { email: 'rguerra@casacontratistas.com', name: 'R. Guerra' },
    { email: 'mescobar@casacontratistas.com', name: 'Marcus Escobar' },
];

export async function ensureAlertSettingsTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_alert_settings (
                username VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255),
                workspace VARCHAR(100),
                email_enabled INTEGER DEFAULT 1,
                whatsapp_enabled INTEGER DEFAULT 1,
                deactivated INTEGER DEFAULT 0,
                email VARCHAR(255),
                phone VARCHAR(50),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS alert_cc_settings (
                email VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                enabled INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e: any) {
        console.error('Error ensuring alert settings tables:', e?.message || e);
    }
}
