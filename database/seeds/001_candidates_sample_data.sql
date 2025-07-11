-- =====================================================
-- SEED: Datos de prueba para candidatos
-- Fecha: 2024-01-10
-- Descripción: Datos de ejemplo para testing y desarrollo
-- =====================================================

-- Insertar candidatos de ejemplo
INSERT INTO candidates (nombre, apellido, dni_nie, telefono, email, estado, ciudad, experiencia, observaciones, fuente, created_by) VALUES
-- Candidatos nuevos
('María', 'García López', '12345678A', '+34 600 123 456', 'maria.garcia@email.com', 'nuevo', 'Madrid', '5 años en desarrollo web', 'Perfil interesante con experiencia en React', 'LinkedIn', 'nmartinez@solucioning.net'),
('Carlos', 'Rodríguez Martín', '87654321B', '+34 600 654 321', 'carlos.rodriguez@email.com', 'nuevo', 'Barcelona', '3 años en frontend', 'Buen conocimiento de TypeScript', 'Indeed', 'nmartinez@solucioning.net'),
('Ana', 'Fernández Ruiz', '11223344C', '+34 600 111 222', 'ana.fernandez@email.com', 'nuevo', 'Valencia', '4 años en UX/UI', 'Portfolio muy creativo', 'InfoJobs', 'nmartinez@solucioning.net'),

-- Candidatos contactados
('Luis', 'Martínez Sánchez', '22334455D', '+34 600 333 444', 'luis.martinez@email.com', 'contactado', 'Madrid', '6 años en desarrollo full-stack', 'Interesado en la posición', 'LinkedIn', 'nmartinez@solucioning.net'),
('Elena', 'González Pérez', '33445566E', '+34 600 555 666', 'elena.gonzalez@email.com', 'contactado', 'Alicante', '2 años en React Native', 'Disponible para entrevista', 'Indeed', 'nmartinez@solucioning.net'),

-- Candidatos en proceso
('David', 'López García', '44556677F', '+34 600 777 888', 'david.lopez@email.com', 'en_proceso_seleccion', 'Málaga', '7 años en arquitectura de software', 'Excelente perfil técnico', 'Referido', 'nmartinez@solucioning.net'),
('Sofia', 'Hernández Martín', '55667788G', '+34 600 999 000', 'sofia.hernandez@email.com', 'en_proceso_seleccion', 'Madrid Norte (Majadahonda - Las Rozas - Boadilla - Torrelodones - Galapagar)', '4 años en DevOps', 'Muy interesada en la empresa', 'Web', 'nmartinez@solucioning.net'),

-- Candidatos entrevistados
('Javier', 'Moreno Ruiz', '66778899H', '+34 600 111 333', 'javier.moreno@email.com', 'entrevistado', 'Sevilla', '5 años en backend', 'Entrevista muy positiva', 'LinkedIn', 'nmartinez@solucioning.net'),
('Carmen', 'Jiménez López', '77889900I', '+34 600 444 555', 'carmen.jimenez@email.com', 'entrevistado', 'Las Palmas', '3 años en QA', 'Buenas habilidades de testing', 'Indeed', 'nmartinez@solucioning.net'),

-- Candidatos aprobados
('Roberto', 'Díaz Fernández', '88990011J', '+34 600 666 777', 'roberto.diaz@email.com', 'aprobado', 'Madrid', '8 años en desarrollo senior', 'Perfil excepcional, aprobado por el equipo', 'Referido', 'nmartinez@solucioning.net'),

-- Candidatos contratados
('Isabel', 'Vázquez García', '99001122K', '+34 600 888 999', 'isabel.vazquez@email.com', 'contratado', 'Barcelona', '6 años en frontend senior', 'Contratada para el equipo de React', 'LinkedIn', 'nmartinez@solucioning.net'),

-- Candidatos rechazados
('Miguel', 'Alonso Martín', '00112233L', '+34 600 000 111', 'miguel.alonso@email.com', 'rechazado', 'Valencia', '2 años en desarrollo', 'No cumple requisitos mínimos', 'InfoJobs', 'nmartinez@solucioning.net'),

-- Candidatos descartados
('Patricia', 'Castro Ruiz', '11223344M', '+34 600 222 333', 'patricia.castro@email.com', 'descartado', 'Móstoles - Alcorcón - Arroyomolinos', '1 año en desarrollo', 'Sin experiencia suficiente', 'Web', 'nmartinez@solucioning.net'),

-- Candidatos en espera
('Francisco', 'Romero López', '22334455N', '+34 600 444 555', 'francisco.romero@email.com', 'en_espera', 'Madrid', '4 años en desarrollo', 'Esperando respuesta del candidato', 'LinkedIn', 'nmartinez@solucioning.net');

-- Insertar comentarios de ejemplo
INSERT INTO candidate_comments (candidate_id, tipo, comentario, created_by) VALUES
-- Comentarios para María García
(1, 'observacion', 'Perfil muy interesante con experiencia en React y TypeScript', 'nmartinez@solucioning.net'),
(1, 'email', 'Enviado email de contacto con información de la empresa', 'nmartinez@solucioning.net'),

-- Comentarios para Carlos Rodríguez
(2, 'observacion', 'Buen conocimiento de frontend, experiencia en proyectos grandes', 'nmartinez@solucioning.net'),
(2, 'llamada', 'Llamada realizada, interesado en conocer más detalles', 'nmartinez@solucioning.net'),

-- Comentarios para Ana Fernández
(3, 'observacion', 'Portfolio muy creativo, habilidades de diseño excepcionales', 'nmartinez@solucioning.net'),
(3, 'whatsapp', 'Contacto vía WhatsApp, respondió rápidamente', 'nmartinez@solucioning.net'),

-- Comentarios para Luis Martínez
(4, 'llamada', 'Llamada inicial realizada, muy profesional', 'nmartinez@solucioning.net'),
(4, 'email', 'Enviado email con descripción detallada del puesto', 'nmartinez@solucioning.net'),
(4, 'seguimiento', 'Candidato muy interesado, programar entrevista', 'nmartinez@solucioning.net'),

-- Comentarios para Elena González
(5, 'llamada', 'Llamada realizada, disponible para entrevista', 'nmartinez@solucioning.net'),
(5, 'observacion', 'Experiencia en React Native muy valorada', 'nmartinez@solucioning.net'),

-- Comentarios para David López
(6, 'entrevista', 'Entrevista técnica realizada, excelente nivel', 'nmartinez@solucioning.net'),
(6, 'observacion', 'Perfil muy sólido, considerar para posición senior', 'nmartinez@solucioning.net'),

-- Comentarios para Sofia Hernández
(7, 'entrevista', 'Entrevista cultural realizada, muy buena impresión', 'nmartinez@solucioning.net'),
(7, 'observacion', 'Experiencia en DevOps muy valorada para el equipo', 'nmartinez@solucioning.net'),

-- Comentarios para Javier Moreno
(8, 'entrevista', 'Entrevista técnica completada, nivel intermedio-alto', 'nmartinez@solucioning.net'),
(8, 'observacion', 'Buen conocimiento de backend, considerar para el equipo', 'nmartinez@solucioning.net'),

-- Comentarios para Carmen Jiménez
(9, 'entrevista', 'Entrevista de QA realizada, buenas habilidades', 'nmartinez@solucioning.net'),
(9, 'observacion', 'Experiencia en testing automatizado muy útil', 'nmartinez@solucioning.net'),

-- Comentarios para Roberto Díaz
(10, 'entrevista', 'Entrevista final realizada, perfil excepcional', 'nmartinez@solucioning.net'),
(10, 'observacion', 'Aprobado por todo el equipo, proceder con oferta', 'nmartinez@solucioning.net'),
(10, 'seguimiento', 'Oferta enviada, esperando respuesta', 'nmartinez@solucioning.net'),

-- Comentarios para Isabel Vázquez
(11, 'entrevista', 'Entrevista final completada, excelente candidata', 'nmartinez@solucioning.net'),
(11, 'observacion', 'Contratada para el equipo de React, incorporación próxima', 'nmartinez@solucioning.net'),

-- Comentarios para Miguel Alonso
(12, 'entrevista', 'Entrevista realizada, no cumple requisitos mínimos', 'nmartinez@solucioning.net'),
(12, 'observacion', 'Experiencia insuficiente para el puesto', 'nmartinez@solucioning.net'),

-- Comentarios para Patricia Castro
(13, 'observacion', 'Perfil revisado, sin experiencia suficiente', 'nmartinez@solucioning.net'),
(13, 'email', 'Email de rechazo enviado', 'nmartinez@solucioning.net'),

-- Comentarios para Francisco Romero
(14, 'llamada', 'Llamada realizada, candidato en proceso de decisión', 'nmartinez@solucioning.net'),
(14, 'seguimiento', 'Esperando respuesta del candidato sobre la oferta', 'nmartinez@solucioning.net');

-- =====================================================
-- FIN DE SEED
-- ===================================================== 