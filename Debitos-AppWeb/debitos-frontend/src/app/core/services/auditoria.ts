import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prestacion } from '../models/prestacion'; // Asegurate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/auditoria'; // La URL de tu nuevo controlador en Java

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
}
