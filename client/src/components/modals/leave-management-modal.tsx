import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Employee } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";

interface LeaveManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function LeaveManagementModal({
  isOpen,
  onClose,
  employee,
}: LeaveManagementModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState<"it" | "company" | "">("");
  const [itReason, setItReason] = useState<"enfermedad" | "accidente" | "">("");
  const [companyReason, setCompanyReason] = useState<"despido" | "voluntaria" | "nspp" | "anulacion" | "">("");
  const [leaveDate, setLeaveDate] = useState("");

  const itLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!employee) throw new Error("No employee selected");
      console.log('🚀 [MUTATION] Enviando request baja IT:', {
        url: `/api/employees/${employee.idGlovo}/it-leave`,
        data,
        employeeId: employee.idGlovo
      });
      const response = await apiRequest("POST", `/api/employees/${employee.idGlovo}/it-leave`, data);
      console.log('✅ [MUTATION] Response baja IT:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('🎉 [MUTATION] Baja IT exitosa, invalidando queries...');
      
      // Invalidar TODAS las queries relacionadas con empleados
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      // Forzar refetch inmediato con opciones específicas
      queryClient.refetchQueries({ 
        queryKey: ["/api/employees"],
        type: 'active'
      });
      
      // También invalidar queries con filtros específicos
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "/api/employees"
      });
      
      console.log('🔄 [MUTATION] Queries invalidadas y refetch ejecutado');
      
      // Pequeño delay para asegurar que el backend haya procesado
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/employees"] });
        console.log('🔄 [MUTATION] Refetch adicional ejecutado después de delay');
      }, 100);
      
      toast({
        title: "✅ Baja IT procesada",
        description: `La baja IT ha sido procesada correctamente. Estado del empleado actualizado a "Baja IT".`,
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ [MUTATION] Error en baja IT:', error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sin autorización",
          description: "Sesión expirada. Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage = error?.message || error?.data?.message || "Error desconocido";
      toast({
        title: "❌ Error al procesar baja IT",
        description: `No se pudo procesar la baja IT: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const companyLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!employee) throw new Error("No employee selected");
      await apiRequest("POST", `/api/employees/${employee.idGlovo}/company-leave`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Solicitud de baja empresa enviada",
        description: "La solicitud ha sido enviada para aprobación del Super Admin",
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear la solicitud de baja empresa",
          variant: "destructive",
        });
      }
    },
  });

  const resetForm = () => {
    setLeaveType("");
    setItReason("");
    setCompanyReason("");
    setLeaveDate("");
  };

  const handleSubmit = () => {
    if (!leaveType || !leaveDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (leaveType === "it") {
      if (!itReason) {
        toast({
          title: "Error",
          description: "Por favor selecciona el motivo de la baja IT",
          variant: "destructive",
        });
        return;
      }
      const itLeaveData = {
        leaveType: itReason,
        leaveDate: new Date(leaveDate),
      };
      console.log('🚀 [FRONTEND] Enviando datos de baja IT:', itLeaveData);
      console.log('🚀 [FRONTEND] Empleado ID:', employee?.idGlovo);
      itLeaveMutation.mutate(itLeaveData);
    } else if (leaveType === "company") {
      if (!companyReason) {
        toast({
          title: "Error",
          description: "Por favor selecciona el motivo de la baja empresa",
          variant: "destructive",
        });
        return;
      }
      companyLeaveMutation.mutate({
        leaveType: companyReason,
        leaveDate: leaveDate,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestionar Baja</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {employee && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Empleado: {employee.nombre} {employee.apellido || ""}
                </h4>
                <p className="text-sm text-gray-600">ID Glovo: {employee.idGlovo}</p>
                <p className="text-sm text-gray-600">Teléfono: {employee.telefono}</p>
              </CardContent>
            </Card>
          )}

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Tipo de Baja
            </Label>
            <RadioGroup value={leaveType} onValueChange={(value: "it" | "company") => setLeaveType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="it" id="it" />
                <Label htmlFor="it">Baja IT</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company">Baja Empresa</Label>
              </div>
            </RadioGroup>
          </div>

          {/* IT Leave Options */}
          {leaveType === "it" && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Motivo Baja IT
              </Label>
              <RadioGroup value={itReason} onValueChange={(value: "enfermedad" | "accidente") => setItReason(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enfermedad" id="enfermedad" />
                  <Label htmlFor="enfermedad">Enfermedad</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accidente" id="accidente" />
                  <Label htmlFor="accidente">Accidente</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Company Leave Options */}
          {leaveType === "company" && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Motivo Baja Empresa
              </Label>
              <RadioGroup value={companyReason} onValueChange={(value: "despido" | "voluntaria" | "nspp" | "anulacion") => setCompanyReason(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="despido" id="despido" />
                  <Label htmlFor="despido">Despido</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="voluntaria" id="voluntaria" />
                  <Label htmlFor="voluntaria">Baja Voluntaria</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nspp" id="nspp" />
                  <Label htmlFor="nspp">NSPP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anulacion" id="anulacion" />
                  <Label htmlFor="anulacion">Anulación</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div>
            <Label htmlFor="leaveDate" className="text-sm font-medium text-gray-700">
              Fecha de Baja
            </Label>
            <Input
              id="leaveDate"
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={itLeaveMutation.isPending || companyLeaveMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={itLeaveMutation.isPending || companyLeaveMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {itLeaveMutation.isPending || companyLeaveMutation.isPending
                ? "Procesando..."
                : "Procesar Baja"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
