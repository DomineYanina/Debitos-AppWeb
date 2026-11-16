package com.debitos.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "facturas_anuladas_manual")
public class FacturaAnuladaManual {

    @Id
    @Column(name = "id_cabecera")
    private Long idCabecera;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_cabecera")
    private Cabecera cabecera;

    @Column(nullable = false)
    private Boolean anulada;

    public FacturaAnuladaManual() {
        this.anulada = true;
    }

    public FacturaAnuladaManual(Cabecera cabecera, Boolean anulada) {
        this.cabecera = cabecera;
        this.idCabecera = cabecera != null ? cabecera.getId() : null;
        this.anulada = anulada != null ? anulada : true;
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
        if (cabecera != null) {
            this.idCabecera = cabecera.getId();
        }
    }

    public Boolean getAnulada() {
        return anulada;
    }

    public void setAnulada(Boolean anulada) {
        this.anulada = anulada;
    }
}
