#!/bin/bash

# Script para limpiar el volumen de postgres y reiniciar la base de datos (solo desarrollo)
# ¡ADVERTENCIA! Esto borra todos los datos locales de la base de datos.

echo "⚠️  Esto eliminará TODOS los datos locales de la base de datos Postgres."
read -p "¿Estás seguro? (escribe 'SI' para continuar): " confirm
if [ "$confirm" != "SI" ]; then
  echo "Cancelado."
  exit 1
fi

echo "🛑 Deteniendo servicios..."
docker-compose down -v

echo "🐳 Levantando servicios limpios..."
docker-compose up --build -d

echo "✅ Base de datos reiniciada." 