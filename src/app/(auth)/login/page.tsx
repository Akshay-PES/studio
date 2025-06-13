
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

// The designated admin email for this login page
const ADMIN_LOGIN_EMAIL = "mbaoffice.rr@pes.edu";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { signIn } = useAuth(); // Removed isAdmin as it's not reliably updated for immediate check here
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
    } else if (result && 'uid' in result) { // Successfully signed in
        // The signIn function in AuthContext already sets the isAdmin state.
        // Here, we do an immediate check for this specific admin login page.
        if (result.email === ADMIN_LOGIN_EMAIL) {
            toast({ title: "Login Successful", description: "Redirecting to admin dashboard..." });
            router.push('/admin/dashboard');
        } else {
            // User authenticated successfully, but is not the admin this page expects.
            toast({ variant: "destructive", title: "Access Denied", description: "You are not authorized to access the admin panel." });
            // Consider signing out the user as this page is for admins only,
            // or redirecting them to the public dashboard.
            // For now, they remain logged in but won't be able to access /admin/dashboard due to AdminLayout protection.
        }
    }
    setIsLoggingIn(false);
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-primary">Admin Login</CardTitle>
        <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
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
              placeholder="admin@example.com"
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
            Use '{ADMIN_LOGIN_EMAIL}' for admin access.
          </p>
        <Link href="/dashboard" className="mt-2 text-primary hover:underline">
          Back to Public Calendar
        </Link>
      </CardFooter>
    </Card>
  );
}
