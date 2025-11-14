
"use client";

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { authenticateAdmin } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // CORRECCIÓN: Importación añadida
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';

function LoginButton() {
    const { pending } = useFormStatus(); 
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Iniciar Sesión
        </Button>
    );
}

export default function AdminPage({ dbConnected }: { dbConnected: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialState = { success: false, error: null };
  const [state, dispatch] = useFormState(authenticateAdmin, initialState);

  useEffect(() => {
    // Check for session token on initial load
    const sessionToken = localStorage.getItem('admin_session');
    if (sessionToken) {
        // Here you might want to add a check to validate the token against the backend
        // For simplicity, we'll just set isAuthenticated to true
        setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (state.success) {
      setIsAuthenticated(true);
      // Store a session token on successful login
      localStorage.setItem('admin_session', 'true'); // Replace 'true' with a real token
    }
  }, [state.success]);

  const handleLogout = () => {
    // Clear session token on logout
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-sm shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline">Admin Login</CardTitle>
                    <CardDescription>Ingresa a tu cuenta para gestionar la tienda.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={dispatch} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor='email'>Email</Label>
                            <Input id="email" name="email" type="email" placeholder="email@ejemplo.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor='password'>Contraseña</Label>
                            <Input id="password" name="password" type="password" required placeholder="Contraseña" />
                        </div>
                        
                        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                        
                        <LoginButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
      <AdminDashboard onLogout={handleLogout} dbConnected={dbConnected} />
  );
}
