const fs = require('fs');
let code = fs.readFileSync('recovered_internas.tsx', 'utf8');
code = code.replace(/\\n/g, '\n').replace(/\\"/g, '"');
if (!code.includes('import React')) {
    code = '"use client";\n\nimport React, { useState, useRef, useEffect } from "react";\nimport { Camera, Trash2, PlusCircle, Check, Loader2, ChevronDown, ChevronUp, User, MapPin, Clock, Calendar, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";\n' + code;
}
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Restored fully!');
