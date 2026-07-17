"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function ActivityTracker() {
    const pathname = usePathname();
    const { user } = useAuth();
    const lastPath = useRef<string>('');

    useEffect(() => {
        if (!user || !user.name) return;
        if (pathname === lastPath.current) return;
        
        lastPath.current = pathname;

        // Skip tracking if they just log in or are at root to avoid noise? 
        // Actually, let's track everything to give the full picture requested.
        let moduleName = 'Dashboard';
        if (pathname.includes('/inspections')) moduleName = 'Inspecciones';
        else if (pathname.includes('/auditoria')) moduleName = 'Auditoría';
        else if (pathname.includes('/brigadistas')) moduleName = 'Brigadistas';
        else if (pathname.includes('/registros')) moduleName = 'Registros';
        else if (pathname.includes('/epp')) moduleName = 'EPP';
        else if (pathname.includes('/simulacro')) moduleName = 'Simulacros';
        else if (pathname.includes('/reporte-ac')) moduleName = 'Reporte AC';
        else if (pathname.includes('/pma')) moduleName = 'PMA';
        else if (pathname.includes('/risstma')) moduleName = 'RISSTMA';
        else if (pathname.includes('/ats')) moduleName = 'ATS';
        else if (pathname.includes('/petar')) moduleName = 'PETAR';
        else if (pathname.includes('/sctr')) moduleName = 'SCTR';
        else if (pathname.includes('/monitoreos')) moduleName = 'Monitoreos';
        else if (pathname.includes('/residuos')) moduleName = 'Residuos';
        else if (pathname.includes('/manifiesto')) moduleName = 'Manifiestos';
        else if (pathname.includes('/formacion-virtual')) moduleName = 'Formación Virtual';

        // Call the endpoint silently
        fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: user.name,
                action: 'VISITA',
                module: moduleName,
                details: `Ruta: ${pathname}`
            })
        }).catch(err => console.error("Error tracking activity:", err));

    }, [pathname, user]);

    return null; // Invisible component
}
