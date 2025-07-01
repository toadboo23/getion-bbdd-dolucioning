import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertTriangle, MapPin, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

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

// Colores para el gráfico de barras
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98'
];

export default function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  // Validar que los datos estén en el formato correcto
  if (!metrics || !Array.isArray(metrics.employeesByCity)) {
    console.error('DashboardMetrics: Datos inválidos', metrics);
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No hay datos disponibles para mostrar los gráficos</p>
      </div>
    );
  }

  // Asegurar que employeesByCity tenga al menos un elemento
  const safeEmployeesByCity = metrics.employeesByCity.length > 0 
    ? metrics.employeesByCity 
    : [{ city: 'Sin datos', count: 0 }];

  return (
    <div className="space-y-6">
      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Empleados</p>
                <p className="text-3xl font-bold text-blue-900">
                  {metrics.totalEmployees.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Incluye activos, baja IT y baja empresa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Trabajadores Activos</p>
                <p className="text-3xl font-bold text-green-900">
                  {metrics.activeEmployees.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Activos + Baja IT (trabajando)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserX className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Bajas IT</p>
                <p className="text-3xl font-bold text-orange-900">
                  {metrics.itLeaves.toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Enfermedad / Accidente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-700">Acciones Pendientes</p>
                <p className="text-3xl font-bold text-red-900">
                  {metrics.pendingActions}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Requieren aprobación
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICO DE EMPLEADOS POR CIUDAD */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Empleados por Ciudad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={safeEmployeesByCity}
                margin={{ top: 50, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="city" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                  interval={0}
                  stroke="#666"
                />
                <YAxis 
                  label={{ 
                    value: 'Número de Empleados', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  stroke="#666"
                />
                <Tooltip 
                  formatter={(value) => [`${value} empleados`, 'Total']}
                  labelFormatter={(label) => `Ciudad: ${label}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]}
                  stroke="#fff"
                  strokeWidth={1}
                  label={{
                    position: 'top',
                    fill: '#333',
                    fontSize: 14,
                    fontWeight: 'bold',
                    formatter: (value: number) => value.toString()
                  }}
                >
                  {safeEmployeesByCity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Estadísticas resumidas */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t pt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Ciudad Principal</p>
              <p className="text-lg font-bold text-blue-800">
                {safeEmployeesByCity[0]?.city || 'N/A'}
              </p>
              <p className="text-sm text-blue-600">
                {safeEmployeesByCity[0]?.count || 0} empleados
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Total Ciudades</p>
              <p className="text-lg font-bold text-green-800">
                {safeEmployeesByCity.length}
              </p>
              <p className="text-sm text-green-600">
                ciudades activas
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Promedio por Ciudad</p>
              <p className="text-lg font-bold text-purple-800">
                {Math.round(metrics.totalEmployees / safeEmployeesByCity.length)}
              </p>
              <p className="text-sm text-purple-600">
                empleados/ciudad
              </p>
            </div>
          </div>
        </CardContent>
      </Card>




    </div>
  );
}
