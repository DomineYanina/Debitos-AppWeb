-- =============================================================================
-- Script de Creación: Módulo Gestión Contable
-- Motor: PostgreSQL
-- Aplicación: Débitos AppWeb
-- =============================================================================

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
    anulada BOOLEAN NOT NULL DEFAULT TRUE
);

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

INSERT INTO prestaciones_consideracion (codigo, descripcion, estado)
SELECT codigo, descripcion, 'Considerar'
FROM temp_cob_prestaciones_init
ON CONFLICT (codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion;
