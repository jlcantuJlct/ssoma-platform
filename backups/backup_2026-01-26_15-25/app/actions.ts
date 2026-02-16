
'use server'

import { writeFile } from 'fs/promises';
import { join } from 'path';
import db from '@/lib/db';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

export async function uploadEvidence(formData: FormData) {
    const file = formData.get('file') as File;
    const activityId = formData.get('activityId') as string;
    const month = parseInt(formData.get('month') as string);

    if (!file || !activityId || !month) {
        throw new Error('Faltan datos requeridos');
    }

    const fileName = `${crypto.randomUUID()}-${file.name}`;
    let publicPath = '';
    let fileType = file.type;

    try {
        // 1. Google Drive (Priority if configured)
        const hasDriveFile = (await import('fs')).existsSync(join(process.cwd(), 'service-account.json'));

        if (process.env.GOOGLE_CLIENT_EMAIL || hasDriveFile) {
            const { uploadToDrive } = await import('@/lib/googleDrive');

            // Fetch Activity Details for Folder Organization
            const activity = await db.fetchOne('SELECT name, area FROM activities WHERE id = ?', [activityId]);
            const areaName = activity?.area || 'General';
            const activityName = activity?.name || 'Varios';

            // Sanitize for folder names
            const safeArea = areaName.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim();
            const safeActivity = activityName.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim();

            const folderName = `Evidencias SSOMA ${new Date().getFullYear()}/${safeArea}/${safeActivity}`;

            const driveResult = await uploadToDrive(file, folderName, file.name);

            if (driveResult.error) {
                console.error("Drive upload failed:", driveResult.errorMessage);
                throw new Error("Google Drive Upload Failed: " + driveResult.errorMessage);
            }

            publicPath = driveResult.url;
        }
        // 2. Vercel Blob (Secondary Cloud Option)
        else if (process.env.BLOB_READ_WRITE_TOKEN) {
            const { put } = await import('@vercel/blob');
            const blob = await put(`evidence/${fileName}`, file, {
                access: 'public',
            });
            publicPath = blob.url;
        }
        // 3. Local Storage (Fallback / Local Dev)
        else {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uploadDir = join(process.cwd(), 'public', 'uploads');
            try {
                const fs = require('fs');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
            } catch (e) {
                // Ignore
            }

            const filePath = join(uploadDir, fileName);
            await writeFile(filePath, buffer);
            publicPath = `/uploads/${fileName}`;
        }

        // Save to DB
        await db.execute(
            'INSERT INTO evidence (id, activity_id, month, file_path, file_type) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), activityId, month, publicPath, fileType]
        );

        revalidatePath(`/objectives/${activityId}`);
        revalidatePath('/'); // Refresh dashboard
        return { success: true, path: publicPath };

    } catch (error: any) {
        console.error('Upload error:', error);
        return { success: false, error: error.message || 'Error al subir archivo' };
    }
}

export async function deleteActivity(activityId: string) {
    try {
        // Delete from activities table
        const result = await db.execute('DELETE FROM activities WHERE id = ?', [activityId]);

        // Also delete associated evidence
        await db.execute('DELETE FROM evidence WHERE activity_id = ?', [activityId]);

        revalidatePath('/');

        return { success: true, deleted: (result.rowCount || 0) > 0 };
    } catch (error) {
        console.error('Error deleting activity:', error);
        return { success: false, error: 'Error al eliminar la actividad' };
    }
}

export async function saveMonthlyProgram(items: any[], importType: string, selectedMonth: number) {
    try {
        await db.transaction(async () => {
            // 1. Clear existing
            if (importType === 'General') {
                await db.execute('DELETE FROM monthly_program');
            } else {
                await db.execute('DELETE FROM monthly_program WHERE area = ? AND month = ?', [importType, selectedMonth]);
            }

            for (const item of items) {
                await db.execute(`
                    INSERT INTO monthly_program (id, month, responsible, inspection_type, quantity, area)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    crypto.randomUUID(),
                    item.month !== undefined ? item.month : selectedMonth,
                    item.responsible,
                    item.type || item.inspection_type,
                    item.quantity,
                    item.area
                ]);
            }
        });

        revalidatePath('/inspections');
        return { success: true };
    } catch (error) {
        console.error('Error saving program:', error);
        return { success: false, error: 'Error al guardar el programa' };
    }
}

export async function getMonthlyProgram() {
    try {
        const rows = await db.fetchAll('SELECT month, responsible, inspection_type as type, quantity, area FROM monthly_program');
        return { success: true, data: rows };
    } catch (error) {
        console.error("Error fetching program:", error);
        return { success: false, data: [] };
    }
}


// Helper to ensure table exists (Schema matching Actions usage)
async function ensureInspectionTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS inspection_records (
            id BIGINT PRIMARY KEY,
            date VARCHAR(50),
            responsible VARCHAR(100),
            inspection_type VARCHAR(100),
            area VARCHAR(50),
            zone VARCHAR(200),
            status VARCHAR(50),
            observations TEXT,
            evidence_pdf TEXT,
            evidence_imgs TEXT
        )
    `);
}

export async function saveInspection(record: any) {
    try {
        await ensureInspectionTable();

        await db.execute(`
            INSERT INTO inspection_records (id, date, responsible, inspection_type, area, zone, status, observations, evidence_pdf, evidence_imgs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            record.id,
            record.date,
            record.responsible,
            record.inspectionType,
            record.area,
            record.zone,
            record.status,
            record.observations,
            record.evidencePdf || '',
            JSON.stringify(record.evidenceImgs || [])
        ]);

        // --- GOOGLE SHEETS BACKUP ---
        try {
            const { appendRow } = await import('@/lib/googleSheets');
            await appendRow('Inspecciones', [
                record.date,
                record.responsible,
                record.inspectionType,
                record.area,
                record.zone,
                record.status,
                record.observations,
                record.evidencePdf || '',
                (record.evidenceImgs || []).join('\n')
            ]);
            console.log("✅ Backup guardado en Google Sheets");
        } catch (sheetError) {
            console.error("⚠️ Error guardando en Google Sheets (Backup)", sheetError);
        }

        revalidatePath('/inspections');
        return { success: true };
    } catch (e) {
        console.error("Error saving inspection:", e);
        return { success: false, error: 'Error al guardar inspección' };
    }
}

export async function getInspections() {
    try {
        await ensureInspectionTable();
        const rows = await db.fetchAll('SELECT * FROM inspection_records ORDER BY date DESC');

        // Map back to frontend structure
        const mapped = rows.map((r: any) => ({
            id: Number(r.id),
            date: r.date,
            responsible: r.responsible,
            inspectionType: r.inspection_type,
            area: r.area,
            zone: r.zone,
            status: r.status,
            observations: r.observations,
            evidencePdf: r.evidence_pdf,
            evidenceImgs: JSON.parse(r.evidence_imgs || '[]')
        }));

        return { success: true, data: mapped };
    } catch (e) {
        console.error("Error loading inspections:", e);
        return { success: false, data: [] };
    }
}

export async function deleteInspectionRecord(id: number) {
    try {
        await ensureInspectionTable();
        await db.execute('DELETE FROM inspection_records WHERE id = ?', [id]);
        revalidatePath('/inspections');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Error al eliminar' };
    }
}

// --- DASHBOARD SYNC ACTIONS (Objectives 1-11) ---

export async function getDashboardActivities() {
    try {
        // Fetch all activities
        const activities = await db.fetchAll('SELECT * FROM activities');

        // Fetch all progress
        const progress = await db.fetchAll('SELECT * FROM progress');

        // Fetch evidence (for indicators)
        const evidence = await db.fetchAll('SELECT * FROM evidence');

        // Merge data
        const merged = activities.map((act: any) => {
            const actProgress = progress.filter((p: any) => p.activity_id === act.id);
            const actEvidence = evidence.filter((e: any) => e.activity_id === act.id);

            const plan = new Array(12).fill(0);
            const executed = new Array(12).fill(0);
            const evidenceMap = new Array(12).fill(null);

            actProgress.forEach((p: any) => {
                if (p.month >= 0 && p.month < 12) {
                    plan[p.month] = p.plan_value || 0;
                    executed[p.month] = p.executed_value || 0;
                }
            });

            actEvidence.forEach((e: any) => {
                if (e.month >= 0 && e.month < 12) {
                    evidenceMap[e.month] = e.file_path;
                }
            });

            return {
                id: act.id,
                objectiveId: act.objective_id,
                name: act.name,
                responsible: act.responsible,
                frequency: act.frequency,
                target: act.public_target,
                managementArea: act.area || 'safety',
                item_number: act.item_number,
                data: {
                    plan,
                    executed
                },
                evidence: evidenceMap,
                history: []
            };
        });

        return { success: true, data: merged };
    } catch (e) {
        console.error("Error fetching dashboard:", e);
        return { success: false, data: [] };
    }
}

export async function updateDashboardActivity(activityId: string, month: number, type: 'plan' | 'executed', value: number) {
    try {
        // Check if progress row exists
        const existing = await db.fetchOne('SELECT * FROM progress WHERE activity_id = ? AND month = ?', [activityId, month]);

        if (existing) {
            const col = type === 'plan' ? 'plan_value' : 'executed_value';
            // Note: Dynamic column name in UPDATE needs careful handling or strict validation to avoid SQL injection, 
            // but here 'type' is typed locally.
            // Safer:
            if (type === 'plan') {
                await db.execute('UPDATE progress SET plan_value = ? WHERE activity_id = ? AND month = ?', [value, activityId, month]);
            } else {
                await db.execute('UPDATE progress SET executed_value = ? WHERE activity_id = ? AND month = ?', [value, activityId, month]);
            }
        } else {
            const id = crypto.randomUUID();
            const plan = type === 'plan' ? value : 0;
            const exec = type === 'executed' ? value : 0;
            await db.execute(
                'INSERT INTO progress (id, activity_id, month, plan_value, executed_value) VALUES (?, ?, ?, ?, ?)',
                [id, activityId, month, plan, exec]
            );
        }

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Update error", e);
        return { success: false, error: 'Error updating' };
    }
}

// Initial Sync / Bulk Import from Client LocalStorage
export async function syncInitialData(activities: any[]) {
    try {
        await db.transaction(async () => {
            for (const act of activities) {
                // Ensure ID and required fields exist
                const existingAct = await db.fetchOne('SELECT id FROM activities WHERE id = ?', [act.id || '']);
                if (!existingAct) {
                    await db.execute('INSERT INTO activities (id, objective_id, name, responsible, frequency, public_target, area) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                        act.id || `act-${Date.now()}`,
                        act.objectiveId || 'obj-general',
                        act.name,
                        act.responsible || 'Sin Asignar',
                        act.frequency || 'Mensual',
                        act.target || '100%',
                        act.managementArea || 'safety'
                    ]);
                }

                // Progress
                if (act.data) {
                    for (let m = 0; m < 12; m++) {
                        const val = act.data.plan[m];
                        const execRaw = act.data.executed[m];
                        if (val > 0 || execRaw > 0) {
                            const existingProg = await db.fetchOne('SELECT id FROM progress WHERE activity_id = ? AND month = ?', [act.id, m]);
                            if (!existingProg) {
                                await db.execute('INSERT INTO progress (id, activity_id, month, plan_value, executed_value) VALUES (?, ?, ?, ?, ?)', [
                                    crypto.randomUUID(),
                                    act.id,
                                    m,
                                    val,
                                    execRaw
                                ]);
                            }
                        }
                    }
                }
            }
        });

        return { success: true };
    } catch (e) {
        console.error("Sync error", e);
        return { success: false };
    }
}

export async function syncProgramToDashboard(items: any[]) {
    try {
        const activities = await db.fetchAll('SELECT id, name FROM activities');

        // Group items by Type + Month
        const aggregates: Record<string, number> = {}; // "Type|Month" -> Total

        for (const item of items) {
            const key = `${item.type}|${item.month}`;
            aggregates[key] = (aggregates[key] || 0) + (item.quantity || 0);
        }

        await db.transaction(async () => {
            for (const key of Object.keys(aggregates)) {
                const [type, monthStr] = key.split('|');
                const month = parseInt(monthStr);
                const total = aggregates[key];

                // Find matching activity
                const match = activities.find((a: any) =>
                    a.name.toLowerCase().trim() === type.toLowerCase().trim() ||
                    a.name.toLowerCase().includes(type.toLowerCase()) ||
                    type.toLowerCase().includes(a.name.toLowerCase())
                );

                if (match) {
                    const existing = await db.fetchOne('SELECT id FROM progress WHERE activity_id = ? AND month = ?', [match.id, month]);
                    if (existing) {
                        await db.execute('UPDATE progress SET plan_value = ? WHERE id = ?', [total, existing.id]);
                    } else {
                        // ON CONFLICT replacement logic if using real Postgres might be different, 
                        // but here we did manual check. 
                        // The original used INSERT ... ON CONFLICT.
                        // Since we have manual check, we can just INSERT.
                        // OR use proper upsert if supported by both adapters (SQLite supports, Postgres supports).
                        // BUT syntax differences (ON CONFLICT vs ON DUPLICATE KEY etc).
                        // Manual check is safer for our hybrid adapter.
                        await db.execute('INSERT INTO progress (id, activity_id, month, plan_value, executed_value) VALUES (?, ?, ?, ?, ?)', [
                            crypto.randomUUID(), match.id, month, total, 0
                        ]);
                    }
                }
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error("Sync Program to Dashboard error:", e);
        return { success: false };
    }
}
