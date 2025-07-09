// Script para probar la API de empleados
const fetchEmployees = async () => {
  try {
    const response = await fetch('http://localhost:5173/api/employees', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Error:', response.status, response.statusText);
      return;
    }
    
    const employees = await response.json();
    console.log('Total empleados:', employees.length);
    
    if (employees.length > 0) {
      const firstEmployee = employees[0];
      console.log('Primer empleado:', {
        idGlovo: firstEmployee.idGlovo,
        nombre: firstEmployee.nombre,
        cityCode: firstEmployee.cityCode,
        flota: firstEmployee.flota
      });
      
      // Verificar si todos los empleados tienen flota
      const employeesWithFlota = employees.filter(emp => emp.flota);
      console.log('Empleados con flota:', employeesWithFlota.length);
      console.log('Empleados sin flota:', employees.length - employeesWithFlota.length);
      
      // Mostrar algunos ejemplos de flotas
      const flotaExamples = employees.slice(0, 5).map(emp => ({
        idGlovo: emp.idGlovo,
        nombre: emp.nombre,
        cityCode: emp.cityCode,
        flota: emp.flota
      }));
      console.log('Ejemplos de flotas:', flotaExamples);
    }
  } catch (error) {
    console.error('Error al obtener empleados:', error);
  }
};

fetchEmployees(); 