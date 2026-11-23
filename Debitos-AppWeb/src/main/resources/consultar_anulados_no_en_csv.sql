-- =============================================================================
-- CONSULTA: Documentos Anulados en Base de Datos que NO están en el CSV
-- Ubicación del CSV: D:/yanina.domine/Escritorio/comprobantes anulados.csv
-- =============================================================================

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

COPY temp_csv_anulados FROM 'D:/yanina.domine/Escritorio/comprobantes anulados.csv' 
WITH (FORMAT csv, HEADER true, ENCODING 'LATIN1');

-- 1. Resumen: Documentos en facturas_anuladas_manual que NO están en el CSV
SELECT 
    CASE 
        WHEN c.ptovta IN (30, 31, 32, 36, 53) THEN 'Puntos de Venta Oficiales (30,31,32,36,53)'
        ELSE 'Otros Puntos de Venta (99, 2, 3, etc.)'
    END AS grupo_punto_venta,
    c.tipo,
    COUNT(*) AS cantidad,
    ROUND(SUM(COALESCE(NULLIF(c.debe, 0), c.haber, 0)), 2) AS importe_total
FROM facturas_anuladas_manual fam
JOIN cabecera c ON fam.id_cabecera = c.id
LEFT JOIN temp_csv_anulados csv ON (
    csv.comprobante = c.comprobante
    OR (csv.comprobante LIKE 'FC %' AND c.comprobante = 'FAC ' || SUBSTRING(csv.comprobante FROM 4))
)
WHERE csv.comprobante IS NULL
GROUP BY 1, 2
ORDER BY 1, 2;

-- 2. Detalle de los 200 comprobantes de Puntos de Venta Oficiales NO incluidos en el CSV
SELECT 
    c.id AS id_cabecera,
    c.comprobante AS comprobante_anulado,
    c.tipo,
    c.letra,
    c.ptovta,
    c.numero,
    c.fecha AS fecha_emision,
    c.cobertura,
    c.codigo_cobertura,
    COALESCE(NULLIF(c.debe, 0), c.haber, 0) AS importe,
    anul.comprobante AS comprobante_anulador,
    anul.tipo AS tipo_anulador,
    anul.fecha AS fecha_anulador,
    fam.fecha_anulacion
FROM facturas_anuladas_manual fam
JOIN cabecera c ON fam.id_cabecera = c.id
LEFT JOIN cabecera anul ON fam.id_cabecera_anulador = anul.id
LEFT JOIN temp_csv_anulados csv ON (
    csv.comprobante = c.comprobante
    OR (csv.comprobante LIKE 'FC %' AND c.comprobante = 'FAC ' || SUBSTRING(csv.comprobante FROM 4))
)
WHERE csv.comprobante IS NULL
  AND c.ptovta IN (30, 31, 32, 36, 53)
ORDER BY c.fecha DESC, c.id DESC;
