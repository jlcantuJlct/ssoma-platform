import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_WORKSPACES, DEFAULT_LOCATIONS_BY_PROJECT } from '@/lib/locations';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { workspaces, locationsByProject } = body || {};

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
                    return NextResponse.json({ success: true, updated: true, locations: finalLocations });
                }
            }
        }

        return NextResponse.json({ success: true, updated: false, locations: finalLocations });
    } catch (error: any) {
        console.error('Error syncing master locations:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
