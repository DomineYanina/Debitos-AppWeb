package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.List;

public class TiemposCobranzaDTO {
    private Integer dsoGlobal;
    private Integer cobroRealPromedio;
    private BigDecimal saldoTotalMora;
    private List<RangoAntiguedadDTO> detalles;

    public TiemposCobranzaDTO() {
    }

    public TiemposCobranzaDTO(Integer dsoGlobal, Integer cobroRealPromedio, BigDecimal saldoTotalMora, List<RangoAntiguedadDTO> detalles) {
        this.dsoGlobal = dsoGlobal;
        this.cobroRealPromedio = cobroRealPromedio;
        this.saldoTotalMora = saldoTotalMora;
        this.detalles = detalles;
    }

    public Integer getDsoGlobal() {
        return dsoGlobal;
    }

    public void setDsoGlobal(Integer dsoGlobal) {
        this.dsoGlobal = dsoGlobal;
    }

    public Integer getCobroRealPromedio() {
        return cobroRealPromedio;
    }

    public void setCobroRealPromedio(Integer cobroRealPromedio) {
        this.cobroRealPromedio = cobroRealPromedio;
    }

    public BigDecimal getSaldoTotalMora() {
        return saldoTotalMora;
    }

    public void setSaldoTotalMora(BigDecimal saldoTotalMora) {
        this.saldoTotalMora = saldoTotalMora;
    }

    public List<RangoAntiguedadDTO> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<RangoAntiguedadDTO> detalles) {
        this.detalles = detalles;
    }
}
