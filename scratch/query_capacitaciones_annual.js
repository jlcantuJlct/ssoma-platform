const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ssoma.db');

db.serialize(() => {
  db.all("SELECT objective_id, data_json FROM annual_program;", (err, rows) => {
    if (err) console.error(err);
    else {
      let capacitaciones = [];
      rows.forEach(row => {
        try {
          const data = JSON.parse(row.data_json);
          if (Array.isArray(data)) {
            data.forEach(item => {
              // Filtrar por todo el año para entender si hay capacitaciones y ver en qué meses caen, o filtrar por obj2
              if (
                row.objective_id === 'obj2' || 
                row.objective_id === 'obj3' || 
                (item.description && item.description.toLowerCase().includes('capacitac'))
              ) {
                if(item.date && (item.date.includes('-08-') || item.date.startsWith('2026-08'))) {
                   capacitaciones.push({ ...item, objective_id: row.objective_id });
                }
              }
            });
          }
        } catch (e) {}
      });
      console.log("Capacitaciones en el Plan Anual para Agosto:\n", JSON.stringify(capacitaciones, null, 2));
    }
  });
});
db.close();
