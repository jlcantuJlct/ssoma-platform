const fs = require('fs');
let c = fs.readFileSync('components/inspections/CocinaComedorCustomForm.tsx', 'utf8');

c = c.replace(/InstalacionesElectricasCustomForm/g, 'CocinaComedorCustomForm');
c = c.replace(/Inspección de Instalaciones Eléctricas/g, 'Inspección de Cocina y Comedor');

// Replace standard template with Cocina y Comedor items
const items = `
  { text: "1. check de verificación de Orden", type: "title", isTitle: true, category: "Aspectos Generales" },
  { text: "1. check de verificación de Orden y limpieza", type: "radio", category: "Aspectos Generales" },
  { text: "2. check de verificación de aseo de personal", type: "radio", category: "Aspectos Generales" },
  { text: "3. Personal uniformado (incluir uso de mandil y gorra)", type: "radio", category: "Aspectos Generales" },
  { text: "4. Iluminación adecuada", type: "radio", category: "Aspectos Generales" },
  { text: "5. Interruptores y tomacorrientes en buen estado", type: "radio", category: "Aspectos Generales" },
  { text: "6. Uso correcto de extensiones", type: "radio", category: "Aspectos Generales" },
  { text: "7. Ventilación adecuada", type: "radio", category: "Aspectos Generales" },
  { text: "8. Mesas y bancas facilmente lavables, en buen estado", type: "radio", category: "Aspectos Generales" },
  { text: "9. Piso de cemento (solado) u otro material lavable, canaletas", type: "radio", category: "Aspectos Generales" },
  { text: "10. Conexiones de gas a cocinas en buen estado (con abrazaderas)", type: "radio", category: "Aspectos Generales" },
  { text: "11. Extintor Tipo K operativo y en buen estado", type: "radio", category: "Aspectos Generales" },
  { text: "12. Uso de protector buconasal al momento de servir la comida", type: "radio", category: "Aspectos Generales" },
  { text: "13. Limpieza de las instalaciones antes, durante y después", type: "radio", category: "Aspectos Generales" },
  { text: "14. Sellos de las puertas del refrigerador en buen estado y limpios", type: "radio", category: "Aspectos Generales" },
  { text: "15. Almacenamiento adecuado de cuchillos (fundas, imantado, tacos)", type: "radio", category: "Aspectos Generales" },
  { text: "16. El personal realiza ATS para su actividad", type: "radio", category: "Aspectos Generales" },
  { text: "17. Ausencia de insectos (moscas, zancudos, etc.) y roedores", type: "radio", category: "Aspectos Generales" },
  { text: "18. Temperatura adecuada del ambiente", type: "radio", category: "Aspectos Generales" },
  { text: "19. Productos peligrosos con hojas de datos de seguridad (HDS)", type: "radio", category: "Aspectos Generales" },
  { text: "Bodega de Alimentos", type: "title", isTitle: true, category: "Bodega de Alimentos" },
  { text: "1. Orden de los alimentos y condimentos", type: "radio", category: "Bodega de Alimentos" },
  { text: "2. Clasificación de los productos", type: "radio", category: "Bodega de Alimentos" },
  { text: "3. Iluminación adecuada", type: "radio", category: "Bodega de Alimentos" },
  { text: "4. Interruptores y tomacorrientes en buen estado", type: "radio", category: "Bodega de Alimentos" },
  { text: "5. Uso correcto de extensiones", type: "radio", category: "Bodega de Alimentos" },
  { text: "6. Ventilación adecuada", type: "radio", category: "Bodega de Alimentos" },
  { text: "7. Limpieza del ambiente", type: "radio", category: "Bodega de Alimentos" },
  { text: "8. Fechas de caducidad de alimentos secos y enlatados", type: "radio", category: "Bodega de Alimentos" },
  { text: "9. Fumigación vigente (no mayor de 3 meses)", type: "radio", category: "Bodega de Alimentos" },
  { text: "Congeladoras", type: "title", isTitle: true, category: "Congeladoras" },
  { text: "1. Limpieza de congeladoras", type: "radio", category: "Congeladoras" },
  { text: "2. Control de temperaturas", type: "radio", category: "Congeladoras" },
  { text: "3. Clasificación de alimentos", type: "radio", category: "Congeladoras" },
  { text: "4. Sellos de las puertas en buen estado", type: "radio", category: "Congeladoras" },
  { text: "Higiene Personal", type: "title", isTitle: true, category: "Higiene Personal" },
  { text: "1. Personal posee carnet de sanidad vigente", type: "radio", category: "Higiene Personal" },
  { text: "2. Conocimiento de seguridad con alimentos e higiene", type: "radio", category: "Higiene Personal" },
  { text: "3. Personal no usa esmaltes, joyas ni otros objetos", type: "radio", category: "Higiene Personal" }
`;

c = c.replace(/const template = \[\s*[\s\S]*?\s*\];/m, `const template = [\n${items}\n];`);

fs.writeFileSync('components/inspections/CocinaComedorCustomForm.tsx', c);
console.log('Modified CocinaComedorCustomForm');
