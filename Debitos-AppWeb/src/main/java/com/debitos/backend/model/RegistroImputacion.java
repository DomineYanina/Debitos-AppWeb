package com.debitos.backend.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "registro_imputacion")
public class RegistroImputacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String usuario;

    @Column(name = "fecha_hora", nullable = false)
    private ZonedDateTime fechaHora;

    @Column(name = "id_cabecera_origen", nullable = false)
    private Long idCabeceraOrigen;

    @Column(name = "id_cabecera_destino", nullable = false)
    private Long idCabeceraDestino;

    @Column(name = "tipo_imputacion", nullable = false, length = 100)
    private String tipoImputacion;

    @Column(name = "origen_cabecera", length = 20)
    private String origenCabecera;

    @Column(name = "comprobante_origen", length = 50)
    private String comprobanteOrigen;

    @Column(name = "comprobante_destino", length = 50)
    private String comprobanteDestino;

    public RegistroImputacion() {}

    public RegistroImputacion(String usuario, ZonedDateTime fechaHora, Long idCabeceraOrigen, Long idCabeceraDestino,
                              String tipoImputacion, String origenCabecera, String comprobanteOrigen, String comprobanteDestino) {
        this.usuario = usuario;
        this.fechaHora = fechaHora;
        this.idCabeceraOrigen = idCabeceraOrigen;
        this.idCabeceraDestino = idCabeceraDestino;
        this.tipoImputacion = tipoImputacion;
        this.origenCabecera = origenCabecera;
        this.comprobanteOrigen = comprobanteOrigen;
        this.comprobanteDestino = comprobanteDestino;
    }

    @PrePersist
    public void prePersist() {
        if (this.fechaHora == null) {
            this.fechaHora = ZonedDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public ZonedDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(ZonedDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public Long getIdCabeceraOrigen() {
        return idCabeceraOrigen;
    }

    public void setIdCabeceraOrigen(Long idCabeceraOrigen) {
        this.idCabeceraOrigen = idCabeceraOrigen;
    }

    public Long getIdCabeceraDestino() {
        return idCabeceraDestino;
    }

    public void setIdCabeceraDestino(Long idCabeceraDestino) {
        this.idCabeceraDestino = idCabeceraDestino;
    }

    public String getTipoImputacion() {
        return tipoImputacion;
    }

    public void setTipoImputacion(String tipoImputacion) {
        this.tipoImputacion = tipoImputacion;
    }

    public String getOrigenCabecera() {
        return origenCabecera;
    }

    public void setOrigenCabecera(String origenCabecera) {
        this.origenCabecera = origenCabecera;
    }

    public String getComprobanteOrigen() {
        return comprobanteOrigen;
    }

    public void setComprobanteOrigen(String comprobanteOrigen) {
        this.comprobanteOrigen = comprobanteOrigen;
    }

    public String getComprobanteDestino() {
        return comprobanteDestino;
    }

    public void setComprobanteDestino(String comprobanteDestino) {
        this.comprobanteDestino = comprobanteDestino;
    }
}
