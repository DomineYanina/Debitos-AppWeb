package com.debitos.backend.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tipo_notificacion", length = 50, nullable = false)
    private String tipoNotificacion;

    @Column(name = "titulo", length = 150, nullable = false)
    private String titulo;

    @Column(name = "mensaje", length = 500, nullable = false)
    private String mensaje;

    @Column(name = "rol_destino", length = 50)
    private String rolDestino = "ADMIN";

    @Column(name = "usuario_origen", length = 100, nullable = false)
    private String usuarioOrigen;

    @Column(name = "tipo_doc", length = 10)
    private String tipoDoc;

    @Column(name = "letra_doc", length = 5)
    private String letraDoc;

    @Column(name = "pto_vta")
    private Integer ptoVta;

    @Column(name = "numero")
    private Integer numero;

    @Column(name = "leida")
    private Boolean leida = false;

    @Column(name = "fecha_creacion")
    private ZonedDateTime fechaCreacion = ZonedDateTime.now();

    @Column(name = "fecha_lectura")
    private ZonedDateTime fechaLectura;

    public Notificacion() {}

    public Notificacion(String tipoNotificacion, String titulo, String mensaje, String rolDestino,
                        String usuarioOrigen, String tipoDoc, String letraDoc, Integer ptoVta, Integer numero) {
        this.tipoNotificacion = tipoNotificacion;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.rolDestino = rolDestino != null ? rolDestino : "ADMIN";
        this.usuarioOrigen = usuarioOrigen;
        this.tipoDoc = tipoDoc;
        this.letraDoc = letraDoc;
        this.ptoVta = ptoVta;
        this.numero = numero;
        this.leida = false;
        this.fechaCreacion = ZonedDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipoNotificacion() { return tipoNotificacion; }
    public void setTipoNotificacion(String tipoNotificacion) { this.tipoNotificacion = tipoNotificacion; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getRolDestino() { return rolDestino; }
    public void setRolDestino(String rolDestino) { this.rolDestino = rolDestino; }

    public String getUsuarioOrigen() { return usuarioOrigen; }
    public void setUsuarioOrigen(String usuarioOrigen) { this.usuarioOrigen = usuarioOrigen; }

    public String getTipoDoc() { return tipoDoc; }
    public void setTipoDoc(String tipoDoc) { this.tipoDoc = tipoDoc; }

    public String getLetraDoc() { return letraDoc; }
    public void setLetraDoc(String letraDoc) { this.letraDoc = letraDoc; }

    public Integer getPtoVta() { return ptoVta; }
    public void setPtoVta(Integer ptoVta) { this.ptoVta = ptoVta; }

    public Integer getNumero() { return numero; }
    public void setNumero(Integer numero) { this.numero = numero; }

    public Boolean getLeida() { return leida; }
    public void setLeida(Boolean leida) { this.leida = leida; }

    public ZonedDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(ZonedDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public ZonedDateTime getFechaLectura() { return fechaLectura; }
    public void setFechaLectura(ZonedDateTime fechaLectura) { this.fechaLectura = fechaLectura; }
}
