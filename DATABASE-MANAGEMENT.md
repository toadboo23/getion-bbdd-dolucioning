# Gestión de Base de Datos y Usuarios

## ⚠️ Importante: Base de Datos Correcta

**La aplicación usa la base de datos `employee_management`, NO `postgres`**

### 🔧 Crear Usuarios de Forma Segura

#### Opción 1: Script Bash (Linux/Mac)
```bash
./create-user.sh "usuario@solucioning.net" "12345678" "super_admin" "Nombre" "Apellido"
```

#### Opción 2: Script PowerShell (Windows)
```powershell
.\create-user.ps1 -Email "usuario@solucioning.net" -Password "12345678" -Role "super_admin" -FirstName "Nombre" -LastName "Apellido"
```

#### Opción 3: Comando Directo (Solo para desarrollo)
```bash
docker exec -it employee_management_db psql -U postgres -d employee_management -c "INSERT INTO system_users (email, first_name, last_name, password, role, created_by, is_active) VALUES ('usuario@solucioning.net', 'Nombre', 'Apellido', '12345678', 'super_admin', 'SYSTEM', true) ON CONFLICT (email) DO NOTHING;"
```

### 🔍 Verificar Usuarios

```bash
# Listar todos los usuarios
docker exec -it employee_management_db psql -U postgres -d employee_management -c "SELECT email, first_name, last_name, role, is_active FROM system_users;"

# Buscar usuario específico
docker exec -it employee_management_db psql -U postgres -d employee_management -c "SELECT * FROM system_users WHERE email = 'usuario@solucioning.net';"
```

### 🚨 Errores Comunes a Evitar

1. **❌ NO usar la base de datos `postgres`**
   - La aplicación se conecta a `employee_management`
   - Los usuarios creados en `postgres` no serán visibles

2. **❌ NO olvidar especificar la base de datos**
   - Siempre usar `-d employee_management` en comandos psql

3. **❌ NO usar contraseñas débiles**
   - Usar contraseñas de al menos 8 caracteres
   - Incluir números y caracteres especiales

### ✅ Mejores Prácticas

1. **Usar los scripts proporcionados** para crear usuarios
2. **Verificar siempre** que el usuario se creó correctamente
3. **Documentar** los usuarios creados
4. **Usar roles apropiados**: `super_admin`, `admin`, `normal`
5. **Mantener usuarios inactivos** en lugar de eliminarlos

### 🔐 Roles Disponibles

- **super_admin**: Acceso completo al sistema
- **admin**: Gestión de empleados y reportes
- **normal**: Acceso de solo lectura

### 📊 Comandos Útiles

```bash
# Verificar conexión a la base de datos
docker exec -it employee_management_db psql -U postgres -d employee_management -c "SELECT version();"

# Ver tablas disponibles
docker exec -it employee_management_db psql -U postgres -d employee_management -c "\dt"

# Ver estructura de la tabla system_users
docker exec -it employee_management_db psql -U postgres -d employee_management -c "\d system_users"
``` 