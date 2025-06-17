import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, BarChart3, FileText } from "lucide-react";

export default function Landing() {
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
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = "/api/login"}
          >
            Iniciar Sesión
          </Button>
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
