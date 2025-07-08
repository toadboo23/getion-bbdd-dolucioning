import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EmployeeType } from '../types/EmployeeType';

const CompanyLeaves: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [employeeData, setEmployeeData] = useState<EmployeeType | null>(null);

  return (
    <div>
      {/* Renderizar los datos del empleado */}
      {String(employeeData?.nombre)} {String(employeeData?.apellido)}
      <div>{String(employeeData?.dniNie)}</div>
      <TableCell>{String(employeeData?.idGlovo)}</TableCell>
      <TableCell>{String(employeeData?.email)}</TableCell>
    </div>
  );
};

export default CompanyLeaves; 