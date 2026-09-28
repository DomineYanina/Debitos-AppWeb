import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { DirectorioService } from '../../core/services/directorio.service';
import { DirectorioPrestacionDetalle } from '../../core/models/directorio.model';

export interface OpcionFiltroItem {
  key: string;
  label: string;
  cantidad: number;
}

export interface OpcionFechaItem {
  iso: string;
  label: string;
  cantidad: number;
}

export interface OpcionImporteItem {
  valor: number;
  label: string;
  cantidad: number;
}

@Component({
  selector: 'app-directorio-motivo-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directorio-motivo-detalle.component.html',
  styleUrl: './directorio-motivo-detalle.component.css'
})
export class DirectorioMotivoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private directorioService = inject(DirectorioService);
  private cdr = inject(ChangeDetectorRef);

  motivo: string = '';
  codigoCobertura: string = 'TODAS';
  tipoDoc: string = 'TODOS';
  fechaDesde: string = '';
  fechaHasta: string = '';

  cargando: boolean = false;
  prestaciones: DirectorioPrestacionDetalle[] = [];

  // Filtros interactivos
  filtroBusqueda: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroPacienteSeleccionado: string = 'TODOS';
  filtroPrestacionSeleccionada: string = 'TODAS';
  filtroImporteDesde: string = '';
  filtroImporteHasta: string = '';
  filtroAceptadoSeleccionado: string = 'TODOS';

  // Opciones dinámicas alimentadas por los datos actuales de la tabla
  opcionesFechas: OpcionFechaItem[] = [];
  opcionesPacientes: { paciente: string; cantidad: number }[] = [];
  opcionesPrestaciones: { codigo: string; descripcion: string; label: string; cantidad: number }[] = [];
  opcionesImportes: OpcionImporteItem[] = [];
  opcionesAceptado: OpcionFiltroItem[] = [];

  fechaMinimaDatos: string = '';
  fechaMaximaDatos: string = '';

  // Ordenamiento interactivo de columnas
  columnaOrden: string = '';
  direccionOrden: 'asc' | 'desc' = 'asc';

  totalMontoDebitado: number = 0;
  totalCasos: number = 0;
  solapaOrigen: string = 'motivos';

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const motivoParam = params.get('motivoId') || '';
      try {
        this.motivo = decodeURIComponent(motivoParam);
      } catch {
        this.motivo = motivoParam;
      }

      this.solapaOrigen = queryParams.get('solapa') || 'motivos';
      this.codigoCobertura = queryParams.get('codigoCobertura') || 'TODAS';
      this.tipoDoc = queryParams.get('tipoDoc') || 'TODOS';
      this.fechaDesde = queryParams.get('fechaDesde') || '';
      this.fechaHasta = queryParams.get('fechaHasta') || '';
      this.cargarDetalle();
    });
  }

  cargarDetalle(): void {
    if (!this.motivo) return;

    this.cargando = true;
    this.directorioService.obtenerMotivoDetalle(this.motivo, this.codigoCobertura, this.tipoDoc, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.prestaciones = data || [];
        this.calcularTotales();
        this.construirOpcionesFiltros();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar prestaciones por motivo:', err);
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  calcularTotales(): void {
    this.totalMontoDebitado = this.prestaciones.reduce((acc, p) => acc + (p.importeDebitado || 0), 0);
    this.totalCasos = this.prestaciones.length;
  }

  /**
   * Construye las listas de opciones para los desplegables
   * alimentándose exclusivamente de los registros visualizados en la tabla en ese momento.
   */
  construirOpcionesFiltros(): void {
    if (!this.prestaciones || this.prestaciones.length === 0) {
      this.opcionesFechas = [];
      this.opcionesPacientes = [];
      this.opcionesPrestaciones = [];
      this.opcionesImportes = [];
      this.opcionesAceptado = [];
      this.fechaMinimaDatos = '';
      this.fechaMaximaDatos = '';
      return;
    }

    // 1. Fechas únicas presentes (extraídas de fechaDoc || fechaPrestacion)
    const mapFechas = new Map<string, number>();
    let minF = '';
    let maxF = '';
    for (const p of this.prestaciones) {
      const f = this.obtenerFechaIso(p.fechaDoc || p.fechaPrestacion);
      if (f) {
        mapFechas.set(f, (mapFechas.get(f) || 0) + 1);
        if (!minF || f < minF) minF = f;
        if (!maxF || f > maxF) maxF = f;
      }
    }
    this.fechaMinimaDatos = minF;
    this.fechaMaximaDatos = maxF;

    this.opcionesFechas = Array.from(mapFechas.entries())
      .map(([iso, cantidad]) => ({
        iso,
        label: this.formatearFechaIsoToAr(iso),
        cantidad
      }))
      .sort((a, b) => a.iso.localeCompare(b.iso));

    // 2. Pacientes únicos presentes
    const mapPacientes = new Map<string, number>();
    for (const p of this.prestaciones) {
      const pac = (p.paciente || '').trim();
      if (pac) {
        mapPacientes.set(pac, (mapPacientes.get(pac) || 0) + 1);
      }
    }
    this.opcionesPacientes = Array.from(mapPacientes.entries())
      .map(([paciente, cantidad]) => ({ paciente, cantidad }))
      .sort((a, b) => a.paciente.localeCompare(b.paciente));

    // 3. Prestaciones Médicas (Código y Descripción)
    const mapPrestaciones = new Map<string, { descripcion: string; cantidad: number }>();
    for (const p of this.prestaciones) {
      const cod = (p.codigo || '').trim();
      if (cod) {
        const item = mapPrestaciones.get(cod) || { descripcion: (p.descripcion || '').trim(), cantidad: 0 };
        item.cantidad++;
        if (!item.descripcion && p.descripcion) {
          item.descripcion = p.descripcion.trim();
        }
        mapPrestaciones.set(cod, item);
      }
    }
    this.opcionesPrestaciones = Array.from(mapPrestaciones.entries())
      .map(([codigo, data]) => {
        const descCorta = data.descripcion ? (data.descripcion.length > 45 ? data.descripcion.substring(0, 42) + '...' : data.descripcion) : '';
        const label = descCorta ? `${codigo} - ${descCorta}` : codigo;
        return {
          codigo,
          descripcion: data.descripcion,
          label,
          cantidad: data.cantidad
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    // 4. Importes Debitado únicos presentes
    const mapImportes = new Map<number, number>();
    for (const p of this.prestaciones) {
      const imp = Math.round(((p.importeDebitado ?? 0) + Number.EPSILON) * 100) / 100;
      mapImportes.set(imp, (mapImportes.get(imp) || 0) + 1);
    }
    this.opcionesImportes = Array.from(mapImportes.entries())
      .map(([valor, cantidad]) => ({
        valor,
        label: this.formatearMoneda(valor),
        cantidad
      }))
      .sort((a, b) => a.valor - b.valor);

    // 5. Estado de Aceptación del Débito
    const cantSi = this.prestaciones.filter(p => p.debitoAceptado === true).length;
    const cantNo = this.prestaciones.filter(p => p.debitoAceptado === false).length;
    const cantPend = this.prestaciones.filter(p => p.debitoAceptado === null || p.debitoAceptado === undefined).length;

    const estados: OpcionFiltroItem[] = [];
    if (cantSi > 0) estados.push({ key: 'SI', label: 'SÍ (Pérdida)', cantidad: cantSi });
    if (cantNo > 0) estados.push({ key: 'NO', label: 'NO (Refacturable)', cantidad: cantNo });
    if (cantPend > 0) estados.push({ key: 'PENDIENTE', label: 'Pendiente', cantidad: cantPend });
    this.opcionesAceptado = estados;
  }

  // Getters para delimitar los calendarios a los ítems presentes en la tabla
  get fechaMinimaPermitida(): string {
    return this.fechaMinimaDatos || '';
  }

  get fechaMaximaPermitidaDesde(): string {
    return this.filtroFechaHasta || this.fechaMaximaDatos || '';
  }

  get fechaMinimaPermitidaHasta(): string {
    return this.filtroFechaDesde || this.fechaMinimaDatos || '';
  }

  get fechaMaximaPermitida(): string {
    return this.fechaMaximaDatos || '';
  }

  onFechaDesdeChange(): void {
    if (this.filtroFechaDesde) {
      if (this.fechaMinimaDatos && this.filtroFechaDesde < this.fechaMinimaDatos) {
        this.filtroFechaDesde = this.fechaMinimaDatos;
      }
      if (this.fechaMaximaDatos && this.filtroFechaDesde > this.fechaMaximaDatos) {
        this.filtroFechaDesde = this.fechaMaximaDatos;
      }
      if (this.filtroFechaHasta && this.filtroFechaDesde > this.filtroFechaHasta) {
        this.filtroFechaHasta = this.filtroFechaDesde;
      }
    }
  }

  onFechaHastaChange(): void {
    if (this.filtroFechaHasta) {
      if (this.fechaMaximaDatos && this.filtroFechaHasta > this.fechaMaximaDatos) {
        this.filtroFechaHasta = this.fechaMaximaDatos;
      }
      if (this.fechaMinimaDatos && this.filtroFechaHasta < this.fechaMinimaDatos) {
        this.filtroFechaHasta = this.fechaMinimaDatos;
      }
      if (this.filtroFechaDesde && this.filtroFechaHasta < this.filtroFechaDesde) {
        this.filtroFechaDesde = this.filtroFechaHasta;
      }
    }
  }

  get opcionesImportesDesde(): OpcionImporteItem[] {
    if (this.filtroImporteHasta !== '' && this.filtroImporteHasta !== null && this.filtroImporteHasta !== undefined) {
      const max = Number(this.filtroImporteHasta);
      if (!isNaN(max)) {
        return this.opcionesImportes.filter(imp => imp.valor <= max);
      }
    }
    return this.opcionesImportes;
  }

  get opcionesImportesHasta(): OpcionImporteItem[] {
    if (this.filtroImporteDesde !== '' && this.filtroImporteDesde !== null && this.filtroImporteDesde !== undefined) {
      const min = Number(this.filtroImporteDesde);
      if (!isNaN(min)) {
        return this.opcionesImportes.filter(imp => imp.valor >= min);
      }
    }
    return this.opcionesImportes;
  }

  onImporteDesdeChange(): void {
    if (this.filtroImporteDesde !== '' && this.filtroImporteHasta !== '') {
      const min = Number(this.filtroImporteDesde);
      const max = Number(this.filtroImporteHasta);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        this.filtroImporteHasta = this.filtroImporteDesde;
      }
    }
  }

  onImporteHastaChange(): void {
    if (this.filtroImporteDesde !== '' && this.filtroImporteHasta !== '') {
      const min = Number(this.filtroImporteDesde);
      const max = Number(this.filtroImporteHasta);
      if (!isNaN(min) && !isNaN(max) && max < min) {
        this.filtroImporteDesde = this.filtroImporteHasta;
      }
    }
  }

  validarSoloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Permitir números del 0 al 9 (48-57) y punto (46) o coma (44)
    if ((charCode >= 48 && charCode <= 57) || charCode === 46 || charCode === 44) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  get prestacionesFiltradas(): DirectorioPrestacionDetalle[] {
    let resultado = this.prestaciones;

    // 1. Búsqueda rápida por texto libre
    if (this.filtroBusqueda && this.filtroBusqueda.trim() !== '') {
      const q = this.filtroBusqueda.toLowerCase().trim();
      resultado = resultado.filter(p =>
        (p.paciente && p.paciente.toLowerCase().includes(q)) ||
        (p.carnet && p.carnet.toLowerCase().includes(q)) ||
        (p.codigo && p.codigo.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
        (p.comentariosDebito && p.comentariosDebito.toLowerCase().includes(q)) ||
        (p.efector && p.efector.toLowerCase().includes(q)) ||
        (p.medico && p.medico.toLowerCase().includes(q))
      );
    }

    // 2. Filtro Fecha Desde
    if (this.filtroFechaDesde) {
      resultado = resultado.filter(p => {
        const f = this.obtenerFechaIso(p.fechaDoc || p.fechaPrestacion);
        return f ? f >= this.filtroFechaDesde : true;
      });
    }

    // 3. Filtro Fecha Hasta
    if (this.filtroFechaHasta) {
      resultado = resultado.filter(p => {
        const f = this.obtenerFechaIso(p.fechaDoc || p.fechaPrestacion);
        return f ? f <= this.filtroFechaHasta : true;
      });
    }

    // 4. Filtro Paciente
    if (this.filtroPacienteSeleccionado && this.filtroPacienteSeleccionado !== 'TODOS') {
      resultado = resultado.filter(p =>
        p.paciente && p.paciente.trim().toUpperCase() === this.filtroPacienteSeleccionado.toUpperCase()
      );
    }

    // 5. Filtro Prestación Médica
    if (this.filtroPrestacionSeleccionada && this.filtroPrestacionSeleccionada !== 'TODAS') {
      resultado = resultado.filter(p =>
        p.codigo && p.codigo.trim().toUpperCase() === this.filtroPrestacionSeleccionada.toUpperCase()
      );
    }

    // 6. Filtro Importe Desde
    if (this.filtroImporteDesde !== '' && this.filtroImporteDesde !== null && this.filtroImporteDesde !== undefined) {
      const min = Number(this.filtroImporteDesde);
      if (!isNaN(min)) {
        resultado = resultado.filter(p => (p.importeDebitado ?? 0) >= min);
      }
    }

    // 7. Filtro Importe Hasta
    if (this.filtroImporteHasta !== '' && this.filtroImporteHasta !== null && this.filtroImporteHasta !== undefined) {
      const max = Number(this.filtroImporteHasta);
      if (!isNaN(max)) {
        resultado = resultado.filter(p => (p.importeDebitado ?? 0) <= max);
      }
    }

    // 8. Filtro Estado de Aceptación
    if (this.filtroAceptadoSeleccionado && this.filtroAceptadoSeleccionado !== 'TODOS') {
      if (this.filtroAceptadoSeleccionado === 'SI') {
        resultado = resultado.filter(p => p.debitoAceptado === true);
      } else if (this.filtroAceptadoSeleccionado === 'NO') {
        resultado = resultado.filter(p => p.debitoAceptado === false);
      } else if (this.filtroAceptadoSeleccionado === 'PENDIENTE') {
        resultado = resultado.filter(p => p.debitoAceptado === null || p.debitoAceptado === undefined);
      }
    }

    // 9. Ordenamiento interactivo por cabeceras de columnas
    if (this.columnaOrden) {
      const dir = this.direccionOrden === 'asc' ? 1 : -1;
      resultado = [...resultado].sort((a, b) => {
        switch (this.columnaOrden) {
          case 'comprobante': {
            const compA = `${a.tipoDoc || ''} ${a.letraDoc || ''} ${String(a.ptovtaDoc || 0).padStart(4, '0')} ${String(a.numeroDoc || 0).padStart(8, '0')}`;
            const compB = `${b.tipoDoc || ''} ${b.letraDoc || ''} ${String(b.ptovtaDoc || 0).padStart(4, '0')} ${String(b.numeroDoc || 0).padStart(8, '0')}`;
            return compA.localeCompare(compB) * dir;
          }
          case 'fecha': {
            const valA = this.obtenerFechaIso(a.fechaDoc || a.fechaPrestacion);
            const valB = this.obtenerFechaIso(b.fechaDoc || b.fechaPrestacion);
            return valA.localeCompare(valB) * dir;
          }
          case 'paciente': {
            const valA = `${a.paciente || ''} ${a.carnet || ''}`.trim().toLowerCase();
            const valB = `${b.paciente || ''} ${b.carnet || ''}`.trim().toLowerCase();
            return valA.localeCompare(valB) * dir;
          }
          case 'plan': {
            const valA = `${a.plan || ''} ${a.medico || ''} ${a.efector || ''}`.trim().toLowerCase();
            const valB = `${b.plan || ''} ${b.medico || ''} ${b.efector || ''}`.trim().toLowerCase();
            return valA.localeCompare(valB) * dir;
          }
          case 'prestacion': {
            const valA = `${a.codigo || ''} ${a.descripcion || ''}`.trim().toLowerCase();
            const valB = `${b.codigo || ''} ${b.descripcion || ''}`.trim().toLowerCase();
            return valA.localeCompare(valB) * dir;
          }
          case 'motivo': {
            const valA = (a.motivoDebito || '').trim().toLowerCase();
            const valB = (b.motivoDebito || '').trim().toLowerCase();
            return valA.localeCompare(valB) * dir;
          }
          case 'comentarios': {
            const valA = (a.comentariosDebito || '').trim().toLowerCase();
            const valB = (b.comentariosDebito || '').trim().toLowerCase();
            return valA.localeCompare(valB) * dir;
          }
          case 'importe': {
            const valA = a.importeDebitado ?? 0;
            const valB = b.importeDebitado ?? 0;
            return (valA - valB) * dir;
          }
          case 'aceptado': {
            const numA = a.debitoAceptado === true ? 2 : (a.debitoAceptado === false ? 1 : 0);
            const numB = b.debitoAceptado === true ? 2 : (b.debitoAceptado === false ? 1 : 0);
            return (numA - numB) * dir;
          }
          default:
            return 0;
        }
      });
    }

    return resultado;
  }

  ordenar(columna: string): void {
    if (this.columnaOrden === columna) {
      if (this.direccionOrden === 'desc') {
        // Clic 2: Orden ascendente
        this.direccionOrden = 'asc';
      } else if (this.direccionOrden === 'asc') {
        // Clic 3: Deshacer el ordenamiento (dejarla como estaba originalmente)
        this.columnaOrden = '';
        this.direccionOrden = 'desc';
      }
    } else {
      // Clic 1: Orden descendente
      this.columnaOrden = columna;
      this.direccionOrden = 'desc';
    }
  }

  get totalMontoFiltrado(): number {
    return this.prestacionesFiltradas.reduce((acc, p) => acc + (p.importeDebitado || 0), 0);
  }

  get hayFiltrosActivos(): boolean {
    return (
      (this.filtroBusqueda !== null && this.filtroBusqueda.trim() !== '') ||
      this.filtroFechaDesde !== '' ||
      this.filtroFechaHasta !== '' ||
      this.filtroPacienteSeleccionado !== 'TODOS' ||
      this.filtroPrestacionSeleccionada !== 'TODAS' ||
      this.filtroImporteDesde !== '' ||
      this.filtroImporteHasta !== '' ||
      this.filtroAceptadoSeleccionado !== 'TODOS'
    );
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroPacienteSeleccionado = 'TODOS';
    this.filtroPrestacionSeleccionada = 'TODAS';
    this.filtroImporteDesde = '';
    this.filtroImporteHasta = '';
    this.filtroAceptadoSeleccionado = 'TODOS';
  }

  volverAlTablero(): void {
    this.router.navigate(['/directorio'], {
      queryParams: {
        solapa: this.solapaOrigen || 'motivos',
        codigoCobertura: this.codigoCobertura,
        tipoDoc: this.tipoDoc,
        fechaDesde: this.fechaDesde,
        fechaHasta: this.fechaHasta
      }
    });
  }

  formatearComprobante(letra?: string, ptovta?: number, numero?: number): string {
    const l = letra ? letra.trim() + ' ' : '';
    const pto = String(ptovta || 0).padStart(4, '0');
    const num = String(numero || 0).padStart(8, '0');
    return `${l}${pto}-${num}`;
  }

  formatearMoneda(valor: number): string {
    if (valor === undefined || valor === null || isNaN(valor)) return '$ 0,00';
    return '$ ' + valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private obtenerFechaIso(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') {
      if (fecha.length >= 10 && fecha.charAt(4) === '-' && fecha.charAt(7) === '-') {
        return fecha.substring(0, 10);
      }
    }
    try {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) {
        return d.toISOString().substring(0, 10);
      }
    } catch {
      // ignore
    }
    return '';
  }

  private formatearFechaIsoToAr(iso: string): string {
    if (!iso || iso.length < 10) return iso;
    const parts = iso.substring(0, 10).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
  }
}
