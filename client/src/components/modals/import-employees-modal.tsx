import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

interface ProcessedEmployee {
  idGlovo: string;
  emailGlovo?: string;
  turno?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  horas?: number | null;
  cdp?: number | null;
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
  flota?: string;
  status?: string;
}

export default function ImportEmployeesModal({
  isOpen,
  onClose,
  onImported,
}: ImportEmployeesModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedEmployee[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isReadyToImport, setIsReadyToImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (data: { employees: ProcessedEmployee[] }) => {
      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import employees');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${processedData.length} empleados correctamente`,
      });
      if (onImported) onImported();
      onClose();
    },
    onError: (error: unknown) => {
      let errorMessage = "Error desconocido al importar empleados";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
    setIsReadyToImport(false);
  };

  const processExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(10);

      // 1. Obtener empleados actuales de la base de datos
      const empleadosResponse = await fetch('/api/employees');
      const empleadosDB = await empleadosResponse.json();
      setProgress(20);

      const data = await file.arrayBuffer();
      setProgress(30);

      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setProgress(50);

      const processed: ProcessedEmployee[] = [];
      const newErrors: string[] = [];

      // Estructuras para detectar duplicados en el Excel
      const seenExcel: Record<string, Record<string, number>> = {
        idGlovo: {},
        emailGlovo: {},
        dniNie: {},
        iban: {},
        naf: {},
      };

      // Estructuras para detectar duplicados en la base de datos
      const seenDB: Record<string, Set<string>> = {
        idGlovo: new Set(empleadosDB.map((e: any) => e.idGlovo?.toLowerCase())),
        emailGlovo: new Set(empleadosDB.map((e: any) => e.emailGlovo?.toLowerCase())),
        dniNie: new Set(empleadosDB.map((e: any) => e.dniNie?.toLowerCase())),
        iban: new Set(empleadosDB.map((e: any) => e.iban?.toLowerCase())),
        naf: new Set(empleadosDB.map((e: any) => e.naf?.toLowerCase())),
      };

      jsonData.forEach((row: any, index: number) => {
        try {
          if (!row || typeof row !== 'object') {
            newErrors.push(`Fila ${index + 2}: Fila inválida o vacía`);
            return;
          }

          const cleanString = (value: any): string => {
            if (!value || value === "" || value === "null" || value === "undefined") {
              return "";
            }
            return String(value).trim();
          };

          // Validar campos clave
          const claves = ['idGlovo', 'emailGlovo', 'dniNie', 'iban', 'naf'];
          claves.forEach((clave) => {
            const valor = cleanString(row[clave]);
            if (valor) {
              // Duplicado en Excel
              if (seenExcel[clave][valor.toLowerCase()]) {
                newErrors.push(`Fila ${index + 2}: El campo ${clave} ('${valor}') está duplicado en el Excel (también en fila ${seenExcel[clave][valor.toLowerCase()]})`);
              } else {
                seenExcel[clave][valor.toLowerCase()] = index + 2;
              }
              // Duplicado en base de datos
              if (seenDB[clave].has(valor.toLowerCase())) {
                newErrors.push(`Fila ${index + 2}: El campo ${clave} ('${valor}') ya existe en la base de datos`);
              }
            }
          });

          // Verificar que idGlovo existe antes de procesar
          const idGlovo = cleanString(row['idGlovo']);
          if (!idGlovo) {
            newErrors.push(`Fila ${index + 2}: Falta el campo requerido ID Glovo.`);
            return;
          }

          // Verificar que flota existe antes de procesar
          const flota = cleanString(row['flota']);
          if (!flota) {
            newErrors.push(`Fila ${index + 2}: Falta el campo requerido Flota.`);
            return;
          }

          // Función helper para limpiar fechas
          const cleanDate = (value: any): string => {
            if (!value || value === "" || value === "null" || value === "undefined") {
              return "";
            }
            const dateStr = String(value).trim();
            if (dateStr === "") return "";
            
            // Intentar parsear la fecha
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
              return "";
            }
            return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
          };

          // Mapear campos del Excel a nuestro schema
          const rawEmployee = {
            idGlovo: cleanString(row['idGlovo']),
            emailGlovo: cleanString(row['emailGlovo']),
            turno: cleanString(row['turno']),
            nombre: cleanString(row['nombre']),
            apellido: cleanString(row['apellido']),
            telefono: cleanString(row['telefono']),
            email: cleanString(row['email']),
            horas: row['horas'] ? Number(row['horas']) : null,
            cdp: row['cdp'] ? Number(row['cdp']) : null,
            complementaries: cleanString(row['complementaries']),
            ciudad: cleanString(row['ciudad']),
            cityCode: cleanString(row['cityCode']),
            dniNie: cleanString(row['dniNie']),
            iban: cleanString(row['iban']),
            direccion: cleanString(row['direccion']),
            vehiculo: cleanString(row['vehiculo']),
            naf: cleanString(row['naf']),
            fechaAltaSegSoc: cleanDate(row['fechaAltaSegSoc']),
            statusBaja: cleanString(row['statusBaja']),
            estadoSs: cleanString(row['estadoSs']),
            informadoHorario: row['informadoHorario'] === 'true' || row['informadoHorario'] === true || row['informadoHorario'] === '1',
            cuentaDivilo: cleanString(row['cuentaDivilo']),
            proximaAsignacionSlots: cleanDate(row['proximaAsignacionSlots']),
            jefeTrafico: cleanString(row['jefeTrafico']),
            comentsJefeDeTrafico: cleanString(row['comentsJefeDeTrafico']),
            incidencias: cleanString(row['incidencias']),
            fechaIncidencia: cleanDate(row['fechaIncidencia']),
            faltasNoCheckInEnDias: row['faltasNoCheckInEnDias'] ? Number(row['faltasNoCheckInEnDias']) : 0,
            cruce: cleanString(row['cruce']),
            flota: cleanString(row['flota']),
            status: cleanString(row['status']) || 'active',
          };

          const employee: ProcessedEmployee = rawEmployee;
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
        if (newErrors.length > 0) {
          throw new Error(`No se pudieron procesar empleados válidos. Se encontraron ${newErrors.length} errores de validación. Revisa los detalles en la interfaz.`);
        } else {
          throw new Error("No se pudieron procesar empleados válidos. Es posible que el archivo esté vacío o no contenga datos válidos.");
        }
      }

      // Habilitar el botón de importar solo si hay empleados válidos
      setIsReadyToImport(true);

    } catch (error: unknown) {
      toast({
        title: "Error procesando archivo",
        description: `Error: ${error instanceof Error ? error.message : String(error)}. Revisa el formato y contenido del archivo Excel. Asegúrate de que las columnas coincidan con la plantilla.`,
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
    importMutation.mutate({ employees: processedData });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Importar Empleados</DialogTitle>
          <DialogDescription>
            Sube un archivo Excel para importar datos de empleados. Asegúrate de que el formato sea correcto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Archivo Excel
            </Label>
            <div className="col-span-3">
              <div
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors ${isDragOver ? 'border-primary bg-primary/10' : 'border-muted'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arrastra y suelta tu archivo Excel aquí o haz clic para seleccionar
                </p>
              </div>
            </div>
          </div>
          {isProcessing && (
            <div className="w-full">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center mt-2">
                Procesando archivo... {progress}%
              </p>
            </div>
          )}
          {processedData.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <h3 className="text-lg font-medium text-green-800">Procesamiento Exitoso</h3>
              <p className="mt-1 text-sm text-green-700">Se procesaron {processedData.length} empleados válidos listos para importar.</p>
            </div>
          )}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-md max-h-60 overflow-y-auto">
              <h3 className="text-lg font-medium text-red-800">Errores de Validación ({errors.length})</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
                {errors.slice(0, 50).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 50 && <li>... y {errors.length - 50} errores más. Revisa el archivo completo para detalles.</li>}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isProcessing}>
            Cerrar
          </Button>
          <Button
            type="submit"
            onClick={handleImport}
            disabled={isProcessing || !isReadyToImport || processedData.length === 0}
          >
            {isProcessing ? 'Procesando...' : importMutation.isPending ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 