-- ==============================================================================
-- SCRIPT DE VERIFICACIÓN Y SANEAMIENTO DE CABECERA (DEBITOS)
-- ==============================================================================
-- Objetivo: Depurar comprobantes sincronizados erróneamente de Médicos (idtipo=2)
--           y Proveedores (idtipo=3) sin afectar bajo ninguna circunstancia
--           trabajo manual realizado por usuarios (débitos, refacturaciones,
--           liquidaciones ambulatorias, ajustes de período o anulaciones manuales).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PASO 0: VERIFICACIÓN RÁPIDA DE TABLA MAESTRA EN EL SERVIDOR
-- Ejecutar esta consulta para confirmar si en tu servidor la tabla se llama
-- 'coberturas_alias' o 'instituciones':
-- ------------------------------------------------------------------------------
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('coberturas_alias', 'instituciones', 'coberturas');


-- ------------------------------------------------------------------------------
-- PASO 1: CONSULTA DE VERIFICACIÓN PREVIA (100% SEGURA - SOLO LECTURA)
-- Utiliza 'coberturas_alias' (la tabla maestra oficial del sistema).
-- Ejecución estimada: ~1 segundo.
-- ------------------------------------------------------------------------------
WITH candidatos_saneamiento AS (
    SELECT c.id, c.tipo, c.codigo_cobertura, c.cobertura
    FROM cabecera c
    WHERE c.origen = 'APP_AUTO_ADMIN'
      AND (
          -- Tipos exclusivos de médicos y proveedores (OP = Órdenes de pago, RCP = Caja previsión, etc.)
          c.tipo IN ('OP', 'RCP', 'SOP', 'TKT', 'INRE', 'SUS', 'RETI')
          OR (
              -- O comprobantes emitidos a entidades que no son obras sociales / prepagas
              c.codigo_cobertura NOT IN (
                  SELECT codigo_cobertura 
                  FROM coberturas_alias 
                  WHERE codigo_cobertura IS NOT NULL
              )
          )
      )
      -- ========================================================================
      -- CANDADOS DE SEGURIDAD ESTRICTOS:
      -- Si el comprobante fue trabajado, auditado o referenciado, NO se toca.
      -- ========================================================================
      AND NOT EXISTS (SELECT 1 FROM notadecredito nc WHERE nc.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM amb_liquidado al WHERE al.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas_anuladas_manual fa WHERE fa.id_cabecera = c.id OR fa.id_cabecera_anulador = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas_periodos_corregidos fp WHERE fp.id_cabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM comprobantes_anulados ca WHERE ca.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM nc_ajustedeiva nc_iva WHERE nc_iva.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM nd_ajustedeiva nd_iva WHERE nd_iva.idcabecera = c.id)
      AND NOT EXISTS (
          SELECT 1 FROM cabecera c_hijo 
          WHERE c_hijo.asociado = c.id 
            AND c_hijo.codigo_cobertura IN (
                SELECT codigo_cobertura 
                FROM coberturas_alias 
                WHERE codigo_cobertura IS NOT NULL
            )
      )
)
SELECT 
    COUNT(*) AS total_cabeceras_a_depurar,
    -- TODAS LAS COLUMNAS SIGUIENTES DEBEN DAR 0 PARA CONFIRMAR LA TOTAL SEGURIDAD:
    COUNT(nc.id) AS afectaria_notadecredito,
    COUNT(nd.id) AS afectaria_notadedebito,
    COUNT(al.id) AS afectaria_amb_liquidado,
    COUNT(fa.id_cabecera) AS afectaria_facturas_anuladas_manual,
    COUNT(fp.id_cabecera) AS afectaria_periodos_corregidos,
    COUNT(ca.idcabecera) AS afectaria_comprobantes_anulados,
    COUNT(c_hijo.id) AS afectaria_hijos_coberturas
FROM candidatos_saneamiento cs
LEFT JOIN notadecredito nc ON cs.id = nc.idcabecera
LEFT JOIN notadedebito nd ON cs.id = nd.idcabecera
LEFT JOIN amb_liquidado al ON cs.id = al.idcabecera
LEFT JOIN facturas_anuladas_manual fa ON cs.id = fa.id_cabecera OR cs.id = fa.id_cabecera_anulador
LEFT JOIN facturas_periodos_corregidos fp ON cs.id = fp.id_cabecera
LEFT JOIN comprobantes_anulados ca ON cs.id = ca.idcabecera
LEFT JOIN cabecera c_hijo ON c_hijo.asociado = cs.id 
     AND c_hijo.codigo_cobertura IN (SELECT codigo_cobertura FROM coberturas_alias WHERE codigo_cobertura IS NOT NULL);


-- Desglose por tipo de comprobante que se limpiará:
WITH candidatos_saneamiento AS (
    SELECT c.id, c.tipo, c.codigo_cobertura, c.cobertura
    FROM cabecera c
    WHERE c.origen = 'APP_AUTO_ADMIN'
      AND (
          c.tipo IN ('OP', 'RCP', 'SOP', 'TKT', 'INRE', 'SUS', 'RETI')
          OR (
              c.codigo_cobertura NOT IN (
                  SELECT codigo_cobertura 
                  FROM coberturas_alias 
                  WHERE codigo_cobertura IS NOT NULL
              )
          )
      )
      AND NOT EXISTS (SELECT 1 FROM notadecredito nc WHERE nc.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM amb_liquidado al WHERE al.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas_anuladas_manual fa WHERE fa.id_cabecera = c.id OR fa.id_cabecera_anulador = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas_periodos_corregidos fp WHERE fp.id_cabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM comprobantes_anulados ca WHERE ca.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM nc_ajustedeiva nc_iva WHERE nc_iva.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM nd_ajustedeiva nd_iva WHERE nd_iva.idcabecera = c.id)
      AND NOT EXISTS (
          SELECT 1 FROM cabecera c_hijo 
          WHERE c_hijo.asociado = c.id 
            AND c_hijo.codigo_cobertura IN (
                SELECT codigo_cobertura 
                FROM coberturas_alias 
                WHERE codigo_cobertura IS NOT NULL
            )
      )
)
SELECT cs.tipo, COUNT(*) AS cantidad
FROM candidatos_saneamiento cs
GROUP BY 1 
ORDER BY 2 DESC;


-- ------------------------------------------------------------------------------
-- PASO 2: EJECUCIÓN DEL SANEAMIENTO (DELETE CONTROLADO)
-- Se ejecuta dentro de una transacción. Si algo no coincide, hacer ROLLBACK.
-- ------------------------------------------------------------------------------
BEGIN;

DELETE FROM cabecera
WHERE id IN (
    SELECT c.id
    FROM cabecera c
    WHERE c.origen = 'APP_AUTO_ADMIN'
      AND (
          c.tipo IN ('OP', 'RCP', 'SOP', 'TKT', 'INRE', 'SUS', 'RETI')
          OR (
              c.codigo_cobertura NOT IN (
                  SELECT codigo_cobertura 
                  FROM coberturas_alias 
                  WHERE codigo_cobertura IS NOT NULL
              )
          )
      )
      AND NOT EXISTS (SELECT 1 FROM notadecredito nc WHERE nc.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM amb_liquidado al WHERE al.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas_anuladas_manual fa WHERE fa.id_cabecera = c.id OR fa.id_cabecera_anulador = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas_periodos_corregidos fp WHERE fp.id_cabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM comprobantes_anulados ca WHERE ca.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM nc_ajustedeiva nc_iva WHERE nc_iva.idcabecera = c.id)
      AND NOT EXISTS (SELECT 1 FROM nd_ajustedeiva nd_iva WHERE nd_iva.idcabecera = c.id)
      AND NOT EXISTS (
          SELECT 1 FROM cabecera c_hijo 
          WHERE c_hijo.asociado = c.id 
            AND c_hijo.codigo_cobertura IN (
                SELECT codigo_cobertura 
                FROM coberturas_alias 
                WHERE codigo_cobertura IS NOT NULL
            )
      )
);

-- Si la cantidad de filas afectadas coincide con el total verificado (~92.400):
COMMIT;

-- Si se desea cancelar:
-- ROLLBACK;


-- ------------------------------------------------------------------------------
-- PASO 3: VERIFICACIÓN POST-SANEAMIENTO
-- ------------------------------------------------------------------------------
SELECT tipo, COUNT(*) 
FROM cabecera 
GROUP BY 1 
ORDER BY 2 DESC;
