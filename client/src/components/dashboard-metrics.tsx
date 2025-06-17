import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertTriangle } from "lucide-react";

interface MetricsData {
  totalEmployees: number;
  activeEmployees: number;
  itLeaves: number;
  pendingActions: number;
  employeesByCity: { city: string; count: number }[];
}

interface DashboardMetricsProps {
  metrics: MetricsData;
}

export default function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Empleados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.totalEmployees}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.activeEmployees}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserX className="w-8 h-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bajas IT</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.itLeaves}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.pendingActions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
