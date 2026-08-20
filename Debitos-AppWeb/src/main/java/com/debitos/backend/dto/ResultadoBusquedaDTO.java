package com.debitos.backend.dto;

import java.util.List;

public class ResultadoBusquedaDTO {
    private String tipoVista; // "ESTANDAR" o "TABLA_AJUSTE_IVA"
    private List<PrestacionAuditoriaDTO> prestaciones;
    private List<FilaAjusteIvaResumenDTO> resumenAjusteIva;
    private List<DocumentoAsociadoDTO> documentosCreadosInfo;
    private DocumentoAsociadoDTO documentoCreadoInfo;
    private List<FilaHistorialDTO> historialComprobantes;

    public ResultadoBusquedaDTO() {}

    public ResultadoBusquedaDTO(String tipoVista, List<PrestacionAuditoriaDTO> prestaciones, List<FilaAjusteIvaResumenDTO> resumenAjusteIva) {
        this.tipoVista = tipoVista;
        this.prestaciones = prestaciones;
        this.resumenAjusteIva = resumenAjusteIva;
    }

    public ResultadoBusquedaDTO(String tipoVista, List<PrestacionAuditoriaDTO> prestaciones, List<FilaAjusteIvaResumenDTO> resumenAjusteIva,
                                List<DocumentoAsociadoDTO> documentosCreadosInfo, DocumentoAsociadoDTO documentoCreadoInfo,
                                List<FilaHistorialDTO> historialComprobantes) {
        this.tipoVista = tipoVista;
        this.prestaciones = prestaciones;
        this.resumenAjusteIva = resumenAjusteIva;
        this.documentosCreadosInfo = documentosCreadosInfo;
        this.documentoCreadoInfo = documentoCreadoInfo;
        this.historialComprobantes = historialComprobantes;
    }

    public String getTipoVista() { return tipoVista; }
    public void setTipoVista(String tipoVista) { this.tipoVista = tipoVista; }

    public List<PrestacionAuditoriaDTO> getPrestaciones() { return prestaciones; }
    public void setPrestaciones(List<PrestacionAuditoriaDTO> prestaciones) { this.prestaciones = prestaciones; }

    public List<FilaAjusteIvaResumenDTO> getResumenAjusteIva() { return resumenAjusteIva; }
    public void setResumenAjusteIva(List<FilaAjusteIvaResumenDTO> resumenAjusteIva) { this.resumenAjusteIva = resumenAjusteIva; }

    public List<DocumentoAsociadoDTO> getDocumentosCreadosInfo() { return documentosCreadosInfo; }
    public void setDocumentosCreadosInfo(List<DocumentoAsociadoDTO> documentosCreadosInfo) { this.documentosCreadosInfo = documentosCreadosInfo; }

    public DocumentoAsociadoDTO getDocumentoCreadoInfo() { return documentoCreadoInfo; }
    public void setDocumentoCreadoInfo(DocumentoAsociadoDTO documentoCreadoInfo) { this.documentoCreadoInfo = documentoCreadoInfo; }

    public List<FilaHistorialDTO> getHistorialComprobantes() { return historialComprobantes; }
    public void setHistorialComprobantes(List<FilaHistorialDTO> historialComprobantes) { this.historialComprobantes = historialComprobantes; }
}
