const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const target = 'const CATEGORIAS = ["Actos Subestándares", "Condiciones Subestándares"];';
const replacement = `const CATEGORIAS = [
    "TRANSPORTE DE PERSONAL",
    "TRABAJO EN CAMPO CON TORMENTAS ELECTRICAS",
    "OPERACIÓN DE VEHICULOS Y EQUIPOS",
    "TRABAJOS CON RIESGO DE CAIDAS DE ROCAS / EXCAVACIONES Y ZANJAS",
    "MANIPULACIÓN DE EXPLOSIVOS",
    "IZAJE",
    "TRABAJO EN ALTURA",
    "TRABAJOS EN ESPACIOS CONFINADOS",
    "MANIPULACION Y USO DE NEUMATICOS",
    "USO DE PRODUCTOS QUIMICOS",
    "TRABAJOS CON RIESGO A ENERGIAS PELIGROSAS",
    "TRABAJOS CERCA A FUENTE DE AGUA",
    "TRABAJOS EN CALIENTE",
    "TRABAJOS CON HERRAMIENTAS DE PODER",
    "EPP",
    "POSICIÓN DEL TRABAJADOR",
    "ERGONOMIA",
    "HERRAMIENTAS Y EQUIPOS",
    "DOCUMENTOS (PETS/ATS/PETAR/CHECK LIST)",
    "ORDEN Y LIMPIEZA",
    "MEDIO AMBIENTE",
    "OTROS"
];`;

code = code.replace(target, replacement);

fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Categories updated!');
