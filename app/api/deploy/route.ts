import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { DEFAULT_WORKSPACES, DEFAULT_LOCATIONS_BY_PROJECT } from '@/lib/locations';

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
    // Solo permitir en entorno de desarrollo
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ success: false, error: 'Accion no permitida en produccion.' }, { status: 403 });
    }

    try {
        // Sincronizar lugares/proyectos/usuarios de localStorage antes del commit
        try {
            const body = await req.json().catch(() => ({}));
            const { workspaces, locationsByProject, usersDb } = body || {};

            const finalWorkspaces: string[] = Array.isArray(workspaces) && workspaces.length > 0
                ? workspaces
                : DEFAULT_WORKSPACES;

            const finalLocations: Record<string, string[]> = {
                ...DEFAULT_LOCATIONS_BY_PROJECT
            };

            if (locationsByProject && typeof locationsByProject === 'object') {
                for (const [ws, locs] of Object.entries(locationsByProject)) {
                    if (Array.isArray(locs) && locs.length > 0) {
                        finalLocations[ws] = locs as string[];
                    }
                }
            }

            const locationsFilePath = path.join(process.cwd(), 'lib', 'locations.ts');
            if (fs.existsSync(locationsFilePath)) {
                const currentContent = fs.readFileSync(locationsFilePath, 'utf8');
                const startMarker = '// === START_MASTER_LOCATIONS ===';
                const endMarker = '// === END_MASTER_LOCATIONS ===';

                const startIdx = currentContent.indexOf(startMarker);
                const endIdx = currentContent.indexOf(endMarker);

                if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                    const replacementBlock = `${startMarker}
export const DEFAULT_WORKSPACES: string[] = ${JSON.stringify(finalWorkspaces, null, 4)};

export const DEFAULT_LOCATIONS_BY_PROJECT: Record<string, string[]> = ${JSON.stringify(finalLocations, null, 4)};
${endMarker}`;

                    const updatedContent =
                        currentContent.slice(0, startIdx) +
                        replacementBlock +
                        currentContent.slice(endIdx + endMarker.length);

                    if (updatedContent !== currentContent) {
                        fs.writeFileSync(locationsFilePath, updatedContent, 'utf8');
                    }
                }
            }

            if (usersDb && typeof usersDb === 'object' && Object.keys(usersDb).length > 0) {
                const authFilePath = path.join(process.cwd(), 'lib', 'auth.tsx');
                if (fs.existsSync(authFilePath)) {
                    const currentAuth = fs.readFileSync(authFilePath, 'utf8');
                    const startUsersMarker = '// === START_MASTER_USERS ===';
                    const endUsersMarker = '// === END_MASTER_USERS ===';

                    const sIdx = currentAuth.indexOf(startUsersMarker);
                    const eIdx = currentAuth.indexOf(endUsersMarker);

                    if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
                        const usersBlock = `${startUsersMarker}
export const INITIAL_USERS: Record<string, { password: string, name: string, role: UserRole, email: string, phone?: string, workspace: string, deactivated?: boolean }> = ${JSON.stringify(usersDb, null, 4)};
${endUsersMarker}`;

                        const updatedAuth =
                            currentAuth.slice(0, sIdx) +
                            usersBlock +
                            currentAuth.slice(eIdx + endUsersMarker.length);

                        if (updatedAuth !== currentAuth) {
                            fs.writeFileSync(authFilePath, updatedAuth, 'utf8');
                        }
                    }
                }
            }
        } catch (syncErr) {
            console.warn('Error sincronizando maestros previos al deploy:', syncErr);
        }

        const { stdout, stderr } = await execPromise('git add . && git commit -m "Actualizacion rapida desde plataforma" && git push origin main');
        return NextResponse.json({ success: true, stdout, stderr });
    } catch (error: any) {
        if (error.stdout && error.stdout.includes('nothing to commit')) {
            try {
                await execPromise('git push origin main');
            } catch (_) {}
            return NextResponse.json({ success: true, message: '¡Plataforma sincronizada y actualizada con éxito!' });
        }
        console.error('Error al actualizar en Vercel:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
