package com.debitos.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "comprobantes_anulados")
public class ComprobanteAnulado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcabecera")
    private Cabecera cabecera;

    @Column(name = "cod_inst")
    private Integer codInst;

    @Column(name = "mes_prest")
    private LocalDate mesPrest;

    @Column(name = "total_general", precision = 15, scale = 2)
    private BigDecimal totalGeneral;

    @Column(name = "comprobante", length = 50)
    private String comprobante;

    public ComprobanteAnulado() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cabecera getCabecera() {
        return cabecera;
    }

    public void setCabecera(Cabecera cabecera) {
        this.cabecera = cabecera;
    }

    public Integer getCodInst() {
        return codInst;
    }

    public void setCodInst(Integer codInst) {
        this.codInst = codInst;
    }

    public LocalDate getMesPrest() {
        return mesPrest;
    }

    public void setMesPrest(LocalDate mesPrest) {
        this.mesPrest = mesPrest;
    }

    public BigDecimal getTotalGeneral() {
        return totalGeneral;
    }

    public void setTotalGeneral(BigDecimal totalGeneral) {
        this.totalGeneral = totalGeneral;
    }

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }
}
