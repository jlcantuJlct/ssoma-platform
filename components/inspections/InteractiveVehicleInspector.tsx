"use client";

import React, { useState, useMemo } from 'react';
import { 
    Truck, 
    Car, 
    AlertTriangle, 
    Gauge, 
    Lightbulb, 
    CheckCircle2, 
    X, 
    Sparkles, 
    Flame, 
    Wrench, 
    Droplets, 
    Disc, 
    Zap, 
    Eye,
    Package,
    Shield,
    Volume2,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    Compass
} from 'lucide-react';

export interface VehicleDamagedPart {
    id: string;
    category: 'seguridad' | 'neumaticos' | 'cabina' | 'luces' | 'fugas' | 'especifico';
    name: string;
    checklistItem?: string;
    hotspot: { x: number; y: number };
    icon: React.ElementType;
    issue: string;
    action: string;
    viewAngle?: 'lateral' | 'frontal' | 'posterior';
}

// ==========================================
// PARTES PARA CAMIONETA PICKUP DOBLE CABINA
// ==========================================
const CAMIONETA_PARTS: VehicleDamagedPart[] = [
    // --- VISTA LATERAL (PERFIL) ---
    // SEGURIDAD
    {
        id: 'extintor',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Extintor de Seguridad',
        checklistItem: 'Extintor',
        hotspot: { x: 242, y: 105 },
        icon: Flame,
        issue: 'Extintor descargado, fuera de rango verde o sin tarjeta de inspección',
        action: 'Recargar y certificar extintor PQS de 2 kg/4 kg.'
    },
    {
        id: 'conos',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: '2 Conos de Seguridad',
        checklistItem: 'Conos/Triángulos de seguridad',
        hotspot: { x: 310, y: 108 },
        icon: AlertTriangle,
        issue: 'Faltan 2 conos de seguridad o no tienen cintas reflectivas',
        action: 'Equipar camioneta con 2 conos reglamentarios de 28" con reflectivo.'
    },
    {
        id: 'tacos',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: '2 Tacos / Cuñas de Bloqueo',
        checklistItem: 'Tacos de seguridad',
        hotspot: { x: 255, y: 195 },
        icon: Package,
        issue: 'Faltan tacos de estacionamiento o están rajados/inadecuados',
        action: 'Reponer 2 cuñas de seguridad reglamentarias de poliuretano.'
    },
    {
        id: 'botiquin',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Botiquín de Primeros Auxilios',
        checklistItem: 'Botiquín',
        hotspot: { x: 195, y: 110 },
        icon: Shield,
        issue: 'Botiquín con elementos vencidos, incompleto o no accesible',
        action: 'Abastecer botiquín vehicular según norma técnica de seguridad.'
    },
    {
        id: 'kit_antiderrame',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Kit Antiderrame',
        checklistItem: 'Kit Antiderrame',
        hotspot: { x: 275, y: 108 },
        icon: Droplets,
        issue: 'Kit antiderrame incompleto: faltan paños absorbentes, salchicha o bolsas',
        action: 'Reponer implementos absorbentes del kit antiderrame vehicular.'
    },
    {
        id: 'circulina',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Circulina / Barra LED',
        checklistItem: 'Circulina (**)',
        hotspot: { x: 175, y: 55 },
        icon: Zap,
        issue: 'Circulina estroboscópica ámbar no enciende o con mica rajada',
        action: 'Reparar switch eléctrico o reemplazar circulina estroboscópica.'
    },
    {
        id: 'alarma_retroceso',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Alarma de Retroceso',
        checklistItem: 'Alarma de retroceso (*)',
        hotspot: { x: 338, y: 165 },
        icon: Volume2,
        issue: 'Alarma sonora de marcha atrás inoperativa o con bajo volumen',
        action: 'Reemplazar bocina/chicharra de retroceso y chequear sensor de reversa.'
    },
    {
        id: 'cintas_seguridad_lat',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Cintas de Seguridad Laterales (3M)',
        checklistItem: 'Cintas reflectivas de seguridad (**)',
        hotspot: { x: 245, y: 140 },
        icon: AlertTriangle,
        issue: 'Cintas reflectivas laterales opacas, despegadas o incompletas',
        action: 'Pegar cintas reflectivas reglamentarias 3M rojo/blanco a lo largo del chasis.'
    },

    // NEUMÁTICOS Y DIRECCIÓN
    {
        id: 'llantas_del',
        viewAngle: 'lateral',
        category: 'neumaticos',
        name: 'Llantas Delanteras',
        checklistItem: 'Llantas delanteras (*)',
        hotspot: { x: 82, y: 180 },
        icon: Disc,
        issue: 'Desgaste disparejo en banda de rodadura, cocada menor a 3 mm o cortes',
        action: 'Rotar o cambiar neumático delantero y verificar presión a 32 PSI.'
    },
    {
        id: 'llantas_post',
        viewAngle: 'lateral',
        category: 'neumaticos',
        name: 'Llantas Posteriores',
        checklistItem: 'Llantas posteriores (*)',
        hotspot: { x: 285, y: 180 },
        icon: Disc,
        issue: 'Neumático posterior desinflado, con clavos o deformación en talón',
        action: 'Cambiar llanta posterior dañada por repuesto en buen estado.'
    },
    {
        id: 'esparragos',
        viewAngle: 'lateral',
        category: 'neumaticos',
        name: 'Espárragos y Tuercas',
        checklistItem: 'Espárragos y Tuercas',
        hotspot: { x: 82, y: 156 },
        icon: Wrench,
        issue: 'Espárragos flojos, oxidados o tuercas de sujeción faltantes',
        action: 'Torquear tuercas a especificación del fabricante (aprox 100 lb-ft).'
    },
    {
        id: 'direccion',
        viewAngle: 'lateral',
        category: 'neumaticos',
        name: 'Sistema de Dirección',
        checklistItem: 'Sistema de dirección (*)',
        hotspot: { x: 45, y: 180 },
        icon: Gauge,
        issue: 'Juego excesivo en el timón o holgura en terminales de dirección',
        action: 'Alinear tren delantero y reemplazar terminales con holgura.'
    },
    {
        id: 'suspension',
        viewAngle: 'lateral',
        category: 'neumaticos',
        name: 'Sistema de Suspensión',
        checklistItem: 'Sistema de suspensión',
        hotspot: { x: 55, y: 154 },
        icon: Gauge,
        issue: 'Amortiguadores con fuga de fluido o paquetes de muelles cedidos',
        action: 'Cambiar amortiguadores y verificar bujes de trapecios.'
    },

    // CABINA
    {
        id: 'cinturon',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Cinturones de Seguridad',
        checklistItem: 'Cinturón de seguridad (*)',
        hotspot: { x: 142, y: 114 },
        icon: Eye,
        issue: 'Cinturón de seguridad de 3 puntos deshilachado o no traba al tirón',
        action: 'Reemplazar carrete retráctil y hebilla de cinturón de seguridad.'
    },
    {
        id: 'espejos',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Espejos Retrovisores',
        checklistItem: 'Espejos Retrovisiores (*)',
        hotspot: { x: 75, y: 110 },
        icon: Eye,
        issue: 'Espejos retrovisores laterales rotos, trizados o sueltos',
        action: 'Cambiar lunas y fijar carcasas de espejos retrovisores.'
    },
    {
        id: 'limpiaparabrisas',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Parabrisas y Plumillas',
        checklistItem: 'Limpiaparabrizas',
        hotspot: { x: 105, y: 90 },
        icon: Wrench,
        issue: 'Plumillas resecas que rayan o no barren el agua, parabrisas trizado',
        action: 'Cambiar juego de plumillas limpiaparabrisas y reparar lunas.'
    },
    {
        id: 'freno_mano',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Freno de Mano / Pedales',
        checklistItem: 'Freno de mano (*)',
        hotspot: { x: 118, y: 138 },
        icon: Gauge,
        issue: 'Freno de mano no frena la unidad o pedal de freno esponjoso',
        action: 'Tensar cable de freno de estacionamiento y purgar líquido de frenos.'
    },
    {
        id: 'asientos',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Asientos de Cabina',
        checklistItem: 'Asientos',
        hotspot: { x: 168, y: 122 },
        icon: Eye,
        issue: 'Cabezales rotos, tapiz deteriorado o riel de regulación atascado',
        action: 'Reparar rieles y verificar anclajes de butacas de conductor.'
    },
    {
        id: 'claxon',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Claxon / Bocina',
        checklistItem: 'Claxón (*)',
        hotspot: { x: 42, y: 125 },
        icon: Volume2,
        issue: 'Claxon no suena o presenta sonido débil inaudible',
        action: 'Revisar fusible, pulsador de volante y corneta de claxon.'
    },
    {
        id: 'luces_cabina',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Luces de Cabina',
        checklistItem: 'Luces de Cabina',
        hotspot: { x: 165, y: 80 },
        icon: Lightbulb,
        issue: 'Luz de cortesía interior quemada o switch no activa con puerta',
        action: 'Reemplazar foco LED de cabina y sensor de puerta.'
    },
    {
        id: 'estribos',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Estribos y Pasamanos',
        checklistItem: 'Estribos (Peldaños)',
        hotspot: { x: 155, y: 174 },
        icon: Wrench,
        issue: 'Estribo lateral doblado, pernos de anclaje flojos o superficie resbalosa',
        action: 'Ajustar pernos de chasis y reparar pisadera de estribo.'
    },
    {
        id: 'vidrios',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Vidrios y Ventanas',
        checklistItem: 'Vidrios de ventana',
        hotspot: { x: 138, y: 92 },
        icon: Eye,
        issue: 'Vidrio de ventana atascado, no sube/baja o lámina de seguridad despegada',
        action: 'Lubricar cremallera elevalunas y reemplazar lámina de protección.'
    },
    {
        id: 'tapa_combustible',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Tapa Tanque de Combustible',
        checklistItem: 'Tapa tanque combustible',
        hotspot: { x: 215, y: 135 },
        icon: Flame,
        issue: 'Tapa sin chapa o empaque deteriorado provocando derrame de combustible',
        action: 'Instalar tapa con llave de seguridad y sello hermético.'
    },
    {
        id: 'timon_panel',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Timón de Dirección y Mandos',
        checklistItem: 'Timón de dirección (*)',
        hotspot: { x: 110, y: 115 },
        icon: Gauge,
        issue: 'Luz testigo Check Engine encendida o juego axial en columna de dirección',
        action: 'Diagnóstico computarizado OBD-II y ajuste de columna de dirección.'
    },

    // LUCES
    {
        id: 'luces_faros',
        viewAngle: 'lateral',
        category: 'luces',
        name: 'Faros Delanteros',
        checklistItem: 'Luces (*)',
        hotspot: { x: 22, y: 138 },
        icon: Lightbulb,
        issue: 'Faro delantero principal quemado o no conmuta luz alta/baja',
        action: 'Reemplazar bombillo H4/LED y alinear proyección de luces.'
    },
    {
        id: 'neblineros',
        viewAngle: 'lateral',
        category: 'luces',
        name: 'Faros Neblineros',
        checklistItem: 'Neblineros (**)',
        hotspot: { x: 28, y: 165 },
        icon: Lightbulb,
        issue: 'Neblinero inferior inoperativo o con mica quebreada',
        action: 'Reponer faro neblinero y verificar switch auxiliar.'
    },
    {
        id: 'luces_post',
        viewAngle: 'lateral',
        category: 'luces',
        name: 'Luces Posteriores / Freno',
        checklistItem: 'Luces (*)',
        hotspot: { x: 345, y: 135 },
        icon: Lightbulb,
        issue: 'Luz de freno o direccional posterior no enciende al pisar freno',
        action: 'Cambiar foco de doble filamento y limpiar socket sulfatado.'
    },

    // FUGAS
    {
        id: 'fuga_motor',
        viewAngle: 'lateral',
        category: 'fugas',
        name: 'Fuga de Aceite de Motor',
        checklistItem: 'Aceite de Motor',
        hotspot: { x: 95, y: 205 },
        icon: Droplets,
        issue: 'Goteo activo de aceite bajo el cárter de motor sobre el suelo',
        action: 'Ajustar tapón de cárter, cambiar empaquetadura y limpiar restos.'
    },
    {
        id: 'fuga_combustible',
        viewAngle: 'lateral',
        category: 'fugas',
        name: 'Fuga de Combustible',
        checklistItem: 'Combustible (Fugas)',
        hotspot: { x: 195, y: 205 },
        icon: Droplets,
        issue: 'Olor o humedad de diesel/gasolina en líneas del tanque',
        action: 'Ajustar abrazaderas y reparar cañería de combustible.'
    },
    {
        id: 'fuga_caja',
        viewAngle: 'lateral',
        category: 'fugas',
        name: 'Fuga en Transmisión / 4x4',
        checklistItem: 'Aceite Transmisión',
        hotspot: { x: 155, y: 205 },
        icon: Droplets,
        issue: 'Pérdida de lubricante en caja de cambios o caja de transferencia',
        action: 'Cambiar retenes de transmisión y rellenar nivel de aceite.'
    },

    // --- VISTA FRONTAL (DELANTERA) ---
    {
        id: 'luces_faros_izq',
        viewAngle: 'frontal',
        category: 'luces',
        name: 'Faro Delantero Izquierdo',
        checklistItem: 'Luces (*)',
        hotspot: { x: 92, y: 145 },
        icon: Lightbulb,
        issue: 'Faro delantero izquierdo quemado o no conmuta luz alta/baja',
        action: 'Reemplazar bombillo H4/LED y alinear faro izquierdo.'
    },
    {
        id: 'luces_faros_der',
        viewAngle: 'frontal',
        category: 'luces',
        name: 'Faro Delantero Derecho',
        checklistItem: 'Luces (*)',
        hotspot: { x: 268, y: 145 },
        icon: Lightbulb,
        issue: 'Faro delantero derecho quemado o no conmuta luz alta/baja',
        action: 'Reemplazar bombillo H4/LED y alinear faro derecho.'
    },
    {
        id: 'neblinero_izq',
        viewAngle: 'frontal',
        category: 'luces',
        name: 'Neblinero Delantero Izquierdo',
        checklistItem: 'Neblineros (**)',
        hotspot: { x: 95, y: 175 },
        icon: Lightbulb,
        issue: 'Faro neblinero izquierdo inoperativo o con mica rota',
        action: 'Reponer neblinero izquierdo y revisar switch auxiliar.'
    },
    {
        id: 'neblinero_der',
        viewAngle: 'frontal',
        category: 'luces',
        name: 'Neblinero Delantero Derecho',
        checklistItem: 'Neblineros (**)',
        hotspot: { x: 265, y: 175 },
        icon: Lightbulb,
        issue: 'Faro neblinero derecho inoperativo o con mica rota',
        action: 'Reponer neblinero derecho y revisar switch auxiliar.'
    },
    {
        id: 'cintas_frontales',
        viewAngle: 'frontal',
        category: 'seguridad',
        name: 'Cintas de Seguridad Delanteras (3M)',
        checklistItem: 'Cintas reflectivas de seguridad (**)',
        hotspot: { x: 180, y: 175 },
        icon: AlertTriangle,
        issue: 'Cintas reflectivas delanteras en parachoques despegadas o desgastadas',
        action: 'Instalar cintas reflectivas reglamentarias 3M rojo/blanco grado diamante.'
    },
    {
        id: 'parabrisas_plumillas_front',
        viewAngle: 'frontal',
        category: 'cabina',
        name: 'Parabrisas y Plumillas Frontales',
        checklistItem: 'Limpiaparabrizas',
        hotspot: { x: 180, y: 95 },
        icon: Wrench,
        issue: 'Plumillas resecas que rayan el vidrio o no limpian lluvia, luna frontal con fisuras',
        action: 'Cambiar juego de plumillas limpiaparabrisas y reparar lunas.'
    },
    {
        id: 'espejo_izq_front',
        viewAngle: 'frontal',
        category: 'cabina',
        name: 'Espejo Retrovisor Izquierdo',
        checklistItem: 'Espejos Retrovisiores (*)',
        hotspot: { x: 42, y: 100 },
        icon: Eye,
        issue: 'Espejo retrovisor exterior izquierdo trizado, roto o base floja',
        action: 'Cambiar luna y ajustar base de soporte de espejo izquierdo.'
    },
    {
        id: 'espejo_der_front',
        viewAngle: 'frontal',
        category: 'cabina',
        name: 'Espejo Retrovisor Derecho',
        checklistItem: 'Espejos Retrovisiores (*)',
        hotspot: { x: 318, y: 100 },
        icon: Eye,
        issue: 'Espejo retrovisor exterior derecho trizado, roto o base floja',
        action: 'Cambiar luna y ajustar base de soporte de espejo derecho.'
    },
    {
        id: 'circulina_front',
        viewAngle: 'frontal',
        category: 'seguridad',
        name: 'Circulina de Techo Frontal',
        checklistItem: 'Circulina (**)',
        hotspot: { x: 180, y: 55 },
        icon: Zap,
        issue: 'Circulina estroboscópica no enciende o mica quebrada',
        action: 'Reparar switch de encendido y alimentación eléctrica de circulina.'
    },

    // --- VISTA POSTERIOR (TRASERA) ---
    {
        id: 'luces_post_izq',
        viewAngle: 'posterior',
        category: 'luces',
        name: 'Luz Posterior Izquierda (Freno / Direccional)',
        checklistItem: 'Luces (*)',
        hotspot: { x: 78, y: 155 },
        icon: Lightbulb,
        issue: 'Luz posterior izquierda de freno o direccional inoperativa',
        action: 'Cambiar foco posterior izquierdo y limpiar portalámparas.'
    },
    {
        id: 'luces_post_der',
        viewAngle: 'posterior',
        category: 'luces',
        name: 'Luz Posterior Derecha (Freno / Direccional)',
        checklistItem: 'Luces (*)',
        hotspot: { x: 282, y: 155 },
        icon: Lightbulb,
        issue: 'Luz posterior derecha de freno o direccional inoperativa',
        action: 'Cambiar foco posterior derecho y limpiar portalámparas.'
    },
    {
        id: 'cintas_seguridad_post',
        viewAngle: 'posterior',
        category: 'seguridad',
        name: 'Cintas de Seguridad Posteriores (3M)',
        checklistItem: 'Cintas reflectivas de seguridad (**)',
        hotspot: { x: 180, y: 172 },
        icon: AlertTriangle,
        issue: 'Cintas reflectivas traseras rojas/blancas opacas, rotas o despegadas',
        action: 'Colocar franja continua de cintas reflectivas 3M grado diamante.'
    },
    {
        id: 'alarma_retroceso_post',
        viewAngle: 'posterior',
        category: 'seguridad',
        name: 'Alarma de Retroceso Sonora',
        checklistItem: 'Alarma de retroceso (*)',
        hotspot: { x: 228, y: 180 },
        icon: Volume2,
        issue: 'Alarma sonora de reversa inaudible, dañada o desconectada',
        action: 'Cambiar chicharra de retroceso y verificar sensor de reversa.'
    },
    {
        id: 'compuerta_pickup_post',
        viewAngle: 'posterior',
        category: 'especifico',
        name: 'Compuerta Posterior de Tolva',
        checklistItem: 'Transporte Personal',
        hotspot: { x: 180, y: 130 },
        icon: Truck,
        issue: 'Chapa o manija de tolva posterior trabada o cables de retención rotos',
        action: 'Ajustar cerradura de compuerta posterior y cambiar cables de soporte.'
    },
    {
        id: 'tacos_bloqueo_post',
        viewAngle: 'posterior',
        category: 'seguridad',
        name: 'Tacos / Cuñas de Bloqueo Posteriores',
        checklistItem: 'Tacos de seguridad',
        hotspot: { x: 135, y: 198 },
        icon: Package,
        issue: 'Faltan tacos de estacionamiento reglamentarios para ruedas traseras',
        action: 'Equipar unidad con 2 cuñas de seguridad para estacionamiento seguro.'
    }
];

// ==========================================
// PARTES PARA CAMIONES PESADOS (Cisterna, Volquete, Cama Baja, Baranda)
// ==========================================
const getHeavyParts = (type: string): VehicleDamagedPart[] => {
    const isWater = type.includes('Agua');
    const isFuel = type.includes('Combustible');
    const isVolquete = type.includes('Volquete');
    const isCamaBaja = type.includes('Cama Baja') || type.includes('Semiremolque');

    const commonParts: VehicleDamagedPart[] = [
        // --- VISTA LATERAL (PERFIL) ---
        // SEGURIDAD
        {
            id: 'extintor_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: 'Extintores PQS de 9 kg / 12 kg',
            checklistItem: 'Extintor',
            hotspot: { x: 125, y: 112 },
            icon: Flame,
            issue: 'Extintor descargado o sin precinto de seguridad vigente',
            action: 'Recarga y certificación técnica de extintor de 9/12 kg.'
        },
        {
            id: 'conos_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: '2 Conos de Seguridad (28")',
            checklistItem: 'Conos/Triángulos de seguridad',
            hotspot: { x: 310, y: 120 },
            icon: AlertTriangle,
            issue: 'Faltan conos reglamentarios o bandas reflectivas desgastadas',
            action: 'Proveer 2 conos pesados con doble banda reflectiva.'
        },
        {
            id: 'tacos_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: '2 Tacos Pesados de Bloqueo',
            checklistItem: 'Tacos de seguridad',
            hotspot: { x: 280, y: 195 },
            icon: Package,
            issue: 'Faltan tacos de estacionamiento para camión pesado',
            action: 'Dotar con 2 cuñas de seguridad para alta capacidad.'
        },
        {
            id: 'botiquin_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: 'Botiquín de Emergencia',
            checklistItem: 'Botiquín',
            hotspot: { x: 105, y: 142 },
            icon: Shield,
            issue: 'Botiquín de primeros auxilios incompleto o no disponible',
            action: 'Completar implementos de botiquín de cabina.'
        },
        {
            id: 'kit_antiderrame_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: 'Kit Antiderrame para Pesados',
            checklistItem: 'Kit Antiderrame',
            hotspot: { x: 148, y: 140 },
            icon: Droplets,
            issue: 'Falta kit antiderrame, salchichas absorbentes o turba',
            action: 'Reponer kit antiderrame de 55 galones para vehículo pesado.'
        },
        {
            id: 'circulina_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: 'Circulina de Techo',
            checklistItem: 'Circulina (**)',
            hotspot: { x: 75, y: 46 },
            icon: Zap,
            issue: 'Circulina estroboscópica inoperativa en zona de operaciones',
            action: 'Reparar conexión eléctrica de circulina de techo.'
        },
        {
            id: 'alarma_retroceso_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: 'Alarma de Retroceso',
            checklistItem: 'Alarma de retroceso (*)',
            hotspot: { x: 345, y: 168 },
            icon: Volume2,
            issue: 'Alarma de retroceso inoperativa o con bajo volumen al enganchar reversa',
            action: 'Reemplazar chicharra de retroceso y verificar sensor de reversa.'
        },
        {
            id: 'cintas_seguridad_lat_heavy',
            viewAngle: 'lateral',
            category: 'seguridad',
            name: 'Cintas de Seguridad Laterales (3M)',
            checklistItem: 'Cintas reflectivas de seguridad (**)',
            hotspot: { x: 200, y: 140 },
            icon: AlertTriangle,
            issue: 'Cintas reflectivas laterales opacas, despegadas o incompletas',
            action: 'Pegar cintas reflectivas reglamentarias 3M rojo/blanco a lo largo del chasis.'
        },

        // NEUMÁTICOS Y DIRECCIÓN
        {
            id: 'llantas_del_heavy',
            viewAngle: 'lateral',
            category: 'neumaticos',
            name: 'Neumáticos Delanteros / Dirección',
            checklistItem: 'Llantas delanteras (*)',
            hotspot: { x: 75, y: 180 },
            icon: Disc,
            issue: 'Desgaste irregular o profundidad de cocada menor a 4 mm',
            action: 'Cambio de neumáticos direccionales y calibrar presión.'
        },
        {
            id: 'duales_heavy',
            viewAngle: 'lateral',
            category: 'neumaticos',
            name: 'Neumáticos Duales y Tuercas',
            checklistItem: 'Llantas posteriores (*)',
            hotspot: { x: 260, y: 180 },
            icon: Disc,
            issue: 'Piedras atrapadas entre duales, cortes o tuercas flojas',
            action: 'Despejar duales y verificar torque en todas las tuercas.'
        },
        {
            id: 'esparragos_heavy',
            viewAngle: 'lateral',
            category: 'neumaticos',
            name: 'Espárragos y Tuercas',
            checklistItem: 'Espárragos y Tuercas',
            hotspot: { x: 235, y: 180 },
            icon: Wrench,
            issue: 'Tuercas flojas, espárragos rotos o sin capuchones indicadores',
            action: 'Ajustar tuercas a torque de fabricante y reemplazar espárragos rotos.'
        },
        {
            id: 'suspension_heavy',
            viewAngle: 'lateral',
            category: 'neumaticos',
            name: 'Sistema de Suspensión',
            checklistItem: 'Sistema de suspensión',
            hotspot: { x: 100, y: 180 },
            icon: Gauge,
            issue: 'Muelles rotos, abrazaderas flojas o amortiguadores con fuga',
            action: 'Cambio de hojas de muelle fracturadas y torque a abrazaderas.'
        },

        // CABINA DE OPERADOR
        {
            id: 'cinturon_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Cinturones de Seguridad',
            checklistItem: 'Cinturón de seguridad (*)',
            hotspot: { x: 78, y: 118 },
            icon: Eye,
            issue: 'Cinturón de seguridad desgastado, deshilachado o hebilla no traba',
            action: 'Reemplazar cinturón de seguridad certificado de 3 puntos.'
        },
        {
            id: 'espejos_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Espejos Retrovisores',
            checklistItem: 'Espejos Retrovisiores (*)',
            hotspot: { x: 22, y: 102 },
            icon: Eye,
            issue: 'Espejos retrovisores trizados, desalineados o con soporte roto',
            action: 'Reemplazar lunas convexas y ajustar brazos de sujeción.'
        },
        {
            id: 'limpiaparabrisas_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Parabrisas y Plumillas',
            checklistItem: 'Limpiaparabrizas',
            hotspot: { x: 48, y: 88 },
            icon: Wrench,
            issue: 'Plumillas resecas, no limpian campo visual o luna frontal rajada',
            action: 'Cambiar juego de plumillas de camión y reparar parabrisas.'
        },
        {
            id: 'asientos_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Asiento de Operador',
            checklistItem: 'Asientos',
            hotspot: { x: 105, y: 118 },
            icon: Eye,
            issue: 'Asiento con suspensión neumática desinflada o base rota',
            action: 'Reparar pulmón neumático y regular amortiguación de asiento.'
        },
        {
            id: 'claxon_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Claxon / Bocina de Aire',
            checklistItem: 'Claxón (*)',
            hotspot: { x: 24, y: 128 },
            icon: Volume2,
            issue: 'Corneta de aire o bocina eléctrica inaudible o inoperativa',
            action: 'Revisar solenoide de corneta neumática y línea de presión de aire.'
        },
        {
            id: 'luces_cabina_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Luces de Cabina',
            checklistItem: 'Luces de Cabina',
            hotspot: { x: 82, y: 72 },
            icon: Lightbulb,
            issue: 'Luz interior de cabina quemada o difusor quebrado',
            action: 'Cambio de foco interior LED 24V.'
        },
        {
            id: 'estribos_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Estribos y Pasamanos',
            checklistItem: 'Estribos (Peldaños)',
            hotspot: { x: 42, y: 168 },
            icon: Wrench,
            issue: 'Peldaños doblados, resbaladizos o pasamanos suelto con riesgo de caída',
            action: 'Enderezar peldaños antideslizantes y soldar soporte de pasamanos.'
        },
        {
            id: 'vidrios_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Vidrios y Ventanas',
            checklistItem: 'Vidrios de ventana',
            hotspot: { x: 104, y: 98 },
            icon: Eye,
            issue: 'Lunas laterales inoperativas, manivela/botonera trabada o trizadas',
            action: 'Reparar mecanismo elevalunas y reemplazar vidrio trizado.'
        },
        {
            id: 'freno_mano_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Freno de Parqueo / Maxibrake',
            checklistItem: 'Freno de mano (*)',
            hotspot: { x: 78, y: 142 },
            icon: Gauge,
            issue: 'Válvula de freno de estacionamiento (push-pull) fuga aire o no clava ruedas',
            action: 'Cambio de válvula de parqueo y calibración de pulmones maxibrake.'
        },
        {
            id: 'timon_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Timón de Dirección y Mandos',
            checklistItem: 'Timón de dirección (*)',
            hotspot: { x: 52, y: 115 },
            icon: Gauge,
            issue: 'Manómetros de aire marcan bajo nivel o timón con cabeceo irregular',
            action: 'Revisar compresor de aire y calibrar caja de dirección hidráulica.'
        },
        {
            id: 'tapa_combustible_heavy',
            viewAngle: 'lateral',
            category: 'cabina',
            name: 'Tapa Tanque de Combustible',
            checklistItem: 'Tapa tanque combustible',
            hotspot: { x: 145, y: 172 },
            icon: Flame,
            issue: 'Tanque sin tapa hermética o sin llave de seguridad para evitar hurto',
            action: 'Colocar tapa de combustible con llave y empaque de jebe nuevo.'
        },

        // LUCES
        {
            id: 'luces_faros_heavy',
            viewAngle: 'lateral',
            category: 'luces',
            name: 'Faros Delanteros',
            checklistItem: 'Luces (*)',
            hotspot: { x: 24, y: 152 },
            icon: Lightbulb,
            issue: 'Faro principal quemado o no conmuta luz alta/baja',
            action: 'Reemplazar bombillo H4 24V y alinear faros principales.'
        },
        {
            id: 'luces_post_heavy',
            viewAngle: 'lateral',
            category: 'luces',
            name: 'Luces Posteriores y Freno',
            checklistItem: 'Luces (*)',
            hotspot: { x: 345, y: 138 },
            icon: Lightbulb,
            issue: 'Micas posteriores rotas o luz de freno posterior quemada',
            action: 'Instalar piloto posterior sellado LED 24V.'
        },

        // FUGAS
        {
            id: 'fuga_motor_heavy',
            viewAngle: 'lateral',
            category: 'fugas',
            name: 'Fuga de Aceite de Motor',
            checklistItem: 'Aceite de Motor',
            hotspot: { x: 80, y: 205 },
            icon: Droplets,
            issue: 'Fuga visible de lubricante en cárter o filtro de aceite',
            action: 'Reparar goteo y sustituir junta de cárter de motor.'
        },
        {
            id: 'fuga_comb_heavy',
            viewAngle: 'lateral',
            category: 'fugas',
            name: 'Fuga en Líneas de Combustible',
            checklistItem: 'Combustible (Fugas)',
            hotspot: { x: 120, y: 205 },
            icon: Droplets,
            issue: 'Pérdida de combustible diesel en tanques o mangueras',
            action: 'Ajustar racores y corregir fuga de combustible.'
        },

        // --- VISTA FRONTAL (DELANTERA COMÚN A CAMIONES PESADOS) ---
        {
            id: 'luces_faros_izq_heavy',
            viewAngle: 'frontal',
            category: 'luces',
            name: 'Faro Delantero Izquierdo',
            checklistItem: 'Luces (*)',
            hotspot: { x: 92, y: 145 },
            icon: Lightbulb,
            issue: 'Faro principal izquierdo de 24V quemado o no conmuta luz alta/baja',
            action: 'Reemplazar bombillo H4 24V y alinear faro izquierdo.'
        },
        {
            id: 'luces_faros_der_heavy',
            viewAngle: 'frontal',
            category: 'luces',
            name: 'Faro Delantero Derecho',
            checklistItem: 'Luces (*)',
            hotspot: { x: 268, y: 145 },
            icon: Lightbulb,
            issue: 'Faro principal derecho de 24V quemado o no conmuta luz alta/baja',
            action: 'Reemplazar bombillo H4 24V y alinear faro derecho.'
        },
        {
            id: 'neblinero_izq_heavy',
            viewAngle: 'frontal',
            category: 'luces',
            name: 'Neblinero Delantero Izquierdo',
            checklistItem: 'Neblineros (**)',
            hotspot: { x: 95, y: 175 },
            icon: Lightbulb,
            issue: 'Neblinero frontal izquierdo con mica rota o sin foco',
            action: 'Reponer faro neblinero izquierdo de camión.'
        },
        {
            id: 'neblinero_der_heavy',
            viewAngle: 'frontal',
            category: 'luces',
            name: 'Neblinero Delantero Derecho',
            checklistItem: 'Neblineros (**)',
            hotspot: { x: 265, y: 175 },
            icon: Lightbulb,
            issue: 'Neblinero frontal derecho con mica rota o sin foco',
            action: 'Reponer faro neblinero derecho de camión.'
        },
        {
            id: 'cintas_frontales_heavy',
            viewAngle: 'frontal',
            category: 'seguridad',
            name: 'Cintas de Seguridad Delanteras (3M)',
            checklistItem: 'Cintas reflectivas de seguridad (**)',
            hotspot: { x: 180, y: 175 },
            icon: AlertTriangle,
            issue: 'Cintas reflectivas delanteras en parachoques despegadas o desgastadas',
            action: 'Instalar cintas reflectivas reglamentarias 3M rojo/blanco grado diamante.'
        },
        {
            id: 'parabrisas_plumillas_front_heavy',
            viewAngle: 'frontal',
            category: 'cabina',
            name: 'Parabrisas y Plumillas Frontales',
            checklistItem: 'Limpiaparabrizas',
            hotspot: { x: 180, y: 95 },
            icon: Wrench,
            issue: 'Plumillas de camión pesadas desgastadas o luna panorámica rajada',
            action: 'Cambiar juego de plumillas de servicio pesado y reparar parabrisas.'
        },
        {
            id: 'espejo_izq_front_heavy',
            viewAngle: 'frontal',
            category: 'cabina',
            name: 'Espejo Retrovisor Izquierdo',
            checklistItem: 'Espejos Retrovisiores (*)',
            hotspot: { x: 42, y: 100 },
            icon: Eye,
            issue: 'Espejo retrovisor exterior izquierdo trizado, roto o base floja',
            action: 'Cambiar luna y ajustar base de soporte de espejo izquierdo.'
        },
        {
            id: 'espejo_der_front_heavy',
            viewAngle: 'frontal',
            category: 'cabina',
            name: 'Espejo Retrovisor Derecho',
            checklistItem: 'Espejos Retrovisiores (*)',
            hotspot: { x: 318, y: 100 },
            icon: Eye,
            issue: 'Espejo retrovisor exterior derecho trizado, roto o base floja',
            action: 'Cambiar luna y ajustar base de soporte de espejo derecho.'
        },
        {
            id: 'circulina_front_heavy',
            viewAngle: 'frontal',
            category: 'seguridad',
            name: 'Circulina de Techo Frontal',
            checklistItem: 'Circulina (**)',
            hotspot: { x: 180, y: 55 },
            icon: Zap,
            issue: 'Circulina estroboscópica de techo inoperativa',
            action: 'Revisar conexión y fusible de circulina estroboscópica.'
        },

        // --- VISTA POSTERIOR (TRASERA COMÚN A CAMIONES PESADOS) ---
        {
            id: 'luces_post_izq_heavy',
            viewAngle: 'posterior',
            category: 'luces',
            name: 'Luz Posterior Izquierda (Freno / Direccional)',
            checklistItem: 'Luces (*)',
            hotspot: { x: 78, y: 155 },
            icon: Lightbulb,
            issue: 'Luz posterior izquierda de freno o direccional inoperativa',
            action: 'Cambiar piloto LED 24V posterior izquierdo.'
        },
        {
            id: 'luces_post_der_heavy',
            viewAngle: 'posterior',
            category: 'luces',
            name: 'Luz Posterior Derecha (Freno / Direccional)',
            checklistItem: 'Luces (*)',
            hotspot: { x: 282, y: 155 },
            icon: Lightbulb,
            issue: 'Luz posterior derecha de freno o direccional inoperativa',
            action: 'Cambiar piloto LED 24V posterior derecho.'
        },
        {
            id: 'cintas_seguridad_post_heavy',
            viewAngle: 'posterior',
            category: 'seguridad',
            name: 'Cintas de Seguridad Posteriores (3M)',
            checklistItem: 'Cintas reflectivas de seguridad (**)',
            hotspot: { x: 180, y: 172 },
            icon: AlertTriangle,
            issue: 'Cintas reflectivas traseras rojas/blancas opacas o desprendidas',
            action: 'Reponer cintas reflectivas reglamentarias 3M según norma MTC.'
        },
        {
            id: 'alarma_retroceso_post_heavy',
            viewAngle: 'posterior',
            category: 'seguridad',
            name: 'Alarma de Retroceso Sonora',
            checklistItem: 'Alarma de retroceso (*)',
            hotspot: { x: 228, y: 180 },
            icon: Volume2,
            issue: 'Alarma de marcha atrás inaudible o desconectada',
            action: 'Reemplazar chicharra de reversa de 97 dB.'
        },
        {
            id: 'tacos_bloqueo_post_heavy',
            viewAngle: 'posterior',
            category: 'seguridad',
            name: 'Tacos / Cuñas de Bloqueo Posteriores',
            checklistItem: 'Tacos de seguridad',
            hotspot: { x: 135, y: 198 },
            icon: Package,
            issue: 'Faltan tacos pesados de estacionamiento para ruedas duales traseras',
            action: 'Dotar con 2 cuñas de seguridad reglamentarias para camión pesado.'
        },

    ];

    let specificParts: VehicleDamagedPart[] = [];

    if (isWater) {
        specificParts = [
            {
                id: 'tanque_agua_heavy',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Tanque de Agua y Rompeolas',
                checklistItem: 'Tanque de Agua',
                hotspot: { x: 215, y: 95 },
                icon: Droplets,
                issue: 'Fuga en el cuerpo de la cisterna de agua o tapa sin empaque',
                action: 'Reparar costuras del tanque cisterna de agua.'
            },
            {
                id: 'motobomba_heavy',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Motobomba y Sistema de Riego',
                checklistItem: 'Motobomba de Agua',
                hotspot: { x: 185, y: 145 },
                icon: Wrench,
                issue: 'Motobomba con baja succión o aspersores posteriores tapados',
                action: 'Mantenimiento a motobomba y limpieza de aspersores.'
            },
            {
                id: 'valvula_descarga_post',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Válvula y Manguera de Descarga Posterior',
                checklistItem: 'Manguera de descarga',
                hotspot: { x: 180, y: 140 },
                icon: Droplets,
                issue: 'Fuga o empaque desgastado en válvula de descarga / barra de riego posterior',
                action: 'Cambiar empaquetadura y ajustar acople de descarga de agua.'
            },
            {
                id: 'rombo_nfpa_post_water',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Rótulo Trasero Cisterna de Agua',
                checklistItem: 'Tanque de Agua',
                hotspot: { x: 180, y: 80 },
                icon: Shield,
                issue: 'Rótulo posterior de identificación borroso o desprendido',
                action: 'Renovar rotulado reflectivo posterior de cisterna de agua.'
            }
        ];
    } else if (isFuel) {
        specificParts = [
            {
                id: 'tanque_comb_heavy',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Tanque Cisterna y Rótulo NFPA',
                checklistItem: 'Tanque de combustible',
                hotspot: { x: 215, y: 95 },
                icon: Flame,
                issue: 'Rótulos de materiales peligrosos borrosos o goteo en purga',
                action: 'Actualizar rotulación NFPA 1203 y sellar purga.'
            },
            {
                id: 'surtidor_heavy',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Surtidor, Manguera y Puesta a Tierra',
                checklistItem: 'Surtidor de combustible',
                hotspot: { x: 185, y: 145 },
                icon: Zap,
                issue: 'Pistola de despacho gotea o cable estático a tierra roto',
                action: 'Cambio de empaque de pistola y reponer cable estático.'
            },
            {
                id: 'valvula_purga_post_fuel',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Válvula de Purga y Corte Posterior',
                checklistItem: 'Válvula de purga',
                hotspot: { x: 180, y: 140 },
                icon: Flame,
                issue: 'Fuga o goteo en válvula de purga de combustible posterior',
                action: 'Cambiar empaque vitón y sellar válvula de purga de diesel.'
            },
            {
                id: 'rombo_nfpa_post_fuel',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Rombo NFPA 1203 Posterior',
                checklistItem: 'Señalización (rombos NFPA / Indecopi)',
                hotspot: { x: 180, y: 70 },
                icon: Flame,
                issue: 'Rombo NFPA 1203 posterior dañado o sin código UN de combustible',
                action: 'Colocar placa rombo NFPA 1203 reflectiva nueva.'
            }
        ];
    } else if (isVolquete) {
        specificParts = [
            {
                id: 'tolva_heavy',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Tolva y Compuerta Posterior',
                checklistItem: 'Tolva',
                hotspot: { x: 235, y: 95 },
                icon: Truck,
                issue: 'Tolva deformada o compuerta posterior con traba defectuosa',
                action: 'Reparar bisagras y asegurar compuerta de tolva.'
            },
            {
                id: 'piston_heavy',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Pistón Hidráulico de Levante',
                checklistItem: 'Pistón de Levante Tolva*',
                hotspot: { x: 168, y: 122 },
                icon: Wrench,
                issue: 'Fuga de aceite hidráulico en cilindro telescópico',
                action: 'Reemplazar sellos del pistón hidráulico.'
            },
            {
                id: 'pines_tolva_heavy',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Pines y Seguro de Tolva',
                checklistItem: 'Pines y seguro de tolva',
                hotspot: { x: 330, y: 155 },
                icon: Wrench,
                issue: 'Pines de articulación de tolva desgastados, sin chaveta o seguros sueltos',
                action: 'Colocar chavetas de seguridad y cambiar pines de tolva desgastados.'
            },
            {
                id: 'pestillo_tolva_izq',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Pestillo Izquierdo de Tolva',
                checklistItem: 'Pines y seguro de tolva',
                hotspot: { x: 106, y: 142 },
                icon: Wrench,
                issue: 'Pestillo / aldaba izquierda de compuerta con holgura o traba suelta',
                action: 'Ajustar seguro mecánico de aldaba izquierda y lubricar pasador.'
            },
            {
                id: 'pestillo_tolva_der',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Pestillo Derecho de Tolva',
                checklistItem: 'Pines y seguro de tolva',
                hotspot: { x: 254, y: 142 },
                icon: Wrench,
                issue: 'Pestillo / aldaba derecha de compuerta con holgura o traba suelta',
                action: 'Ajustar seguro mecánico de aldaba derecha y lubricar pasador.'
            },
            {
                id: 'compuerta_tolva_post',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Compuerta Abatible de Tolva',
                checklistItem: 'Compuerta de Tolva',
                hotspot: { x: 180, y: 110 },
                icon: Truck,
                issue: 'Compuerta posterior de tolva deformada o con fisuras en bisagras superiores',
                action: 'Enderezar compuerta posterior y soldar refuerzos de bisagra.'
            }
        ];
    } else if (isCamaBaja) {
        specificParts = [
            {
                id: 'rampas_cama_baja',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Rampas de Acceso y Tracas',
                checklistItem: 'Rampas de acceso / levante',
                hotspot: { x: 330, y: 135 },
                icon: Wrench,
                issue: 'Rampas traseras con resortes rotos o pernos sueltos',
                action: 'Reforzar pernos y lubricar mecanismo de rampas de cama baja.'
            },
            {
                id: 'cuello_cisne',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Cuello de Cisne / Tornamesa',
                checklistItem: 'Cuello de cisne / Tornamesa (*)',
                hotspot: { x: 125, y: 125 },
                icon: Gauge,
                issue: 'King pin con desgaste excesivo o tornamesa sin engrase',
                action: 'Engrasar tornamesa y calibrar acople King Pin.'
            },
            {
                id: 'rampas_acceso_izq',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Rampa de Acceso Posterior Izquierda',
                checklistItem: 'Rampas de acceso / levante',
                hotspot: { x: 110, y: 115 },
                icon: Wrench,
                issue: 'Rampa izquierda con fisuras, resorte roto o seguro dañado',
                action: 'Reparar soldadura y asegurar traba de rampa izquierda.'
            },
            {
                id: 'rampas_acceso_der',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Rampa de Acceso Posterior Derecha',
                checklistItem: 'Rampas de acceso / levante',
                hotspot: { x: 250, y: 115 },
                icon: Wrench,
                issue: 'Rampa derecha con fisuras, resorte roto o seguro dañado',
                action: 'Reparar soldadura y asegurar traba de rampa derecha.'
            }
        ];
    } else {
        specificParts = [
            {
                id: 'plataforma_baranda',
                viewAngle: 'lateral',
                category: 'especifico',
                name: 'Plataforma y Barandas',
                checklistItem: 'Plataforma posterior',
                hotspot: { x: 215, y: 110 },
                icon: Package,
                issue: 'Barandas astilladas, sueltas o sin ganchos de trinca',
                action: 'Reparar barandas de madera/metal y reponer ganchos.'
            },
            {
                id: 'barandas_post_gate',
                viewAngle: 'posterior',
                category: 'especifico',
                name: 'Barandas Posteriores y Seguros',
                checklistItem: 'Seguro de baranda',
                hotspot: { x: 180, y: 120 },
                icon: Package,
                issue: 'Seguros o aldabas de baranda trasera doblados o con holgura',
                action: 'Reparar ganchos de cierre y pernos de compuerta trasera.'
            }
        ];
    }

    return [...commonParts, ...specificParts];
};

interface InteractiveVehicleInspectorProps {
    vehicleCode: string;
    vehicleType: string;
    observations: string;
    onUpdateObservations: (newObs: string) => void;
    onUpdateChecklist?: (item: string, status: string) => void;
    onClose?: () => void;
    onSwitchType?: (newType: string) => void;
}

export const InteractiveVehicleInspector: React.FC<InteractiveVehicleInspectorProps> = ({
    vehicleCode,
    vehicleType,
    observations,
    onUpdateObservations,
    onUpdateChecklist,
    onClose,
    onSwitchType
}) => {
    const normType = (vehicleType || 'Camioneta').trim();
    const isCamioneta = normType.toLowerCase().includes('camioneta') || normType === 'Vehículo' || normType === '';
    
    // Estado de ángulo / giro 3D: 'lateral' | 'frontal' | 'posterior'
    const [viewAngle, setViewAngle] = useState<'lateral' | 'frontal' | 'posterior'>('lateral');
    const [selectedCategory, setSelectedCategory] = useState<string>('todos');
    const [isCompactPoints, setIsCompactPoints] = useState<boolean>(true);

    // Partes según tipo de vehículo
    const allParts = useMemo(() => {
        if (isCamioneta) return CAMIONETA_PARTS;
        return getHeavyParts(normType);
    }, [normType, isCamioneta]);

    // Filtrar partes según el ángulo de giro activo
    const angleParts = useMemo(() => {
        return allParts.filter(p => (p.viewAngle || 'lateral') === viewAngle);
    }, [allParts, viewAngle]);

    // Filtrar partes si hay cajón/categoría activa dentro de esa vista
    const filteredParts = useMemo(() => {
        if (selectedCategory === 'todos') return angleParts;
        return angleParts.filter(p => p.category === selectedCategory);
    }, [angleParts, selectedCategory]);

    // Detectar qué partes están reportadas
    const selectedPartIds = useMemo(() => {
        const obs = observations || '';
        return allParts
            .filter(part => obs.toLowerCase().includes(`[${part.name.toLowerCase()}]`))
            .map(part => part.id);
    }, [observations, allParts]);

    // Saber si hay alguna fuga marcada
    const hasLeakSelected = useMemo(() => {
        return selectedPartIds.some(id => id.includes('fuga'));
    }, [selectedPartIds]);

    const isItemDefaultNA = (item: string) => {
        if (item.includes('Aceite') || item.includes('Combustible (Fugas)') || item === 'Sistema de suspensión') return true;
        const cabinaDefaultNA = [
            'Estribos (Peldaños)', 'Pasamanos', 'Llave de contacto', 'Freno de mano (*)',
            'Timón de dirección (*)', 'Pedales (*)', 'Palanca de velocidades (*)',
            'Palanca de Tracción 4x4', 'Panel de control', 'Vidrios de ventana',
            'Neblineros (**)', 'Tapa tanque combustible'
        ];
        return cabinaDefaultNA.includes(item);
    };

    const togglePart = (part: VehicleDamagedPart) => {
        const tag = `[${part.name}]`;
        const entryText = `• ${tag}: ${part.issue}. Acción: ${part.action}`;
        let currentObs = observations || '';

        if (selectedPartIds.includes(part.id)) {
            const regex = new RegExp(`(?:•\\s*)?\\\[${escapeRegExp(part.name)}\\\]:[^\\n]*(\\n)?`, 'gi');
            currentObs = currentObs.replace(regex, '').trim();
            if (part.checklistItem && onUpdateChecklist) {
                onUpdateChecklist(part.checklistItem, isItemDefaultNA(part.checklistItem) ? 'N/A' : 'OK');
            }
        } else {
            if (currentObs.trim().length > 0) {
                currentObs = `${currentObs.trim()}\n${entryText}`;
            } else {
                currentObs = entryText;
            }
            if (part.checklistItem && onUpdateChecklist) {
                onUpdateChecklist(part.checklistItem, 'M');
            }
        }

        onUpdateObservations(currentObs);
    };

    const clearAllSelected = () => {
        let currentObs = observations || '';
        allParts.forEach(part => {
            const regex = new RegExp(`(?:•\\s*)?\\\[${escapeRegExp(part.name)}\\\]:[^\\n]*(\\n)?`, 'gi');
            currentObs = currentObs.replace(regex, '');
            if (part.checklistItem && onUpdateChecklist) {
                onUpdateChecklist(part.checklistItem, isItemDefaultNA(part.checklistItem) ? 'N/A' : 'OK');
            }
        });
        onUpdateObservations(currentObs.trim());
    };

    // Funciones para rotación / giro
    const anglesList: ('frontal' | 'lateral' | 'posterior')[] = ['frontal', 'lateral', 'posterior'];
    const handleRotateNext = () => {
        const idx = anglesList.indexOf(viewAngle);
        const nextIdx = (idx + 1) % anglesList.length;
        setViewAngle(anglesList[nextIdx]);
    };
    const handleRotatePrev = () => {
        const idx = anglesList.indexOf(viewAngle);
        const prevIdx = (idx - 1 + anglesList.length) % anglesList.length;
        setViewAngle(anglesList[prevIdx]);
    };

    return (
        <div className="bg-white border-2 border-yellow-500 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95">
            {/* Header del Inspector */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 text-white p-2.5 sm:p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400/20 backdrop-blur-md flex items-center justify-center border border-yellow-400/30 shadow-inner shrink-0">
                        {isCamioneta ? <Car className="text-yellow-400" size={16} /> : <Truck className="text-yellow-400" size={16} />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.2 rounded text-white/95 truncate">
                                {vehicleCode || 'Vehículo'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-semibold text-yellow-300 flex items-center gap-1">
                                <Sparkles size={10} className="text-yellow-400" /> Esquema 3D Interactivo
                            </span>
                        </div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight mt-0.5 truncate">
                            {isCamioneta ? 'Camioneta Pickup Doble Cabina 4x4' : normType}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {onClose && (
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-1 hover:bg-white/20 rounded-md text-white/80 hover:text-white transition-colors"
                            title="Ocultar inspector"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Selector de Tipo de Vehículo rápido */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
                <span className="text-[10px] font-black uppercase text-slate-500 shrink-0 mr-1">Vehículo:</span>
                {[
                    { label: 'Camioneta', icon: '🛻' },
                    { label: 'Cisterna de Agua', icon: '💧' },
                    { label: 'Cisterna de Combustible', icon: '⛽' },
                    { label: 'Volquete', icon: '🚛' },
                    { label: 'Cama Baja', icon: '🚜' },
                    { label: 'Camión Baranda', icon: '📦' }
                ].map(tOpt => (
                    <button
                        key={tOpt.label}
                        type="button"
                        onClick={() => onSwitchType && onSwitchType(tOpt.label)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all border shrink-0 flex items-center gap-1 ${
                            normType === tOpt.label
                                ? 'bg-yellow-500 text-slate-900 border-yellow-600 shadow-xs ring-1 ring-yellow-300'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-yellow-50'
                        }`}
                    >
                        <span>{tOpt.icon}</span> {tOpt.label}
                    </button>
                ))}
            </div>

            {/* BARRA DE GIRO 3D / ROTACIÓN DE VISTAS */}
            <div className="bg-slate-800 text-white px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        type="button"
                        onClick={handleRotatePrev}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors flex items-center gap-1 text-[10px] sm:text-[11px] font-bold"
                        title="Girar a vista previa"
                    >
                        <ChevronLeft size={14} /> <span className="hidden sm:inline">Girar</span>
                    </button>

                    <div className="flex items-center gap-1">
                        {[
                            { id: 'frontal', label: '🔍 Delantera', desc: 'Faros, Neblineros, Plumillas' },
                            { id: 'lateral', label: '🛻 Perfil / Lateral', desc: 'Ruedas, Extintor, Tacos' },
                            { id: 'posterior', label: '🔙 Trasera / Tolva', desc: 'Pestillos, Luces traseras, Cintas' }
                        ].map(vOpt => {
                            const countInAngle = selectedPartIds.filter(id => {
                                const p = allParts.find(x => x.id === id);
                                return (p?.viewAngle || 'lateral') === vOpt.id;
                            }).length;

                            return (
                                <button
                                    key={vOpt.id}
                                    type="button"
                                    onClick={() => setViewAngle(vOpt.id as any)}
                                    className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        viewAngle === vOpt.id
                                            ? 'bg-yellow-500 text-slate-900 shadow-sm ring-1 ring-yellow-400'
                                            : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <span>{vOpt.label}</span>
                                    {countInAngle > 0 && (
                                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                            {countInAngle}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={handleRotateNext}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors flex items-center gap-1 text-[10px] sm:text-[11px] font-bold"
                        title="Girar a siguiente vista"
                    >
                        <span className="hidden sm:inline">Girar</span> <ChevronRight size={14} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsCompactPoints(prev => !prev)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center gap-1 border border-slate-600"
                        title="Alternar tamaño de los puntos interactivos"
                    >
                        <span>{isCompactPoints ? '🔘 Puntos Micro' : '🔴 Puntos Grandes'}</span>
                    </button>
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-yellow-400 font-bold tracking-wide">
                        <RotateCw size={12} className="animate-spin-slow" />
                        <span>Giro 3D</span>
                    </div>
                </div>
            </div>

            {/* Filtro por Categorías / Cajones del formulario */}
            <div className="bg-slate-100/70 border-b border-slate-200 px-3 py-1 flex items-center gap-1 overflow-x-auto">
                <span className="text-[9px] font-black uppercase text-slate-400 shrink-0 mr-1">Cajón:</span>
                {[
                    { id: 'todos', label: 'Todos los Puntos' },
                    { id: 'seguridad', label: '🛡️ Seguridad (Extintor/Conos/Tacos/Kit/Cintas)' },
                    { id: 'neumaticos', label: '🛞 Neumáticos & Dirección' },
                    { id: 'cabina', label: '💺 Cabina & Mandos' },
                    { id: 'luces', label: '💡 Luces & Eléctrico' },
                    { id: 'fugas', label: '💧 Fugas de Fluido' },
                    { id: 'especifico', label: '⚙️ Específico (Tolva/Pestillos/Cisterna)' }
                ].map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors shrink-0 ${
                            selectedCategory === cat.id
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Ilustración SVG Interactiva del Vehículo según el ángulo de giro */}
            <div className="relative p-2 sm:p-3 flex items-center justify-center bg-gradient-to-b from-slate-50/70 to-slate-100/50">
                <div className="max-h-[200px] sm:max-h-[270px] w-full flex items-center justify-center">
                    {viewAngle === 'frontal' ? (
                        <FrontalVehicleSVG 
                            isCamioneta={isCamioneta}
                            type={normType}
                            parts={filteredParts}
                            selectedIds={selectedPartIds}
                            hasLeak={hasLeakSelected}
                            onTogglePart={togglePart}
                            isCompact={isCompactPoints}
                        />
                    ) : viewAngle === 'posterior' ? (
                        <PosteriorVehicleSVG 
                            isCamioneta={isCamioneta}
                            type={normType}
                            parts={filteredParts}
                            selectedIds={selectedPartIds}
                            hasLeak={hasLeakSelected}
                            onTogglePart={togglePart}
                            isCompact={isCompactPoints}
                        />
                    ) : isCamioneta ? (
                        <PickupTruckSVG 
                            parts={filteredParts} 
                            selectedIds={selectedPartIds} 
                            hasLeak={hasLeakSelected}
                            onTogglePart={togglePart}
                            isCompact={isCompactPoints}
                        />
                    ) : (
                        <HeavyTruckSVG 
                            type={normType}
                            parts={filteredParts} 
                            selectedIds={selectedPartIds} 
                            hasLeak={hasLeakSelected}
                            onTogglePart={togglePart}
                            isCompact={isCompactPoints}
                        />
                    )}
                </div>
            </div>

            {/* Resumen de Daños y Chips Rápidos compactos */}
            <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-white space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-yellow-600" />
                        <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-700 tracking-wide">
                            Puntos del Vehículo con Observación ({viewAngle.toUpperCase()})
                        </span>
                        <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                            selectedPartIds.length > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {selectedPartIds.length}
                        </span>
                    </div>

                    {selectedPartIds.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAllSelected}
                            className="text-[9px] sm:text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors"
                        >
                            Limpiar todo
                        </button>
                    )}
                </div>

                {/* Grid interactivo de puntos con defecto para tocar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {filteredParts.map(part => {
                        const isSelected = selectedPartIds.includes(part.id);
                        const Icon = part.icon;
                        return (
                            <button
                                key={part.id}
                                type="button"
                                onClick={() => togglePart(part)}
                                className={`text-left p-1.5 rounded-lg border transition-all flex items-start gap-1.5 select-none ${
                                    isSelected 
                                        ? 'bg-red-50 border-red-300 ring-1 ring-red-400 shadow-xs' 
                                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                                }`}
                            >
                                <div className={`p-1 rounded shrink-0 mt-0.5 ${
                                    isSelected ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    <Icon size={12} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className={`text-[10px] sm:text-[11px] font-black truncate leading-tight ${
                                            isSelected ? 'text-red-800' : 'text-slate-800'
                                        }`}>
                                            {part.name}
                                        </h4>
                                        <span className={`text-[8px] font-bold px-1 rounded uppercase shrink-0 ${
                                            isSelected ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {isSelected ? 'MALO' : 'OK'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.2">
                                        {part.issue}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// COMPONENTE HOTSPOT ESTÁTICO (NO SE DESLIZA)
// ==========================================
const getShortLabel = (part: VehicleDamagedPart): string => {
    const n = part.name.toLowerCase();
    if (n.includes('cono')) return 'Cono';
    if (n.includes('faro') || n.includes('luz') || n.includes('luces')) return 'Luces';
    if (n.includes('llanta') || n.includes('neumático')) return 'Llantas';
    if (n.includes('estribo')) return 'Estribos';
    if (n.includes('pestillo')) return 'Pestillos';
    if (n.includes('extintor')) return 'Extintor';
    if (n.includes('taco') || n.includes('cuña')) return 'Tacos';
    if (n.includes('cinta')) return 'Cintas';
    if (n.includes('botiqu')) return 'Botiquín';
    if (n.includes('antiderrame')) return 'Kit Derrame';
    if (n.includes('circulina')) return 'Circulina';
    if (n.includes('alarma')) return 'Alarma';
    if (n.includes('fuga')) return 'Fuga';
    if (n.includes('espejo')) return 'Espejos';
    if (n.includes('parabris') || n.includes('plumilla')) return 'Parabrisas';
    if (n.includes('cintur')) return 'Cinturón';
    if (n.includes('asiento')) return 'Asiento';
    if (n.includes('claxon') || n.includes('bocina')) return 'Claxon';
    if (n.includes('tolva') || n.includes('compuerta')) return 'Tolva';
    if (n.includes('tanque')) return 'Tanque';
    if (n.includes('motobomba')) return 'Bomba';
    if (n.includes('surtidor')) return 'Surtidor';
    if (n.includes('purga')) return 'Purga';
    if (n.includes('rampa')) return 'Rampas';
    if (n.includes('cuello')) return 'Tornamesa';
    if (n.includes('suspensi')) return 'Suspensión';
    if (n.includes('tim')) return 'Timón';
    if (n.includes('freno')) return 'Freno';
    if (n.includes('esparrago')) return 'Espárragos';
    return part.name.split(' ')[0];
};

const HotspotPoint = ({
    part,
    isSelected,
    onTogglePart,
    isCompact = true
}: {
    part: VehicleDamagedPart;
    isSelected: boolean;
    onTogglePart: (part: VehicleDamagedPart) => void;
    isCompact?: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const shortLabel = getShortLabel(part);

    // Dimensiones según el tamaño seleccionado
    const rClick = isCompact ? 16 : 22;
    const rOuter = isCompact ? 8.5 : 14;
    const rMain = isCompact ? 5.2 : 10;
    const rInner = isCompact ? 1.8 : 3.5;

    // Calcular posición óptima del tooltip para que nunca se salga del marco 360x230
    const isNearTop = part.hotspot.y < 26;
    const tooltipY = isNearTop ? part.hotspot.y + 15 : part.hotspot.y - 12;
    const boxW = Math.max(30, shortLabel.length * 6.2 + 8);

    return (
        <g 
            className="cursor-pointer select-none"
            onClick={() => onTogglePart(part)}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
        >
            {/* Área de toque invisible amplia para comodidad táctil en celular */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rClick} 
                fill="transparent" 
            />

            {/* Aro exterior de foco / hover */}
            {isSelected ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth={isCompact ? 1.8 : 2.5} 
                    strokeOpacity="0.8"
                />
            ) : isHovered ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth={isCompact ? 1.8 : 2.5} 
                    strokeOpacity="0.8"
                />
            ) : (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#eab308" 
                    strokeWidth={isCompact ? 1 : 1.5} 
                    strokeOpacity="0.25"
                />
            )}

            {/* Círculo central compacto */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rMain} 
                fill={isSelected ? '#dc2626' : (isHovered ? '#16a34a' : '#ffffff')} 
                stroke={isSelected ? '#b91c1c' : (isHovered ? '#15803d' : '#ca8a04')} 
                strokeWidth={isCompact ? 1.5 : 2} 
                className="filter drop-shadow-xs transition-colors duration-150"
            />

            {/* Núcleo central */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rInner} 
                fill={isSelected ? '#ffffff' : (isHovered ? '#ffffff' : '#eab308')} 
                className="transition-colors duration-150"
            />

            {/* TOOLTIP FLOTANTE: Visible exclusivamente al colocar el cursor o dedo por encima */}
            {isHovered && (
                <g 
                    className="pointer-events-none transition-all duration-150"
                    transform={`translate(${part.hotspot.x}, ${tooltipY})`}
                >
                    <rect 
                        x={-boxW / 2} 
                        y="-7.5" 
                        width={boxW} 
                        height="14" 
                        rx="3.5" 
                        fill={isSelected ? '#dc2626' : '#0f172a'} 
                        stroke={isSelected ? '#ffffff' : (isHovered ? '#22c55e' : '#475569')} 
                        strokeWidth="1" 
                    />
                    <text 
                        x="0" 
                        y="2.5" 
                        fill="#ffffff" 
                        fontSize="7.5" 
                        fontWeight="900" 
                        textAnchor="middle" 
                        letterSpacing="0.3"
                    >
                        {shortLabel}
                    </text>
                </g>
            )}
        </g>
    );
};

// ==========================================
// 1. SVG VISTA FRONTAL (DELANTERA)
// ==========================================
const FrontalVehicleSVG = ({
    isCamioneta,
    type,
    parts,
    selectedIds,
    hasLeak,
    onTogglePart,
    isCompact = true
}: {
    isCamioneta: boolean;
    type: string;
    parts: VehicleDamagedPart[];
    selectedIds: string[];
    hasLeak: boolean;
    onTogglePart: (part: VehicleDamagedPart) => void;
    isCompact?: boolean;
}) => {
    return (
        <svg 
            viewBox="0 0 360 230" 
            className="w-auto h-full max-h-[195px] sm:max-h-[265px] drop-shadow-sm select-none"
        >
            <defs>
                <linearGradient id="frontCabPaint" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="50%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                <linearGradient id="frontGrille" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                <pattern id="frontRefTape" width="16" height="10" patternUnits="userSpaceOnUse">
                    <rect width="8" height="10" fill="#dc2626" />
                    <rect x="8" width="8" height="10" fill="#ffffff" />
                </pattern>

                <radialGradient id="oilLeakFront" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#020617" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#1e1b4b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Sombra de la unidad en suelo */}
            <ellipse cx="180" cy="210" rx="150" ry="10" fill="#0f172a" opacity="0.2" />

            {/* Mancha de fuga activa bajo el motor frontal */}
            {hasLeak && (
                <g>
                    <ellipse cx="180" cy="210" rx="42" ry="7" fill="url(#oilLeakFront)" />
                    <circle cx="180" cy="198" r="2.5" fill="#020617" />
                    <text x="180" y="222" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.5">⚠️ FUGA FRONTAL ACTIVA</text>
                </g>
            )}

            {/* Ruedas delanteras vistas de frente */}
            <g transform="translate(62, 182)">
                <rect x="-14" y="-22" width="28" height="44" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                <line x1="-14" y1="-8" x2="14" y2="-8" stroke="#334155" strokeWidth="1" />
                <line x1="-14" y1="8" x2="14" y2="8" stroke="#334155" strokeWidth="1" />
            </g>
            <g transform="translate(298, 182)">
                <rect x="-14" y="-22" width="28" height="44" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                <line x1="-14" y1="-8" x2="14" y2="-8" stroke="#334155" strokeWidth="1" />
                <line x1="-14" y1="8" x2="14" y2="8" stroke="#334155" strokeWidth="1" />
            </g>

            {/* Cuerpo de cabina frontal */}
            <path 
                d="M 68 185 L 68 115 C 68 85 90 65 125 65 L 235 65 C 270 65 292 85 292 115 L 292 185 Z" 
                fill={isCamioneta ? "url(#frontCabPaint)" : "#f59e0b"} 
                stroke={isCamioneta ? "#64748b" : "#b45309"} 
                strokeWidth="2.5" 
            />

            {/* Parabrisas frontal panorámico */}
            <path 
                d="M 92 120 L 115 72 L 245 72 L 268 120 Z" 
                fill="#1e293b" 
                stroke="#475569" 
                strokeWidth="2" 
            />

            {/* Plumillas limpiaparabrisas */}
            <line x1="125" y1="116" x2="162" y2="90" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="195" y1="116" x2="232" y2="90" stroke="#cbd5e1" strokeWidth="2.5" />

            {/* Circulina de techo */}
            <rect x="168" y="50" width="24" height="12" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            <circle cx="180" cy="56" r="3" fill="#ffffff" />

            {/* Espejos retrovisores laterales */}
            <g transform="translate(36, 88)">
                <rect x="0" y="0" width="10" height="28" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="10" y1="14" x2="32" y2="14" stroke="#334155" strokeWidth="2" />
            </g>
            <g transform="translate(314, 88)">
                <rect x="0" y="0" width="10" height="28" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="0" y1="14" x2="-22" y2="14" stroke="#334155" strokeWidth="2" />
            </g>

            {/* Capot y Parrilla Delantera */}
            <rect x="110" y="130" width="140" height="36" rx="4" fill="url(#frontGrille)" stroke="#334155" strokeWidth="1.5" />
            <line x1="110" y1="142" x2="250" y2="142" stroke="#64748b" strokeWidth="1" />
            <line x1="110" y1="154" x2="250" y2="154" stroke="#64748b" strokeWidth="1" />
            <circle cx="180" cy="148" r="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />

            {/* Faros Delanteros Principales (Izquierdo y Derecho) */}
            <g transform="translate(76, 132)">
                <rect x="0" y="0" width="30" height="24" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <circle cx="15" cy="12" r="7" fill="#ffffff" />
            </g>
            <g transform="translate(254, 132)">
                <rect x="0" y="0" width="30" height="24" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <circle cx="15" cy="12" r="7" fill="#ffffff" />
            </g>

            {/* Parachoques delantero */}
            <rect x="64" y="166" width="232" height="22" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />

            {/* Faros Neblineros en Parachoques */}
            <circle cx="95" cy="177" r="8" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
            <circle cx="265" cy="177" r="8" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />

            {/* Cintas Reflectivas de Seguridad Delanteras 3M */}
            <rect x="120" y="172" width="120" height="10" rx="2" fill="url(#frontRefTape)" stroke="#991b1b" strokeWidth="1" />

            {/* Texto de vista */}
            <text x="180" y="202" fill="#64748b" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">VISTA FRONTAL (DELANTERA)</text>

            {/* Hotspots interactivos de vista frontal */}
            {parts.map((part) => (
                <HotspotPoint 
                    key={part.id} 
                    part={part} 
                    isSelected={selectedIds.includes(part.id)} 
                    onTogglePart={onTogglePart} 
                    isCompact={isCompact}
                />
            ))}
        </svg>
    );
};

// ==========================================
// 2. SVG VISTA POSTERIOR (TRASERA)
// Con Pestillos de Tolva de Volquete, Luces Traseras y Cintas 3M
// ==========================================
const PosteriorVehicleSVG = ({
    isCamioneta,
    type,
    parts,
    selectedIds,
    hasLeak,
    onTogglePart,
    isCompact = true
}: {
    isCamioneta: boolean;
    type: string;
    parts: VehicleDamagedPart[];
    selectedIds: string[];
    hasLeak: boolean;
    onTogglePart: (part: VehicleDamagedPart) => void;
    isCompact?: boolean;
}) => {
    const isVolquete = type.includes('Volquete');
    const isWater = type.includes('Agua');
    const isFuel = type.includes('Combustible');
    const isCamaBaja = type.includes('Cama Baja') || type.includes('Semiremolque');

    return (
        <svg 
            viewBox="0 0 360 230" 
            className="w-auto h-full max-h-[195px] sm:max-h-[265px] drop-shadow-sm select-none"
        >
            <defs>
                <pattern id="postRefTape" width="16" height="10" patternUnits="userSpaceOnUse">
                    <rect width="8" height="10" fill="#dc2626" />
                    <rect x="8" width="8" height="10" fill="#ffffff" />
                </pattern>

                <linearGradient id="tankPosterior" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
            </defs>

            {/* Sombra de la unidad en suelo */}
            <ellipse cx="180" cy="210" rx="150" ry="10" fill="#0f172a" opacity="0.2" />

            {/* Tacos de bloqueo amarillos en suelo */}
            <g transform="translate(125, 192)">
                <polygon points="0,15 18,15 14,0 4,0" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
            </g>

            {/* Ruedas duales traseras vistas de atrás */}
            <g transform="translate(60, 180)">
                <rect x="-18" y="-22" width="16" height="44" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                <rect x="2" y="-22" width="16" height="44" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            </g>
            <g transform="translate(300, 180)">
                <rect x="-18" y="-22" width="16" height="44" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                <rect x="2" y="-22" width="16" height="44" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            </g>

            {/* CARROCERÍA POSTERIOR SEGÚN VEHÍCULO */}
            {isVolquete ? (
                /* TOLVA DE VOLQUETE - VISTA POSTERIOR */
                <g>
                    {/* Tolva trapezoidal */}
                    <polygon points="65,60 295,60 270,165 90,165" fill="#cbd5e1" stroke="#475569" strokeWidth="2.5" />
                    {/* Compuerta abatible central */}
                    <rect x="95" y="70" width="170" height="90" rx="4" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
                    <text x="180" y="105" fill="#1e293b" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="2">VOLQUETE</text>

                    {/* PESTILLOS Y ALDABAS DE COMPUERTA POSTERIOR */}
                    {/* Pestillo Izquierdo */}
                    <g transform="translate(100, 130)">
                        <rect x="0" y="0" width="12" height="24" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                        <circle cx="6" cy="12" r="3" fill="#713f12" />
                        <line x1="-3" y1="12" x2="15" y2="12" stroke="#713f12" strokeWidth="2" />
                    </g>
                    {/* Pestillo Derecho */}
                    <g transform="translate(248, 130)">
                        <rect x="0" y="0" width="12" height="24" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                        <circle cx="6" cy="12" r="3" fill="#713f12" />
                        <line x1="-3" y1="12" x2="15" y2="12" stroke="#713f12" strokeWidth="2" />
                    </g>

                    <rect x="135" y="125" width="90" height="20" rx="3" fill="#1e293b" />
                    <text x="180" y="139" fill="#fef08a" fontSize="9" fontWeight="900" textAnchor="middle">COMPUERTA TOLVA</text>
                </g>
            ) : isWater || isFuel ? (
                /* CISTERNA DE AGUA O COMBUSTIBLE - VISTA POSTERIOR */
                <g>
                    <ellipse cx="180" cy="105" rx="98" ry="62" fill="url(#tankPosterior)" stroke={isFuel ? '#dc2626' : '#0284c7'} strokeWidth="3" />
                    <text x="180" y="92" fill="#334155" fontSize="11" fontWeight="900" textAnchor="middle">
                        {isFuel ? 'CISTERNA COMBUSTIBLE' : 'CISTERNA DE AGUA'}
                    </text>
                    {/* Válvula de purga/descarga */}
                    <circle cx="180" cy="140" r="14" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                    <circle cx="180" cy="140" r="7" fill="#eab308" />
                    {/* Rombo NFPA posterior */}
                    <g transform="translate(180, 65) rotate(45)">
                        <rect x="-9" y="-9" width="18" height="18" fill={isFuel ? '#ef4444' : '#0284c7'} stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                </g>
            ) : isCamaBaja ? (
                /* CAMIÓN REMOLQUE CAMA BAJA - VISTA TRASERA */
                <g>
                    <rect x="75" y="115" width="210" height="48" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                    <text x="180" y="145" fill="#713f12" fontSize="11" fontWeight="900" textAnchor="middle">CAMA BAJA</text>
                    {/* Rampa izquierda */}
                    <polygon points="90,90 125,90 120,165 85,165" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                    {/* Rampa derecha */}
                    <polygon points="235,90 270,90 275,165 240,165" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                </g>
            ) : isCamioneta ? (
                /* CAMIONETA PICKUP - VISTA TRASERA */
                <g>
                    <rect x="75" y="90" width="210" height="75" rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                    <rect x="160" y="105" width="40" height="10" rx="2" fill="#1e293b" />
                    <text x="180" y="145" fill="#475569" fontSize="12" fontWeight="900" textAnchor="middle">4x4 PICKUP</text>
                </g>
            ) : (
                /* CAMIÓN BARANDA */
                <g>
                    <rect x="75" y="85" width="210" height="80" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                    <line x1="75" y1="110" x2="285" y2="110" stroke="#334155" strokeWidth="2" />
                    <line x1="75" y1="135" x2="285" y2="135" stroke="#334155" strokeWidth="2" />
                    <text x="180" y="125" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">CAMIÓN BARANDA</text>
                </g>
            )}

            {/* Parachoques trasero común */}
            <rect x="65" y="165" width="230" height="22" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />

            {/* Luces posteriores rojas (Izquierda y Derecha) */}
            <g transform="translate(68, 145)">
                <rect x="0" y="0" width="20" height="24" rx="3" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                <circle cx="10" cy="8" r="4" fill="#fde047" />
                <circle cx="10" cy="16" r="4" fill="#ffffff" />
            </g>
            <g transform="translate(272, 145)">
                <rect x="0" y="0" width="20" height="24" rx="3" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                <circle cx="10" cy="8" r="4" fill="#fde047" />
                <circle cx="10" cy="16" r="4" fill="#ffffff" />
            </g>

            {/* Cintas Reflectivas de Seguridad 3M Posteriores */}
            <rect x="95" y="168" width="170" height="10" rx="2" fill="url(#postRefTape)" stroke="#991b1b" strokeWidth="1" />

            {/* Alarma de Retroceso Acústica Posterior */}
            <g transform="translate(225, 176)">
                <rect x="0" y="0" width="10" height="9" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                <path d="M 2 4.5 L 6 2 L 6 7 Z" fill="#f59e0b" />
            </g>

            {/* Texto de vista */}
            <text x="180" y="202" fill="#64748b" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">VISTA POSTERIOR (TRASERA)</text>

            {/* Hotspots interactivos de vista posterior */}
            {parts.map((part) => (
                <HotspotPoint 
                    key={part.id} 
                    part={part} 
                    isSelected={selectedIds.includes(part.id)} 
                    onTogglePart={onTogglePart} 
                    isCompact={isCompact}
                />
            ))}
        </svg>
    );
};

// ==========================================
// 3. SVG VISTA LATERAL (CAMIONETA PICKUP)
// ==========================================
const PickupTruckSVG = ({
    parts,
    selectedIds,
    hasLeak,
    onTogglePart,
    isCompact = true
}: {
    parts: VehicleDamagedPart[];
    selectedIds: string[];
    hasLeak: boolean;
    onTogglePart: (part: VehicleDamagedPart) => void;
    isCompact?: boolean;
}) => {
    return (
        <svg 
            viewBox="0 0 360 230" 
            className="w-auto h-full max-h-[195px] sm:max-h-[265px] drop-shadow-sm select-none"
        >
            <defs>
                <linearGradient id="bodyPaint" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="35%" stopColor="#f8fafc" />
                    <stop offset="70%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                <linearGradient id="windowTint" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                <pattern id="sideRefTape" width="16" height="8" patternUnits="userSpaceOnUse">
                    <rect width="8" height="8" fill="#dc2626" />
                    <rect x="8" width="8" height="8" fill="#ffffff" />
                </pattern>

                <radialGradient id="oilLeak" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#020617" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#1e1b4b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Sombra de la camioneta */}
            <ellipse cx="180" cy="208" rx="160" ry="10" fill="#0f172a" opacity="0.18" />

            {/* MANCHA DE FUGA DE FLUIDO BAJO EL MOTOR */}
            {hasLeak && (
                <g>
                    <ellipse cx="120" cy="209" rx="42" ry="7" fill="url(#oilLeak)" />
                    <circle cx="110" cy="195" r="2.5" fill="#0f172a" />
                    <text x="120" y="222" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.5">⚠️ FUGA DE FLUIDO ACTIVA</text>
                </g>
            )}

            {/* 2 TACOS DE BLOQUEO AMARILLOS */}
            <g transform="translate(245, 192)">
                <polygon points="0,15 18,15 14,0 4,0" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
            </g>

            {/* CHASIS / ESTRIBOS */}
            <rect x="50" y="172" width="255" height="12" rx="4" fill="#1e293b" />
            <rect x="95" y="178" width="115" height="4" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1" />

            {/* CARROCERÍA PICKUP */}
            <path 
                d="M 20 162 L 20 142 C 20 135 30 130 50 128 L 85 125 L 120 85 C 128 78 135 78 185 78 L 225 78 L 225 125 L 340 128 C 345 128 348 132 348 138 L 348 165 C 348 168 344 170 338 170 L 305 170 C 300 152 265 152 260 170 L 105 170 C 100 152 65 152 60 170 L 25 170 C 22 170 20 166 20 162 Z" 
                fill="url(#bodyPaint)" 
                stroke="#64748b" 
                strokeWidth="2" 
            />

            {/* Cintas Reflectivas Laterales 3M */}
            <rect x="75" y="152" width="245" height="5" rx="1.5" fill="url(#sideRefTape)" stroke="#991b1b" strokeWidth="0.5" />

            {/* VENTANAS DOBLE CABINA */}
            <path d="M 125 86 L 142 86 L 142 120 L 96 120 Z" fill="url(#windowTint)" stroke="#64748b" strokeWidth="1.5" />
            <path d="M 148 86 L 198 86 L 198 120 L 148 120 Z" fill="url(#windowTint)" stroke="#64748b" strokeWidth="1.5" />
            <path d="M 203 88 L 218 88 L 218 120 L 203 120 Z" fill="url(#windowTint)" stroke="#64748b" strokeWidth="1.5" />

            {/* BOTIQUÍN EN CABINA */}
            <g transform="translate(165, 102)">
                <rect x="0" y="0" width="14" height="12" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
                <rect x="5.5" y="2.5" width="3" height="7" fill="#ef4444" />
                <rect x="3.5" y="4.5" width="7" height="3" fill="#ef4444" />
            </g>

            {/* EXTINTOR MONTADO EN TOLVA */}
            <g transform="translate(228, 95)">
                <rect x="0" y="0" width="8" height="24" rx="3" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                <rect x="2" y="-3" width="4" height="3" fill="#475569" />
            </g>

            {/* 2 CONOS DE SEGURIDAD EN TOLVA */}
            <g transform="translate(295, 98)">
                <polygon points="4,24 16,24 11,4 9,4" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
                <rect x="6" y="11" width="8" height="3.5" fill="#ffffff" />
            </g>

            {/* KIT ANTIDERRAME EN TOLVA */}
            <g transform="translate(268, 105)">
                <rect x="0" y="0" width="16" height="16" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="8" cy="8" r="3" fill="#1e293b" />
            </g>

            {/* CIRCULINA DE TECHO */}
            <g transform="translate(168, 68)">
                <rect x="0" y="0" width="18" height="9" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            </g>

            {/* FAROS DELANTEROS Y POSTERIORES */}
            <polygon points="20,138 28,136 28,150 20,154" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
            <rect x="343" y="132" width="5" height="18" rx="1.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />

            {/* RUEDA DELANTERA */}
            <g transform="translate(82, 170)">
                <circle cx="0" cy="0" r="23" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="13" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="5" fill="#0f172a" />
            </g>

            {/* RUEDA POSTERIOR */}
            <g transform="translate(285, 170)">
                <circle cx="0" cy="0" r="23" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="13" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="5" fill="#0f172a" />
            </g>

            {/* Texto de vista */}
            <text x="180" y="202" fill="#64748b" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">VISTA LATERAL (PERFIL)</text>

            {/* Hotspots interactivos de vista lateral */}
            {parts.map((part) => (
                <HotspotPoint 
                    key={part.id} 
                    part={part} 
                    isSelected={selectedIds.includes(part.id)} 
                    onTogglePart={onTogglePart} 
                    isCompact={isCompact}
                />
            ))}
        </svg>
    );
};

// ==========================================
// 4. SVG VISTA LATERAL (CAMIÓN PESADO)
// Cisterna, Volquete, Cama Baja, Baranda
// ==========================================
const HeavyTruckSVG = ({
    type,
    parts,
    selectedIds,
    hasLeak,
    onTogglePart,
    isCompact = true
}: {
    type: string;
    parts: VehicleDamagedPart[];
    selectedIds: string[];
    hasLeak: boolean;
    onTogglePart: (part: VehicleDamagedPart) => void;
    isCompact?: boolean;
}) => {
    const isWater = type.includes('Agua');
    const isFuel = type.includes('Combustible');
    const isVolquete = type.includes('Volquete');
    const isCamaBaja = type.includes('Cama Baja') || type.includes('Semiremolque');

    return (
        <svg 
            viewBox="0 0 360 230" 
            className="w-auto h-full max-h-[195px] sm:max-h-[265px] drop-shadow-sm select-none"
        >
            <defs>
                <linearGradient id="heavyCab" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="60%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                <linearGradient id="tankBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                <pattern id="heavyRefTape" width="16" height="8" patternUnits="userSpaceOnUse">
                    <rect width="8" height="8" fill="#dc2626" />
                    <rect x="8" width="8" height="8" fill="#ffffff" />
                </pattern>

                <radialGradient id="oilLeakHeavy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#020617" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#1e1b4b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Sombra */}
            <ellipse cx="180" cy="208" rx="160" ry="10" fill="#0f172a" opacity="0.2" />

            {/* MANCHA DE FUGA ACTIVA EN EL SUELO */}
            {hasLeak && (
                <g>
                    <ellipse cx="105" cy="209" rx="45" ry="7" fill="url(#oilLeakHeavy)" />
                    <circle cx="105" cy="196" r="3" fill="#020617" />
                    <text x="105" y="222" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.5">⚠️ FUGA DE FLUIDO ACTIVA</text>
                </g>
            )}

            {/* Tacos pesados en suelo */}
            <g transform="translate(280, 192)">
                <polygon points="0,15 22,15 16,0 6,0" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
            </g>

            {/* Chasis de camión */}
            <rect x="40" y="165" width="295" height="14" rx="3" fill="#1e293b" />

            {/* CABINA DEL CAMIÓN */}
            <path 
                d="M 35 165 L 35 95 C 35 90 42 85 50 85 L 105 85 C 110 85 115 90 115 95 L 115 165 Z" 
                fill="url(#heavyCab)" 
                stroke="#b45309" 
                strokeWidth="2" 
            />
            {/* Parabrisas */}
            <rect x="42" y="92" width="65" height="30" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            {/* Circulina */}
            <rect x="70" y="78" width="15" height="7" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            {/* Parrilla delantera frontal */}
            <g transform="translate(32, 126)">
                <rect x="0" y="0" width="5" height="30" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <line x1="1" y1="6" x2="4" y2="6" stroke="#94a3b8" strokeWidth="1" />
                <line x1="1" y1="12" x2="4" y2="12" stroke="#94a3b8" strokeWidth="1" />
                <line x1="1" y1="18" x2="4" y2="18" stroke="#94a3b8" strokeWidth="1" />
                <line x1="1" y1="24" x2="4" y2="24" stroke="#94a3b8" strokeWidth="1" />
            </g>
            {/* Faros delanteros con haz de luz */}
            <g transform="translate(34, 142)">
                <rect x="0" y="0" width="8" height="15" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
                <circle cx="4" cy="7.5" r="3.5" fill="#ffffff" />
                <polygon points="0,7.5 -16,0 -16,15" fill="#fef08a" opacity="0.2" />
            </g>
            {/* Espejo exterior */}
            <rect x="28" y="100" width="4" height="18" rx="1.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
            <line x1="32" y1="108" x2="36" y2="108" stroke="#334155" strokeWidth="1.5" />
            {/* Estribos de acceso */}
            <line x1="40" y1="168" x2="65" y2="168" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="40" y1="173" x2="65" y2="173" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Luces posteriores rojas y alarma de retroceso */}
            <rect x="333" y="142" width="5" height="12" rx="1" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <g transform="translate(338, 166)">
                <rect x="0" y="0" width="9" height="9" rx="1.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                <path d="M 2 4.5 L 5 2 L 5 7 Z" fill="#f59e0b" />
            </g>

            {/* BOTIQUÍN EN CABINA */}
            <g transform="translate(75, 128)">
                <rect x="0" y="0" width="14" height="12" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
                <rect x="5.5" y="2.5" width="3" height="7" fill="#ef4444" />
                <rect x="3.5" y="4.5" width="7" height="3" fill="#ef4444" />
            </g>

            {/* Cintas Reflectivas Laterales 3M */}
            <rect x="40" y="163" width="290" height="4.5" rx="1" fill="url(#heavyRefTape)" stroke="#991b1b" strokeWidth="0.5" />

            {/* CARROCERÍA POSTERIOR CON NOMBRE ROTULADO */}
            {isWater ? (
                /* CISTERNA DE AGUA */
                <g transform="translate(125, 75)">
                    <rect x="0" y="0" width="205" height="90" rx="42" fill="url(#tankBody)" stroke="#0284c7" strokeWidth="2.5" />
                    <rect x="25" y="32" width="155" height="26" fill="#0284c7" rx="4" />
                    <text x="102" y="49" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">CISTERNA DE AGUA</text>
                    <line x1="25" y1="0" x2="25" y2="90" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="180" y1="0" x2="180" y2="90" stroke="#94a3b8" strokeWidth="2" />
                </g>
            ) : isFuel ? (
                /* CISTERNA DE COMBUSTIBLE */
                <g transform="translate(125, 75)">
                    <rect x="0" y="0" width="205" height="90" rx="42" fill="url(#tankBody)" stroke="#dc2626" strokeWidth="2.5" />
                    <rect x="25" y="32" width="155" height="26" fill="#dc2626" rx="4" />
                    <text x="102" y="49" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.8">CISTERNA DE COMBUSTIBLE</text>
                    <line x1="25" y1="0" x2="25" y2="90" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="180" y1="0" x2="180" y2="90" stroke="#94a3b8" strokeWidth="2" />
                    <g transform="translate(35, 12) rotate(45)">
                        <rect x="0" y="0" width="16" height="16" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                    </g>
                </g>
            ) : isVolquete ? (
                /* TOLVA DE VOLQUETE */
                <g transform="translate(125, 60)">
                    <polygon points="0,40 15,105 210,105 215,20 15,20" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
                    <rect x="25" y="60" width="14" height="40" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
                    <line x1="210" y1="20" x2="205" y2="105" stroke="#334155" strokeWidth="4" />
                    <text x="110" y="65" fill="#334155" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1">VOLQUETE</text>
                    {/* Pin y seguro de tolva posterior */}
                    <circle cx="205" cy="100" r="5" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                    <line x1="201" y1="96" x2="209" y2="104" stroke="#713f12" strokeWidth="1.5" />
                </g>
            ) : isCamaBaja ? (
                /* CAMIÓN REMOLQUE CAMA BAJA */
                <g transform="translate(115, 115)">
                    <path d="M 0 50 L 25 15 L 45 15 L 45 50 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                    <rect x="40" y="42" width="155" height="15" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                    <text x="115" y="53" fill="#713f12" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">CAMA BAJA</text>
                    <polygon points="240,25 248,25 258,60 250,60" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
                </g>
            ) : (
                /* CAMIÓN BARANDA */
                <g transform="translate(125, 90)">
                    <rect x="0" y="0" width="210" height="75" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                    <line x1="0" y1="25" x2="210" y2="25" stroke="#334155" strokeWidth="2" />
                    <line x1="0" y1="50" x2="210" y2="50" stroke="#334155" strokeWidth="2" />
                    <text x="105" y="42" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">CAMIÓN BARANDA</text>
                </g>
            )}

            {/* EXTINTOR MONTADO CON MANÓMETRO Y MANGUERA */}
            <g transform="translate(118, 116)">
                <rect x="0" y="0" width="8" height="24" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                <rect x="2" y="-4" width="4" height="4" fill="#475569" />
                <circle cx="6" cy="-2" r="1.5" fill="#ffffff" stroke="#1e293b" strokeWidth="0.5" />
                <circle cx="6" cy="-2" r="0.7" fill="#22c55e" />
                <path d="M 2 -2 Q -1 3 0 14" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="1.5" y="10" width="5" height="7" rx="0.5" fill="#ffffff" opacity="0.9" />
            </g>

            {/* 2 CONOS DE SEGURIDAD INDUSTRIALES CON BANDAS REFLECTIVAS */}
            <g transform="translate(302, 122)">
                <g transform="translate(6, 0) scale(0.85)">
                    <polygon points="4,22 14,22 10,3 8,3" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
                    <polygon points="6,12 12,12 11,8 7,8" fill="#ffffff" />
                    <rect x="2" y="21" width="14" height="3" fill="#1e293b" />
                </g>
                <polygon points="4,24 16,24 11,3 9,3" fill="#f97316" stroke="#ea580c" strokeWidth="1.2" />
                <polygon points="7.2,14 12.8,14 11.8,9 8.2,9" fill="#ffffff" />
                <rect x="2" y="23" width="16" height="3.5" rx="1" fill="#0f172a" />
            </g>

            {/* KIT ANTIDERRAME AMARILLO (TAMBOR / BIDÓN ROTULADO) */}
            <g transform="translate(133, 142)">
                <rect x="0" y="4" width="18" height="18" rx="2.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                <rect x="-1" y="1" width="20" height="3.5" rx="1" fill="#1e293b" />
                <rect x="2" y="9" width="14" height="8" rx="0.8" fill="#ffffff" opacity="0.9" />
                <text x="9" y="14" fill="#0f172a" fontSize="3.8" fontWeight="900" textAnchor="middle">KIT</text>
            </g>

            {/* RUEDA DELANTERA */}
            <g transform="translate(75, 180)">
                <circle cx="0" cy="0" r="26" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
                <circle cx="0" cy="0" r="15" fill="#64748b" stroke="#334155" strokeWidth="2" />
                <circle cx="0" cy="0" r="6" fill="#0f172a" />
            </g>

            {/* RUEDAS TRASERAS DUALES */}
            <g transform="translate(235, 180)">
                <circle cx="0" cy="0" r="26" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
                <circle cx="0" cy="0" r="15" fill="#64748b" stroke="#334155" strokeWidth="2" />
            </g>
            <g transform="translate(290, 180)">
                <circle cx="0" cy="0" r="26" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
                <circle cx="0" cy="0" r="15" fill="#64748b" stroke="#334155" strokeWidth="2" />
            </g>

            {/* Texto de vista */}
            <text x="180" y="202" fill="#64748b" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">VISTA LATERAL (PERFIL)</text>

            {/* PUNTOS INTERACTIVOS (HOTSPOTS) */}
            {parts.map((part) => (
                <HotspotPoint 
                    key={part.id} 
                    part={part} 
                    isSelected={selectedIds.includes(part.id)} 
                    onTogglePart={onTogglePart} 
                    isCompact={isCompact}
                />
            ))}
        </svg>
    );
};

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
