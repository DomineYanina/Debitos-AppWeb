package com.debitos.backend.config;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationConfig.class);

    @Bean
    public ApplicationRunner ejecutarMigraciones(
            JdbcTemplate jdbcTemplate,
            @Autowired(required = false) @Qualifier("gestionJdbcTemplate") NamedParameterJdbcTemplate gestionJdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS notificacion_lecturas (
                        id BIGSERIAL PRIMARY KEY,
                        notificacion_id BIGINT NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
                        usuario VARCHAR(100) NOT NULL,
                        fecha_lectura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        CONSTRAINT uk_notif_lectura_usuario UNIQUE (notificacion_id, usuario)
                    )
                """);
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_notif_lecturas_user ON notificacion_lecturas (usuario)");
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_notif_lecturas_notif ON notificacion_lecturas (notificacion_id)");
                log.info("Migración automática aplicada: tabla notificacion_lecturas e índices asegurados.");
            } catch (Exception e) {
                log.warn("Aviso migración notificacion_lecturas: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE registro_imputacion ALTER COLUMN tipo_imputacion TYPE VARCHAR(100)");
                log.info("Migración automática aplicada: registro_imputacion.tipo_imputacion ampliado a VARCHAR(100).");
            } catch (Exception e) {
                log.debug(
                        "Aviso migración registro_imputacion (la columna ya tiene el tamaño o la tabla aún no fue creada): {}",
                        e.getMessage());
            }

            try {
                jdbcTemplate.execute(
                        "ALTER TABLE cabecera ADD COLUMN IF NOT EXISTS comprobante VARCHAR(50)");
                log.info("Migración automática aplicada: cabecera.comprobante creada (si no existía).");
            } catch (Exception e) {
                log.debug("Aviso migración cabecera.comprobante: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute(
                        "ALTER TABLE cabecera ADD COLUMN IF NOT EXISTS comprobante_asociado VARCHAR(50)");
                log.info("Migración automática aplicada: cabecera.comprobante_asociado creada (si no existía).");
            } catch (Exception e) {
                log.debug("Aviso migración cabecera.comprobante_asociado: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute(
                        "ALTER TABLE cabecera ADD COLUMN IF NOT EXISTS id_asignacion BIGINT");
                log.info("Migración automática aplicada: cabecera.id_asignacion creada (si no existía).");
            } catch (Exception e) {
                log.debug("Aviso migración cabecera.id_asignacion: {}", e.getMessage());
            }

            try {
                jdbcTemplate
                        .execute("CREATE INDEX IF NOT EXISTS idx_cabecera_id_asignacion ON cabecera (id_asignacion)");
                jdbcTemplate.execute(
                        "CREATE INDEX IF NOT EXISTS idx_cabecera_recibos_grupo ON cabecera (tipo, numero, asociadogrupo)");
            } catch (Exception e) {
                log.debug("Aviso creación índice id_asignacion: {}", e.getMessage());
            }

            try {
                int facturasAsociadoSaneadas = jdbcTemplate.update("""
                            UPDATE cabecera
                            SET asociado = id
                            WHERE UPPER(TRIM(tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                              AND (asociado IS NULL OR asociado <> id)
                        """);
                if (facturasAsociadoSaneadas > 0) {
                    log.info("Migración automática aplicada: saneado asociado = id en {} facturas.",
                            facturasAsociadoSaneadas);
                }
            } catch (Exception e) {
                log.debug("Aviso migración facturas asociado: {}", e.getMessage());
            }

            try {
                int comprobantesAsocActualizados = jdbcTemplate
                        .update("""
                                    UPDATE cabecera c_hijo
                                    SET comprobante_asociado = COALESCE(
                                        c_padre.comprobante,
                                        CASE
                                            WHEN UPPER(TRIM(c_padre.tipo)) = 'RC' THEN c_padre.numero::text
                                            ELSE UPPER(TRIM(c_padre.tipo)) || ' ' || UPPER(TRIM(c_padre.letra)) || LPAD(c_padre.ptovta::text, 4, '0') || '-' || LPAD(c_padre.numero::text, 8, '0')
                                        END
                                    )
                                    FROM cabecera c_padre
                                    WHERE c_hijo.comprobante_asociado IS NULL
                                      AND c_hijo.asociado IS NOT NULL
                                      AND c_hijo.asociado > 0
                                      AND c_padre.id = c_hijo.asociado
                                """);
                if (comprobantesAsocActualizados > 0) {
                    log.info(
                            "Migración automática aplicada: asignado comprobante_asociado a {} documentos que ya tenían ID en asociado.",
                            comprobantesAsocActualizados);
                }
            } catch (Exception e) {
                log.debug("Aviso migración comprobante_asociado desde asociado: {}", e.getMessage());
            }

            try {
                int asociadogrupoAlineados = jdbcTemplate.update("""
                            UPDATE cabecera c_hijo
                            SET asociadogrupo = c_padre.asociadogrupo
                            FROM cabecera c_padre
                            WHERE c_hijo.asociado = c_padre.id
                              AND c_padre.asociadogrupo IS NOT NULL AND c_padre.asociadogrupo > 0
                              AND UPPER(TRIM(c_hijo.tipo)) NOT IN ('FAC', 'FC', 'FCE', 'FR')
                              AND (c_hijo.asociadogrupo IS NULL OR c_hijo.asociadogrupo = 0)
                        """);
                if (asociadogrupoAlineados > 0) {
                    log.info(
                            "Migración automática aplicada: alineado asociadogrupo en {} documentos según el documento al que apunta su columna asociado.",
                            asociadogrupoAlineados);
                }
            } catch (Exception e) {
                log.debug("Aviso migración asociadogrupo desde asociado: {}", e.getMessage());
            }

            try {
                int asociadosReconciliadosPorGrupo = jdbcTemplate
                        .update("""
                                    UPDATE cabecera c_hijo
                                    SET asociado = c_padre.id,
                                        comprobante_asociado = COALESCE(c_hijo.comprobante_asociado, c_padre.comprobante)
                                    FROM (
                                        SELECT DISTINCT ON (asociadogrupo)
                                            id,
                                            COALESCE(
                                                comprobante,
                                                comprobante_asociado,
                                                UPPER(TRIM(tipo)) || ' ' || UPPER(TRIM(letra)) || LPAD(ptovta::text, 4, '0') || '-' || LPAD(numero::text, 8, '0')
                                            ) AS comprobante,
                                            asociadogrupo
                                        FROM cabecera
                                        WHERE UPPER(TRIM(tipo)) IN ('FAC', 'FC', 'FCE', 'FR')
                                          AND asociadogrupo IS NOT NULL AND asociadogrupo > 0
                                        ORDER BY asociadogrupo, fecha DESC
                                    ) c_padre
                                    LEFT JOIN cabecera c_asoc_actual ON c_asoc_actual.id = c_hijo.asociado
                                    WHERE c_hijo.asociadogrupo IS NOT NULL AND c_hijo.asociadogrupo > 0
                                      AND UPPER(TRIM(c_hijo.tipo)) NOT IN ('FAC', 'FC', 'FCE', 'FR')
                                      AND c_padre.asociadogrupo = c_hijo.asociadogrupo
                                      AND c_padre.id <> c_hijo.id
                                      AND (
                                          c_hijo.asociado IS NULL
                                          OR c_hijo.asociado = 0
                                          OR c_asoc_actual.id IS NULL
                                          OR (
                                              c_asoc_actual.asociadogrupo IS NOT NULL
                                              AND c_asoc_actual.asociadogrupo > 0
                                              AND c_asoc_actual.asociadogrupo <> c_hijo.asociadogrupo
                                              AND (
                                                  UPPER(TRIM(c_hijo.tipo)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP', 'NC', 'NCE', 'NCA', 'NCB')
                                                  OR UPPER(TRIM(c_asoc_actual.tipo)) IN ('FAC', 'FC', 'FCE', 'FR')
                                              )
                                          )
                                      )
                                """);
                if (asociadosReconciliadosPorGrupo > 0) {
                    log.info(
                            "Migración automática aplicada: alineado asociado en {} documentos secundarios con la factura de su mismo asociadogrupo.",
                            asociadosReconciliadosPorGrupo);
                }
            } catch (Exception e) {
                log.debug("Aviso migración asociado desde asociadogrupo: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE amb_liquidado ADD COLUMN IF NOT EXISTS tiporegistro VARCHAR(50)");
                jdbcTemplate.execute("ALTER TABLE amb_liquidado ADD COLUMN IF NOT EXISTS codigo_cobertura VARCHAR(50)");
                log.info(
                        "Migración automática aplicada: columnas tiporegistro y codigo_cobertura creadas en amb_liquidado (si no existían).");
            } catch (Exception e) {
                log.debug("Aviso migración columnas en amb_liquidado: {}", e.getMessage());
            }

            // Deduplicación en amb_liquidado priorizando prestaciones trabajadas en
            // notadecredito / notadedebito
            try {
                int duplicadosBorrados = jdbcTemplate
                        .update("""
                                    WITH duplicados_candidatos AS (
                                        SELECT idregistro
                                        FROM amb_liquidado
                                        WHERE idregistro IS NOT NULL
                                        GROUP BY idregistro
                                        HAVING COUNT(*) > 1
                                    ),
                                    ranking AS (
                                        SELECT
                                            al.id,
                                            ROW_NUMBER() OVER (
                                                PARTITION BY al.idregistro
                                                ORDER BY
                                                    CASE WHEN nc.id_prestacion IS NOT NULL THEN 1 ELSE 2 END ASC,
                                                    CASE WHEN nd.id_prestacion IS NOT NULL THEN 1 ELSE 2 END ASC,
                                                    CASE
                                                        WHEN al.fechaimportacion IS NULL THEN 1
                                                        WHEN al.fechaimportacion < DATE '2026-10-19' THEN 2
                                                        ELSE 3
                                                    END ASC,
                                                    al.id ASC
                                            ) AS rn
                                        FROM amb_liquidado al
                                        JOIN duplicados_candidatos dc ON al.idregistro = dc.idregistro
                                        LEFT JOIN (SELECT DISTINCT id_prestacion FROM notadecredito WHERE id_prestacion IS NOT NULL) nc
                                               ON al.id = nc.id_prestacion
                                        LEFT JOIN (SELECT DISTINCT id_prestacion FROM notadedebito WHERE id_prestacion IS NOT NULL) nd
                                               ON al.id = nd.id_prestacion
                                    )
                                    DELETE FROM amb_liquidado
                                    WHERE id IN (
                                        SELECT id FROM ranking WHERE rn > 1
                                    )
                                """);
                if (duplicadosBorrados > 0) {
                    log.info(
                            "Migración automática aplicada: se eliminaron {} registros duplicados en amb_liquidado preservando las prestaciones auditadas y los datos originales.",
                            duplicadosBorrados);
                }
            } catch (Exception e) {
                log.warn("Aviso en deduplicación de amb_liquidado: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("DROP INDEX IF EXISTS idx_amb_liquidado_idregistro");
                jdbcTemplate.execute("DROP INDEX IF EXISTS uq_amb_liquidado_idregistro");
                jdbcTemplate.execute(
                        "CREATE UNIQUE INDEX IF NOT EXISTS uq_amb_liquidado_idreg_tipo ON amb_liquidado (idregistro, tiporegistro)");
            } catch (Exception e) {
                log.warn("Aviso al verificar/crear índice UNIQUE uq_amb_liquidado_idreg_tipo: {}", e.getMessage());
            }

            // Deduplicación en cabecera: elimina registros repetidos (mismo tipo, letra,
            // ptovta, numero)
            // re-enlazando cualquier comprobante hijo hacia el comprobante principal
            // conservado.
            try {
                jdbcTemplate.execute(
                        """
                                    DO $$
                                    DECLARE
                                        r RECORD;
                                    BEGIN
                                        FOR r IN (
                                            WITH dup AS (
                                                SELECT UPPER(TRIM(tipo)) as t, UPPER(TRIM(letra)) as l, ptovta as p, numero as n
                                                FROM cabecera
                                                WHERE tipo IS NOT NULL AND letra IS NOT NULL AND ptovta IS NOT NULL AND numero IS NOT NULL
                                                  AND UPPER(TRIM(tipo)) NOT IN ('RC', 'REC', 'RCA', 'RCB', 'OP')
                                                GROUP BY UPPER(TRIM(tipo)), UPPER(TRIM(letra)), ptovta, numero
                                                HAVING COUNT(*) > 1
                                            ),
                                            ranked AS (
                                                SELECT c.id,
                                                       FIRST_VALUE(c.id) OVER (
                                                           PARTITION BY UPPER(TRIM(c.tipo)), UPPER(TRIM(c.letra)), c.ptovta, c.numero
                                                           ORDER BY
                                                               CASE WHEN hijos.cnt > 0 THEN 1 ELSE 2 END ASC,
                                                               CASE WHEN c.asociadogrupo IS NOT NULL AND c.asociadogrupo > 0 THEN 1 ELSE 2 END ASC,
                                                               c.id DESC
                                                       ) AS kept_id
                                                FROM cabecera c
                                                JOIN dup ON UPPER(TRIM(c.tipo)) = dup.t
                                                        AND UPPER(TRIM(c.letra)) = dup.l
                                                        AND c.ptovta = dup.p
                                                        AND c.numero = dup.n
                                                LEFT JOIN LATERAL (
                                                    SELECT COUNT(*) as cnt FROM cabecera ch WHERE ch.asociado = c.id
                                                ) hijos ON TRUE
                                            )
                                            SELECT id, kept_id FROM ranked WHERE id <> kept_id
                                        ) LOOP
                                            UPDATE cabecera SET asociado = r.kept_id WHERE asociado = r.id;
                                            UPDATE notadecredito SET idcabecera = r.kept_id WHERE idcabecera = r.id;
                                            UPDATE notadedebito SET idcabecera = r.kept_id WHERE idcabecera = r.id;
                                            IF to_regclass('public.nc_ajustedeiva') IS NOT NULL THEN
                                                UPDATE nc_ajustedeiva SET idcabecera = r.kept_id WHERE idcabecera = r.id;
                                            END IF;
                                            IF to_regclass('public.nd_ajustedeiva') IS NOT NULL THEN
                                                UPDATE nd_ajustedeiva SET idcabecera = r.kept_id WHERE idcabecera = r.id;
                                            END IF;
                                            IF to_regclass('public.amb_liquidado') IS NOT NULL THEN
                                                UPDATE amb_liquidado SET idcabecera = r.kept_id WHERE idcabecera = r.id;
                                            END IF;
                                            IF to_regclass('public.concepto') IS NOT NULL THEN
                                                UPDATE concepto SET idcabecera = r.kept_id WHERE idcabecera = r.id;
                                            END IF;
                                            IF to_regclass('public.comprobantes_anulados') IS NOT NULL THEN
                                                UPDATE comprobantes_anulados SET idcabecera = r.kept_id WHERE idcabecera = r.id;
                                            END IF;
                                            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notadecredito' AND column_name='idcabecera_factura_destino') THEN
                                                UPDATE notadecredito SET idcabecera_factura_destino = r.kept_id WHERE idcabecera_factura_destino = r.id;
                                            END IF;
                                            IF to_regclass('public.facturas_periodos_corregidos') IS NOT NULL THEN
                                                DELETE FROM facturas_periodos_corregidos WHERE id_cabecera = r.id AND EXISTS (SELECT 1 FROM facturas_periodos_corregidos WHERE id_cabecera = r.kept_id);
                                                UPDATE facturas_periodos_corregidos SET id_cabecera = r.kept_id WHERE id_cabecera = r.id;
                                            END IF;
                                            IF to_regclass('public.facturas_anuladas_manual') IS NOT NULL THEN
                                                DELETE FROM facturas_anuladas_manual WHERE id_cabecera = r.id AND EXISTS (SELECT 1 FROM facturas_anuladas_manual WHERE id_cabecera = r.kept_id);
                                                UPDATE facturas_anuladas_manual SET id_cabecera = r.kept_id WHERE id_cabecera = r.id;
                                            END IF;
                                            DELETE FROM cabecera WHERE id = r.id;
                                        END LOOP;
                                    END $$;
                                """);
                log.info(
                        "Migración automática aplicada: deduplicación y consolidación de comprobantes repetidos en cabecera completada.");
            } catch (Exception e) {
                log.warn("Aviso en deduplicación de cabecera: {}", e.getMessage());
            }

            try {
                int recibosActualizados = jdbcTemplate.update("""
                            UPDATE cabecera
                            SET periodo = DATE_TRUNC('month', fecha)::date
                            WHERE UPPER(TRIM(tipo)) IN ('RC', 'RCA', 'RCB', 'REC', 'OP')
                              AND fecha IS NOT NULL
                              AND (periodo IS NULL OR periodo <> DATE_TRUNC('month', fecha)::date)
                        """);
                if (recibosActualizados > 0) {
                    log.info(
                            "Migración automática aplicada: asignado período correspondiente a {} comprobantes de cobranza/recibos según su fecha.",
                            recibosActualizados);
                }
            } catch (Exception e) {
                log.debug("Aviso migración período en recibos de cabecera: {}", e.getMessage());
            }

            try {
                Integer recibosSinNumero = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM cabecera WHERE UPPER(TRIM(tipo)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP') AND numero IS NULL",
                        Integer.class);

                if (recibosSinNumero != null && recibosSinNumero > 0) {
                    log.info(
                            "Detectados {} comprobantes de cobranza/recibos sin número en cabecera. Iniciando corrección...",
                            recibosSinNumero);
                    int actualizados = 0;
                    try {
                        actualizados = jdbcTemplate
                                .update("""
                                            UPDATE cabecera cab
                                            SET numero = gest.numero_recibo_int,
                                                comprobante = COALESCE(gest.numero_recibo_str, gest.numero_recibo_int::text)
                                            FROM (
                                                SELECT *
                                                FROM dblink(
                                                    'host=172.16.15.41 port=9090 dbname=gestion user=yanina password=yanina**333-',
                                                    $gestion$
                                                    SELECT DISTINCT ON (a.idgrupocomp)
                                                        a.idgrupocomp::bigint AS idgrupocomp,
                                                        CASE
                                                            WHEN TRIM(c.numero) ~ '^[0-9]+$' THEN TRIM(c.numero)::integer
                                                            WHEN TRIM(c.num8) ~ '^[0-9]+$' THEN TRIM(c.num8)::integer
                                                            ELSE NULL
                                                        END AS numero_recibo_int,
                                                        TRIM(c.numero)::text AS numero_recibo_str
                                                    FROM cct_comprobantes_asignacion a
                                                    JOIN cct_comprobantes c ON a.idcomprobante = c.idcomprobante
                                                    JOIN cct_comprobantes_tipo t ON c.idtipocomp = t.idtipocomp
                                                    WHERE UPPER(TRIM(t.abreviatura)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP')
                                                      AND t.idtipo = 1
                                                      AND ((c.numero IS NOT NULL AND TRIM(c.numero) ~ '^[0-9]+$')
                                                           OR (c.num8 IS NOT NULL AND TRIM(c.num8) ~ '^[0-9]+$'))
                                                    ORDER BY a.idgrupocomp, c.idcomprobante DESC
                                                    $gestion$
                                                ) AS g(idgrupocomp bigint, numero_recibo_int integer, numero_recibo_str text)
                                            ) AS gest
                                            WHERE COALESCE(cab.asociadogrupo, cab.grupo) = gest.idgrupocomp
                                              AND UPPER(TRIM(cab.tipo)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP')
                                              AND cab.numero IS NULL
                                              AND gest.numero_recibo_int IS NOT NULL
                                        """);
                        if (actualizados > 0) {
                            log.info(
                                    "Migración automática aplicada vía dblink: {} números y comprobantes de recibos actualizados.",
                                    actualizados);
                        }
                    } catch (Exception exDblink) {
                        log.warn(
                                "No se pudo ejecutar la actualización vía dblink ({}). Intentando vía conexión directa con Gestión...",
                                exDblink.getMessage());
                        if (gestionJdbcTemplate != null) {
                            List<Map<String, Object>> recibosGestion = gestionJdbcTemplate.queryForList("""
                                        SELECT DISTINCT ON (a.idgrupocomp)
                                            a.idgrupocomp,
                                            CASE
                                                WHEN TRIM(c.numero) ~ '^[0-9]+$' THEN TRIM(c.numero)::integer
                                                WHEN TRIM(c.num8) ~ '^[0-9]+$' THEN TRIM(c.num8)::integer
                                                ELSE NULL
                                            END AS numero_recibo_int,
                                            TRIM(c.numero) AS numero_recibo_str
                                        FROM cct_comprobantes_asignacion a
                                        JOIN cct_comprobantes c ON a.idcomprobante = c.idcomprobante
                                        JOIN cct_comprobantes_tipo t ON c.idtipocomp = t.idtipocomp
                                        WHERE UPPER(TRIM(t.abreviatura)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP')
                                          AND t.idtipo = 1
                                          AND ((c.numero IS NOT NULL AND TRIM(c.numero) ~ '^[0-9]+$')
                                               OR (c.num8 IS NOT NULL AND TRIM(c.num8) ~ '^[0-9]+$'))
                                        ORDER BY a.idgrupocomp, c.idcomprobante DESC
                                    """, Collections.emptyMap());

                            List<Object[]> batchParams = new ArrayList<>();
                            for (Map<String, Object> rg : recibosGestion) {
                                Number grp = (Number) rg.get("idgrupocomp");
                                Number numInt = (Number) rg.get("numero_recibo_int");
                                String numStr = (String) rg.get("numero_recibo_str");
                                if (grp != null && numInt != null) {
                                    String comp = (numStr != null && !numStr.trim().isEmpty()) ? numStr.trim()
                                            : String.valueOf(numInt.intValue());
                                    batchParams.add(
                                            new Object[] { numInt.intValue(), comp, grp.longValue(), grp.longValue() });
                                }
                            }

                            if (!batchParams.isEmpty()) {
                                int[] res = jdbcTemplate.batchUpdate("""
                                            UPDATE cabecera
                                            SET numero = ?, comprobante = ?
                                            WHERE (asociadogrupo = ? OR (asociadogrupo IS NULL AND grupo = ?))
                                              AND UPPER(TRIM(tipo)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP')
                                              AND numero IS NULL
                                        """, batchParams);
                                int total = 0;
                                for (int r : res) {
                                    if (r > 0)
                                        total += r;
                                }
                                log.info(
                                        "Migración automática aplicada vía JDBC directo: {} números de recibos actualizados.",
                                        total);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Aviso migración números de recibos: {}", e.getMessage());
            }

            try {
                int comprobanteRcActualizados = jdbcTemplate.update("""
                            UPDATE cabecera
                            SET comprobante = numero::text
                            WHERE UPPER(TRIM(tipo)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP')
                              AND comprobante IS NULL
                              AND numero IS NOT NULL
                        """);
                if (comprobanteRcActualizados > 0) {
                    log.info("Migración automática aplicada: asignado comprobante a {} recibos con comprobante nulo.",
                            comprobanteRcActualizados);
                }
            } catch (Exception e) {
                log.debug("Aviso migración comprobante en recibos: {}", e.getMessage());
            }

            try {
                int periodosReparados = jdbcTemplate.update("""
                            UPDATE cabecera
                            SET periodo = DATE_TRUNC('month', fecha)::date
                            WHERE fecha IS NOT NULL
                              AND periodo IS NULL
                        """);
                if (periodosReparados > 0) {
                    log.info(
                            "Migración automática aplicada: asignado período correspondiente a {} comprobantes con período nulo según su fecha.",
                            periodosReparados);
                }
            } catch (Exception e) {
                log.debug("Aviso migración período nulo general en cabecera: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE notadedebito DROP CONSTRAINT IF EXISTS unique_id_notadecredito");
                log.info(
                        "Migración automática aplicada: eliminada restricción de unicidad unique_id_notadecredito en notadedebito.");
            } catch (Exception e) {
                log.debug("Aviso migración unique_id_notadecredito: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("DROP INDEX IF EXISTS unique_id_notadecredito");
                log.info(
                        "Migración automática aplicada: eliminado índice unique_id_notadecredito en notadedebito si existía.");
            } catch (Exception e) {
                log.debug("Aviso migración drop index unique_id_notadecredito: {}", e.getMessage());
            }

            try {
                int ndSincronizadas = jdbcTemplate
                        .update("""
                                    UPDATE cabecera c_nd
                                    SET asociadogrupo = COALESCE(NULLIF(c_nc.asociadogrupo, 0), NULLIF(c_nc.grupo, 0), NULLIF(c_nc.asociado, 0), c_nc.id),
                                        asociado = COALESCE(c_nd.asociado, c_nc.id),
                                        grupo = COALESCE(NULLIF(c_nd.grupo, 0), NULLIF(c_nc.grupo, 0), c_nc.asociadogrupo)
                                    FROM notadedebito nd
                                    JOIN notadecredito nc ON nd.id_notadecredito = nc.id
                                    JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
                                    WHERE nd.idcabecera = c_nd.id
                                      AND (c_nd.asociadogrupo IS NULL OR c_nd.asociadogrupo <> COALESCE(NULLIF(c_nc.asociadogrupo, 0), NULLIF(c_nc.grupo, 0), NULLIF(c_nc.asociado, 0), c_nc.id))
                                """);
                if (ndSincronizadas > 0) {
                    log.info(
                            "Migración automática aplicada: sincronizado asociadogrupo en {} cabeceras de ND con sus respectivas NC padre.",
                            ndSincronizadas);
                }
            } catch (Exception e) {
                log.debug("Aviso migración sincronización asociadogrupo ND: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nc_ajustedeiva ADD COLUMN IF NOT EXISTS idcabecera BIGINT");
                log.info("Migración automática aplicada: columna idcabecera asegurada en nc_ajustedeiva.");
            } catch (Exception e) {
                log.debug("Aviso migración idcabecera en nc_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nd_ajustedeiva ADD COLUMN IF NOT EXISTS idcabecera BIGINT");
                log.info("Migración automática aplicada: columna idcabecera asegurada en nd_ajustedeiva.");
            } catch (Exception e) {
                log.debug("Aviso migración idcabecera en nd_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.update("""
                            UPDATE nc_ajustedeiva n
                            SET idcabecera = c.id
                            FROM cabecera c
                            WHERE n.idcabecera IS NULL
                              AND UPPER(c.letra) = UPPER(n.letra_nc)
                              AND c.ptovta = n.ptovta_nc
                              AND c.numero = n.numero_nc
                              AND UPPER(TRIM(c.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
                        """);
            } catch (Exception e) {
                log.debug("Aviso vinculación idcabecera en nc_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.update("""
                            UPDATE nd_ajustedeiva n
                            SET idcabecera = c.id
                            FROM cabecera c
                            WHERE n.idcabecera IS NULL
                              AND UPPER(c.letra) = UPPER(n.letra_nd)
                              AND c.ptovta = n.ptovta_nd
                              AND c.numero = n.numero_nd
                              AND UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                        """);
            } catch (Exception e) {
                log.debug("Aviso vinculación idcabecera en nd_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nc_ajustedeiva ALTER COLUMN letra_nc DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null letra_nc en nc_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nc_ajustedeiva ALTER COLUMN ptovta_nc DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null ptovta_nc en nc_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nc_ajustedeiva ALTER COLUMN tipo_nc DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null tipo_nc en nc_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nc_ajustedeiva ALTER COLUMN numero_nc DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null numero_nc en nc_ajustedeiva: {}", e.getMessage());
            }

            try {
                int ncSincronizadas = jdbcTemplate
                        .update("""
                                    UPDATE nc_ajustedeiva n
                                    SET letra_nc = COALESCE(n.letra_nc, c.letra),
                                        ptovta_nc = COALESCE(n.ptovta_nc, c.ptovta),
                                        tipo_nc = COALESCE(n.tipo_nc, c.tipo),
                                        numero_nc = COALESCE(n.numero_nc, c.numero)
                                    FROM cabecera c
                                    WHERE n.idcabecera = c.id
                                      AND (n.letra_nc IS NULL OR n.ptovta_nc IS NULL OR n.tipo_nc IS NULL OR n.numero_nc IS NULL)
                                """);
                if (ncSincronizadas > 0) {
                    log.info(
                            "Migración automática aplicada: sincronizados datos de NC en {} registros de nc_ajustedeiva.",
                            ncSincronizadas);
                }
            } catch (Exception e) {
                log.debug("Aviso sincronización datos nc en nc_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nd_ajustedeiva ALTER COLUMN letra_nd DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null letra_nd en nd_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nd_ajustedeiva ALTER COLUMN ptovta_nd DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null ptovta_nd en nd_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nd_ajustedeiva ALTER COLUMN tipo_nd DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null tipo_nd en nd_ajustedeiva: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE nd_ajustedeiva ALTER COLUMN numero_nd DROP NOT NULL");
            } catch (Exception e) {
                log.debug("Aviso migración drop not null numero_nd en nd_ajustedeiva: {}", e.getMessage());
            }

            try {
                int ndSincronizadasAjuste = jdbcTemplate
                        .update("""
                                    UPDATE nd_ajustedeiva n
                                    SET letra_nd = COALESCE(n.letra_nd, c.letra),
                                        ptovta_nd = COALESCE(n.ptovta_nd, c.ptovta),
                                        tipo_nd = COALESCE(n.tipo_nd, c.tipo),
                                        numero_nd = COALESCE(n.numero_nd, c.numero)
                                    FROM cabecera c
                                    WHERE n.idcabecera = c.id
                                      AND (n.letra_nd IS NULL OR n.ptovta_nd IS NULL OR n.tipo_nd IS NULL OR n.numero_nd IS NULL)
                                """);
                if (ndSincronizadasAjuste > 0) {
                    log.info(
                            "Migración automática aplicada: sincronizados datos de ND en {} registros de nd_ajustedeiva.",
                            ndSincronizadasAjuste);
                }
            } catch (Exception e) {
                log.debug("Aviso sincronización datos nd en nd_ajustedeiva: {}", e.getMessage());
            }

            // Creación de índices estratégicos para alto rendimiento y concurrencia
            String[] indices = {
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_tipo_fecha ON cabecera (tipo, fecha)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_asociadogrupo ON cabecera (asociadogrupo)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_grupo ON cabecera (grupo)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_asociado ON cabecera (asociado)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_codigo_cobertura ON cabecera (codigo_cobertura)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_periodo ON cabecera (periodo)",
                    "CREATE INDEX IF NOT EXISTS idx_notadecredito_idcabecera ON notadecredito (idcabecera)",
                    "CREATE INDEX IF NOT EXISTS idx_notadecredito_id_prestacion ON notadecredito (id_prestacion)",
                    "CREATE INDEX IF NOT EXISTS idx_notadecredito_id_notadedebito ON notadecredito (id_notadedebito)",
                    "CREATE INDEX IF NOT EXISTS idx_notadedebito_idcabecera ON notadedebito (idcabecera)",
                    "CREATE INDEX IF NOT EXISTS idx_notadedebito_id_prestacion ON notadedebito (id_prestacion)",
                    "CREATE INDEX IF NOT EXISTS idx_notadedebito_id_notadecredito ON notadedebito (id_notadecredito)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_idcabecera ON amb_liquidado (idcabecera)",
                    "CREATE INDEX IF NOT EXISTS idx_nd_ajustedeiva_idcabecera ON nd_ajustedeiva (idcabecera)",
                    "CREATE INDEX IF NOT EXISTS idx_nc_ajustedeiva_idcabecera ON nc_ajustedeiva (idcabecera)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_uppertrim_tipo_fecha ON cabecera ((UPPER(TRIM(tipo))), fecha)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_uppertrim_tipo_periodo ON cabecera ((UPPER(TRIM(tipo))), periodo)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_facturas_impagas ON cabecera (fecha, (debe - COALESCE(haber, 0))) WHERE (debe - COALESCE(haber, 0)) > 0",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_cobranzas_fecha ON cabecera (fecha, codigo_cobertura, haber, debe) WHERE UPPER(TRIM(tipo)) IN ('RC', 'RCA', 'RCB', 'REC', 'OP')",
                    "CREATE INDEX IF NOT EXISTS idx_notadecredito_usuario ON notadecredito (usuario)",
                    "CREATE INDEX IF NOT EXISTS idx_notadedebito_usuario ON notadedebito (usuario)",
                    "CREATE INDEX IF NOT EXISTS idx_notadecredito_motivo ON notadecredito (motivodedebito)",
                    "CREATE INDEX IF NOT EXISTS idx_notadecredito_debitoaceptado ON notadecredito (debitoaceptado)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_medico ON amb_liquidado (medico)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_efector ON amb_liquidado (efector)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_grupo ON amb_liquidado (grupo)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_operador ON amb_liquidado (operador)",
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_amb_liquidado_idreg_tipo ON amb_liquidado (idregistro, tiporegistro)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_tiporegistro ON amb_liquidado (tiporegistro)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_fecha_tipo ON amb_liquidado (fecha, tiporegistro)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_huerfanas ON amb_liquidado (idregistro) WHERE idcabecera IS NULL",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_tipo_letra_ptovta_num ON cabecera (tipo, letra, ptovta, numero)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_upper_tipo_letra_ptovta_num ON cabecera ((UPPER(TRIM(tipo))), (UPPER(TRIM(letra))), ptovta, numero)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_upper_comprobante ON cabecera ((UPPER(TRIM(comprobante))))",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_upper_comprobante_asoc ON cabecera ((UPPER(TRIM(comprobante_asociado))))",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_facturas_mapeo ON cabecera (tipo, letra, ptovta, numero, id) WHERE tipo IN ('FC', 'FAC', 'FCE', 'FR')",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_coalesce_grupo ON cabecera ((COALESCE(asociadogrupo, grupo)))",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_comprobante ON cabecera (comprobante)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_comprobante_asociado ON cabecera (comprobante_asociado)",
                    "CREATE INDEX IF NOT EXISTS idx_comprobantes_anulados_idcabecera ON comprobantes_anulados (idcabecera)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_familia_completa ON cabecera ((COALESCE(asociadogrupo, grupo, asociado, id)))",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_recibos_familia ON cabecera (fecha, (COALESCE(asociadogrupo, grupo, asociado, id)), haber, debe) WHERE UPPER(TRIM(tipo)) IN ('RC', 'RCA', 'RCB', 'REC', 'OP')",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_anulados_fc ON cabecera (fecha, debe, id, asociado, asociadogrupo, grupo) WHERE tipo IN ('FC','FAC','FCE','FCA') AND fecha >= DATE '2024-01-01'",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_anulados_nc ON cabecera (fecha, COALESCE(NULLIF(haber, 0), debe, 0), id, asociado, asociadogrupo, grupo) WHERE tipo IN ('NC','NCE','NCA','NCB') AND fecha >= DATE '2024-01-01'",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_anul_fc_exp ON cabecera (fecha, debe, id, asociado, asociadogrupo, grupo) WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA') AND fecha >= DATE '2024-01-01'",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_anul_nc_exp ON cabecera (fecha, COALESCE(NULLIF(haber, 0), debe, 0), id, asociado, asociadogrupo, grupo) WHERE UPPER(TRIM(tipo)) IN ('NC','NCE','NCA','NCB') AND fecha >= DATE '2024-01-01'",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_fc_trazabilidad_busqueda ON cabecera (numero, ptovta, (UPPER(TRIM(letra))), fecha DESC) WHERE UPPER(TRIM(tipo)) IN ('FC', 'FAC', 'FCE', 'FCA') AND ptovta IN (30, 31, 32, 36, 53)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_fc_prestaciones_periodo ON cabecera ((COALESCE(periodo, fecha)), codigo_cobertura, id) WHERE UPPER(TRIM(tipo)) IN ('FC', 'FAC', 'FCE', 'FCA') AND ptovta IN (30, 31, 32, 36, 53)",
                    "CREATE INDEX IF NOT EXISTS idx_cabecera_fc_prestaciones_fecha ON cabecera (fecha, codigo_cobertura, id) WHERE UPPER(TRIM(tipo)) IN ('FC', 'FAC', 'FCE', 'FCA') AND ptovta IN (30, 31, 32, 36, 53)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_idcabecera_fecha ON amb_liquidado (idcabecera, fecha DESC, id DESC)",
                    "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_codigo ON amb_liquidado (codigo)"
            };

            try {
                jdbcTemplate.execute("DROP INDEX IF EXISTS idx_cabecera_fc_trazabilidad_busqueda");
                jdbcTemplate.execute("DROP INDEX IF EXISTS idx_cabecera_fc_prestaciones_periodo");
                jdbcTemplate.execute("DROP INDEX IF EXISTS idx_cabecera_fc_prestaciones_fecha");
            } catch (Exception e) {
                log.debug("Aviso al regenerar índices de facturación por ptovta: {}", e.getMessage());
            }

            for (String sqlIndex : indices) {
                try {
                    jdbcTemplate.execute(sqlIndex);
                } catch (Exception e) {
                    log.debug("Aviso creación de índice (puede que la tabla aún no exista): {}", e.getMessage());
                }
            }
            log.info("Verificación y creación de índices estratégicos de rendimiento completada.");

            try {
                jdbcTemplate.execute("""
                            CREATE TABLE IF NOT EXISTS registro_sincronizacion (
                                id BIGSERIAL PRIMARY KEY,
                                fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                usuario VARCHAR(100),
                                anio_procesado INT,
                                nuevos_insertados INT,
                                existentes_omitidos INT,
                                asociados_actualizados INT,
                                huerfanos_reconciliados INT DEFAULT 0,
                                duracion_ms BIGINT,
                                estado VARCHAR(20),
                                mensaje TEXT
                            )
                        """);
                jdbcTemplate.execute(
                        "ALTER TABLE registro_sincronizacion ADD COLUMN IF NOT EXISTS huerfanos_reconciliados INT DEFAULT 0");
                jdbcTemplate.execute(
                        "CREATE INDEX IF NOT EXISTS idx_registro_sincronizacion_fecha ON registro_sincronizacion(fecha_hora DESC)");
                log.info(
                        "Migración automática aplicada: tabla registro_sincronizacion verificada/creada con huerfanos_reconciliados.");
            } catch (Exception e) {
                log.error("Error al verificar/crear tabla registro_sincronizacion: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                            CREATE TABLE IF NOT EXISTS registro_sincronizacion_prestaciones (
                                id BIGSERIAL PRIMARY KEY,
                                fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                usuario VARCHAR(100),
                                anio_procesado INT,
                                nuevas_insertadas INT,
                                existentes_omitidas INT,
                                vinculadas_cabecera INT,
                                sin_cabecera INT,
                                duracion_ms BIGINT,
                                estado VARCHAR(20),
                                mensaje TEXT
                            )
                        """);
                jdbcTemplate.execute(
                        "CREATE INDEX IF NOT EXISTS idx_reg_sinc_prest_fecha ON registro_sincronizacion_prestaciones(fecha_hora DESC)");
                log.info(
                        "Migración automática aplicada: tabla registro_sincronizacion_prestaciones verificada/creada.");
            } catch (Exception e) {
                log.error("Error al verificar/crear tabla registro_sincronizacion_prestaciones: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                            CREATE TABLE IF NOT EXISTS amb_liquidado_manual (
                                id SERIAL PRIMARY KEY,
                                id_amb_liquidado INT NOT NULL REFERENCES amb_liquidado(id) ON DELETE CASCADE,
                                usuario_creacion VARCHAR(100) NOT NULL,
                                fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                observaciones TEXT
                            )
                        """);
                jdbcTemplate.execute(
                        "CREATE UNIQUE INDEX IF NOT EXISTS uq_amb_liquidado_manual_id ON amb_liquidado_manual (id_amb_liquidado)");
                log.info(
                        "Migración automática aplicada: tabla amb_liquidado_manual verificada/creada.");
            } catch (Exception e) {
                log.error("Error al verificar/crear tabla amb_liquidado_manual: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                            DO $$
                            BEGIN
                                IF EXISTS (
                                    SELECT 1 FROM information_schema.columns 
                                    WHERE table_name = 'amb_liquidado' 
                                      AND column_name = 'grupomodulo' 
                                      AND data_type = 'character varying'
                                ) THEN
                                    UPDATE amb_liquidado SET modulo = NULL WHERE modulo IS NOT NULL AND modulo !~ '^[0-9]+$';
                                    UPDATE amb_liquidado SET grupomodulo = NULL WHERE grupomodulo IS NOT NULL AND grupomodulo !~ '^[0-9]+$';

                                    ALTER TABLE amb_liquidado 
                                      ALTER COLUMN modulo TYPE bigint USING NULLIF(TRIM(modulo), '')::bigint,
                                      ALTER COLUMN grupomodulo TYPE bigint USING NULLIF(TRIM(grupomodulo), '')::bigint;
                                END IF;
                            END $$;
                        """);
                log.info("Migración automática aplicada: columnas modulo y grupomodulo verificadas/convertidas a BIGINT en amb_liquidado.");
            } catch (Exception e) {
                log.warn("Aviso migración modulo/grupomodulo en amb_liquidado: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute(
                        "ALTER TABLE notadecredito ADD COLUMN IF NOT EXISTS idcabecera_factura_destino BIGINT");
                jdbcTemplate.execute(
                        "CREATE INDEX IF NOT EXISTS idx_notadecredito_fac_destino ON notadecredito (idcabecera_factura_destino)");
                jdbcTemplate.update("""
                            UPDATE notadecredito nc
                            SET idcabecera_factura_destino = c_nc.asociado
                            FROM cabecera c_nc
                            WHERE nc.idcabecera = c_nc.id
                              AND nc.idcabecera_factura_destino IS NULL
                              AND c_nc.asociado IS NOT NULL
                              AND c_nc.asociado > 0
                        """);
                log.info("Migración automática aplicada: columna idcabecera_factura_destino verificada/creada en notadecredito.");
            } catch (Exception e) {
                log.debug("Aviso migración notadecredito.idcabecera_factura_destino: {}", e.getMessage());
            }

            // =========================================================================
            // MIGRACIÓN: Módulo Gestión Contable (Tablas y columnas requeridas)
            // =========================================================================
            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS facturas_anuladas_manual (
                        id_cabecera BIGINT PRIMARY KEY,
                        anulada BOOLEAN NOT NULL DEFAULT TRUE
                    )
                """);
                jdbcTemplate.execute("ALTER TABLE facturas_anuladas_manual ADD COLUMN IF NOT EXISTS id_cabecera_anulador BIGINT");
                jdbcTemplate.execute("ALTER TABLE facturas_anuladas_manual ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE facturas_anuladas_manual ADD COLUMN IF NOT EXISTS usuario VARCHAR(100)");
                jdbcTemplate.execute("ALTER TABLE facturas_anuladas_manual DROP COLUMN IF EXISTS comprobante_anulador");
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_fam_anulador ON facturas_anuladas_manual (id_cabecera_anulador)");
                log.info("Migración automática aplicada: columnas de comprobante anulador verificadas/creadas en facturas_anuladas_manual (comprobante_anulador redundante descartado).");
            } catch (Exception e) {
                log.debug("Aviso migración facturas_anuladas_manual: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS tipo_operacion (
                        id SERIAL PRIMARY KEY,
                        codigo VARCHAR(50) UNIQUE NOT NULL,
                        descripcion VARCHAR(150) NOT NULL
                    )
                """);
                jdbcTemplate.execute("""
                    INSERT INTO tipo_operacion (codigo, descripcion) VALUES
                        ('COBERTURA_RENOMBRE', 'Cambio de nombre a mostrar de cobertura'),
                        ('PERIODO_CORRECCION', 'Corrección del período de factura'),
                        ('PRESTACION_ESTADO', 'Modificación de estado de prestación (Considerar / No considerar)'),
                        ('FACTURA_ANULADA_MANUAL', 'Anulación manual de factura en Débitos'),
                        ('FACTURA_DESANULADA_MANUAL', 'Reversión de anulación manual de factura')
                    ON CONFLICT (codigo) DO NOTHING
                """);
            } catch (Exception e) {
                log.debug("Aviso migración tipo_operacion: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS historial_ajustes_contabilidad (
                        id BIGSERIAL PRIMARY KEY,
                        id_tipo_operacion INTEGER NOT NULL,
                        referencia VARCHAR(150) NOT NULL,
                        valor_anterior TEXT,
                        valor_nuevo TEXT,
                        usuario VARCHAR(100) NOT NULL,
                        fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """);
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_historial_contab_tipo ON historial_ajustes_contabilidad (id_tipo_operacion)");
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_historial_contab_ref ON historial_ajustes_contabilidad (referencia)");
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_historial_contab_fecha ON historial_ajustes_contabilidad (fecha_hora DESC)");
            } catch (Exception e) {
                log.debug("Aviso migración historial_ajustes_contabilidad: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS coberturas_alias (
                        codigo_cobertura VARCHAR(50) PRIMARY KEY,
                        nombre_original VARCHAR(255),
                        nombre_mostrar VARCHAR(255) NOT NULL
                    )
                """);
            } catch (Exception e) {
                log.debug("Aviso migración coberturas_alias: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS facturas_periodos_corregidos (
                        id_cabecera BIGINT PRIMARY KEY,
                        periodo_original DATE,
                        periodo_corregido DATE NOT NULL
                    )
                """);
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_fact_per_corregido ON facturas_periodos_corregidos (periodo_corregido)");
            } catch (Exception e) {
                log.debug("Aviso migración facturas_periodos_corregidos: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS prestaciones_consideracion (
                        codigo VARCHAR(50) PRIMARY KEY,
                        descripcion VARCHAR(255),
                        estado VARCHAR(20) NOT NULL DEFAULT 'Considerar',
                        estado_ambulatorio VARCHAR(20) NOT NULL DEFAULT 'Considerar',
                        estado_internado VARCHAR(20) NOT NULL DEFAULT 'Considerar'
                    )
                """);
                jdbcTemplate.execute("ALTER TABLE prestaciones_consideracion ADD COLUMN IF NOT EXISTS estado_ambulatorio VARCHAR(20) NOT NULL DEFAULT 'Considerar'");
                jdbcTemplate.execute("ALTER TABLE prestaciones_consideracion ADD COLUMN IF NOT EXISTS estado_internado VARCHAR(20) NOT NULL DEFAULT 'Considerar'");
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_prestaciones_estado ON prestaciones_consideracion (estado)");
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_prestaciones_estado_amb ON prestaciones_consideracion (estado_ambulatorio)");
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_prestaciones_estado_int ON prestaciones_consideracion (estado_internado)");

                Integer cantPrestaciones = jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM prestaciones_consideracion", Integer.class);
                if (cantPrestaciones != null && cantPrestaciones < 50000) {
                    log.info("Sincronizando prestaciones_consideracion desde cob_prestaciones (Gestión)...");
                    try {
                        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS dblink");
                        jdbcTemplate.execute("""
                            CREATE TEMP TABLE IF NOT EXISTS temp_cob_prestaciones_mig (
                                codigo VARCHAR(50) PRIMARY KEY,
                                descripcion VARCHAR(255)
                            ) ON COMMIT DROP;

                            INSERT INTO temp_cob_prestaciones_mig (codigo, descripcion)
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

                            DELETE FROM prestaciones_consideracion
                            WHERE estado = 'Considerar'
                              AND estado_ambulatorio = 'Considerar'
                              AND estado_internado = 'Considerar'
                              AND codigo NOT IN (SELECT codigo FROM temp_cob_prestaciones_mig);

                            INSERT INTO prestaciones_consideracion (codigo, descripcion, estado, estado_ambulatorio, estado_internado)
                            SELECT codigo, descripcion, 'Considerar', 'Considerar', 'Considerar'
                            FROM temp_cob_prestaciones_mig
                            ON CONFLICT (codigo) DO UPDATE
                            SET descripcion = EXCLUDED.descripcion;
                        """);
                        log.info("Sincronización de prestaciones_consideracion desde cob_prestaciones finalizada exitosamente vía dblink.");
                    } catch (Exception exDblink) {
                        log.warn("No se pudo sincronizar vía dblink ({}), intentando vía gestionJdbcTemplate...", exDblink.getMessage());
                        if (gestionJdbcTemplate != null) {
                            List<Map<String, Object>> filasGestion = gestionJdbcTemplate.queryForList("""
                                SELECT DISTINCT ON (TRIM(codigo))
                                    TRIM(codigo) AS codigo,
                                    TRIM(COALESCE(descripcion, '')) AS descripcion
                                FROM cob_prestaciones
                                WHERE codigo IS NOT NULL AND TRIM(codigo) <> ''
                                ORDER BY TRIM(codigo), idprestacion DESC
                            """, Collections.emptyMap());

                            if (!filasGestion.isEmpty()) {
                                List<Object[]> batch = new ArrayList<>();
                                for (Map<String, Object> row : filasGestion) {
                                    String c = (String) row.get("codigo");
                                    String d = (String) row.get("descripcion");
                                    if (c != null && !c.isBlank()) {
                                        batch.add(new Object[] { c, d });
                                    }
                                }

                                jdbcTemplate.batchUpdate("""
                                    INSERT INTO prestaciones_consideracion (codigo, descripcion, estado, estado_ambulatorio, estado_internado)
                                    VALUES (?, ?, 'Considerar', 'Considerar', 'Considerar')
                                    ON CONFLICT (codigo) DO UPDATE
                                    SET descripcion = EXCLUDED.descripcion
                                """, batch);

                                log.info("Sincronización de prestaciones_consideracion vía gestionJdbcTemplate completada: {} filas.", batch.size());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Aviso migración prestaciones_consideracion: {}", e.getMessage());
            }

            // =========================================================================
            // MIGRACIÓN: Backfill y propagación de tiporegistro (Ambulatorios / Internados)
            // =========================================================================
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cabecera_tiporegistro ON cabecera (tiporegistro)");

                Integer facturasSinTipo = jdbcTemplate.queryForObject("""
                    SELECT count(*) FROM cabecera
                    WHERE UPPER(TRIM(tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                      AND tiporegistro IS NULL
                """, Integer.class);

                if (facturasSinTipo != null && facturasSinTipo > 0) {
                    log.info("Iniciando migración de tiporegistro: se detectaron {} facturas sin tiporegistro...", facturasSinTipo);

                    // 1. Población desde prestaciones locales en amb_liquidado
                    try {
                        int desdeAmb = jdbcTemplate.update("""
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
                              AND c.tiporegistro IS NULL
                        """);
                        if (desdeAmb > 0) {
                            log.info("Migración tiporegistro: {} cabeceras actualizadas desde amb_liquidado local.", desdeAmb);
                        }
                    } catch (Exception exAmb) {
                        log.warn("Aviso migración tiporegistro desde amb_liquidado: {}", exAmb.getMessage());
                    }

                    // 2. Población desde cob_liquidaciones en Gestión (vía dblink o consulta directa)
                    boolean completadoDblink = false;
                    try {
                        int desdeGestion = jdbcTemplate.update("""
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
                              AND c.tiporegistro IS NULL
                        """);
                        completadoDblink = true;
                        log.info("Migración tiporegistro vía dblink: {} facturas actualizadas desde cob_liquidaciones.", desdeGestion);
                    } catch (Exception exDblink) {
                        log.warn("No se pudo ejecutar actualización de tiporegistro vía dblink ({}). Intentando vía gestiónJdbcTemplate...", exDblink.getMessage());
                    }

                    if (!completadoDblink && gestionJdbcTemplate != null) {
                        try {
                            List<Map<String, Object>> liqs = gestionJdbcTemplate.queryForList("""
                                SELECT DISTINCT ON (letra, num4, num8)
                                    letra, num4, num8, ambint
                                FROM cob_liquidaciones
                                WHERE ambint IN ('A', 'I')
                                ORDER BY letra, num4, num8, idliquidacion DESC
                            """, Collections.emptyMap());

                            List<Object[]> batchParams = new ArrayList<>(liqs.size());
                            for (Map<String, Object> row : liqs) {
                                String letra = (String) row.get("letra");
                                String num4Str = (String) row.get("num4");
                                String num8Str = (String) row.get("num8");
                                String ambint = (String) row.get("ambint");
                                if (letra != null && num4Str != null && num8Str != null && ambint != null) {
                                    try {
                                        int p = Integer.parseInt(num4Str.trim());
                                        int n = Integer.parseInt(num8Str.trim());
                                        String tr = "I".equalsIgnoreCase(ambint.trim()) ? "Internados" : "Ambulatorios";
                                        batchParams.add(new Object[] { tr, letra.trim().toUpperCase(), p, n });
                                    } catch (NumberFormatException ignored) {}
                                }
                            }

                            if (!batchParams.isEmpty()) {
                                int batchSize = 2000;
                                int totalActualizados = 0;
                                for (int i = 0; i < batchParams.size(); i += batchSize) {
                                    List<Object[]> sub = batchParams.subList(i, Math.min(i + batchSize, batchParams.size()));
                                    int[] res = jdbcTemplate.batchUpdate("""
                                        UPDATE cabecera
                                        SET tiporegistro = ?
                                        WHERE UPPER(TRIM(letra)) = ?
                                          AND ptovta = ?
                                          AND numero = ?
                                          AND UPPER(TRIM(tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                                          AND tiporegistro IS NULL
                                    """, sub);
                                    for (int r : res) {
                                        if (r > 0) totalActualizados += r;
                                    }
                                }
                                log.info("Migración tiporegistro vía JDBC directo: {} facturas actualizadas desde Gestión.", totalActualizados);
                            }
                        } catch (Exception exDirect) {
                            log.error("Error al migrar tiporegistro vía JDBC directo: {}", exDirect.getMessage(), exDirect);
                        }
                    }

                    // 3. Propagación de tiporegistro a documentos hijos (asociado directo, asociadogrupo, grupo)
                    int propAsociado = jdbcTemplate.update("""
                        UPDATE cabecera c_hijo
                        SET tiporegistro = c_padre.tiporegistro
                        FROM cabecera c_padre
                        WHERE c_hijo.asociado = c_padre.id
                          AND c_padre.tiporegistro IS NOT NULL
                          AND c_hijo.tiporegistro IS NULL
                    """);

                    int propGrupo = jdbcTemplate.update("""
                        UPDATE cabecera c_hijo
                        SET tiporegistro = c_fac.tiporegistro
                        FROM cabecera c_fac
                        WHERE c_hijo.asociadogrupo = c_fac.asociadogrupo
                          AND c_fac.asociadogrupo IS NOT NULL AND c_fac.asociadogrupo > 0
                          AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                          AND c_fac.tiporegistro IS NOT NULL
                          AND c_hijo.tiporegistro IS NULL
                    """);

                    int propLegacy = jdbcTemplate.update("""
                        UPDATE cabecera c_hijo
                        SET tiporegistro = c_fac.tiporegistro
                        FROM cabecera c_fac
                        WHERE c_hijo.grupo = c_fac.grupo
                          AND c_fac.grupo IS NOT NULL AND c_fac.grupo > 0
                          AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                          AND c_fac.tiporegistro IS NOT NULL
                          AND c_hijo.tiporegistro IS NULL
                    """);

                    log.info("Migración tiporegistro completada: propagado a {} comprobantes por asociado directo, {} por asociadogrupo y {} por grupo legacy.",
                            propAsociado, propGrupo, propLegacy);
                }
            } catch (Exception e) {
                log.warn("Aviso migración tiporegistro en cabecera: {}", e.getMessage());
            }
        };
    }
}
