package com.debitos.backend.dto;

import java.util.List;

public class NuevaNotaCreditoRequest {
    private String origen;
    private String letraOriginal;
    private Object ptovtaOriginal;
    private Object numeroOriginal;
    private String usuario;
    private DatosNotaDTO datosNota;
    private List<RegistroAuditoriaDTO> registros;

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getLetraOriginal() {
        return letraOriginal;
    }

    public void setLetraOriginal(String letraOriginal) {
        this.letraOriginal = letraOriginal;
    }

    public Object getPtovtaOriginal() {
        return ptovtaOriginal;
    }

    public void setPtovtaOriginal(Object ptovtaOriginal) {
        this.ptovtaOriginal = ptovtaOriginal;
    }

    public Object getNumeroOriginal() {
        return numeroOriginal;
    }

    public void setNumeroOriginal(Object numeroOriginal) {
        this.numeroOriginal = numeroOriginal;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public DatosNotaDTO getDatosNota() {
        return datosNota;
    }

    public void setDatosNota(DatosNotaDTO datosNota) {
        this.datosNota = datosNota;
    }

    public List<RegistroAuditoriaDTO> getRegistros() {
        return registros;
    }

    public void setRegistros(List<RegistroAuditoriaDTO> registros) {
        this.registros = registros;
    }
}
