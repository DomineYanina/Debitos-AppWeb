import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prestacion } from '../models/prestacion';
import { DocumentoAsociado } from '../models/documento-asociado';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/auditoria`;

  buscarPrestaciones(filtros: any): Observable<Prestacion[]> {
    return this.http.get<Prestacion[]>(`${this.apiUrl}/buscar`, { params: filtros });
  }

  guardarParcialmente(payload: any) {
    return this.http.post(`${this.apiUrl}/guardar-parcialmente`, payload);
  }

  guardarNuevaNotaCredito(payload: any) {
    return this.http.post(`${this.apiUrl}/nueva-nota-credito`, payload);
  }

  guardarNuevaNotaDebito(payload: any) {
    return this.http.post(`${this.apiUrl}/nueva-nota-debito`, payload);
  }

  verificarTieneNC(letra: string, puntoVenta: string | number, numero: string | number): Observable<DocumentoAsociado | null> {
    return this.http.get<DocumentoAsociado | null>(`${this.apiUrl}/tiene-nc`, {
      params: { letra, puntoVenta: String(puntoVenta), numero: String(numero) }
    });
  }

  verificarTieneND(letra: string, puntoVenta: string | number, numero: string | number): Observable<DocumentoAsociado | null> {
    return this.http.get<DocumentoAsociado | null>(`${this.apiUrl}/tiene-nd`, {
      params: { letra, puntoVenta: String(puntoVenta), numero: String(numero) }
    });
  }

  verificarTieneNCParaND(letra: string, puntoVenta: string | number, numero: string | number): Observable<DocumentoAsociado | null> {
    return this.http.get<DocumentoAsociado | null>(`${this.apiUrl}/tiene-nc-para-nd`, {
      params: { letra, puntoVenta: String(puntoVenta), numero: String(numero) }
    });
  }

  registrarMetricaUsabilidad(payload: any) {
    return this.http.post(`${this.apiUrl}/telemetria/usabilidad`, payload);
  }

  registrarMetricasLote(payloads: any[]) {
    return this.http.post(`${this.apiUrl}/telemetria/usabilidad/lote`, payloads);
  }
}
