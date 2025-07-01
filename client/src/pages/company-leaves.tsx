import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { exportToExcel } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

<<<<<<< HEAD
import { Download, Search, Filter } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompanyLeave } from "@shared/schema";
import { useNavigate } from "react-router-dom";
=======
import { Download, Search, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompanyLeave } from "@shared/schema";
import * as XLSX from 'xlsx';
>>>>>>> cambios-2506

export default function CompanyLeaves() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  // Definir permisos específicos por rol
  const canExportCompanyLeaves = user?.role === "admin" || user?.role === "super_admin";
  const isReadOnlyUser = user?.role === "normal";

  const { data: allCompanyLeaves = [], isLoading } = useQuery<CompanyLeave[]>({
    queryKey: ["/api/company-leaves"],
    refetchInterval: 5000, // Actualizar cada 5 segundos
    refetchIntervalInBackground: true, // Actualizar incluso cuando la ventana no está en foco
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && user?.role === "normal") {
      navigate("/employees", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (!authLoading && user?.role === "normal") return null;

  // Filtrar bajas según los criterios de búsqueda
  const companyLeaves = useMemo(() => {
    return allCompanyLeaves.filter((leave) => {
      const employeeData = leave.employeeData as any;
      
      // Filtro por término de búsqueda
      const searchMatch = !searchTerm || 
        (employeeData?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employeeData?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employeeData?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employeeData?.dniNie?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employeeData?.idGlovo?.toString().includes(searchTerm)) ||
        (leave.employeeId?.toString().includes(searchTerm));

      // Filtro por estado
      const statusMatch = statusFilter === "all" || leave.status === statusFilter;

      // Filtro por tipo de baja
      const leaveTypeMatch = leaveTypeFilter === "all" || leave.leaveType === leaveTypeFilter;

      return searchMatch && statusMatch && leaveTypeMatch;
    });
  }, [allCompanyLeaves, searchTerm, statusFilter, leaveTypeFilter]);



  const getLeaveTypeBadge = (type: string) => {
    const variants = {
      despido: "destructive",
      voluntaria: "secondary", 
      nspp: "outline",
      anulacion: "default"
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || "default"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Tramitada
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazada
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </span>
        );
      case "pendiente_laboral":
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente Laboral
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };



  // Función para exportar bajas empresa a Excel (últimos 90 días)
  const handleExportCompanyLeaves = () => {
    if (!allCompanyLeaves || allCompanyLeaves.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay bajas empresa para exportar",
        variant: "destructive",
      });
      return;
    }

<<<<<<< HEAD
    // Preparar datos para export
    const exportData = companyLeaves.map(leave => {
      const employeeData = leave.employeeData as any || {};
      return {
        'ID Glovo': employeeData.idGlovo || '',
        'Nombre': employeeData.nombre || '',
        'Apellido': employeeData.apellido || '',
        'Email Glovo': employeeData.emailGlovo || '',
        'Teléfono': employeeData.telefono || '',
        'DNI/NIE': employeeData.dniNie || '',
        'Ciudad': employeeData.ciudad || '',
        'Flota': employeeData.flota || '',
        'Tipo de Baja': leave.leaveType || '',
        'Fecha de Baja': leave.leaveDate ? new Date(leave.leaveDate).toLocaleDateString('es-ES') : '',
        'Solicitado por': leave.leaveRequestedBy || '',
        'Fecha Solicitud': leave.leaveRequestedAt ? new Date(leave.leaveRequestedAt).toLocaleDateString('es-ES') : '',
        'Aprobado por': leave.approvedBy || '',
        'Fecha Aprobación': leave.approvedAt ? new Date(leave.approvedAt).toLocaleDateString('es-ES') : '',
        'Estado': leave.status === 'approved' ? 'Aprobado' : 
                 leave.status === 'rejected' ? 'Rechazado' : leave.status || '',
        'Fecha Creación': leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('es-ES') : '',
        'Última Actualización': leave.updatedAt ? new Date(leave.updatedAt).toLocaleDateString('es-ES') : ''
=======
    // Calcular fecha límite (90 días atrás)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Filtrar bajas de los últimos 90 días
    const recentLeaves = allCompanyLeaves.filter(leave => {
      const leaveDate = new Date(leave.leaveDate);
      return leaveDate >= ninetyDaysAgo;
    });

    if (recentLeaves.length === 0) {
      toast({
        title: "Sin datos recientes",
        description: "No hay bajas empresa en los últimos 90 días para exportar",
        variant: "destructive",
      });
      return;
    }

    // Preparar datos para exportar con nombres de columnas en español
    const exportData = recentLeaves.map(leave => {
      const employeeData = leave.employeeData as any;
      return {
        'ID': leave.id,
        'ID Empleado': leave.employeeId,
        'ID Glovo': employeeData?.idGlovo || 'N/A',
        'Nombre': employeeData?.nombre || 'N/A',
        'Apellido': employeeData?.apellido || 'N/A',
        'Email': employeeData?.email || 'N/A',
        'Teléfono': employeeData?.telefono || 'N/A',
        'DNI/NIE': employeeData?.dniNie || 'N/A',
        'IBAN': employeeData?.iban || 'N/A',
        'Ciudad': employeeData?.ciudad || 'N/A',
        'Código Ciudad': employeeData?.cityCode || 'N/A',
        'Dirección': employeeData?.direccion || 'N/A',
        'Vehículo': employeeData?.vehiculo || 'N/A',
        'NAF': employeeData?.naf || 'N/A',
        'Horas': employeeData?.horas || 'N/A',
        'CDP%': employeeData?.horas ? Math.round((employeeData.horas / 38) * 100) : 'N/A',
        'Flota': employeeData?.flota || 'N/A',
        'Tipo de Baja': leave.leaveType === 'despido' ? 'Despido' :
                       leave.leaveType === 'voluntaria' ? 'Voluntaria' :
                       leave.leaveType === 'nspp' ? 'NSPP' :
                       leave.leaveType === 'anulacion' ? 'Anulación' : leave.leaveType,
        'Fecha de Baja': new Date(leave.leaveDate).toLocaleDateString('es-ES'),
        'Solicitado por': leave.leaveRequestedBy,
        'Fecha Solicitud': new Date(leave.leaveRequestedAt).toLocaleDateString('es-ES'),
        'Aprobado por': leave.approvedBy || 'N/A',
        'Fecha Aprobación': leave.approvedAt ? new Date(leave.approvedAt).toLocaleDateString('es-ES') : 'N/A',
        'Estado': leave.status === 'approved' ? 'Aprobado' : 
                 leave.status === 'rejected' ? 'Rechazado' : 
                 leave.status === 'pending' ? 'Pendiente' :
                 leave.status === 'pendiente_laboral' ? 'Pendiente Laboral' : leave.status,
        'Fecha Creación': leave.createdAt ? new Date(leave.createdAt).toLocaleDateString('es-ES') : 'N/A',
        'Última Actualización': leave.updatedAt ? new Date(leave.updatedAt).toLocaleDateString('es-ES') : 'N/A'
>>>>>>> cambios-2506
      };
    });

    // Crear el archivo Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bajas Empresa");

    // Generar nombre de archivo con fecha y rango
    const date = new Date().toISOString().split('T')[0];
    const fileName = `bajas_empresa_ultimos_90_dias_${date}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Exportación exitosa",
      description: `Se han exportado ${recentLeaves.length} bajas empresa de los últimos 90 días a ${fileName}`,
    });
  };

  if (isLoading || authLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Baja Empresa</h1>
          <p className="text-gray-600 mt-2">
            Empleados con bajas empresa procesadas
          </p>
          {canExportCompanyLeaves && (
            <p className="text-sm text-green-600 mt-1">
              💾 La exportación incluye solo los últimos 90 días de bajas empresa
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2 items-center">
          {/* Botón Exportar - Solo Admin y Super Admin */}
          {canExportCompanyLeaves && (
            <Button 
              variant="outline" 
              onClick={handleExportCompanyLeaves}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Bajas (90 días)
            </Button>
          )}
          
          {/* Mensaje para usuario de solo consulta */}
          {isReadOnlyUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-700">
                👁️ Usuario de consulta - Solo puedes ver información
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>
            Filtra las bajas empresa por nombre, email, DNI, estado o tipo de baja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda por texto */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Empleado</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre, email, DNI, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por tipo de baja */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Baja</label>
              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="despido">Despido</SelectItem>
                  <SelectItem value="voluntaria">Voluntaria</SelectItem>
                  <SelectItem value="nspp">NSPP</SelectItem>
                  <SelectItem value="anulacion">Anulación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Información de resultados */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{companyLeaves.length}</span> de <span className="font-semibold">{allCompanyLeaves.length}</span> bajas empresa
              {(searchTerm || statusFilter !== "all" || leaveTypeFilter !== "all") && (
                <span className="ml-2">
                  • Filtros activos: 
                  {searchTerm && <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Búsqueda</span>}
                  {statusFilter !== "all" && <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Estado</span>}
                  {leaveTypeFilter !== "all" && <span className="ml-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Tipo</span>}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empleados con Baja Empresa</CardTitle>
          <CardDescription>
            Resultados filtrados: {companyLeaves.length} empleados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companyLeaves.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay empleados con baja empresa procesada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>DNI/NIE</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Tipo de Baja</TableHead>
                    <TableHead>Fecha de Baja</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead>Aprobado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Aprobación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyLeaves.map((leave) => {
                    const employeeData = leave.employeeData as any;
                    return (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employeeData?.nombre || 'N/A'} {employeeData?.apellido || ''}
                            </div>
                            <div className="text-sm text-gray-500">{employeeData?.idGlovo || leave.employeeId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{employeeData?.email || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{employeeData?.telefono || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{employeeData?.dniNie || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{employeeData?.ciudad || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          {getLeaveTypeBadge(leave.leaveType)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {format(new Date(leave.leaveDate), "dd/MM/yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{leave.leaveRequestedBy}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(leave.leaveRequestedAt), "dd/MM/yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{leave.approvedBy || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(leave.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {leave.approvedAt ? format(new Date(leave.approvedAt), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">Sin acciones disponibles</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}