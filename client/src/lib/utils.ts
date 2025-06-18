import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funciones para exportación a Excel
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Datos') {
  // Crear un nuevo workbook
  const wb = XLSX.utils.book_new();
  
  // Crear worksheet desde los datos
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Agregar el worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Escribir el archivo
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function createExcelTemplate(headers: string[], fileName: string, sheetName: string = 'Plantilla') {
  const wb = XLSX.utils.book_new();
  
  // Crear un array con solo los headers
  const templateData = [headers];
  
  // Agregar algunas filas de ejemplo vacías
  for (let i = 0; i < 3; i++) {
    templateData.push(new Array(headers.length).fill(''));
  }
  
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  
  // Estilo para los headers
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "DDDDDD" } }
    };
  }
  
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
