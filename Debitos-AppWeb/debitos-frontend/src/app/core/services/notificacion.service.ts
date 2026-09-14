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
        const ordenadas = this.ordenarNotificaciones(procesadas);

        this.notificacionesSubject.next(ordenadas);
        const countNoLeidas = ordenadas.filter(n => !n.leida).length;
        this.noLeidasCountSubject.next(countNoLeidas);
      },
      error: () => {
        // Silencioso para no saturar consola
      }
    });
  }

  public ordenarNotificaciones(lista: Notificacion[]): Notificacion[] {
    return [...lista].sort((a, b) => {
      const aLeida = a.leida === true ? 1 : 0;
      const bLeida = b.leida === true ? 1 : 0;
      if (aLeida !== bLeida) {
        return aLeida - bLeida; // No leídas (0) van arriba, leídas (1) van al fondo
      }
      const timeA = this.obtenerTimestamp(a.fechaHora);
      const timeB = this.obtenerTimestamp(b.fechaHora);
      if (timeA !== timeB) {
        // No leídas: más recientes primero (descendente)
        // Leídas: orden cronológico, más antiguas primero (ascendente)
        return aLeida === 0 ? timeB - timeA : timeA - timeB;
      }
      return aLeida === 0 ? (b.id ?? 0) - (a.id ?? 0) : (a.id ?? 0) - (b.id ?? 0);
    });
  }

  private obtenerTimestamp(fecha?: string): number {
    if (!fecha) return 0;
    const time = new Date(fecha).getTime();
    return isNaN(time) ? 0 : time;
  }

  public marcarComoLeida(id: number) {
    // Actualización optimista en UI
    const listaActual = this.notificacionesSubject.value.map(n => {
      if (n.id === id) {
        return { ...n, leida: true };
      }
      return n;
    });
    const ordenadas = this.ordenarNotificaciones(listaActual);

    this.notificacionesSubject.next(ordenadas);
    this.noLeidasCountSubject.next(ordenadas.filter(n => !n.leida).length);

    // Persistir en backend
    this.http.put(`${this.apiUrl}/${id}/leer`, {}).subscribe({
      error: (err) => console.warn('No se pudo persistir lectura de notificación en BD:', err)
    });
  }

  public marcarTodasComoLeidas() {
    // Actualización optimista en UI
    const actualizadas = this.notificacionesSubject.value.map(n => ({ ...n, leida: true }));
    const ordenadas = this.ordenarNotificaciones(actualizadas);
    this.notificacionesSubject.next(ordenadas);
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
