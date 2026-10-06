package com.debitos.backend.dto;

/**
 * Proyección ligera de NotaDeDebito para el Tablero de Trazabilidad.
 */
public class NotaDebitoLigeraDTO {

    private Long idCabecera;
    private String usuario;

    public NotaDebitoLigeraDTO() {}

    public NotaDebitoLigeraDTO(Long idCabecera, String usuario) {
        this.idCabecera = idCabecera;
        this.usuario = usuario;
    }

    public Long getIdCabecera() { return idCabecera; }
    public void setIdCabecera(Long idCabecera) { this.idCabecera = idCabecera; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
}
