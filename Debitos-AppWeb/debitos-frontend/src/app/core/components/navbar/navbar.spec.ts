import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../services/auth';
import { NotificacionService } from '../../services/notificacion.service';
import { TourService } from '../../services/tour.service';
import { vi } from 'vitest';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceSpy: any;
  let notificacionServiceSpy: any;
  let tourServiceSpy: any;
  let router: Router;

  let autenticadoSub: Subject<boolean>;
  let rolActualSub: Subject<string>;
  let notificacionesSub: Subject<any[]>;
  let noLeidasCountSub: Subject<number>;

  beforeEach(async () => {
    autenticadoSub = new Subject<boolean>();
    rolActualSub = new Subject<string>();
    notificacionesSub = new Subject<any[]>();
    noLeidasCountSub = new Subject<number>();

    authServiceSpy = {
      isLoggedIn: vi.fn().mockReturnValue(true),
      obtenerUsuario: vi.fn().mockReturnValue('admin_user'),
      esAdminReal: vi.fn().mockReturnValue(true),
      obtenerRol: vi.fn().mockReturnValue('ADMIN'),
      obtenerRolReal: vi.fn().mockReturnValue('ADMIN'),
      simularRol: vi.fn(),
      logout: vi.fn(),
      obtenerRolesDisponibles: vi.fn().mockReturnValue(of(['ADMIN', 'OPERADOR'])),
      autenticado$: autenticadoSub.asObservable(),
      rolActual$: rolActualSub.asObservable()
    };

    notificacionServiceSpy = {
      notificaciones$: notificacionesSub.asObservable(),
      noLeidasCount$: noLeidasCountSub.asObservable(),
      cargarNotificaciones: vi.fn(),
      marcarComoLeida: vi.fn(),
      marcarTodasComoLeidas: vi.fn(),
      navegarAComprobante: vi.fn()
    };

    tourServiceSpy = {
      startFullTour: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificacionService, useValue: notificacionServiceSpy },
        { provide: TourService, useValue: tourServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('debería crearse e inicializar datos del usuario autenticado', () => {
    expect(component).toBeTruthy();
    expect(component.usuarioLogueado).toBe('admin_user');
    expect(component.rolActual).toBe('ADMIN');
    expect(component.esAdminReal).toBe(true);
    expect(component.mostrarNavbar).toBe(true);
  });

  it('formatearNombreRol debería formatear roles conocidos y personalizados', () => {
    expect(component.formatearNombreRol('')).toBe('');
    expect(component.formatearNombreRol('ADMIN')).toBe('Administrador del Sistema');
    expect(component.formatearNombreRol('OPERADOR')).toBe('Operador de Débitos');
    expect(component.formatearNombreRol('AUDITOR')).toBe('Auditor (Solo Consulta)');
    expect(component.formatearNombreRol('DIRECTORIO')).toBe('Directorio');
    expect(component.formatearNombreRol('OTRO')).toBe('Otro');
  });

  it('mostrarSubtituloRol debería comparar descripción de rol con nombre de usuario', () => {
    component.rolActual = 'ADMIN';
    component.usuarioLogueado = 'admin';
    expect(component.mostrarSubtituloRol).toBe(true);

    component.rolActual = '';
    expect(component.mostrarSubtituloRol).toBe(false);
  });

  it('toggleNotificaciones y toggleMenuUsuario deberían alternar estados y cargar datos', () => {
    const ev = new MouseEvent('click');
    component.toggleNotificaciones(ev);
    expect(component.notificacionesAbiertas).toBe(true);
    expect(component.menuUsuarioAbierto).toBe(false);
    expect(notificacionServiceSpy.cargarNotificaciones).toHaveBeenCalled();

    component.toggleMenuUsuario(ev);
    expect(component.menuUsuarioAbierto).toBe(true);
    expect(component.notificacionesAbiertas).toBe(false);
  });

  it('cambiarRolSimulado debería invocar simularRol del servicio', () => {
    component.cambiarRolSimulado('OPERADOR');
    expect(authServiceSpy.simularRol).toHaveBeenCalledWith('OPERADOR');
    expect(component.rolSimulado).toBe('OPERADOR');

    component.cambiarRolSimulado('REAL');
    expect(authServiceSpy.simularRol).toHaveBeenCalledWith(null);
    expect(component.rolSimulado).toBe('');
  });

  it('marcarComoLeida y marcarTodasComoLeidas deberían delegar al servicio', () => {
    const notif = { id: 5 } as any;
    const ev = new MouseEvent('click');
    component.marcarComoLeida(notif, ev);
    expect(notificacionServiceSpy.marcarComoLeida).toHaveBeenCalledWith(5);

    component.marcarTodasComoLeidas(ev);
    expect(notificacionServiceSpy.marcarTodasComoLeidas).toHaveBeenCalled();
  });

  it('abrirComprobante y onLogout deberían cerrar dropdowns y navegar', () => {
    const notif = { id: 7 } as any;
    component.abrirComprobante(notif);
    expect(component.notificacionesAbiertas).toBe(false);
    expect(notificacionServiceSpy.navegarAComprobante).toHaveBeenCalledWith(notif);

    component.onLogout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('iniciarTourGuiado debería invocar startFullTour', () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/auditoria');
    component.iniciarTourGuiado();
    expect(tourServiceSpy.startFullTour).toHaveBeenCalledWith(true);

    vi.spyOn(router, 'url', 'get').mockReturnValue('/otra-ruta');
    component.iniciarTourGuiado();
    expect(router.navigate).toHaveBeenCalledWith(['/auditoria']);
  });

  it('formatearFecha debería formatear fechas relativas o locales', () => {
    expect(component.formatearFecha('')).toBe('');
    expect(component.formatearFecha('fecha-invalida')).toBe('fecha-invalida');

    const ahora = new Date().toISOString();
    expect(component.formatearFecha(ahora)).toBe('Hace un momento');

    const hace10Min = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(component.formatearFecha(hace10Min)).toContain('Hace 10 min');

    const hace2Horas = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(component.formatearFecha(hace2Horas)).toContain('Hace 2 h');

    const hace2Dias = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    expect(component.formatearFecha(hace2Dias)).toBeDefined();
  });

  it('debería limpiar propiedades si el usuario no está autenticado', () => {
    authServiceSpy.isLoggedIn.mockReturnValue(false);
    (component as any).actualizarEstadoUsuario();
    expect(component.usuarioLogueado).toBe('');
    expect(component.esAdminReal).toBe(false);
    expect(component.rolActual).toBe('');
    expect(component.rolesDisponibles).toEqual([]);
  });

  it('iniciarTourGuiado debería navegar a /auditoria si está en otra ruta', async () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/login');
    component.iniciarTourGuiado();
    expect(router.navigate).toHaveBeenCalledWith(['/auditoria']);
  });

  it('formatearFecha debería manejar fechas inválidas y excepciones', () => {
    expect(component.formatearFecha(undefined as any)).toBe('');
    expect(component.formatearFecha('fecha-invalida')).toBe('fecha-invalida');
  });

  it('mostrarSubtituloRol debería retornar false si rolActual está vacío', () => {
    component.rolActual = '';
    expect(component.mostrarSubtituloRol).toBe(false);
  });

  it('actualizarEstadoUsuario debería capturar error al cargar roles disponibles', () => {
    authServiceSpy.isLoggedIn.mockReturnValue(true);
    authServiceSpy.esAdminReal.mockReturnValue(true);
    authServiceSpy.obtenerRolesDisponibles.mockReturnValue(throwError(() => new Error('err')));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    (component as any).actualizarEstadoUsuario();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('onDocumentClick debería cerrar menús si el clic fue afuera', () => {
    component.notificacionesAbiertas = true;
    component.menuUsuarioAbierto = true;

    const fakeOutsideElement = document.createElement('div');
    document.body.appendChild(fakeOutsideElement);

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: fakeOutsideElement });

    component.onDocumentClick(event);

    expect(component.notificacionesAbiertas).toBe(false);
    expect(component.menuUsuarioAbierto).toBe(false);

    document.body.removeChild(fakeOutsideElement);
  });
});
