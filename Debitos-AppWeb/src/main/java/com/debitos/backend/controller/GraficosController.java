package com.debitos.backend.controller;

import com.debitos.backend.dto.reportes.BalanceFinanciadorDTO;
import com.debitos.backend.dto.reportes.CadenaTrazabilidadDTO;
import com.debitos.backend.dto.reportes.CcFinanciadorDTO;
import com.debitos.backend.dto.reportes.DatasetGraficoDTO;
import com.debitos.backend.dto.reportes.DesempenoGlobalDTO;
import com.debitos.backend.dto.reportes.MatrizRecaudacionDTO;
import com.debitos.backend.dto.reportes.MetricaAnalistaDTO;
import com.debitos.backend.dto.reportes.MetricaMedicoDTO;
import com.debitos.backend.dto.reportes.MetricaOperadorDTO;
import com.debitos.backend.dto.reportes.PuntoDonutDTO;
import com.debitos.backend.dto.reportes.TiemposCobranzaDTO;
import com.debitos.backend.service.DirectorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Endpoints dedicados a proveer datos ya agrupados para los graficos financieros
 * del frontend (Chart.js / ng2-charts).
 *
 * Base path: /api/graficos
 * Acceso:    roles DIRECTORIO y ADMIN
 */
@RestController
@RequestMapping("/api/graficos")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasAnyRole('DIRECTORIO', 'ADMIN')")
public class GraficosController {

    @Autowired
    private DirectorioService directorioService;

    /**
     * GET /api/graficos/balance
     *
     * Retorna la tabla de Resumen de Cartera y Balance Financiero agrupado por Financiador.
     */
    @GetMapping("/balance")
    public ResponseEntity<List<BalanceFinanciadorDTO>> getBalanceFinanciero() {
        List<BalanceFinanciadorDTO> balance = directorioService.obtenerBalanceFinanciero();
        return ResponseEntity.ok(balance);
    }

    /**
     * GET /api/graficos/cartera-donut
     *
     * Retorna los datos para el gráfico circular Donut de Distribución de Cartera
     * con saldos pendientes positivos.
     */
    @GetMapping("/cartera-donut")
    public ResponseEntity<List<PuntoDonutDTO>> getCarteraDonut() {
        List<PuntoDonutDTO> donut = directorioService.obtenerDistribucionCarteraDonut();
        return ResponseEntity.ok(donut);
    }

    /**
     * GET /api/graficos/distribucion
     *
     * Retorna un DatasetGraficoDTO con el saldo pendiente agrupado por financiador/cobertura.
     * Pensado para renderizar un grafico de dona o torta en el frontend.
     *
     * Ejemplo de respuesta:
     * {
     *   "tituloDataset": "Saldo por Financiador",
     *   "puntos": [
     *     { "etiqueta": "OSDE",  "valor": 1200000.00 },
     *     { "etiqueta": "IOMA",  "valor":  850000.00 }
     *   ]
     * }
     */
    @GetMapping("/distribucion")
    public ResponseEntity<DatasetGraficoDTO> getDistribucionCartera() {
        DatasetGraficoDTO dataset = directorioService.getDistribucionCartera();
        return ResponseEntity.ok(dataset);
    }

    /**
     * GET /api/graficos/evolucion
     *
     * Retorna una lista de 3 DatasetGraficoDTO (Facturacion, Debitos, Cobranzas),
     * cada uno con un punto por mes (etiqueta = 'YYYY-MM', valor = monto sumado).
     * Pensado para renderizar un grafico de lineas o barras en el frontend.
     *
     * Ejemplo de respuesta:
     * [
     *   { "tituloDataset": "Facturacion", "puntos": [{"etiqueta":"2025-08","valor":22116449.17}, ...] },
     *   { "tituloDataset": "Debitos",     "puntos": [{"etiqueta":"2025-08","valor": 1392431.39}, ...] },
     *   { "tituloDataset": "Cobranzas",   "puntos": [{"etiqueta":"2025-09","valor":20724017.78}, ...] }
     * ]
     */
    @GetMapping("/evolucion")
    public ResponseEntity<List<DatasetGraficoDTO>> getEvolucionMensual() {
        List<DatasetGraficoDTO> datasets = directorioService.getEvolucionMensual();
        return ResponseEntity.ok(datasets);
    }

    /**
     * GET /api/graficos/aging
     *
     * Retorna un DatasetGraficoDTO con el saldo pendiente de facturas agrupado
     * por rango de antigüedad (0-30, 31-60, 61-90, 91-180, más de 180 días).
     * Pensado para un grafico de barras horizontal (aging / mora).
     *
     * Ejemplo de respuesta:
     * {
     *   "tituloDataset": "Saldo en Mora",
     *   "puntos": [
     *     { "etiqueta": "0-30 días",       "valor": 950000.00 },
     *     { "etiqueta": "31-60 días",      "valor": 420000.00 },
     *     { "etiqueta": "Más de 180 días", "valor": 1800000.00 }
     *   ]
     * }
     */
    @GetMapping("/aging")
    public ResponseEntity<DatasetGraficoDTO> getAgingFinanciero() {
        DatasetGraficoDTO dataset = directorioService.getAgingFinanciero();
        return ResponseEntity.ok(dataset);
    }

    /**
     * GET /api/graficos/tiempos-cobranza
     *
     * Retorna el DTO de Tiempos de Cobranza (DSO global ponderado, cobro real promedio,
     * saldo total en mora y el detalle por rango de antigüedad).
     */
    @GetMapping("/tiempos-cobranza")
    public ResponseEntity<TiemposCobranzaDTO> getTiemposCobranza() {
        TiemposCobranzaDTO dto = directorioService.getTiemposCobranza();
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/graficos/motivos
     *
     * Retorna una lista de 2 DatasetGraficoDTO para el análisis Pareto de glosas.
     * El top 10 de motivos de débito ordenado por monto refacturado descendente.
     *   [0] "Refacturado" → suma de importerefactura por motivo
     *   [1] "Pérdida"     → suma de importedebitado (solo débitos aceptados) por motivo
     * Pensado para un grafico de barras agrupadas (grouped bar).
     *
     * Ejemplo de respuesta:
     * [
     *   { "tituloDataset": "Refacturado", "puntos": [{"etiqueta":"Prestacion no autorizada","valor":300000.00}, ...] },
     *   { "tituloDataset": "Pérdida",     "puntos": [{"etiqueta":"Prestacion no autorizada","valor":150000.00}, ...] }
     * ]
     */
    @GetMapping("/motivos")
    public ResponseEntity<List<DatasetGraficoDTO>> getParetoMotivos(
            @RequestParam(required = false) String codigoCobertura,
            @RequestParam(required = false) String tipoDoc,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        List<DatasetGraficoDTO> datasets = directorioService.getParetoMotivos(codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        return ResponseEntity.ok(datasets);
    }

    /**
     * GET /api/graficos/cuenta-corriente
     *
     * Retorna la estructura jerárquica a 3 niveles (Financiador -> Período -> Comprobante)
     * para la tabla de Cuenta Corriente, con montos totalizados y saldo neto.
     * Permite filtrar opcionalmente por financiador y/o período (formato YYYY-MM).
     *
     * @param financiador filtro opcional por nombre o código de cobertura
     * @param periodo     filtro opcional por período YYYY-MM
     * @return Lista de CcFinanciadorDTO ordenados por saldo descendente
     */
    @GetMapping("/cuenta-corriente")
    public ResponseEntity<List<CcFinanciadorDTO>> getCuentaCorriente(
            @RequestParam(required = false) String financiador,
            @RequestParam(required = false) String periodo) {
        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(financiador, periodo);
        return ResponseEntity.ok(resultado);
    }

    /**
     * GET /api/graficos/matriz-recaudacion
     *
     * Retorna la Matriz Anual de Recaudación: cruce de financiadores contra los 12 meses
     * de un año específico, sumando únicamente los comprobantes de cobro (RC, RCA, RCB, REC, OP).
     *
     * @param anio año a consultar (opcional; si no se especifica, toma el año actual o el más reciente con datos)
     * @return MatrizRecaudacionDTO con la matriz completa, totales mensuales y gran total.
     */
    @GetMapping("/matriz-recaudacion")
    public ResponseEntity<MatrizRecaudacionDTO> getMatrizRecaudacion(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) String financiador) {
        MatrizRecaudacionDTO matriz = directorioService.getMatrizRecaudacion(anio, financiador);
        return ResponseEntity.ok(matriz);
    }

    /**
     * GET /api/graficos/trazabilidad
     *
     * Retorna el módulo de detalle y trazabilidad (árbol encadenado de expedientes):
     * agrupa los comprobantes pertenecientes a la misma cadena de vida (FC -> NC -> ND -> RC),
     * ordenados cronológicamente con su historial de eventos y metadatos de prestación.
     *
     * @param financiador filtro opcional por financiador o código de cobertura
     * @param medico      filtro opcional por médico
     * @param periodo     filtro opcional por período YYYY-MM
     * @return Lista de hasta 500 expedientes (CadenaTrazabilidadDTO) ordenados por fecha descendente
     */
    @GetMapping("/trazabilidad")
    public ResponseEntity<List<CadenaTrazabilidadDTO>> getTrazabilidad(
            @RequestParam(required = false) String financiador,
            @RequestParam(required = false) String medico,
            @RequestParam(required = false) String periodo,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta) {
        List<CadenaTrazabilidadDTO> resultado = directorioService.getTrazabilidad(financiador, medico, periodo, fechaDesde, fechaHasta);
        return ResponseEntity.ok(resultado);
    }

    /**
     * GET /api/graficos/bucles
     *
     * Retorna los bucles de insistencia: expedientes que presentan 2 o más débitos (NC)
     * en su ciclo de vida, ordenados por cantidad de débitos y monto debitado descendente.
     *
     * @param financiador filtro opcional por financiador o código de cobertura
     * @param medico      filtro opcional por médico
     * @param periodo     filtro opcional por período YYYY-MM
     * @param fechaDesde  filtro opcional por fecha límite inferior (YYYY-MM-DD) de la factura origen
     * @param fechaHasta  filtro opcional por fecha límite superior (YYYY-MM-DD) de la factura origen
     * @return Lista de CadenaTrazabilidadDTO que cumplen la condición de bucle de insistencia
     */
    @GetMapping("/bucles")
    public ResponseEntity<List<CadenaTrazabilidadDTO>> getBuclesInsistencia(
            @RequestParam(required = false) String financiador,
            @RequestParam(required = false) String medico,
            @RequestParam(required = false) String periodo,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta) {
        List<CadenaTrazabilidadDTO> resultado = directorioService.getBuclesInsistencia(financiador, medico, periodo, fechaDesde, fechaHasta);
        return ResponseEntity.ok(resultado);
    }

    /**
     * GET /api/graficos/desempeno
     *
     * Retorna el reporte unificado de desempeño operativo a 3 niveles:
     * Analistas de Débito, Médicos/Prestadores y Operadores de Carga,
     * evaluando la trazabilidad completa una sola vez en el backend.
     *
     * @param periodo filtro opcional por período YYYY-MM
     * @param fechaDesde fecha límite inferior opcional (YYYY-MM-DD)
     * @param fechaHasta fecha límite superior opcional (YYYY-MM-DD)
     * @return DesempenoGlobalDTO con analistas, medicos y operadores consolidados
     */
    @GetMapping("/desempeno")
    public ResponseEntity<DesempenoGlobalDTO> getDesempenoGlobal(
            @RequestParam(required = false) String periodo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        DesempenoGlobalDTO resultado = directorioService.getDesempenoGlobal(periodo, fechaDesde, fechaHasta);
        return ResponseEntity.ok(resultado);
    }
}

