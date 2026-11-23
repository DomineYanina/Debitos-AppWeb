package com.debitos.backend.dto.contable;

public class CambiarEstadoPrestacionRequest {
    private String codigo;
    private String estado; // "Considerar" | "No considerar" (legacy)
    private String estadoAmbulatorio; // "Considerar" | "No considerar"
    private String estadoInternado; // "Considerar" | "No considerar"
    private String motivo;

    public CambiarEstadoPrestacionRequest() {}

    public CambiarEstadoPrestacionRequest(String codigo, String estado) {
        this.codigo = codigo;
        this.estado = estado;
        this.estadoAmbulatorio = estado;
        this.estadoInternado = estado;
    }

    public CambiarEstadoPrestacionRequest(String codigo, String estadoAmbulatorio, String estadoInternado) {
        this.codigo = codigo;
        this.estadoAmbulatorio = estadoAmbulatorio;
        this.estadoInternado = estadoInternado;
        this.estado = estadoAmbulatorio;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getEstadoAmbulatorio() {
        return estadoAmbulatorio;
    }

    public void setEstadoAmbulatorio(String estadoAmbulatorio) {
        this.estadoAmbulatorio = estadoAmbulatorio;
    }

    public String getEstadoInternado() {
        return estadoInternado;
    }

    public void setEstadoInternado(String estadoInternado) {
        this.estadoInternado = estadoInternado;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
