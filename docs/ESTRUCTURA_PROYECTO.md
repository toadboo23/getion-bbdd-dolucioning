# 📁 **ESTRUCTURA DEL PROYECTO SOLUCIONING**

## 🏗️ **Arquitectura General**

```
db_local/
├── 📁 database/           # Base de datos y migraciones
├── 📁 backend/           # API REST y lógica de negocio
├── 📁 frontend/          # Interfaz de usuario React
├── 📁 shared/            # Tipos y constantes compartidas
├── 📁 docs/              # Documentación del proyecto
└── 📄 archivos de configuración
```

---

## 📊 **DATABASE**

### **Estructura:**
```
database/
├── 📁 migrations/        # Scripts SQL de migración
├── 📁 seeds/            # Datos de prueba
└── 📁 schemas/          # Esquemas de base de datos
```

### **Archivos principales:**
- `schemas/init.sql` - Esquema inicial de la base de datos
- `migrations/*.sql` - Migraciones incrementales
- `seeds/candidates.sql` - Datos de prueba para candidatos

---

## 🔧 **BACKEND**

### **Estructura:**
```
backend/
├── 📁 src/
│   ├── 📁 controllers/   # Controladores de la API
│   ├── 📁 services/      # Lógica de negocio
│   ├── 📁 middleware/    # Middleware personalizado
│   ├── 📁 routes/        # Definición de rutas
│   └── 📄 index.ts       # Punto de entrada
├── 📁 tests/             # Tests unitarios e integración
├── 📄 package.json       # Dependencias del backend
└── 📄 tsconfig.json      # Configuración TypeScript
```

### **Archivos principales:**
- `src/index.ts` - Servidor Express
- `src/controllers/CandidateController.ts` - Controlador de candidatos
- `src/services/CandidateService.ts` - Lógica de candidatos
- `src/middleware/auth.ts` - Autenticación
- `src/routes/candidates.ts` - Rutas de candidatos

---

## 🎨 **FRONTEND**

### **Estructura:**
```
frontend/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 candidates/    # Componentes de candidatos
│   │   ├── 📁 ui/            # Componentes UI reutilizables
│   │   └── 📁 layout/        # Componentes de layout
│   ├── 📁 pages/
│   │   └── 📁 candidates/    # Páginas de candidatos
│   ├── 📁 hooks/             # Custom hooks
│   ├── 📁 utils/             # Utilidades
│   └── 📄 main.tsx          # Punto de entrada
├── 📁 tests/                 # Tests de componentes
├── 📄 package.json           # Dependencias del frontend
└── 📄 tsconfig.json          # Configuración TypeScript
```

### **Archivos principales:**
- `src/pages/candidates/index.tsx` - Lista de candidatos
- `src/components/candidates/CandidateForm.tsx` - Formulario
- `src/components/candidates/CandidateList.tsx` - Tabla
- `src/hooks/useCandidates.ts` - Hook para candidatos

---

## 🔗 **SHARED**

### **Estructura:**
```
shared/
├── 📁 types/             # Tipos TypeScript compartidos
└── 📁 constants/         # Constantes del sistema
```

### **Archivos principales:**
- `types/candidates.ts` - Tipos de candidatos y comentarios
- `constants/candidates.ts` - Estados, colores, ciudades

---

## 📚 **DOCS**

### **Estructura:**
```
docs/
├── 📄 FASE1_COMPLETADA.md    # Documentación Fase 1
├── 📄 FASE2_COMPLETADA.md    # Documentación Fase 2
├── 📄 FASE3_COMPLETADA.md    # Documentación Fase 3
├── 📄 ESTRUCTURA_PROYECTO.md # Este archivo
└── 📄 API_ENDPOINTS.md       # Documentación de API
```

---

## ⚙️ **CONFIGURACIÓN**

### **Archivos de configuración principales:**
- `docker-compose.yml` - Orquestación de servicios
- `package.json` - Dependencias del proyecto raíz
- `tsconfig.json` - Configuración TypeScript raíz
- `.eslintrc.js` - Reglas de linting
- `.prettierrc` - Formato de código

---

## 🚀 **SCRIPTS DE DESARROLLO**

### **Backend:**
```bash
cd backend
npm run dev      # Desarrollo con hot reload
npm run build    # Compilar para producción
npm run test     # Ejecutar tests
npm run lint     # Verificar código
```

### **Frontend:**
```bash
cd frontend
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run test     # Tests de componentes
npm run lint     # Verificar código
```

### **Docker:**
```bash
docker-compose up -d    # Levantar servicios
docker-compose down     # Detener servicios
docker-compose build    # Reconstruir imágenes
```

---

## 📋 **CONVENCIONES DE CÓDIGO**

### **Nomenclatura:**
- **Archivos:** kebab-case (ej: `candidate-form.tsx`)
- **Componentes:** PascalCase (ej: `CandidateForm`)
- **Funciones:** camelCase (ej: `getCandidates`)
- **Constantes:** UPPER_SNAKE_CASE (ej: `CANDIDATE_STATES`)

### **Estructura de imports:**
```typescript
// 1. Imports de librerías externas
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Imports de componentes
import { CandidateList } from '@/components/candidates';

// 3. Imports de hooks
import { useCandidates } from '@/hooks/useCandidates';

// 4. Imports de tipos
import type { Candidate } from '@/types/candidates';

// 5. Imports de utilidades
import { formatDate } from '@/utils/date';
```

---

## 🔄 **FLUJO DE DESARROLLO**

### **1. Desarrollo Local:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Base de datos
docker-compose up postgres
```

### **2. Testing:**
```bash
# Tests del backend
cd backend && npm run test

# Tests del frontend
cd frontend && npm run test

# Tests E2E
npm run test:e2e
```

### **3. Deploy:**
```bash
# Build para producción
npm run build:all

# Deploy a servidor
npm run deploy
```

---

## 📈 **ESCALABILIDAD**

### **Base de Datos:**
- ✅ Índices optimizados para consultas frecuentes
- ✅ Particionamiento para grandes volúmenes
- ✅ Backup automático diario
- ✅ Migraciones incrementales

### **Backend:**
- ✅ Arquitectura modular y escalable
- ✅ Rate limiting y seguridad
- ✅ Logs estructurados
- ✅ Health checks

### **Frontend:**
- ✅ Code splitting automático
- ✅ Lazy loading de componentes
- ✅ Cache inteligente con React Query
- ✅ Optimización de bundle

---

*Documento actualizado: ${new Date().toLocaleDateString('es-ES')}* 