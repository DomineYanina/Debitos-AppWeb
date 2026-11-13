package com.debitos.backend.dto;

import java.io.Serializable;

public class PrestacionCatalogoDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String codigo;
    private String descripcion;

    public PrestacionCatalogoDTO() {
    }

    public PrestacionCatalogoDTO(String codigo, String descripcion) {
        this.codigo = codigo;
        this.descripcion = descripcion;
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
}
