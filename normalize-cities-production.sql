-- Script para normalizar ciudades en PRODUCCIÓN con triggers automáticos
-- Ejecutar este script en pgAdmin en la base de datos de producción

-- 1. FUNCIÓN para normalizar texto (primera letra mayúscula, resto minúsculas)
CREATE OR REPLACE FUNCTION normalizar_ciudad(texto TEXT)
RETURNS TEXT AS $$
BEGIN
  IF texto IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN INITCAP(LOWER(texto));
END;
$$ LANGUAGE plpgsql;

-- 2. TRIGGER para employees (columna ciudad)
CREATE OR REPLACE FUNCTION trg_normalizar_employees_ciudad()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ciudad := normalizar_ciudad(NEW.ciudad);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_ciudad ON employees;
CREATE TRIGGER trg_employees_ciudad
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION trg_normalizar_employees_ciudad();

-- 3. TRIGGER para system_users (columna assigned_city)
CREATE OR REPLACE FUNCTION trg_normalizar_system_users_assigned_city()
RETURNS TRIGGER AS $$
BEGIN
  NEW.assigned_city := normalizar_ciudad(NEW.assigned_city);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_users_assigned_city ON system_users;
CREATE TRIGGER trg_system_users_assigned_city
BEFORE INSERT OR UPDATE ON system_users
FOR EACH ROW
EXECUTE FUNCTION trg_normalizar_system_users_assigned_city();

-- 4. TRIGGER para system_users (columna ciudad, si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='system_users' AND column_name='ciudad'
  ) THEN
    EXECUTE $$
      CREATE OR REPLACE FUNCTION trg_normalizar_system_users_ciudad()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.ciudad := normalizar_ciudad(NEW.ciudad);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    $$;
    EXECUTE $$
      DROP TRIGGER IF EXISTS trg_system_users_ciudad ON system_users;
      CREATE TRIGGER trg_system_users_ciudad
      BEFORE INSERT OR UPDATE ON system_users
      FOR EACH ROW
      EXECUTE FUNCTION trg_normalizar_system_users_ciudad();
    $$;
  END IF;
END $$;

-- 5. TRIGGER para company_leaves (employee_data->'ciudad' en JSONB)
CREATE OR REPLACE FUNCTION trg_normalizar_company_leaves_employee_data()
RETURNS TRIGGER AS $$
DECLARE
  ciudad_actual TEXT;
BEGIN
  IF NEW.employee_data ? 'ciudad' THEN
    ciudad_actual := NEW.employee_data->>'ciudad';
    NEW.employee_data := jsonb_set(
      NEW.employee_data,
      '{ciudad}',
      to_jsonb(normalizar_ciudad(ciudad_actual)),
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_leaves_employee_data ON company_leaves;
CREATE TRIGGER trg_company_leaves_employee_data
BEFORE INSERT OR UPDATE ON company_leaves
FOR EACH ROW
EXECUTE FUNCTION trg_normalizar_company_leaves_employee_data();

-- 6. TRIGGER para it_leaves (columna ciudad, si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='it_leaves' AND column_name='ciudad'
  ) THEN
    EXECUTE $$
      CREATE OR REPLACE FUNCTION trg_normalizar_it_leaves_ciudad()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.ciudad := normalizar_ciudad(NEW.ciudad);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    $$;
    EXECUTE $$
      DROP TRIGGER IF EXISTS trg_it_leaves_ciudad ON it_leaves;
      CREATE TRIGGER trg_it_leaves_ciudad
      BEFORE INSERT OR UPDATE ON it_leaves
      FOR EACH ROW
      EXECUTE FUNCTION trg_normalizar_it_leaves_ciudad();
    $$;
  END IF;
END $$;

-- 7. Normaliza los datos existentes una vez:
UPDATE employees SET ciudad = normalizar_ciudad(ciudad) WHERE ciudad IS NOT NULL;
UPDATE system_users SET assigned_city = normalizar_ciudad(assigned_city) WHERE assigned_city IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='system_users' AND column_name='ciudad'
  ) THEN
    EXECUTE 'UPDATE system_users SET ciudad = normalizar_ciudad(ciudad) WHERE ciudad IS NOT NULL;';
  END IF;
END $$;
UPDATE company_leaves
SET employee_data = jsonb_set(
  employee_data,
  '{ciudad}',
  to_jsonb(normalizar_ciudad(employee_data->>'ciudad')),
  true
)
WHERE employee_data->>'ciudad' IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='it_leaves' AND column_name='ciudad'
  ) THEN
    EXECUTE 'UPDATE it_leaves SET ciudad = normalizar_ciudad(ciudad) WHERE ciudad IS NOT NULL;';
  END IF;
END $$;

-- ¡Listo! Todas las ciudades quedarán normalizadas automáticamente en cada inserción o actualización. 