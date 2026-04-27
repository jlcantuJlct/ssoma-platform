import { createClient } from '@supabase/supabase-js';

// NOTA: Estas variables se configurarán en el .env.local cuando decidamos hacer la mudanza final.
// Por ahora, el sistema seguirá usando Neon por defecto.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

/**
 * Función preparada para migrar datos de una tabla de Neon a Supabase
 */
export async function migrateTable(tableName: string, data: any[]) {
    if (!supabase) throw new Error("Supabase no está configurado");
    
    console.log(`Migrando ${data.length} registros a la tabla ${tableName} en Supabase...`);
    
    const { error } = await supabase
        .from(tableName)
        .upsert(data, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
}
