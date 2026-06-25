import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// 1 año en segundos — las imágenes de referencia no cambian entre sesiones
const CACHE_TTL = 60 * 60 * 24 * 365;
const CACHE_HEADER = `public, max-age=${CACHE_TTL}, immutable`;

// Extensiones a intentar en orden de preferencia
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'emf'];

// Mapeo doc → carpeta pública estática
const FOLDER_MAP: Record<string, string> = {
    chincha:  'referencias_chincha',
    jahuay:   'referencias_jahuay',
    barandas: 'referencias_barandas',
    pad:      'referencias_pad',
};

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const tag = searchParams.get('tag'); // e.g. 'foto_001'
    const doc = searchParams.get('doc') ?? 'pad';

    if (!tag || !tag.startsWith('foto_')) {
        return new NextResponse('Tag de foto no proporcionado o inválido', { status: 400 });
    }

    const folder = FOLDER_MAP[doc] ?? 'referencias_pad';

    // Intentamos redirigir a cada extensión posible.
    // Las imágenes están en la CDN de Vercel como archivos estáticos (public/).
    for (const ext of EXTENSIONS) {
        const staticUrl = `${origin}/${folder}/${tag}.${ext}`;
        try {
            const check = await fetch(staticUrl, { method: 'HEAD' });
            if (check.ok) {
                // Redirect permanente (301) + Cache-Control largo:
                // el navegador recordará la URL final durante 1 año
                // y no volverá a llamar a este endpoint.
                return NextResponse.redirect(staticUrl, {
                    status: 301,
                    headers: {
                        'Cache-Control': CACHE_HEADER,
                    },
                });
            }
        } catch {
            // ignorar errores de red, seguir probando siguiente extensión
        }
    }

    // Si no se encontró ninguna extensión, pixel transparente cacheado también
    const transparent = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
    );
    return new NextResponse(transparent, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': `public, max-age=3600`,
        },
    });
}
