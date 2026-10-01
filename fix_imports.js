const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(/import ExcelJS from "exceljs";/g, 'import * as ExcelJS from "exceljs";');
c = c.replace(/import path from "path";/g, 'import * as path from "path";');
c = c.replace(/import fs from "fs";/g, 'import * as fs from "fs";');

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed imports in export-excel/route.ts');
