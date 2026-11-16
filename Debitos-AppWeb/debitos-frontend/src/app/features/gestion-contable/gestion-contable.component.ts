import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionContableService } from '../../core/services/gestion-contable.service';
import { AuthService } from '../../core/services/auth';
import {
  CoberturaAliasDTO,
  FacturaPeriodoDTO,
  PrestacionConsideracionDTO,
  FacturaAnuladaDTO,
  HistorialAjusteDTO,
  PageResponse
} from '../../core/models/gestion-contable.model';

@Component({
  selector: 'app-gestion-contable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-contable.component.html',
  styleUrl: './gestion-contable.component.css'
})
export class GestionContableComponent implements OnInit {
  private contableService = inject(GestionContableService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  subSolapaActiva: 'coberturas' | 'periodos' | 'prestaciones' | 'anuladas' | 'historial' = 'coberturas';

  // Feedback / Mensajes
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  // 1. Coberturas
  busquedaCobCodigo: string = '';
  coberturaSeleccionada: CoberturaAliasDTO | null = null;
  nuevoNombreMostrarCob: string = '';

  // 2. Períodos de Facturas
  busquedaPerTipo: string = 'FC';
  busquedaPerLetra: string = 'A';
  busquedaPerPtoVta: number | null = 30;
  busquedaPerNumero: number | null = null;
  facturaPeriodoSeleccionada: FacturaPeriodoDTO | null = null;
  nuevoPeriodoCorregido: string = ''; // "YYYY-MM-DD" o "DD/MM/YYYY"

  // 3. Prestaciones a No Considerar
  filtroPrestacionCodigo: string = '';
  prestacionesPage: PageResponse<PrestacionConsideracionDTO> | null = null;
  paginaActualPrestaciones: number = 0;
  tamanoPaginaPrestaciones: number = 20;

  // Modal edición de prestación
  modalPrestacionVisible: boolean = false;
  prestacionEnEdicion: PrestacionConsideracionDTO | null = null;
  nuevoEstadoPrestacion: string = 'Considerar';

  // 4. Facturas Anuladas
  busquedaAnulTipo: string = 'FC';
  busquedaAnulLetra: string = 'A';
  busquedaAnulPtoVta: number | null = 30;
  busquedaAnulNumero: number | null = null;
  facturaAnulacionSeleccionada: FacturaAnuladaDTO | null = null;

  facturasAnuladasPage: PageResponse<FacturaAnuladaDTO> | null = null;
  paginaActualAnuladas: number = 0;

  // 5. Historial de Ajustes
  filtroHistorialRef: string = '';
  historialPage: PageResponse<HistorialAjusteDTO> | null = null;
  paginaActualHistorial: number = 0;

  ngOnInit(): void {
    // Al entrar, precargar la primera página de prestaciones si es la solapa activa
    if (this.subSolapaActiva === 'prestaciones') {
      this.cargarPrestaciones();
    }
  }

  seleccionarSubSolapa(sub: 'coberturas' | 'periodos' | 'prestaciones' | 'anuladas' | 'historial'): void {
    this.subSolapaActiva = sub;
    this.limpiarMensajes();

    if (sub === 'prestaciones' && !this.prestacionesPage) {
      this.cargarPrestaciones();
    } else if (sub === 'anuladas' && !this.facturasAnuladasPage) {
      this.cargarFacturasAnuladas();
    } else if (sub === 'historial') {
      this.cargarHistorial();
    }
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  mostrarExito(msg: string): void {
    this.mensajeExito = msg;
    this.mensajeError = '';
    setTimeout(() => {
      if (this.mensajeExito === msg) {
        this.mensajeExito = '';
        this.cdr.markForCheck();
      }
    }, 4500);
  }

  mostrarError(msg: string): void {
    this.mensajeError = msg;
    this.mensajeExito = '';
  }

  // =========================================================================
  // 1. Mapeo de Nombres de Coberturas
  // =========================================================================

  buscarCobertura(): void {
    if (!this.busquedaCobCodigo || !this.busquedaCobCodigo.trim()) {
      this.mostrarError('Ingrese un código de cobertura para buscar.');
      return;
    }
    this.limpiarMensajes();
    this.cargando = true;

    this.contableService.buscarCobertura(this.busquedaCobCodigo.trim()).subscribe({
      next: (dto) => {
        this.coberturaSeleccionada = dto;
        this.nuevoNombreMostrarCob = dto.nombreMostrar || dto.nombreOriginal || '';
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.coberturaSeleccionada = null;
        this.mostrarError('No se encontró la cobertura con el código indicado.');
        this.cdr.markForCheck();
      }
    });
  }

  guardarAliasCobertura(): void {
    if (!this.coberturaSeleccionada) return;
    if (!this.nuevoNombreMostrarCob || !this.nuevoNombreMostrarCob.trim()) {
      this.mostrarError('El nombre a mostrar no puede quedar vacío.');
      return;
    }

    this.cargando = true;
    this.limpiarMensajes();

    this.contableService.guardarAliasCobertura({
      codigoCobertura: this.coberturaSeleccionada.codigoCobertura,
      nombreOriginal: this.coberturaSeleccionada.nombreOriginal,
      nombreMostrar: this.nuevoNombreMostrarCob.trim()
    }).subscribe({
      next: (actualizado) => {
        this.coberturaSeleccionada = actualizado;
        this.cargando = false;
        this.mostrarExito(`Nombre de cobertura '${actualizado.codigoCobertura}' actualizado a: "${actualizado.nombreMostrar}".`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError(err?.error?.message || 'Error al guardar el alias de la cobertura.');
        this.cdr.markForCheck();
      }
    });
  }

  // =========================================================================
  // 2. Corrección de Períodos de Facturas
  // =========================================================================

  buscarFacturaPeriodo(): void {
    if (!this.busquedaPerPtoVta || !this.busquedaPerNumero) {
      this.mostrarError('Complete Punto de Venta y Número de comprobante.');
      return;
    }
    this.limpiarMensajes();
    this.cargando = true;

    this.contableService.buscarFacturaPeriodo(
      this.busquedaPerTipo,
      this.busquedaPerLetra,
      this.busquedaPerPtoVta,
      this.busquedaPerNumero
    ).subscribe({
      next: (dto) => {
        this.facturaPeriodoSeleccionada = dto;
        this.nuevoPeriodoCorregido = dto.periodoCorregido || dto.periodoOriginal || '';
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.facturaPeriodoSeleccionada = null;
        this.mostrarError('No se encontró ninguna factura coincidente en el sistema.');
        this.cdr.markForCheck();
      }
    });
  }

  guardarPeriodoCorregido(): void {
    if (!this.facturaPeriodoSeleccionada) return;
    if (!this.nuevoPeriodoCorregido || !this.nuevoPeriodoCorregido.trim()) {
      this.mostrarError('Ingrese la nueva fecha de período corregido.');
      return;
    }

    this.cargando = true;
    this.limpiarMensajes();

    this.contableService.guardarPeriodoCorregido({
      idCabecera: this.facturaPeriodoSeleccionada.idCabecera,
      periodoCorregido: this.nuevoPeriodoCorregido.trim()
    }).subscribe({
      next: (actualizado) => {
        this.facturaPeriodoSeleccionada = actualizado;
        this.cargando = false;
        this.mostrarExito(`Período de factura actualizado correctamente a ${this.formatearFechaSimple(actualizado.periodoCorregido)}.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError(err?.error?.message || 'Error al guardar la corrección de período.');
        this.cdr.markForCheck();
      }
    });
  }

  // =========================================================================
  // 3. Prestaciones a No Considerar
  // =========================================================================

  cargarPrestaciones(pagina: number = 0): void {
    this.cargando = true;
    this.paginaActualPrestaciones = pagina;

    this.contableService.listarPrestaciones(
      this.filtroPrestacionCodigo,
      this.paginaActualPrestaciones,
      this.tamanoPaginaPrestaciones
    ).subscribe({
      next: (page) => {
        this.prestacionesPage = page;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError('Error al cargar catálogo de prestaciones.');
        this.cdr.markForCheck();
      }
    });
  }

  buscarPrestacionesConFiltro(): void {
    this.cargarPrestaciones(0);
  }

  limpiarFiltroPrestaciones(): void {
    this.filtroPrestacionCodigo = '';
    this.cargarPrestaciones(0);
  }

  abrirModalEditarPrestacion(prestacion: PrestacionConsideracionDTO): void {
    this.prestacionEnEdicion = prestacion;
    this.nuevoEstadoPrestacion = prestacion.estado;
    this.modalPrestacionVisible = true;
  }

  cerrarModalPrestacion(): void {
    this.modalPrestacionVisible = false;
    this.prestacionEnEdicion = null;
  }

  guardarCambioEstadoPrestacion(): void {
    if (!this.prestacionEnEdicion) return;

    this.cargando = true;
    this.contableService.cambiarEstadoPrestacion({
      codigo: this.prestacionEnEdicion.codigo,
      estado: this.nuevoEstadoPrestacion
    }).subscribe({
      next: (actualizada) => {
        this.prestacionEnEdicion!.estado = actualizada.estado;
        this.cargando = false;
        this.cerrarModalPrestacion();
        this.mostrarExito(`Estado de la prestación '${actualizada.codigo}' cambiado a "${actualizada.estado}".`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError(err?.error?.message || 'Error al cambiar estado de la prestación.');
        this.cdr.markForCheck();
      }
    });
  }

  // =========================================================================
  // 4. Facturas Anuladas Manualmente
  // =========================================================================

  buscarFacturaAnulacion(): void {
    if (!this.busquedaAnulPtoVta || !this.busquedaAnulNumero) {
      this.mostrarError('Complete Punto de Venta y Número de comprobante.');
      return;
    }
    this.limpiarMensajes();
    this.cargando = true;

    this.contableService.buscarFacturaParaAnulacion(
      this.busquedaAnulTipo,
      this.busquedaAnulLetra,
      this.busquedaAnulPtoVta,
      this.busquedaAnulNumero
    ).subscribe({
      next: (dto) => {
        this.facturaAnulacionSeleccionada = dto;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.facturaAnulacionSeleccionada = null;
        this.mostrarError('No se encontró la factura solicitada.');
        this.cdr.markForCheck();
      }
    });
  }

  cambiarAnulacion(idCabecera: number, anular: boolean): void {
    this.cargando = true;
    this.limpiarMensajes();

    this.contableService.cambiarEstadoAnulacion({
      idCabecera: idCabecera,
      anulada: anular
    }).subscribe({
      next: (dto) => {
        if (this.facturaAnulacionSeleccionada && this.facturaAnulacionSeleccionada.idCabecera === idCabecera) {
          this.facturaAnulacionSeleccionada = dto;
        }
        this.cargando = false;
        this.mostrarExito(anular ? 'Factura anulada manualmente en Débitos.' : 'Factura reactivada (anulación revertida).');
        this.cargarFacturasAnuladas(this.paginaActualAnuladas);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError(err?.error?.message || 'Error al cambiar estado de anulación.');
        this.cdr.markForCheck();
      }
    });
  }

  cargarFacturasAnuladas(pagina: number = 0): void {
    this.paginaActualAnuladas = pagina;
    this.contableService.listarFacturasAnuladas(this.paginaActualAnuladas, 15).subscribe({
      next: (page) => {
        this.facturasAnuladasPage = page;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al listar facturas anuladas', err);
      }
    });
  }

  // =========================================================================
  // 5. Historial de Ajustes
  // =========================================================================

  cargarHistorial(pagina: number = 0): void {
    this.cargando = true;
    this.paginaActualHistorial = pagina;

    this.contableService.obtenerHistorial(this.filtroHistorialRef, this.paginaActualHistorial, 20).subscribe({
      next: (page) => {
        this.historialPage = page;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError('Error al consultar historial.');
        this.cdr.markForCheck();
      }
    });
  }

  buscarHistorialConFiltro(): void {
    this.cargarHistorial(0);
  }

  limpiarFiltroHistorial(): void {
    this.filtroHistorialRef = '';
    this.cargarHistorial(0);
  }

  // =========================================================================
  // Helpers de Formato
  // =========================================================================

  formatearFechaSimple(fechaStr: string | null): string {
    if (!fechaStr) return '—';
    try {
      const partes = fechaStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  }

  formatearMoneda(val: number | null): string {
    if (val === null || val === undefined) return '$ 0,00';
    return '$ ' + val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatearFechaHora(fh: string | null): string {
    if (!fh) return '—';
    try {
      const d = new Date(fh);
      return d.toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return fh;
    }
  }
}
