import { Component, inject } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css'
})
export class AuditoriaComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  prestaciones: Prestacion[] = [];

  // Mapeamos los 4 campos con sus validaciones
  busquedaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]]
  });

  onBuscar() {
    if (this.busquedaForm.valid) {
      this.prestaciones = [
        { paciente: 'DOMINE YANINA', plan: 'OSDE 210', medico: 'DR. PEREZ', fecha: '2026-04-20', codigo: '420101', modulo: 'CONSULTA', cantidad: 1, total: 5000, importeDebitado: 0 },
        { paciente: 'SEEHOFER NICOLAS', plan: 'SWISS MEDICAL', medico: 'DRA. GARCIA', fecha: '2026-04-19', codigo: '880101', modulo: 'LABORATORIO', cantidad: 5, total: 12500, importeDebitado: 2500, motivoDebito: 'Falta firma' }
      ];
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
