import {getServerSession} from "next-auth/next";
import {NextAuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: {label: "Username", type: "text"},
                password: {label: "Password", type: "password"}
            },
            async authorize(credentials?: { username: string; password: string }) {
                if (
                    credentials &&
                    credentials?.username === process.env.AUTH_USERNAME &&
                    credentials?.password === process.env.AUTH_PASSWORD
                ) {
                    return {
                        id: "1",
                        name: credentials.username,
                        email: `${credentials.username}@example.com`,
                    };
                }
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
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({session, token}) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
};

export const getSession = () => getServerSession(authOptions);