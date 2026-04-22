const { createPool } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

const MAPPING = {
    // Seguridad
    "Inspecciones y observaciones maquinaria Línea amarilla": "Inspecciones y observaciones maquinaria Línea amarilla (Excavadoras, retro, cargador, tractor, moto niveladora, cisterna de agua) F-OP-015 V02 22.12.16 Maquinaria Pesada",
    "Inspecciones y observaciones vehículos": "Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.) F-OP-010 V02 22.12.16 Vehiculos",
    "Inspección de Equipos de Emergencia (Extintores)": "Inspección de Equipos de Emergencia (Extintores) F-SIG-058 Registro de inspección de equipos de seguridad o emergencia",
    "Inspección de EPP básico o especifico": "Inspección de EPP básico o especifico (Cantidad refiere a la cantidad de personas) F-SIG-044 Inspección de EPP V03",
    "Inspección de vías de acceso y bermas de seguridad": "Inspección de vías de acceso y bermas de seguridad plataformas de descarga de material (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de almacenes": "Inspección de almacenes F-SIG-028 Inspeccion Almacén V09",
    "Inspección del almacén de productos químicos MSDS": "Inspección del almacén de productos químicos F-SIG-028 Inspeccion Almacén V09",
    "Inspeccion de laboratorio": "Inspeccion de laboratorio F-SIG-077 INSPECCIÓN DE LABORATORIO",
    "Inspeccion de planta de asfalto": "Inspeccion de planta de asfalto LISTA DE CHEQUEO DE PLANTA DE ASFALTO",
    "Inspeccion de planta de concreto": "Inspeccion de planta de concreto LISTA DE CHEQUEO DE PLANTA DE CONCRETO",
    "Inspeccion de planta de Chancado": "Inspeccion de planta de Chancado LISTA DE CHEQUEO DE PLANTA DE AGREGADOS",
    "Inspección de taller de soldadura/mecanico": "Inspección de taller de soldadura/ mecanico F-SIG-079 Inspección de Talleres V02",
    
    // Salud
    "Inspecciones botiquines": "Inspecciones botiquines F-SIG-030 INSPECCIÓN DE BOTIQUÍN",
    "Inspecciones Estaciones de emergencia": "Inspecciones Estaciones de emergencia (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de puntos de hidratacion": "Inspección de puntos de hidratacion (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección punto de proteccion solar": "Inspección punto de proteccion solar (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de lavaderos de SSHH y mano": "Inspección de lavaderos de SSHH y mano (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de Cocina y comedor": "Inspección de Cocina y comedor F-SIG-074 INSPECCIÓN DE COCINA Y COMEDOR",
    "Inspección de EPP": "Inspección de EPP Inspección de EPP Seguimiento de observacion medica F-SIG-044 Inspección de EPP V03",
    "Inspección de Alcotest": "Inspección de Alcotest (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de Topico": "Inspección de Topico (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",

    // Medioambiente
    "Inspecciones de estaciones de residuos por colores": "Inspecciones de estaciones de residuos por colores (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspecciones de almacén de acopio temporal de residuos sólidos": "Inspecciones de almacen de acopio temporal de residuos solidos (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspecciones de almacén de acopio temporal de residuos peligrosos": "Inspecciones de almacen de acopio temporal de residuos solidos (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
    "Inspección de Kit antiderrames": "Inspección de Kit antiderrames F-SIG-076 INSPECCION DE KIT ANTIDERRAME"
};

async function migrate() {
    const pool = createPool({
        connectionString: process.env.POSTGRES_URL,
    });

    console.log("Iniciando migración de nombres en el historial...");
    
    try {
        let totalUpdated = 0;
        
        for (const [oldName, newName] of Object.entries(MAPPING)) {
            const result = await pool.query(
                "UPDATE inspection_records SET inspection_type = $1 WHERE inspection_type = $2",
                [newName, oldName]
            );
            
            if (result.rowCount > 0) {
                console.log(`✅ Actualizado '${oldName}' -> '${newName}' (${result.rowCount} registros)`);
                totalUpdated += result.rowCount;
            }
        }
        
        console.log(`\nMigración finalizada. Total de registros actualizados: ${totalUpdated}`);
        
    } catch (e) {
        console.error("❌ Error durante la migración:", e);
    } finally {
        await pool.end();
    }
}

migrate();
