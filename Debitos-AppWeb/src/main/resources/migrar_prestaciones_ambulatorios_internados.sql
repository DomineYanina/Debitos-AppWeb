-- =============================================================================
-- MIGRACIÓN: Agregar Estado Ambulatorios y Estado Internados a prestaciones_consideracion
-- Fecha: 2026-11-20
-- =============================================================================

-- 1. Agregar columnas si no existen
ALTER TABLE prestaciones_consideracion 
ADD COLUMN IF NOT EXISTS estado_ambulatorio VARCHAR(20) NOT NULL DEFAULT 'Considerar';

ALTER TABLE prestaciones_consideracion 
ADD COLUMN IF NOT EXISTS estado_internado VARCHAR(20) NOT NULL DEFAULT 'Considerar';

-- 2. Migrar estados existentes desde la columna 'estado'
UPDATE prestaciones_consideracion
SET estado_ambulatorio = COALESCE(estado, 'Considerar'),
    estado_internado = COALESCE(estado, 'Considerar')
WHERE estado IS NOT NULL;

-- 3. Crear índices para optimizar filtros por cada estado
CREATE INDEX IF NOT EXISTS idx_prestaciones_estado_amb ON prestaciones_consideracion (estado_ambulatorio);
CREATE INDEX IF NOT EXISTS idx_prestaciones_estado_int ON prestaciones_consideracion (estado_internado);
