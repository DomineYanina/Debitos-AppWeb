package com.debitos.backend.dto;

/**
 * Proyección ligera de AmbLiquidado para el Tablero de Trazabilidad.
 * Evita cargar la entidad completa con decenas de columnas no utilizadas.
 */
public class PrestacionLigeraDTO {

    private Long idCabecera;
    private String medico;
    private String descripcion;
    private String operador;

    public PrestacionLigeraDTO() {}

    public PrestacionLigeraDTO(Long idCabecera, String medico, String descripcion, String operador) {
        this.idCabecera = idCabecera;
        this.medico = medico;
        this.descripcion = descripcion;
        this.operador = operador;
    }

    public Long getIdCabecera() { return idCabecera; }
    public void setIdCabecera(Long idCabecera) { this.idCabecera = idCabecera; }

    public String getMedico() { return medico; }
    public void setMedico(String medico) { this.medico = medico; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getOperador() { return operador; }
    public void setOperador(String operador) { this.operador = operador; }
}
