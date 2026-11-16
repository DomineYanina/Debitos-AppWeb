package com.debitos.backend.dto.contable;

public class CorregirPeriodoRequest {
    private Long idCabecera;
    private String periodoCorregido; // Formato "DD/MM/YYYY" o "YYYY-MM-DD"

    public CorregirPeriodoRequest() {}

    public Long getIdCabecera() {
        return idCabecera;
    }

    public void setIdCabecera(Long idCabecera) {
        this.idCabecera = idCabecera;
    }

    public String getPeriodoCorregido() {
        return periodoCorregido;
    }

    public void setPeriodoCorregido(String periodoCorregido) {
        this.periodoCorregido = periodoCorregido;
    }
}
