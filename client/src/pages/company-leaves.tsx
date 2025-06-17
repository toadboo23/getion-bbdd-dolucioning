import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyLeave } from "@shared/schema";

export default function CompanyLeaves() {
  const { data: companyLeaves = [], isLoading } = useQuery<CompanyLeave[]>({
    queryKey: ["/api/company-leaves"],
  });

  const getLeaveTypeBadge = (type: string) => {
    const variants = {
      despido: "destructive",
      voluntaria: "secondary", 
      nspp: "outline",
      anulacion: "default"
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || "default"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Baja Empresa</h1>
        <p className="text-gray-600 mt-2">
          Empleados con bajas empresa aprobadas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empleados con Baja Empresa</CardTitle>
          <CardDescription>
            Total de empleados con baja aprobada: {companyLeaves.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companyLeaves.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay empleados con baja empresa aprobada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>DNI/NIE</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Tipo de Baja</TableHead>
                    <TableHead>Fecha de Baja</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead>Aprobado por</TableHead>
                    <TableHead>Fecha Aprobación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {leave.firstName} {leave.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{leave.contractType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{leave.email}</div>
                        <div className="text-sm text-gray-500">{leave.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{leave.dniNie}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{leave.city}</div>
                      </TableCell>
                      <TableCell>
                        {getLeaveTypeBadge(leave.leaveType)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {format(new Date(leave.leaveDate), "dd/MM/yyyy", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{leave.leaveRequestedBy}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(leave.leaveRequestedAt), "dd/MM/yyyy", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{leave.approvedBy}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {format(new Date(leave.approvedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}