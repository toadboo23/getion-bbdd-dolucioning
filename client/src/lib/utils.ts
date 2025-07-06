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

  // Headers en español que coinciden exactamente con la exportación
  const headers = [
    'ID Glovo',
    'Email Glovo',
    'Turno',
    'Nombre',
    'Apellido',
    'Teléfono',
    'Email Personal',
    'Horas',
    'CDP%',
    'Complementarios',
    'Ciudad',
    'Código Ciudad',
    'DNI/NIE',
    'IBAN',
    'Dirección',
    'Vehículo',
    'NAF',
    'Fecha Alta Seg. Social',
    'Status Baja',
    'Estado SS',
    'Informado Horario',
    'Cuenta Divilo',
    'Próxima Asignación Slots',
    'Jefe de Tráfico',
    'Flota',
    'Comentarios Jefe Tráfico',
    'Incidencias',
    'Fecha Incidencia',
    'Faltas No Check-in (días)',
    'Cruce',
    'Estado',
    'Fecha Creación',
    'Última Actualización',
  ];

  // Datos de ejemplo con todos los campos
  const templateData = [
    headers,
    [
      'EMP001', // ID Glovo
      'juan.perez@glovo.com', // Email Glovo
      'Mañana', // Turno
      'Juan', // Nombre
      'Pérez', // Apellido
      '612345678', // Teléfono
      'juan.perez@email.com', // Email Personal
      '38', // Horas
      '100.00', // CDP%
      'Sí', // Complementarios
      'Madrid', // Ciudad
      'MAD', // Código Ciudad
      '12345678A', // DNI/NIE
      'ES12345678901234567890', // IBAN
      'Calle Mayor 123', // Dirección
      'Moto', // Vehículo
      '123456789', // NAF
      '01/01/2024', // Fecha Alta Seg. Social
      'Activo', // Status Baja
      'Alta', // Estado SS
      'Sí', // Informado Horario
      'juan.divilo', // Cuenta Divilo
      '15/01/2024', // Próxima Asignación Slots
      'Carlos López', // Jefe de Tráfico
      'Flota A', // Flota
      'Empleado puntual', // Comentarios Jefe Tráfico
      'Ninguna', // Incidencias
      '', // Fecha Incidencia
      '0', // Faltas No Check-in (días)
      'Sí', // Cruce
      'Activo', // Estado
      '01/01/2024', // Fecha Creación
      '01/01/2024', // Última Actualización
    ],
    [
      'EMP002', // ID Glovo
      'maria.garcia@glovo.com', // Email Glovo
      'Tarde', // Turno
      'María', // Nombre
      'García', // Apellido
      '623456789', // Teléfono
      'maria.garcia@email.com', // Email Personal
      '40', // Horas
      '105.26', // CDP%
      'No', // Complementarios
      'Barcelona', // Ciudad
      'BCN', // Código Ciudad
      '87654321B', // DNI/NIE
      'ES09876543210987654321', // IBAN
      'Avenida Diagonal 456', // Dirección
      'Bicicleta', // Vehículo
      '987654321', // NAF
      '15/01/2024', // Fecha Alta Seg. Social
      'Activo', // Status Baja
      'Alta', // Estado SS
      'Sí', // Informado Horario
      'maria.divilo', // Cuenta Divilo
      '20/01/2024', // Próxima Asignación Slots
      'Ana Martínez', // Jefe de Tráfico
      'Flota B', // Flota
      'Empleada responsable', // Comentarios Jefe Tráfico
      'Ninguna', // Incidencias
      '', // Fecha Incidencia
      '0', // Faltas No Check-in (días)
      'Sí', // Cruce
      'Activo', // Estado
      '15/01/2024', // Fecha Creación
      '15/01/2024', // Última Actualización
    ],
    new Array(headers.length).fill(''), // Fila vacía para ejemplo
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
