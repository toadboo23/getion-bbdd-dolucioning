import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { exportToExcel, createExcelTemplate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import EmployeeTable from "@/components/employee-table";
import EditEmployeeModal from "@/components/modals/edit-employee-modal";
import LeaveManagementModal from "@/components/modals/leave-management-modal";
import ImportEmployeesModal from "@/components/modals/import-employees-modal";
import EmployeeDetailModal from "@/components/modals/employee-detail-modal";
import { Plus, Search, Download, FileSpreadsheet, Upload } from "lucide-react";
import type { Employee } from "@shared/schema";
import * as XLSX from 'xlsx';

export default function Employees() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [flotaFilter, setFlotaFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  // Redirect if not authenticated
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

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", { 
      search: searchTerm, 
      city: cityFilter === "all" ? "" : cityFilter, 
      status: statusFilter === "all" ? "" : statusFilter,
      flota: flotaFilter === "all" ? "" : flotaFilter
    }],
    retry: false,
  });

  // Obtener ciudades únicas para el filtro
  const { data: cities } = useQuery<string[]>({
    queryKey: ["/api/cities"],
    retry: false,
  });

  // Obtener flotas únicas para el filtro
  const { data: flotas } = useQuery<string[]>({
    queryKey: ["/api/flotas"],
    retry: false,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      try {
        const response = await apiRequest("POST", "/api/employees", employeeData);
        return response;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Empleado creado",
        description: "El empleado ha sido agregado correctamente",
      });
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "No se pudo crear el empleado",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Empleado actualizado",
        description: "Los datos del empleado han sido actualizados",
      });
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "No se pudo actualizar el empleado",
        variant: "destructive",
      });
    },
  });

  // Definir permisos específicos por rol
  const canEditEmployees = user?.role === "admin" || user?.role === "super_admin";
  const canImportEmployees = user?.role === "super_admin"; // Solo super admin puede importar
  const canExportEmployees = user?.role === "admin" || user?.role === "super_admin"; // Admin y super admin pueden exportar
  const canDownloadTemplate = user?.role === "admin" || user?.role === "super_admin"; // Admin y super admin pueden descargar plantillas
  const isReadOnlyUser = user?.role === "normal"; // Usuario normal solo puede consultar

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleManageLeave = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsLeaveModalOpen(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (employee: Employee) => {
    setDetailEmployee(employee);
    setIsDetailModalOpen(true);
  };

  // Función para exportar empleados a Excel
  const handleExportEmployees = () => {
    if (!employees || employees.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay empleados para exportar",
        variant: "destructive",
      });
      return;
    }

    // Preparar datos para export (con nombres de columnas en español)
    const exportData = employees.map(emp => ({
      'ID Glovo': emp.idGlovo,
      'Email Glovo': emp.emailGlovo,
      'Turno': emp.turno,
      'Nombre': emp.nombre,
      'Apellido': emp.apellido,
      'Teléfono': emp.telefono,
      'Email': emp.email,
      'Horas': emp.horas,
      'CDP%': emp.horas ? Math.round((emp.horas / 38) * 100) : null,
      'Complementarios': emp.complementaries,
      'Ciudad': emp.ciudad,
      'Código Ciudad': emp.cityCode,
      'DNI/NIE': emp.dniNie,
      'IBAN': emp.iban,
      'Dirección': emp.direccion,
      'Vehículo': emp.vehiculo,
      'NAF': emp.naf,
      'Fecha Alta Seg. Social': emp.fechaAltaSegSoc ? new Date(emp.fechaAltaSegSoc).toLocaleDateString('es-ES') : '',
      'Status Baja': emp.statusBaja,
      'Estado SS': emp.estadoSs,
      'Informado Horario': emp.informadoHorario ? 'Sí' : 'No',
      'Cuenta Divilo': emp.cuentaDivilo,
      'Próxima Asignación Slots': emp.proximaAsignacionSlots ? new Date(emp.proximaAsignacionSlots).toLocaleDateString('es-ES') : '',
      'Jefe Tráfico': emp.jefeTrafico,
      'Comentarios Jefe Tráfico': emp.comentsJefeDeTrafico,
      'Incidencias': emp.incidencias,
      'Fecha Incidencia': emp.fechaIncidencia ? new Date(emp.fechaIncidencia).toLocaleDateString('es-ES') : '',
      'Faltas No Check-in (días)': emp.faltasNoCheckInEnDias,
      'Cruce': emp.cruce,
      'Flota': emp.flota,
      'Estado': emp.status === 'active' ? 'Activo' : 
               emp.status === 'it_leave' ? 'Baja IT' : 
               emp.status === 'company_leave_pending' ? 'Baja Empresa Pendiente' :
               emp.status === 'company_leave_approved' ? 'Baja Empresa Aprobada' : emp.status,
      'Fecha Creación': emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('es-ES') : '',
      'Última Actualización': emp.updatedAt ? new Date(emp.updatedAt).toLocaleDateString('es-ES') : ''
    }));

    const fileName = `empleados_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, fileName, 'Empleados');
    
    toast({
      title: "Exportación completada",
      description: `Se han exportado ${employees.length} empleados a Excel`,
    });
  };

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setCityFilter("all");
    setStatusFilter("all");
    setFlotaFilter("all");
  };

  // Función para descargar plantilla de carga masiva
  const handleDownloadTemplate = () => {
    const headers = [
      'idGlovo',
      'emailGlovo',
      'turno',
      'nombre',
      'apellido',
      'telefono',
      'email',
      'horas',
      'cdp',
      'complementaries',
      'ciudad',
      'cityCode',
      'dniNie',
      'iban',
      'direccion',
      'vehiculo',
      'naf',
      'fechaAltaSegSoc',
      'statusBaja',
      'estadoSs',
      'informadoHorario',
      'cuentaDivilo',
      'proximaAsignacionSlots',
      'jefeTrafico',
      'comentsJefeDeTrafico',
      'incidencias',
      'fechaIncidencia',
      'faltasNoCheckInEnDias',
      'cruce',
      'flota',
      'status'
    ];
    
    createExcelTemplate(headers, 'plantilla_empleados', 'Plantilla Empleados');
    
    toast({
      title: "Plantilla descargada",
      description: "La plantilla para carga masiva ha sido descargada",
    });
  };



  if (isLoading || employeesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Gestión de Empleados</h2>
            <p className="mt-1 text-sm text-gray-600">Administra la información de los empleados</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            {/* Botón Descargar Plantilla - Solo Admin y Super Admin */}
            {canDownloadTemplate && (
              <Button 
                variant="outline" 
                onClick={handleDownloadTemplate}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Plantilla Excel
              </Button>
            )}
            
            {/* Botón Importar Empleados - Solo Super Admin */}
            {canImportEmployees && (
              <Button 
                variant="outline" 
                onClick={() => setIsImportModalOpen(true)}
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
            )}
            
            {/* Botón Exportar - Solo Admin y Super Admin */}
            {canExportEmployees && (
              <Button 
                variant="outline" 
                onClick={handleExportEmployees}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            )}
            
            {/* Botón Agregar Empleado - Solo Admin y Super Admin */}
            {canEditEmployees && (
              <Button onClick={handleAddEmployee}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Empleado
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
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Nombre, apellido, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities?.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="it_leave">Baja IT</SelectItem>
                  <SelectItem value="company_leave_pending">Baja Empresa Pendiente</SelectItem>
                  <SelectItem value="company_leave_approved">Baja Empresa Aprobada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="flota-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Flota
              </label>
              <Select value={flotaFilter} onValueChange={setFlotaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las flotas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las flotas</SelectItem>
                  {flotas?.map((flota) => (
                    <SelectItem key={flota} value={flota}>
                      {flota}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Botón para limpiar filtros */}
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <EmployeeTable
        employees={employees ?? []}
        onEditEmployee={handleEditEmployee}
        onManageLeave={handleManageLeave}
        onViewDetails={handleViewDetails}
        canEdit={canEditEmployees}
        isReadOnlyUser={isReadOnlyUser}
      />

      {/* Modals */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSave={(data) => {
          if (selectedEmployee) {
            updateEmployeeMutation.mutate({ id: selectedEmployee.idGlovo, data });
          } else {
            createEmployeeMutation.mutate(data);
          }
        }}
        isLoading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
      />

      <LeaveManagementModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />

      <ImportEmployeesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
      />

      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailEmployee(null);
        }}
        employee={detailEmployee}
        onEmployeeUpdate={() => {
          // Refrescar la lista de empleados después de reactivar
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }}
      />
    </div>
  );
}
