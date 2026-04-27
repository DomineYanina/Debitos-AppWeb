import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { authInterceptor } from './auth-interceptor';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    // 1. Usamos el localStorage real del entorno de pruebas
    localStorage.setItem('token', 'mi-token-falso-123');

    // 2. Preparamos los espías
    authServiceSpy = {
      logoutLlamado: false,
      logout: function() { this.logoutLlamado = true; }
    };

    routerSpy = {
      rutaNavegada: '',
      navigate: function(rutas: any[]) { this.rutaNavegada = rutas[0]; }
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    // 3. Limpiamos la basura para que no afecte a otros tests
    localStorage.removeItem('token');
    httpMock.verify();
  });

  it('debería agregar el token de autorización en la cabecera (Camino de Ida)', () => {
    httpClient.get('/api/prueba').subscribe();

    const peticion = httpMock.expectOne('/api/prueba');

    expect(peticion.request.headers.has('Authorization')).toBe(true);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer mi-token-falso-123');

    peticion.flush({});
  });

  it('debería desloguear y redirigir al login si recibe un error 401 (Camino de Vuelta)', () => {
    httpClient.get('/api/prueba').subscribe({ error: () => {} });

    const peticion = httpMock.expectOne('/api/prueba');

    // Forzamos al servidor falso a responder con error 401
    peticion.flush('Sesión expirada', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logoutLlamado).toBe(true);
    expect(routerSpy.rutaNavegada).toBe('/login');
  });

  it('NO debería desloguear si recibe un error que no sea 401', () => {
    httpClient.get('/api/prueba').subscribe({ error: () => {} });

    const peticion = httpMock.expectOne('/api/prueba');

    // Forzamos un error de servidor interno
    peticion.flush('Error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(authServiceSpy.logoutLlamado).toBe(false);
    expect(routerSpy.rutaNavegada).toBe('');
  });
});
