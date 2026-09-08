import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/auth`;

  private autenticadoSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public autenticado$ = this.autenticadoSubject.asObservable();

  private rolSimuladoSubject = new BehaviorSubject<string | null>(null);
  public rolSimulado$ = this.rolSimuladoSubject.asObservable();

  private rolActualSubject = new BehaviorSubject<string>(this.obtenerRol());
  public rolActual$ = this.rolActualSubject.asObservable();

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
    this.rolSimuladoSubject.next(null);
    this.rolActualSubject.next(this.obtenerRol());
    this.autenticadoSubject.next(true);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    this.rolSimuladoSubject.next(null);
    this.rolActualSubject.next('');
    this.autenticadoSubject.next(false);
  }

  obtenerUsuario(): string {
    if (!this.isLoggedIn()) return '';
    return localStorage.getItem('usuario') || '';
  }

  obtenerRolReal(): string {
    if (!this.isLoggedIn()) return '';
    return (localStorage.getItem('rol') || '').toUpperCase();
  }

  obtenerRol(): string {
    if (!this.isLoggedIn()) return '';
    const simulado = this.rolSimuladoSubject.value;
    if (simulado && simulado.trim().length > 0) {
      return simulado.toUpperCase();
    }
    return this.obtenerRolReal();
  }

  simularRol(rol: string | null) {
    this.rolSimuladoSubject.next(rol);
    this.rolActualSubject.next(this.obtenerRol());
  }

  esAdminReal(): boolean {
    return this.obtenerRolReal() === 'ADMIN';
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

  obtenerRolesDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles`);
  }
}

