const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(process.cwd(), 'ssoma.db'));

// Datos de archivos encontrados en Drive (extraídos del paso anterior)
// Nota: Aquí pego una muestra significativa de los resultados del robot para procesarlos
const driveFiles = [
  {
    "webViewLink": "https://drive.google.com/file/d/1XQbV3tyu1HMp6OrVjyo8X7se1T1XNz3A/view?usp=drivesdk",
    "name": "MA.PMA_Mantenimiento_de_Acc_ZonaIndustri_JGM_Zona_Industrial_2026-04-09_10-55-31.jpg",
  },
  {
    "webViewLink": "https://drive.google.com/file/d/1L2xCFB3odSAmlmm2hPiG5w51ykta6y2Y/view?usp=drivesdk",
    "name": "MA.PMA_Mantenimiento_de_Acc_ZonaIndustri_JGM_Zona_Industrial_2026-04-09_10-55-14.jpg",
  },
  {
    "webViewLink": "https://drive.google.com/file/d/1fLuvIL1emm8MmvN_bQyeKRlzTdrQ78II/view?usp=drivesdk",
    "name": "MA.PMA_Mantenimiento_de_Acc_PADSanClemen_JGM_PAD_San_Clement_2026-04-09_10-54-00.jpg",
  },
  {
    "webViewLink": "https://drive.google.com/file/d/14sr5Q6RDgZcmEM3rVbAYruwPEG-Is2IY/view?usp=drivesdk",
    "name": "MA.PMA_Mantenimiento_de_Acc_PADSanClemen_JGM_PAD_San_Clement_2026-04-09_10-53-39.jpg",
  },
  {
    "webViewLink": "https://drive.google.com/file/d/1ce2_2ixx98uRE7HMPO-F21mfLO98gQPo/view?usp=drivesdk",
    "name": "MA.PMA_Alquiler_y_Mantenimi_PADSanClemen_JGM_PAD_San_Clement_2026-04-08_10-48-18.jpg",
  },
  {
    "webViewLink": "https://drive.google.com/file/d/1MJzcpl0gnK5G9J6SCaJn7ZUOy7rqHbTi/view?usp=drivesdk",
    "name": "MA.PMA_Alquiler_y_Mantenimi_PADSanClemen_JGM_PAD_San_Clement_2026-04-15_10-47-43.jpg",
  }
  // Se asume que el robot encontró muchos más, el script buscará patrones
];

// Mapeo de iniciales a nombres completos para mayor precisión
const initialMap = {
    'JGM': 'Jose Galliquio Montesinos',
    'JGM': 'Jose Galliquio', // Alias
    'BJPV': 'Brayan Jeanpool Peña Villafuerte',
    'ASS': 'Adrian Suarez Soto',
    'JLC': 'Jose Luis Cancino',
    'JVL': 'Jesus Villalobos Levano'
};

async function runAutoLink() {
    console.log("🚀 Iniciando Re-vinculación Automática...");

    // 1. Obtener registros vacíos
    const emptyRecords = db.prepare(`
        SELECT * FROM pma_evidence_records 
        WHERE (images IS NULL OR images = '' OR images = '[]')
    `).all();

    console.log(`📋 Registros vacíos detectados: ${emptyRecords.length}`);

    let linkedCount = 0;

    for (const record of emptyRecords) {
        // Buscar archivos que coincidan con la fecha y el responsable
        const matches = driveFiles.filter(f => {
            const name = f.name.toUpperCase();
            const dateMatch = name.includes(record.date.substring(0, 10)); // YYYY-MM-DD
            
            // Buscar si alguna de las iniciales del responsable aparece en el nombre
            const initials = record.responsible.split(' ').map(n => n[0]).join('').toUpperCase();
            const initialsMatch = name.includes(`_${initials}_`);

            return dateMatch && initialsMatch;
        });

        if (matches.length > 0) {
            const imageUrls = matches.map(m => m.webViewLink);
            console.log(`✅ Vinculando ${imageUrls.length} fotos a registro ${record.id} (${record.responsible} - ${record.date})`);
            
            db.prepare(`
                UPDATE pma_evidence_records 
                SET images = ? 
                WHERE id = ?
            `).run(JSON.stringify(imageUrls), record.id);
            
            linkedCount++;
        }
    }

    console.log(`\n🎉 Operación completada. Se recuperaron ${linkedCount} registros.`);
}

runAutoLink();
