package com.debitos.backend.service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public class CacheWarmingService {

    private static final Logger log = LoggerFactory.getLogger(CacheWarmingService.class);

    @Autowired
    private DirectorioService directorioService;

    private final AtomicBoolean enCalentamiento = new AtomicBoolean(false);

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        calentarCacheAsincrono();
    }

    public void calentarCacheAsincrono() {
        if (!enCalentamiento.compareAndSet(false, true)) {
            return;
        }

        CompletableFuture.runAsync(() -> {
            long inicio = System.currentTimeMillis();
            try {
                // 1. Precarga ligera e instantánea de catálogos base usados por todas las solapas
                directorioService.obtenerCoberturasDisponibles();
                directorioService.obtenerTiposDocumentoDisponibles();
                long duracion = System.currentTimeMillis() - inicio;
                log.info("[CacheWarming] Catálogos base precargados en memoria en {} ms.", duracion);

                // 2. Pre-calentamiento del Tablero Principal (solapa por defecto)
                // Se ejecuta en segundo plano para que el primer acceso del usuario sea instantáneo
                Thread.sleep(1500);
                long inicioTablero = System.currentTimeMillis();
                directorioService.obtenerTotalesMacro(null, null, null, null);
                directorioService.obtenerBalanceFinanciero(null, null, null, null);
                directorioService.getEvolucionMensual(null, null, null, null);
                directorioService.obtenerDistribucionCarteraDonut(null, null, null, null);
                long duracionTablero = System.currentTimeMillis() - inicioTablero;
                log.info("[CacheWarming] Tablero principal (Totales, Balance, Evolución, Donut) pre-calentado en {} ms.", duracionTablero);
            } catch (Exception e) {
                log.debug("[CacheWarming] Aviso precarga catálogos: {}", e.getMessage());
            } finally {
                enCalentamiento.set(false);
            }
        });
    }
}
