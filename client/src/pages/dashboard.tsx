import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import DashboardMetrics from "@/components/dashboard-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertTriangle, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Definir el tipo de métricas
interface MetricsData {
  totalEmployees: number;
  activeEmployees: number;
  itLeaves: number;
  pendingLaboral: number;
  penalizedEmployees: number;
  pendingActions: number;
  employeesByCity: { city: string; count: number }[];
  debug?: any;
}

// Definir el tipo de notificación si es necesario
interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  // ...otros campos relevantes
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Tipar correctamente la respuesta de useQuery
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    error: metricsError 
  } = useQuery<MetricsData>({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/metrics", { credentials: "include" });
      if (!res.ok) throw new Error("Error al obtener métricas del dashboard");
      return res.json();
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    retry: false,
  });

  // Manejo profesional de errores con useEffect
  useEffect(() => {
    if (metricsError && isUnauthorizedError(metricsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    } else if (metricsError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas del dashboard",
        variant: "destructive",
      });
    }
  }, [metricsError, toast]);

  const { data: recentActivity } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
<<<<<<< HEAD
    // El manejo de error debe hacerse con onError global o en el hook, no aquí
=======
    onError: (error) => {
      if (!isUnauthorizedError(error)) {
        // Only show error if it's not an unauthorized error (handled by effect above)
    
      }
    },
>>>>>>> cambios-2506
  });

  useEffect(() => {
    if (!isLoading && user?.role === "normal") {
      navigate("/employees", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (!isLoading && user?.role === "normal") return null;

  if (isLoading || metricsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">Resumen general del sistema</p>
      </div>

<<<<<<< HEAD
      {/* Métricas principales */}
      <DashboardMetrics metrics={metrics} />

      {/* Ejemplo de uso de recentActivity si es necesario */}
      {/*
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {recentActivity?.slice(0, 5).map((activity) => (
                <li key={activity.id}>{activity.title}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      */}
=======
      {/* Dashboard avanzado con gráficos */}
      {metrics && (
        <DashboardMetrics metrics={metrics} />
      )}

      {/* Actividad Reciente */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity?.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'employee_update' ? 'bg-blue-100' : 
                    activity.type === 'company_leave_request' ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    {activity.type === 'employee_update' && <Users className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'company_leave_request' && <UserX className="w-4 h-4 text-orange-600" />}
                    {activity.type === 'bulk_upload' && <Users className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.createdAt!).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay actividad reciente disponible
              </p>
            )}
          </div>
        </CardContent>
      </Card>
>>>>>>> cambios-2506
    </div>
  );
}
