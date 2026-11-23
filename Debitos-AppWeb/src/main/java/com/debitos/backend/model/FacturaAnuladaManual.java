package com.debitos.backend.model;

import jakarta.persistence.*;
import org.springframework.data.domain.Persistable;
import java.time.LocalDateTime;

@Entity
@Table(name = "facturas_anuladas_manual")
public class FacturaAnuladaManual implements Persistable<Long> {

    @Id
    @Column(name = "id_cabecera")
    private Long idCabecera;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_cabecera")
    private Cabecera cabecera;

    @Transient
    private boolean isNewEntity = false;

    @Override
    public Long getId() {
        return getIdCabecera();
    }

    @Override
    public boolean isNew() {
        return isNewEntity;
    }

    public void setNewEntity(boolean isNewEntity) {
        this.isNewEntity = isNewEntity;
    }

    @Column(nullable = false)
    private Boolean anulada;

    @Column(name = "id_cabecera_anulador")
    private Long idCabeceraAnulador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cabecera_anulador", insertable = false, updatable = false)
    private Cabecera cabeceraAnulador;

    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;

    @Column(name = "usuario", length = 100)
    private String usuario;

    public FacturaAnuladaManual() {
        this.anulada = true;
        this.fechaAnulacion = LocalDateTime.now();
    }

    public FacturaAnuladaManual(Cabecera cabecera, Boolean anulada) {
        this.cabecera = cabecera;
        if (cabecera != null) {
            this.idCabecera = cabecera.getId();
        }
        this.anulada = anulada != null ? anulada : true;
        this.fechaAnulacion = LocalDateTime.now();
    }

    public Long getIdCabecera() {
        if (idCabecera != null) {
            return idCabecera;
        }
        return cabecera != null ? cabecera.getId() : null;
    }

    public void setIdCabecera(Long idCabecera) {
        this.idCabecera = idCabecera;
    }

    public Cabecera getCabecera() {
        return cabecera;
    }

    public void setCabecera(Cabecera cabecera) {
        this.cabecera = cabecera;
        if (cabecera != null && this.idCabecera == null) {
            this.idCabecera = cabecera.getId();
        }
    }

    public Boolean getAnulada() {
        return anulada;
    }

    public void setAnulada(Boolean anulada) {
        this.anulada = anulada;
    }

    public Long getIdCabeceraAnulador() {
        return idCabeceraAnulador;
    }

    public void setIdCabeceraAnulador(Long idCabeceraAnulador) {
        this.idCabeceraAnulador = idCabeceraAnulador;
    }

    public Cabecera getCabeceraAnulador() {
        return cabeceraAnulador;
    }

    public void setCabeceraAnulador(Cabecera cabeceraAnulador) {
        this.cabeceraAnulador = cabeceraAnulador;
        if (cabeceraAnulador != null) {
            this.idCabeceraAnulador = cabeceraAnulador.getId();
        }
    }

    public String getComprobanteAnulador() {
        if (cabeceraAnulador != null) {
            if (cabeceraAnulador.getComprobante() != null && !cabeceraAnulador.getComprobante().isBlank()) {
                return cabeceraAnulador.getComprobante();
            }
            return String.format("%s %s%04d-%08d",
                    cabeceraAnulador.getTipo(),
                    cabeceraAnulador.getLetra(),
                    cabeceraAnulador.getPtovta() != null ? cabeceraAnulador.getPtovta() : 0,
                    cabeceraAnulador.getNumero() != null ? cabeceraAnulador.getNumero() : 0);
        }
        return null;
    }

    public void setComprobanteAnulador(String comprobanteAnulador) {
        // Redundancia eliminada: el comprobante se obtiene de cabeceraAnulador
    }

    public LocalDateTime getFechaAnulacion() {
        return fechaAnulacion;
    }

    public void setFechaAnulacion(LocalDateTime fechaAnulacion) {
        this.fechaAnulacion = fechaAnulacion;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }
}
