'use client';

import {useState} from 'react';
import {signIn} from 'next-auth/react';
import {useSearchParams} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Languages, Lock} from 'lucide-react';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const error = searchParams.get('error');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(error === 'CredentialsSignin' ? 'Invalid username or password' : '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        try {
            // Use redirect: true to let NextAuth handle the redirection
            await signIn('credentials', {
                username,
                password,
                callbackUrl,
                redirect: true,
            });

            // The code below won't execute if redirect is true and login is successful
            // It's only here as a fallback
            setIsLoading(false);
        } catch (error) {
            setErrorMessage('An error occurred during login');
            console.error('Login error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div
                            className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                            <Languages className="w-8 h-8 text-cyan-400"/>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            Translation Manager
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Please log in to access the translation management tool
                    </p>
                </div>

                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Lock className="h-5 w-5 text-purple-400"/>
                            <span>Secure Login</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {errorMessage && (
                                <div
                                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-gray-800/50 border-gray-700 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-gray-800/50 border-gray-700 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging in...' : 'Log In'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}