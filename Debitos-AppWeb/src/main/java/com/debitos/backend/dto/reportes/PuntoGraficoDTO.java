package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;

/**
 * Representa un unico punto de dato para un grafico Chart.js.
 * - etiqueta: texto del eje X, nombre de la porcion (torta) o categoria (barra).
 * - valor: monto o cantidad numerica asociada a la etiqueta.
 */
public class PuntoGraficoDTO {

    private String etiqueta;
    private BigDecimal valor;

    public PuntoGraficoDTO() {}

    public PuntoGraficoDTO(String etiqueta, BigDecimal valor) {
        this.etiqueta = etiqueta;
        this.valor = valor;
    }

    public String getEtiqueta() { return etiqueta; }
    public void setEtiqueta(String etiqueta) { this.etiqueta = etiqueta; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
}
