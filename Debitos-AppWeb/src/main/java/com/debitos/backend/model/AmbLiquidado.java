package com.debitos.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "amb_liquidado")
public class AmbLiquidado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcabecera")
    @NotFound(action = NotFoundAction.IGNORE)
    private Cabecera cabecera;

    private String carnet;
    private String paciente;
    private String plan;
    private String efector;
    private String medico;
    private LocalDate fecha;
    private String codigo;
    private String descripcion;
    private String modulo;
    private String grupomodulo;
    private Integer cantidad;

    @Column(name = "total_neto")
    private BigDecimal totalNeto;

    @Column(name = "iva")
    private BigDecimal iva;

    private BigDecimal coseguro;
    private BigDecimal total;

    @Column(name = "operador")
    private String operador;

    @Column(name = "ope_recepcion")
    private String opeRecepcion;

    @Column(name = "vo")
    private String vo;

    @Column(name = "especialidad")
    private String especialidad;

    @Column(name = "serv_espe")
    private String servEspe;

    @Column(name = "derivador")
    private String derivador;

    @Column(name = "grupo")
    private String grupo;

    @Column(name = "centrocosto")
    private String centrocosto;

    @Column(name = "fecha_egreso")
    private LocalDate fechaEgreso;

    @Column(name = "tipo_internacion")
    private String tipoInternacion;

    @Column(name = "prog_urg")
    private String progUrg;

    @Column(name = "patologia")
    private String patologia;

    @Column(name = "medico_responsable_matricula")
    private Long medicoResponsableMatricula;

    @Column(name = "diagnostico_i")
    private String diagnosticoI;

    @Column(name = "operador_liquida")
    private String operadorLiquida;

    public AmbLiquidado() {}

    public AmbLiquidado(String operador, String opeRecepcion, String vo, String especialidad, String servEspe,
                        String derivador, String grupo, String centrocosto, LocalDate fechaEgreso,
                        String tipoInternacion, String progUrg, String patologia, Long medicoResponsableMatricula,
                        String diagnosticoI, String operadorLiquida) {
        this.operador = operador;
        this.opeRecepcion = opeRecepcion;
        this.vo = vo;
        this.especialidad = especialidad;
        this.servEspe = servEspe;
        this.derivador = derivador;
        this.grupo = grupo;
        this.centrocosto = centrocosto;
        this.fechaEgreso = fechaEgreso;
        this.tipoInternacion = tipoInternacion;
        this.progUrg = progUrg;
        this.patologia = patologia;
        this.medicoResponsableMatricula = medicoResponsableMatricula;
        this.diagnosticoI = diagnosticoI;
        this.operadorLiquida = operadorLiquida;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Cabecera getCabecera() {
        return cabecera;
    }

    public void setCabecera(Cabecera cabecera) {
        this.cabecera = cabecera;
    }

    public String getCarnet() {
        return carnet;
    }

    public void setCarnet(String carnet) {
        this.carnet = carnet;
    }

    public String getPaciente() {
        return paciente;
    }

    public void setPaciente(String paciente) {
        this.paciente = paciente;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getEfector() {
        return efector;
    }

    public void setEfector(String efector) {
        this.efector = efector;
    }

    public String getMedico() {
        return medico;
    }

    public void setMedico(String medico) {
        this.medico = medico;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
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

    public String getModulo() {
        return modulo;
    }

    public void setModulo(String modulo) {
        this.modulo = modulo;
    }

    public String getGrupomodulo() {
        return grupomodulo;
    }

    public void setGrupomodulo(String grupomodulo) {
        this.grupomodulo = grupomodulo;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getTotalNeto() {
        return totalNeto;
    }

    public void setTotalNeto(BigDecimal totalNeto) {
        this.totalNeto = totalNeto;
    }

    public BigDecimal getIva() {
        return iva;
    }

    public void setIva(BigDecimal iva) {
        this.iva = iva;
    }

    public BigDecimal getCoseguro() {
        return coseguro;
    }

    public void setCoseguro(BigDecimal coseguro) {
        this.coseguro = coseguro;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getOperador() {
        return operador;
    }

    public void setOperador(String operador) {
        this.operador = operador;
    }

    public String getOpeRecepcion() {
        return opeRecepcion;
    }

    public void setOpeRecepcion(String opeRecepcion) {
        this.opeRecepcion = opeRecepcion;
    }

    public String getVo() {
        return vo;
    }

    public void setVo(String vo) {
        this.vo = vo;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public void setEspecialidad(String especialidad) {
        this.especialidad = especialidad;
    }

    public String getServEspe() {
        return servEspe;
    }

    public void setServEspe(String servEspe) {
        this.servEspe = servEspe;
    }

    public String getDerivador() {
        return derivador;
    }

    public void setDerivador(String derivador) {
        this.derivador = derivador;
    }

    public String getGrupo() {
        return grupo;
    }

    public void setGrupo(String grupo) {
        this.grupo = grupo;
    }

    public String getCentrocosto() {
        return centrocosto;
    }

    public void setCentrocosto(String centrocosto) {
        this.centrocosto = centrocosto;
    }

    public LocalDate getFechaEgreso() {
        return fechaEgreso;
    }

    public void setFechaEgreso(LocalDate fechaEgreso) {
        this.fechaEgreso = fechaEgreso;
    }

    public String getTipoInternacion() {
        return tipoInternacion;
    }

    public void setTipoInternacion(String tipoInternacion) {
        this.tipoInternacion = tipoInternacion;
    }

    public String getProgUrg() {
        return progUrg;
    }

    public void setProgUrg(String progUrg) {
        this.progUrg = progUrg;
    }

    public String getPatologia() {
        return patologia;
    }

    public void setPatologia(String patologia) {
        this.patologia = patologia;
    }

    public Long getMedicoResponsableMatricula() {
        return medicoResponsableMatricula;
    }

    public void setMedicoResponsableMatricula(Long medicoResponsableMatricula) {
        this.medicoResponsableMatricula = medicoResponsableMatricula;
    }

    public String getDiagnosticoI() {
        return diagnosticoI;
    }

    public void setDiagnosticoI(String diagnosticoI) {
        this.diagnosticoI = diagnosticoI;
    }

    public String getOperadorLiquida() {
        return operadorLiquida;
    }

    public void setOperadorLiquida(String operadorLiquida) {
        this.operadorLiquida = operadorLiquida;
    }
}