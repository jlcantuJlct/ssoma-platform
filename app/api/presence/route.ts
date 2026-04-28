export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PRESENCE_FILE = path.join(process.cwd(), 'data', 'presence.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Presence record: { username: { name: string, lastSeen: number } }

export async function POST(request: Request) {
    try {
        const { username, name } = await request.json();
        if (!username) return NextResponse.json({ success: false });

        let presence: Record<string, { name: string, lastSeen: number }> = {};
        if (fs.existsSync(PRESENCE_FILE)) {
            presence = JSON.parse(fs.readFileSync(PRESENCE_FILE, 'utf8'));
        }

        // Update current user
        presence[username] = {
            name,
            lastSeen: Date.now()
        };

        // Cleanup old presence (older than 1 minute)
        const now = Date.now();
        const cleanedPresence: Record<string, { name: string, lastSeen: number }> = {};
        Object.entries(presence).forEach(([u, data]) => {
            if (now - data.lastSeen < 60000) {
                cleanedPresence[u] = data;
            }
        });

        fs.writeFileSync(PRESENCE_FILE, JSON.stringify(cleanedPresence));

        return NextResponse.json({ success: true, presence: cleanedPresence });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) });
    }
}

export async function GET() {
    try {
        if (!fs.existsSync(PRESENCE_FILE)) {
            return NextResponse.json({ success: true, presence: {} });
        }
        const presence = JSON.parse(fs.readFileSync(PRESENCE_FILE, 'utf8'));
        
        // Cleanup on GET too
        const now = Date.now();
        const cleanedPresence: Record<string, { name: string, lastSeen: number }> = {};
        Object.entries(presence).forEach(([u, data]) => {
            if (now - data.lastSeen < 60000) {
                cleanedPresence[u] = data;
            }
        });

        return NextResponse.json({ success: true, presence: cleanedPresence });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) });
    }
}
