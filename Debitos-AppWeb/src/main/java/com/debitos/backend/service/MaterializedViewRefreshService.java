package com.debitos.backend.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Servicio responsable de mantener actualizada la Vista Materializada
 * {@code mv_ids_anulados}, que pre-computa el conjunto de IDs excluidos
 * del Tablero de Control (comprobantes anulados y sus anuladores dentro
 * de 15 días).
 *
 * <p>Se utiliza {@code REFRESH MATERIALIZED VIEW CONCURRENTLY} para no
 * bloquear las lecturas simultáneas del Tablero durante el refresh.
 * Esto requiere que la vista tenga un índice único (ver
 * {@code create_mv_ids_anulados.sql}).</p>
 *
 * <p>El refresh se ejecuta:</p>
 * <ul>
 *   <li>Al iniciar la aplicación (asíncrono, no bloquea el arranque).</li>
 *   <li>Diariamente a las 03:00 hs vía {@code @Scheduled}.</li>
 * </ul>
 */
@Service
public class MaterializedViewRefreshService {

    private static final Logger log = LoggerFactory.getLogger(MaterializedViewRefreshService.class);

    private static final String REFRESH_SQL =
            "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ids_anulados";

    @PersistenceContext
    private EntityManager entityManager;

    /** Evita arranques de refresh simultáneos. */
    private final AtomicBoolean refreshEnCurso = new AtomicBoolean(false);

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh al arrancar la aplicación
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Ejecuta el primer refresh de la vista materializada en background
     * una vez que el contexto de Spring esté completamente levantado.
     * No bloquea el arranque de la aplicación.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void refreshAlArrancar() {
        log.info("[MV] Programando refresh inicial de mv_ids_anulados en background...");
        CompletableFuture.runAsync(this::ejecutarRefresh);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh diario a las 03:00 hs
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Refresca la vista materializada todos los días a las 03:00 hs.
     * Si ya hay un refresh en curso (p.ej. el del arranque todavía no terminó),
     * se omite para evitar concurrencia.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void refreshDiario() {
        log.info("[MV] Iniciando refresh diario programado de mv_ids_anulados...");
        CompletableFuture.runAsync(this::ejecutarRefresh);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lógica de refresh con protección contra concurrencia
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Ejecuta el {@code REFRESH MATERIALIZED VIEW CONCURRENTLY} dentro de
     * su propia transacción, protegido por un flag atómico para no arrancar
     * dos refresh simultáneos.
     *
     * <p>En caso de error (p.ej. la vista aún no existe porque el DBA no corrió
     * el script {@code create_mv_ids_anulados.sql}), registra el error como
     * WARNING y continúa: el Tablero seguirá funcionando con la MV vacía o
     * degradará al comportamiento anterior si la vista no existe.</p>
     */
    @Transactional
    public void ejecutarRefresh() {
        if (!refreshEnCurso.compareAndSet(false, true)) {
            log.debug("[MV] Refresh ya en curso, se omite este intento.");
            return;
        }
        long inicio = System.currentTimeMillis();
        try {
            log.info("[MV] Ejecutando: {}", REFRESH_SQL);
            entityManager.createNativeQuery(REFRESH_SQL).executeUpdate();
            long duracion = System.currentTimeMillis() - inicio;
            log.info("[MV] mv_ids_anulados refrescada exitosamente en {} ms.", duracion);
        } catch (Exception e) {
            log.warn("[MV] No se pudo refrescar mv_ids_anulados: {}. " +
                     "Verificar que el script create_mv_ids_anulados.sql fue ejecutado en la base de datos.",
                     e.getMessage());
        } finally {
            refreshEnCurso.set(false);
        }
    }
}
