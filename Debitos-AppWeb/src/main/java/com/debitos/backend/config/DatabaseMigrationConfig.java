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
        };
    }
}
