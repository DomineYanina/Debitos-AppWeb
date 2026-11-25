package com.debitos.backend.service;

import com.debitos.backend.dto.ResumenSincronizacionDTO;
import com.debitos.backend.dto.ResumenSincronizacionPrestacionesDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Servicio programado para la automatización nocturna de la sincronización
 * de comprobantes (Cuenta Corriente) y prestaciones (ambulatorios e internados).
 *
 * <p>Se ejecuta todas las noches a la medianoche (00:00:00 hs de Argentina)
 * manteniendo la coherencia de datos, actualizando auditoría y pre-calentando
 * la caché para la jornada laboral del día siguiente.</p>
 */
@Service
public class SincronizacionProgramadaService {

    private static final Logger log = LoggerFactory.getLogger(SincronizacionProgramadaService.class);
    private static final String USUARIO_CRON = "SISTEMA_AUTO";

    @Autowired
    private SincronizacionCtaCteService ctaCteService;

    @Autowired
    private SincronizacionPrestacionesService prestacionesService;

    @Autowired(required = false)
    private MaterializedViewRefreshService mvRefreshService;

    @Autowired(required = false)
    private CacheWarmingService cacheWarmingService;

    @Value("${app.sincronizacion.automatica.enabled:true}")
    private boolean automatizacionHabilitada;

    /** Evita arranques simultáneos si una sincronización previa continúa en curso */
    private final AtomicBoolean enEjecucion = new AtomicBoolean(false);

    /**
     * Tarea programada nocturna a las 00:00 hs (Horario de Argentina).
     * Cron estándar: segundo minuto hora día mes día-semana
     */
    @Scheduled(cron = "${app.sincronizacion.automatica.cron:0 0 0 * * *}", zone = "America/Argentina/Buenos_Aires")
    public void ejecutarSincronizacionNocturna() {
        if (!automatizacionHabilitada) {
            log.info("[CRON NOCTURNO] Sincronización automática deshabilitada por configuración (app.sincronizacion.automatica.enabled=false).");
            return;
        }

        if (!enEjecucion.compareAndSet(false, true)) {
            log.warn("[CRON NOCTURNO] Se intentó iniciar la sincronización programada pero ya hay un proceso en ejecución. Se omite este ciclo.");
            return;
        }

        int anioActual = LocalDate.now().getYear();
        log.info("[CRON NOCTURNO] ==========================================================================");
        log.info("[CRON NOCTURNO] Iniciando proceso automático de sincronización nocturna para el año {}", anioActual);
        log.info("[CRON NOCTURNO] ==========================================================================");

        long inicioTotal = System.currentTimeMillis();

        try {
            // 1. Sincronizar Comprobantes de Cuenta Corriente (Crea o actualiza las facturas en 'cabecera')
            log.info("[CRON NOCTURNO] [1/3] Sincronizando comprobantes desde Gestión...");
            ResumenSincronizacionDTO resComprobantes = ctaCteService.ejecutarSincronizacion(USUARIO_CRON, anioActual);
            if (resComprobantes != null && resComprobantes.isExito()) {
                log.info("[CRON NOCTURNO] [1/3] Comprobantes finalizado con éxito: {} nuevos, {} omitidos, {} asociados actualizados.",
                        resComprobantes.getNuevosInsertados(),
                        resComprobantes.getExistentesOmitidos(),
                        resComprobantes.getAsociadosActualizados());
            } else {
                String errorMsg = (resComprobantes != null) ? resComprobantes.getMensaje() : "Respuesta nula";
                log.error("[CRON NOCTURNO] [1/3] Falló la sincronización de comprobantes: {}", errorMsg);
            }

            // 2. Sincronizar Prestaciones (Al tener ya las facturas en 'cabecera', se vinculan idcabecera de inmediato)
            log.info("[CRON NOCTURNO] [2/3] Sincronizando prestaciones (ambulatorios e internaciones)...");
            ResumenSincronizacionPrestacionesDTO resPrestaciones = prestacionesService.sincronizar(USUARIO_CRON, anioActual);
            if (resPrestaciones != null && resPrestaciones.isExito()) {
                log.info("[CRON NOCTURNO] [2/3] Prestaciones finalizado con éxito: {} nuevas, {} vinculadas, {} omitidas.",
                        resPrestaciones.getNuevasInsertadas(),
                        resPrestaciones.getVinculadasCabecera(),
                        resPrestaciones.getExistentesOmitidas());
            } else {
                String errorMsg = (resPrestaciones != null) ? resPrestaciones.getMensaje() : "Respuesta nula";
                log.error("[CRON NOCTURNO] [2/3] Falló la sincronización de prestaciones: {}", errorMsg);
            }

            // 3. Mantenimiento: Refrescar Vista Materializada y Calentar Caché
            log.info("[CRON NOCTURNO] [3/3] Ejecutando refresh de vista materializada y calentamiento de caché...");
            if (mvRefreshService != null) {
                try {
                    mvRefreshService.ejecutarRefresh();
                    log.info("[CRON NOCTURNO] [3/3] Vista materializada mv_ids_anulados actualizada.");
                } catch (Exception exMv) {
                    log.warn("[CRON NOCTURNO] [3/3] Aviso al refrescar vista materializada: {}", exMv.getMessage());
                }
            }

            if (cacheWarmingService != null) {
                try {
                    cacheWarmingService.calentarCacheAsincrono();
                    log.info("[CRON NOCTURNO] [3/3] Pre-calentamiento asíncrono de tablero iniciado.");
                } catch (Exception exCache) {
                    log.warn("[CRON NOCTURNO] [3/3] Aviso al pre-calentar caché: {}", exCache.getMessage());
                }
            }

            long duracionTotal = System.currentTimeMillis() - inicioTotal;
            log.info("[CRON NOCTURNO] ==========================================================================");
            log.info("[CRON NOCTURNO] Proceso nocturno completado exitosamente en {} ms (~{} seg).", duracionTotal, duracionTotal / 1000);
            log.info("[CRON NOCTURNO] ==========================================================================");

        } catch (Exception e) {
            log.error("[CRON NOCTURNO] Error no controlado durante la sincronización nocturna: {}", e.getMessage(), e);
        } finally {
            enEjecucion.set(false);
        }
    }

    /**
     * Permite conocer si actualmente la tarea programada está corriendo.
     */
    public boolean isEnEjecucion() {
        return enEjecucion.get();
    }
}
