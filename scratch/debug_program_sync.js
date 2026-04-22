
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const db = require('./lib/db').default;

async function checkMatches() {
    try {
        console.log("--- BUSCANDO REGISTROS DE INSPECCION ---");
        const records = await db.fetchAll('SELECT inspection_type, date FROM inspection_records ORDER BY date DESC LIMIT 30');
        
        if (records.length === 0) {
            console.log("❌ No se encontraron registros de inspección en la base de datos.");
            return;
        }

        // Simular lógica de emparejamiento del frontend
        const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const getWords = (s) => s.split(/\s+/).filter(w => w.length > 2);
        const isSubset = (subset, superset) => subset.every(subWord => superset.some(superWord => superWord.includes(subWord) || subWord.includes(superWord)));

        // Nombres del Excel (según screenshot)
        const excelNames = [
            "Inspecciones y observaciones maquinaria Línea Amarilla (Excavadoras, retro, cargador, tractor, moto niveladora, cisterna de agua) F-OP-015 V02 22.12.18 Maquinaria Pesada",
            "Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.) F-OP-010 V02 22.12.18 Vehículos",
            "Inspección de Equipos de Emergencia (Extintores) F-SIG-058 Registro de Inspección de equipos de seguridad o emergencia",
            "Inspección de Herramientas manuales y eléctricas (F-OP-018) Verificación de Herramientas Manuales, Eléctricas y Equipos Portátiles",
            "Inspección de generador, tableros eléctricos F-SIG-075 Inspeccion de instalaciones Eléctricas V01",
            "Inspección de EPP básico o específico (Cantidad refiere a la cantidad de personas) F-SIG-044 Inspección de EPP V03",
            "Inspección de almacenes F-SIG-028 Inspeccion Almacén V09",
            "Inspección del almacén de productos químicos F-SIG-028 Inspeccion Almacén V09",
            "Inspeccion de laboratorio F-SIG-077 INSPECCIÓN DE LABORATORIO",
            "Inspeccion de planta de asfalto LISTA DE CHEQUEO DE PLANTA DE ASFALTO",
            "Inspeccion de planta de concreto LISTA DE CHEQUEO DE PLANTA DE CONCRETO",
            "Inspeccion de planta de Chancado LISTA DE CHEQUEO DE PLANTA DE AGREGADOS",
            "Inspección de taller de soldadura/ mecánico F-SIG-079 Inspección de Talleres V02",
            "Inspección de escaleras o andamios F-OP-001 CHECK LIST DE ANDAMIOS F-OP-016 INSPECCIÓN DE ESCALERAS",
            "Inspección de Equipo contra caídas (arnés, línea de vida, etc.) F-OP-017 INSPECCIÓN DE EQUIPOS CONTRA CAÍDA",
            "Inspección de Señalización Vial (F-SIG-073) Inspección"
        ];

        console.log(`\nProbando coincidencia para ${records.length} registros...`);
        
        records.forEach(r => {
            const tNorm = normalize(r.inspection_type);
            const tWords = getWords(tNorm);
            const m = new Date(r.date).getMonth() + 1; // 1-indexed for display

            let matched = false;
            excelNames.forEach(excelName => {
                const dNorm = normalize(excelName);
                const dWords = getWords(dNorm);

                if (isSubset(tWords, dWords) || isSubset(dWords, tWords)) {
                    console.log(`✅ COINCIDENCIA: [${r.inspection_type}] -> [${excelName.substring(0, 40)}...] (Mes: ${m})`);
                    matched = true;
                }
            });

            if (!matched) {
                console.log(`❌ SIN COINCIDENCIA: [${r.inspection_type}] (Mes: ${m})`);
            }
        });

    } catch (e) {
        console.error("Error en debug script:", e);
    }
}

checkMatches();
