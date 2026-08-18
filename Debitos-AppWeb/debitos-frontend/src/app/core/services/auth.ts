import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/auth`;

  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }

  verificarUsuario(usuario: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verificar-usuario/${encodeURIComponent(usuario)}`);
  }

  cambiarClave(usuario: string, nuevaClave: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cambiar-clave`, { usuario, nuevaClave });
  }

  guardarToken(token: string, usuario: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', usuario);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  obtenerUsuario(): string {
    return localStorage.getItem('usuario') || 'Desconocido';
  }
}
