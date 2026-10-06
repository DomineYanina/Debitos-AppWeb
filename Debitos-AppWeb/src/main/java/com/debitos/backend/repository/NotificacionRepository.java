package com.debitos.backend.repository;

import com.debitos.backend.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    @Query(value = "SELECT * FROM notificaciones WHERE rol_destino IN (:roles) ORDER BY fecha_creacion DESC LIMIT 50", nativeQuery = true)
    List<Notificacion> findTop50ByRolDestinoIn(@Param("roles") Collection<String> roles);

    @Query(value = "SELECT * FROM notificaciones ORDER BY fecha_creacion DESC LIMIT 50", nativeQuery = true)
    List<Notificacion> findTop50();

    @Query(value = "SELECT COUNT(*) FROM notificaciones WHERE rol_destino IN (:roles) AND (leida IS FALSE OR leida IS NULL)", nativeQuery = true)
    long countByRolDestinoInAndLeidaFalse(@Param("roles") Collection<String> roles);

    @Modifying
    @Transactional
    @Query("UPDATE Notificacion n SET n.leida = true, n.fechaLectura = :fechaLectura WHERE n.id = :id")
    void marcarComoLeida(@Param("id") Long id, @Param("fechaLectura") ZonedDateTime fechaLectura);

    @Modifying
    @Transactional
    @Query("UPDATE Notificacion n SET n.leida = true, n.fechaLectura = :fechaLectura WHERE (n.leida = false OR n.leida IS NULL) AND n.rolDestino IN :roles")
    void marcarTodasComoLeidas(@Param("roles") Collection<String> roles, @Param("fechaLectura") ZonedDateTime fechaLectura);
}

