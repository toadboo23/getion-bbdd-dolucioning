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
  const [leaveType, setLeaveType] = useState<"it" | "company" | "">("");
  const [itReason, setItReason] = useState<"enfermedad" | "accidente" | "">("");
  const [companyReason, setCompanyReason] = useState<"despido" | "voluntaria" | "nspp" | "anulacion" | "">("");
  const [leaveDate, setLeaveDate] = useState("");

  const itLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!employee) throw new Error("No employee selected");
      await apiRequest("POST", `/api/employees/${employee.id}/it-leave`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Baja IT procesada",
        description: "La baja IT ha sido procesada correctamente",
      });
      onClose();
      resetForm();
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
        description: "No se pudo procesar la baja IT",
        variant: "destructive",
      });
    },
  });

  const companyLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!employee) throw new Error("No employee selected");
      await apiRequest("POST", `/api/employees/${employee.id}/company-leave`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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
        description: "No se pudo crear la solicitud de baja empresa",
        variant: "destructive",
      });
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
      itLeaveMutation.mutate({
        leaveType: itReason,
        leaveDate: new Date(leaveDate),
      });
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
                  Empleado: {employee.firstName} {employee.lastName}
                </h4>
                <p className="text-sm text-gray-600">Puesto: {employee.position}</p>
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
