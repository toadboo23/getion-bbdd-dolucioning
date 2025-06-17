import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/modals/confirmation-modal";
import { AlertTriangle, Info, Check, X } from "lucide-react";
import { useState } from "react";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Redirect if not authenticated or not super admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "super_admin")) {
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
  }, [isAuthenticated, isLoading, user, toast]);

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

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Baja aprobada",
        description: "La baja ha sido aprobada correctamente",
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
        description: "No se pudo aprobar la baja",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Baja rechazada",
        description: "La baja ha sido rechazada",
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
        description: "No se pudo rechazar la baja",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (notification: Notification) => {
    setConfirmationModal({
      isOpen: true,
      title: "Aprobar Baja",
      message: `¿Estás seguro de que deseas aprobar la baja de ${notification.employeeName}?`,
      onConfirm: () => {
        approveMutation.mutate(notification.id);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReject = (notification: Notification) => {
    setConfirmationModal({
      isOpen: true,
      title: "Rechazar Baja",
      message: `¿Estás seguro de que deseas rechazar la baja de ${notification.employeeName}?`,
      onConfirm: () => {
        rejectMutation.mutate(notification.id);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
      case "approved":
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Aprobado</span>;
      case "rejected":
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rechazado</span>;
      case "processed":
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Procesado</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Panel de Notificaciones</h2>
        <p className="mt-1 text-sm text-gray-600">Gestiona las notificaciones del sistema</p>
      </div>

      <div className="space-y-4">
        {notifications?.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === "company_leave_request" ? "bg-yellow-100" :
                    notification.type === "employee_update" ? "bg-blue-100" : "bg-green-100"
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">{notification.title}</h4>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(notification.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(notification.createdAt!).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    {notification.employeeName && (
                      <p className="text-sm text-gray-600">
                        <strong>Empleado:</strong> {notification.employeeName}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <strong>Solicitado por:</strong> {notification.requestedBy}
                    </p>
                    {notification.metadata && notification.type === "company_leave_request" && (
                      <>
                        <p className="text-sm text-gray-600">
                          <strong>Tipo:</strong> {(notification.metadata as any).leaveType}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Fecha:</strong> {new Date((notification.metadata as any).leaveDate).toLocaleDateString('es-ES')}
                        </p>
                      </>
                    )}
                  </div>
                  {notification.status === "pending" && notification.type === "company_leave_request" && (
                    <div className="mt-4 flex space-x-3">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(notification)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(notification)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!notifications || notifications.length === 0) && (
          <Card>
            <CardContent className="p-6 text-center">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
              <p className="text-gray-600">No tienes notificaciones pendientes en este momento.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}
