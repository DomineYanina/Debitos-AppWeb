package com.debitos.backend.dto;

import java.time.ZonedDateTime;

public class NotificacionDTO {
    private Long id;
    private String tipoNotificacion;
    private String titulo;
    private String mensaje;
    private String usuario;
    private ZonedDateTime fechaHora;
    private String documentoReferencia;
    private String tipoDoc;
    private String letra;
    private Integer puntoVenta;
    private Integer numero;
    private String evento;
    private Boolean leida;

    public NotificacionDTO() {}

    public NotificacionDTO(Long id, String tipoNotificacion, String titulo, String mensaje, String usuario,
                           ZonedDateTime fechaHora, String documentoReferencia, String tipoDoc,
                           String letra, Integer puntoVenta, Integer numero, String evento, Boolean leida) {
        this.id = id;
        this.tipoNotificacion = tipoNotificacion;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.usuario = usuario;
        this.fechaHora = fechaHora;
        this.documentoReferencia = documentoReferencia;
        this.tipoDoc = tipoDoc;
        this.letra = letra;
        this.puntoVenta = puntoVenta;
        this.numero = numero;
        this.evento = evento;
        this.leida = leida;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipoNotificacion() { return tipoNotificacion; }
    public void setTipoNotificacion(String tipoNotificacion) { this.tipoNotificacion = tipoNotificacion; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public ZonedDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(ZonedDateTime fechaHora) { this.fechaHora = fechaHora; }

    public String getDocumentoReferencia() { return documentoReferencia; }
    public void setDocumentoReferencia(String documentoReferencia) { this.documentoReferencia = documentoReferencia; }

    public String getTipoDoc() { return tipoDoc; }
    public void setTipoDoc(String tipoDoc) { this.tipoDoc = tipoDoc; }

    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }

    public Integer getPuntoVenta() { return puntoVenta; }
    public void setPuntoVenta(Integer puntoVenta) { this.puntoVenta = puntoVenta; }

    public Integer getNumero() { return numero; }
    public void setNumero(Integer numero) { this.numero = numero; }

    public String getEvento() { return evento; }
    public void setEvento(String evento) { this.evento = evento; }

    public Boolean getLeida() { return leida; }
    public void setLeida(Boolean leida) { this.leida = leida; }
}

