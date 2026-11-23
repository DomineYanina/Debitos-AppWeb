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
    private String estado; // 'Considerar' | 'No considerar' (legacy)

    @Column(name = "estado_ambulatorio", nullable = false, length = 20)
    private String estadoAmbulatorio; // 'Considerar' | 'No considerar'

    @Column(name = "estado_internado", nullable = false, length = 20)
    private String estadoInternado; // 'Considerar' | 'No considerar'

    public PrestacionConsideracion() {
        this.estado = "Considerar";
        this.estadoAmbulatorio = "Considerar";
        this.estadoInternado = "Considerar";
    }

    public PrestacionConsideracion(String codigo, String descripcion, String estado) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        String val = (estado != null && !estado.isBlank()) ? estado : "Considerar";
        this.estado = val;
        this.estadoAmbulatorio = val;
        this.estadoInternado = val;
    }

    public PrestacionConsideracion(String codigo, String descripcion, String estadoAmbulatorio, String estadoInternado) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.estadoAmbulatorio = (estadoAmbulatorio != null && !estadoAmbulatorio.isBlank()) ? estadoAmbulatorio : "Considerar";
        this.estadoInternado = (estadoInternado != null && !estadoInternado.isBlank()) ? estadoInternado : "Considerar";
        this.estado = ("No considerar".equalsIgnoreCase(this.estadoAmbulatorio) && "No considerar".equalsIgnoreCase(this.estadoInternado))
                ? "No considerar" : this.estadoAmbulatorio;
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
