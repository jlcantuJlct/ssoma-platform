
import fs from 'fs';
import db from '../lib/db';
import crypto from 'crypto';

const CSV_PATH = process.argv[2];

if (!CSV_PATH) {
    console.error('Please provide the CSV file path as an argument');
    process.exit(1);
}

const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = fileContent.split(/\r?\n/);

let currentObjectiveId: string | null = null;
let currentYear = 2025; // Default from filename/header

// Helper to clean CSV fields
const clean = (str: string) => str ? str.replace(/^"|"$/g, '').trim() : '';

console.log(`Starting import from ${CSV_PATH}...`);

// Clear existing data (optional, or make it idempotent)
db.exec('DELETE FROM evidence');
db.exec('DELETE FROM progress');
db.exec('DELETE FROM activities');
db.exec('DELETE FROM objectives');

db.transaction(() => {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(';'); // Assuming semicolon delimiter from view_file output

        if (!line.trim()) continue;

        // Detect Objective (General or Specific)
        // Format: "Objetivo General 1 :;;Text..."
        if (cols[0]?.toLowerCase().includes('objetivo general') || cols[0]?.includes('III.') || cols[0]?.includes('II.') || cols[0]?.includes('IV.') || cols[0]?.toLowerCase().includes('actividades medio ambiente')) {
            // Some sections like "III. Inspecciones" might strictly be objectives but don't have "Objetivo General" text in the same line sometimes? 
            // Look at line 9: "Objetivo General 1 :;;Asegurar..."
            // Look at line 126: "III. Inspecciones". Line 121 has "Objetivo General 3".
            // So sticking to "Objetivo General" lines to create the MAIN grouping.
            // But checking if we missed any.

            // Actually, let's look for "Objetivo General" explicitly to define the ID.
            if (cols[0]?.toLowerCase().startsWith('objetivo general')) {
                const name = clean(cols[0]);
                const desc = clean(cols[2]);
                currentObjectiveId = crypto.randomUUID();

                db.prepare('INSERT INTO objectives (id, name, description, year, category) VALUES (?, ?, ?, ?, ?)').run(
                    currentObjectiveId,
                    name,
                    desc,
                    currentYear,
                    'General'
                );
                console.log(`Created Objective: ${name}`);
            }
        }

        // Fail-safe: if we encounter a table header but have no objective (maybe missed it), create a dummy or try to infer?
        // In the CSV, "Objetivo General 3" is line 121. Table starts 127.
        // There are sections like "II. Formación" (line 42) which fall under Objective 2 (line 37).

        // Detect Activity Rows
        // Strategy: Look for the "Planeado" type in column 6 (index 6, 0-based) AND a number in column 0 (ITEM).
        // Line 17: "1.00"; "Conformación..."; ...; "Planeado"
        // Wait, split(';') might be tricky if quoted strings contain semicolons. But usually these files use simple ;.

        // Let's refine split. The view_file output showed standard ; separation.

        const itemCol = clean(cols[0]);
        const typeCol = clean(cols[6]); // Column G

        if (itemCol && typeCol === 'Planeado' && currentObjectiveId) {
            // New Activity found
            const name = clean(cols[1]);
            const responsible = clean(cols[3]); // Column D? Check line 17. 
            // Line 17: 0=1.00, 1=Activity, 2=Empty, 3=Resp (ESP.SSOMA), 4=Target (Miembros...), 5=Exec Cond, 6=Planeado.
            // Wait, looking at line 15 header:
            // ITEM; Actividades...; ; RESPONSABLES; PUBLICO...; EJECUCION; ; PERIODO...
            // 0: ITEM
            // 1: Actividades
            // 2: (Empty)
            // 3: RESPONSABLES
            // 4: PUBLICO OBJECTIVO
            // 5: EJECUCION (Condition?)
            // 6: (Empty in header, but "Planeado" in data?)
            // Line 16: ...;Período;Plan;ENE...
            // 0-4 empty. 5=Período. 6=Plan.
            // Data Line 17:
            // 0: 1.00
            // 1: Conformación...
            // 2: empty
            // 3: ESP.SSOMA
            // 4: Miembros...
            // 5: Cuando...
            // 6: Planeado

            const activityId = crypto.randomUUID();
            db.prepare('INSERT INTO activities (id, objective_id, item_number, name, responsible, public_target, frequency) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                activityId,
                currentObjectiveId,
                itemCol,
                name,
                clean(cols[3]),
                clean(cols[4]),
                clean(cols[5]) // frequency/exec condition
            );

            // Insert Progress for Planeado
            // Months are cols 7 (ENE) to 18 (DIC).
            for (let m = 1; m <= 12; m++) {
                const val = parseFloat(clean(cols[6 + m])); // 7 is ENE (m=1), 6+1=7.
                if (!isNaN(val)) {
                    db.prepare('INSERT INTO progress (id, activity_id, month, plan_value, executed_value) VALUES (?, ?, ?, ?, ?)').run(
                        crypto.randomUUID(),
                        activityId,
                        m,
                        val,
                        0 // default
                    );
                } else {
                    // Insert 0 or null? Let's insert 0.
                    db.prepare('INSERT INTO progress (id, activity_id, month, plan_value, executed_value) VALUES (?, ?, ?, ?, ?)').run(
                        crypto.randomUUID(),
                        activityId,
                        m,
                        0,
                        0
                    );
                }
            }

            // Look for next line for "Ejecutado"
            const nextLine = lines[i + 1];
            if (nextLine) {
                const nextCols = nextLine.split(';');
                if (clean(nextCols[6]) === 'Ejecutado') {
                    // Update executed values
                    for (let m = 1; m <= 12; m++) {
                        const val = parseFloat(clean(nextCols[6 + m]));
                        if (!isNaN(val)) {
                            db.prepare('UPDATE progress SET executed_value = ? WHERE activity_id = ? AND month = ?').run(
                                val,
                                activityId,
                                m
                            );
                        }
                    }
                    i++; // Skip next line
                }
            }
        }
    }
})();

console.log('Import completed.');
