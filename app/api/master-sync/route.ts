import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_WORKSPACES, DEFAULT_LOCATIONS_BY_PROJECT } from '@/lib/locations';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
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

        let updatedAny = false;

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
                    updatedAny = true;
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
                        updatedAny = true;
                    }
                }
            }
        }

        return NextResponse.json({ success: true, updated: updatedAny, locations: finalLocations });
    } catch (error: any) {
        console.error('Error syncing master locations:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
