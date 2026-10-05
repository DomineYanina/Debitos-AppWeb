package com.debitos.backend.dto;

/**
 * Proyección ligera de NotaDeCredito para el Tablero de Trazabilidad.
 */
public class NotaCreditoLigeraDTO {

    private Long idCabecera;
    private String usuario;
    private String motivoDebito;

    public NotaCreditoLigeraDTO() {}

    public NotaCreditoLigeraDTO(Long idCabecera, String usuario, String motivoDebito) {
        this.idCabecera = idCabecera;
        this.usuario = usuario;
        this.motivoDebito = motivoDebito;
    }

    public Long getIdCabecera() { return idCabecera; }
    public void setIdCabecera(Long idCabecera) { this.idCabecera = idCabecera; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public String getMotivoDebito() { return motivoDebito; }
    public void setMotivoDebito(String motivoDebito) { this.motivoDebito = motivoDebito; }
}
