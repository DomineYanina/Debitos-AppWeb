-- =============================================================================
-- Script de Migración y Propagación de 'tiporegistro' en Débitos
-- =============================================================================
-- Este script:
-- 1. Crea el índice en cabecera(tiporegistro) para optimizar búsquedas y filtros.
-- 2. Asigna 'tiporegistro' ('Ambulatorios' o 'Internados') a las facturas basándose
--    en las prestaciones liquidadas locales (tabla amb_liquidado).
-- 3. Asigna 'tiporegistro' a las facturas restantes consultando Gestión
--    (tabla cob_liquidaciones, columna ambint) vía dblink.
-- 4. Propaga 'tiporegistro' desde las facturas a todos sus comprobantes hijos
--    (Notas de Crédito NC, Notas de Débito ND, Recibos RC) mediante:
--    a) Vinculación directa (c_hijo.asociado = c_padre.id)
--    b) Vinculación por grupo familiar (c_hijo.asociadogrupo = c_fac.asociadogrupo)
--    c) Vinculación por grupo legacy (c_hijo.grupo = c_fac.grupo)
-- =============================================================================

BEGIN;

-- 1. Índice para alto rendimiento
CREATE INDEX IF NOT EXISTS idx_cabecera_tiporegistro ON cabecera (tiporegistro);

-- 2. Asignar tiporegistro a facturas desde amb_liquidado local
UPDATE cabecera c
SET tiporegistro = sub.tiporegistro
FROM (
    SELECT idcabecera, tiporegistro
    FROM (
        SELECT idcabecera, tiporegistro,
               ROW_NUMBER() OVER(PARTITION BY idcabecera ORDER BY COUNT(*) DESC) as rn
        FROM amb_liquidado
        WHERE idcabecera IS NOT NULL AND tiporegistro IN ('Ambulatorios', 'Internados')
        GROUP BY idcabecera, tiporegistro
    ) t
    WHERE t.rn = 1
) sub
WHERE c.id = sub.idcabecera
  AND c.tiporegistro IS NULL;

-- 3. Asignar tiporegistro a facturas desde cob_liquidaciones en Gestión
UPDATE cabecera c
SET tiporegistro = CASE 
    WHEN UPPER(TRIM(g.ambint)) = 'I' THEN 'Internados'
    WHEN UPPER(TRIM(g.ambint)) = 'A' THEN 'Ambulatorios'
    ELSE NULL
END
FROM (
    SELECT DISTINCT ON (letra, num4, num8) letra, num4, num8, ambint
    FROM dblink('host=172.16.15.41 port=9090 dbname=gestion user=yanina password=yanina**333-',
                'SELECT letra, num4, num8, ambint, idliquidacion FROM cob_liquidaciones WHERE ambint IN (''A'', ''I'') ORDER BY letra, num4, num8, idliquidacion DESC')
        AS t(letra varchar, num4 varchar, num8 varchar, ambint varchar, idliquidacion int)
) g
WHERE c.letra = g.letra
  AND LPAD(c.ptovta::text, 4, '0') = g.num4
  AND LPAD(c.numero::text, 8, '0') = g.num8
  AND UPPER(TRIM(c.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
  AND c.tiporegistro IS NULL;

-- 4. Propagación a documentos hijos por 'asociado' directo
UPDATE cabecera c_hijo
SET tiporegistro = c_padre.tiporegistro
FROM cabecera c_padre
WHERE c_hijo.asociado = c_padre.id
  AND c_padre.tiporegistro IS NOT NULL
  AND c_hijo.tiporegistro IS NULL;

-- 5. Propagación a documentos hijos por 'asociadogrupo'
UPDATE cabecera c_hijo
SET tiporegistro = c_fac.tiporegistro
FROM cabecera c_fac
WHERE c_hijo.asociadogrupo = c_fac.asociadogrupo
  AND c_fac.asociadogrupo IS NOT NULL AND c_fac.asociadogrupo > 0
  AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
  AND c_fac.tiporegistro IS NOT NULL
  AND c_hijo.tiporegistro IS NULL;

-- 6. Propagación a documentos hijos por 'grupo' legacy
UPDATE cabecera c_hijo
SET tiporegistro = c_fac.tiporegistro
FROM cabecera c_fac
WHERE c_hijo.grupo = c_fac.grupo
  AND c_fac.grupo IS NOT NULL AND c_fac.grupo > 0
  AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
  AND c_fac.tiporegistro IS NOT NULL
  AND c_hijo.tiporegistro IS NULL;

-- Verificación final
SELECT tiporegistro, count(*) AS total_comprobantes
FROM cabecera
GROUP BY tiporegistro
ORDER BY total_comprobantes DESC;

COMMIT;
