-- =============================================================================
-- MIGRACIÓN SERVIDOR: Módulo Gestión Contable (rol OPERADOR_CONTADURIA)
-- Motor:       PostgreSQL
-- Base:        Débitos (la base propia de la aplicación; NO ejecutar en 'gestion')
-- Idempotente: se puede ejecutar más de una vez sin duplicar datos.
--
-- ORDEN DE EJECUCIÓN:
--   PARTE 1 - Tablas, índices y datos iniciales (rápida, transaccional)
--   PARTE 2 - Recrear vista materializada mv_ids_anulados (puede tardar;
--             ejecutar en horario de baja carga)
--   PARTE 3 - Verificación
--
-- Requisitos previos: deben existir las tablas cabecera, amb_liquidado y
-- comprobantes_anulados (ya presentes en la base de la aplicación).
-- =============================================================================

-- #############################################################################
-- PARTE 1: TABLAS DEL MÓDULO
-- #############################################################################
BEGIN;
-- 1. Catálogo de Tipos de Operación
CREATE TABLE IF NOT EXISTS tipo_operacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL
);

INSERT INTO tipo_operacion (codigo, descripcion) VALUES
    ('COBERTURA_RENOMBRE', 'Cambio de nombre a mostrar de cobertura'),
    ('PERIODO_CORRECCION', 'Corrección del período de factura'),
    ('PRESTACION_ESTADO', 'Modificación de estado de prestación (Considerar / No considerar)'),
    ('FACTURA_ANULADA_MANUAL', 'Anulación manual de factura en Débitos'),
    ('FACTURA_DESANULADA_MANUAL', 'Reversión de anulación manual de factura')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Tabla Central de Historial y Auditoría Inmutable
CREATE TABLE IF NOT EXISTS historial_ajustes_contabilidad (
    id BIGSERIAL PRIMARY KEY,
    id_tipo_operacion INTEGER NOT NULL REFERENCES tipo_operacion(id),
    referencia VARCHAR(150) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario VARCHAR(100) NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_contab_tipo ON historial_ajustes_contabilidad (id_tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_historial_contab_ref ON historial_ajustes_contabilidad (referencia);
CREATE INDEX IF NOT EXISTS idx_historial_contab_fecha ON historial_ajustes_contabilidad (fecha_hora DESC);

-- 3. Tabla: Mapeo de Nombres de Coberturas (Alias)
CREATE TABLE IF NOT EXISTS coberturas_alias (
    codigo_cobertura VARCHAR(50) PRIMARY KEY,
    nombre_original VARCHAR(255),
    nombre_mostrar VARCHAR(255) NOT NULL
);

-- 4. Tabla: Corrección de Períodos de Facturas
CREATE TABLE IF NOT EXISTS facturas_periodos_corregidos (
    id_cabecera BIGINT PRIMARY KEY REFERENCES cabecera(id) ON DELETE CASCADE,
    periodo_original DATE,
    periodo_corregido DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fact_per_corregido ON facturas_periodos_corregidos (periodo_corregido);

-- 5. Tabla: Prestaciones a Considerar / No Considerar (Consumo externo)
CREATE TABLE IF NOT EXISTS prestaciones_consideracion (
    codigo VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'Considerar'
);

CREATE INDEX IF NOT EXISTS idx_prestaciones_estado ON prestaciones_consideracion (estado);

-- 6. Tabla: Facturas Anuladas Manualmente
CREATE TABLE IF NOT EXISTS facturas_anuladas_manual (
    id_cabecera BIGINT PRIMARY KEY REFERENCES cabecera(id) ON DELETE CASCADE,
    anulada BOOLEAN NOT NULL DEFAULT TRUE,
    id_cabecera_anulador BIGINT REFERENCES cabecera(id) ON DELETE SET NULL,
    fecha_anulacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(100)
);

ALTER TABLE facturas_anuladas_manual ADD COLUMN IF NOT EXISTS id_cabecera_anulador BIGINT REFERENCES cabecera(id) ON DELETE SET NULL;
ALTER TABLE facturas_anuladas_manual ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE facturas_anuladas_manual ADD COLUMN IF NOT EXISTS usuario VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_fam_anulador ON facturas_anuladas_manual (id_cabecera_anulador);

-- 7. Población de prestaciones exclusivamente desde cob_prestaciones de Gestión vía dblink
CREATE EXTENSION IF NOT EXISTS dblink;

CREATE TEMP TABLE IF NOT EXISTS temp_cob_prestaciones_init (
    codigo VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(255)
) ON COMMIT DROP;

INSERT INTO temp_cob_prestaciones_init (codigo, descripcion)
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

-- Eliminar de prestaciones_consideracion los códigos con 'Considerar' que no existan en cob_prestaciones
DELETE FROM prestaciones_consideracion
WHERE estado = 'Considerar'
  AND codigo NOT IN (SELECT codigo FROM temp_cob_prestaciones_init);

INSERT INTO prestaciones_consideracion (codigo, descripcion, estado)
SELECT codigo, descripcion, 'Considerar'
FROM temp_cob_prestaciones_init
ON CONFLICT (codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion;

-- 8. Población inicial de coberturas_alias (desde tabla local 'coberturas' si existe, o ver poblar_coberturas_alias.sql)
INSERT INTO coberturas_alias (codigo_cobertura, nombre_original, nombre_mostrar)
SELECT TRIM(codigo), TRIM(nombre), TRIM(nombre)
FROM coberturas
WHERE codigo IS NOT NULL AND TRIM(codigo) <> ''
ON CONFLICT (codigo_cobertura) DO NOTHING;

COMMIT;

-- #############################################################################
-- PARTE 2: VISTA MATERIALIZADA mv_ids_anulados
-- Se recrea para incluir las facturas anuladas manualmente
-- (facturas_anuladas_manual) en el conjunto de IDs excluidos del Tablero.
-- #############################################################################
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
--    y en facturas_anuladas_manual (Gestión Contable)
-- ─────────────────────────────────────────────────────────────────────────────
docs_anulados AS (
    (
        SELECT DISTINCT idcabecera AS id
        FROM comprobantes_anulados
        WHERE idcabecera IS NOT NULL
        UNION
        SELECT DISTINCT id_cabecera AS id
        FROM facturas_anuladas_manual
        WHERE anulada = TRUE
        UNION
        SELECT DISTINCT id_cabecera_anulador AS id
        FROM facturas_anuladas_manual
        WHERE anulada = TRUE AND id_cabecera_anulador IS NOT NULL
    )
    EXCEPT
    SELECT DISTINCT id_cabecera AS id
    FROM facturas_anuladas_manual
    WHERE anulada = FALSE
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


REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ids_anulados;

-- #############################################################################
-- PARTE 3: VERIFICACIÓN (todas deben devolver una tabla/vista, no NULL)
-- #############################################################################
SELECT to_regclass('public.tipo_operacion')                  AS tipo_operacion,
       to_regclass('public.historial_ajustes_contabilidad')  AS historial,
       to_regclass('public.coberturas_alias')                AS coberturas_alias,
       to_regclass('public.facturas_periodos_corregidos')    AS periodos_corregidos,
       to_regclass('public.prestaciones_consideracion')      AS prestaciones,
       to_regclass('public.facturas_anuladas_manual')        AS anuladas_manual,
       to_regclass('public.mv_ids_anulados')                 AS mv_ids_anulados;

SELECT * FROM tipo_operacion ORDER BY id;               -- debe listar 5 tipos
SELECT estado, COUNT(*) FROM prestaciones_consideracion GROUP BY estado;
