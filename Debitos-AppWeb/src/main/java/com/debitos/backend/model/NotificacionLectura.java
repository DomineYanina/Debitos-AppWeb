package com.debitos.backend.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "notificacion_lecturas", uniqueConstraints = {
        @UniqueConstraint(name = "uk_notif_lectura_usuario", columnNames = {"notificacion_id", "usuario"})
})
public class NotificacionLectura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notificacion_id", nullable = false)
    private Notificacion notificacion;

    @Column(name = "usuario", length = 100, nullable = false)
    private String usuario;

    @Column(name = "fecha_lectura")
    private ZonedDateTime fechaLectura = ZonedDateTime.now();

    public NotificacionLectura() {}

    public NotificacionLectura(Notificacion notificacion, String usuario) {
        this.notificacion = notificacion;
        this.usuario = usuario;
        this.fechaLectura = ZonedDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Notificacion getNotificacion() { return notificacion; }
    public void setNotificacion(Notificacion notificacion) { this.notificacion = notificacion; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public ZonedDateTime getFechaLectura() { return fechaLectura; }
    public void setFechaLectura(ZonedDateTime fechaLectura) { this.fechaLectura = fechaLectura; }
}
