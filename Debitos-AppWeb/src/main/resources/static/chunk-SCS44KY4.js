import {
  HttpClient,
  HttpParams,
  environment
} from "./chunk-FKTKYBCK.js";
import {
  Injectable,
  inject,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-IXY2MHCK.js";

// src/app/core/services/directorio.service.ts
var DirectorioService = class _DirectorioService {
  http = inject(HttpClient);
  apiUrl = `${environment.apiUrl}/api/directorio`;
  apiGraficosUrl = `${environment.apiUrl}/api/graficos`;
  /**
   * GET /api/graficos/balance
   * Retorna la lista de financiadores con su desglose contable y saldo pendiente.
   */
  getBalanceFinanciero() {
    return this.http.get(`${this.apiGraficosUrl}/balance`);
  }
  /**
   * GET /api/graficos/cartera-donut
   * Retorna la distribución de cartera por financiador (solo saldos positivos) para el Donut.
   */
  getCarteraDonut() {
    return this.http.get(`${this.apiGraficosUrl}/cartera-donut`);
  }
  obtenerCoberturas() {
    return this.http.get(`${this.apiUrl}/coberturas`);
  }
  obtenerTiposDocumento() {
    return this.http.get(`${this.apiUrl}/tipos-documento`);
  }
  obtenerTotales(codigoCobertura, tipoDoc, fechaDesde, fechaHasta) {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== "TODAS")
      params = params.set("codigoCobertura", codigoCobertura);
    if (tipoDoc && tipoDoc !== "TODOS")
      params = params.set("tipoDoc", tipoDoc);
    if (fechaDesde)
      params = params.set("fechaDesde", fechaDesde);
    if (fechaHasta)
      params = params.set("fechaHasta", fechaHasta);
    return this.http.get(`${this.apiUrl}/totales`, { params });
  }
  obtenerGrupos(codigoCobertura, tipoDoc, fechaDesde, fechaHasta) {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== "TODAS")
      params = params.set("codigoCobertura", codigoCobertura);
    if (tipoDoc && tipoDoc !== "TODOS")
      params = params.set("tipoDoc", tipoDoc);
    if (fechaDesde)
      params = params.set("fechaDesde", fechaDesde);
    if (fechaHasta)
      params = params.set("fechaHasta", fechaHasta);
    return this.http.get(`${this.apiUrl}/grupos`, { params });
  }
  obtenerMotivos(codigoCobertura, tipoDoc, fechaDesde, fechaHasta) {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== "TODAS")
      params = params.set("codigoCobertura", codigoCobertura);
    if (tipoDoc && tipoDoc !== "TODOS")
      params = params.set("tipoDoc", tipoDoc);
    if (fechaDesde)
      params = params.set("fechaDesde", fechaDesde);
    if (fechaHasta)
      params = params.set("fechaHasta", fechaHasta);
    return this.http.get(`${this.apiUrl}/motivos`, { params });
  }
  obtenerMotivoDetalle(motivo, codigoCobertura, tipoDoc, fechaDesde, fechaHasta) {
    let params = new HttpParams().set("motivo", motivo);
    if (codigoCobertura && codigoCobertura !== "TODAS")
      params = params.set("codigoCobertura", codigoCobertura);
    if (tipoDoc && tipoDoc !== "TODOS")
      params = params.set("tipoDoc", tipoDoc);
    if (fechaDesde)
      params = params.set("fechaDesde", fechaDesde);
    if (fechaHasta)
      params = params.set("fechaHasta", fechaHasta);
    return this.http.get(`${this.apiUrl}/motivo-detalle`, { params });
  }
  // ---------------------------------------------------------------------------
  // Gráficos financieros (/api/graficos)
  // ---------------------------------------------------------------------------
  /**
   * GET /api/graficos/distribucion
   * Retorna un único dataset con el saldo pendiente por financiador/cobertura.
   * Pensado para un gráfico de dona (doughnut).
   */
  getDistribucionCartera() {
    return this.http.get(`${this.apiGraficosUrl}/distribucion`);
  }
  /**
   * GET /api/graficos/evolucion
   * Retorna 3 datasets (Facturación, Débitos, Cobranzas) con un punto por mes.
   * Pensado para un gráfico de líneas.
   */
  getEvolucionMensual() {
    return this.http.get(`${this.apiGraficosUrl}/evolucion`);
  }
  /**
   * GET /api/graficos/aging
   * Retorna un único dataset con saldo pendiente agrupado por rango de antigüedad.
   * Pensado para un gráfico de barras horizontales (aging / mora).
   */
  getAgingFinanciero() {
    return this.http.get(`${this.apiGraficosUrl}/aging`);
  }
  /**
   * GET /api/graficos/tiempos-cobranza
   * Retorna KPIs de DSO global, cobro real promedio, saldo total en mora y desglose por rangos de antigüedad.
   */
  getTiemposCobranza() {
    return this.http.get(`${this.apiGraficosUrl}/tiempos-cobranza`);
  }
  /**
   * GET /api/graficos/motivos
   * Retorna 2 datasets ("Refacturado" y "Pérdida") con top 10 de glosas.
   * Pensado para un gráfico de barras apiladas (Pareto de motivos de débito).
   */
  getParetoMotivos(codigoCobertura, tipoDoc, fechaDesde, fechaHasta) {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== "TODAS")
      params = params.set("codigoCobertura", codigoCobertura);
    if (tipoDoc && tipoDoc !== "TODOS")
      params = params.set("tipoDoc", tipoDoc);
    if (fechaDesde)
      params = params.set("fechaDesde", fechaDesde);
    if (fechaHasta)
      params = params.set("fechaHasta", fechaHasta);
    return this.http.get(`${this.apiGraficosUrl}/motivos`, { params });
  }
  /**
   * GET /api/graficos/cuenta-corriente
   * Retorna el árbol a 3 niveles (Financiador -> Período -> Comprobante)
   * para la tabla de Cuenta Corriente.
   */
  getCuentaCorrienteTresNiveles(financiador, periodo) {
    let params = new HttpParams();
    if (financiador)
      params = params.set("financiador", financiador);
    if (periodo)
      params = params.set("periodo", periodo);
    return this.http.get(`${this.apiGraficosUrl}/cuenta-corriente`, { params });
  }
  /**
   * GET /api/graficos/matriz-recaudacion
   * Retorna la Matriz Anual de Recaudación (cruce de financiadores vs 12 meses).
   * @param anio año a consultar (opcional)
   */
  getMatrizRecaudacion(anio, financiador) {
    let params = new HttpParams();
    if (anio)
      params = params.set("anio", anio.toString());
    if (financiador && financiador !== "TODAS")
      params = params.set("financiador", financiador);
    return this.http.get(`${this.apiGraficosUrl}/matriz-recaudacion`, { params });
  }
  /**
   * GET /api/graficos/trazabilidad
   * Retorna el árbol encadenado de expedientes/prestaciones con su historial de eventos.
   * @param financiador filtro opcional por financiador o código
   * @param medico      filtro opcional por profesional / médico
   * @param periodo     filtro opcional por período YYYY-MM
   */
  getTrazabilidad(financiador, medico, periodo) {
    let params = new HttpParams();
    if (financiador)
      params = params.set("financiador", financiador);
    if (medico)
      params = params.set("medico", medico);
    if (periodo)
      params = params.set("periodo", periodo);
    return this.http.get(`${this.apiGraficosUrl}/trazabilidad`, { params });
  }
  /**
   * GET /api/graficos/bucles
   * Retorna los bucles de insistencia (expedientes con 2 o más débitos NC).
   * @param financiador filtro opcional por financiador o código
   * @param medico      filtro opcional por profesional / médico
   * @param periodo     filtro opcional por período YYYY-MM
   */
  getBuclesInsistencia(financiador, medico, periodo) {
    let params = new HttpParams();
    if (financiador)
      params = params.set("financiador", financiador);
    if (medico)
      params = params.set("medico", medico);
    if (periodo)
      params = params.set("periodo", periodo);
    return this.http.get(`${this.apiGraficosUrl}/bucles`, { params });
  }
  /**
   * GET /api/graficos/desempeno
   * Retorna el reporte unificado de desempeño operativo a 3 niveles
   * (analistas, médicos y operadores) procesando la trazabilidad una sola vez.
   * @param periodo filtro opcional por período YYYY-MM
   */
  getDesempenoGlobal(periodo) {
    let params = new HttpParams();
    if (periodo)
      params = params.set("periodo", periodo);
    return this.http.get(`${this.apiGraficosUrl}/desempeno`, { params });
  }
  static \u0275fac = function DirectorioService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DirectorioService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DirectorioService, factory: _DirectorioService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DirectorioService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

export {
  DirectorioService
};
//# sourceMappingURL=chunk-SCS44KY4.js.map
