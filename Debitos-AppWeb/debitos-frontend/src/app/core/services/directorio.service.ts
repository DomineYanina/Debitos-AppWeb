import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DatasetGraficoDTO,
  DirectorioCobertura,
  DirectorioGrupoFactura,
  DirectorioMotivoDebito,
  DirectorioPrestacionDetalle,
  DirectorioTotales,
  CcFinanciadorDTO,
  MatrizRecaudacionDTO,
  CadenaTrazabilidadDTO,
  MetricaAnalistaDTO,
  MetricaMedicoDTO,
  MetricaOperadorDTO,
  DesempenoGlobalDTO,
  BalanceFinanciadorDTO,
  PuntoDonutDTO,
  TiemposCobranzaDTO,
  RangoAntiguedadDTO
} from '../models/directorio.model';

@Injectable({
  providedIn: 'root'
})
export class DirectorioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/directorio`;
  private apiGraficosUrl = `${environment.apiUrl}/api/graficos`;

  /**
   * GET /api/graficos/balance
   * Retorna la lista de financiadores con su desglose contable y saldo pendiente.
   */
  getBalanceFinanciero(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<BalanceFinanciadorDTO[]> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<BalanceFinanciadorDTO[]>(`${this.apiGraficosUrl}/balance`, { params });
  }

  /**
   * GET /api/graficos/cartera-donut
   * Retorna la distribución de cartera por financiador (solo saldos positivos) para el Donut.
   */
  getCarteraDonut(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<PuntoDonutDTO[]> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<PuntoDonutDTO[]>(`${this.apiGraficosUrl}/cartera-donut`, { params });
  }

  obtenerCoberturas(): Observable<DirectorioCobertura[]> {
    return this.http.get<DirectorioCobertura[]>(`${this.apiUrl}/coberturas`);
  }

  obtenerTiposDocumento(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tipos-documento`);
  }

  obtenerTotales(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<DirectorioTotales> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DirectorioTotales>(`${this.apiUrl}/totales`, { params });
  }

  obtenerGrupos(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<DirectorioGrupoFactura[]> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DirectorioGrupoFactura[]>(`${this.apiUrl}/grupos`, { params });
  }

  obtenerMotivos(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<DirectorioMotivoDebito[]> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DirectorioMotivoDebito[]>(`${this.apiUrl}/motivos`, { params });
  }

  obtenerMotivoDetalle(motivo: string, codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<DirectorioPrestacionDetalle[]> {
    let params = new HttpParams().set('motivo', motivo);
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DirectorioPrestacionDetalle[]>(`${this.apiUrl}/motivo-detalle`, { params });
  }

  // ---------------------------------------------------------------------------
  // Gráficos financieros (/api/graficos)
  // ---------------------------------------------------------------------------

  /**
   * GET /api/graficos/distribucion
   * Retorna un único dataset con el saldo pendiente por financiador/cobertura.
   * Pensado para un gráfico de dona (doughnut).
   */
  getDistribucionCartera(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<DatasetGraficoDTO> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DatasetGraficoDTO>(`${this.apiGraficosUrl}/distribucion`, { params });
  }

  /**
   * GET /api/graficos/evolucion
   * Retorna 3 datasets (Facturación, Débitos, Cobranzas) con un punto por mes.
   * Pensado para un gráfico de líneas.
   */
  getEvolucionMensual(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<DatasetGraficoDTO[]> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DatasetGraficoDTO[]>(`${this.apiGraficosUrl}/evolucion`, { params });
  }

  /**
   * GET /api/graficos/aging
   * Retorna un único dataset con saldo pendiente agrupado por rango de antigüedad.
   * Pensado para un gráfico de barras horizontales (aging / mora).
   */
  getAgingFinanciero(): Observable<DatasetGraficoDTO> {
    return this.http.get<DatasetGraficoDTO>(`${this.apiGraficosUrl}/aging`);
  }

  /**
   * GET /api/graficos/tiempos-cobranza
   * Retorna KPIs de DSO global, cobro real promedio, saldo total en mora y desglose por rangos de antigüedad.
   */
  getTiemposCobranza(
    codigoCobertura?: string,
    tipoDoc?: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<TiemposCobranzaDTO> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') {
      params = params.set('codigoCobertura', codigoCobertura);
    }
    if (tipoDoc && tipoDoc !== 'TODOS') {
      params = params.set('tipoDoc', tipoDoc);
    }
    if (fechaDesde) {
      params = params.set('fechaDesde', fechaDesde);
    }
    if (fechaHasta) {
      params = params.set('fechaHasta', fechaHasta);
    }
    return this.http.get<TiemposCobranzaDTO>(`${this.apiGraficosUrl}/tiempos-cobranza`, { params });
  }

  /**
   * GET /api/graficos/motivos
   * Retorna 2 datasets ("Refacturado" y "Pérdida") con top 10 de glosas.
   * Pensado para un gráfico de barras apiladas (Pareto de motivos de débito).
   */
  getParetoMotivos(codigoCobertura?: string, tipoDoc?: string, fechaDesde?: string, fechaHasta?: string): Observable<DatasetGraficoDTO[]> {
    let params = new HttpParams();
    if (codigoCobertura && codigoCobertura !== 'TODAS') params = params.set('codigoCobertura', codigoCobertura);
    if (tipoDoc && tipoDoc !== 'TODOS') params = params.set('tipoDoc', tipoDoc);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DatasetGraficoDTO[]>(`${this.apiGraficosUrl}/motivos`, { params });
  }

  /**
   * GET /api/graficos/cuenta-corriente
   * Retorna el árbol a 3 niveles (Financiador -> Período -> Comprobante)
   * para la tabla de Cuenta Corriente.
   */
  getCuentaCorrienteTresNiveles(
    financiador?: string,
    periodo?: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Observable<CcFinanciadorDTO[]> {
    let params = new HttpParams();
    if (financiador && financiador !== 'TODAS') params = params.set('financiador', financiador);
    if (periodo) params = params.set('periodo', periodo);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<CcFinanciadorDTO[]>(`${this.apiGraficosUrl}/cuenta-corriente`, { params });
  }

  /**
   * GET /api/graficos/matriz-recaudacion
   * Retorna la Matriz Anual de Recaudación (cruce de financiadores vs 12 meses).
   * @param anio año a consultar (opcional)
   */
  getMatrizRecaudacion(anio?: number, financiador?: string): Observable<MatrizRecaudacionDTO> {
    let params = new HttpParams();
    if (anio) params = params.set('anio', anio.toString());
    if (financiador && financiador !== 'TODAS') params = params.set('financiador', financiador);

    return this.http.get<MatrizRecaudacionDTO>(`${this.apiGraficosUrl}/matriz-recaudacion`, { params });
  }

  /**
   * GET /api/graficos/trazabilidad
   * Retorna el árbol encadenado de expedientes/prestaciones con su historial de eventos.
   * @param financiador filtro opcional por financiador o código
   * @param medico      filtro opcional por profesional / médico
   * @param periodo     filtro opcional por período YYYY-MM
   */
  getTrazabilidad(financiador?: string, medico?: string, periodo?: string, fechaDesde?: string, fechaHasta?: string): Observable<CadenaTrazabilidadDTO[]> {
    let params = new HttpParams();
    if (financiador) params = params.set('financiador', financiador);
    if (medico) params = params.set('medico', medico);
    if (periodo) params = params.set('periodo', periodo);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<CadenaTrazabilidadDTO[]>(`${this.apiGraficosUrl}/trazabilidad`, { params });
  }

  /**
   * GET /api/graficos/bucles
   * Retorna los bucles de insistencia (expedientes con 2 o más débitos NC).
   * @param financiador filtro opcional por financiador o código
   * @param medico      filtro opcional por profesional / médico
   * @param periodo     filtro opcional por período YYYY-MM
   * @param fechaDesde  filtro opcional por fecha límite inferior (YYYY-MM-DD)
   * @param fechaHasta  filtro opcional por fecha límite superior (YYYY-MM-DD)
   */
  getBuclesInsistencia(financiador?: string, medico?: string, periodo?: string, fechaDesde?: string, fechaHasta?: string): Observable<CadenaTrazabilidadDTO[]> {
    let params = new HttpParams();
    if (financiador) params = params.set('financiador', financiador);
    if (medico) params = params.set('medico', medico);
    if (periodo) params = params.set('periodo', periodo);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<CadenaTrazabilidadDTO[]>(`${this.apiGraficosUrl}/bucles`, { params });
  }

  /**
   * GET /api/graficos/desempeno
   * Retorna el reporte unificado de desempeño operativo a 3 niveles
   * (analistas, médicos y operadores) procesando la trazabilidad una sola vez.
   * @param periodo filtro opcional por período YYYY-MM
   * @param fechaDesde fecha límite inferior opcional (YYYY-MM-DD)
   * @param fechaHasta fecha límite superior opcional (YYYY-MM-DD)
   */
  getDesempenoGlobal(periodo?: string, fechaDesde?: string, fechaHasta?: string): Observable<DesempenoGlobalDTO> {
    let params = new HttpParams();
    if (periodo && periodo !== 'TODOS') params = params.set('periodo', periodo);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<DesempenoGlobalDTO>(`${this.apiGraficosUrl}/desempeno`, { params });
  }
}

