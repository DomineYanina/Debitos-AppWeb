import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css'
})
export class AuditoriaComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Mapeamos los 4 campos con sus validaciones
  busquedaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]]
  });

  onBuscar() {
    if (this.busquedaForm.valid) {
      // Por ahora solo imprimimos en consola para ver que funciona
      console.log('Datos a buscar en Java:', this.busquedaForm.value);
    } else {
      // Como me pediste siempre la verdad: en producción es mejor pintar los bordes de rojo,
      // pero por ahora un alert nos sirve para saber que algo falta.
      this.busquedaForm.markAllAsTouched();
      alert('Por favor, completá los 4 campos correctamente.');
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
