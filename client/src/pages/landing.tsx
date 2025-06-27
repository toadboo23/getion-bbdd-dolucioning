import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Shield, BarChart3, FileText } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

// Get API base URL from environment or default to proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function Landing() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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

      if (response.ok) {
        const data = await response.json();
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        window.location.reload();
      } else {
        let errorData;
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          const textData = await response.text();
          throw new Error(`Error ${response.status}: ${textData.substring(0, 100)}`);
        }
        
        throw new Error(errorData.error || errorData.message || "Error en el login");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoggingIn(false);
    }
  };

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
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowLoginForm(false)}
                    disabled={isLoggingIn}
                  >
                    Volver
                  </Button>
                </div>
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
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
