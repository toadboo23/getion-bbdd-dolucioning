import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Building2 } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

// Get API base URL from environment or default to proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function Landing() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setError("Por favor, ingresa email y contraseña");
      return;
    }
    
    try {
      setIsLoggingIn(true);
      setError("");
      
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });
<<<<<<< HEAD

      if (response.ok) {
        const data = await response.json();
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        window.location.reload();
=======
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Invalidate auth query to refetch user data
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          // Force a page reload to update the app state
          window.location.reload();
        } else {
          throw new Error(data.error || "Error en el login");
        }
>>>>>>> cambios-2506
      } else {
        let errorData;
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
          throw new Error(errorData.error || errorData.message || "Credenciales incorrectas");
        } else {
<<<<<<< HEAD
          const textData = await response.text();
          throw new Error(`Error ${response.status}: ${textData.substring(0, 100)}`);
        }
        
        throw new Error(errorData.error || errorData.message || "Error en el login");
=======
          throw new Error("Error del servidor. Por favor, inténtalo de nuevo.");
        }
>>>>>>> cambios-2506
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoggingIn(false);
    }
  };

<<<<<<< HEAD
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Iniciar Sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    placeholder="usuario@glovo.com"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    placeholder="Ingresa tu contraseña"
                    className="w-full"
                  />
                </div>
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
=======
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sistema de Gestión
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Ingresa tus credenciales para acceder
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  placeholder="tu-email@solucioning.net"
                  className="w-full h-11 text-base"
                  disabled={isLoggingIn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  placeholder="Ingresa tu contraseña"
                  className="w-full h-11 text-base"
                  disabled={isLoggingIn}
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
>>>>>>> cambios-2506
                    {error}
                  </div>
                </div>
<<<<<<< HEAD
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Iniciar Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  placeholder="usuario@glovo.com"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  placeholder="Ingresa tu contraseña"
                  className="w-full"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Iniciando sesión..." : "Iniciar Sesión"}
=======
              )}
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
>>>>>>> cambios-2506
              </Button>
            </form>
          </CardContent>
        </Card>
<<<<<<< HEAD
=======
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Solucioning
          </p>
        </div>
>>>>>>> cambios-2506
      </div>
    </div>
  );
}
