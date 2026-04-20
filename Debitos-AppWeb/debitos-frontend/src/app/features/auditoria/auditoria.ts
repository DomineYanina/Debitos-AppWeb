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
  prestacionesFiltradas: Prestacion[] = [];
  columnaOrden: string = '';
  direccionOrden: 'asc' | 'desc' = 'asc';

  // Listas para llenar los combos
  pacientesList: string[] = [];
  profesionalesList: string[] = [];
  prestacionesList: string[] = [];
  gruposList: (string | undefined)[] = [];
  fechasList: string[] = [];

  // Valores seleccionados en los filtros
  filtroPaciente: string = '';
  filtroProfesional: string = '';
  filtroPrestacion: string = '';
  filtroGrupo: string = '';
  filtroFecha: string = '';

  // Mapeamos los 4 campos con sus validaciones
  busquedaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]]
  });

  onBuscar() {
    if (this.busquedaForm.valid) {
      // Simulación de datos (En el futuro esto vendrá del servicio)
      this.prestaciones = [
        { paciente: 'DOMINE YANINA', plan: 'OSDE 210', grupomodulo: 'MODULO A', modulo: 'CONSULTA', medico: 'DR. PEREZ', fecha: '2026-04-20', codigo: '1', cantidad: 1, total: 5000 },
        { paciente: 'SEEHOFER NICOLAS', plan: 'SWISS MEDICAL', grupomodulo: 'MODULO B', modulo: 'LABORATORIO', medico: 'DRA. GARCIA', fecha: '2026-04-19', codigo: '2', cantidad: 5, total: 12500 },
        { paciente: 'DOMINE YANINA', plan: 'OSDE 210', grupomodulo: 'MODULO A', modulo: 'RADIOGRAFIA', medico: 'DR. PEREZ', fecha: '2026-04-20', codigo: '3', cantidad: 1, total: 3000 },
        { paciente: 'DOMINE YANINA', plan: 'OSDE 210', grupomodulo: 'MODULO A', modulo: 'LABORATORIO', medico: 'DRA. GARCIA', fecha: '2026-04-19', codigo: '2', cantidad: 1, total: 3000 }
      ];

      this.prepararFiltros(this.prestaciones);
      this.aplicarFiltros();
    } else {
      // Como me pediste siempre la verdad: en producción es mejor pintar los bordes de rojo,
      // pero por ahora un alert nos sirve para saber que algo falta.
      this.busquedaForm.markAllAsTouched();
      alert('Por favor, completá los 4 campos correctamente.');
    }
  }

  limpiarFiltro(campo: string) {
    // Reseteamos solo el campo solicitado
    switch (campo) {
      case 'paciente': this.filtroPaciente = ''; break;
      case 'profesional': this.filtroProfesional = ''; break;
      case 'prestacion': this.filtroPrestacion = ''; break;
      case 'grupo': this.filtroGrupo = ''; break;
      case 'fecha': this.filtroFecha = ''; break;
    }

    // Re-aplicamos filtros para que la grilla y los combos se expandan
    this.aplicarFiltros();
  }

  prepararFiltros(datos: Prestacion[]) {
    // Extraemos valores únicos usando Set y ordenamos alfabéticamente
    this.pacientesList = [...new Set(datos.map(p => p.paciente))].sort();
    this.profesionalesList = [...new Set(datos.map(p => p.medico))].sort();
    this.prestacionesList = [...new Set(datos.map(p => p.modulo))].sort();
    this.gruposList = [...new Set(datos.map(p => p.grupomodulo))].sort();
    this.fechasList = [...new Set(datos.map(p => p.fecha))].sort();
  }

  aplicarFiltros() {
    // 1. Primero filtramos la lista original basándonos en los selectores
    this.prestacionesFiltradas = this.prestaciones.filter(p => {
      return (this.filtroPaciente === '' || p.paciente === this.filtroPaciente) &&
        (this.filtroProfesional === '' || p.medico === this.filtroProfesional) &&
        (this.filtroPrestacion === '' || p.modulo === this.filtroPrestacion) &&
        (this.filtroGrupo === '' || p.grupomodulo === this.filtroGrupo) &&
        (this.filtroFecha === '' || p.fecha === this.filtroFecha);
    });

    // 2. RE-LLENAMOS los combos usando la lista que resultó del filtro
    // Esto hace que si elegís un Paciente, el combo de Profesional solo muestre
    // los médicos que atendieron a ESE paciente.
    this.prepararFiltros(this.prestacionesFiltradas);
  }

  resetFiltros() {
    this.filtroPaciente = '';
    this.filtroProfesional = '';
    this.filtroPrestacion = '';
    this.filtroGrupo = '';
    this.filtroFecha = '';
    this.prepararFiltros(this.prestaciones);
    this.aplicarFiltros();
  }

  getIcono(col:string){
    if(this.columnaOrden === col){
      return this.direccionOrden === 'asc' ? '▲' : '▼';
    }
    return '';
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onSort(columna: keyof Prestacion) {
    // Si cliqueamos la misma columna, invertimos la dirección
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      // Si es una columna nueva, empezamos por ascendente
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }

    // Aplicamos el ordenamiento al array
    this.prestacionesFiltradas.sort((a, b) => {
      const valorA = a[columna];
      const valorB = b[columna];

      // Manejo de valores nulos o indefinidos
      if (valorA == null) return 1;
      if (valorB == null) return -1;

      // Comparación lógica
      if (valorA < valorB) {
        return this.direccionOrden === 'asc' ? -1 : 1;
      }
      if (valorA > valorB) {
        return this.direccionOrden === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
}
