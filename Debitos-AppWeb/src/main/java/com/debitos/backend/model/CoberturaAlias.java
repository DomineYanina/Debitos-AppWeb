package com.debitos.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "coberturas_alias")
public class CoberturaAlias {

    @Id
    @Column(name = "codigo_cobertura", length = 50)
    private String codigoCobertura;

    @Column(name = "nombre_original", length = 255)
    private String nombreOriginal;

    @Column(name = "nombre_mostrar", nullable = false, length = 255)
    private String nombreMostrar;

    public CoberturaAlias() {}

    public CoberturaAlias(String codigoCobertura, String nombreOriginal, String nombreMostrar) {
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
