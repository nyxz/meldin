import {NextResponse} from 'next/server';
import {withAuth} from 'next-auth/middleware';

// This function can be marked `async` if using `await` inside
export default withAuth(
    // `withAuth` augments your `Request` with the user's token.
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({token}) => !!token,
        },
        pages: {
            signIn: '/login',
        },
    }
);

// Configure which paths require authentication
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth.js API routes)
         * - _next (Next.js internals)
         * - login (login page)
         * - favicon.ico, robots.txt, etc. (static files)
         */
        '/((?!api/auth|_next|login|favicon.ico|robots.txt).*)',
    ],
};