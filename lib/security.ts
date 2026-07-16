import db from '@/lib/db';

/**
 * Verifica si un usuario puede eliminar un registro específico.
 * Reglas:
 * 1. El usuario debe ser el mismo que creó el registro (verificado a través del campo 'responsable', 'responsible' o similar).
 * 2. No pueden haber pasado más de 24 horas desde la creación del registro (verificado a través de 'created_at').
 * 
 * @param tableName Nombre de la tabla
 * @param recordId ID del registro a eliminar
 * @param userName Nombre del usuario actual que intenta eliminar
 * @param userColumnName Nombre de la columna que guarda el responsable (por defecto 'responsable')
 * @returns { success: boolean, error?: string }
 */
export async function canDeleteRecord(tableName: string, recordId: string | number, userName: string, userColumnName: string = 'responsable'): Promise<{ success: boolean, error?: string }> {
    try {
        // Obtenemos el registro
        const record = await db.fetchOne(`SELECT * FROM ${tableName} WHERE id = ?`, [recordId]);

        if (!record) {
            // Si el registro no se encuentra por id, puede que esté usando 'record_id' (como en algunas tablas de evidencia)
            if (tableName === 'evidence_center_records') {
                const altRecord = await db.fetchOne(`SELECT * FROM ${tableName} WHERE record_id = ?`, [String(recordId)]);
                if (!altRecord) return { success: false, error: 'Registro no encontrado.' };
                return checkRules(altRecord, userName, userColumnName);
            }
            return { success: false, error: 'Registro no encontrado.' };
        }

        return checkRules(record, userName, userColumnName);
    } catch (e: any) {
        console.error(`Error verificando permisos de eliminación en ${tableName}:`, e);
        return { success: false, error: 'Error interno verificando permisos.' };
    }
}

function checkRules(record: any, userName: string, userColumnName: string): { success: boolean, error?: string } {
    // 0. Excepción absoluta para el desarrollador
    const normalizedUser = userName.toLowerCase().trim();
    if (normalizedUser === 'developer' || normalizedUser === 'administrador' || normalizedUser.includes('jose luis cancino')) {
        return { success: true }; // Bypasses all rules (ownership and 24h limit)
    }

    // 1. Verificar propiedad
    const recordUser = record[userColumnName] || record['responsible'] || record['user_name'];
    
    // Por seguridad, si userName es diferente, bloqueamos.
    if (recordUser && typeof recordUser === 'string') {
        if (recordUser.toLowerCase().trim() !== normalizedUser) {
            return { success: false, error: 'No tienes permisos para eliminar archivos de otros usuarios.' };
        }
    }

    // 2. Verificar tiempo (24 horas)
    if (record.created_at) {
        const createdAtTime = new Date(record.created_at).getTime();
        const now = Date.now();
        const hoursElapsed = (now - createdAtTime) / (1000 * 60 * 60);

        if (hoursElapsed > 24) {
            return { success: false, error: 'El tiempo límite de 24 horas para borrar este archivo ha expirado.' };
        }
    } else {
        // Archivos antiguos sin created_at
        return { success: false, error: 'Este archivo es antiguo y ya no puede ser eliminado por los usuarios.' };
    }

    return { success: true };
}
