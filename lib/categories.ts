// SSOMA Categories and Types - Centralized Configuration
// Use this file as the single source of truth for categories across the platform.
import { USER_LIST, ALL_USER_LIST } from "@/lib/auth";

export const RESPONSIBLES = USER_LIST.map(user => user.name);
export const ALL_RESPONSIBLES = ALL_USER_LIST.map(user => user.name);

export type PMACategory = {
    id: string;
    label: string;
    hint: string;
    group: string;
};

export type DetourCategory = {
    id: string;
    label: string;
    hint: string;
};

// --- PMA CATEGORIES ---
export const PMA_CATEGORIES: PMACategory[] = [
    {
        id: "SIGNAGE_SST",
        group: "Foto señalización",
        label: "1. Foto de señalización SST",
        hint: "Evidenciar señalización de Seguridad y Salud en el Trabajo."
    },
    {
        id: "SIGNAGE_MA",
        group: "Foto señalización",
        label: "2. Foto de señalización MA",
        hint: "Evidenciar señalización de Medio Ambiente."
    },
    {
        id: "SIGNAGE_PERIMETERS",
        group: "Foto señalización",
        label: "3. Foto de Delimitación de áreas y Perímetros",
        hint: "Evidenciar mallas, cintas o barreras de delimitación."
    },
    { 
        id: "WELLBEING_BATHROOMS", 
        group: "Bienestar e Higiene", 
        label: "1. Foto de baños", 
        hint: "Evidenciar estado de los baños." 
    },
    { 
        id: "WELLBEING_CLEANING", 
        group: "Bienestar e Higiene", 
        label: "2. Foto de limpieza de baños", 
        hint: "Evidenciar la limpieza programada." 
    },
    { 
        id: "WELLBEING_HANDWASH", 
        group: "Bienestar e Higiene", 
        label: "3. Foto de Lavado de Manos", 
        hint: "Evidenciar estación de lavado de manos." 
    },
    { 
        id: "WELLBEING_HYDRATION", 
        group: "Bienestar e Higiene", 
        label: "4. Foto Punto de Hidratación", 
        hint: "Evidenciar puntos de agua/hidratación." 
    },
    { 
        id: "WELLBEING_DINING", 
        group: "Bienestar e Higiene", 
        label: "5. Foto de comedor", 
        hint: "Evidenciar área de comedor." 
    },
    { 
        id: "WELLBEING_DINING_CLEAN", 
        group: "Bienestar e Higiene", 
        label: "6. Foto de Limpieza de Comedor", 
        hint: "Evidenciar limpieza del comedor." 
    },
    { 
        id: "WELLBEING_LOCKER", 
        group: "Bienestar e Higiene", 
        label: "7. Foto de vestuario", 
        hint: "Evidenciar área de vestuarios." 
    },
    { 
        id: "WASTE_SEGREGATION", 
        group: "Manejo de residuos", 
        label: "1. Foto de segregación de residuos", 
        hint: "Evidenciar correcta segregación." 
    },
    { 
        id: "WASTE_VEHICLE", 
        group: "Manejo de residuos", 
        label: "2. Foto del vehículo de residuos", 
        hint: "Vehículo recolector." 
    },
    { 
        id: "WASTE_STORAGE", 
        group: "Manejo de residuos", 
        label: "3. Foto de almacenamiento de residuos", 
        hint: "Área de acopio temporal." 
    },
    { 
        id: "WASTE_WEIGHING", 
        group: "Manejo de residuos", 
        label: "4. Foto de pesado de residuos", 
        hint: "Control de peso." 
    },
    { 
        id: "WASTE_RRSS_STATION", 
        group: "Manejo de residuos", 
        label: "5. Foto de estación de RRSS", 
        hint: "Estación de residuos." 
    },
    { 
        id: "WASTE_SPILL_KIT", 
        group: "Manejo de residuos", 
        label: "6. Foto de kit contra derrames", 
        hint: "Evidenciar disponibilidad y estado del kit contra derrames." 
    },
    { 
        id: "DUST_CISTERN_HEAD", 
        group: "Foto de control de Polvo", 
        label: "1. Foto de: Las mangueras de las cisternas cuentan con cabezal.", 
        hint: "Cabezal en mangueras." 
    },
    { 
        id: "DUST_SPILL_KIT", 
        group: "Foto de control de Polvo", 
        label: "2. Foto de: Las cisternas cuentan con kit antiderrame", 
        hint: "Kit antiderrame." 
    },
    { 
        id: "DUST_WATER_COURSE", 
        group: "Foto de control de Polvo", 
        label: "3. Foto de: Los vehículos no ingresan al curso de agua", 
        hint: "Respeto al curso de agua." 
    },
    { 
        id: "DUST_WATERING", 
        group: "Foto de control de Polvo", 
        label: "4. Foto de riego", 
        hint: "Evidenciar el riego de vías para control de polvo." 
    },
    { 
        id: "OPS_LOCKOUT", 
        group: "Seguridad y Control Operativo", 
        label: "1. Foto de bloqueado", 
        hint: "Bloqueo y etiquetado (LOTO)." 
    },
    { 
        id: "OPS_PPE_TAPONES", 
        group: "Seguridad y Control Operativo", 
        label: "2. Foto de Uso de EPP: Tapones", 
        hint: "Uso correcto de tapones auditivos." 
    },
    { 
        id: "OPS_PPE_GUANTES", 
        group: "Seguridad y Control Operativo", 
        label: "3. Foto de Uso de EPP: Guantes", 
        hint: "Uso correcto de guantes de seguridad." 
    },
    { 
        id: "OPS_PPE_LENTES", 
        group: "Seguridad y Control Operativo", 
        label: "4. Foto de Uso de EPP: Lentes", 
        hint: "Uso correcto de lentes de seguridad." 
    },
    { 
        id: "OPS_PPE_ARNES", 
        group: "Seguridad y Control Operativo", 
        label: "5. Foto de Uso de EPP: Arnés", 
        hint: "Uso correcto de arnés de seguridad." 
    },
    { 
        id: "OPS_PPE_RESPIRADOR", 
        group: "Seguridad y Control Operativo", 
        label: "6. Foto de Uso de EPP: Respirador", 
        hint: "Uso correcto de respirador/mascarilla." 
    },
    { 
        id: "OPS_PPE_DELIVERY", 
        group: "Seguridad y Control Operativo", 
        label: "7. Foto de Entrega de EPP", 
        hint: "Registro/entrega de EPP." 
    },
    { 
        id: "OPS_DOC_REVIEW", 
        group: "Seguridad y Control Operativo", 
        label: "8. Foto de revisión Documentos", 
        hint: "Revisión de ATS/PETAR/etc." 
    },
    { 
        id: "OPS_MACHINE_SILENCER", 
        group: "Seguridad y Control Operativo", 
        label: "9. Foto de Maquinarias con silenciador", 
        hint: "Evidenciar uso de silenciadores en maquinaria." 
    },
    { 
        id: "SST_EMERGENCY_VEHICLE", 
        group: "Programa de SST y Emergencias", 
        label: "1. Foto de Vehículo de Emergencia", 
        hint: "Ambulancia/Rescate." 
    },
    { 
        id: "SST_HEALTH_SPECIALIST", 
        group: "Programa de SST y Emergencias", 
        label: "2. Foto de Tópico y su especialista de Salud", 
        hint: "Área médica." 
    },
    { 
        id: "SST_TELEPHONE_DIRECTORY", 
        group: "Programa de SST y Emergencias", 
        label: "3. Foto de Directorio telefónico de emergencia.", 
        hint: "Directorio visible." 
    },
    { 
        id: "SST_COMMS_FLOW", 
        group: "Programa de SST y Emergencias", 
        label: "4. Foto de Flujograma de Comunicación de emergencia", 
        hint: "Flujograma comunicaciones." 
    },
    { 
        id: "SST_CARE_FLOW", 
        group: "Programa de SST y Emergencias", 
        label: "5. Foto de Flujograma de atención de emergencia", 
        hint: "Atención de emergencias."
    },
    { 
        id: "FUEL_CISTERN_SPILL_KIT", 
        group: "Control de Hidrocarburos y Maquinaria", 
        label: "1. Foto de cisterna de Comb. KIT contra derrame", 
        hint: "Evidenciar kit antiderrame en cisterna de combustible." 
    },
    { 
        id: "FUEL_CISTERN_TRAY", 
        group: "Control de Hidrocarburos y Maquinaria", 
        label: "2. Foto de cisterna de Comb. usando bandeja", 
        hint: "Evidenciar uso de bandeja de contención durante abastecimiento." 
    }
];

// --- DETOUR CATEGORIES ---
export const DETOUR_CATEGORIES: DetourCategory[] = [
    { id: "SIGN_SOUTH", label: "Foto señalización según PTP Sur", hint: "Evidenciar señalización de desvío sector Sur." },
    { id: "SIGN_NORTH", label: "Foto señalización según PTP Norte", hint: "Evidenciar señalización de desvío sector Norte." },
    { id: "VIGIAS_DAY", label: "Foto Vigias Día", hint: "Presencia y EPP de vigías en turno día." },
    { id: "VIGIAS_NIGHT", label: "Foto Vigias Noche", hint: "Presencia y elementos luminosos de vigías en turno noche." },
    { id: "LUMINOUS_ARROW", label: "Foto de flecha luminosa", hint: "Funcionamiento de flechas luminosas/paneles." },
    { id: "DELINEATORS", label: "Foto delineadores", hint: "Estado y ubicación de delineadores." },
    { id: "CHANNELIZERS", label: "Foto Canalizadores", hint: "Estado y ubicación de canalizadores (conos, barriles)." },
    { id: "SIGN_CLEANING", label: "Limpieza de señalización", hint: "Evidencia de limpieza de señales preventivas/informativas." },
    { id: "SIGN_REPLACEMENT", label: "Foto de reposición de señalización", hint: "Cambio de elementos dañados o faltantes." },
    { id: "BUMP_PAINTING", label: "Foto de pintado de Giba y/o líneas", hint: "Mantenimiento de pintura en gibas o señalización horizontal." },
    { id: "DETOUR_CLEANING", label: "Foto de limpieza de desvío", hint: "Limpieza general de la zona de desvío (basura, escombros)." }
];

// --- PETAR TYPES ---
export const PETAR_TYPES = [
    'Caliente',
    'Altura',
    'Excavacion',
    'Espacio Confinado',
    'Izaje'
];

// --- ACTOS Y CONDICIONES (A/C) ---
export const ACTOS_LIST = [
    'Conducir vehículos y operar equipos móviles sin respetar las reglas de seguridad vial.',
    'No implementar los controles establecidos para la tarea',
    'Retirar guardas, barandas u otros dispositivos de seguridad.',
    'No Reportar inmediatamente lesiones o accidentes.',
    'Exponerse a la linea de fuego',
    'No aplicar el procedimiento de bloqueo para intervenir fuentes de energia',
    'Hablar por celular mientras conduce o realiza su trabajo',
    'Uso inadecuado de EPP o no usa el EPP',
    'No cumplir con las normas o procedimientos de SSOMA',
    'Ejecutar trabajos de Alto Riesgo sin el PETAR',
    'Ejecutar los trabajos en altura sin usar equipos y dispositivos para prevención de caídas.',
    'No uso de los 3 puntos de apoyo al subir y bajar por escaleras',
    'Realizar tareas sin evaluar el nivel de Riesgos o es deficiente',
    'Realizar tareas múltiples en forma simultánea',
    'Operar equipos moviles sin delimitar el area, usar vigias o advertir el peligro',
    'Usar equipos de izaje y/o equipos móviles fuera de la especificación del fabricante o defectuosos',
    'Conducir vehículos u operar equipos móviles sin autorización o vencidas',
    'Trabajar bajo la influencia del alcohol y drogas',
    'Ingresar a áreas restringidas sin autorización.',
    'Manipular o levantar cargas de forma insegura'
];

export const CONDICIONES_LIST = [
    'Proteccion inadecuadas, defectuosa o inexistente para hacer la tarea',
    'Paredes, techos, muros, taludes, cerros, etc inestables',
    'Herramientas, Equipos, Materiales defectuosos, sin mantenimiento o sin calibración',
    'Condiciones Ambientales Peligrosas o mal manejo de RRSS',
    'Inadecuada iluminación para realizar el trabajo',
    'Caminos, pisos, superficies inadecuadas o inestables',
    'EPP en mal estado o inexistente',
    'Congestión o Acción Restringida',
    'Equipos de Emergencia inadecuadas o defectuosas',
    'Derrame',
    'Falta de Orden y Limpieza en la zona de trabajo',
    'Exceso de Ruido',
    'Exceso de Radiación',
    'Climas adversos',
    'Ventilación Inadecuada',
    'Falta señalización (cintas, carteles) en las áreas o delimitación deficiente.',
    'Cables y Equipos energizados defectuosos o sobrecargados',
    'Productos Quimicos peligrosos sin proteccion',
    'Peligros ergonómicos',
    'Peligros de Incendio y Explosión, Trabajos en Caliente sin Controles'
];
