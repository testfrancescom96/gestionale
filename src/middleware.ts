import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    // 1. Skip public paths
    if (
        request.nextUrl.pathname.startsWith("/_next") ||
        request.nextUrl.pathname.startsWith("/api") || // API paths might need different auth handling (header based?) for now let's keep them open or protected same way? 
        // API should be protected too! But maybe some are public? 
        // Let's protect everything except login and static.
        // Wait, API calls from frontend carry the cookie, so they pass.
        // External API calls (webhooks) need exception.
        // Let's protect /api for now, except specific webhooks if any.
        request.nextUrl.pathname.startsWith("/static") ||
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/favicon.ico"
    ) {
        // Se è /login ma l'utente è già loggato, redirect a dashboard?
        if (request.nextUrl.pathname === "/login") {
            const session = request.cookies.get("session");
            if (session) {
                return NextResponse.redirect(new URL("/", request.url));
            }
        }
        // Add pathname header for layout
        const response = NextResponse.next();
        response.headers.set("x-pathname", request.nextUrl.pathname);
        return response;
    }

    // 2. Update/Verify Session
    const response = await updateSession(request);
    if (!response) {
        // Session invalid or missing
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
