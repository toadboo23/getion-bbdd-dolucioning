import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, UserX } from "lucide-react";
import type { Employee } from "@shared/schema";

interface EmployeeTableProps {
  employees: Employee[];
  onEditEmployee: (employee: Employee) => void;
  onManageLeave: (employee: Employee) => void;
  onViewDetails: (employee: Employee) => void;
  canEdit: boolean;
  isReadOnlyUser?: boolean;
}

export default function EmployeeTable({
  employees,
  onEditEmployee,
  onManageLeave,
  onViewDetails,
  canEdit,
  isReadOnlyUser = false,
}: EmployeeTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "it_leave":
        return <Badge className="bg-orange-100 text-orange-800">Baja IT</Badge>;
      case "company_leave_pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Baja Empresa Pendiente</Badge>;
      case "company_leave_approved":
        return <Badge className="bg-red-100 text-red-800">Baja Empresa Aprobada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRowClassName = (status: string) => {
    if (status === "it_leave") {
      return "bg-orange-50 border-l-4 border-l-orange-400";
    }
    return "";
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>DNI/NIE</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.idGlovo} className={`table-row ${getRowClassName(employee.status)}`}>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.nombre || 'N/A'} {employee.apellido || ''}
                      </div>
                      <div className="text-sm text-gray-500">{employee.idGlovo}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{employee.email || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{employee.telefono || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900 capitalize">
                    {employee.ciudad || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {employee.dniNie || 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {employee.turno || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {/* Botón Ver Detalles - Disponible para todos */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(employee)}
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Botones de edición - Solo para Admin y Super Admin */}
                      {canEdit && !isReadOnlyUser && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditEmployee(employee)}
                            title="Editar empleado"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onManageLeave(employee)}
                            title="Gestionar baja"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {/* Mensaje para usuario de solo consulta */}
                      {isReadOnlyUser && (
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                          Solo consulta
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron empleados</p>
          </div>
        )}

        {/* Simple pagination placeholder */}
        {employees.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button variant="outline" disabled>
                Anterior
              </Button>
              <Button variant="outline" disabled>
                Siguiente
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">1</span> a{" "}
                  <span className="font-medium">{employees.length}</span> de{" "}
                  <span className="font-medium">{employees.length}</span> empleados
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
