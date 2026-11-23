package com.debitos.backend.repository;

import com.debitos.backend.model.NotificacionLectura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Set;

@Repository
public interface NotificacionLecturaRepository extends JpaRepository<NotificacionLectura, Long> {

    @Query("SELECT nl.notificacion.id FROM NotificacionLectura nl WHERE LOWER(TRIM(nl.usuario)) = LOWER(TRIM(:usuario)) AND nl.notificacion.id IN :notifIds")
    Set<Long> findLeidasIdsByUsuarioAndNotificacionIdIn(@Param("usuario") String usuario, @Param("notifIds") Collection<Long> notifIds);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO notificacion_lecturas (notificacion_id, usuario, fecha_lectura)
        VALUES (:notifId, :usuario, NOW())
        ON CONFLICT (notificacion_id, usuario) DO NOTHING
    """, nativeQuery = true)
    void registrarLectura(@Param("notifId") Long notifId, @Param("usuario") String usuario);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO notificacion_lecturas (notificacion_id, usuario, fecha_lectura)
        SELECT n.id, :usuario, NOW()
        FROM notificaciones n
        WHERE n.rol_destino IN (:roles)
        ON CONFLICT (notificacion_id, usuario) DO NOTHING
    """, nativeQuery = true)
    void registrarLecturaMasiva(@Param("roles") Collection<String> roles, @Param("usuario") String usuario);
}
