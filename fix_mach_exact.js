const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const targetLoop = `            const tipo = (meta.tipoEquipo || "").toUpperCase();
            const isAllowedCell = (r, c) => {
                if (c >= 1 && c <= 7 && r < 50) return true;
                if (tipo.includes("TRACTOR") || tipo.includes("MOTONIVELADORA") || tipo.includes("RODILLO") || tipo.includes("PAVIMENTADORA")) {
                    if (c >= 10 && c <= 16) return true;
                }
                if (tipo.includes("EXCAVADORA") || tipo.includes("RETRO") || tipo.includes("FRESADORA")) {
                    if (c >= 19 && c <= 25) return true;
                }
                if (tipo.includes("CARGADOR") || tipo.includes("MINICARGADOR")) {
                    if (c >= 1 && c <= 7 && r >= 50) return true;
                }
                return false;
            };`;

const newLoop = `            const tipo = (meta.tipoEquipo || "").toUpperCase();
            const isAllowedCell = (r, c) => {
                // General table
                if (c >= 1 && c <= 7 && r < 54) return true;
                
                // Specific machines
                if (tipo.includes("TRACTOR")) return c >= 10 && c <= 16 && r >= 13 && r < 32;
                if (tipo.includes("RETROEXCAVADORA")) return c >= 19 && c <= 25 && r >= 29 && r < 47;
                if (tipo.includes("EXCAVADORA")) return c >= 19 && c <= 25 && r >= 13 && r < 29;
                if (tipo.includes("RODILLO")) return c >= 10 && c <= 16 && r >= 32 && r < 37;
                if (tipo.includes("MOTONIVELADORA")) return c >= 10 && c <= 16 && r >= 37 && r < 54;
                if (tipo.includes("FRESADORA")) return (c >= 19 && c <= 25 && r >= 47) || (c >= 10 && c <= 16 && r >= 54);
                if (tipo.includes("MINICARGADOR")) return c >= 1 && c <= 7 && r >= 54 && r < 60;
                if (tipo.includes("CARGADOR")) return c >= 1 && c <= 7 && r >= 60;
                
                return false;
            };`;

c = c.replace(targetLoop, newLoop);
fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed export loop exact bounds');
