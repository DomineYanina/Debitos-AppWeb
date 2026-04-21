import { Component, inject, ChangeDetectorRef } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css'
})
export class AuditoriaComponent {
  cargando : boolean = false;
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  prestaciones: Prestacion[] = [];
  prestacionesFiltradas: Prestacion[] = [];
  columnaOrden: string = '';
  direccionOrden: 'asc' | 'desc' = 'asc';
  private auditoriaService = inject(AuditoriaService);

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

  soloSinMotivoDebito: boolean = false;
  soloSinMotivoRefactura: boolean = false;
  soloValorizadas: boolean = false;

  // Mapeamos los 4 campos con sus validaciones
  busquedaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]]
  });

  onBuscar() {
    if (this.busquedaForm.valid) {
      this.cargando = true; // Bloqueamos la UI

      this.auditoriaService.buscarPrestaciones(this.busquedaForm.value).subscribe({
        next: (data) => {
          this.prestaciones = data;
          this.prestacionesFiltradas = [...this.prestaciones];

          this.prepararFiltros(this.prestaciones);
          this.aplicarFiltros();
          this.cdr.detectChanges();

          this.cargando = false; // Liberamos la UI (Éxito)
        },
        error: (err) => {
          alert('Error en el servidor');
          this.cargando = false; // Liberamos la UI (Error)
        }
      });
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
    //debugger;
  }

  aplicarFiltros() {
    console.log(this.prestacionesFiltradas.length);
    this.prestacionesFiltradas = this.prestaciones.filter(p => {
      // Filtros de combos (los que ya tenías)
      const cumpleCombos =
        (this.filtroPaciente === '' || p.paciente === this.filtroPaciente) &&
        (this.filtroProfesional === '' || p.medico === this.filtroProfesional) &&
        (this.filtroPrestacion === '' || p.modulo === this.filtroPrestacion) &&
        (this.filtroGrupo === '' || p.grupomodulo === this.filtroGrupo) &&
        (this.filtroFecha === '' || p.fecha === this.filtroFecha);

      // Filtros de Checkbox (Lógica inversa: si el check está activo, filtramos)
      const cumpleSinDebito = !this.soloSinMotivoDebito || (!p.motivoDebito || p.motivoDebito.trim() === '');
      const cumpleSinRefactura = !this.soloSinMotivoRefactura || (!p.motivoRefactura || p.motivoRefactura.trim() === '');
      const cumpleValorizadas = !this.soloValorizadas || (p.total > 0);

      return cumpleCombos && cumpleSinDebito && cumpleSinRefactura && cumpleValorizadas;
    });
    console.log(this.prestacionesFiltradas.length);
    // Actualizamos los combos en cascada
    this.prepararFiltros(this.prestacionesFiltradas);
  }

  resetFiltros() {
    this.filtroPaciente = '';
    this.filtroProfesional = '';
    this.filtroPrestacion = '';
    this.filtroGrupo = '';
    this.filtroFecha = '';
    this.soloSinMotivoDebito = false;
    this.soloSinMotivoRefactura = false;
    this.soloValorizadas = false;
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

  get totalFacturado(): number {
    return this.prestacionesFiltradas.reduce((sum, p) => sum + (p.total || 0), 0);
  }

  get totalDebitado(): number {
    return this.prestacionesFiltradas.reduce((sum, p) => sum + (p.importeDebitado || 0), 0);
  }

  get totalCantidad(): number {
    return this.prestacionesFiltradas.reduce((sum, p) => sum + (p.cantidad || 0), 0);
  }

  // Devuelve true solo si hay datos y TODOS están seleccionados
  get todasSeleccionadas(): boolean {
    return this.prestacionesFiltradas.length > 0 &&
      this.prestacionesFiltradas.every(p => p.seleccionada);
  }

// Función para el checkbox principal de la cabecera
  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const marcado = checkbox.checked;

    // Aplicamos el cambio SOLO a lo que el usuario está viendo actualmente
    this.prestacionesFiltradas.forEach(p => p.seleccionada = marcado);
  }

// Un getter útil para cuando necesites saber qué eligió el usuario
  get registrosSeleccionados(): Prestacion[] {
    return this.prestaciones.filter(p => p.seleccionada);
  }
}
