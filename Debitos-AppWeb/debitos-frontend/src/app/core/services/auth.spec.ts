import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debería crearse correctamente con estado inicial no autenticado', () => {
    expect(service).toBeTruthy();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.obtenerUsuario()).toBe('');
    expect(service.obtenerRolReal()).toBe('');
    expect(service.obtenerRol()).toBe('');
    expect(service.esAdminReal()).toBe(false);
    expect(service.isAdmin()).toBe(false);
  });

  it('debería manejar login HTTP POST', () => {
    const credenciales = { usuario: 'admin', password: '123' };
    const dummyResponse = { token: 'jwt.token.abc', usuario: 'admin', rol: 'ADMIN' };

    service.login(credenciales).subscribe(res => {
      expect(res).toEqual(dummyResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credenciales);
    req.flush(dummyResponse);
  });

  it('debería verificar usuario mediante HTTP GET', () => {
    service.verificarUsuario('operador 1').subscribe(res => {
      expect(res).toEqual({ existe: true });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/verificar-usuario/operador%201`);
    expect(req.request.method).toBe('GET');
    req.flush({ existe: true });
  });

  it('debería cambiar clave mediante HTTP POST', () => {
    service.cambiarClave('admin', 'nuevaClave123').subscribe(res => {
      expect(res).toEqual({ exito: true });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/cambiar-clave`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuario: 'admin', nuevaClave: 'nuevaClave123' });
    req.flush({ exito: true });
  });

  it('debería obtener roles disponibles mediante HTTP GET', () => {
    const mockRoles = ['ADMIN', 'OPERADOR', 'SUPERVISOR'];
    service.obtenerRolesDisponibles().subscribe(roles => {
      expect(roles).toEqual(mockRoles);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/roles`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRoles);
  });

  it('debería guardar token y sincronizar observables y localStorage', () => {
    let authState: boolean | undefined;
    let rolActual: string | undefined;

    service.autenticado$.subscribe(val => authState = val);
    service.rolActual$.subscribe(val => rolActual = val);

    service.guardarToken('token123', 'juan', 'ADMIN');

    expect(localStorage.getItem('token')).toBe('token123');
    expect(localStorage.getItem('usuario')).toBe('juan');
    expect(localStorage.getItem('rol')).toBe('ADMIN');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.obtenerUsuario()).toBe('juan');
    expect(service.obtenerRolReal()).toBe('ADMIN');
    expect(service.obtenerRol()).toBe('ADMIN');
    expect(service.esAdminReal()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(authState).toBe(true);
    expect(rolActual).toBe('ADMIN');
  });

  it('debería guardar token sin rol explícito', () => {
    service.guardarToken('token999', 'maria');
    expect(localStorage.getItem('token')).toBe('token999');
    expect(localStorage.getItem('usuario')).toBe('maria');
    expect(localStorage.getItem('rol')).toBeNull();
    expect(service.obtenerRol()).toBe('');
  });

  it('debería realizar logout y limpiar estado', () => {
    service.guardarToken('token123', 'juan', 'ADMIN');
    expect(service.isLoggedIn()).toBe(true);

    let authState: boolean | undefined;
    service.autenticado$.subscribe(val => authState = val);

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('rol')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.obtenerUsuario()).toBe('');
    expect(service.obtenerRol()).toBe('');
    expect(authState).toBe(false);
  });

  it('debería permitir simular roles y retornar rol simulado', () => {
    service.guardarToken('token123', 'admin', 'ADMIN');
    expect(service.obtenerRolReal()).toBe('ADMIN');
    expect(service.obtenerRol()).toBe('ADMIN');

    let rolSimulado: string | null | undefined;
    service.rolSimulado$.subscribe(val => rolSimulado = val);

    service.simularRol('OPERADOR');
    expect(rolSimulado).toBe('OPERADOR');
    expect(service.obtenerRolReal()).toBe('ADMIN');
    expect(service.obtenerRol()).toBe('OPERADOR');
    expect(service.isAdmin()).toBe(false);
    expect(service.hasRole('OPERADOR')).toBe(true);

    service.simularRol(null);
    expect(service.obtenerRol()).toBe('ADMIN');
    expect(service.isAdmin()).toBe(true);
  });

  it('debería validar hasRole y hasAnyRole correctamente', () => {
    service.guardarToken('token123', 'admin', 'ADMIN');

    expect(service.hasRole('')).toBe(false);
    expect(service.hasRole('admin')).toBe(true);
    expect(service.hasRole('OPERADOR')).toBe(false);

    expect(service.hasAnyRole([])).toBe(true);
    expect(service.hasAnyRole(['OPERADOR', 'ADMIN'])).toBe(true);
    expect(service.hasAnyRole(['AUDITOR', 'INVITADO'])).toBe(false);
  });
});
