package com.debitos.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationConfig.class);

    @Bean
    public ApplicationRunner ejecutarMigraciones(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE registro_imputacion ALTER COLUMN tipo_imputacion TYPE VARCHAR(100)");
                log.info("Migración automática aplicada: registro_imputacion.tipo_imputacion ampliado a VARCHAR(100).");
            } catch (Exception e) {
                log.debug("Aviso migración registro_imputacion (la columna ya tiene el tamaño o la tabla aún no fue creada): {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute(
                    "ALTER TABLE cabecera ADD COLUMN IF NOT EXISTS comprobante VARCHAR(50)"
                );
                log.info("Migración automática aplicada: cabecera.comprobante creada (si no existía).");
            } catch (Exception e) {
                log.debug("Aviso migración cabecera.comprobante: {}", e.getMessage());
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
                    log.info("Migración automática aplicada: asignado período correspondiente a {} comprobantes de cobranza/recibos según su fecha.", recibosActualizados);
                }
            } catch (Exception e) {
                log.debug("Aviso migración período en recibos de cabecera: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE notadedebito DROP CONSTRAINT IF EXISTS unique_id_notadecredito");
                log.info("Migración automática aplicada: eliminada restricción de unicidad unique_id_notadecredito en notadedebito.");
            } catch (Exception e) {
                log.debug("Aviso migración unique_id_notadecredito: {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("DROP INDEX IF EXISTS unique_id_notadecredito");
                log.info("Migración automática aplicada: eliminado índice unique_id_notadecredito en notadedebito si existía.");
            } catch (Exception e) {
                log.debug("Aviso migración drop index unique_id_notadecredito: {}", e.getMessage());
            }

            try {
                int ndSincronizadas = jdbcTemplate.update("""
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
                    log.info("Migración automática aplicada: sincronizado asociadogrupo en {} cabeceras de ND con sus respectivas NC padre.", ndSincronizadas);
                }
            } catch (Exception e) {
                log.debug("Aviso migración sincronización asociadogrupo ND: {}", e.getMessage());
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
                int ncSincronizadas = jdbcTemplate.update("""
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
                    log.info("Migración automática aplicada: sincronizados datos de NC en {} registros de nc_ajustedeiva.", ncSincronizadas);
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
                int ndSincronizadasAjuste = jdbcTemplate.update("""
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
                    log.info("Migración automática aplicada: sincronizados datos de ND en {} registros de nd_ajustedeiva.", ndSincronizadasAjuste);
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
                "CREATE INDEX IF NOT EXISTS idx_amb_liquidado_operador ON amb_liquidado (operador)",
                "CREATE INDEX IF NOT EXISTS idx_cabecera_coalesce_grupo ON cabecera ((COALESCE(asociadogrupo, grupo)))",
                "CREATE INDEX IF NOT EXISTS idx_comprobantes_anulados_idcabecera ON comprobantes_anulados (idcabecera)"
            };

            for (String sqlIndex : indices) {
                try {
                    jdbcTemplate.execute(sqlIndex);
                } catch (Exception e) {
                    log.debug("Aviso creación de índice (puede que la tabla aún no exista): {}", e.getMessage());
                }
            }
            log.info("Verificación y creación de índices estratégicos de rendimiento completada.");
        };
    }
}
