package com.debitos.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

/**
 * Configuración de acceso de sólo lectura a la base de datos externa 'gestion'.
 * Utiliza un pool Hikari independiente y expone NamedParameterJdbcTemplate
 * sin interferir con el DataSource principal ni el EntityManager JPA de
 * Débitos.
 */
@Configuration
public class GestionDataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(GestionDataSourceConfig.class);

    @Value("${gestion.datasource.url:jdbc:postgresql://172.16.15.41:9090/gestion}")
    private String url;

    @Value("${gestion.datasource.username:yanina}")
    private String username;

    @Value("${gestion.datasource.password:yanina**333-}")
    private String password;

    @Value("${gestion.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    private HikariDataSource gestionPool;

    @Bean(name = "gestionJdbcTemplate")
    public NamedParameterJdbcTemplate gestionJdbcTemplate() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(15000);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(1200000);
        config.setReadOnly(true);
        config.setPoolName("HikariPool-Gestion-ReadOnly");
        // -1: Permite que Spring Boot arranque normalmente incluso si la base externa
        // Gestión
        // está temporalmente inaccesible o si las credenciales fallan.
        config.setInitializationFailTimeout(-1);

        log.info("Inicializando pool secundario Hikari para base de datos Gestión en {}", url);
        try {
            this.gestionPool = new HikariDataSource(config);
        } catch (Exception e) {
            log.error(
                    "Aviso: No se pudo conectar a la base de datos Gestión en el arranque: {}. La aplicación principal continuará normalmente.",
                    e.getMessage());
        }
        return new NamedParameterJdbcTemplate(this.gestionPool);
    }

    @PreDestroy
    public void closePool() {
        if (gestionPool != null && !gestionPool.isClosed()) {
            log.info("Cerrando pool Hikari de Gestión...");
            gestionPool.close();
        }
    }
}
