import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            // The name to display on the sign in form (e.g. "Sign in with...")
            name: "Credentials",
            // `credentials` is used to generate a form on the sign in page.
            credentials: {
                username: {label: "Username", type: "text"},
                password: {label: "Password", type: "password"}
            },
            async authorize(credentials?: { username: string, password: string }) {
                // Check if the credentials match the environment variables
                if (
                    credentials &&
                    credentials.username === process.env.AUTH_USERNAME &&
                    credentials.password === process.env.AUTH_PASSWORD
                ) {
                    // Return a user object if the credentials are valid
                    return {
                        id: "1",
                        name: credentials.username,
                        email: `${credentials.username}@example.com`,
                    };
                }

                // Return null if the credentials are invalid
                return null;
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({token, user}) {
            // Add user info to the token
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({session, token}) {
            // Add user info to the session
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});

export {handler as GET, handler as POST};