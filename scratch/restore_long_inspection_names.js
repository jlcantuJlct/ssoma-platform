const { createPool } = require('@vercel/postgres');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

const reverseMapping = {
    // Seguridad
    "Inspecciones y observaciones maquinaria Línea Amarilla": "Inspecciones y observaciones maquinaria Línea amarilla (Excavadoras, retro, cargador, tractor, moto niveladora, cisterna de agua) F-OP-015 V02 22.12.16 Maquinaria Pesada",
    "Inspecciones y observaciones vehículos": "Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.) F-OP-010 V02 22.12.16 Vehiculos",
    "Inspección de Equipos de Emergencia (Extintores)": "Inspección de Equipos de Emergencia (Extintores) F-SIG-058 Registro de inspección de equipos de seguridad o emergencia",
    "Inspección de Herramientas manuales y eléctricas": "Inspección de Herramientas manuales y eléctricas (F-OP-019) Verificación de Herramientas Manuales, Eléctricas y Equipos Portátiles",
    "Inspección de generador, tableros eléctricos": "Inspección de generador, tableros eléctrico F-SIG-075 Inspeccion de Instalaciones Eléctricas V01",
    "Inspección de EPP básico o específico": "Inspección de EPP básico o especifico (Cantidad refiere a la cantidad de personas) F-SIG-044 Inspección de EPP V03",
    "Inspección de Señalización Vial": "Inspección de Señalización Vial (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de vías de acceso y bermas de seguridad": "Inspección de vías de acceso y bermas de seguridad plataformas de descarga de material (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de Señalización de Obra": "Inspección de Señalización de Obra (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de almacenes": "Inspección de almacenes F-SIG-028 Inspeccion Almacén V09",
    "Inspección del almacén de productos químicos": "Inspección del almacén de productos químicos F-SIG-028 Inspeccion Almacén V09",
    "Inspección de orden y limpieza de áreas de trabajo": "Inspección de orden y limpieza de áreas de trabajo (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspeccion de laboratorio": "Inspeccion de laboratorio F-SIG-077 INSPECCIÓN DE LABORATORIO",
    "Inspeccion de planta de asfalto": "Inspeccion de planta de asfalto LISTA DE CHEQUEO DE PLANTA DE ASFALTO",
    "Inspeccion de planta de concreto": "Inspeccion de planta de concreto LISTA DE CHEQUEO DE PLANTA DE CONCRETO",
    "Inspeccion de planta de Chancado": "Inspeccion de planta de Chancado LISTA DE CHEQUEO DE PLANTA DE AGREGADOS",
    "Inspección de taller de soldadura/ mecánico": "Inspección de taller de soldadura/ mecanico F-SIG-079 Inspección de Talleres V02",
    "Inspección de escalera o andamios": "Inspección de escalera o andamios F-OP-001 CHECK LIST DE ANDAMIOS F-OP-018 INSPECCIÓN DE ESCALERAS",
    "Inspección de Equipo contra caídas (arnés, línea de vida, etc.)": "Inspección de Equipo contra caídas (arnés, línea de vida, etc.) F-OP-017 INSPECCIÓN DE EQUIPOS CONTRA CAIDA",

    // Salud
    "Inspecciones botiquines": "Inspecciones botiquines F-SIG-030 INSPECCIÓN DE BOTIQUÍN",
    "Inspecciones Estaciones de emergencia": "Inspecciones Estaciones de emergencia (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de puntos de hidratación": "Inspección de puntos de hidratacion (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección punto de protección solar": "Inspección punto de proteccion solar (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de lavaderos de SSHH y mano": "Inspección de lavaderos de SSHH y mano (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de Cocina y comedor": "Inspección de Cocina y comedor F-SIG-074 INSPECCIÓN DE COCINA Y COMEDOR",
    "Inspección de EPP - Seguimiento médico": "Inspección de EPP Inspección de EPP Seguimiento de observacion medica F-SIG-044 Inspección de EPP V03",
    "Inspección de Tópico": "Inspección de Topico (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de Alcotest": "Inspección de Alcotest (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",

    // Medio Ambiente
    "Inspecciones de estaciones de residuos por colores": "Inspecciones de estaciones de residuos por colores (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspecciones de almacén de acopio temporal de residuos sólidos": "Inspecciones de almacén de acopio temporal de residuos solidos (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspecciones de la segregación": "Inspecciones de la segregacion (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de controles de polución": "Inspección de controles de polucion. (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de controles de ruido": "Inspección de controles de ruido. (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de Kit antiderrames": "Inspección de Kit antiderrames F-SIG-076 INSPECCION DE KIT ANTIDERRAME",
    "Inspección de Señalización Medio ambiental": "Inspección de Señalización Medio ambiental (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente"
};

async function migrate() {
    console.log("--- RESTAURANDO NOMBRES LARGOS DE INSPECCIÓN ---");
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, inspection_type FROM inspection_records');
        const records = res.rows;
        console.log(`Encontrados ${records.length} registros.`);

        let updatedCount = 0;
        for (const record of records) {
            const newType = reverseMapping[record.inspection_type];

            if (newType) {
                await client.query('UPDATE inspection_records SET inspection_type = $1 WHERE id = $2', [newType, record.id]);
                updatedCount++;
                console.log(`[RESTORED] ID ${record.id}: -> ${newType}`);
            }
        }

        console.log(`--- RESTAURACIÓN COMPLETADA: ${updatedCount} registros actualizados ---`);
    } catch (err) {
        console.error("Error durante la restauración:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
