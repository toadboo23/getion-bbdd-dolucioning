import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Download } from "lucide-react";

export default function BulkUpload() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<any>(null);

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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // In a real implementation, this would parse the Excel file
      // For this demo, we'll simulate the upload process
      const simulatedData = [
        {
          firstName: "María",
          lastName: "García López",
          email: "maria.garcia@empresa.com",
          phone: "+34 612 345 678",
          city: "Madrid",
          dniNie: "12345678A",
          birthDate: "1990-05-15",
          nationality: "Española",
          naf: "NAF001",
          address: "Calle Gran Vía 123, 28013 Madrid",
          iban: "ES91 2100 0418 4502 0005 1332",
          vehicle: "Coche propio",
          contractHours: "40 horas/semana",
          contractType: "Indefinido",
          ssStatus: "Alta",
          startDate: "2020-01-15",
          age: 34,
          status: "active",
        },
        {
          firstName: "Carlos",
          lastName: "Rodríguez Martín",
          email: "carlos.rodriguez@empresa.com", 
          phone: "+34 687 654 321",
          city: "Barcelona",
          dniNie: "87654321B",
          birthDate: "1985-08-20",
          nationality: "Española", 
          naf: "NAF002",
          address: "Passeig de Gràcia 456, 08007 Barcelona",
          iban: "ES76 0075 0130 4806 0158 1234",
          vehicle: "Transporte público",
          contractHours: "35 horas/semana", 
          contractType: "Temporal",
          ssStatus: "Alta",
          startDate: "2021-03-10",
          age: 39,
          status: "active",
        },
      ];

      const response = await apiRequest("POST", "/api/employees/bulk-upload", {
        employees: simulatedData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setUploadResults(data);
      toast({
        title: "Base de datos reemplazada",
        description: `Se reemplazó completamente con ${data.summary.successful} empleados`,
      });
      setSelectedFile(null);
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
        description: "No se pudo procesar el archivo",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResults(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const downloadTemplate = () => {
    // In a real implementation, this would generate and download an Excel template
    toast({
      title: "Plantilla descargada",
      description: "La plantilla Excel ha sido descargada",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Carga Masiva de Empleados</h2>
        <p className="mt-1 text-sm text-gray-600">Carga empleados mediante archivo Excel</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="max-w-lg mx-auto">
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subir Archivo Excel</h3>
              <p className="text-sm text-gray-500 mb-6">
                Selecciona un archivo .xlsx con los datos de los empleados
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors dropzone">
              <input
                type="file"
                id="excelFile"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="excelFile" className="cursor-pointer block">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : "Haz clic para seleccionar o arrastra el archivo aquí"}
                </p>
              </label>
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadMutation.isPending ? "Procesando..." : "Procesar Archivo"}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Descargar plantilla Excel
              </Button>
            </div>

            {uploadResults && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Resultados de la carga</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Total procesados:</span> {uploadResults.summary.total}
                  </p>
                  <p className="text-green-600">
                    <span className="font-medium">Exitosos:</span> {uploadResults.summary.successful}
                  </p>
                  {uploadResults.summary.total - uploadResults.summary.successful > 0 && (
                    <p className="text-red-600">
                      <span className="font-medium">Con errores:</span>{" "}
                      {uploadResults.summary.total - uploadResults.summary.successful}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
