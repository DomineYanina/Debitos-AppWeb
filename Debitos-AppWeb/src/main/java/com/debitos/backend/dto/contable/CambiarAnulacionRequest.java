package com.debitos.backend.dto.contable;

public class CambiarAnulacionRequest {
    private Long idCabecera;
    private Boolean anulada; // true = anular en Débitos, false = reactivar
    private Long idCabeceraAnulador;
    private String comprobanteAnulador;

    public CambiarAnulacionRequest() {}

    public Long getIdCabecera() {
        return idCabecera;
    }

    public void setIdCabecera(Long idCabecera) {
        this.idCabecera = idCabecera;
    }

    public Boolean getAnulada() {
        return anulada;
    }

    public void setAnulada(Boolean anulada) {
        this.anulada = anulada;
    }

    public Long getIdCabeceraAnulador() {
        return idCabeceraAnulador;
    }

    public void setIdCabeceraAnulador(Long idCabeceraAnulador) {
        this.idCabeceraAnulador = idCabeceraAnulador;
    }

    public String getComprobanteAnulador() {
        return comprobanteAnulador;
    }

    public void setComprobanteAnulador(String comprobanteAnulador) {
        this.comprobanteAnulador = comprobanteAnulador;
    }
}
