package com.debitos.backend.dto.contable;

public class CoberturaAliasDTO {
    private String codigoCobertura;
    private String nombreOriginal;
    private String nombreMostrar;

    public CoberturaAliasDTO() {}

    public CoberturaAliasDTO(String codigoCobertura, String nombreOriginal, String nombreMostrar) {
        this.codigoCobertura = codigoCobertura;
        this.nombreOriginal = nombreOriginal;
        this.nombreMostrar = nombreMostrar;
    }

    public String getCodigoCobertura() {
        return codigoCobertura;
    }

    public void setCodigoCobertura(String codigoCobertura) {
        this.codigoCobertura = codigoCobertura;
    }

    public String getNombreOriginal() {
        return nombreOriginal;
    }

    public void setNombreOriginal(String nombreOriginal) {
        this.nombreOriginal = nombreOriginal;
    }

    public String getNombreMostrar() {
        return nombreMostrar;
    }

    public void setNombreMostrar(String nombreMostrar) {
        this.nombreMostrar = nombreMostrar;
    }
}
