
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
    // Check if we are in production or if the user wants to secure the app
    // For now, we force it as requested.
    // const isProduction = process.env.NODE_ENV === 'production';
    // if (!isProduction) return NextResponse.next();

    // Exclude API routes or specific paths if needed? 
    // User asked to secure the URL so "nobody sees everything". So better secure everything.
    // Maybe exclude /api/woocommerce/webhooks if present (but we don't have webhooks yet).

    const basicAuth = req.headers.get('authorization')

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1]
        const [user, pwd] = atob(authValue).split(':')

        // HARDCODED CREDENTIALS (Placeholder - User should change these!)
        // User: admin
        // Pass: goontheroad2025
        if (user === 'admin' && pwd === 'goontheroad2025') {
            return NextResponse.next()
        }
    }

    return new NextResponse('Autenticazione Richiesta - Gestionale GOonTheROAD', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Area Riservata"',
        },
    })
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> Actually, maybe secure API too? Yes generally.
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images)
         */
        '/((?!_next/static|_next/image|favicon.ico|logo.png).*)',
    ],
}
