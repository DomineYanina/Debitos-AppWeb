package com.debitos.backend.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "amb_liquidado_manual")
public class AmbLiquidadoManual {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "id_amb_liquidado", nullable = false, unique = true)
    private Integer idAmbLiquidado;

    @Column(name = "usuario_creacion", nullable = false)
    private String usuarioCreacion;

    @Column(name = "fecha_creacion")
    private ZonedDateTime fechaCreacion;

    @Column(name = "observaciones")
    private String observaciones;

    public AmbLiquidadoManual() {}

    public AmbLiquidadoManual(Integer idAmbLiquidado, String usuarioCreacion, ZonedDateTime fechaCreacion, String observaciones) {
        this.idAmbLiquidado = idAmbLiquidado;
        this.usuarioCreacion = usuarioCreacion;
        this.fechaCreacion = fechaCreacion;
        this.observaciones = observaciones;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getIdAmbLiquidado() {
        return idAmbLiquidado;
    }

    public void setIdAmbLiquidado(Integer idAmbLiquidado) {
        this.idAmbLiquidado = idAmbLiquidado;
    }

    public String getUsuarioCreacion() {
        return usuarioCreacion;
    }

    public void setUsuarioCreacion(String usuarioCreacion) {
        this.usuarioCreacion = usuarioCreacion;
    }

    public ZonedDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(ZonedDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}

