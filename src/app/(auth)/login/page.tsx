
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AuthError } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    const result = await signIn(email, password);

    if (result && 'code' in result && (result as AuthError).code) {
      const authError = result as AuthError;
      let userFriendlyError = "Failed to log in. Please try again.";
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        userFriendlyError = "Invalid email or password. Please try again.";
      } else if (authError.code === 'auth/too-many-requests') {
        userFriendlyError = "Too many failed login attempts. Please try again later.";
      } else if (authError.message) {
        userFriendlyError = authError.message;
      }
      setError(userFriendlyError);
      toast({ variant: "destructive", title: "Login Failed", description: userFriendlyError });
    } else if (result && 'uid' in result) {
        toast({ title: "Login Successful", description: "Redirecting..." });
        // The AuthContext will fetch the user's role. The AdminLayout will
        // handle authorization and redirection if the user is not an admin.
        router.push('/admin/dashboard');
    } else {
      setError("An unexpected error occurred during login.");
      toast({ variant: "destructive", title: "Login Error", description: "An unexpected error occurred."});
    }
    setIsLoggingIn(false);
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl font-headline text-primary">Admin Login</CardTitle>
        <CardDescription className="text-sm md:text-base">Enter your department credentials to access the admin panel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="department-admin@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? 'Logging In...' : 'Log In'}
          </Button>
        </form>
      </CardContent>
       <CardFooter className="flex flex-col items-center text-sm">
         <p className="text-muted-foreground">
            Only authorized department admins can log in.
          </p>
        <Link href="/" className="mt-2 text-primary hover:underline">
          Back to Department Selection
        </Link>
      </CardFooter>
    </Card>
  );
}
