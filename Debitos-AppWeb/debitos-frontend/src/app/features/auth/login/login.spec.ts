import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      loginResult: null,
      verificarResult: null,
      cambiarClaveResult: null,
      login: function(credenciales: any) {
        return this.loginResult || of({ token: 'abc', usuario: 'admin' });
      },
      verificarUsuario: function(usuario: string) {
        return this.verificarResult || of({ existe: true, usuario });
      },
      cambiarClave: function(usuario: string, nuevaClave: string) {
        return this.cambiarClaveResult || of({ mensaje: 'ok' });
      },
      guardarToken: function(token: string, usuario: string) {}
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debería crearse el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar mensaje de credenciales incorrectas si el servidor responde con 401', () => {
    const error401 = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    mockAuthService.loginResult = throwError(() => error401);

    component.loginForm.setValue({ usuario: 'admin', password: 'bad' });
    component.onSubmit();

    expect(component.mensajeError).toBe('Las credenciales ingresadas son incorrectas. Por favor, verifique su usuario y contraseña.');
    expect(component.cargando).toBe(false);
  });

  it('debería mostrar mensaje de servidor no disponible si el status es 0', () => {
    const errorServerDown = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    mockAuthService.loginResult = throwError(() => errorServerDown);

    component.loginForm.setValue({ usuario: 'admin', password: 'bad' });
    component.onSubmit();

    expect(component.mensajeError).toBe('El servidor no está disponible. Por favor, verifique que el servicio esté activo o intente más tarde.');
    expect(component.cargando).toBe(false);
  });

  it('debería alternar el estado de mostrarPassword al llamar a toggleMostrarPassword()', () => {
    expect(component.mostrarPassword).toBe(false);
    component.toggleMostrarPassword();
    expect(component.mostrarPassword).toBe(true);
    component.toggleMostrarPassword();
    expect(component.mostrarPassword).toBe(false);
  });

  it('debería advertir si se presiona Olvidé mi contraseña sin ingresar un usuario', () => {
    component.loginForm.patchValue({ usuario: '' });
    component.onOlvidePassword();
    expect(component.mensajeError).toBe('Por favor, ingrese su nombre de usuario para recuperar la contraseña.');
  });

  it('debería mostrar error si el usuario verificado no existe (HTTP 404)', () => {
    const error404 = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    mockAuthService.verificarResult = throwError(() => error404);

    component.loginForm.patchValue({ usuario: 'inexistente' });
    component.onOlvidePassword();

    expect(component.mensajeError).toBe('El usuario ingresado no existe en el sistema. Por favor, verifique el nombre e intente nuevamente.');
    expect(component.mostrarModalOlvideClave).toBe(false);
  });

  it('debería abrir el modal si el usuario existe en la base de datos', () => {
    mockAuthService.verificarResult = of({ existe: true, usuario: 'admin' });

    component.loginForm.patchValue({ usuario: 'admin' });
    component.onOlvidePassword();

    expect(component.mostrarModalOlvideClave).toBe(true);
    expect(component.usuarioVerificado).toBe('admin');
  });

  it('debería mostrar error si las contraseñas no coinciden en el modal', () => {
    component.usuarioVerificado = 'admin';
    component.mostrarModalOlvideClave = true;
    component.modalForm.patchValue({ nuevaClave: 'clave123', confirmarClave: 'claveDiferente' });

    component.onSubmitCambiarClave();

    expect(component.mensajeErrorModal).toBe('Las contraseñas ingresadas no coinciden.');
  });

  it('debería invocar cambiarClave al confirmar en el modal', () => {
    let claveCambiada = false;
    mockAuthService.cambiarClave = function(usuario: string, nuevaClave: string) {
      claveCambiada = true;
      return of({ mensaje: 'ok' });
    };

    component.usuarioVerificado = 'admin';
    component.mostrarModalOlvideClave = true;
    component.modalForm.patchValue({ nuevaClave: 'clave1234', confirmarClave: 'clave1234' });

    component.onSubmitCambiarClave();

    expect(claveCambiada).toBe(true);
    expect(component.mensajeExitoModal).toContain('¡Contraseña modificada con éxito!');
  });
});
