import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema } from "@shared/schema";
import type { Employee } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (data: any) => void;
  isLoading: boolean;
}

export default function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  onSave,
  isLoading,
}: EditEmployeeModalProps) {
  const form = useForm({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      idGlovo: "",
      emailGlovo: "",
      turno: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      horas: 0,
      complementaries: "",
      ciudad: "",
      cityCode: "",
      dniNie: "",
      iban: "",
      direccion: "",
      vehiculo: "",
      naf: "",
      fechaAltaSegSoc: "",
      statusBaja: "",
      estadoSs: "",
      informadoHorario: false,
      cuentaDivilo: "",
      proximaAsignacionSlots: "",
      jefeTrafico: "",
      comentsJefeDeTrafico: "",
      incidencias: "",
      fechaIncidencia: "",
      faltasNoCheckInEnDias: 0,
      cruce: "",
      flota: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        idGlovo: employee.idGlovo || "",
        emailGlovo: employee.emailGlovo || "",
        turno: employee.turno || "",
        nombre: employee.nombre || "",
        apellido: employee.apellido || "",
        telefono: employee.telefono || "",
        email: employee.email || "",
        horas: employee.horas || 0,
        complementaries: employee.complementaries || "",
        ciudad: employee.ciudad || "",
        cityCode: employee.cityCode || "",
        dniNie: employee.dniNie || "",
        iban: employee.iban || "",
        direccion: employee.direccion || "",
        vehiculo: employee.vehiculo || "",
        naf: employee.naf || "",
        fechaAltaSegSoc: employee.fechaAltaSegSoc || "",
        statusBaja: employee.statusBaja || "",
        estadoSs: employee.estadoSs || "",
        informadoHorario: employee.informadoHorario || false,
        cuentaDivilo: employee.cuentaDivilo || "",
        proximaAsignacionSlots: employee.proximaAsignacionSlots || "",
        jefeTrafico: employee.jefeTrafico || "",
        comentsJefeDeTrafico: employee.comentsJefeDeTrafico || "",
        incidencias: employee.incidencias || "",
        fechaIncidencia: employee.fechaIncidencia || "",
        faltasNoCheckInEnDias: employee.faltasNoCheckInEnDias || 0,
        cruce: employee.cruce || "",
        flota: employee.flota || "",
        status: employee.status || "active",
      });
    } else {
      form.reset({
        idGlovo: "",
        emailGlovo: "",
        turno: "",
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        horas: 0,
        complementaries: "",
        ciudad: "",
        cityCode: "",
        dniNie: "",
        iban: "",
        direccion: "",
        vehiculo: "",
        naf: "",
        fechaAltaSegSoc: "",
        statusBaja: "",
        estadoSs: "",
        informadoHorario: false,
        cuentaDivilo: "",
        proximaAsignacionSlots: "",
        jefeTrafico: "",
        comentsJefeDeTrafico: "",
        incidencias: "",
        fechaIncidencia: "",
        faltasNoCheckInEnDias: 0,
        cruce: "",
        flota: "",
        status: "active",
      });
    }
  }, [employee, form]);

  const onSubmit = (data: any) => {

    
    // Convert empty strings to null for optional fields
    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value === "" && !["idGlovo", "nombre", "telefono", "flota"].includes(key)) {
        acc[key] = null;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);


    
    onSave(processedData);

  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Editar Empleado" : "Agregar Empleado"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="idGlovo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-500">ID Glovo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: GLV001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-500">Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre del empleado" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apellidos del empleado" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-500">Teléfono *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: +34 666 777 888" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="flota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-500">Flota *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona flota" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SOLUCIONING">SOLUCIONING</SelectItem>
                          <SelectItem value="SOLUCIONING-LM">SOLUCIONING-LM</SelectItem>
                          <SelectItem value="SOLUCIONING-JJ">SOLUCIONING-JJ</SelectItem>
                          <SelectItem value="SIN-FLOTA">SIN-FLOTA</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Personal</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="email@ejemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailGlovo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Glovo</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="empleado@glovo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información Laboral */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Información Laboral</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="turno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona turno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mañana">Mañana</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noche">Noche</SelectItem>
                          <SelectItem value="rotativo">Rotativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder="40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>CDP%</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      value={form.watch('horas') ? `${Math.round((form.watch('horas') / 38) * 100)}%` : ''}
                      disabled
                      placeholder="Calculado automáticamente"
                    />
                  </FormControl>
                </FormItem>

                <FormField
                  control={form.control}
                  name="jefeTrafico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jefe de Tráfico</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre del jefe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ciudad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona ciudad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="madrid">Madrid</SelectItem>
                          <SelectItem value="barcelona">Barcelona</SelectItem>
                          <SelectItem value="valencia">Valencia</SelectItem>
                          <SelectItem value="sevilla">Sevilla</SelectItem>
                          <SelectItem value="bilbao">Bilbao</SelectItem>
                          <SelectItem value="zaragoza">Zaragoza</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Ciudad</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="MAD, BCN, VAL..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Dirección completa" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dniNie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI/NIE</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345678A" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ES12 1234 5678 9012 3456 7890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehículo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo vehículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bicicleta">Bicicleta</SelectItem>
                          <SelectItem value="moto">Moto</SelectItem>
                          <SelectItem value="coche">Coche</SelectItem>
                          <SelectItem value="a_pie">A pie</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Campos Adicionales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="complementaries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complementarios</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Información adicional..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidencias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incidencias</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Notas sobre incidencias..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="naf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NAF</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Número de afiliación" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cuentaDivilo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuenta Divilo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cuenta en sistema Divilo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="faltasNoCheckInEnDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faltas No Check-in</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado del Empleado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="it_leave">Baja IT</SelectItem>
                          <SelectItem value="company_leave_pending">Baja Empresa Pendiente</SelectItem>
                          <SelectItem value="company_leave_approved">Baja Empresa Aprobada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="informadoHorario"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Informado de Horario
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : employee ? "Actualizar" : "Crear Empleado"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
