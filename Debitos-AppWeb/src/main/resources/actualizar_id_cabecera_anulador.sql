-- =============================================================================
-- ACTUALIZACIÓN DE id_cabecera_anulador EN facturas_anuladas_manual
-- Motor: PostgreSQL (compatible >= 9.6) | Base: Débitos
--
-- Descripción:
--   Replica los métodos de detección de documentos anulados y anuladores
--   utilizados por la aplicación (DirectorioService, CabeceraRepository,
--   vista materializada mv_ids_anulados y AuditoriaService) para identificar,
--   para cada documento anulado registrado en facturas_anuladas_manual,
--   el id de cabecera de su documento anulador y asignarlo en
--   id_cabecera_anulador.
--
-- Reglas de detección aplicadas:
--   1. Pares de tipos válidos (resolverTipoBase):
--        - Caso 1: FC / FAC / FCE / FCA / FCB / FR  anulada por  NC / NCE / NCA / NCB
--        - Caso 2: NC / NCE / NCA / NCB             anulada por  ND / NDE / NDA / NDB
--        - Caso 3: ND / NDE / NDA / NDB             anulada por  NC / NCE / NCA / NCB
--   2. Importe positivo e idéntico:
--        - FC / ND: COALESCE(debe, 0)
--        - NC:      COALESCE(NULLIF(haber, 0), debe, 0)
--   3. Proximidad temporal:
--        - ABS(c_anulador.fecha - c_anulado.fecha) <= 15 días
--   4. Prioridad de vinculación:
--        P1: Vínculo directo unidireccional (c_anulador.asociado = c_anulado.id)
--        P2: Vínculo directo mutuo histórico (prevalece como anulador el posterior
--            por fecha o, a igual fecha, mayor id)
--        P3: Grupo del anulador apuntando al ID del anulado
--            (COALESCE(asociadogrupo, grupo) = c_anulado.id, sin asociado directo)
--        P4: Fallback relacional de AuditoriaService
--            (notadecredito / notadedebito / nd_ajustedeiva)
--        P5: Mismo grupo compartido (COALESCE(asociadogrupo, grupo)), aplicando
--            criterio cronológico para pares NC <-> ND sin jerarquía directa
-- =============================================================================

WITH anulados_objetivo AS (
    SELECT
        fam.id_cabecera,
        c.tipo,
        c.letra,
        c.ptovta,
        c.numero,
        c.fecha,
        c.debe,
        c.haber,
        c.asociado,
        COALESCE(c.asociadogrupo, c.grupo) AS grupo_idx
    FROM facturas_anuladas_manual fam
    JOIN cabecera c ON c.id = fam.id_cabecera
    WHERE fam.anulada = TRUE
      AND fam.id_cabecera_anulador IS NULL
      AND c.fecha IS NOT NULL
),
pares_detectados AS (
    -- -------------------------------------------------------------------------
    -- P1a: Vínculo directo unidireccional (FC o ND anulada por NC)
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        1              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN cabecera c_anulador ON c_anulador.asociado = ao.id_cabecera
    WHERE c_anulador.id <> ao.id_cabecera
      AND COALESCE(ao.asociado, 0) <> c_anulador.id
      AND UPPER(TRIM(ao.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA', 'FCB', 'FR', 'ND', 'NDE', 'NDA', 'NDB')
      AND UPPER(TRIM(c_anulador.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
      AND COALESCE(ao.debe, 0) > 0
      AND COALESCE(ao.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15

    UNION ALL

    -- -------------------------------------------------------------------------
    -- P1b: Vínculo directo unidireccional (NC anulada por ND)
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        1              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN cabecera c_anulador ON c_anulador.asociado = ao.id_cabecera
    WHERE c_anulador.id <> ao.id_cabecera
      AND COALESCE(ao.asociado, 0) <> c_anulador.id
      AND UPPER(TRIM(ao.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
      AND UPPER(TRIM(c_anulador.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) > 0
      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) = COALESCE(c_anulador.debe, 0)
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15

    UNION ALL

    -- -------------------------------------------------------------------------
    -- P2: Vínculo directo mutuo (ao.asociado = c_anulador.id AND c_anulador.asociado = ao.id_cabecera)
    --     Se asigna anulador al documento cronológicamente posterior (fecha / id)
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        2              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN cabecera c_anulador
      ON c_anulador.asociado = ao.id_cabecera
     AND ao.asociado = c_anulador.id
    WHERE c_anulador.id <> ao.id_cabecera
      AND (
          c_anulador.fecha > ao.fecha
          OR (c_anulador.fecha = ao.fecha AND c_anulador.id > ao.id_cabecera)
      )
      AND (
          (
              UPPER(TRIM(ao.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA', 'FCB', 'FR', 'ND', 'NDE', 'NDA', 'NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
              AND COALESCE(ao.debe, 0) > 0
              AND COALESCE(ao.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
          )
          OR
          (
              UPPER(TRIM(ao.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
              AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) > 0
              AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) = COALESCE(c_anulador.debe, 0)
          )
      )
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15

    UNION ALL

    -- -------------------------------------------------------------------------
    -- P3: COALESCE(asociadogrupo, grupo) del anulador apunta al ID del anulado
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        3              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN cabecera c_anulador
      ON COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = ao.id_cabecera
    WHERE c_anulador.id <> ao.id_cabecera
      AND COALESCE(ao.asociado, 0) <> c_anulador.id
      AND (c_anulador.asociado IS NULL OR c_anulador.asociado = 0 OR c_anulador.asociado = c_anulador.id)
      AND (
          (
              UPPER(TRIM(ao.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA', 'FCB', 'FR', 'ND', 'NDE', 'NDA', 'NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
              AND COALESCE(ao.debe, 0) > 0
              AND COALESCE(ao.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
          )
          OR
          (
              UPPER(TRIM(ao.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
              AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) > 0
              AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) = COALESCE(c_anulador.debe, 0)
          )
      )
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15

    UNION ALL

    -- -------------------------------------------------------------------------
    -- P4a: Fallback relacional AuditoriaService (ND -> NC vía notadedebito)
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        4              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN notadecredito nc ON nc.idcabecera = ao.id_cabecera
    JOIN notadedebito nd ON nd.id_notadecredito = nc.id
    JOIN cabecera c_anulador ON c_anulador.id = nd.idcabecera
    WHERE c_anulador.id <> ao.id_cabecera
      AND COALESCE(ao.asociado, 0) <> c_anulador.id
      AND (c_anulador.asociado IS NULL OR c_anulador.asociado = 0 OR c_anulador.asociado = c_anulador.id)
      AND UPPER(TRIM(ao.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
      AND UPPER(TRIM(c_anulador.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) > 0
      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) = COALESCE(c_anulador.debe, 0)
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15

    UNION ALL

    -- -------------------------------------------------------------------------
    -- P4b: Fallback relacional AuditoriaService (ND -> NC vía nd_ajustedeiva)
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        4              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN nd_ajustedeiva ndi
      ON UPPER(TRIM(ndi.letra_nc)) = UPPER(TRIM(ao.letra))
     AND ndi.ptovta_nc = ao.ptovta
     AND ndi.numero_nc = ao.numero
    JOIN cabecera c_anulador ON c_anulador.id = ndi.idcabecera
    WHERE c_anulador.id <> ao.id_cabecera
      AND COALESCE(ao.asociado, 0) <> c_anulador.id
      AND (c_anulador.asociado IS NULL OR c_anulador.asociado = 0 OR c_anulador.asociado = c_anulador.id)
      AND UPPER(TRIM(ao.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
      AND UPPER(TRIM(c_anulador.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) > 0
      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) = COALESCE(c_anulador.debe, 0)
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15

    UNION ALL

    -- -------------------------------------------------------------------------
    -- P4c: Fallback relacional AuditoriaService (NC -> ND vía notadecredito)
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        4              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN notadedebito nd ON nd.idcabecera = ao.id_cabecera
    JOIN notadecredito nc ON nc.id_notadedebito = nd.id
    JOIN cabecera c_anulador ON c_anulador.id = nc.idcabecera
    WHERE c_anulador.id <> ao.id_cabecera
      AND COALESCE(ao.asociado, 0) <> c_anulador.id
      AND (c_anulador.asociado IS NULL OR c_anulador.asociado = 0 OR c_anulador.asociado = c_anulador.id)
      AND UPPER(TRIM(ao.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
      AND UPPER(TRIM(c_anulador.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
      AND COALESCE(ao.debe, 0) > 0
      AND COALESCE(ao.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15

    UNION ALL

    -- -------------------------------------------------------------------------
    -- P5: Mismo grupo compartido (COALESCE(asociadogrupo, grupo))
    -- -------------------------------------------------------------------------
    SELECT
        ao.id_cabecera AS id_anulado,
        c_anulador.id  AS id_anulador,
        5              AS prioridad,
        ABS(c_anulador.fecha - ao.fecha) AS diff_dias
    FROM anulados_objetivo ao
    JOIN cabecera c_anulador
      ON COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = ao.grupo_idx
    WHERE ao.grupo_idx IS NOT NULL
      AND ao.grupo_idx <> 0
      AND c_anulador.id <> ao.id_cabecera
      AND COALESCE(ao.asociado, 0) <> c_anulador.id
      AND (c_anulador.asociado IS NULL OR c_anulador.asociado = 0 OR c_anulador.asociado = c_anulador.id)
      AND (
          -- Caso 1: Factura anulada por Nota de Crédito del mismo grupo
          (
              UPPER(TRIM(ao.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA', 'FCB', 'FR')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
              AND COALESCE(ao.debe, 0) > 0
              AND COALESCE(ao.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
          )
          OR
          -- Casos 2 y 3: Par NC <-> ND sin asociado directo (anulador = posterior por fecha/id)
          (
              (
                  (
                      UPPER(TRIM(ao.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
                      AND UPPER(TRIM(c_anulador.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) > 0
                      AND COALESCE(NULLIF(ao.haber, 0), ao.debe, 0) = COALESCE(c_anulador.debe, 0)
                  )
                  OR
                  (
                      UPPER(TRIM(ao.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                      AND UPPER(TRIM(c_anulador.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
                      AND COALESCE(ao.debe, 0) > 0
                      AND COALESCE(ao.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  )
              )
              AND (
                  c_anulador.fecha > ao.fecha
                  OR (c_anulador.fecha = ao.fecha AND c_anulador.id > ao.id_cabecera)
              )
          )
      )
      AND c_anulador.fecha IS NOT NULL
      AND ABS(c_anulador.fecha - ao.fecha) <= 15
),
anulador_elegido AS (
    SELECT DISTINCT ON (id_anulado)
        id_anulado,
        id_anulador
    FROM pares_detectados
    ORDER BY id_anulado, prioridad ASC, diff_dias ASC, id_anulador ASC
)
UPDATE facturas_anuladas_manual fam
SET id_cabecera_anulador = ae.id_anulador
FROM anulador_elegido ae
WHERE fam.id_cabecera = ae.id_anulado
  AND fam.anulada = TRUE
  AND fam.id_cabecera_anulador IS NULL;

-- =============================================================================
-- OPCIONAL 1: Completar también 'comprobante_anulador' para que el módulo
--             Gestión Contable -> Documentos Anulados muestre el comprobante
--             anulador en la tabla ("Doc. Anulador"):
-- =============================================================================
-- UPDATE facturas_anuladas_manual fam
-- SET comprobante_anulador = COALESCE(
--         NULLIF(TRIM(ca.comprobante), ''),
--         TRIM(ca.tipo) || ' ' || TRIM(ca.letra) || ' ' || LPAD(COALESCE(ca.ptovta, 0)::text, 4, '0') || '-' || LPAD(COALESCE(ca.numero, 0)::text, 8, '0')
--     )
-- FROM cabecera ca
-- WHERE ca.id = fam.id_cabecera_anulador
--   AND fam.anulada = TRUE
--   AND fam.id_cabecera_anulador IS NOT NULL
--   AND (fam.comprobante_anulador IS NULL OR TRIM(fam.comprobante_anulador) = '');
--
-- =============================================================================
-- OPCIONAL 2: Refrescar vista materializada mv_ids_anulados luego del UPDATE:
-- =============================================================================
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ids_anulados;
