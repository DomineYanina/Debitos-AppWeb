package com.debitos.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.Arrays;

@Configuration
public class CacheConfig {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    public static final String CACHE_COBERTURAS = "directorio_coberturas";
    public static final String CACHE_TIPOS_DOC = "directorio_tipos_doc";
    public static final String CACHE_TOTALES = "directorio_totales";
    public static final String CACHE_BALANCE = "directorio_balance";
    public static final String CACHE_DONUT = "directorio_donut";
    public static final String CACHE_DISTRIBUCION = "directorio_distribucion";
    public static final String CACHE_EVOLUCION = "directorio_evolucion";
    public static final String CACHE_AGING = "directorio_aging";
    public static final String CACHE_TIEMPOS = "directorio_tiempos";
    public static final String CACHE_MOTIVOS = "directorio_motivos";
    public static final String CACHE_MATRIZ = "directorio_matriz";
    public static final String CACHE_DESEMPENO = "directorio_desempeno";
    public static final String CACHE_ANALISTAS = "directorio_analistas";
    public static final String CACHE_TRAZABILIDAD = "directorio_trazabilidad";
    public static final String CACHE_BUCLES = "directorio_bucles";

    private CacheManager cacheManager;

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager manager = new ConcurrentMapCacheManager(
                CACHE_COBERTURAS,
                CACHE_TIPOS_DOC,
                CACHE_TOTALES,
                CACHE_BALANCE,
                CACHE_DONUT,
                CACHE_DISTRIBUCION,
                CACHE_EVOLUCION,
                CACHE_AGING,
                CACHE_TIEMPOS,
                CACHE_MOTIVOS,
                CACHE_MATRIZ,
                CACHE_DESEMPENO,
                CACHE_ANALISTAS,
                CACHE_TRAZABILIDAD,
                CACHE_BUCLES
        );
        this.cacheManager = manager;
        return manager;
    }

    /**
     * Desalojo automático programado cada 10 minutos para asegurar frescura de métricas agregadas.
     */
    @Scheduled(fixedRate = 600000) // 10 minutos en milisegundos
    public void vaciarCacheProgramada() {
        if (cacheManager != null) {
            for (String cacheName : cacheManager.getCacheNames()) {
                var cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                }
            }
            log.info("Caché en memoria del Tablero de Control desalojada automáticamente tras 10 minutos.");
        }
    }

    /**
     * Método público para desalojar toda la caché manualmente cuando se guardan nuevas imputaciones.
     */
    public void desalojarCacheTablero() {
        if (cacheManager != null) {
            for (String cacheName : Arrays.asList(
                    CACHE_TOTALES,
                    CACHE_BALANCE,
                    CACHE_DONUT,
                    CACHE_DISTRIBUCION,
                    CACHE_EVOLUCION,
                    CACHE_AGING,
                    CACHE_TIEMPOS,
                    CACHE_MOTIVOS,
                    CACHE_MATRIZ,
                    CACHE_DESEMPENO)) {
                var cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                }
            }
            log.info("Caché del Tablero de Control invalidada por nueva imputación.");
        }
    }
}
