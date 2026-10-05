package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Representa una prestación médica individual dentro de una factura origen que presenta
 * un ciclo de insistencia (débito y refacturación recurrente, >= 2 refacturaciones ND y >= 1 débito NC).
 * Contiene la cronología de eventos con los montos específicos debitados y refacturados de esa prestación.
 */
public class BuclePrestacionDTO {

    private Integer id;
    private String codigo;
    private String descripcion;
    private String paciente;
    private String carnet;
    private String medico;
    private BigDecimal montoFacturadoOriginal = BigDecimal.ZERO;
    private BigDecimal totalDebitado = BigDecimal.ZERO;
    private int cantidadDebitos = 0;
    private int cantidadRefacturaciones = 0;
    private BigDecimal totalRefacturado = BigDecimal.ZERO;
    private List<EventoTrazabilidadDTO> historialEventos = new ArrayList<>();

    public BuclePrestacionDTO() {}

    public BuclePrestacionDTO(Integer id, String codigo, String descripcion, String paciente,
                              String carnet, String medico, BigDecimal montoFacturadoOriginal,
                              BigDecimal totalDebitado, int cantidadDebitos,
                              List<EventoTrazabilidadDTO> historialEventos) {
        this.id = id;
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.paciente = paciente;
        this.carnet = carnet;
        this.medico = medico;
        this.montoFacturadoOriginal = montoFacturadoOriginal != null ? montoFacturadoOriginal : BigDecimal.ZERO;
        this.totalDebitado = totalDebitado != null ? totalDebitado : BigDecimal.ZERO;
        this.cantidadDebitos = cantidadDebitos;
        this.historialEventos = historialEventos != null ? historialEventos : new ArrayList<>();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getPaciente() {
        return paciente;
    }

    public void setPaciente(String paciente) {
        this.paciente = paciente;
    }

    public String getCarnet() {
        return carnet;
    }

    public void setCarnet(String carnet) {
        this.carnet = carnet;
    }

    public String getMedico() {
        return medico;
    }

    public void setMedico(String medico) {
        this.medico = medico;
    }

    public BigDecimal getMontoFacturadoOriginal() {
        return montoFacturadoOriginal;
    }

    public void setMontoFacturadoOriginal(BigDecimal montoFacturadoOriginal) {
        this.montoFacturadoOriginal = montoFacturadoOriginal != null ? montoFacturadoOriginal : BigDecimal.ZERO;
    }

    public BigDecimal getTotalDebitado() {
        return totalDebitado;
    }

    public void setTotalDebitado(BigDecimal totalDebitado) {
        this.totalDebitado = totalDebitado != null ? totalDebitado : BigDecimal.ZERO;
    }

    public int getCantidadDebitos() {
        return cantidadDebitos;
    }

    public void setCantidadDebitos(int cantidadDebitos) {
        this.cantidadDebitos = cantidadDebitos;
    }

    public int getCantidadRefacturaciones() {
        return cantidadRefacturaciones;
    }

    public void setCantidadRefacturaciones(int cantidadRefacturaciones) {
        this.cantidadRefacturaciones = cantidadRefacturaciones;
    }

    public BigDecimal getTotalRefacturado() {
        return totalRefacturado;
    }

    public void setTotalRefacturado(BigDecimal totalRefacturado) {
        this.totalRefacturado = totalRefacturado != null ? totalRefacturado : BigDecimal.ZERO;
    }

    public List<EventoTrazabilidadDTO> getHistorialEventos() {
        return historialEventos;
    }

    public void setHistorialEventos(List<EventoTrazabilidadDTO> historialEventos) {
        this.historialEventos = historialEventos != null ? historialEventos : new ArrayList<>();
    }
}
