const { createPool } = require('@vercel/postgres');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

const mapping = {
    // Seguridad
    "maquinaria": "Inspecciones y observaciones maquinaria Línea Amarilla",
    "vehiculos": "Inspecciones y observaciones vehículos",
    "extintores": "Inspección de Equipos de Emergencia (Extintores)",
    "emergencia": "Inspección de Equipos de Emergencia (Extintores)",
    "herramientas": "Inspección de Herramientas manuales y eléctricas",
    "tableros": "Inspección de generador, tableros eléctricos",
    "electrico": "Inspección de generador, tableros eléctricos",
    "epp": "Inspección de EPP básico o específico",
    "vial": "Inspección de Señalización Vial",
    "acceso": "Inspección de vías de acceso y bermas de seguridad",
    "obra": "Inspección de Señalización de Obra",
    "almacen": "Inspección de almacenes",
    "quimico": "Inspección del almacén de productos químicos",
    "orden": "Inspección de orden y limpieza de áreas de trabajo",
    "laboratorio": "Inspeccion de laboratorio",
    "asfalto": "Inspeccion de planta de asfalto",
    "concreto": "Inspeccion de planta de concreto",
    "chancado": "Inspeccion de planta de Chancado",
    "soldadura": "Inspección de taller de soldadura/ mecánico",
    "andamio": "Inspección de escalera o andamios",
    "escalera": "Inspección de escalera o andamios",
    "caida": "Inspección de Equipo contra caídas (arnés, línea de vida, etc.)",
    "arnes": "Inspección de Equipo contra caídas (arnés, línea de vida, etc.)",

    // Salud
    "botiquin": "Inspecciones botiquines",
    "hidratacion": "Inspección de puntos de hidratación",
    "solar": "Inspección punto de protección solar",
    "sshh": "Inspección de lavaderos de SSHH y mano",
    "cocina": "Inspección de Cocina y comedor",
    "medica": "Inspección de EPP - Seguimiento médico",
    "topico": "Inspección de Tópico",
    "alcotest": "Inspección de Alcotest",

    // Medio Ambiente
    "colores": "Inspecciones de estaciones de residuos por colores",
    "temporal": "Inspecciones de almacén de acopio temporal de residuos sólidos",
    "segregacion": "Inspecciones de la segregación",
    "polucion": "Inspección de controles de polución",
    "ruido": "Inspección de controles de ruido",
    "kit": "Inspección de Kit antiderrames",
    "antiderrames": "Inspección de Kit antiderrames",
    "ambiental": "Inspección de Señalización Medio ambiental"
};

async function migrate() {
    console.log("--- INICIANDO MIGRACIÓN DE NOMBRES DE INSPECCIÓN ---");
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, inspection_type FROM inspection_records');
        const records = res.rows;
        console.log(`Encontrados ${records.length} registros.`);

        let updatedCount = 0;
        for (const record of records) {
            const oldType = record.inspection_type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let newType = null;

            // Encontrar la mejor coincidencia por palabra clave
            for (const [key, target] of Object.entries(mapping)) {
                if (oldType.includes(key)) {
                    newType = target;
                    break;
                }
            }

            if (newType && newType !== record.inspection_type) {
                await client.query('UPDATE inspection_records SET inspection_type = $1 WHERE id = $2', [newType, record.id]);
                updatedCount++;
                console.log(`[UPDATED] ID ${record.id}: ${record.inspection_type} -> ${newType}`);
            }
        }

        console.log(`--- MIGRACIÓN COMPLETADA: ${updatedCount} registros actualizados ---`);
    } catch (err) {
        console.error("Error durante la migración:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
