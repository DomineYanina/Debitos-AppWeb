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
                "CREATE INDEX IF NOT EXISTS idx_nc_ajustedeiva_idcabecera ON nc_ajustedeiva (idcabecera)"
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
