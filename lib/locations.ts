export const DEFAULT_WORKSPACES: string[] = [
    'Red Vial 6',
    'Longitudinal tramo 4'
];

export const DEFAULT_LOCATIONS_BY_PROJECT: Record<string, string[]> = {
    'Red Vial 6': [
        "PAD Chinchaysullo",
        "PAD San Clemente",
        "San Marino",
        "ZI Pisco Lado A Chancadora",
        "ZI Pisco Lado B Campamento",
        "Cantera Mata gente",
        "Cantera Rio Pisco",
        "DME Camacho",
        "DME IV Pisco",
        "Cañete",
        "Peaje Jahuay",
        "Mant. Periodico",
        "Mant. Rutinario"
    ],
    'Longitudinal tramo 4': [
        "Tramo 4 - Frente Huancayo",
        "Tramo 4 - Frente Ayacucho",
        "Tramo 4 - Frente Huancavelica",
        "Campamento Central Tramo 4",
        "Cantera Tramo 4",
        "DME Tramo 4",
        "Planta de Asfalto Tramo 4"
    ]
};

// Fallback plano para retrocompatibilidad
export const SSOMA_LOCATIONS: string[] = [
    ...DEFAULT_LOCATIONS_BY_PROJECT['Red Vial 6'],
    ...DEFAULT_LOCATIONS_BY_PROJECT['Longitudinal tramo 4']
];

/**
 * Obtiene los lugares de un proyecto determinado leyendo de localStorage (personalizado) o del default
 */
export function getLocationsForWorkspace(workspace: string): string[] {
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(`ssoma_zones_${workspace}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
    }
    return DEFAULT_LOCATIONS_BY_PROJECT[workspace] || [
        `${workspace} - Zona Principal`,
        `${workspace} - Campamento`,
        `${workspace} - Frente de Trabajo`
    ];
}

/**
 * Guarda los lugares para un proyecto específico
 */
export function saveLocationsForWorkspace(workspace: string, locations: string[]): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(`ssoma_zones_${workspace}`, JSON.stringify(locations));
        // Disparar evento para que componentes reactivos se enteren
        window.dispatchEvent(new Event('ssoma_locations_updated'));
    }
}

/**
 * Obtiene la lista de proyectos registrados
 */
export function getAvailableWorkspaces(): string[] {
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('ssoma_available_workspaces');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
    }
    return DEFAULT_WORKSPACES;
}

/**
 * Agrega un nuevo proyecto
 */
export function addAvailableWorkspace(newWs: string): string[] {
    const current = getAvailableWorkspaces();
    if (!current.includes(newWs.trim())) {
        const updated = [...current, newWs.trim()];
        if (typeof window !== 'undefined') {
            localStorage.setItem('ssoma_available_workspaces', JSON.stringify(updated));
            window.dispatchEvent(new Event('ssoma_workspaces_updated'));
        }
        return updated;
    }
    return current;
}
