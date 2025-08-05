-- Migración para permitir empleados sin ID Glovo y agregar estado "pendiente_activacion"
-- Fecha: 2025-01-15

-- 1. Crear una tabla temporal para almacenar empleados sin ID Glovo
CREATE TABLE IF NOT EXISTS employees_temp (
    LIKE employees INCLUDING ALL
);

-- 2. Copiar todos los datos existentes a la tabla temporal
INSERT INTO employees_temp SELECT * FROM employees;

-- 3. Eliminar la tabla original
DROP TABLE employees;

-- 4. Crear la nueva tabla con idGlovo nullable y el nuevo estado
CREATE TABLE employees (
    idGlovo varchar(50) PRIMARY KEY,
    emailGlovo varchar(100) UNIQUE,
    turno varchar(50),
    nombre varchar(100) NOT NULL,
    apellido varchar(100),
    telefono varchar(20),
    email varchar(100),
    horas integer,
    cdp integer,
    complementaries text,
    ciudad varchar(100),
    cityCode varchar(20),
    dniNie varchar(20) UNIQUE,
    iban varchar(34),
    direccion varchar(255),
    vehiculo varchar(50),
    naf varchar(20),
    fechaAltaSegSoc date,
    statusBaja varchar(50),
    estadoSs varchar(50),
    informadoHorario boolean DEFAULT false,
    cuentaDivilo varchar(100),
    proximaAsignacionSlots date,
    jefeTrafico varchar(100),
    comentsJefeDeTrafico text,
    incidencias text,
    fechaIncidencia date,
    faltasNoCheckInEnDias integer DEFAULT 0,
    cruce text,
    status varchar(50) NOT NULL DEFAULT 'active' CHECK (
        status IN (
            'active',
            'it_leave',
            'company_leave_pending',
            'company_leave_approved',
            'pending_laboral',
            'pendiente_laboral',
            'penalizado',
            'pendiente_activacion'
        )
    ),
    penalizationStartDate date,
    penalizationEndDate date,
    originalHours integer,
    flota varchar(100),
    createdAt timestamp DEFAULT now(),
    updatedAt timestamp DEFAULT now(),
    vacacionesDisfrutadas varchar(10) DEFAULT '0',
    vacacionesPendientes varchar(10) DEFAULT '0'
);

-- 5. Restaurar los datos de la tabla temporal
INSERT INTO employees SELECT * FROM employees_temp;

-- 6. Eliminar la tabla temporal
DROP TABLE employees_temp;

-- 7. Crear índices necesarios
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_ciudad ON employees(ciudad);
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(createdAt);
CREATE INDEX IF NOT EXISTS idx_employees_updated_at ON employees(updatedAt);

-- 8. Crear un índice único para empleados sin ID Glovo (usando un UUID temporal)
-- Esto se manejará en el código del backend

-- Comentario: Los empleados sin ID Glovo tendrán un ID temporal generado por el sistema
-- y se marcarán con status = 'pendiente_activacion' 