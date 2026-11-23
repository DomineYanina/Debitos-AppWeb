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
      if (isAuth && this.tieneAccesoNotificaciones()) {
        this.cargarNotificaciones();
      } else if (!isAuth) {
        this.notificacionesSubject.next([]);
        this.noLeidasCountSubject.next(0);
      }
    });
    this.authService.rolActual$?.subscribe(() => {
      if (this.tieneAccesoNotificaciones()) {
        this.cargarNotificaciones();
      }
    });
  }

  public tieneAccesoNotificaciones(): boolean {
    return !!this.authService.isLoggedIn() && (
      (this.authService.esAdminReal ? this.authService.esAdminReal() : false) ||
      (this.authService.isAdmin ? this.authService.isAdmin() : false) ||
      (this.authService.hasRole ? this.authService.hasRole('OPERADOR_CONTADURIA') : false) ||
      (this.authService.obtenerRol ? this.authService.obtenerRol() === 'OPERADOR_CONTADURIA' : false) ||
      (this.authService.obtenerRolReal ? this.authService.obtenerRolReal() === 'OPERADOR_CONTADURIA' : false)
    );
  }

  public iniciarPolling() {
    if (this.tieneAccesoNotificaciones()) {
      this.cargarNotificaciones();
    }
    if (!this.pollingSub) {
      this.pollingSub = interval(25000).subscribe(() => {
        if (this.tieneAccesoNotificaciones()) {
          this.cargarNotificaciones();
        }
      });
    }
  }

  public cargarNotificaciones() {
    if (!this.authService.isLoggedIn()) return;

    const rol = this.authService.obtenerRol ? this.authService.obtenerRol() : '';
    const usuario = this.authService.obtenerUsuario ? this.authService.obtenerUsuario() : '';
    const params: Record<string, string> = {};
    if (rol && rol !== 'ADMIN') params['rol'] = rol;
    if (usuario) params['usuario'] = usuario;
    const options = Object.keys(params).length > 0 ? { params } : {};

    this.http.get<Notificacion[]>(`${this.apiUrl}/recientes`, options).subscribe({
      next: (data: Notificacion[]) => {
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
    const usuario = this.authService.obtenerUsuario ? this.authService.obtenerUsuario() : '';
    this.http.put(`${this.apiUrl}/${id}/leer`, { usuario }).subscribe({
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
    const rol = this.authService.obtenerRol ? this.authService.obtenerRol() : '';
    const usuario = this.authService.obtenerUsuario ? this.authService.obtenerUsuario() : '';
    const options: { params?: Record<string, string> } = (rol && rol !== 'ADMIN') ? { params: { rol } } : {};
    this.http.put(`${this.apiUrl}/leer-todas`, { usuario, rol }, options).subscribe({
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

  public solicitarAnulacionDocumento(documento: { tipoDoc: string; letraDoc: string; puntoVenta: number; numero: number }, motivo?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar-anulacion`, {
      usuario: this.authService.obtenerUsuario(),
      tipoDoc: documento.tipoDoc,
      letraDoc: documento.letraDoc,
      puntoVenta: documento.puntoVenta,
      numero: documento.numero,
      motivo: motivo || ''
    });
  }

  public cancelarSolicitudAnulacionDocumento(documento: { tipoDoc: string; letraDoc: string; puntoVenta: number; numero: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancelar-solicitud-anulacion`, {
      usuario: this.authService.obtenerUsuario(),
      tipoDoc: documento.tipoDoc,
      letraDoc: documento.letraDoc,
      puntoVenta: documento.puntoVenta,
      numero: documento.numero
    });
  }

  public rechazarSolicitudAnulacion(datos: { idNotificacion?: number | null; tipoDoc?: string; letraDoc?: string; puntoVenta?: number; numero?: number; motivoRechazo?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/rechazar-solicitud-anulacion`, {
      usuario: this.authService.obtenerUsuario(),
      idNotificacion: datos.idNotificacion,
      tipoDoc: datos.tipoDoc,
      letraDoc: datos.letraDoc,
      puntoVenta: datos.puntoVenta,
      numero: datos.numero,
      motivoRechazo: datos.motivoRechazo || ''
    });
  }
}
