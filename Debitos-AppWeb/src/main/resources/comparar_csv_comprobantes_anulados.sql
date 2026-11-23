-- =============================================================================
-- SCRIPT DE COMPARACIÓN: comprobantes anulados.csv vs facturas_anuladas_manual
-- Ubicación del archivo: D:/yanina.domine/Escritorio/comprobantes anulados.csv
-- =============================================================================

-- 1. Crear tabla temporal para alojar los registros del CSV
DROP TABLE IF EXISTS temp_csv_anulados;

CREATE TEMP TABLE temp_csv_anulados (
    cod_inst text,
    institucion text,
    mes_prest text,
    internacion text,
    ambulatorio text,
    incremento text,
    exento text,
    neto_gravado text,
    importe_iva text,
    ing_brutos text,
    total_general text,
    observaciones text,
    suc text,
    n_fund text,
    largo text,
    largo_ptovta text,
    prediction_numero text,
    prediction_ptovta text,
    tipo_arr0 text,
    tipo_arr1 text,
    comprobante text
);

-- 2. Cargar el CSV directamente desde el disco local D
-- NOTA: Si ejecutas desde DBeaver o pgAdmin, usa COPY. Si ejecutas en psql cliente, puedes usar \copy.
COPY temp_csv_anulados FROM 'D:/yanina.domine/Escritorio/comprobantes anulados.csv' 
WITH (FORMAT csv, HEADER true, ENCODING 'LATIN1');

-- =============================================================================
-- CONSULTA 1: RESUMEN GENERAL (Total, Ya en BD, Pendientes)
-- =============================================================================
SELECT 
    COUNT(*) AS total_csv,
    COUNT(fam.id_cabecera) AS ya_en_facturas_anuladas_manual,
    COUNT(*) - COUNT(fam.id_cabecera) AS no_insertados_aun
FROM temp_csv_anulados csv
JOIN cabecera c ON (
    c.comprobante = csv.comprobante 
    OR c.comprobante = (CASE WHEN csv.comprobante LIKE 'FC %' THEN 'FAC ' || SUBSTRING(csv.comprobante FROM 4) ELSE csv.comprobante END)
)
LEFT JOIN facturas_anuladas_manual fam ON fam.id_cabecera = c.id;

-- =============================================================================
-- CONSULTA 2: RESUMEN AGRUPADO POR ESTADO Y TIPO DE COMPROBANTE
-- =============================================================================
SELECT 
    CASE 
        WHEN fam.id_cabecera IS NOT NULL THEN 'YA INSERTADO' 
        ELSE 'NO INSERTADO (PENDIENTE)' 
    END AS estado,
    c.tipo,
    COUNT(*) AS cantidad
FROM temp_csv_anulados csv
JOIN cabecera c ON (
    c.comprobante = csv.comprobante 
    OR c.comprobante = (CASE WHEN csv.comprobante LIKE 'FC %' THEN 'FAC ' || SUBSTRING(csv.comprobante FROM 4) ELSE csv.comprobante END)
)
LEFT JOIN facturas_anuladas_manual fam ON fam.id_cabecera = c.id
GROUP BY 1, c.tipo
ORDER BY 1 DESC, c.tipo;

-- =============================================================================
-- CONSULTA 3: LISTADO DE COMPROBANTES QUE YA ESTÁN EN facturas_anuladas_manual (136)
-- =============================================================================
SELECT 
    csv.comprobante AS comprobante_csv,
    c.comprobante AS comprobante_cabecera,
    c.id AS id_cabecera,
    c.tipo,
    c.letra,
    c.ptovta,
    c.numero,
    c.fecha AS fecha_emision,
    c.cobertura,
    fam.anulada,
    fam.id_cabecera_anulador,
    fam.fecha_anulacion,
    fam.usuario
FROM temp_csv_anulados csv
JOIN cabecera c ON (
    c.comprobante = csv.comprobante 
    OR c.comprobante = (CASE WHEN csv.comprobante LIKE 'FC %' THEN 'FAC ' || SUBSTRING(csv.comprobante FROM 4) ELSE csv.comprobante END)
)
INNER JOIN facturas_anuladas_manual fam ON fam.id_cabecera = c.id
ORDER BY c.fecha DESC, c.id DESC;

-- =============================================================================
-- CONSULTA 4: LISTADO DE COMPROBANTES QUE NO ESTÁN INSERTADOS AÚN (180)
-- =============================================================================
SELECT 
    csv.comprobante AS comprobante_csv,
    c.comprobante AS comprobante_cabecera,
    c.id AS id_cabecera,
    c.tipo,
    c.letra,
    c.ptovta,
    c.numero,
    c.fecha AS fecha_emision,
    c.cobertura,
    c.codigo_cobertura,
    c.debe,
    c.haber,
    csv.mes_prest,
    csv.total_general AS total_csv
FROM temp_csv_anulados csv
JOIN cabecera c ON (
    c.comprobante = csv.comprobante 
    OR c.comprobante = (CASE WHEN csv.comprobante LIKE 'FC %' THEN 'FAC ' || SUBSTRING(csv.comprobante FROM 4) ELSE csv.comprobante END)
)
LEFT JOIN facturas_anuladas_manual fam ON fam.id_cabecera = c.id
WHERE fam.id_cabecera IS NULL
ORDER BY c.tipo, c.fecha DESC, c.id DESC;

-- =============================================================================
-- (OPCIONAL) SCRIPT DE INSERCIÓN MASIVA PARA LOS 180 PENDIENTES
-- =============================================================================
-- Si deseas insertarlos a todos directamente en facturas_anuladas_manual:
/*
INSERT INTO facturas_anuladas_manual (id_cabecera, anulada, fecha_anulacion, usuario)
SELECT 
    c.id AS id_cabecera,
    true AS anulada,
    NOW() AS fecha_anulacion,
    'IMPORTACION_CSV' AS usuario
FROM temp_csv_anulados csv
JOIN cabecera c ON (
    c.comprobante = csv.comprobante 
    OR c.comprobante = (CASE WHEN csv.comprobante LIKE 'FC %' THEN 'FAC ' || SUBSTRING(csv.comprobante FROM 4) ELSE csv.comprobante END)
)
LEFT JOIN facturas_anuladas_manual fam ON fam.id_cabecera = c.id
WHERE fam.id_cabecera IS NULL
ON CONFLICT (id_cabecera) DO NOTHING;
*/
