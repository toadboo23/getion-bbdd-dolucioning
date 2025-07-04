import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Funciones para exportación a Excel
export function exportToExcel (data: Record<string, unknown>[], fileName: string, sheetName: string = 'Datos') {
  // Crear un nuevo workbook
  const wb = XLSX.utils.book_new();

  // Crear worksheet desde los datos
  const ws = XLSX.utils.json_to_sheet(data);

  // Agregar el worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Escribir el archivo
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function createExcelTemplate (headers: string[], fileName: string, sheetName: string = 'Plantilla') {
  const wb = XLSX.utils.book_new();

  // Solo la primera fila con los headers, las siguientes vacías
  const templateData = [headers];
  for (let i = 0; i < 3; i++) {
    templateData.push(new Array(headers.length).fill(''));
  }

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Estilo para los headers (opcional, solo visual)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'DDDDDD' } },
    };
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Función para crear plantilla específica para empleados
export function createEmployeeTemplate (fileName: string = 'plantilla_empleados') {
  const wb = XLSX.utils.book_new();

  // Headers en español que coinciden con el mapeo del frontend
  const headers = [
    'ID Glovo',
    'Nombre',
    'Apellido',
    'Email Personal',
    'Email Glovo',
    'Teléfono',
    'DNI/NIE',
    'IBAN',
    'Ciudad',
    'Código Ciudad',
    'Dirección',
    'Vehículo',
    'NAF',
    'Horas',
    'Flota',
  ];

  // Datos de ejemplo
  const templateData = [
    headers,
    ['EMP001', 'Juan', 'Pérez', 'juan.perez@email.com', 'juan.perez@glovo.com', '612345678', '12345678A', 'ES12345678901234567890', 'Madrid', 'MAD', 'Calle Mayor 123', 'Moto', '123456789', '38', 'Flota A'],
    ['EMP002', 'María', 'García', 'maria.garcia@email.com', 'maria.garcia@glovo.com', '623456789', '87654321B', 'ES09876543210987654321', 'Barcelona', 'BCN', 'Avenida Diagonal 456', 'Bicicleta', '987654321', '40', 'Flota B'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''], // Fila vacía para ejemplo
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Estilo para los headers
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'DDDDDD' } },
    };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Empleados');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
