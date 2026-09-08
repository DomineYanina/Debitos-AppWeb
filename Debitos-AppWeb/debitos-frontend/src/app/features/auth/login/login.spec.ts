import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      loginResult: null,
      verificarResult: null,
      cambiarClaveResult: null,
      login: function(credenciales: any) {
        return this.loginResult || of({ token: 'abc', usuario: 'admin', rol: 'ADMIN' });
      },
      verificarUsuario: function(usuario: string) {
        return this.verificarResult || of({ existe: true, usuario });
      },
      cambiarClave: function(usuario: string, nuevaClave: string) {
        return this.cambiarClaveResult || of({ mensaje: 'ok' });
      },
      guardarToken: vi.fn(),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse el componente', () => {
    expect(component).toBeTruthy();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('debería realizar login exitoso, guardar token y navegar a /auditoria', () => {
    component.loginForm.setValue({ usuario: 'admin', password: '123' });
    component.onSubmit();

    expect(mockAuthService.guardarToken).toHaveBeenCalledWith('abc', 'admin', 'ADMIN');
    expect(router.navigate).toHaveBeenCalledWith(['/auditoria']);
    expect(component.cargando).toBe(false);
  });

  it('debería mostrar mensaje de credenciales incorrectas si el servidor responde con 401', () => {
    const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    mockAuthService.loginResult = throwError(() => error401);

    component.loginForm.setValue({ usuario: 'admin', password: 'bad' });
    component.onSubmit();

    expect(component.mensajeError).toBe('Las credenciales ingresadas son incorrectas. Por favor, verifique su usuario y contraseña.');
    expect(component.cargando).toBe(false);
  });

  it('debería mostrar mensaje de servidor no disponible si el status es 0 o 500', () => {
    const errorServerDown = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    mockAuthService.loginResult = throwError(() => errorServerDown);

    component.loginForm.setValue({ usuario: 'admin', password: 'bad' });
    component.onSubmit();

    expect(component.mensajeError).toBe('El servidor no está disponible. Por favor, verifique que el servicio esté activo o intente más tarde.');
    expect(component.cargando).toBe(false);

    // Status desconocido
    const errorGenerico = new HttpErrorResponse({ status: 418, statusText: 'Teapot' });
    mockAuthService.loginResult = throwError(() => errorGenerico);
    component.onSubmit();
    expect(component.mensajeError).toBe('Ocurrió un error al intentar iniciar sesión. Por favor, intente nuevamente.');
  });

  it('debería alternar mostrarPassword, mostrarNuevaPassword y mostrarConfirmarPassword', () => {
    expect(component.mostrarPassword).toBe(false);
    component.toggleMostrarPassword();
    expect(component.mostrarPassword).toBe(true);

    expect(component.mostrarNuevaPassword).toBe(false);
    component.toggleMostrarNuevaPassword();
    expect(component.mostrarNuevaPassword).toBe(true);

    expect(component.mostrarConfirmarPassword).toBe(false);
    component.toggleMostrarConfirmarPassword();
    expect(component.mostrarConfirmarPassword).toBe(true);
  });

  it('debería advertir si se presiona Olvidé mi contraseña sin ingresar un usuario', () => {
    component.loginForm.patchValue({ usuario: '' });
    component.onOlvidePassword();
    expect(component.mensajeError).toBe('Por favor, ingrese su nombre de usuario para recuperar la contraseña.');
  });

  it('debería manejar errores en verificarUsuario (status 404, 0 y genérico)', () => {
    const error404 = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    mockAuthService.verificarResult = throwError(() => error404);
    component.loginForm.patchValue({ usuario: 'inexistente' });
    component.onOlvidePassword();
    expect(component.mensajeError).toContain('El usuario ingresado no existe');

    const error0 = new HttpErrorResponse({ status: 0 });
    mockAuthService.verificarResult = throwError(() => error0);
    component.onOlvidePassword();
    expect(component.mensajeError).toContain('El servidor no está disponible');

    const error500 = new HttpErrorResponse({ status: 500 });
    mockAuthService.verificarResult = throwError(() => error500);
    component.onOlvidePassword();
    expect(component.mensajeError).toContain('Ocurrió un error al verificar el usuario');
  });

  it('debería abrir y cerrar el modal de cambio de clave', () => {
    mockAuthService.verificarResult = of({ existe: true, usuario: 'admin' });
    component.loginForm.patchValue({ usuario: 'admin' });
    component.onOlvidePassword();

    expect(component.mostrarModalOlvideClave).toBe(true);
    expect(component.usuarioVerificado).toBe('admin');

    component.cerrarModalOlvideClave();
    expect(component.mostrarModalOlvideClave).toBe(false);
    expect(component.usuarioVerificado).toBe('');
  });

  it('debería validar formulario de modal de cambio de clave y manejar errores', () => {
    component.usuarioVerificado = 'admin';
    component.mostrarModalOlvideClave = true;

    // Invalido
    component.modalForm.patchValue({ nuevaClave: '', confirmarClave: '' });
    component.onSubmitCambiarClave();
    expect(component.cargandoCambioClave).toBe(false);

    // No coinciden
    component.modalForm.patchValue({ nuevaClave: 'clave123', confirmarClave: 'otraClave' });
    component.onSubmitCambiarClave();
    expect(component.mensajeErrorModal).toBe('Las contraseñas ingresadas no coinciden.');

    // Error 404
    mockAuthService.cambiarClaveResult = throwError(() => new HttpErrorResponse({ status: 404 }));
    component.modalForm.patchValue({ nuevaClave: 'clave1234', confirmarClave: 'clave1234' });
    component.onSubmitCambiarClave();
    expect(component.mensajeErrorModal).toContain('El usuario no fue encontrado');

    // Error genérico
    mockAuthService.cambiarClaveResult = throwError(() => new HttpErrorResponse({ status: 500 }));
    component.onSubmitCambiarClave();
    expect(component.mensajeErrorModal).toContain('Ocurrió un error al intentar modificar la contraseña');
  });

  it('debería invocar cambiarClave con éxito en el modal', () => {
    mockAuthService.cambiarClaveResult = of({ mensaje: 'ok' });
    component.usuarioVerificado = 'admin';
    component.mostrarModalOlvideClave = true;
    component.modalForm.patchValue({ nuevaClave: 'clave1234', confirmarClave: 'clave1234' });

    component.onSubmitCambiarClave();
    expect(component.mensajeExitoModal).toContain('¡Contraseña modificada con éxito!');
  });
});
