import { NextRequest } from 'next/server';

/**
 * Extrae el espacio de trabajo activo de una solicitud API
 * Prioridad:
 * 1. Query param ?workspace=...
 * 2. Cookie 'ssoma_workspace'
 * 3. Header 'cookie'
 * 4. Por defecto: 'Red Vial 6'
 */
export function getRequestWorkspace(req?: NextRequest | Request | null): string {
    if (!req) return 'Red Vial 6';

    try {
        if ('nextUrl' in req && req.nextUrl?.searchParams) {
            const param = req.nextUrl.searchParams.get('workspace');
            if (param && param.trim()) return param.trim();
        }

        if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
            const cookieVal = (req as any).cookies.get('ssoma_workspace')?.value;
            if (cookieVal) return decodeURIComponent(cookieVal).trim();
        }

        const cookieHeader = req.headers?.get('cookie') || '';
        const match = cookieHeader.match(/ssoma_workspace=([^;]+)/);
        if (match && match[1]) {
            return decodeURIComponent(match[1]).trim();
        }
    } catch (e) {
        console.warn('Error reading workspace from request:', e);
    }

    return 'Red Vial 6';
}
