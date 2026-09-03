package com.debitos.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class FilaHistorialDTO {
    private String tipoDocumento;
    private String letra;
    private Integer puntoVenta;
    private Integer numero;
    private String fechaDocumento;
    private BigDecimal montoNeto;

    /** "REF" para documentos de refactura, "IVA" para ajuste de IVA, null para la FC raíz. */
    private String origenTipo;

    /** Nivel de profundidad en el árbol: 0=FC, 1=NC hija, 2=ND hija de NC. */
    private int nivel;

    /** Solo para filas de tipo IVA: porcentaje de IVA aplicado. */
    private BigDecimal porcentajeIva;

    /** Solo para filas de tipo IVA: monto de IVA. */
    private BigDecimal montoIva;

    /**
     * Indica que esta fila es un placeholder de ND de ajuste IVA pendiente de crear.
     * Cuando es true, el frontend debe mostrar "Crear Nota de Débito" en vez de "Ver prestaciones".
     */
    private boolean placeholderNdAjusteIva;

    /**
     * Indica si el documento tiene prestaciones asociadas en las tablas
     * (amb_liquidado para FC, notadecredito / nc_ajustedeiva para NC, notadedebito / nd_ajustedeiva para ND).
     * Si es false, la acción "Ver prestaciones" se muestra deshabilitada como "Sin prestaciones vinculadas".
     */
    @JsonProperty("tienePrestaciones")
    private boolean tienePrestaciones = true;

    public FilaHistorialDTO() {}

    public FilaHistorialDTO(String tipoDocumento, String letra, Integer puntoVenta, Integer numero,
                            String fechaDocumento, BigDecimal montoNeto) {
        this.tipoDocumento = tipoDocumento;
        this.letra = letra;
        this.puntoVenta = puntoVenta;
        this.numero = numero;
        this.fechaDocumento = fechaDocumento;
        this.montoNeto = montoNeto;
    }

    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }

    public Integer getPuntoVenta() { return puntoVenta; }
    public void setPuntoVenta(Integer puntoVenta) { this.puntoVenta = puntoVenta; }

    public Integer getNumero() { return numero; }
    public void setNumero(Integer numero) { this.numero = numero; }

    public String getFechaDocumento() { return fechaDocumento; }
    public void setFechaDocumento(String fechaDocumento) { this.fechaDocumento = fechaDocumento; }

    public BigDecimal getMontoNeto() { return montoNeto; }
    public void setMontoNeto(BigDecimal montoNeto) { this.montoNeto = montoNeto; }

    public String getOrigenTipo() { return origenTipo; }
    public void setOrigenTipo(String origenTipo) { this.origenTipo = origenTipo; }

    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }

    public BigDecimal getPorcentajeIva() { return porcentajeIva; }
    public void setPorcentajeIva(BigDecimal porcentajeIva) { this.porcentajeIva = porcentajeIva; }

    public BigDecimal getMontoIva() { return montoIva; }
    public void setMontoIva(BigDecimal montoIva) { this.montoIva = montoIva; }

    public boolean isPlaceholderNdAjusteIva() { return placeholderNdAjusteIva; }
    public void setPlaceholderNdAjusteIva(boolean placeholderNdAjusteIva) { this.placeholderNdAjusteIva = placeholderNdAjusteIva; }

    public boolean isTienePrestaciones() { return tienePrestaciones; }
    public boolean getTienePrestaciones() { return tienePrestaciones; }
    public void setTienePrestaciones(boolean tienePrestaciones) { this.tienePrestaciones = tienePrestaciones; }
}
