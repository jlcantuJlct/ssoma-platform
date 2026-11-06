export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { INITIAL_USERS } from '@/lib/usersData';
import { ensureAlertSettingsTable, DEFAULT_SUPERVISOR_CC } from '@/lib/alertSettings';

// GET: Obtener la configuración de alertas de todos los usuarios y lista de CC
export async function GET(req: NextRequest) {
    try {
        await ensureAlertSettingsTable();
        const rows = await db.fetchAll('SELECT * FROM user_alert_settings').catch(() => []);
        
        const dbMap: Record<string, any> = {};
        rows.forEach((r: any) => {
            dbMap[r.username] = {
                username: r.username,
                name: r.name,
                workspace: r.workspace,
                email_enabled: r.email_enabled !== 0 && r.email_enabled !== false,
                whatsapp_enabled: r.whatsapp_enabled !== 0 && r.whatsapp_enabled !== false,
                deactivated: r.deactivated === 1 || r.deactivated === true,
                email: r.email,
                phone: r.phone
            };
        });

        // Combinar con INITIAL_USERS para usuarios que no estén aún en la BD
        const merged: Record<string, any> = {};
        Object.entries(INITIAL_USERS).forEach(([key, u]) => {
            if (dbMap[key]) {
                merged[key] = {
                    ...dbMap[key],
                    name: dbMap[key].name || u.name,
                    workspace: dbMap[key].workspace || u.workspace,
                    email: dbMap[key].email || u.email,
                    phone: dbMap[key].phone || u.phone
                };
            } else {
                const isDeact = !!u.deactivated;
                merged[key] = {
                    username: key,
                    name: u.name,
                    workspace: u.workspace || 'Red Vial 6',
                    email: u.email,
                    phone: u.phone,
                    deactivated: isDeact,
                    email_enabled: !isDeact,
                    whatsapp_enabled: !isDeact
                };
            }
        });

        // Obtener configuraciones de CC a supervisión
        const ccRows = await db.fetchAll('SELECT * FROM alert_cc_settings').catch(() => []);
        const dbCcMap: Record<string, boolean> = {};
        ccRows.forEach((r: any) => {
            dbCcMap[r.email] = r.enabled !== 0 && r.enabled !== false;
        });

        const ccSettings = DEFAULT_SUPERVISOR_CC.map(c => ({
            email: c.email,
            name: c.name,
            enabled: dbCcMap[c.email] !== undefined ? dbCcMap[c.email] : true
        }));

        return NextResponse.json({ success: true, settings: merged, ccSettings });
    } catch (err: any) {
        console.error('Error in alert-settings GET:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// POST: Actualizar configuración individual o masiva de alertas y de CC
export async function POST(req: NextRequest) {
    try {
        await ensureAlertSettingsTable();
        const body = await req.json();

        // 1. Caso de actualización de CC a Supervisión
        if (body.type === 'cc' || (body.email && body.enabled !== undefined && !body.username)) {
            const email = body.email;
            const enabled = body.enabled ? 1 : 0;
            const name = body.name || '';

            const existing = await db.fetchOne('SELECT email FROM alert_cc_settings WHERE email = ?', [email]).catch(() => null);
            if (existing) {
                await db.execute('UPDATE alert_cc_settings SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [enabled, email]);
            } else {
                await db.execute('INSERT INTO alert_cc_settings (email, name, enabled) VALUES (?, ?, ?)', [email, name, enabled]);
            }
            return NextResponse.json({ success: true, message: 'Configuración CC guardada exitosamente' });
        }

        // 2. Caso de actualización de usuarios
        const updates: any[] = Array.isArray(body.updates) 
            ? body.updates 
            : [body];

        for (const item of updates) {
            const { username } = item;
            if (!username) continue;

            const existingUser = INITIAL_USERS[username] || {};
            const name = item.name || existingUser.name || username;
            const workspace = item.workspace || existingUser.workspace || 'Red Vial 6';
            const email = item.email || existingUser.email || '';
            const phone = item.phone || existingUser.phone || '';

            const email_enabled = item.email_enabled !== undefined ? (item.email_enabled ? 1 : 0) : 1;
            const whatsapp_enabled = item.whatsapp_enabled !== undefined ? (item.whatsapp_enabled ? 1 : 0) : 1;
            const deactivated = item.deactivated !== undefined ? (item.deactivated ? 1 : 0) : (existingUser.deactivated ? 1 : 0);

            const existing = await db.fetchOne('SELECT username FROM user_alert_settings WHERE username = ?', [username]).catch(() => null);

            if (existing) {
                await db.execute(
                    `UPDATE user_alert_settings 
                     SET email_enabled = ?, whatsapp_enabled = ?, deactivated = ?, name = ?, workspace = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE username = ?`,
                    [email_enabled, whatsapp_enabled, deactivated, name, workspace, email, phone, username]
                );
            } else {
                await db.execute(
                    `INSERT INTO user_alert_settings 
                     (username, name, workspace, email_enabled, whatsapp_enabled, deactivated, email, phone) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [username, name, workspace, email_enabled, whatsapp_enabled, deactivated, email, phone]
                );
            }
        }

        return NextResponse.json({ success: true, message: 'Configuración de alertas guardada exitosamente' });
    } catch (err: any) {
        console.error('Error in alert-settings POST:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
