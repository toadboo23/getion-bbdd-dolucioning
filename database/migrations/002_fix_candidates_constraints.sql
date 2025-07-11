-- Eliminar índice único sobre telefono si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'candidates' AND indexname = 'candidates_telefono_key'
    ) THEN
        EXECUTE 'DROP INDEX candidates_telefono_key';
    END IF;
END$$;

-- Limpiar tablas de comentarios y candidatos
TRUNCATE TABLE candidate_comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE candidates RESTART IDENTITY CASCADE; 