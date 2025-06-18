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
      
      console.log("Intentando login con:", loginData);
      console.log("API Base URL:", API_BASE_URL);
      
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log("URL de login:", loginUrl);
      
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      console.log("Respuesta del servidor:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log("Login exitoso:", data);
        // Invalidate auth query to refetch user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        // Force a page reload to update the app state
        window.location.reload();
      } else {
        let errorData;
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          const textData = await response.text();
          console.error("Respuesta no JSON:", textData);
          throw new Error(`Error ${response.status}: ${textData.substring(0, 100)}`);
        }
        
        console.error("Error en login:", errorData);
        throw new Error(errorData.error || errorData.message || "Error en el login");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError(error instanceof Error ? error.message : "Error al iniciar sesión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickLogin = (userType: string) => {
    const users = {
      superadmin: { email: "superadmin@glovo.com", password: "superadmin123" },
      admin: { email: "admin@glovo.com", password: "admin123" },
      user: { email: "user@glovo.com", password: "user123" }
    };
    
    const userData = users[userType as keyof typeof users];
    setLoginData(userData);
    setShowLoginForm(true);
    
    // Auto-login after 1 second for quick testing
    setTimeout(() => {
      setLoginData(userData);
      handleLogin();
    }, 100);
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
              
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600 mb-3">Usuarios de prueba:</p>
                <div className="space-y-2 text-xs">
                  <div><strong>Super Admin:</strong> superadmin@glovo.com / superadmin123</div>
                  <div><strong>Admin:</strong> admin@glovo.com / admin123</div>
                  <div><strong>Usuario:</strong> user@glovo.com / user123</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Sistema de Gestión de Empleados
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Plataforma completa para la administración de empleados con control de acceso basado en roles,
            gestión de bajas y notificaciones administrativas.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowLoginForm(true)}
              >
                Iniciar Sesión Manual
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <p className="text-gray-600 w-full mb-2">O acceso rápido:</p>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => handleQuickLogin('superadmin')}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Iniciando..." : "Super Admin"}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => handleQuickLogin('admin')}
                className="text-green-600 border-green-600 hover:bg-green-50"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Iniciando..." : "Admin"}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => handleQuickLogin('user')}
                className="text-purple-600 border-purple-600 hover:bg-purple-50"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Iniciando..." : "Usuario"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200 max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Gestión de Empleados</h3>
              <p className="text-gray-600 text-sm">
                Administra la información completa de tus empleados con filtros avanzados y búsqueda.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Control de Acceso</h3>
              <p className="text-gray-600 text-sm">
                Sistema de roles con Super Admin, Admin y Usuario Normal con permisos específicos.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dashboard Analítico</h3>
              <p className="text-gray-600 text-sm">
                Métricas en tiempo real con gráficos y estadísticas de empleados por ciudad.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <FileText className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Gestión de Bajas</h3>
              <p className="text-gray-600 text-sm">
                Sistema completo de bajas IT y empresariales con flujo de aprobación.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Características Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-4">Para Administradores</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Edición completa de datos de empleados</li>
                <li>• Gestión de bajas IT y empresariales</li>
                <li>• Carga masiva de empleados via Excel</li>
                <li>• Sistema de notificaciones</li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-4">Para Usuarios</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Visualización de empleados activos</li>
                <li>• Filtros por ciudad y estado</li>
                <li>• Búsqueda avanzada</li>
                <li>• Dashboard con métricas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
