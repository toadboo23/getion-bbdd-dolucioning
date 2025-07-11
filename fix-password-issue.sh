#!/bin/bash

echo "=== DIAGNÓSTICO Y CORRECCIÓN DEL PROBLEMA DE CONTRASEÑAS ==="
echo "Fecha: $(date)"
echo ""

# 1. Verificar el estado actual de la base de datos
echo "1. Verificando usuarios en la base de datos..."
docker exec solucioning_postgres psql -U postgres -d employee_management -c "
SELECT email, role, is_active, 
       CASE 
           WHEN password_hash LIKE '\$2b\$%' THEN 'bcrypt'
           WHEN password_hash LIKE '\$2a\$%' THEN 'bcrypt'
           WHEN password_hash LIKE '\$1\$%' THEN 'md5'
           ELSE 'unknown'
       END as hash_type,
       LENGTH(password_hash) as hash_length
FROM users;
"

echo ""
echo "2. Verificando configuración de bcrypt en el backend..."
docker exec solucioning_backend cat /app/server/auth-local.ts | grep -A 5 -B 5 "bcrypt\|salt\|rounds"

echo ""
echo "3. Creando script de prueba de contraseñas..."
cat > /tmp/test-password.js << 'EOF'
const bcrypt = require('bcrypt');

async function testPassword() {
    const testPassword = 'SolucioningSecurePass2024!';
    const testHash = '$2b$10$YourHashHere'; // Reemplazar con hash real
    
    console.log('Contraseña de prueba:', testPassword);
    console.log('Hash de prueba:', testHash);
    
    try {
        const isValid = await bcrypt.compare(testPassword, testHash);
        console.log('Resultado de validación:', isValid);
    } catch (error) {
        console.log('Error en validación:', error.message);
    }
}

testPassword();
EOF

echo ""
echo "4. Generando nuevo hash de contraseña para comparación..."
docker exec solucioning_backend node -e "
const bcrypt = require('bcrypt');
const password = 'SolucioningSecurePass2024!';
bcrypt.hash(password, 10).then(hash => {
    console.log('Nuevo hash generado:');
    console.log(hash);
    console.log('Longitud del hash:', hash.length);
});
"

echo ""
echo "5. Verificando si el problema es de salt rounds..."
docker exec solucioning_backend node -e "
const bcrypt = require('bcrypt');
const password = 'SolucioningSecurePass2024!';

async function testDifferentRounds() {
    console.log('Probando diferentes salt rounds:');
    for (let rounds = 8; rounds <= 12; rounds++) {
        const hash = await bcrypt.hash(password, rounds);
        console.log(\`Rounds \${rounds}: \${hash.substring(0, 30)}...\`);
    }
}

testDifferentRounds();
"

echo ""
echo "6. Creando script de corrección de contraseñas..."
cat > /tmp/fix-passwords.sql << 'EOF'
-- Script para corregir contraseñas en la base de datos
-- Ejecutar solo si es necesario

-- Opción 1: Actualizar contraseña con nuevo hash
-- UPDATE users 
-- SET password_hash = '$2b$10$nuevoHashAqui'
-- WHERE email = 'nmartinez@solucioning.net';

-- Opción 2: Resetear contraseña a valor conocido
-- UPDATE users 
-- SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
-- WHERE email = 'nmartinez@solucioning.net';

-- Verificar después del cambio
SELECT email, role, is_active FROM users;
EOF

echo ""
echo "7. Verificando configuración de autenticación..."
docker exec solucioning_backend cat /app/server/auth-local.ts | grep -A 10 -B 5 "login\|password"

echo ""
echo "=== RECOMENDACIONES ==="
echo "1. Si el hash en la BD no es bcrypt, necesitamos migrar"
echo "2. Si es bcrypt pero con salt rounds diferentes, ajustar configuración"
echo "3. Si el hash está corrupto, regenerar con nuevo hash"
echo ""
echo "Para aplicar corrección automática, ejecutar:"
echo "docker exec -it solucioning_postgres psql -U postgres -d employee_management -f /tmp/fix-passwords.sql"
echo ""
echo "=== FIN DEL DIAGNÓSTICO ===" 