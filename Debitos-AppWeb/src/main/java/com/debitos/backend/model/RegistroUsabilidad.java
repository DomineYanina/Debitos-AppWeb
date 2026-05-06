package com.debitos.backend.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "registro_usabilidad")
public class RegistroUsabilidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String usuario;

    @Column(name = "fecha_hora", insertable = false, updatable = false)
    private ZonedDateTime fechaHora;

    @Column(name = "documento_referencia")
    private String documentoReferencia;

    private String evento;

    @Column(name = "cantidad_registros_pendientes")
    private Integer cantidadRegistrosPendientes;

    // Generá los Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public ZonedDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(ZonedDateTime fechaHora) { this.fechaHora = fechaHora; }
    public String getDocumentoReferencia() { return documentoReferencia; }
    public void setDocumentoReferencia(String documentoReferencia) { this.documentoReferencia = documentoReferencia; }
    public String getEvento() { return evento; }
    public void setEvento(String evento) { this.evento = evento; }
    public Integer getCantidadRegistrosPendientes() { return cantidadRegistrosPendientes; }
    public void setCantidadRegistrosPendientes(Integer cantidadRegistrosPendientes) { this.cantidadRegistrosPendientes = cantidadRegistrosPendientes; }
}