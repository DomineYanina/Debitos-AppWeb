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
    // Los 'params' envían los datos como ?tipo=FC&letra=A... automáticamente
    return this.http.get<Prestacion[]>(`${this.apiUrl}/buscar`, { params: filtros });
  }

  guardarParcialmente(payload: any) {
    // Si tu backend corre en el 8080, tenés que poner la ruta completa:
    return this.http.post('http://localhost:8080/api/auditoria/guardar-parcialmente', payload);

    // O si en tu archivo ya tenés una variable definida como "this.apiUrl", usala así:
    // return this.http.post(`${this.apiUrl}/guardar-parcialmente`, payload);
  }
}
