import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from "lucide-react";

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProcessedEmployee {
  idGlovo: string;
  emailGlovo?: string;
  turno?: string;
  nombre: string;
  apellido?: string;
  telefono: string;
  email?: string;
  horas?: number;
  complementaries?: string;
  ciudad?: string;
  cityCode?: string;
  dniNie?: string;
  iban?: string;
  direccion?: string;
  vehiculo?: string;
  naf?: string;
  fechaAltaSegSoc?: string;
  statusBaja?: string;
  estadoSs?: string;
  informadoHorario?: boolean;
  cuentaDivilo?: string;
  proximaAsignacionSlots?: string;
  jefeTrafico?: string;
  comentsJefeDeTrafico?: string;
  incidencias?: string;
  fechaIncidencia?: string;
  faltasNoCheckInEnDias?: number;
  cruce?: string;
  status?: string;
}

export default function ImportEmployeesModal({
  isOpen,
  onClose,
}: ImportEmployeesModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedEmployee[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const importMutation = useMutation({
    mutationFn: async (employees: ProcessedEmployee[]) => {
      await apiRequest("POST", "/api/employees/bulk-import", { employees });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Importación completada",
        description: `Se han importado ${processedData.length} empleados correctamente`,
      });
      onClose();
      resetState();
    },
    onError: (error: any) => {
      
      
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
      
      // Mejorar el manejo de errores específicos
      let errorMessage = "No se pudo completar la importación";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Si el error contiene información específica sobre campos
      if (errorMessage.includes("value too long")) {
        errorMessage = "Algunos campos contienen valores demasiado largos. Verifique los datos del Excel.";
      } else if (errorMessage.includes("violates")) {
        errorMessage = "Error de validación en los datos. Verifique el formato del Excel.";
      }
      
      toast({
        title: "Error en importación",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetState = () => {
    setProcessedData([]);
    setErrors([]);
    setProgress(0);
    setIsProcessing(false);
  };

  const processExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(10);

      const data = await file.arrayBuffer();
      setProgress(30);

      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setProgress(50);

      const processed: ProcessedEmployee[] = [];
      const newErrors: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        try {
  
          
          // Función helper para truncar y limpiar strings
          const cleanString = (value: any, maxLength: number = 255): string => {
            if (!value || value === "" || value === "null" || value === "undefined") {
              return "";
            }
            const cleaned = String(value).trim();
            if (cleaned.length > maxLength) {
  
              return cleaned.substring(0, maxLength);
            }
            return cleaned;
          };
          
          // Mapear campos del Excel a nuestro schema con validación de longitud
          const employee: ProcessedEmployee = {
            idGlovo: cleanString(row['ID Glovo'], 50),
            emailGlovo: cleanString(row['Email Glovo'], 100),
            turno: cleanString(row['Turno'], 50),
            nombre: cleanString(row['Nombre'], 100),
            apellido: cleanString(row['Apellido'], 100),
            telefono: cleanString(row['Teléfono'], 30), // Ampliado a 30
            email: cleanString(row['Email'], 100),
            horas: row['Horas'] ? Number(row['Horas']) : undefined,
            complementaries: cleanString(row['Complementarios']),
            ciudad: cleanString(row['Ciudad'], 100),
            cityCode: cleanString(row['Código Ciudad'], 30), // Ampliado a 30
            dniNie: cleanString(row['DNI/NIE'], 30), // Ampliado a 30
            iban: cleanString(row['IBAN'], 34),
            direccion: cleanString(row['Dirección'], 255),
            vehiculo: cleanString(row['Vehículo'], 50),
            naf: cleanString(row['NAF'], 30), // Ampliado a 30
            fechaAltaSegSoc: cleanString(row['Fecha Alta Seg. Social (AAAA-MM-DD)']),
            statusBaja: cleanString(row['Status Baja'], 100), // Ampliado a 100
            estadoSs: cleanString(row['Estado SS'], 100), // Ampliado a 100
            informadoHorario: row['Informado Horario (true/false)'] === 'true' || row['Informado Horario (true/false)'] === true,
            cuentaDivilo: cleanString(row['Cuenta Divilo'], 100),
            proximaAsignacionSlots: cleanString(row['Próxima Asignación Slots (AAAA-MM-DD)']),
            jefeTrafico: cleanString(row['Jefe Tráfico'], 100),
            comentsJefeDeTrafico: cleanString(row['Comentarios Jefe Tráfico']),
            incidencias: cleanString(row['Incidencias']),
            fechaIncidencia: cleanString(row['Fecha Incidencia (AAAA-MM-DD)']),
            faltasNoCheckInEnDias: row['Faltas No Check-in (días)'] ? Number(row['Faltas No Check-in (días)']) : 0,
            cruce: cleanString(row['Cruce']),
            status: cleanString(row['Estado (active/it_leave/company_leave_pending/company_leave_approved)']) || 'active',
          };

          // Validar campos requeridos
          if (!employee.idGlovo || !employee.nombre || !employee.telefono) {
            newErrors.push(`Fila ${index + 2}: Faltan campos requeridos (ID Glovo: "${employee.idGlovo}", Nombre: "${employee.nombre}", Teléfono: "${employee.telefono}")`);
            return;
          }

          // Validar longitudes específicas después de limpieza
          if (employee.telefono && employee.telefono.length > 30) {
            newErrors.push(`Fila ${index + 2}: Teléfono demasiado largo (${employee.telefono.length} caracteres, máximo 30)`);
            return;
          }

          
          processed.push(employee);
        } catch (error) {

          newErrors.push(`Fila ${index + 2}: Error procesando datos - ${error}`);
        }
      });

      setProgress(80);
      setProcessedData(processed);
      setErrors(newErrors);
      setProgress(100);

      if (processed.length === 0) {
        throw new Error("No se pudieron procesar empleados válidos");
      }

    } catch (error) {
      toast({
        title: "Error procesando archivo",
        description: `Error: ${error}`,
        variant: "destructive",
      });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Formato incorrecto",
        description: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
        variant: "destructive",
      });
      return;
    }

    processExcelFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleImport = () => {
    if (processedData.length === 0) return;
    importMutation.mutate(processedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Empleados desde Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Area de drag & drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arrastra tu archivo Excel aquí
            </h3>
            <p className="text-gray-600 mb-4">
              O haz clic para seleccionar un archivo
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              Seleccionar archivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Procesando archivo...</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Resultados */}
          {processedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">
                  {processedData.length} empleados listos para importar
                </span>
              </div>

              {errors.length > 0 && (
                <div className="space-y-2 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">
                      {errors.length} errores encontrados:
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {errors.map((error, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={importMutation.isPending}>
              Cancelar
            </Button>
            {processedData.length > 0 && (
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {importMutation.isPending ? "Importando..." : `Importar ${processedData.length} empleados`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 