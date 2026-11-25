import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CoberturaAliasDTO,
  GuardarAliasRequest,
  FacturaPeriodoDTO,
  CorregirPeriodoRequest,
  PrestacionConsideracionDTO,
  CambiarEstadoPrestacionRequest,
  FacturaAnuladaDTO,
  CambiarAnulacionRequest,
  HistorialAjusteDTO,
  PageResponse
} from '../models/gestion-contable.model';

@Injectable({
  providedIn: 'root'
})
export class GestionContableService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/contable`;

  private buildPageParams(page: number, size: number, sortBy?: string, sortDir?: string): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (sortBy && sortBy.trim().length > 0) {
      params = params.set('sortBy', sortBy.trim());
      if (sortDir) {
        params = params.set('sortDir', sortDir);
      }
    }
    return params;
  }

  // 1. Coberturas
  listarCoberturas(
    filtro?: string,
    page: number = 0,
    size: number = 20,
    sortBy?: string,
    sortDir?: string
  ): Observable<PageResponse<CoberturaAliasDTO>> {
    let params = this.buildPageParams(page, size, sortBy, sortDir);
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    return this.http.get<PageResponse<CoberturaAliasDTO>>(`${this.apiUrl}/coberturas`, { params });
  }

  buscarCobertura(codigo: string): Observable<CoberturaAliasDTO> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<CoberturaAliasDTO>(`${this.apiUrl}/coberturas/buscar`, { params });
  }

  guardarAliasCobertura(req: GuardarAliasRequest): Observable<CoberturaAliasDTO> {
    return this.http.post<CoberturaAliasDTO>(`${this.apiUrl}/coberturas/guardar-alias`, req);
  }

  // 2. Períodos
  buscarFacturaPeriodo(tipo: string, letra: string, ptovta: number, numero: number): Observable<FacturaPeriodoDTO> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('letra', letra)
      .set('ptovta', ptovta.toString())
      .set('numero', numero.toString());
    return this.http.get<FacturaPeriodoDTO>(`${this.apiUrl}/periodos/buscar-factura`, { params });
  }

  listarFacturasPeriodoCorregido(page: number = 0, size: number = 20): Observable<PageResponse<FacturaPeriodoDTO>> {
    const params = this.buildPageParams(page, size);
    return this.http.get<PageResponse<FacturaPeriodoDTO>>(`${this.apiUrl}/periodos`, { params });
  }

  guardarPeriodoCorregido(req: CorregirPeriodoRequest): Observable<FacturaPeriodoDTO> {
    return this.http.post<FacturaPeriodoDTO>(`${this.apiUrl}/periodos/corregir`, req);
  }

  // 3. Prestaciones
  listarPrestaciones(
    filtro?: string,
    page: number = 0,
    size: number = 20,
    sortBy?: string,
    sortDir?: string,
    estadoAmb?: string,
    estadoInt?: string
  ): Observable<PageResponse<PrestacionConsideracionDTO>> {
    let params = this.buildPageParams(page, size, sortBy, sortDir);
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    if (estadoAmb && estadoAmb.trim().length > 0 && estadoAmb !== 'TODOS') {
      params = params.set('estadoAmbulatorio', estadoAmb.trim());
    }
    if (estadoInt && estadoInt.trim().length > 0 && estadoInt !== 'TODOS') {
      params = params.set('estadoInternado', estadoInt.trim());
    }
    return this.http.get<PageResponse<PrestacionConsideracionDTO>>(`${this.apiUrl}/prestaciones`, { params });
  }

  cambiarEstadoPrestacion(req: CambiarEstadoPrestacionRequest): Observable<PrestacionConsideracionDTO> {
    return this.http.put<PrestacionConsideracionDTO>(`${this.apiUrl}/prestaciones/estado`, req);
  }

  // 4. Facturas Anuladas
  buscarFacturaParaAnulacion(tipo: string, letra: string, ptovta: number, numero: number): Observable<FacturaAnuladaDTO> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('letra', letra)
      .set('ptovta', ptovta.toString())
      .set('numero', numero.toString());
    return this.http.get<FacturaAnuladaDTO>(`${this.apiUrl}/facturas-anuladas/buscar`, { params });
  }

  listarCandidatosAnulador(idCabeceraOrigen: number): Observable<FacturaAnuladaDTO[]> {
    const params = new HttpParams().set('idCabeceraOrigen', idCabeceraOrigen.toString());
    return this.http.get<FacturaAnuladaDTO[]>(`${this.apiUrl}/facturas-anuladas/candidatos-anulador`, { params });
  }

  listarFacturasAnuladas(
    page: number = 0,
    size: number = 20,
    sortBy?: string,
    sortDir?: string,
    tipo?: string,
    filtro?: string
  ): Observable<PageResponse<FacturaAnuladaDTO>> {
    let params = this.buildPageParams(page, size, sortBy, sortDir);
    if (tipo && tipo.trim().length > 0 && tipo !== 'TODOS') {
      params = params.set('tipo', tipo.trim());
    }
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
    }
    return this.http.get<PageResponse<FacturaAnuladaDTO>>(`${this.apiUrl}/facturas-anuladas`, { params });
  }

  cambiarEstadoAnulacion(req: CambiarAnulacionRequest): Observable<FacturaAnuladaDTO> {
    return this.http.post<FacturaAnuladaDTO>(`${this.apiUrl}/facturas-anuladas/cambiar-estado`, req);
  }

  // 5. Historial de Ajustes
  obtenerHistorial(
    referencia?: string,
    page: number = 0,
    size: number = 20,
    sortBy?: string,
    sortDir?: string
  ): Observable<PageResponse<HistorialAjusteDTO>> {
    let params = this.buildPageParams(page, size, sortBy, sortDir);
    if (referencia && referencia.trim().length > 0) {
      params = params.set('referencia', referencia.trim());
    }
    return this.http.get<PageResponse<HistorialAjusteDTO>>(`${this.apiUrl}/historial`, { params });
  }
}
