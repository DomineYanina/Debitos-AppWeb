import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { InactividadService } from './InactividadService';
import { AuthService } from './auth';
import { AuditoriaService } from './auditoria';
import { expect, vi } from 'vitest';

describe('InactividadService', () => {
  let service: InactividadService;
  let authServiceMock: any;
  let auditoriaServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      obtenerUsuario: vi.fn().mockReturnValue('usuario_test'),
      logout: vi.fn()
    };
    auditoriaServiceMock = {
      registrarMetricaUsabilidad: vi.fn().mockReturnValue(of({ exito: true }))
    };
    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        InactividadService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: AuditoriaService, useValue: auditoriaServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(InactividadService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('iniciarSeguimiento y pararSeguimiento deberían gestionar la subscripción de eventos', () => {
    service.iniciarSeguimiento();
    expect((service as any).timeoutSub).toBeDefined();

    service.pararSeguimiento();
    expect((service as any).timeoutSub.closed).toBe(true);
  });

  it('cerrarSesionPorInactividad debería registrar métrica, hacer logout y redirigir a /login', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    (service as any).cerrarSesionPorInactividad();

    expect(auditoriaServiceMock.registrarMetricaUsabilidad).toHaveBeenCalledWith(expect.objectContaining({
      usuario: 'usuario_test',
      evento: 'CIERRE_SESION_POR_INACTIVIDAD_30MIN'
    }));
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    expect(alertSpy).toHaveBeenCalledWith('Tu sesión ha expirado por inactividad de 30 minutos.');

    alertSpy.mockRestore();
  });
});
