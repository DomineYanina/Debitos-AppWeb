-- =============================================================================
-- Vista Materializada: mv_ids_anulados
-- Motor:    PostgreSQL
-- Propósito: Pre-computa el conjunto de IDs excluidos del Tablero de Control
--            (comprobantes anulados y sus anuladores dentro de 15 días) para
--            que las queries de DirectorioService no lo recalculen en cada
--            request (Opción B).
--
-- Opción A aplicada: los OR dentro de los JOINs se reemplazaron por UNION de
--            sub-selects simples sobre columnas indexadas, permitiendo que
--            PostgreSQL use index-nested-loop en lugar de Seq Scan.
--
-- Refresh:   Diario a las 03:00 hs via MaterializedViewRefreshService.
--            Puede refrescarse manualmente con:
--            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ids_anulados;
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_ids_anulados;

CREATE MATERIALIZED VIEW mv_ids_anulados AS
WITH

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. IDs formalmente registrados como anulados en comprobantes_anulados
-- ─────────────────────────────────────────────────────────────────────────────
docs_anulados AS (
    SELECT DISTINCT idcabecera AS id
    FROM comprobantes_anulados
    WHERE idcabecera IS NOT NULL
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Caso 1: Factura (FC) anulada por Nota de Crédito (NC)
--    Split de OR en JOIN → 3 joins simples por UNION (Opción A)
-- ─────────────────────────────────────────────────────────────────────────────
c1_directo AS (
    -- 1a: relación directa c_anulador.asociado = c_anulado.id
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado ON c_anulador.asociado = c_anulado.id
    JOIN   docs_anulados da   ON da.id = c_anulado.id
    WHERE  UPPER(TRIM(c_anulado.tipo))  IN ('FC','FAC','FCE','FCA')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
      AND  COALESCE(c_anulado.debe, 0)  > 0
      AND  COALESCE(c_anulado.debe, 0)  = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),
c1_grupo_a_id AS (
    -- 1b: COALESCE(asociadogrupo, grupo) del anulador apunta al id del anulado
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado ON COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
    JOIN   docs_anulados da   ON da.id = c_anulado.id
    WHERE  c_anulador.asociado IS NULL
      AND  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
      AND  UPPER(TRIM(c_anulado.tipo))  IN ('FC','FAC','FCE','FCA')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
      AND  COALESCE(c_anulado.debe, 0)  > 0
      AND  COALESCE(c_anulado.debe, 0)  = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),
c1_grupo_a_grupo AS (
    -- 1c: grupo del anulador = grupo del anulado (distinto id)
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado
             ON  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo)
               = COALESCE(c_anulado.asociadogrupo,  c_anulado.grupo)
    JOIN   docs_anulados da ON da.id = c_anulado.id
    WHERE  c_anulador.asociado IS NULL
      AND  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
      AND  c_anulador.id <> c_anulado.id
      AND  UPPER(TRIM(c_anulado.tipo))  IN ('FC','FAC','FCE','FCA')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
      AND  COALESCE(c_anulado.debe, 0)  > 0
      AND  COALESCE(c_anulado.debe, 0)  = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Caso 2: Nota de Crédito (NC) anulada por Nota de Débito (ND)
-- ─────────────────────────────────────────────────────────────────────────────
c2_directo AS (
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado ON c_anulador.asociado = c_anulado.id
    JOIN   docs_anulados da   ON da.id = c_anulado.id
    WHERE  UPPER(TRIM(c_anulado.tipo))  IN ('NC','NCE','NCA','NCB')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
      AND  COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0)  > 0
      AND  COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),
c2_grupo_a_id AS (
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado ON COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
    JOIN   docs_anulados da   ON da.id = c_anulado.id
    WHERE  c_anulador.asociado IS NULL
      AND  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
      AND  UPPER(TRIM(c_anulado.tipo))  IN ('NC','NCE','NCA','NCB')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
      AND  COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0)  > 0
      AND  COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),
c2_grupo_a_grupo AS (
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado
             ON  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo)
               = COALESCE(c_anulado.asociadogrupo,  c_anulado.grupo)
    JOIN   docs_anulados da ON da.id = c_anulado.id
    WHERE  c_anulador.asociado IS NULL
      AND  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
      AND  c_anulador.id <> c_anulado.id
      AND  UPPER(TRIM(c_anulado.tipo))  IN ('NC','NCE','NCA','NCB')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
      AND  COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0)  > 0
      AND  COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Caso 3: Nota de Débito (ND) anulada por Nota de Crédito (NC)
-- ─────────────────────────────────────────────────────────────────────────────
c3_directo AS (
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado ON c_anulador.asociado = c_anulado.id
    JOIN   docs_anulados da   ON da.id = c_anulado.id
    WHERE  UPPER(TRIM(c_anulado.tipo))  IN ('ND','NDE','NDA','NDB')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
      AND  COALESCE(c_anulado.debe, 0)  > 0
      AND  COALESCE(c_anulado.debe, 0)  = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),
c3_grupo_a_id AS (
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado ON COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
    JOIN   docs_anulados da   ON da.id = c_anulado.id
    WHERE  c_anulador.asociado IS NULL
      AND  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
      AND  UPPER(TRIM(c_anulado.tipo))  IN ('ND','NDE','NDA','NDB')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
      AND  COALESCE(c_anulado.debe, 0)  > 0
      AND  COALESCE(c_anulado.debe, 0)  = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),
c3_grupo_a_grupo AS (
    SELECT c_anulador.id
    FROM   cabecera c_anulador
    JOIN   cabecera c_anulado
             ON  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo)
               = COALESCE(c_anulado.asociadogrupo,  c_anulado.grupo)
    JOIN   docs_anulados da ON da.id = c_anulado.id
    WHERE  c_anulador.asociado IS NULL
      AND  COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
      AND  c_anulador.id <> c_anulado.id
      AND  UPPER(TRIM(c_anulado.tipo))  IN ('ND','NDE','NDA','NDB')
      AND  UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
      AND  COALESCE(c_anulado.debe, 0)  > 0
      AND  COALESCE(c_anulado.debe, 0)  = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND  c_anulado.fecha  IS NOT NULL
      AND  c_anulador.fecha IS NOT NULL
      AND  ABS(c_anulador.fecha - c_anulado.fecha) <= 15
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Pares FC-NC dentro de 15 días (anulaciones sin registro formal)
--    Split de OR en JOIN → 3 joins simples por UNION (Opción A)
-- ─────────────────────────────────────────────────────────────────────────────
pares_directo AS (
    SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
    FROM   cabecera c_nc
    JOIN   cabecera c_fac ON c_nc.asociado = c_fac.id
    WHERE  UPPER(TRIM(c_nc.tipo))  IN ('NC','NCE','NCA','NCB')
      AND  UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
      AND  COALESCE(c_fac.debe, 0) > 0
      AND  COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
      AND  c_fac.fecha IS NOT NULL
      AND  c_nc.fecha  IS NOT NULL
      AND  ABS(c_nc.fecha - c_fac.fecha) <= 15
      AND  c_fac.fecha >= DATE '2024-01-01'
      AND  c_nc.fecha  >= DATE '2024-01-01'
),
pares_grupo_a_id AS (
    SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
    FROM   cabecera c_nc
    JOIN   cabecera c_fac ON COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
    WHERE  c_nc.asociado IS NULL
      AND  COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
      AND  UPPER(TRIM(c_nc.tipo))  IN ('NC','NCE','NCA','NCB')
      AND  UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
      AND  COALESCE(c_fac.debe, 0) > 0
      AND  COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
      AND  c_fac.fecha IS NOT NULL
      AND  c_nc.fecha  IS NOT NULL
      AND  ABS(c_nc.fecha - c_fac.fecha) <= 15
      AND  c_fac.fecha >= DATE '2024-01-01'
      AND  c_nc.fecha  >= DATE '2024-01-01'
),
pares_grupo_a_grupo AS (
    SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
    FROM   cabecera c_nc
    JOIN   cabecera c_fac
             ON  COALESCE(c_nc.asociadogrupo,  c_nc.grupo)
               = COALESCE(c_fac.asociadogrupo, c_fac.grupo)
    WHERE  c_nc.asociado IS NULL
      AND  COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
      AND  c_nc.id <> c_fac.id
      AND  UPPER(TRIM(c_nc.tipo))  IN ('NC','NCE','NCA','NCB')
      AND  UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
      AND  COALESCE(c_fac.debe, 0) > 0
      AND  COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
      AND  c_fac.fecha IS NOT NULL
      AND  c_nc.fecha  IS NOT NULL
      AND  ABS(c_nc.fecha - c_fac.fecha) <= 15
      AND  c_fac.fecha >= DATE '2024-01-01'
      AND  c_nc.fecha  >= DATE '2024-01-01'
)

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Unión final de todos los IDs a excluir
-- ─────────────────────────────────────────────────────────────────────────────
SELECT DISTINCT id
FROM (
    SELECT id           FROM docs_anulados
    UNION SELECT id     FROM c1_directo
    UNION SELECT id     FROM c1_grupo_a_id
    UNION SELECT id     FROM c1_grupo_a_grupo
    UNION SELECT id     FROM c2_directo
    UNION SELECT id     FROM c2_grupo_a_id
    UNION SELECT id     FROM c2_grupo_a_grupo
    UNION SELECT id     FROM c3_directo
    UNION SELECT id     FROM c3_grupo_a_id
    UNION SELECT id     FROM c3_grupo_a_grupo
    UNION SELECT id_fac FROM pares_directo
    UNION SELECT id_nc  FROM pares_directo
    UNION SELECT id_fac FROM pares_grupo_a_id
    UNION SELECT id_nc  FROM pares_grupo_a_id
    UNION SELECT id_fac FROM pares_grupo_a_grupo
    UNION SELECT id_nc  FROM pares_grupo_a_grupo
) t
WHERE id IS NOT NULL;

-- Índice único requerido para REFRESH MATERIALIZED VIEW CONCURRENTLY
-- (permite refrescar sin bloquear lecturas simultáneas)
CREATE UNIQUE INDEX IF NOT EXISTS mv_ids_anulados_id_idx ON mv_ids_anulados (id);

-- Refresh inicial (ejecutar una vez luego de crear la vista)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ids_anulados;
