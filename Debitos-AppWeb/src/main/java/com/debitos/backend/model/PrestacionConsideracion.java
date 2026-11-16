package com.debitos.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "prestaciones_consideracion")
public class PrestacionConsideracion {

    @Id
    @Column(length = 50)
    private String codigo;

    @Column(length = 255)
    private String descripcion;

    @Column(nullable = false, length = 20)
    private String estado; // 'Considerar' | 'No considerar'

    public PrestacionConsideracion() {
        this.estado = "Considerar";
    }

    public PrestacionConsideracion(String codigo, String descripcion, String estado) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.estado = (estado != null && !estado.isBlank()) ? estado : "Considerar";
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
}
