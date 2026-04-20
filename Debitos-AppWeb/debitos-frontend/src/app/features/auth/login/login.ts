import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule], // Importamos el módulo de formularios
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Definimos las reglas del formulario
  loginForm = this.fb.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (respuesta) => {
          // AGREGAMOS ESTE ALERTA TEMPORAL
          alert('¡Conexión EXITOSA con Spring Boot! Todo funciona perfecto.');
          this.authService.guardarToken(respuesta.token, respuesta.usuario);
          // this.router.navigate(['/auditoria']); <-- Comentá esta línea por ahora
        },
        error: (err) => {
          alert('Credenciales incorrectas o el servidor está apagado.');
        }
      });
    }
  }
}
