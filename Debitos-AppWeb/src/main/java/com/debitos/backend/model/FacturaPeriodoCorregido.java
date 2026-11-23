package com.debitos.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "facturas_periodos_corregidos")
public class FacturaPeriodoCorregido {

    @Id
    @Column(name = "id_cabecera")
    private Long idCabecera;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_cabecera")
    private Cabecera cabecera;

    @Column(name = "periodo_original")
    private LocalDate periodoOriginal;

    @Column(name = "periodo_corregido", nullable = false)
    private LocalDate periodoCorregido;

    public FacturaPeriodoCorregido() {}

    public FacturaPeriodoCorregido(Cabecera cabecera, LocalDate periodoOriginal, LocalDate periodoCorregido) {
        this.cabecera = cabecera;
        this.periodoOriginal = periodoOriginal;
        this.periodoCorregido = periodoCorregido;
    }

    public Long getIdCabecera() {
        return idCabecera;
    }

    public void setIdCabecera(Long idCabecera) {
        this.idCabecera = idCabecera;
    }

    public Cabecera getCabecera() {
        return cabecera;
    }

    public void setCabecera(Cabecera cabecera) {
        this.cabecera = cabecera;
    }

    public LocalDate getPeriodoOriginal() {
        return periodoOriginal;
    }

    public void setPeriodoOriginal(LocalDate periodoOriginal) {
        this.periodoOriginal = periodoOriginal;
    }

    public LocalDate getPeriodoCorregido() {
        return periodoCorregido;
    }

    public void setPeriodoCorregido(LocalDate periodoCorregido) {
        this.periodoCorregido = periodoCorregido;
    }
}
