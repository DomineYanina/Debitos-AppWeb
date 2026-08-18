import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cargando: boolean = false;
  verificandoUsuario: boolean = false;
  mensajeError: string = '';
  mostrarPassword: boolean = false;

  // Estado para modal "Olvidé mi contraseña"
  mostrarModalOlvideClave: boolean = false;
  usuarioVerificado: string = '';
  cargandoCambioClave: boolean = false;
  mensajeErrorModal: string = '';
  mensajeExitoModal: string = '';
  mostrarNuevaPassword: boolean = false;
  mostrarConfirmarPassword: boolean = false;

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleMostrarNuevaPassword(): void {
    this.mostrarNuevaPassword = !this.mostrarNuevaPassword;
  }

  toggleMostrarConfirmarPassword(): void {
    this.mostrarConfirmarPassword = !this.mostrarConfirmarPassword;
  }

  // Definimos las reglas del formulario principal
  loginForm = this.fb.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required]
  });

  // Formulario del modal de cambio de clave
  modalForm = this.fb.group({
    nuevaClave: ['', [Validators.required, Validators.minLength(4)]],
    confirmarClave: ['', [Validators.required]]
  });

  onOlvidePassword(): void {
    const usuario = this.loginForm.get('usuario')?.value?.trim();
    if (!usuario) {
      this.mensajeError = 'Por favor, ingrese su nombre de usuario para recuperar la contraseña.';
      this.cdr.detectChanges();
      return;
    }

    this.verificandoUsuario = true;
    this.mensajeError = '';
    this.cdr.detectChanges();

    this.authService.verificarUsuario(usuario).subscribe({
      next: (resp: any) => {
        this.verificandoUsuario = false;
        this.usuarioVerificado = resp.usuario || usuario;
        this.mostrarModalOlvideClave = true;
        this.mensajeErrorModal = '';
        this.mensajeExitoModal = '';
        this.modalForm.reset();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.verificandoUsuario = false;
        if (err.status === 404) {
          this.mensajeError = 'El usuario ingresado no existe en el sistema. Por favor, verifique el nombre e intente nuevamente.';
        } else if (err.status === 0) {
          this.mensajeError = 'El servidor no está disponible. Por favor, verifique que el servicio esté activo.';
        } else {
          this.mensajeError = 'Ocurrió un error al verificar el usuario. Por favor, intente nuevamente.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalOlvideClave(): void {
    this.mostrarModalOlvideClave = false;
    this.usuarioVerificado = '';
    this.mensajeErrorModal = '';
    this.mensajeExitoModal = '';
    this.modalForm.reset();
    this.cdr.detectChanges();
  }

  onSubmitCambiarClave(): void {
    if (this.modalForm.invalid || this.cargandoCambioClave) {
      return;
    }

    const nuevaClave = this.modalForm.get('nuevaClave')?.value;
    const confirmarClave = this.modalForm.get('confirmarClave')?.value;

    if (nuevaClave !== confirmarClave) {
      this.mensajeErrorModal = 'Las contraseñas ingresadas no coinciden.';
      this.cdr.detectChanges();
      return;
    }

    this.cargandoCambioClave = true;
    this.mensajeErrorModal = '';
    this.mensajeExitoModal = '';
    this.cdr.detectChanges();

    this.authService.cambiarClave(this.usuarioVerificado, nuevaClave!).subscribe({
      next: () => {
        this.cargandoCambioClave = false;
        this.mensajeExitoModal = '¡Contraseña modificada con éxito! Ya podés ingresar con tu nueva contraseña.';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cerrarModalOlvideClave();
        }, 1800);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoCambioClave = false;
        if (err.status === 404) {
          this.mensajeErrorModal = 'El usuario no fue encontrado en la base de datos.';
        } else {
          this.mensajeErrorModal = 'Ocurrió un error al intentar modificar la contraseña. Por favor, reintente.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid && !this.cargando) {
      this.cargando = true;
      this.mensajeError = '';
      this.cdr.detectChanges();

      this.authService.login(this.loginForm.value).subscribe({
        next: (respuesta) => {
          this.cargando = false;
          this.cdr.detectChanges();
          // 1. Guardamos los datos
          this.authService.guardarToken(respuesta.token, respuesta.usuario);

          // 2. Redirigimos automáticamente a auditoría
          this.router.navigate(['/auditoria']);
        },
        error: (err: any) => {
          this.cargando = false;

          const status = err?.status;
          if (status === 401 || status === 400) {
            this.mensajeError = 'Las credenciales ingresadas son incorrectas. Por favor, verifique su usuario y contraseña.';
          } else if (status === 0 || (status && status >= 500)) {
            this.mensajeError = 'El servidor no está disponible. Por favor, verifique que el servicio esté activo o intente más tarde.';
          } else {
            this.mensajeError = 'Ocurrió un error al intentar iniciar sesión. Por favor, intente nuevamente.';
          }

          this.cdr.detectChanges();
        }
      });
    }
  }
}

