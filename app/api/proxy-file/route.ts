import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');
    
    const localPath = req.nextUrl.searchParams.get('localPath');
    
    if (localPath) {
        // Safety check: Only allow access to CASA 2026 directory
        if (!localPath.startsWith('C:\\Users\\jlcan\\Desktop\\CASA 2026')) {
            return new NextResponse('Error: Access denied to this path', { status: 403 });
        }

        try {
            const fs = require('fs');
            if (!fs.existsSync(localPath)) {
                return new NextResponse('Error: File not found', { status: 404 });
            }
            const fileBuffer = fs.readFileSync(localPath);
            const contentType = localPath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
            
            return new NextResponse(fileBuffer, {
                status: 200,
                headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' }
            });
        } catch (e: any) {
            return new NextResponse(`Error reading local file: ${e.message}`, { status: 500 });
        }
    }

    if (!url) {
        return new NextResponse('Error: Parameter URL is missing', { status: 400 });
    }

    try {
        let fetchUrl = url;

        // Convert standard Google Drive viewing URLs into direct download URLs automatically
        if (url.includes('drive.google.com/file/d/') && !url.includes('export=')) {
            const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                fetchUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
            }
        }

        // For thumbnails or direct links, fetchUrl remains the same
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
            return new NextResponse(`Error fetching resource: ${response.statusText}`, { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000'); 

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers: headers
        });

    } catch (e: any) {
        console.error('Proxy File Error:', e);
        return new NextResponse(`Internal Server Error: ${e.message}`, { status: 500 });
    }
}
