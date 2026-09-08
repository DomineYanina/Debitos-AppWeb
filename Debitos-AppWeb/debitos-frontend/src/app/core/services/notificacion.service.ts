import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacion } from '../models/notificacion.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/notificaciones`;

  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$ = this.notificacionesSubject.asObservable();

  private noLeidasCountSubject = new BehaviorSubject<number>(0);
  public noLeidasCount$ = this.noLeidasCountSubject.asObservable();

  // Emite cuando se selecciona una notificación para que la vista de Auditoría abra ese comprobante o muestre el modal de reporte
  private notificacionSeleccionadaSubject = new Subject<Notificacion>();
  public notificacionSeleccionada$ = this.notificacionSeleccionadaSubject.asObservable();

  private pollingSub?: Subscription;

  constructor() {
    this.iniciarPolling();
    this.authService.autenticado$.subscribe(isAuth => {
      if (isAuth && (this.authService.esAdminReal() || this.authService.isAdmin())) {
        this.cargarNotificaciones();
      } else if (!isAuth) {
        this.notificacionesSubject.next([]);
        this.noLeidasCountSubject.next(0);
      }
    });
  }

  public iniciarPolling() {
    if (this.authService.isLoggedIn() && (this.authService.esAdminReal() || this.authService.isAdmin())) {
      this.cargarNotificaciones();
    }
    if (!this.pollingSub) {
      this.pollingSub = interval(25000).subscribe(() => {
        if (this.authService.isLoggedIn() && (this.authService.esAdminReal() || this.authService.isAdmin())) {
          this.cargarNotificaciones();
        }
      });
    }
  }

  public cargarNotificaciones() {
    if (!this.authService.isLoggedIn()) return;

    this.http.get<Notificacion[]>(`${this.apiUrl}/recientes`).subscribe({
      next: (data) => {
        const procesadas = (data || []).map(n => ({
          ...n,
          leida: n.leida === true
        }));

        this.notificacionesSubject.next(procesadas);
        const countNoLeidas = procesadas.filter(n => !n.leida).length;
        this.noLeidasCountSubject.next(countNoLeidas);
      },
      error: () => {
        // Silencioso para no saturar consola
      }
    });
  }

  public marcarComoLeida(id: number) {
    // Actualización optimista en UI
    const listaActual = this.notificacionesSubject.value.map(n => {
      if (n.id === id) {
        return { ...n, leida: true };
      }
      return n;
    });

    this.notificacionesSubject.next(listaActual);
    this.noLeidasCountSubject.next(listaActual.filter(n => !n.leida).length);

    // Persistir en backend
    this.http.put(`${this.apiUrl}/${id}/leer`, {}).subscribe({
      error: (err) => console.warn('No se pudo persistir lectura de notificación en BD:', err)
    });
  }

  public marcarTodasComoLeidas() {
    // Actualización optimista en UI
    const actualizadas = this.notificacionesSubject.value.map(n => ({ ...n, leida: true }));
    this.notificacionesSubject.next(actualizadas);
    this.noLeidasCountSubject.next(0);

    // Persistir en backend
    this.http.put(`${this.apiUrl}/leer-todas`, {}).subscribe({
      error: (err) => console.warn('No se pudo persistir lectura masiva de notificaciones en BD:', err)
    });
  }

  public navegarAComprobante(notif: Notificacion) {
    this.marcarComoLeida(notif.id);
    this.notificacionSeleccionadaSubject.next(notif);
  }

  public reportarDocumentoNoEncontrado(documento: { tipo: string; letra: string; puntoVenta: number; numero: number }, detalle?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reportar-no-encontrado`, {
      usuario: this.authService.obtenerUsuario(),
      tipoDoc: documento.tipo,
      letraDoc: documento.letra,
      puntoVenta: documento.puntoVenta,
      numero: documento.numero,
      detalle: detalle || ''
    });
  }
}
