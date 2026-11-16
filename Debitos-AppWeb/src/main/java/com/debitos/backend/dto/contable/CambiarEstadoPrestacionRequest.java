package com.debitos.backend.dto.contable;

public class CambiarEstadoPrestacionRequest {
    private String codigo;
    private String estado; // "Considerar" | "No considerar"

    public CambiarEstadoPrestacionRequest() {}

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
}
