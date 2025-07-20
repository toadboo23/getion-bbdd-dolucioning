// Hook para controlar la visibilidad de características usando variables de entorno
export const useFeatureFlags = () => {
  // Variable de entorno para controlar la visibilidad de exportación a Excel
  const showExcelExport = import.meta.env.VITE_SHOW_EXCEL_EXPORT !== 'false';
  
  return {
    showExcelExport,
  };
}; 