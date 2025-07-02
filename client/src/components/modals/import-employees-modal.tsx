import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
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
  flota?: string;
}

interface ImportError {
  type: 'validation' | 'duplicate' | 'processing' | 'backend' | 'field_length';
  message: string;
  row?: number;
  field?: string;
  value?: string;
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
<<<<<<< HEAD
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [showFieldLimits, setShowFieldLimits] = useState(false);
  const [showDetailedErrors, setShowDetailedErrors] = useState(false);
=======
  const [errors, setErrors] = useState<string[]>([]);
  const [isReadyToImport, setIsReadyToImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
>>>>>>> cambios-2506

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
<<<<<<< HEAD
    onError: (error: any) => {
      console.error("Error en importación:", error);
      
      // Extraer información detallada del error
      let errorMessage = "Error al importar empleados";
      let detailedErrors: ImportError[] = [];
      let errorType = "general";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorMessage;
        errorType = errorData.errorType || "general";
        
        // Procesar errores detallados del backend
        if (errorData.errorDetails && Array.isArray(errorData.errorDetails)) {
          detailedErrors = errorData.errorDetails.map((err: any) => ({
            type: err.type === 'duplicate' ? 'duplicate' : 
                  err.type === 'validation' ? 'validation' : 'backend',
            message: err.message,
            row: err.row,
            field: err.field,
            value: err.value || err.details ? JSON.stringify(err.details) : undefined
          }));
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          // Fallback para errores en formato string
          detailedErrors = errorData.errors.map((err: string) => ({
            type: errorType === "duplicate_dni_nie" ? "duplicate" : "backend",
            message: err,
          }));
        }
=======
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
>>>>>>> cambios-2506
      }
      
      // Mostrar toast con el error principal
      toast({
        title: "Error de importación",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Actualizar errores en el estado para mostrarlos en el modal
      setErrors(prev => [...prev, ...detailedErrors]);
      
      // Si hay errores de validación, no cerrar el modal para que el usuario pueda ver los detalles
      if (errorType === "validation_error" || errorType === "duplicate_dni_nie") {
        setShowDetailedErrors(true);
      } else {
        onClose();
        resetState();
      }
    },
  });

  const resetState = () => {
    setProcessedData([]);
    setErrors([]);
    setProgress(0);
    setIsProcessing(false);
<<<<<<< HEAD
    setShowDetailedErrors(false);
=======
    setIsReadyToImport(false);
>>>>>>> cambios-2506
  };

  const processExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(10);
      setErrors([]);

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
      const newErrors: ImportError[] = [];

      // Verificar duplicados en el archivo
      const idGlovoSet = new Set<string>();
      const dniNieSet = new Set<string>();

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
<<<<<<< HEAD
          // Función helper para truncar y limpiar strings
          const cleanString = (value: any, maxLength: number = 255): string => {
=======
          if (!row || typeof row !== 'object') {
            newErrors.push(`Fila ${index + 2}: Fila inválida o vacía`);
            return;
          }

          const cleanString = (value: any): string => {
>>>>>>> cambios-2506
            if (!value || value === "" || value === "null" || value === "undefined") {
              return "";
            }
            return String(value).trim();
          };

<<<<<<< HEAD
          // Función para validar longitudes y reportar errores específicos
          const validateFieldLength = (fieldName: string, value: string, maxLength: number, rowIndex: number): boolean => {
            if (value && value.length > maxLength) {
              newErrors.push({
                type: 'field_length',
                message: `El campo "${fieldName}" es demasiado largo (${value.length} caracteres, máximo ${maxLength})`,
                row: rowIndex + 2,
                field: fieldName,
                value: value.substring(0, 50) + "..."
              });
              return false;
=======
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
>>>>>>> cambios-2506
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
<<<<<<< HEAD
            idGlovo: cleanString(row['ID Glovo'], 50),
            emailGlovo: cleanString(row['Email Glovo'], 100),
            turno: cleanString(row['Turno'], 50),
            nombre: cleanString(row['Nombre'], 100),
            apellido: cleanString(row['Apellido'], 100),
            telefono: cleanString(row['Teléfono'], 30),
            email: cleanString(row['Email'], 100),
            horas: row['Horas'] ? Number(row['Horas']) : undefined,
            complementaries: cleanString(row['Complementarios']),
            ciudad: cleanString(row['Ciudad'], 100),
            cityCode: cleanString(row['Código Ciudad'], 30),
            dniNie: cleanString(row['DNI/NIE'], 30),
            iban: cleanString(row['IBAN'], 34),
            direccion: cleanString(row['Dirección'], 255),
            vehiculo: cleanString(row['Vehículo'], 50),
            naf: cleanString(row['NAF'], 30),
            fechaAltaSegSoc: cleanString(row['Fecha Alta Seg. Social (AAAA-MM-DD)']),
            statusBaja: cleanString(row['Status Baja'], 100),
            estadoSs: cleanString(row['Estado SS'], 100),
            informadoHorario: row['Informado Horario (true/false)'] === 'true' || row['Informado Horario (true/false)'] === true,
            cuentaDivilo: cleanString(row['Cuenta Divilo'], 100),
            proximaAsignacionSlots: cleanString(row['Próxima Asignación Slots (AAAA-MM-DD)']),
            jefeTrafico: cleanString(row['Jefe de Tráfico'], 100),
            comentsJefeDeTrafico: cleanString(row['Comentarios Jefe Tráfico']),
            incidencias: cleanString(row['Incidencias']),
            fechaIncidencia: cleanString(row['Fecha Incidencia (AAAA-MM-DD)']),
            faltasNoCheckInEnDias: row['Faltas No Check-in (días)'] ? Number(row['Faltas No Check-in (días)']) : 0,
            cruce: cleanString(row['Cruce']),
            status: cleanString(row['Estado (active/it_leave/company_leave_pending/company_leave_approved)']) || 'active',
            flota: cleanString(row['Flota'], 100),
          };

          // Validar campos requeridos
          if (!rawEmployee.idGlovo || !rawEmployee.nombre || !rawEmployee.telefono) {
            newErrors.push({
              type: 'validation',
              message: `Faltan campos requeridos`,
              row: index + 2,
              field: 'campos_requeridos',
              value: `ID Glovo: "${rawEmployee.idGlovo || 'VACÍO'}", Nombre: "${rawEmployee.nombre || 'VACÍO'}", Teléfono: "${rawEmployee.telefono || 'VACÍO'}"`
            });
            return;
          }

          // Verificar duplicados en el archivo
          if (rawEmployee.idGlovo && idGlovoSet.has(rawEmployee.idGlovo)) {
            newErrors.push({
              type: 'duplicate',
              message: `ID Glovo duplicado en el archivo`,
              row: index + 2,
              field: 'idGlovo',
              value: rawEmployee.idGlovo
            });
            return;
          }

          if (rawEmployee.dniNie && dniNieSet.has(rawEmployee.dniNie)) {
            newErrors.push({
              type: 'duplicate',
              message: `DNI/NIE duplicado en el archivo`,
              row: index + 2,
              field: 'dniNie',
              value: rawEmployee.dniNie
            });
            return;
          }

          // Validar longitudes específicas antes de limpiar (para detectar problemas originales)
          let hasLengthErrors = false;
          
          // Validaciones específicas con los valores originales antes de truncar
          const originalValues = {
            idGlovo: String(row['ID Glovo'] || '').trim(),
            emailGlovo: String(row['Email Glovo'] || '').trim(),
            turno: String(row['Turno'] || '').trim(),
            nombre: String(row['Nombre'] || '').trim(),
            apellido: String(row['Apellido'] || '').trim(),
            telefono: String(row['Teléfono'] || '').trim(),
            email: String(row['Email'] || '').trim(),
            ciudad: String(row['Ciudad'] || '').trim(),
            cityCode: String(row['Código Ciudad'] || '').trim(),
            dniNie: String(row['DNI/NIE'] || '').trim(),
            iban: String(row['IBAN'] || '').trim(),
            direccion: String(row['Dirección'] || '').trim(),
            vehiculo: String(row['Vehículo'] || '').trim(),
            naf: String(row['NAF'] || '').trim(),
            statusBaja: String(row['Status Baja'] || '').trim(),
            estadoSs: String(row['Estado SS'] || '').trim(),
            cuentaDivilo: String(row['Cuenta Divilo'] || '').trim(),
            jefeTrafico: String(row['Jefe de Tráfico'] || '').trim(),
            flota: String(row['Flota'] || '').trim(),
          };

          // Validar cada campo con su longitud máxima
          if (!validateFieldLength('ID Glovo', originalValues.idGlovo, 50, index)) hasLengthErrors = true;
          if (!validateFieldLength('Email Glovo', originalValues.emailGlovo, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Turno', originalValues.turno, 50, index)) hasLengthErrors = true;
          if (!validateFieldLength('Nombre', originalValues.nombre, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Apellido', originalValues.apellido, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Teléfono', originalValues.telefono, 30, index)) hasLengthErrors = true;
          if (!validateFieldLength('Email', originalValues.email, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Ciudad', originalValues.ciudad, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Código Ciudad', originalValues.cityCode, 30, index)) hasLengthErrors = true;
          if (!validateFieldLength('DNI/NIE', originalValues.dniNie, 30, index)) hasLengthErrors = true;
          if (!validateFieldLength('IBAN', originalValues.iban, 34, index)) hasLengthErrors = true;
          if (!validateFieldLength('Dirección', originalValues.direccion, 255, index)) hasLengthErrors = true;
          if (!validateFieldLength('Vehículo', originalValues.vehiculo, 50, index)) hasLengthErrors = true;
          if (!validateFieldLength('NAF', originalValues.naf, 30, index)) hasLengthErrors = true;
          if (!validateFieldLength('Status Baja', originalValues.statusBaja, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Estado SS', originalValues.estadoSs, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Cuenta Divilo', originalValues.cuentaDivilo, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Jefe de Tráfico', originalValues.jefeTrafico, 100, index)) hasLengthErrors = true;
          if (!validateFieldLength('Flota', originalValues.flota, 100, index)) hasLengthErrors = true;

          // Si hay errores de longitud, no procesar este empleado
          if (hasLengthErrors) {
            return;
          }

          // Agregar a los sets para verificar duplicados
          if (rawEmployee.idGlovo) idGlovoSet.add(rawEmployee.idGlovo);
          if (rawEmployee.dniNie) dniNieSet.add(rawEmployee.dniNie);

          const employee: ProcessedEmployee = rawEmployee;
          processed.push(employee);
        } catch (error) {
          newErrors.push({
            type: 'processing',
            message: `Error procesando datos`,
            row: index + 2,
            value: error instanceof Error ? error.message : String(error)
          });
=======
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
>>>>>>> cambios-2506
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

  const getErrorIcon = (type: ImportError['type']) => {
    switch (type) {
      case 'validation':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'field_length':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'backend':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getErrorBadge = (type: ImportError['type']) => {
    switch (type) {
      case 'validation':
        return <Badge variant="destructive" className="text-xs">Validación</Badge>;
      case 'duplicate':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Duplicado</Badge>;
      case 'field_length':
        return <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">Longitud</Badge>;
      case 'backend':
        return <Badge variant="destructive" className="text-xs">Servidor</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Error</Badge>;
    }
  };

  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ImportError[]>);

  const getErrorTypeLabel = (type: string) => {
    switch (type) {
      case 'validation':
        return 'Validación';
      case 'duplicate':
        return 'Duplicados';
      case 'field_length':
        return 'Longitud';
      case 'backend':
        return 'Servidor';
      case 'processing':
        return 'Procesamiento';
      default:
        return type.replace('_', ' ');
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'validation':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'duplicate':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'field_length':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'backend':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
<<<<<<< HEAD
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
=======
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
>>>>>>> cambios-2506
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
<<<<<<< HEAD
                {showFieldLimits ? 'Ocultar' : 'Ver detalles'}
              </Button>
            </div>
            {showFieldLimits && (
              <div className="mt-3 text-sm text-blue-700">
                <p className="mb-2">Los siguientes campos tienen limitaciones de longitud:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div>• ID Glovo: <strong>50 caracteres</strong></div>
                  <div>• Email Glovo: <strong>100 caracteres</strong></div>
                  <div>• Turno: <strong>50 caracteres</strong></div>
                  <div>• Nombre: <strong>100 caracteres</strong></div>
                  <div>• Apellido: <strong>100 caracteres</strong></div>
                  <div>• Teléfono: <strong>30 caracteres</strong></div>
                  <div>• Email: <strong>100 caracteres</strong></div>
                  <div>• Ciudad: <strong>100 caracteres</strong></div>
                  <div>• Código Ciudad: <strong>30 caracteres</strong></div>
                  <div>• DNI/NIE: <strong>30 caracteres</strong></div>
                  <div>• IBAN: <strong>34 caracteres</strong></div>
                  <div>• Dirección: <strong>255 caracteres</strong></div>
                  <div>• Vehículo: <strong>50 caracteres</strong></div>
                  <div>• NAF: <strong>30 caracteres</strong></div>
                  <div>• Status Baja: <strong>100 caracteres</strong></div>
                  <div>• Estado SS: <strong>100 caracteres</strong></div>
                  <div>• Cuenta Divilo: <strong>100 caracteres</strong></div>
                  <div>• Jefe Tráfico: <strong>100 caracteres</strong></div>
                  <div>• Flota: <strong>100 caracteres</strong></div>
                </div>
                <p className="mt-2 text-blue-600">
                  Los campos que exceden estos límites serán truncados automáticamente o generarán errores de validación.
=======
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
>>>>>>> cambios-2506
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
<<<<<<< HEAD
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  {processedData.length} empleados procesados correctamente
                </span>
              </div>
              
              {errors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">
                        {errors.length} error(es) encontrado(s)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetailedErrors(!showDetailedErrors)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {showDetailedErrors ? 'Ocultar detalles' : 'Ver detalles'}
                    </Button>
                  </div>
                  
                  {showDetailedErrors && (
                    <div className="space-y-4">
                      {/* Resumen de errores por tipo */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(groupedErrors).map(([type, typeErrors]) => (
                          <div key={type} className={`p-4 rounded-lg border ${getErrorTypeColor(type)}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {getErrorIcon(type as ImportError['type'])}
                              <span className="text-sm font-medium">{getErrorTypeLabel(type)}</span>
                            </div>
                            <div className="text-2xl font-bold">{typeErrors.length}</div>
                            <div className="text-xs opacity-75">errores</div>
                          </div>
                        ))}
                      </div>

                      {/* Lista detallada de errores */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                          {errors.map((error, index) => (
                            <div key={index} className="bg-white p-4 rounded border border-red-200 shadow-sm">
                              <div className="flex items-start gap-3">
                                {getErrorIcon(error.type)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getErrorBadge(error.type)}
                                    {error.row && (
                                      <Badge variant="outline" className="text-xs">
                                        Fila {error.row}
                                      </Badge>
                                    )}
                                    {error.field && error.field !== 'campos_requeridos' && (
                                      <Badge variant="outline" className="text-xs">
                                        {error.field}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-800 font-medium mb-1">{error.message}</p>
                                  {error.value && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Valor:</span>
                                      <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-1">
                                        {error.value.length > 100 ? error.value.substring(0, 100) + '...' : error.value}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Sugerencias para corregir errores */}
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <div className="font-medium mb-2">Sugerencias para corregir los errores:</div>
                          <ul className="text-sm space-y-1">
                            <li>• <strong>Validación:</strong> Completa todos los campos requeridos (ID Glovo, Nombre, Teléfono)</li>
                            <li>• <strong>Duplicados:</strong> Verifica que no haya IDs de Glovo o DNI/NIE duplicados en el archivo</li>
                            <li>• <strong>Longitud:</strong> Acorta los campos que exceden el límite de caracteres</li>
                            <li>• <strong>Servidor:</strong> Verifica que no haya DNI/NIE duplicados en la base de datos existente</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={errors.length > 0 || importMutation.isPending}
                  className="flex-1"
                >
                  {importMutation.isPending ? "Importando..." : "Importar Empleados"}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetState}
                  disabled={importMutation.isPending}
                >
                  Procesar Otro Archivo
                </Button>
              </div>
=======
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
>>>>>>> cambios-2506
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