import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertTriangle, MapPin, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

// Colores para el gráfico circular
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98'
];

export default function DashboardMetrics({ metrics }: DashboardMetricsProps) {

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
                data={metrics.employeesByCity}
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
                >
                  {metrics.employeesByCity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                
                {/* Etiquetas con números en las barras */}
                <Bar 
                  dataKey="count" 
                  fill="transparent"
                  radius={[6, 6, 0, 0]}
                  label={{
                    position: 'top',
                    fill: '#333',
                    fontSize: 14,
                    fontWeight: 'bold',
                    formatter: (value: number) => value.toString()
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Estadísticas resumidas */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t pt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Ciudad Principal</p>
              <p className="text-lg font-bold text-blue-800">
                {metrics.employeesByCity[0]?.city || 'N/A'}
              </p>
              <p className="text-sm text-blue-600">
                {metrics.employeesByCity[0]?.count || 0} empleados
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Total Ciudades</p>
              <p className="text-lg font-bold text-green-800">
                {metrics.employeesByCity.length}
              </p>
              <p className="text-sm text-green-600">
                ciudades activas
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Promedio por Ciudad</p>
              <p className="text-lg font-bold text-purple-800">
                {Math.round(metrics.totalEmployees / metrics.employeesByCity.length)}
              </p>
              <p className="text-sm text-purple-600">
                empleados/ciudad
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRÁFICO CIRCULAR SIMPLE */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            Distribución Circular por Ciudad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.employeesByCity}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ city, count, percent }) => 
                    `${city}: ${count} (${(percent * 100).toFixed(1)}%)`
                  }
                  labelLine={false}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {metrics.employeesByCity.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} empleados (${((value as number / metrics.totalEmployees) * 100).toFixed(1)}%)`,
                    'Total'
                  ]}
                  labelFormatter={(label) => `Ciudad: ${label}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda personalizada debajo */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 border-t pt-4">
            {metrics.employeesByCity.map((city, index) => (
              <div key={city.city} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700 truncate">{city.city}</span>
                <span className="text-sm text-gray-500 ml-auto">({city.count})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN DE COMPARACIÓN DE GRÁFICOS - NUEVOS ESTILOS */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">📊 Comparación de Visualizaciones</h3>
          <p className="text-gray-600">Diferentes formas de visualizar la distribución de empleados por ciudad</p>
        </div>

        {/* GRÁFICOS COMPARATIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* GRÁFICO CIRCULAR MEJORADO */}
          <Card className="bg-white shadow-xl border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-6 h-6" />
                Distribución Circular
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.employeesByCity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ city, count, percent }) => 
                        `${city}: ${count} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {metrics.employeesByCity.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} empleados (${((value as number / metrics.totalEmployees) * 100).toFixed(1)}%)`,
                        'Total'
                      ]}
                      labelFormatter={(label) => `Ciudad: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* LEYENDA PERSONALIZADA */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {metrics.employeesByCity.slice(0, 6).map((city, index) => (
                  <div key={city.city} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate font-medium">{city.city}</span>
                    <span className="text-gray-600">({city.count})</span>
                  </div>
                ))}
                {metrics.employeesByCity.length > 6 && (
                  <div className="col-span-2 text-center text-gray-500 text-xs mt-2">
                    +{metrics.employeesByCity.length - 6} ciudades más
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GRÁFICO DE BARRAS HORIZONTALES */}
          <Card className="bg-white shadow-xl border-2 border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Barras Horizontales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="horizontal"
                    data={metrics.employeesByCity.slice().reverse()} // Invertir para mostrar el mayor arriba
                    margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number"
                      label={{ value: 'Número de Empleados', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="city"
                      width={60}
                      fontSize={11}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} empleados`, 'Total']}
                      labelFormatter={(label) => `Ciudad: ${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#10B981"
                      radius={[0, 8, 8, 0]}
                    >
                      {metrics.employeesByCity.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* ESTADÍSTICAS RÁPIDAS */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Ciudad Principal</p>
                  <p className="text-sm font-bold text-green-800">{metrics.employeesByCity[0]?.city}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Total Ciudades</p>
                  <p className="text-sm font-bold text-blue-800">{metrics.employeesByCity.length}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Promedio</p>
                  <p className="text-sm font-bold text-purple-800">
                    {Math.round(metrics.totalEmployees / metrics.employeesByCity.length)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* PANEL DE ANÁLISIS */}
        <Card className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
          <CardContent className="p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">💡 Análisis de Visualizaciones</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-3">
                <h5 className="font-semibold text-blue-700 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4" />
                  Gráfico Circular
                </h5>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">✅ Muestra proporciones</span>
                    <span className="text-green-600 font-medium">Excelente</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">📱 Adaptable móvil</span>
                    <span className="text-yellow-600 font-medium">Bueno</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">📊 Comparación valores</span>
                    <span className="text-yellow-600 font-medium">Medio</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🎨 Impacto visual</span>
                    <span className="text-green-600 font-medium">Alto</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-green-700 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Barras Horizontales
                </h5>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">✅ Comparación precisa</span>
                    <span className="text-green-600 font-medium">Excelente</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">📱 Legibilidad móvil</span>
                    <span className="text-green-600 font-medium">Excelente</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">📊 Nombres largos</span>
                    <span className="text-green-600 font-medium">Perfecto</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🎨 Simplicidad</span>
                    <span className="text-green-600 font-medium">Alto</span>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
