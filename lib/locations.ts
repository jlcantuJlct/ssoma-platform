// === START_MASTER_LOCATIONS ===
export const DEFAULT_WORKSPACES: string[] = [
    "Red Vial 6",
    "Longitudinal tramo 4"
];

export const DEFAULT_LOCATIONS_BY_PROJECT: Record<string, string[]> = {
    "Red Vial 6": [
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
    "Longitudinal tramo 4": [
        "Cantera Humay",
        "Cantera Huancano",
        "Acopio Humay",
        "Acopio Huancano",
        "CAP SEAL",
        "FOGSEAL"
    ]
};
// === END_MASTER_LOCATIONS ===

const RED_VIAL_6_EXCLUSIVE = new Set(DEFAULT_LOCATIONS_BY_PROJECT["Red Vial 6"] || []);

/**
 * Obtiene el proyecto activo del usuario actual desde localStorage o cookie
 */
export function getActiveWorkspace(): string {
    if (typeof window !== 'undefined') {
        try {
            const storedUser = localStorage.getItem('ssoma_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed && parsed.workspace) {
                    return parsed.workspace;
                }
            }
            const match = document.cookie.match(/(?:^|;\s*)ssoma_workspace=([^;]*)/);
            if (match && match[1]) {
                return decodeURIComponent(match[1]);
            }
        } catch (e) {}
    }
    return 'Red Vial 6';
}

/**
 * Obtiene la Ubicación / Dirección geográfica del proyecto activo
 */
export function getActiveProjectLocation(workspace?: string): string {
    const ws = (workspace || getActiveWorkspace()).toLowerCase();
    if (ws.includes('longitudinal')) {
        return 'Pisco a Ayacucho';
    }
    return 'Lima - Ica';
}

/**
 * Obtiene los lugares de un proyecto determinado leyendo de localStorage (personalizado) o del default
 */
export function getLocationsForWorkspace(workspace?: string): string[] {
    const targetWs = workspace || getActiveWorkspace();
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(`ssoma_zones_${targetWs}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Si no es Red Vial 6, asegurar que nunca se filtren lugares exclusivos de Red Vial 6
                    if (targetWs !== 'Red Vial 6') {
                        const cleaned = parsed.filter((loc: string) => !RED_VIAL_6_EXCLUSIVE.has(loc));
                        if (cleaned.length > 0) return cleaned;
                    } else {
                        return parsed;
                    }
                }
            }
        } catch (e) {}
    }
    return DEFAULT_LOCATIONS_BY_PROJECT[targetWs] || [
        `${targetWs} - Zona Principal`,
        `${targetWs} - Campamento`,
        `${targetWs} - Frente de Trabajo`
    ];
}

/**
 * Proxy dinámico para que cualquier componente que importe SSOMA_LOCATIONS
 * reciba automáticamente SOLO los lugares del proyecto activo actual
 */
export const SSOMA_LOCATIONS: string[] = new Proxy([] as string[], {
    get(_target, prop) {
        const arr = getLocationsForWorkspace(getActiveWorkspace());
        if (prop === 'sort' || prop === 'reverse' || prop === 'splice') {
            return (...args: any[]) => ([...arr] as any)[prop](...args);
        }
        const val = Reflect.get(arr, prop, arr);
        return typeof val === 'function' ? val.bind(arr) : val;
    },
    has(_target, prop) {
        return Reflect.has(getLocationsForWorkspace(getActiveWorkspace()), prop);
    },
    ownKeys() {
        return Reflect.ownKeys(getLocationsForWorkspace(getActiveWorkspace()));
    },
    getOwnPropertyDescriptor(_target, prop) {
        const arr = getLocationsForWorkspace(getActiveWorkspace());
        if (prop === 'length') {
            return { value: arr.length, writable: true, enumerable: false, configurable: false };
        }
        const desc = Object.getOwnPropertyDescriptor(arr, prop);
        if (desc) desc.configurable = true;
        return desc;
    }
});

/**
 * Recopila la configuración actual de proyectos, lugares y usuarios desde localStorage
 */
export function getMasterLocationsPayload(): { workspaces: string[]; locationsByProject: Record<string, string[]>; usersDb?: Record<string, any> } {
    const workspaces = getAvailableWorkspaces();
    const locationsByProject: Record<string, string[]> = {};
    workspaces.forEach(ws => {
        locationsByProject[ws] = getLocationsForWorkspace(ws);
    });
    let usersDb: Record<string, any> | undefined = undefined;
    if (typeof window !== 'undefined') {
        try {
            const storedUsers = localStorage.getItem('ssoma_users_db');
            if (storedUsers) {
                usersDb = JSON.parse(storedUsers);
            }
        } catch (e) {}
    }
    return { workspaces, locationsByProject, usersDb };
}

/**
 * Sincroniza los lugares y proyectos personalizados hacia el archivo fuente (desarrollo)
 */
export async function syncMasterLocationsToServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
        const payload = getMasterLocationsPayload();
        await fetch('/api/master-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {}
}

/**
 * Guarda los lugares para un proyecto específico
 */
export function saveLocationsForWorkspace(workspace: string, locations: string[]): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(`ssoma_zones_${workspace}`, JSON.stringify(locations));
        window.dispatchEvent(new Event('ssoma_locations_updated'));
        syncMasterLocationsToServer();
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
            syncMasterLocationsToServer();
        }
        return updated;
    }
    return current;
}
