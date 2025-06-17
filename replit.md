# Employee Management System

## Overview

This is a full-stack employee management system built with React, Express.js, and PostgreSQL. The application provides comprehensive employee administration capabilities with role-based access control, leave management, and administrative notifications. It uses Replit Auth for authentication and features a modern UI built with shadcn/ui components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with JSON responses
- **Development**: tsx for TypeScript execution in development

### Data Storage Solutions
- **Database**: PostgreSQL (via Neon Database serverless)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: @neondatabase/serverless for database connectivity

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions table
- **User Management**: Users table with role-based permissions (super_admin, admin, normal)
- **Authorization**: Route-level protection with role checking

### Employee Management
- **CRUD Operations**: Full employee lifecycle management
- **Search & Filtering**: By city, status, and search terms
- **Status Tracking**: Active, IT leave, and company leave statuses
- **Bulk Operations**: Excel-based bulk upload capabilities

### Leave Management
- **IT Leaves**: Technical leave tracking
- **Company Leaves**: Company-wide leave management
- **Status Integration**: Leave status reflected in employee records

### Notification System
- **Administrative Alerts**: System-wide notifications for admins
- **Status Management**: Notification lifecycle with status updates
- **Role-based Access**: Super admin exclusive notification management

### Dashboard Analytics
- **Metrics Overview**: Employee counts, active status, leave statistics
- **Real-time Data**: Live dashboard with key performance indicators
- **Visual Components**: Chart-ready data structure for future analytics

## Data Flow

1. **Authentication Flow**:
   - User accesses application → Replit Auth redirect → OpenID Connect verification → Session creation → Role-based access

2. **Employee Management Flow**:
   - Admin creates/edits employee → Form validation → API request → Database update → UI refresh

3. **Leave Management Flow**:
   - Admin initiates leave → Status change → Employee record update → Notification creation

4. **Dashboard Flow**:
   - Page load → Multiple API calls for metrics → Data aggregation → Component rendering

## External Dependencies

### Authentication
- **Replit Auth**: Primary authentication provider
- **OpenID Client**: OAuth/OpenID Connect implementation
- **Passport.js**: Authentication middleware

### Database
- **Neon Database**: Serverless PostgreSQL provider
- **Connection Pooling**: Built-in connection management

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library
- **TailwindCSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **ESBuild**: Production bundling

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80
- **Hot Reload**: Vite development server with HMR

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Process Management**: Single Node.js process for simplicity

### Environment Configuration
- **Database URL**: Required for PostgreSQL connection
- **Session Secret**: Required for session encryption
- **Replit Integration**: REPL_ID and domain configuration

## Changelog

```
Changelog:
- June 17, 2025. Initial setup
- June 17, 2025. Fixed employee page issues and improved UX:
  * Corrected Select component values to prevent empty string errors
  * Enhanced sidebar layout to prevent content overlap
  * Added responsive mobile sidebar with overlay
  * Fixed TypeScript authentication errors
  * Improved user experience with proper spacing and navigation
- June 17, 2025. Updated employee database schema with comprehensive fields:
  * Added 16 specific employee fields: Apellidos, Telefono, Correo, CIUDAD, 
    DNI_NIE, Fecha_de_Nacimiento, Nacionalidad, NAF, DIRECCIÓN, Iban, 
    Vehiculo, Contrato(Horas), TIPO_CONTRATO, ESTADO_SS, FECHA_ALTA, EDAD
  * Removed employee images from interface for cleaner design
  * Updated storage and schema to handle all new required fields
  * Enhanced authentication to default super_admin role for full access
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```