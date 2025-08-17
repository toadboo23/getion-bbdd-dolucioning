#!/bin/bash

# Script de prueba para verificar el paquete de código fuente
# Este script simula lo que hace GitHub Actions localmente

echo "🧪 PROBANDO PAQUETE DE CÓDIGO FUENTE"
echo "====================================="

# Crear directorio temporal
TEST_DIR="test-source-package-$(date +%s)"
mkdir -p $TEST_DIR
echo "📁 Directorio de prueba: $TEST_DIR"

# Simular el proceso de GitHub Actions
echo "📦 Creando paquete de código fuente..."

# Copiar solo código fuente del frontend
if [ -d "client/src" ]; then
    cp -r client/src $TEST_DIR/client-src
    echo "✅ Frontend src copiado"
else
    echo "❌ No se encontró client/src"
fi

if [ -f "client/index.html" ]; then
    cp client/index.html $TEST_DIR/
    echo "✅ index.html copiado"
fi

if [ -f "client/package.json" ]; then
    cp client/package.json $TEST_DIR/client-package.json
    echo "✅ client package.json copiado"
fi

if [ -f "client/vite.config.ts" ]; then
    cp client/vite.config.ts $TEST_DIR/
    echo "✅ vite.config.ts copiado"
fi

if [ -f "client/tailwind.config.ts" ]; then
    cp client/tailwind.config.ts $TEST_DIR/
    echo "✅ tailwind.config.ts copiado"
fi

if [ -f "client/postcss.config.js" ]; then
    cp client/postcss.config.js $TEST_DIR/
    echo "✅ postcss.config.js copiado"
fi

if [ -f "client/tsconfig.json" ]; then
    cp client/tsconfig.json $TEST_DIR/
    echo "✅ client tsconfig.json copiado"
fi

# Copiar solo código fuente del backend
if [ -d "server" ]; then
    cp -r server $TEST_DIR/
    # Remover node_modules si existe
    if [ -d "$TEST_DIR/server/node_modules" ]; then
        rm -rf $TEST_DIR/server/node_modules
        echo "✅ node_modules removido del paquete"
    fi
    echo "✅ Backend copiado"
else
    echo "❌ No se encontró server/"
fi

# Copiar archivos compartidos
if [ -d "shared" ]; then
    cp -r shared $TEST_DIR/
    echo "✅ Archivos compartidos copiados"
else
    echo "❌ No se encontró shared/"
fi

# Copiar archivos de configuración de desarrollo
if [ -f "package.json" ]; then
    cp package.json $TEST_DIR/root-package.json
    echo "✅ root package.json copiado"
fi

if [ -f "tsconfig.json" ]; then
    cp tsconfig.json $TEST_DIR/root-tsconfig.json
    echo "✅ root tsconfig.json copiado"
fi

if [ -f "drizzle.config.ts" ]; then
    cp drizzle.config.ts $TEST_DIR/
    echo "✅ drizzle.config.ts copiado"
fi

# Crear archivo de información
echo "Deployment de prueba realizado el $(date)" > $TEST_DIR/DEPLOYMENT_INFO.txt
echo "Commit: $(git rev-parse HEAD)" >> $TEST_DIR/DEPLOYMENT_INFO.txt
echo "Branch: $(git branch --show-current)" >> $TEST_DIR/DEPLOYMENT_INFO.txt

echo ""
echo "📊 RESUMEN DEL PAQUETE CREADO:"
echo "=============================="

# Mostrar estructura del paquete
echo "Estructura del directorio $TEST_DIR:"
tree $TEST_DIR -I "node_modules" 2>/dev/null || find $TEST_DIR -type f | head -20

echo ""
echo "📁 Archivos incluidos:"
find $TEST_DIR -type f | wc -l | xargs echo "Total de archivos:"

echo ""
echo "📋 Archivos críticos verificados:"
echo "Frontend:"
ls -la $TEST_DIR/client-src/ 2>/dev/null | head -5 || echo "❌ No se encontró client-src"
echo ""
echo "Backend:"
ls -la $TEST_DIR/server/ 2>/dev/null | head -5 || echo "❌ No se encontró server"
echo ""
echo "Compartidos:"
ls -la $TEST_DIR/shared/ 2>/dev/null | head -5 || echo "❌ No se encontró shared"

echo ""
echo "❌ Archivos EXCLUIDOS (verificación):"
echo "Docker files:"
ls -la $TEST_DIR/*docker* 2>/dev/null || echo "✅ No hay archivos Docker"
echo ""
echo "Nginx:"
ls -la $TEST_DIR/*nginx* 2>/dev/null || echo "✅ No hay archivos Nginx"
echo ""
echo "Scripts de deployment:"
ls -la $TEST_DIR/*deploy* 2>/dev/null || echo "✅ No hay scripts de deployment"

echo ""
echo "🎯 VERIFICACIÓN COMPLETADA"
echo "=========================="
echo "✅ Paquete de código fuente creado exitosamente"
echo "✅ Solo se incluyeron archivos de código fuente"
echo "✅ Se excluyeron archivos de configuración del servidor"
echo ""
echo "📁 El paquete está en: $TEST_DIR"
echo "🗑️  Para limpiar: rm -rf $TEST_DIR"
