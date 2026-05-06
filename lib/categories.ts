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

// --- PMA CATEGORIES (Based on Monthly Report Guide Text) ---
export const PMA_CATEGORIES: PMACategory[] = [
    // BIENESTAR E HIGIENE
    { id: "W_HANDWASH", group: "Higiene", label: "Lavamanos", hint: "Evidenciar estaciones de lavado de manos." },
    { id: "W_SHOWERS", group: "Higiene", label: "Duchas", hint: "Evidenciar estado de duchas." },
    { id: "W_BATHROOMS", group: "Higiene", label: "Baños y Limpieza", hint: "Evidenciar estado y limpieza de baños." },
    { id: "W_HYDRATION", group: "Higiene", label: "Punto de Hidratación", hint: "Evidenciar puntos de agua/hidratación." },
    { id: "W_DINING_CLEAN", group: "Higiene", label: "Limpieza de Comedor", hint: "Evidenciar higiene en áreas de alimentación." },
    
    // MANEJO DE RESIDUOS
    { id: "WASTE_CONTAINERS", group: "Residuos", label: "Contenedores para residuos sólidos", hint: "Evidenciar tachos y cilindros de segregación." },
    { id: "WASTE_TRANSPORT", group: "Residuos", label: "Recolección y transporte de los residuos", hint: "Evidenciar camión o traslado de residuos." },
    { id: "WASTE_STORAGE_NP", group: "Residuos", label: "Centro de acopio de Residuos No peligrosos", hint: "Área de acopio temporal No Peligrosos." },
    { id: "WASTE_STORAGE_P", group: "Residuos", label: "Centro de acopio de Residuos peligrosos", hint: "Área de acopio temporal Peligrosos." },
    { id: "WASTE_INTERNAL_COLLECT", group: "Residuos", label: "Recojo Interno", hint: "Actividades de recojo en frentes de obra." },
    
    // CONTROL DE DERRAMES Y MAQUINARIA
    { id: "SPILL_KIT", group: "PMA", label: "Kit antiderrame", hint: "Evidenciar disponibilidad y estado del kit." },
    { id: "SPILL_TRAY", group: "PMA", label: "Uso de Bandeja antiderrames", hint: "Uso de bandejas en abastecimiento o estacionamiento." },
    { id: "CISTERN_MESH", group: "PMA", label: "Mangueras cuentan con cabezal con malla", hint: "Control de succión en cisternas." },
    { id: "CISTERN_SPILL_KIT", group: "PMA", label: "Cisterna cuenta con kit Antiderrame", hint: "Kit en unidades de riego." },
    { id: "WATER_COURSE_PROTECT", group: "PMA", label: "Vehículos no ingresan al curso de agua", hint: "Protección de cauces." },
    
    // EMISIONES Y POLVO
    { id: "DUST_WATERING", group: "PMA", label: "Realización de riego", hint: "Riego de vías para control de polvo." },
    { id: "NOISE_SILENCER", group: "PMA", label: "Maquinarias con silenciador", hint: "Control de emisiones sonoras." },
    { id: "DUST_CONTROL_SIGN", group: "PMA", label: "Señal de control de polvo", hint: "Señalización informativa de polvo." },
    
    // SEÑALIZACIÓN Y DELIMITACIÓN
    { id: "SIGNAGE_MA", group: "Señalización", label: "Señalización MA ambiental instalada", hint: "Paneles informativos ambientales." },
    { id: "SIGNAGE_PROHIBITION", group: "Señalización", label: "Señalización MA de prohibición", hint: "Prohibición de lavado, caza, etc." },
    { id: "DELIMITATION_AREAS", group: "Señalización", label: "Delimitación de las áreas y perimetro", hint: "Mallas, cintas y barreras." },
    
    // SEGURIDAD Y SALUD (SST)
    { id: "SST_PPE_USE", group: "Seguridad", label: "Uso de EPP", hint: "Personal usando equipo de protección." },
    { id: "SST_PPE_DELIVERY", group: "Seguridad", label: "Entrega de EPP", hint: "Registro o entrega física de implementos." },
    { id: "SST_SIGNAGE", group: "Seguridad", label: "Señale de SST uso de EPP", hint: "Señalización obligatoria de EPP." },
    { id: "SST_AST_REVIEW", group: "Seguridad", label: "Revisión y llenado de AST", hint: "Personal llenando análisis de trabajo." },
    { id: "SST_IPERC_DISPLAY", group: "Seguridad", label: "Matriz IPERC en exhibición", hint: "IPERC visible en campo." },
    { id: "SST_EMERGENCY_STATION", group: "Seguridad", label: "Estación de Emergencia", hint: "Extintores y botiquines." },
    { id: "SST_EMERGENCY_VEHICLE", group: "Seguridad", label: "Vehículo de Emergencia", hint: "Ambulancia o camioneta de rescate." },
    { id: "SST_HEALTH_TOPIC", group: "Salud", label: "Tópico y su especialista de Salud", hint: "Área médica y personal." },
    { id: "SST_PHONE_DIRECTORY", group: "Salud", label: "Directorio telefónico de emergencia", hint: "Directorio visible." },
    
    // SOCIAL Y OTROS
    { id: "SOCIAL_SUGGESTION_BOX", group: "Social", label: "Buzón de Sugerencia", hint: "Disponibilidad del buzón." },
    { id: "SOCIAL_COMPLAINTS_BOOK", group: "Social", label: "Libro de Reclamos", hint: "Disponibilidad del libro." },
    { id: "FLORA_FAUNA_TALK", group: "Ambiental", label: "Charla sobre cuidado de la Flora y Fauna", hint: "Capacitación específica." },
    { id: "MONITORING", group: "PMA", label: "Monitoreos", hint: "Actividades de monitoreo ambiental." }
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
