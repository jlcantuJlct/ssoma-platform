// ═══════════════════════════════════════════════════════
// SCRIPT DE RESTAURACIÓN - Residuos Aprovechables 2026
// Pegar en Console del navegador (F12) estando en la plataforma
// ═══════════════════════════════════════════════════════

const registros = [
  // RESIDUOS METALICOS (Total: 45 kg)
  { date: '2026-02-01', wasteType: 'RESIDUOS METALICOS', weight: 20, location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-04-01', wasteType: 'RESIDUOS METALICOS', weight: 10, location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-05-01', wasteType: 'RESIDUOS METALICOS', weight: 15, location: 'GENERAL', category: 'No Peligroso', files: [] },

  // PAPELES Y CARTONES (Total: 47 kg)
  { date: '2026-01-01', wasteType: 'PAPELES Y CARTONES', weight: 1,  location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-02-01', wasteType: 'PAPELES Y CARTONES', weight: 4,  location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-03-01', wasteType: 'PAPELES Y CARTONES', weight: 10, location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-04-01', wasteType: 'PAPELES Y CARTONES', weight: 20, location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-05-01', wasteType: 'PAPELES Y CARTONES', weight: 12, location: 'GENERAL', category: 'No Peligroso', files: [] },

  // PLASTICOS (Total: 14 kg)
  { date: '2026-01-01', wasteType: 'PLASTICOS', weight: 1,  location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-02-01', wasteType: 'PLASTICOS', weight: 1,  location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-03-01', wasteType: 'PLASTICOS', weight: 10, location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-04-01', wasteType: 'PLASTICOS', weight: 1,  location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-05-01', wasteType: 'PLASTICOS', weight: 1,  location: 'GENERAL', category: 'No Peligroso', files: [] },

  // RESIDUOS NO APROVECHABLE (Total: 429 kg)
  { date: '2026-01-01', wasteType: 'RESIDUOS NO APROVECHABLE', weight: 5,   location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-02-01', wasteType: 'RESIDUOS NO APROVECHABLE', weight: 4,   location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-03-01', wasteType: 'RESIDUOS NO APROVECHABLE', weight: 30,  location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-04-01', wasteType: 'RESIDUOS NO APROVECHABLE', weight: 200, location: 'GENERAL', category: 'No Peligroso', files: [] },
  { date: '2026-05-01', wasteType: 'RESIDUOS NO APROVECHABLE', weight: 190, location: 'GENERAL', category: 'No Peligroso', files: [] },

  // VIDRIO, COMIDA, MADERA = 0 en todos los meses → no se insertan
];

(async () => {
  let ok = 0, fail = 0;
  for (const rec of registros) {
    try {
      const res = await fetch('/api/pesaje-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', record: rec })
      });
      const data = await res.json();
      if (data.success) {
        ok++;
        console.log(`✅ ${rec.wasteType} ${rec.date} → ${rec.weight} kg guardado (id: ${data.id})`);
      } else {
        fail++;
        console.error(`❌ ${rec.wasteType} ${rec.date} → ERROR:`, data.error);
      }
    } catch(e) {
      fail++;
      console.error(`❌ ${rec.wasteType} ${rec.date} → EXCEPCIÓN:`, e.message);
    }
  }
  console.log(`\n══════════════════════════════`);
  console.log(`RESTAURACIÓN COMPLETA: ${ok} OK, ${fail} errores`);
  console.log(`Recarga la página para ver los datos.`);
})();
