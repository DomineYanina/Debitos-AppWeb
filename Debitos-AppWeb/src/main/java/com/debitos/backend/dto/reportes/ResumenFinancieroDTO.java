package com.debitos.backend.dto.reportes;

import java.util.List;

public class ResumenFinancieroDTO {
    // 1. Tabla de Balance Financiero
    private List<BalanceFinanciadorDTO> balanceFinanciadores;

    // 2. Gráfico Donut (Distribución de Cartera)
    private List<PuntoDonutDTO> distribucionCartera;

    public ResumenFinancieroDTO() {
    }

    public ResumenFinancieroDTO(List<BalanceFinanciadorDTO> balanceFinanciadores, List<PuntoDonutDTO> distribucionCartera) {
        this.balanceFinanciadores = balanceFinanciadores;
        this.distribucionCartera = distribucionCartera;
    }

    public List<BalanceFinanciadorDTO> getBalanceFinanciadores() {
        return balanceFinanciadores;
    }

    public void setBalanceFinanciadores(List<BalanceFinanciadorDTO> balanceFinanciadores) {
        this.balanceFinanciadores = balanceFinanciadores;
    }

    public List<PuntoDonutDTO> getDistribucionCartera() {
        return distribucionCartera;
    }

    public void setDistribucionCartera(List<PuntoDonutDTO> distribucionCartera) {
        this.distribucionCartera = distribucionCartera;
    }
}
