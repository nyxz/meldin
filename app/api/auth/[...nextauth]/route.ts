import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Use the authOptions from lib/auth.ts to ensure consistency
const handler = NextAuth(authOptions);

export {handler as GET, handler as POST};