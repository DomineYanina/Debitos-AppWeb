import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, fromEvent, merge, timer, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth'; // Ajustá la ruta a tu servicio
import { AuditoriaService } from './auditoria';

@Injectable({
  providedIn: 'root'
})
export class InactividadService {
  private router = inject(Router);
  private authService = inject(AuthService);
  private auditoriaService = inject(AuditoriaService);
  private ngZone = inject(NgZone);

  private timeoutSub?: Subscription;
  private idoneidadUsuario$ = new Subject<void>();

  // 30 minutos en milisegundos
  private readonly TIEMPO_INACTIVIDAD = 30 * 60 * 1000;

  iniciarSeguimiento() {
    // Escuchamos eventos comunes de actividad
    const eventos$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'click'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart')
    );

    // NgZone.runOutsideAngular es clave para que estos eventos constantes
    // no disparen el Change Detection de Angular miles de veces por segundo.
    this.ngZone.runOutsideAngular(() => {
      this.timeoutSub = eventos$.pipe(
        // Cada vez que hay un evento, reiniciamos el timer
        switchMap(() => timer(this.TIEMPO_INACTIVIDAD)),
        tap(() => {
          // Cuando el timer llega a cero, volvemos a la zona de Angular para el logout
          this.ngZone.run(() => this.cerrarSesionPorInactividad());
        })
      ).subscribe();
    });
  }

  pararSeguimiento() {
    if (this.timeoutSub) {
      this.timeoutSub.unsubscribe();
    }
  }

  private cerrarSesionPorInactividad() {
    // Registramos el evento en tu telemetría antes de sacarlo
    const usuario = this.authService.obtenerUsuario();

    this.auditoriaService.registrarMetricaUsabilidad({
      usuario: usuario,
      documentoReferencia: 'SISTEMA_GLOBAL',
      evento: 'CIERRE_SESION_POR_INACTIVIDAD_30MIN',
      fechaHora: new Date().toISOString(),
      cantidadRegistrosPendientes: 0
    }).subscribe({
      complete: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
        // Podés usar tu componente de alerta para avisarle por qué salió
        alert('Tu sesión ha expirado por inactividad de 30 minutos.');
      }
    });
  }
}
