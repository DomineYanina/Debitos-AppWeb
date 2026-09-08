import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth';
import { vi } from 'vitest';

describe('roleGuard', () => {
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      isLoggedIn: vi.fn(),
      hasAnyRole: vi.fn()
    };
    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('debería bloquear y redirigir a /login si no está logueado', () => {
    authServiceMock.isLoggedIn.mockReturnValue(false);
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('debería permitir acceso si la ruta no define roles restringidos', () => {
    authServiceMock.isLoggedIn.mockReturnValue(true);
    const route = { data: {} } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('debería permitir acceso si el usuario posee alguno de los roles requeridos', () => {
    authServiceMock.isLoggedIn.mockReturnValue(true);
    authServiceMock.hasAnyRole.mockReturnValue(true);
    const route = { data: { roles: ['ADMIN', 'SUPERVISOR'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(true);
    expect(authServiceMock.hasAnyRole).toHaveBeenCalledWith(['ADMIN', 'SUPERVISOR']);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('debería bloquear y redirigir a /auditoria si no posee los roles requeridos', () => {
    authServiceMock.isLoggedIn.mockReturnValue(true);
    authServiceMock.hasAnyRole.mockReturnValue(false);
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auditoria']);
  });
});
