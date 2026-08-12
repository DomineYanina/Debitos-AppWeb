import { ComponentFixture, TestBed } from '@angular/core';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'guardarToken']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
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
    authServiceSpy.login.and.returnValue(throwError(() => error401));

    component.loginForm.setValue({ usuario: 'admin', password: 'bad' });
    component.onSubmit();

    expect(component.mensajeError).toBe('Las credenciales ingresadas son incorrectas. Por favor, verifique su usuario y contraseña.');
    expect(component.cargando).toBeFalse();
  });

  it('debería mostrar mensaje de servidor no disponible si el status es 0', () => {
    const errorServerDown = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    authServiceSpy.login.and.returnValue(throwError(() => errorServerDown));

    component.loginForm.setValue({ usuario: 'admin', password: 'bad' });
    component.onSubmit();

    expect(component.mensajeError).toBe('El servidor no está disponible. Por favor, verifique que el servicio esté activo o intente más tarde.');
    expect(component.cargando).toBeFalse();
  });

  it('debería alternar el estado de mostrarPassword al llamar a toggleMostrarPassword()', () => {
    expect(component.mostrarPassword).toBeFalse();
    component.toggleMostrarPassword();
    expect(component.mostrarPassword).toBeTrue();
    component.toggleMostrarPassword();
    expect(component.mostrarPassword).toBeFalse();
  });
});
