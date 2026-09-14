import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DirectorioCobertura,
  DirectorioGrupoFactura,
  DirectorioMotivoDebito,
  DirectorioPrestacionDetalle,
  DirectorioTotales
} from '../models/directorio.model';

@Injectable({
  providedIn: 'root'
})
export class DirectorioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/directorio`;

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
}
