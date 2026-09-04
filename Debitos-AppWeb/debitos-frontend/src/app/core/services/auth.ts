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

  guardarToken(token: string, usuario: string, rol?: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', usuario);
    if (rol) {
      localStorage.setItem('rol', rol);
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
  }

  obtenerUsuario(): string {
    return localStorage.getItem('usuario') || 'Desconocido';
  }

  obtenerRol(): string {
    return (localStorage.getItem('rol') || 'OPERADOR').toUpperCase();
  }

  hasRole(rol: string): boolean {
    if (!rol) return false;
    return this.obtenerRol() === rol.trim().toUpperCase();
  }

  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const rolActual = this.obtenerRol();
    return roles.some(r => r.trim().toUpperCase() === rolActual);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }
}
