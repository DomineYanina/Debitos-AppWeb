package com.debitos.backend.dto.reportes;

import java.util.ArrayList;
import java.util.List;

/**
 * Contenedor unificado para el reporte de desempeño operativo (3 Niveles):
 * Consolida las métricas de Analistas de Débito, Médicos/Prestadores y Operadores de Carga
 * calculadas a partir de una única evaluación de la trazabilidad.
 */
public class DesempenoGlobalDTO {

    private List<MetricaAnalistaDTO> analistas = new ArrayList<>();
    private List<MetricaMedicoDTO> medicos = new ArrayList<>();
    private List<MetricaOperadorDTO> operadores = new ArrayList<>();

    public DesempenoGlobalDTO() {}

    public DesempenoGlobalDTO(List<MetricaAnalistaDTO> analistas,
                              List<MetricaMedicoDTO> medicos,
                              List<MetricaOperadorDTO> operadores) {
        this.analistas = analistas != null ? analistas : new ArrayList<>();
        this.medicos = medicos != null ? medicos : new ArrayList<>();
        this.operadores = operadores != null ? operadores : new ArrayList<>();
    }

    public List<MetricaAnalistaDTO> getAnalistas() {
        return analistas;
    }

    public void setAnalistas(List<MetricaAnalistaDTO> analistas) {
        this.analistas = analistas != null ? analistas : new ArrayList<>();
    }

    public List<MetricaMedicoDTO> getMedicos() {
        return medicos;
    }

    public void setMedicos(List<MetricaMedicoDTO> medicos) {
        this.medicos = medicos != null ? medicos : new ArrayList<>();
    }

    public List<MetricaOperadorDTO> getOperadores() {
        return operadores;
    }

    public void setOperadores(List<MetricaOperadorDTO> operadores) {
        this.operadores = operadores != null ? operadores : new ArrayList<>();
    }
}
