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
  mensajeError: string = '';
  mostrarPassword: boolean = false;

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // Definimos las reglas del formulario
  loginForm = this.fb.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required]
  });

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
