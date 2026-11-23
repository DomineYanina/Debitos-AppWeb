package com.debitos.backend.dto.contable;

public class PrestacionConsideracionDTO {
    private String codigo;
    private String descripcion;
    private String estado;
    private String estadoAmbulatorio;
    private String estadoInternado;

    public PrestacionConsideracionDTO() {}

    public PrestacionConsideracionDTO(String codigo, String descripcion, String estado) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.estado = estado;
        this.estadoAmbulatorio = estado;
        this.estadoInternado = estado;
    }

    public PrestacionConsideracionDTO(String codigo, String descripcion, String estado, String estadoAmbulatorio, String estadoInternado) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.estado = estado;
        this.estadoAmbulatorio = estadoAmbulatorio;
        this.estadoInternado = estadoInternado;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
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
}
