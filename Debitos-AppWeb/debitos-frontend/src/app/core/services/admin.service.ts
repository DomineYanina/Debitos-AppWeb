import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EstadoSincronizacion,
  PrevisualizacionSincronizacion,
  ComprobanteCandidato,
  ResumenSincronizacion,
  ComprobanteSinAsociar,
  EstadoSincronizacionPrestaciones,
  PrevisualizacionPrestaciones,
  ResumenSincronizacionPrestaciones
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/admin/sincronizacion`;
  private apiPrestacionesUrl = `${environment.apiUrl}/api/admin/prestaciones`;

  /**
   * Obtiene el estado actual de sincronización, salud de conexión a Gestión y métricas operativas.
   */
  obtenerEstado(anio?: number): Observable<EstadoSincronizacion> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<EstadoSincronizacion>(`${this.apiUrl}/estado`, { params });
  }

  /**
   * Obtiene la previsualización de los comprobantes pendientes de sincronizar con métricas.
   */
  previsualizar(anio?: number, limite?: number, tipo?: string): Observable<PrevisualizacionSincronizacion> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    if (limite) {
      params = params.set('limite', limite.toString());
    }
    if (tipo && tipo !== 'TODOS') {
      params = params.set('tipo', tipo.trim());
    }
    return this.http.get<PrevisualizacionSincronizacion>(`${this.apiUrl}/previsualizar`, { params });
  }

  /**
   * Obtiene la lista completa de comprobantes candidatos a importar (sin límite de muestreo),
   * para su exportación íntegra a archivo Excel.
   */
  obtenerCandidatosAExportar(anio?: number, tipo?: string): Observable<ComprobanteCandidato[]> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    if (tipo && tipo !== 'TODOS') {
      params = params.set('tipo', tipo.trim());
    }
    return this.http.get<ComprobanteCandidato[]>(`${this.apiUrl}/candidatos-exportar`, { params });
  }

  /**
   * Obtiene la lista completa de comprobantes sin comprobante padre asociado.
   */
  obtenerComprobantesSinAsociar(tipo?: string): Observable<ComprobanteSinAsociar[]> {
    let params = new HttpParams();
    if (tipo && tipo !== 'TODOS') {
      params = params.set('tipo', tipo.trim());
    }
    return this.http.get<ComprobanteSinAsociar[]>(`${this.apiUrl}/sin-asociar`, { params });
  }

  /**
   * Ejecuta el proceso de sincronización para el año especificado (o el actual por defecto).
   */
  ejecutarSincronizacion(anio?: number): Observable<ResumenSincronizacion> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    return this.http.post<ResumenSincronizacion>(`${this.apiUrl}/ejecutar`, {}, { params });
  }

  /**
   * Obtiene el estado y métricas de sincronización de prestaciones (amb_liquidado).
   */
  obtenerEstadoPrestaciones(anio?: number): Observable<EstadoSincronizacionPrestaciones> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<EstadoSincronizacionPrestaciones>(`${this.apiPrestacionesUrl}/estado`, { params });
  }

  /**
   * Previsualiza prestaciones candidatas a migrar a amb_liquidado.
   */
  previsualizarPrestaciones(anio?: number, limite?: number, tipo?: string): Observable<PrevisualizacionPrestaciones> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    if (limite) {
      params = params.set('limite', limite.toString());
    }
    if (tipo && tipo !== 'TODOS') {
      params = params.set('tipo', tipo.trim());
    }
    return this.http.get<PrevisualizacionPrestaciones>(`${this.apiPrestacionesUrl}/previsualizar`, { params });
  }

  /**
   * Ejecuta la sincronización completa de prestaciones a amb_liquidado para el año.
   */
  sincronizarPrestaciones(anio?: number): Observable<ResumenSincronizacionPrestaciones> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    return this.http.post<ResumenSincronizacionPrestaciones>(`${this.apiPrestacionesUrl}/sincronizar`, {}, { params });
  }

  /**
   * Reconcilia prestaciones huérfanas en amb_liquidado vinculándolas a cabecera.
   */
  reconciliarPrestacionesCabecera(anio?: number): Observable<any> {
    let params = new HttpParams();
    if (anio) {
      params = params.set('anio', anio.toString());
    }
    return this.http.post<any>(`${this.apiPrestacionesUrl}/reconciliar-cabecera`, {}, { params });
  }
}
