-- =============================================================================
-- SINCRONIZACIÓN DE prestaciones_consideracion DESDE cob_prestaciones (GESTIÓN)
-- Base de Datos Destino: Debitos (PostgreSQL)
-- Base de Datos Origen: gestion (host=172.16.15.41 port=9090)
-- Criterio Aplicado: Opción A
--   1. Elimina de prestaciones_consideracion los códigos en 'Considerar' que no 
--      existan en cob_prestaciones (depuración de códigos con errores de tipeo).
--   2. Preserva intactos todos los códigos configurados como 'No considerar'.
--   3. Inserta todos los códigos de cob_prestaciones faltantes con estado 'Considerar'.
--   4. Actualiza las descripciones oficiales desde cob_prestaciones sin alterar el estado.
-- =============================================================================

BEGIN;

-- Asegurar que la extensión dblink esté disponible
CREATE EXTENSION IF NOT EXISTS dblink;

-- 1. Tabla temporal para almacenar el catálogo oficial de Gestión
CREATE TEMP TABLE temp_cob_prestaciones (
    codigo VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(255)
) ON COMMIT DROP;

-- 2. Extracción vía dblink directamente desde la tabla cob_prestaciones de Gestión
INSERT INTO temp_cob_prestaciones (codigo, descripcion)
SELECT DISTINCT ON (TRIM(codigo))
    TRIM(codigo) AS codigo,
    TRIM(COALESCE(descripcion, '')) AS descripcion
FROM dblink(
    'host=172.16.15.41 port=9090 dbname=gestion user=yanina password=yanina**333-',
    $gestion$
        SELECT codigo, descripcion, idprestacion
        FROM cob_prestaciones
        WHERE codigo IS NOT NULL AND TRIM(codigo) <> ''
        ORDER BY TRIM(codigo), idprestacion DESC
    $gestion$
) AS cp(codigo VARCHAR, descripcion VARCHAR, idprestacion INT);

-- 3. Depuración (Opción A):
-- Eliminar únicamente los códigos que estén en estado 'Considerar' y que no existan
-- en cob_prestaciones (generados previamente por tipeos erróneos en ambulatorios).
DELETE FROM prestaciones_consideracion
WHERE estado = 'Considerar'
  AND codigo NOT IN (SELECT codigo FROM temp_cob_prestaciones);

-- 4. Inserción masiva y actualización de descripciones oficiales (UPSERT)
-- Si la prestación ya existe (ej. con 'No considerar'), se actualiza la descripción oficial y SE MANTIENE EL ESTADO.
-- Si la prestación es nueva, se inserta con estado 'Considerar'.
INSERT INTO prestaciones_consideracion (codigo, descripcion, estado)
SELECT codigo, descripcion, 'Considerar'
FROM temp_cob_prestaciones
ON CONFLICT (codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion;

COMMIT;

-- 5. Verificación final de la distribución de estados
SELECT estado, COUNT(*) AS cantidad_prestaciones
FROM prestaciones_consideracion
GROUP BY estado
ORDER BY estado;
