import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Info, Check, X, Filter, Calendar, FileText, Clock, CheckCircle, XCircle, Settings, Download } from "lucide-react";
import type { Notification } from "@shared/schema";
import * as XLSX from 'xlsx';

export default function Notifications() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Función para aplicar filtro al hacer clic en las tarjetas de métricas
  const handleMetricCardClick = (status: string) => {
    setStatusFilter(status);
    
    // Mostrar toast de confirmación
    const statusNames = {
      pending: "Pendientes",
      approved: "Tramitadas", 
      rejected: "Rechazadas",
      processed: "Procesadas"
    };
    
    toast({
      title: "Filtro aplicado",
      description: `Mostrando solo notificaciones ${statusNames[status as keyof typeof statusNames]}`,
      duration: 2000,
    });
    
    // Scroll automático a la sección de filtros para que el usuario vea el cambio
    setTimeout(() => {
      const filtersSection = document.getElementById('filters-section');
      if (filtersSection) {
        filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Estado para el modal de tramitación
  const [tramitationModal, setTramitationModal] = useState<TramitationModalState>({
    isOpen: false,
    action: "approve",
    notification: null,
    processingDate: new Date().toISOString().split('T')[0] // Fecha actual por defecto
  });

  // Estado para el modal de pendiente laboral
  const [pendienteLaboralModal, setPendienteLaboralModal] = useState<PendienteLaboralModalState>({
    isOpen: false,
    notification: null,
    processingDate: new Date().toISOString().split('T')[0] // Fecha actual por defecto
  });

  // Definir permisos específicos por rol
  const canProcessNotifications = user?.role === "super_admin"; // Solo super admin puede procesar
  const canViewNotifications = user?.role === "admin" || user?.role === "super_admin"; // Admin y super admin pueden ver
  const canExportNotifications = user?.role === "super_admin"; // Solo super admin puede exportar
  const isReadOnlyUser = user?.role === "normal";

  // Redirect if not authenticated or not authorized to view notifications
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !canViewNotifications)) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para acceder a esta sección",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, canViewNotifications, toast]);

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
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
      }
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, action, processingDate }: { id: number, action: "approve" | "reject", processingDate: string }) => {
      await apiRequest("POST", `/api/notifications/${id}/process`, { 
        action, 
        processingDate: new Date(processingDate).toISOString()
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-leaves"] });
      
      const actionText = variables.action === "approve" ? "tramitada" : "rechazada";
      toast({
        title: `Baja ${actionText}`,
        description: `La baja ha sido ${actionText} correctamente con fecha ${new Date(variables.processingDate).toLocaleDateString('es-ES')}`,
      });
      
      // Cerrar modal
      setTramitationModal(prev => ({ ...prev, isOpen: false }));
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
        description: "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    },
  });

  // Mutación para cambiar a pendiente laboral
  const pendienteLaboralMutation = useMutation({
    mutationFn: async ({ notificationId, processingDate }: { notificationId: number, processingDate: string }) => {
      await apiRequest("POST", `/api/notifications/${notificationId}/pendiente-laboral`, {
        processingDate: new Date(processingDate).toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      toast({
        title: "Estado actualizado",
        description: "La solicitud ha sido movida a Pendiente Laboral",
      });
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
        description: "No se pudo actualizar el estado de la notificación",
        variant: "destructive",
      });
    },
  });

  // Función para abrir modal de tramitación
  const handleTramitar = (notification: Notification, action: "approve" | "reject") => {
    setTramitationModal({
      isOpen: true,
      notification,
      action,
      processingDate: new Date().toISOString().split('T')[0], // Fecha de hoy
      });
  };

  // Función para exportar notificaciones a Excel
  const handleExportNotifications = () => {
    if (!notifications || notifications.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay notificaciones para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Preparar datos para exportar con nombres de columnas en español
      const exportData = notifications.map(notif => ({
        'ID': notif.id,
        'Tipo': notif.type === 'company_leave_request' ? 'Solicitud de Baja Empresa' : 
               notif.type === 'employee_update' ? 'Actualización de Empleado' : 
               notif.type === 'bulk_upload' ? 'Carga Masiva' : notif.type,
        'Título': notif.title,
        'Mensaje': notif.message,
        'Solicitado por': notif.requestedBy,
        'Estado': notif.status === 'pending' ? 'Pendiente' :
                 notif.status === 'pendiente_laboral' ? 'Pendiente Laboral' :
                 notif.status === 'approved' ? 'Tramitada' :
                 notif.status === 'rejected' ? 'Rechazada' :
                 notif.status === 'processed' ? 'Procesada' : notif.status,
        'Fecha de Creación': notif.createdAt ? new Date(notif.createdAt).toLocaleString('es-ES') : 'N/A',
        'Fecha de Actualización': notif.updatedAt ? new Date(notif.updatedAt).toLocaleString('es-ES') : 'N/A',
        'Fecha de Procesamiento': notif.processingDate ? new Date(notif.processingDate).toLocaleString('es-ES') : 'N/A',
        'Empleado': (notif.metadata as any)?.employeeName || 'N/A',
        'Tipo de Baja': (notif.metadata as any)?.leaveType || 'N/A',
        'ID Empleado': (notif.metadata as any)?.employeeId || 'N/A',
        'Metadatos': notif.metadata ? JSON.stringify(notif.metadata, null, 2) : 'N/A'
      }));

      // Crear el archivo Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Notificaciones");

      // Generar nombre de archivo con fecha
      const date = new Date().toISOString().split('T')[0];
      const fileName = `notificaciones_${date}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${notifications.length} notificaciones a ${fileName}`,
      });
    } catch (error) {
      console.error("Error al exportar notificaciones:", error);
      toast({
        title: "Error en la exportación",
        description: "No se pudo exportar las notificaciones",
        variant: "destructive",
      });
    }
  };

  // Función para confirmar tramitación
  const handleConfirmTramitacion = () => {
    if (!tramitationModal.notification || !tramitationModal.processingDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha de tramitación",
        variant: "destructive",
      });
      return;
    }

    processMutation.mutate({
      id: tramitationModal.notification.id,
      action: tramitationModal.action,
      processingDate: tramitationModal.processingDate,
    });
  };

  // Función para cambiar a pendiente laboral
  const handlePendienteLaboral = (notification: Notification) => {
    setPendienteLaboralModal({
      isOpen: true,
      notification,
      processingDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleConfirmPendienteLaboral = () => {
    if (!pendienteLaboralModal.notification || !pendienteLaboralModal.processingDate) return;

    const notificationId = pendienteLaboralModal.notification.id;
    const processingDate = pendienteLaboralModal.processingDate;

    pendienteLaboralMutation.mutate({ notificationId, processingDate });
    setPendienteLaboralModal(prev => ({ ...prev, isOpen: false }));
  };

  // Filtrar notificaciones
  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];

    return notifications.filter(notification => {
      // Filtro por estado
      if (statusFilter !== "all" && notification.status !== statusFilter) {
        return false;
      }

      // Filtro por tipo
      if (typeFilter !== "all" && notification.type !== typeFilter) {
        return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          notification.title,
          notification.message,
          notification.requestedBy,
          (notification.metadata as any)?.employeeName || "",
          (notification.metadata as any)?.leaveType || "",
        ].join(" ").toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }, [notifications, statusFilter, typeFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      case "processed":
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Settings className="w-3 h-3 mr-1" />
            Procesada
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "company_leave_request":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "employee_update":
        return <Info className="w-6 h-6 text-blue-600" />;
      case "bulk_upload":
        return <Info className="w-6 h-6 text-green-600" />;
      default:
        return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  if (isLoading || notificationsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Obtener estadísticas para los filtros
  const notificationStats = useMemo(() => {
    if (!notifications) return { pending: 0, pendiente_laboral: 0, approved: 0, rejected: 0, processed: 0 };
    
    return notifications.reduce((stats, notif) => {
      stats[notif.status as keyof typeof stats] = (stats[notif.status as keyof typeof stats] || 0) + 1;
      return stats;
    }, { pending: 0, pendiente_laboral: 0, approved: 0, rejected: 0, processed: 0 });
  }, [notifications]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Panel de Notificaciones</h2>
            <p className="mt-2 text-gray-600">Gestiona y tramita las solicitudes de baja empresa</p>
          </div>
          
          {/* Botón Exportar Notificaciones - Solo Super Admin */}
          {canExportNotifications && (
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={handleExportNotifications}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Notificaciones
              </Button>
            </div>
          )}
        </div>
        
        {/* Mensaje de permisos según el rol */}
        <div className="mt-3">
          {canProcessNotifications && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <p className="text-sm text-green-700">
                ✅ <strong>Super Admin</strong> - Puedes ver y tramitar todas las notificaciones
              </p>
            </div>
          )}
          
          {!canProcessNotifications && user?.role === "admin" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-700">
                👁️ <strong>Admin</strong> - Puedes ver todas las notificaciones pero no tramitarlas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ESTADÍSTICAS RÁPIDAS - CLICABLES */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card 
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          onClick={() => handleMetricCardClick('pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-700">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{notificationStats.pending}</p>
                <p className="text-xs text-yellow-600 mt-1">Clic para filtrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          onClick={() => handleMetricCardClick('pendiente_laboral')}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-700">Pendiente Laboral</p>
                <p className="text-2xl font-bold text-orange-900">{notificationStats.pendiente_laboral}</p>
                <p className="text-xs text-orange-600 mt-1">Clic para filtrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          onClick={() => handleMetricCardClick('approved')}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-700">Tramitadas</p>
                <p className="text-2xl font-bold text-green-900">{notificationStats.approved}</p>
                <p className="text-xs text-green-600 mt-1">Clic para filtrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          onClick={() => handleMetricCardClick('rejected')}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700">Rechazadas</p>
                <p className="text-2xl font-bold text-red-900">{notificationStats.rejected}</p>
                <p className="text-xs text-red-600 mt-1">Clic para filtrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          onClick={() => handleMetricCardClick('processed')}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-700">Procesadas</p>
                <p className="text-2xl font-bold text-blue-900">{notificationStats.processed}</p>
                <p className="text-xs text-blue-600 mt-1">Clic para filtrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS */}
      <Card id="filters-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por empleado, tipo, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="mt-1">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="pendiente_laboral">Pendiente Laboral</SelectItem>
                  <SelectItem value="approved">Tramitadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type-filter">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter" className="mt-1">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="company_leave_request">Solicitudes de Baja Empresa</SelectItem>
                  <SelectItem value="employee_update">Actualizaciones de Empleado</SelectItem>
                  <SelectItem value="bulk_upload">Cargas Masivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE NOTIFICACIONES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Notificaciones ({filteredNotifications.length})
          </h3>
          {searchQuery || statusFilter !== "all" || typeFilter !== "all" ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Filtros activos: {[
                  searchQuery ? "Búsqueda" : null,
                  statusFilter !== "all" ? "Estado" : null,
                  typeFilter !== "all" ? "Tipo" : null
                ].filter(Boolean).join(", ")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                Limpiar Filtros
              </Button>
            </div>
          ) : null}
      </div>

      <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card key={notification.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.type === "company_leave_request" ? "bg-yellow-100" :
                    notification.type === "employee_update" ? "bg-blue-100" : "bg-green-100"
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{notification.title}</h4>
                      <div className="flex items-center space-x-3">
                      {getStatusBadge(notification.status)}
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                        {new Date(notification.createdAt!).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-700">{notification.message}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {notification.metadata && (notification.metadata as any).employeeName && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Empleado</p>
                            <p className="text-sm text-gray-900">{(notification.metadata as any).employeeName}</p>
                          </div>
                    )}
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Solicitado por</p>
                          <p className="text-sm text-gray-900">{notification.requestedBy}</p>
                        </div>
                        
                    {notification.metadata && notification.type === "company_leave_request" && (
                      <>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700">Tipo de Baja</p>
                              <p className="text-sm text-gray-900 capitalize">{(notification.metadata as any).leaveType}</p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700">Fecha Solicitada</p>
                              <p className="text-sm text-gray-900">
                                {new Date((notification.metadata as any).leaveDate).toLocaleDateString('es-ES')}
                        </p>
                            </div>
                      </>
                    )}
                  </div>
                    </div>
                    
                  {notification.status === "pending" && notification.type === "company_leave_request" && (
                    <div className="flex space-x-3 pt-3 border-t border-gray-200">
                      {/* Botones de tramitación - Solo Super Admin */}
                      {canProcessNotifications && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handlePendienteLaboral(notification)}
                            disabled={pendienteLaboralMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Pasar a Pendiente Laboral
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleTramitar(notification, "reject")}
                            disabled={processMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                        </>
                      )}
                      
                      {/* Mensaje para usuarios sin permisos de procesamiento */}
                      {!canProcessNotifications && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                          <p className="text-sm text-blue-700">
                            👁️ Solo puedes ver - Requiere permisos de Super Admin para tramitar
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {notification.status === "pendiente_laboral" && notification.type === "company_leave_request" && (
                    <div className="flex space-x-3 pt-3 border-t border-gray-200">
                      {/* Botones de tramitación - Solo Super Admin */}
                      {canProcessNotifications && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleTramitar(notification, "approve")}
                            disabled={processMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Tramitar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleTramitar(notification, "reject")}
                            disabled={processMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                        </>
                      )}
                      
                      {/* Mensaje para usuarios sin permisos de procesamiento */}
                      {!canProcessNotifications && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                          <p className="text-sm text-blue-700">
                            👁️ Solo puedes ver - Requiere permisos de Super Admin para tramitar
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

          {filteredNotifications.length === 0 && (
          <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all" 
                    ? "No se encontraron notificaciones"
                    : "No hay notificaciones"
                  }
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "Intenta ajustar los filtros o la búsqueda para encontrar las notificaciones que buscas."
                    : "No tienes notificaciones pendientes en este momento. Las nuevas solicitudes aparecerán aquí."
                  }
                </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* MODAL DE TRAMITACIÓN */}
      <Dialog 
        open={tramitationModal.isOpen} 
        onOpenChange={(open) => !open && setTramitationModal(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {tramitationModal.action === "approve" ? "Tramitar Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
          </DialogHeader>

          {tramitationModal.notification && (
            <div className="space-y-6">
              {/* Información de la solicitud */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Detalles de la Solicitud</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Empleado:</strong> {(tramitationModal.notification.metadata as any)?.employeeName || "N/A"}</p>
                  <p><strong>Tipo:</strong> {(tramitationModal.notification.metadata as any)?.leaveType || "N/A"}</p>
                  <p><strong>Solicitado por:</strong> {tramitationModal.notification.requestedBy}</p>
                </div>
      </div>

              {/* Selector de fecha */}
              <div>
                <Label htmlFor="processing-date" className="text-base font-medium">
                  Fecha de {tramitationModal.action === "approve" ? "Tramitación" : "Rechazo"}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Selecciona la fecha en que se {tramitationModal.action === "approve" ? "tramita" : "rechaza"} esta solicitud
                </p>
                <Input
                  id="processing-date"
                  type="date"
                  value={tramitationModal.processingDate}
                  onChange={(e) => setTramitationModal(prev => ({ ...prev, processingDate: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Mensaje de confirmación */}
              <div className={`p-4 rounded-lg ${
                tramitationModal.action === "approve" 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-red-50 border border-red-200"
              }`}>
                <p className={`text-sm ${
                  tramitationModal.action === "approve" ? "text-green-800" : "text-red-800"
                }`}>
                  {tramitationModal.action === "approve" 
                    ? "⚠️ Al tramitar esta solicitud, el empleado será movido de la tabla de empleados activos a la tabla de bajas empresa."
                    : "⚠️ Al rechazar esta solicitud, se registrará el rechazo pero el empleado permanecerá como activo."
                  }
                </p>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTramitationModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={processMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmTramitacion}
                  disabled={processMutation.isPending || !tramitationModal.processingDate}
                  className={tramitationModal.action === "approve" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                  }
                >
                  {processMutation.isPending ? "Procesando..." : (
                    tramitationModal.action === "approve" ? "Tramitar" : "Rechazar"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE PENDIENTE LABORAL */}
      <Dialog 
        open={pendienteLaboralModal.isOpen} 
        onOpenChange={(open) => !open && setPendienteLaboralModal(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Pasar a Pendiente Laboral
            </DialogTitle>
          </DialogHeader>

          {pendienteLaboralModal.notification && (
            <div className="space-y-6">
              {/* Información de la solicitud */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Detalles de la Solicitud</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Empleado:</strong> {(pendienteLaboralModal.notification.metadata as any)?.employeeName || "N/A"}</p>
                  <p><strong>Tipo:</strong> {(pendienteLaboralModal.notification.metadata as any)?.leaveType || "N/A"}</p>
                  <p><strong>Solicitado por:</strong> {pendienteLaboralModal.notification.requestedBy}</p>
                </div>
              </div>

              {/* Selector de fecha */}
              <div>
                <Label htmlFor="pendiente-laboral-date" className="text-base font-medium">
                  Fecha de Paso a Pendiente Laboral
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Selecciona la fecha en que se pasa esta solicitud a pendiente laboral
                </p>
                <Input
                  id="pendiente-laboral-date"
                  type="date"
                  value={pendienteLaboralModal.processingDate}
                  onChange={(e) => setPendienteLaboralModal(prev => ({ ...prev, processingDate: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Mensaje de confirmación */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  ⚠️ Al pasar esta solicitud a pendiente laboral, se registrará esta acción y estará lista para tramitación final.
                </p>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendienteLaboralModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={pendienteLaboralMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPendienteLaboral}
                  disabled={pendienteLaboralMutation.isPending || !pendienteLaboralModal.processingDate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {pendienteLaboralMutation.isPending ? "Procesando..." : "Pasar a Pendiente Laboral"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
