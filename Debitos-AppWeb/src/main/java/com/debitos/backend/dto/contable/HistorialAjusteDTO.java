package com.debitos.backend.dto.contable;

import java.time.ZonedDateTime;

public class HistorialAjusteDTO {
    private Long id;
    private String tipoOperacionCodigo;
    private String tipoOperacionDescripcion;
    private String referencia;
    private String valorAnterior;
    private String valorNuevo;
    private String usuario;
    private ZonedDateTime fechaHora;

    public HistorialAjusteDTO() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipoOperacionCodigo() {
        return tipoOperacionCodigo;
    }

    public void setTipoOperacionCodigo(String tipoOperacionCodigo) {
        this.tipoOperacionCodigo = tipoOperacionCodigo;
    }

    public String getTipoOperacionDescripcion() {
        return tipoOperacionDescripcion;
    }

    public void setTipoOperacionDescripcion(String tipoOperacionDescripcion) {
        this.tipoOperacionDescripcion = tipoOperacionDescripcion;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getValorAnterior() {
        return valorAnterior;
    }

    public void setValorAnterior(String valorAnterior) {
        this.valorAnterior = valorAnterior;
    }

    public String getValorNuevo() {
        return valorNuevo;
    }

    public void setValorNuevo(String valorNuevo) {
        this.valorNuevo = valorNuevo;
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
}
