const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

const MAPPING = {
    "SIGNAGE_PERIMETERS": "DELIMITATION_AREAS",
    "WASTE_RRSS_STATION": "WASTE_CONTAINERS",
    "SIGNAGE_MA": "SIGNAGE_MA",
    "ACCESS_MAINTENANCE": "DUST_WATERING",
    "DUST_IRRIGATION": "DUST_WATERING",
    "WASTE_SPILL_KIT": "SPILL_KIT",
    "WELLBEING_DINING": "W_DINING_CLEAN",
    "OPS_PPE_ARNES": "SST_PPE_USE",
    "WELLBEING_HYDRATION": "W_HYDRATION",
    "WELLBEING_CLEANING": "W_BATHROOMS",
    "WELLBEING_HANDWASH": "W_HANDWASH",
    "OPS_LOCKOUT": "SST_AST_REVIEW",
    "COMM_INFO_PANEL": "SOCIAL_SUGGESTION_BOX",
    "SIGNAGE_SST": "SST_SIGNAGE",
    "WASTE_SEGREGATION": "WASTE_CONTAINERS",
    "OPS_PPE_TAPONES": "SST_PPE_USE",
    "SST_EMERGENCY_STATION": "SST_EMERGENCY_STATION",
    "SST_EMERGENCY_VEHICLE": "SST_EMERGENCY_VEHICLE",
    "OPS_PPE_DELIVERY": "SST_PPE_DELIVERY",
    "WELLBEING_BATHROOMS": "W_BATHROOMS",
    "PORTABLE_TOILETS": "W_BATHROOMS"
};

async function fixCategories() {
    console.log("🛠️ Iniciando reescritura de categorías antiguas en la BD...");
    const client = await pool.connect();
    try {
        for (const [oldCat, newCat] of Object.entries(MAPPING)) {
            if (oldCat !== newCat) {
                const res = await client.query(
                    "UPDATE pma_evidence_records SET category = $1 WHERE category = $2",
                    [newCat, oldCat]
                );
                if (res.rowCount > 0) {
                    console.log(`✅ ${oldCat} -> ${newCat} (${res.rowCount} registros actualizados)`);
                }
            }
        }
        console.log("🎉 Reescritura completada.");
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixCategories();
