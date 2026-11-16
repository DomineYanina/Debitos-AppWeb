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

  // 1. Coberturas
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

  guardarPeriodoCorregido(req: CorregirPeriodoRequest): Observable<FacturaPeriodoDTO> {
    return this.http.post<FacturaPeriodoDTO>(`${this.apiUrl}/periodos/corregir`, req);
  }

  // 3. Prestaciones
  listarPrestaciones(filtro?: string, page: number = 0, size: number = 20): Observable<PageResponse<PrestacionConsideracionDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (filtro && filtro.trim().length > 0) {
      params = params.set('filtro', filtro.trim());
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

  listarFacturasAnuladas(page: number = 0, size: number = 20): Observable<PageResponse<FacturaAnuladaDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<FacturaAnuladaDTO>>(`${this.apiUrl}/facturas-anuladas`, { params });
  }

  cambiarEstadoAnulacion(req: CambiarAnulacionRequest): Observable<FacturaAnuladaDTO> {
    return this.http.post<FacturaAnuladaDTO>(`${this.apiUrl}/facturas-anuladas/cambiar-estado`, req);
  }

  // 5. Historial de Ajustes
  obtenerHistorial(referencia?: string, page: number = 0, size: number = 20): Observable<PageResponse<HistorialAjusteDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (referencia && referencia.trim().length > 0) {
      params = params.set('referencia', referencia.trim());
    }
    return this.http.get<PageResponse<HistorialAjusteDTO>>(`${this.apiUrl}/historial`, { params });
  }
}
