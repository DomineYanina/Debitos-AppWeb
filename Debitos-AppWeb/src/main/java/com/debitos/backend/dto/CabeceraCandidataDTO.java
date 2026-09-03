package com.debitos.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CabeceraCandidataDTO {
    private Long id;
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;
    private BigDecimal debe;
    private BigDecimal haber;
    private Long grupo;
    private Long asociadogrupo;
    private String cobertura;
    private String codigoCobertura;
    private String label;

    public CabeceraCandidataDTO() {}

    public CabeceraCandidataDTO(Long id, String tipo, String letra, Integer ptovta, Integer numero,
                                LocalDate fecha, BigDecimal debe, BigDecimal haber, Long grupo,
                                Long asociadogrupo, String cobertura, String codigoCobertura) {
        this.id = id;
        this.tipo = tipo;
        this.letra = letra;
        this.ptovta = ptovta;
        this.numero = numero;
        this.fecha = fecha;
        this.debe = debe;
        this.haber = haber;
        this.grupo = grupo;
        this.asociadogrupo = asociadogrupo;
        this.cobertura = cobertura;
        this.codigoCobertura = codigoCobertura;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }

    public Integer getPtovta() { return ptovta; }
    public void setPtovta(Integer ptovta) { this.ptovta = ptovta; }

    public Integer getNumero() { return numero; }
    public void setNumero(Integer numero) { this.numero = numero; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public BigDecimal getDebe() { return debe; }
    public void setDebe(BigDecimal debe) { this.debe = debe; }

    public BigDecimal getHaber() { return haber; }
    public void setHaber(BigDecimal haber) { this.haber = haber; }

    public Long getGrupo() { return grupo; }
    public void setGrupo(Long grupo) { this.grupo = grupo; }

    public Long getAsociadogrupo() { return asociadogrupo; }
    public void setAsociadogrupo(Long asociadogrupo) { this.asociadogrupo = asociadogrupo; }

    public String getCobertura() { return cobertura; }
    public void setCobertura(String cobertura) { this.cobertura = cobertura; }

    public String getCodigoCobertura() { return codigoCobertura; }
    public void setCodigoCobertura(String codigoCobertura) { this.codigoCobertura = codigoCobertura; }

    public String getLabel() {
        String base = String.format("%s %s-%04d-%08d",
                tipo != null ? tipo : "",
                letra != null ? letra : "",
                ptovta != null ? ptovta : 0,
                numero != null ? numero : 0);
        if (fecha != null) {
            base += " (" + fecha + ")";
        }
        return base;
    }
}
