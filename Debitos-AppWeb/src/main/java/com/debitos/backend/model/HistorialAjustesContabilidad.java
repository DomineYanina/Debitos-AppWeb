package com.debitos.backend.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "historial_ajustes_contabilidad")
public class HistorialAjustesContabilidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_tipo_operacion", nullable = false)
    private TipoOperacion tipoOperacion;

    @Column(nullable = false, length = 150)
    private String referencia;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_nuevo", columnDefinition = "TEXT")
    private String valorNuevo;

    @Column(nullable = false, length = 100)
    private String usuario;

    @Column(name = "fecha_hora", nullable = false)
    private ZonedDateTime fechaHora;

    public HistorialAjustesContabilidad() {
        this.fechaHora = ZonedDateTime.now();
    }

    public HistorialAjustesContabilidad(TipoOperacion tipoOperacion, String referencia, String valorAnterior, String valorNuevo, String usuario) {
        this.tipoOperacion = tipoOperacion;
        this.referencia = referencia;
        this.valorAnterior = valorAnterior;
        this.valorNuevo = valorNuevo;
        this.usuario = usuario;
        this.fechaHora = ZonedDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TipoOperacion getTipoOperacion() {
        return tipoOperacion;
    }

    public void setTipoOperacion(TipoOperacion tipoOperacion) {
        this.tipoOperacion = tipoOperacion;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getValorAnterior() {
        return valorAnterior;
    }

    public void setValorAnterior(String valorAnterior) {
        this.valorAnterior = valorAnterior;
    }

    public String getValorNuevo() {
        return valorNuevo;
    }

    public void setValorNuevo(String valorNuevo) {
        this.valorNuevo = valorNuevo;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public ZonedDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(ZonedDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }
}
