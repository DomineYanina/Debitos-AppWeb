package com.debitos.backend.dto.reportes;

import java.util.List;

/**
 * Encapsula un dataset completo para Chart.js.
 * - tituloDataset: nombre de la serie (aparece en la leyenda del grafico).
 * - puntos: lista de pares etiqueta/valor que forman el dataset.
 */
public class DatasetGraficoDTO {

    private String tituloDataset;
    private List<PuntoGraficoDTO> puntos;

    public DatasetGraficoDTO() {}

    public DatasetGraficoDTO(String tituloDataset, List<PuntoGraficoDTO> puntos) {
        this.tituloDataset = tituloDataset;
        this.puntos = puntos;
    }

    public String getTituloDataset() { return tituloDataset; }
    public void setTituloDataset(String tituloDataset) { this.tituloDataset = tituloDataset; }

    public List<PuntoGraficoDTO> getPuntos() { return puntos; }
    public void setPuntos(List<PuntoGraficoDTO> puntos) { this.puntos = puntos; }
}
