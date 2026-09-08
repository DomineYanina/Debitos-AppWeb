import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificacionService } from '../../services/notificacion.service';
import { Notificacion } from '../../models/notificacion.model';
import { TourService } from '../../services/tour.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  public notificacionService = inject(NotificacionService);
  private tourService = inject(TourService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  usuarioLogueado: string = '';
  rolActual: string = '';
  esAdminReal: boolean = false;
  rolSimulado: string = '';

  rolesDisponibles: string[] = [];
  notificaciones: Notificacion[] = [];
  noLeidasCount: number = 0;

  notificacionesAbiertas: boolean = false;
  menuUsuarioAbierto: boolean = false;

  private subs: Subscription = new Subscription();

  get mostrarNavbar(): boolean {
    const enLogin = this.router.url.includes('/login');
    return this.authService.isLoggedIn() && !enLogin;
  }

  ngOnInit(): void {
    this.actualizarEstadoUsuario();

    this.subs.add(
      this.authService.autenticado$.subscribe(isAuth => {
        if (isAuth) {
          this.actualizarEstadoUsuario();
        } else {
          this.usuarioLogueado = '';
          this.esAdminReal = false;
          this.rolActual = '';
          this.rolSimulado = '';
          this.rolesDisponibles = [];
        }
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.authService.rolActual$.subscribe(rol => {
        if (this.authService.isLoggedIn()) {
          this.rolActual = rol;
          this.usuarioLogueado = this.authService.obtenerUsuario();
          this.esAdminReal = this.authService.esAdminReal();
          this.cdr.markForCheck();
        }
      })
    );

    this.subs.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.actualizarEstadoUsuario();
        }
      })
    );

    this.subs.add(
      this.notificacionService.notificaciones$.subscribe(list => {
        this.notificaciones = list;
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.notificacionService.noLeidasCount$.subscribe(count => {
        this.noLeidasCount = count;
        this.cdr.markForCheck();
      })
    );
  }

  private actualizarEstadoUsuario(): void {
    if (this.authService.isLoggedIn()) {
      this.usuarioLogueado = this.authService.obtenerUsuario();
      this.esAdminReal = this.authService.esAdminReal();
      this.rolActual = this.authService.obtenerRol();
      this.rolSimulado = this.authService.obtenerRolReal() !== this.rolActual ? this.rolActual : '';

      if (this.esAdminReal) {
        this.authService.obtenerRolesDisponibles().subscribe({
          next: (roles) => {
            this.rolesDisponibles = roles || [];
            this.cdr.markForCheck();
          },
          error: (err) => console.warn('Error al cargar roles dinámicos:', err)
        });
        this.notificacionService.cargarNotificaciones();
      }
    } else {
      this.usuarioLogueado = '';
      this.esAdminReal = false;
      this.rolActual = '';
      this.rolSimulado = '';
      this.rolesDisponibles = [];
    }
    this.cdr.markForCheck();
  }

  formatearNombreRol(rol: string): string {
    if (!rol) return '';
    const upper = rol.trim().toUpperCase();
    if (upper === 'ADMIN') return 'Administrador del Sistema';
    if (upper === 'OPERADOR') return 'Operador de Débitos';
    if (upper === 'AUDITOR') return 'Auditor (Solo Consulta)';
    if (upper === 'DIRECTORIO') return 'Directorio';
    return rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
  }

  get mostrarSubtituloRol(): boolean {
    if (!this.rolActual) return false;
    const desc = this.formatearNombreRol(this.rolActual);
    return desc.trim().toLowerCase() !== this.usuarioLogueado.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleNotificaciones(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificacionesAbiertas = !this.notificacionesAbiertas;
    this.menuUsuarioAbierto = false;
    if (this.notificacionesAbiertas) {
      this.notificacionService.cargarNotificaciones();
    }
  }

  toggleMenuUsuario(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
    this.notificacionesAbiertas = false;
  }

  cambiarRolSimulado(nuevoRol: string): void {
    if (nuevoRol === 'REAL' || !nuevoRol) {
      this.authService.simularRol(null);
      this.rolSimulado = '';
    } else {
      this.authService.simularRol(nuevoRol);
      this.rolSimulado = nuevoRol;
    }
  }

  marcarComoLeida(notif: Notificacion, event: Event): void {
    event.stopPropagation();
    this.notificacionService.marcarComoLeida(notif.id);
  }

  marcarTodasComoLeidas(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificacionService.marcarTodasComoLeidas();
  }

  iniciarTourGuiado(): void {
    if (this.router.url !== '/auditoria') {
      this.router.navigate(['/auditoria']).then(() => {
        setTimeout(() => {
          this.tourService.startFullTour(true);
        }, 350);
      });
    } else {
      this.tourService.startFullTour(true);
    }
  }

  abrirComprobante(notif: Notificacion): void {
    this.notificacionesAbiertas = false;
    this.notificacionService.navegarAComprobante(notif);
  }

  onLogout(): void {
    this.menuUsuarioAbierto = false;
    this.notificacionesAbiertas = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatearFecha(fechaStr?: string): string {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return fechaStr;

      const hoy = new Date();
      const diffMs = hoy.getTime() - fecha.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHoras = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHoras < 24) return `Hace ${diffHoras} h`;

      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.notificacionesAbiertas = false;
      this.menuUsuarioAbierto = false;
    }
  }
}
