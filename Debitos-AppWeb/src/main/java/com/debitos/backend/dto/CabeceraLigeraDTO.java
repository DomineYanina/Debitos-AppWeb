package com.debitos.backend.dto;

import com.debitos.backend.model.CabeceraBase;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO liviano que proyecta exclusivamente las columnas necesarias de Cabecera
 * para armar el Tablero de Control, Cuenta Corriente y Trazabilidad.
 * Evita la hidratación de entidades JPA administradas en el Persistence Context.
 */
public class CabeceraLigeraDTO implements CabeceraBase {

    private Long id;
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;
    private LocalDate periodo;
    private String tiporegistro;
    private String codigoCobertura;
    private String cobertura;
    private String origen;
    private Long grupo;
    private Long asociado;
    private Long asociadogrupo;
    private BigDecimal debe;
    private BigDecimal haber;
    private Integer idEstado;
    private String comprobante;

    public CabeceraLigeraDTO() {}

    public CabeceraLigeraDTO(Long id, String tipo, String letra, Integer ptovta, Integer numero,
                             LocalDate fecha, LocalDate periodo, String tiporegistro,
                             String codigoCobertura, String cobertura, String origen,
                             Long grupo, Long asociado, Long asociadogrupo,
                             BigDecimal debe, BigDecimal haber, Integer idEstado, String comprobante) {
        this.id = id;
        this.tipo = tipo;
        this.letra = letra;
        this.ptovta = ptovta;
        this.numero = numero;
        this.fecha = fecha;
        this.periodo = (periodo == null && fecha != null && esRecibo(tipo)) ? fecha.withDayOfMonth(1) : periodo;
        this.tiporegistro = tiporegistro;
        this.codigoCobertura = codigoCobertura;
        this.cobertura = cobertura;
        this.origen = origen != null ? origen : "APP";
        this.grupo = grupo;
        this.asociado = asociado;
        this.asociadogrupo = asociadogrupo;
        this.debe = debe;
        this.haber = haber;
        this.idEstado = idEstado != null ? idEstado : 1;
        this.comprobante = (comprobante != null && !comprobante.trim().isEmpty())
                ? comprobante
                : calcularComprobante(tipo, letra, ptovta, numero);
    }

    private static boolean esRecibo(String tipo) {
        if (tipo == null) return false;
        String t = tipo.trim().toUpperCase();
        return "RC".equals(t) || "RCA".equals(t) || "RCB".equals(t) || "REC".equals(t) || "OP".equals(t);
    }

    private static String calcularComprobante(String tipo, String letra, Integer ptovta, Integer numero) {
        if ("RC".equalsIgnoreCase(tipo != null ? tipo.trim() : "")) {
            return numero != null ? String.valueOf(numero) : null;
        }
        if (tipo == null || letra == null || ptovta == null || numero == null) {
            return null;
        }
        return String.format("%s %s%04d-%08d",
                tipo.trim().toUpperCase(),
                letra.trim().toUpperCase(),
                ptovta,
                numero);
    }

    @Override public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @Override public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    @Override public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }

    @Override public Integer getPtovta() { return ptovta; }
    public void setPtovta(Integer ptovta) { this.ptovta = ptovta; }

    @Override public Integer getNumero() { return numero; }
    public void setNumero(Integer numero) { this.numero = numero; }

    @Override public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    @Override
    public LocalDate getPeriodo() {
        if (this.periodo == null && this.fecha != null && esRecibo(this.tipo)) {
            return this.fecha.withDayOfMonth(1);
        }
        return periodo;
    }
    public void setPeriodo(LocalDate periodo) { this.periodo = periodo; }

    @Override public String getTiporegistro() { return tiporegistro; }
    public void setTiporegistro(String tiporegistro) { this.tiporegistro = tiporegistro; }

    @Override public String getCodigoCobertura() { return codigoCobertura; }
    public void setCodigoCobertura(String codigoCobertura) { this.codigoCobertura = codigoCobertura; }

    @Override public String getCobertura() { return cobertura; }
    public void setCobertura(String cobertura) { this.cobertura = cobertura; }

    @Override public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    @Override public Long getGrupo() { return grupo; }
    public void setGrupo(Long grupo) { this.grupo = grupo; }

    @Override public Long getAsociado() { return asociado; }
    public void setAsociado(Long asociado) { this.asociado = asociado; }

    @Override public Long getAsociadogrupo() { return asociadogrupo; }
    public void setAsociadogrupo(Long asociadogrupo) { this.asociadogrupo = asociadogrupo; }

    @Override public BigDecimal getDebe() { return debe; }
    public void setDebe(BigDecimal debe) { this.debe = debe; }

    @Override public BigDecimal getHaber() { return haber; }
    public void setHaber(BigDecimal haber) { this.haber = haber; }

    @Override public Integer getIdEstado() { return idEstado; }
    public void setIdEstado(Integer idEstado) { this.idEstado = idEstado; }

    @Override
    public String getComprobante() {
        if (comprobante != null && !comprobante.trim().isEmpty()) {
            return comprobante;
        }
        return calcularComprobante(tipo, letra, ptovta, numero);
    }
    public void setComprobante(String comprobante) { this.comprobante = comprobante; }
}
