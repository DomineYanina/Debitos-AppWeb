import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GestionContableService } from '../../core/services/gestion-contable.service';
import { ExcelExportService } from '../../core/services/excel-export';
import { AuthService } from '../../core/services/auth';
import { NotificacionService } from '../../core/services/notificacion.service';
import {
  CoberturaAliasDTO,
  FacturaPeriodoDTO,
  PrestacionConsideracionDTO,
  FacturaAnuladaDTO,
  HistorialAjusteDTO,
  PageResponse
} from '../../core/models/gestion-contable.model';

interface EstadoOrdenTabla {
  columna: string;
  direccion: 'asc' | 'desc';
  paso: number;
}

@Component({
  selector: 'app-gestion-contable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-contable.component.html',
  styleUrl: './gestion-contable.component.css'
})
export class GestionContableComponent implements OnInit {
  private contableService = inject(GestionContableService);
  private excelExportService = inject(ExcelExportService);
  private notificacionService = inject(NotificacionService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  subSolapaActiva: 'coberturas' | 'periodos' | 'prestaciones' | 'anuladas' | 'historial' = 'coberturas';

  // Feedback / Mensajes
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  // Modal de Éxito para Operaciones Confirmadas
  modalExitoVisible: boolean = false;
  modalExitoTitulo: string = '¡Operación Exitosa!';
  modalExitoMensaje: string = '';

  // 1. Coberturas
  busquedaCobCodigo: string = '';
  coberturaSeleccionada: CoberturaAliasDTO | null = null;
  nuevoNombreMostrarCob: string = '';

  coberturasPage: PageResponse<CoberturaAliasDTO> | null = null;
  paginaActualCoberturas: number = 0;
  tamanoPaginaCoberturas: number = 20;
  ordenCoberturas: EstadoOrdenTabla = { columna: '', direccion: 'asc', paso: 0 };

  // Modal edición de cobertura
  modalCoberturaVisible: boolean = false;
  coberturaEnEdicion: CoberturaAliasDTO | null = null;
  nuevoNombreMostrarEdicion: string = '';

  // 2. Períodos de Facturas
  busquedaPerTipo: string = 'FC';
  busquedaPerLetra: string = 'A';
  busquedaPerPtoVta: number | null = 30;
  busquedaPerNumero: number | null = null;
  facturaPeriodoSeleccionada: FacturaPeriodoDTO | null = null;
  nuevoPeriodoMes: string = ''; // "YYYY-MM"
  nuevoPeriodoCorregido: string = ''; // "YYYY-MM-DD" o "DD/MM/YYYY"

  // 3. Prestaciones a No Considerar
  filtroPrestacionCodigo: string = '';
  filtroPrestacionEstado: string = '';
  filtroPrestacionEstadoAmb: string = '';
  filtroPrestacionEstadoInt: string = '';
  prestacionesPage: PageResponse<PrestacionConsideracionDTO> | null = null;
  paginaActualPrestaciones: number = 0;
  tamanoPaginaPrestaciones: number = 20;
  ordenPrestaciones: EstadoOrdenTabla = { columna: '', direccion: 'asc', paso: 0 };

  // Modal edición de prestación
  modalPrestacionVisible: boolean = false;
  prestacionEnEdicion: PrestacionConsideracionDTO | null = null;
  nuevoEstadoPrestacion: string = 'Considerar';
  nuevoEstadoAmbulatorio: string = 'Considerar';
  nuevoEstadoInternado: string = 'Considerar';

  // 4. Facturas Anuladas
  readonly PUNTOS_VENTA_PERMITIDOS: number[] = [30, 31, 32, 36, 53];
  busquedaAnulTipo: string = 'FC';
  busquedaAnulLetra: string = 'A';
  busquedaAnulPtoVta: number | null = 30;
  busquedaAnulNumero: number | null = null;
  facturaAnulacionSeleccionada: FacturaAnuladaDTO | null = null;

  // Modal Anulación con Documento Anulador
  modalAnulacionVisible: boolean = false;
  modalAnulTipo: string = 'FC';
  modalAnulLetra: string = 'A';
  modalAnulPtoVta: number | null = 30;
  modalAnulNumero: number | null = null;
  docAAnularModal: FacturaAnuladaDTO | null = null;
  buscandoModalDoc: boolean = false;
  errorModalDoc: string = '';

  candidatosAnulador: FacturaAnuladaDTO[] = [];
  filtroCandidatoAnulador: string = '';
  cargandoCandidatosAnulador: boolean = false;
  errorCandidatosAnulador: string = '';
  docAnuladorModal: FacturaAnuladaDTO | null = null;
  errorModalAnulador: string = '';
  modalGuardando: boolean = false;
  modalRechazoVisible: boolean = false;
  motivoRechazoSolicitud: string = '';
  rechazandoSolicitud: boolean = false;

  facturasAnuladasPage: PageResponse<FacturaAnuladaDTO> | null = null;
  paginaActualAnuladas: number = 0;
  ordenAnuladas: EstadoOrdenTabla = { columna: '', direccion: 'desc', paso: 0 };
  filtroAnuladasTipo: string = '';
  filtroAnuladasTexto: string = '';
  modalDetalleAnulacionVisible: boolean = false;
  detalleAnulacionSeleccionada: FacturaAnuladaDTO | null = null;

  // 5. Historial de Ajustes
  filtroHistorialRef: string = '';
  historialPage: PageResponse<HistorialAjusteDTO> | null = null;
  paginaActualHistorial: number = 0;
  ordenHistorial: EstadoOrdenTabla = { columna: '', direccion: 'desc', paso: 0 };

  ngOnInit(): void {
    // Procesar posibles queryParams (ej. redirección desde notificación de solicitud de anulación)
    this.route.queryParams.subscribe(params => {
      if (params['subSolapa'] === 'anuladas') {
        this.seleccionarSubSolapa('anuladas');
        if (params['abrirModal'] === 'true' && params['ptoVta'] && params['numero']) {
          this.abrirModalAnulacion();
          this.modalAnulTipo = params['tipo'] || 'FC';
          this.modalAnulLetra = params['letra'] || 'A';
          this.modalAnulPtoVta = Number(params['ptoVta']);
          this.modalAnulNumero = Number(params['numero']);
          this.buscarDocAAnularModal();
          this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
        }
      }
    });

    // Precargar coberturas o prestaciones según solapa activa
    if (this.subSolapaActiva === 'coberturas') {
      this.cargarCoberturas();
    } else if (this.subSolapaActiva === 'prestaciones') {
      this.cargarPrestaciones();
    }
  }

  seleccionarSubSolapa(sub: 'coberturas' | 'periodos' | 'prestaciones' | 'anuladas' | 'historial'): void {
    this.subSolapaActiva = sub;
    this.limpiarMensajes();

    if (sub === 'coberturas' && !this.coberturasPage) {
      this.cargarCoberturas();
    } else if (sub === 'prestaciones' && !this.prestacionesPage) {
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

  mostrarModalExito(titulo: string, mensaje: string): void {
    this.modalExitoTitulo = titulo;
    this.modalExitoMensaje = mensaje;
    this.modalExitoVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModalExito(): void {
    this.modalExitoVisible = false;
    this.modalExitoMensaje = '';
    this.cdr.markForCheck();
  }

  @HostListener('window:keydown', ['$event'])
  manejarTecladoModalExito(event: KeyboardEvent): void {
    if (!this.modalExitoVisible) return;
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      this.cerrarModalExito();
    }
  }

  // =========================================================================
  // 1. Mapeo de Nombres de Coberturas
  // =========================================================================

  cargarCoberturas(pagina: number = 0): void {
    this.paginaActualCoberturas = pagina;
    this.cargando = true;

    this.contableService.listarCoberturas(
      this.busquedaCobCodigo,
      pagina,
      this.tamanoPaginaCoberturas,
      this.ordenCoberturas.columna || undefined,
      this.ordenCoberturas.columna ? this.ordenCoberturas.direccion : undefined
    ).subscribe({
      next: (page) => {
        this.coberturasPage = page;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError('Error al cargar el listado de coberturas.');
        this.cdr.markForCheck();
      }
    });
  }

  buscarCoberturasConFiltro(): void {
    this.cargarCoberturas(0);
  }

  limpiarFiltroCoberturas(): void {
    this.busquedaCobCodigo = '';
    this.cargarCoberturas(0);
  }

  abrirModalEditarCobertura(cob: CoberturaAliasDTO): void {
    this.coberturaEnEdicion = { ...cob };
    this.nuevoNombreMostrarEdicion = cob.nombreMostrar || cob.nombreOriginal || '';
    this.modalCoberturaVisible = true;
  }

  cerrarModalCobertura(): void {
    this.modalCoberturaVisible = false;
    this.coberturaEnEdicion = null;
    this.nuevoNombreMostrarEdicion = '';
  }

  guardarEdicionModalCobertura(): void {
    if (!this.coberturaEnEdicion) return;
    if (!this.nuevoNombreMostrarEdicion || !this.nuevoNombreMostrarEdicion.trim()) {
      this.mostrarError('El nombre a mostrar no puede quedar vacío.');
      return;
    }

    this.cargando = true;
    this.limpiarMensajes();

    const cod = this.coberturaEnEdicion.codigoCobertura;
    const nuevoNombre = this.nuevoNombreMostrarEdicion.trim();

    this.contableService.guardarAliasCobertura({
      codigoCobertura: cod,
      nombreOriginal: this.coberturaEnEdicion.nombreOriginal,
      nombreMostrar: nuevoNombre
    }).subscribe({
      next: (actualizado) => {
        // Actualizar reactivamente en la tabla
        if (this.coberturasPage && this.coberturasPage.content) {
          const item = this.coberturasPage.content.find(c => c.codigoCobertura === cod);
          if (item) {
            item.nombreMostrar = actualizado.nombreMostrar;
          }
        }
        this.cargando = false;
        this.cerrarModalCobertura();
        this.mostrarExito(`Nombre de cobertura '${actualizado.codigoCobertura}' actualizado a: "${actualizado.nombreMostrar}".`);
        this.mostrarModalExito(
          'Nombre de Cobertura Actualizado',
          `El nombre a mostrar de la cobertura <strong>${actualizado.codigoCobertura}</strong>${actualizado.nombreOriginal ? ' (' + actualizado.nombreOriginal + ')' : ''} ha sido actualizado a <strong>"${actualizado.nombreMostrar}"</strong> exitosamente.`
        );
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarError(err?.error?.message || 'Error al guardar el alias de la cobertura.');
        this.cdr.markForCheck();
      }
    });
  }

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
        this.mostrarModalExito(
          'Nombre de Cobertura Actualizado',
          `El nombre a mostrar de la cobertura <strong>${actualizado.codigoCobertura}</strong> ha sido actualizado a <strong>"${actualizado.nombreMostrar}"</strong> exitosamente.`
        );
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
        const fechaPeriodo = dto.periodoCorregido || dto.periodoOriginal || '';
        if (fechaPeriodo) {
          let ym = '';
          if (fechaPeriodo.includes('-')) {
            ym = fechaPeriodo.substring(0, 7);
          } else if (fechaPeriodo.includes('/')) {
            const parts = fechaPeriodo.split('/');
            if (parts.length === 3) {
              ym = `${parts[2]}-${parts[1].padStart(2, '0')}`;
            }
          }
          this.nuevoPeriodoMes = ym;
          this.nuevoPeriodoCorregido = ym ? `${ym}-01` : '';
        } else {
          this.nuevoPeriodoMes = '';
          this.nuevoPeriodoCorregido = '';
        }
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.facturaPeriodoSeleccionada = null;
        this.nuevoPeriodoMes = '';
        this.nuevoPeriodoCorregido = '';
        this.mostrarError('No se encontró ninguna factura coincidente en el sistema.');
        this.cdr.markForCheck();
      }
    });
  }

  onPeriodoMesChange(val: string): void {
    this.nuevoPeriodoMes = val;
    if (val && val.trim().length >= 7) {
      const ym = val.trim().substring(0, 7);
      this.nuevoPeriodoCorregido = `${ym}-01`;
    } else {
      this.nuevoPeriodoCorregido = '';
    }
  }

  guardarPeriodoCorregido(): void {
    if (!this.facturaPeriodoSeleccionada) return;
    if (this.nuevoPeriodoMes && this.nuevoPeriodoMes.trim().length >= 7) {
      this.nuevoPeriodoCorregido = `${this.nuevoPeriodoMes.trim().substring(0, 7)}-01`;
    }
    if (!this.nuevoPeriodoCorregido || !this.nuevoPeriodoCorregido.trim()) {
      this.mostrarError('Seleccione el nuevo mes y año de período corregido.');
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
        const comp = `${actualizado.tipo || ''} ${actualizado.letra || ''} ${actualizado.ptovta || ''}-${actualizado.numero || ''}`.trim();
        this.mostrarExito(`Período de factura actualizado correctamente a ${this.formatearFechaSimple(actualizado.periodoCorregido)}.`);
        this.mostrarModalExito(
          'Período Contable Actualizado',
          `El período contable del comprobante <strong>${comp}</strong> ha sido modificado exitosamente a <strong>${this.formatearFechaSimple(actualizado.periodoCorregido)}</strong>.`
        );
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
      this.tamanoPaginaPrestaciones,
      this.ordenPrestaciones.columna || undefined,
      this.ordenPrestaciones.columna ? this.ordenPrestaciones.direccion : undefined,
      this.filtroPrestacionEstadoAmb || this.filtroPrestacionEstado || undefined,
      this.filtroPrestacionEstadoInt || undefined
    ).subscribe({
      next: (page) => {
        if (page.content.length === 0 && pagina > 0 && page.totalPages > 0) {
          this.cargarPrestaciones(page.totalPages - 1);
          return;
        }
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
    this.filtroPrestacionEstado = '';
    this.filtroPrestacionEstadoAmb = '';
    this.filtroPrestacionEstadoInt = '';
    this.cargarPrestaciones(0);
  }

  abrirModalEditarPrestacion(prestacion: PrestacionConsideracionDTO): void {
    this.prestacionEnEdicion = prestacion;
    this.nuevoEstadoPrestacion = prestacion.estado || 'Considerar';
    this.nuevoEstadoAmbulatorio = prestacion.estadoAmbulatorio || prestacion.estado || 'Considerar';
    this.nuevoEstadoInternado = prestacion.estadoInternado || prestacion.estado || 'Considerar';
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
      estadoAmbulatorio: this.nuevoEstadoAmbulatorio,
      estadoInternado: this.nuevoEstadoInternado,
      estado: this.nuevoEstadoAmbulatorio
    }).subscribe({
      next: (actualizada) => {
        this.prestacionEnEdicion!.estado = actualizada.estado;
        this.prestacionEnEdicion!.estadoAmbulatorio = actualizada.estadoAmbulatorio;
        this.prestacionEnEdicion!.estadoInternado = actualizada.estadoInternado;
        this.cargando = false;
        const codPres = actualizada.codigo;
        const descPres = this.prestacionEnEdicion?.descripcion || '';
        this.cerrarModalPrestacion();
        this.mostrarExito(`Prestación '${actualizada.codigo}' actualizada: Ambulatorios: "${actualizada.estadoAmbulatorio}", Internados: "${actualizada.estadoInternado}".`);
        this.mostrarModalExito(
          'Estado de Prestación Actualizado',
          `La prestación <strong>${codPres}</strong>${descPres ? ' (' + descPres + ')' : ''} ha sido configurada exitosamente:<br/>• Estado Ambulatorios: <strong>"${actualizada.estadoAmbulatorio}"</strong><br/>• Estado Internados: <strong>"${actualizada.estadoInternado}"</strong>`
        );
        if (this.filtroPrestacionEstadoAmb || this.filtroPrestacionEstadoInt || this.filtroPrestacionEstado) {
          this.cargarPrestaciones(this.paginaActualPrestaciones);
        }
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
    if (!this.busquedaAnulNumero) {
      this.facturaAnulacionSeleccionada = null;
      this.filtroAnuladasTipo = this.busquedaAnulTipo || '';
      this.limpiarMensajes();
      this.cargarFacturasAnuladas(0);
      return;
    }
    if (!this.busquedaAnulPtoVta) {
      this.mostrarError('Complete Punto de Venta y Número de comprobante.');
      return;
    }
    if (!this.PUNTOS_VENTA_PERMITIDOS.includes(Number(this.busquedaAnulPtoVta))) {
      this.mostrarError('El punto de venta debe pertenecer a los permitidos (30, 31, 32, 36 o 53).');
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
        this.mostrarError('No se encontró el documento solicitado.');
        this.cdr.markForCheck();
      }
    });
  }

  cambiarAnulacion(idCabecera: number, anular: boolean): void {
    if (anular) {
      if (this.facturaAnulacionSeleccionada && this.facturaAnulacionSeleccionada.idCabecera === idCabecera) {
        this.abrirModalConFactura(this.facturaAnulacionSeleccionada);
      } else {
        this.abrirModalAnulacion();
      }
      return;
    }

    this.cargando = true;
    this.limpiarMensajes();

    this.contableService.cambiarEstadoAnulacion({
      idCabecera: idCabecera,
      anulada: false
    }).subscribe({
      next: (dto) => {
        if (this.facturaAnulacionSeleccionada && this.facturaAnulacionSeleccionada.idCabecera === idCabecera) {
          this.facturaAnulacionSeleccionada = dto;
        }
        this.cargando = false;
        const comp = dto?.comprobante || (this.facturaAnulacionSeleccionada?.comprobante ? this.facturaAnulacionSeleccionada.comprobante : `ID: ${idCabecera}`);
        this.mostrarExito('Factura reactivada (anulación revertida).');
        this.mostrarModalExito(
          'Comprobante Reactivado con Éxito',
          `La anulación manual del comprobante <strong>${comp}</strong> ha sido revertida exitosamente. El documento vuelve a computar en el Tablero de Control.`
        );
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

  private resetearPaso2Anulador(): void {
    this.candidatosAnulador = [];
    this.filtroCandidatoAnulador = '';
    this.cargandoCandidatosAnulador = false;
    this.errorCandidatosAnulador = '';
    this.docAnuladorModal = null;
    this.errorModalAnulador = '';
  }

  abrirModalAnulacion(): void {
    this.modalAnulTipo = 'FC';
    this.modalAnulLetra = 'A';
    this.modalAnulPtoVta = 30;
    this.modalAnulNumero = null;
    this.docAAnularModal = null;
    this.buscandoModalDoc = false;
    this.errorModalDoc = '';

    this.resetearPaso2Anulador();
    this.modalGuardando = false;

    this.modalAnulacionVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModalAnulacion(): void {
    this.modalAnulacionVisible = false;
    this.cdr.markForCheck();
  }

  abrirModalDetalleAnulacion(fa: FacturaAnuladaDTO): void {
    this.detalleAnulacionSeleccionada = fa;
    this.modalDetalleAnulacionVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModalDetalleAnulacion(): void {
    this.modalDetalleAnulacionVisible = false;
    this.detalleAnulacionSeleccionada = null;
    this.cdr.markForCheck();
  }

  reactivarDesdeModalDetalle(): void {
    if (!this.detalleAnulacionSeleccionada) return;
    const id = this.detalleAnulacionSeleccionada.idCabecera;
    this.cerrarModalDetalleAnulacion();
    this.cambiarAnulacion(id, false);
  }

  abrirModalConFactura(fa: FacturaAnuladaDTO): void {
    this.abrirModalAnulacion();
    this.docAAnularModal = fa;
    this.modalAnulTipo = fa.tipo || 'FC';
    this.modalAnulLetra = fa.letra || 'A';
    this.modalAnulPtoVta = fa.ptovta || 30;
    this.modalAnulNumero = fa.numero;
    this.cargarCandidatosParaDocumentoOrigen(fa);
    this.cdr.markForCheck();
  }

  buscarDocAAnularModal(): void {
    if (!this.modalAnulPtoVta || !this.modalAnulNumero) {
      this.errorModalDoc = 'Complete Punto de Venta y Número del documento a anular.';
      return;
    }
    if (!this.PUNTOS_VENTA_PERMITIDOS.includes(Number(this.modalAnulPtoVta))) {
      this.errorModalDoc = 'El punto de venta debe pertenecer a los permitidos (30, 31, 32, 36 o 53).';
      return;
    }
    this.errorModalDoc = '';
    this.buscandoModalDoc = true;
    this.docAAnularModal = null;
    this.resetearPaso2Anulador();

    this.contableService.buscarFacturaParaAnulacion(
      this.modalAnulTipo,
      this.modalAnulLetra,
      this.modalAnulPtoVta,
      this.modalAnulNumero
    ).subscribe({
      next: (dto) => {
        this.buscandoModalDoc = false;
        if (dto.anulada) {
          this.errorModalDoc = `El comprobante ${dto.comprobante} ya se encuentra anulado. Para reactivarlo hágalo desde la tabla principal.`;
          this.docAAnularModal = null;
        } else {
          this.docAAnularModal = dto;
          this.errorModalDoc = '';
          this.cargarCandidatosParaDocumentoOrigen(dto);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.buscandoModalDoc = false;
        this.docAAnularModal = null;
        this.errorModalDoc = 'No se encontró el documento a anular con los datos ingresados.';
        this.cdr.markForCheck();
      }
    });
  }

  cargarCandidatosParaDocumentoOrigen(doc: FacturaAnuladaDTO): void {
    this.resetearPaso2Anulador();
    if (!doc.asociadogrupo || doc.asociadogrupo <= 0) {
      this.errorCandidatosAnulador = 'El documento seleccionado no posee asociadogrupo asignado en Cabecera, por lo que no es posible buscar documentos anuladores del mismo grupo.';
      return;
    }

    this.cargandoCandidatosAnulador = true;
    this.contableService.listarCandidatosAnulador(doc.idCabecera).subscribe({
      next: (lista) => {
        this.cargandoCandidatosAnulador = false;
        this.candidatosAnulador = lista || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoCandidatosAnulador = false;
        this.candidatosAnulador = [];
        this.errorCandidatosAnulador = err?.error?.message || `No se pudieron cargar los comprobantes del asociadogrupo #${doc.asociadogrupo}.`;
        this.cdr.markForCheck();
      }
    });
  }

  get candidatosAnuladorFiltrados(): FacturaAnuladaDTO[] {
    const q = this.filtroCandidatoAnulador.trim().toLowerCase();
    if (!q) {
      return this.candidatosAnulador;
    }
    return this.candidatosAnulador.filter((cand) => {
      const texto = [
        cand.tipo,
        cand.letra,
        cand.ptovta,
        cand.numero,
        cand.comprobante,
        `${cand.tipo} ${cand.letra} ${cand.ptovta}-${cand.numero}`,
        cand.cobertura,
        this.formatearFechaSimple(cand.fecha),
        cand.fecha,
        cand.importe
      ]
        .filter((v) => v !== null && v !== undefined)
        .join(' ')
        .toLowerCase();
      return texto.includes(q);
    });
  }

  seleccionarCandidatoAnulador(cand: FacturaAnuladaDTO): void {
    if (!this.docAAnularModal) {
      return;
    }
    if (cand.idCabecera === this.docAAnularModal.idCabecera) {
      this.errorModalAnulador = 'El comprobante anulador no puede ser el mismo documento que se intenta anular.';
      this.docAnuladorModal = null;
      return;
    }
    if (!this.docAAnularModal.asociadogrupo || cand.asociadogrupo !== this.docAAnularModal.asociadogrupo) {
      this.errorModalAnulador = 'El documento anulador debe pertenecer al mismo asociadogrupo que el documento a anular.';
      this.docAnuladorModal = null;
      return;
    }
    this.docAnuladorModal = cand;
    this.errorModalAnulador = '';
    this.cdr.markForCheck();
  }

  confirmarAnulacionModal(): void {
    if (!this.docAAnularModal) {
      this.errorModalDoc = 'Debe seleccionar una factura activa para anular.';
      return;
    }
    if (!this.docAAnularModal.asociadogrupo || this.docAAnularModal.asociadogrupo <= 0) {
      this.errorModalDoc = 'El documento a anular no posee asociadogrupo asignado.';
      return;
    }
    if (!this.docAnuladorModal) {
      this.errorModalAnulador = 'Debe seleccionar un documento anulador del mismo asociadogrupo (obligatorio).';
      return;
    }
    if (this.docAnuladorModal.asociadogrupo !== this.docAAnularModal.asociadogrupo) {
      this.errorModalAnulador = 'El documento anulador seleccionado pertenece a otro asociadogrupo.';
      return;
    }

    this.modalGuardando = true;
    this.errorModalAnulador = '';

    const compAnulador = this.docAnuladorModal.comprobante ||
      `${this.docAnuladorModal.tipo} ${this.docAnuladorModal.letra} ${this.docAnuladorModal.ptovta}-${this.docAnuladorModal.numero}`;

    this.contableService.cambiarEstadoAnulacion({
      idCabecera: this.docAAnularModal.idCabecera,
      anulada: true,
      idCabeceraAnulador: this.docAnuladorModal.idCabecera,
      comprobanteAnulador: compAnulador
    }).subscribe({
      next: (dto) => {
        this.modalGuardando = false;
        this.modalAnulacionVisible = false;
        this.mostrarExito(`Factura ${dto.comprobante} anulada con éxito asociando ${compAnulador}.`);
        this.mostrarModalExito(
          'Factura Anulada con Éxito',
          `La factura <strong>${dto.comprobante}</strong> ha sido marcada como anulada exitosamente asociando el comprobante anulador <strong>${compAnulador}</strong>.`
        );
        if (this.facturaAnulacionSeleccionada && this.facturaAnulacionSeleccionada.idCabecera === dto.idCabecera) {
          this.facturaAnulacionSeleccionada = dto;
        }
        this.cargarFacturasAnuladas(0);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.modalGuardando = false;
        this.errorModalAnulador = err?.error?.message || 'Error al procesar la anulación de la factura.';
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalRechazoSolicitud(): void {
    this.motivoRechazoSolicitud = '';
    this.rechazandoSolicitud = false;
    this.modalRechazoVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModalRechazoSolicitud(): void {
    this.modalRechazoVisible = false;
    this.motivoRechazoSolicitud = '';
    this.rechazandoSolicitud = false;
    this.cdr.markForCheck();
  }

  confirmarRechazarSolicitud(): void {
    if (!this.docAAnularModal) return;
    this.rechazandoSolicitud = true;
    const doc = this.docAAnularModal;
    const idNotif = doc.idNotificacionSolicitud;
    const tipo = doc.tipo || 'FC';
    const letra = doc.letra || 'A';
    const ptovta = Number(doc.ptovta || 0);
    const numero = Number(doc.numero || 0);
    const motivo = this.motivoRechazoSolicitud ? this.motivoRechazoSolicitud.trim() : '';

    this.notificacionService.rechazarSolicitudAnulacion({
      idNotificacion: idNotif,
      tipoDoc: tipo,
      letraDoc: letra,
      puntoVenta: ptovta,
      numero: numero,
      motivoRechazo: motivo
    }).subscribe({
      next: () => {
        this.rechazandoSolicitud = false;
        this.cerrarModalRechazoSolicitud();
        this.cerrarModalAnulacion();
        const docRef = `${tipo} ${letra} ${('0000' + ptovta).slice(-4)}-${('00000000' + numero).slice(-8)}`;
        this.mostrarExito(`Se rechazó la solicitud de anulación del comprobante ${docRef}.`);
        this.mostrarModalExito(
          'Solicitud de Anulación Rechazada',
          `La solicitud de anulación para el documento <strong>${docRef}</strong> ha sido rechazada exitosamente. Se notificó al operador solicitante.`
        );
        this.cargarFacturasAnuladas(this.paginaActualAnuladas);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.rechazandoSolicitud = false;
        console.error('Error al rechazar solicitud:', err);
        this.mostrarError('No se pudo rechazar la solicitud de anulación. Por favor intente nuevamente.');
        this.cdr.markForCheck();
      }
    });
  }

  cargarFacturasAnuladas(pagina: number = 0): void {
    this.paginaActualAnuladas = pagina;
    const tipoParam = this.filtroAnuladasTipo?.trim() || undefined;
    const filtroParam = this.filtroAnuladasTexto?.trim() || undefined;
    const obs$ = (tipoParam || filtroParam)
      ? this.contableService.listarFacturasAnuladas(
          this.paginaActualAnuladas,
          15,
          this.ordenAnuladas.columna || undefined,
          this.ordenAnuladas.columna ? this.ordenAnuladas.direccion : undefined,
          tipoParam,
          filtroParam
        )
      : this.contableService.listarFacturasAnuladas(
          this.paginaActualAnuladas,
          15,
          this.ordenAnuladas.columna || undefined,
          this.ordenAnuladas.columna ? this.ordenAnuladas.direccion : undefined
        );

    obs$.subscribe({
      next: (page) => {
        this.facturasAnuladasPage = page;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al listar facturas anuladas', err);
      }
    });
  }

  buscarFacturasAnuladasConFiltro(): void {
    this.cargarFacturasAnuladas(0);
  }

  limpiarFiltroFacturasAnuladas(): void {
    this.filtroAnuladasTipo = '';
    this.filtroAnuladasTexto = '';
    this.cargarFacturasAnuladas(0);
  }

  // =========================================================================
  // 5. Historial de Ajustes
  // =========================================================================

  cargarHistorial(pagina: number = 0): void {
    this.cargando = true;
    this.paginaActualHistorial = pagina;

    this.contableService.obtenerHistorial(
      this.filtroHistorialRef,
      this.paginaActualHistorial,
      20,
      this.ordenHistorial.columna || undefined,
      this.ordenHistorial.columna ? this.ordenHistorial.direccion : undefined
    ).subscribe({
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
  // Ordenamiento Unificado de Tablas (ciclo de 3 clics: asc/desc -> invierte -> natural)
  // =========================================================================

  ordenarTabla(tabla: 'coberturas' | 'prestaciones' | 'anuladas' | 'historial', columna: string): void {
    const estado = this.obtenerEstadoOrden(tabla);
    if (estado.columna === columna) {
      if (estado.paso === 1) {
        estado.paso = 2;
        estado.direccion = estado.direccion === 'asc' ? 'desc' : 'asc';
      } else {
        // 3er clic: restaurar el orden natural por defecto del servidor
        estado.columna = '';
        estado.paso = 0;
      }
    } else {
      estado.columna = columna;
      estado.paso = 1;
      const esDescPorDefecto = columna === 'fecha' || columna === 'fechaHora' || columna === 'importe';
      estado.direccion = esDescPorDefecto ? 'desc' : 'asc';
    }

    if (tabla === 'coberturas') {
      this.cargarCoberturas(0);
    } else if (tabla === 'prestaciones') {
      this.cargarPrestaciones(0);
    } else if (tabla === 'anuladas') {
      this.cargarFacturasAnuladas(0);
    } else {
      this.cargarHistorial(0);
    }
  }

  getIconoOrden(estado: EstadoOrdenTabla, columna: string): string {
    if (estado.columna !== columna) return '↕';
    return estado.direccion === 'asc' ? '▲' : '▼';
  }

  private obtenerEstadoOrden(tabla: 'coberturas' | 'prestaciones' | 'anuladas' | 'historial'): EstadoOrdenTabla {
    switch (tabla) {
      case 'coberturas': return this.ordenCoberturas;
      case 'prestaciones': return this.ordenPrestaciones;
      case 'anuladas': return this.ordenAnuladas;
      case 'historial': return this.ordenHistorial;
    }
  }

  // =========================================================================
  // Helpers de Formato
  // =========================================================================

  formatearComprobante(doc: { tipo?: string | null; letra?: string | null; ptovta?: number | null; numero?: number | null; comprobante?: string | null } | null | undefined): string {
    if (!doc) return '—';
    if (doc.tipo && doc.letra && doc.ptovta != null && doc.numero != null) {
      const pto = String(doc.ptovta).padStart(4, '0');
      const num = String(doc.numero).padStart(8, '0');
      return `${doc.tipo.trim()} ${doc.letra.trim()}${pto}-${num}`;
    }
    return doc.comprobante || '—';
  }

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

  // =========================================================================
  // Exportación a Excel
  // =========================================================================

  async exportarAExcel(): Promise<void> {
    if (this.cargando) return;
    this.limpiarMensajes();
    this.cargando = true;
    this.cdr.markForCheck();

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    try {
      switch (this.subSolapaActiva) {
        case 'coberturas': {
          this.contableService.listarCoberturas(
            this.busquedaCobCodigo,
            0,
            10000,
            this.ordenCoberturas.columna || undefined,
            this.ordenCoberturas.columna ? this.ordenCoberturas.direccion : undefined
          ).subscribe({
            next: async (res) => {
              try {
                if (!res.content || res.content.length === 0) {
                  this.mostrarError('No hay coberturas para exportar.');
                  this.cargando = false;
                  this.cdr.markForCheck();
                  return;
                }
                const filename = `gestion_coberturas_${timestamp}.xlsx`;
                await this.excelExportService.exportarGestionCoberturas(res.content, this.busquedaCobCodigo, filename);
                this.mostrarExito('Archivo Excel de Coberturas generado exitosamente.');
              } catch (e) {
                this.mostrarError('Error al generar el archivo Excel de Coberturas.');
              } finally {
                this.cargando = false;
                this.cdr.markForCheck();
              }
            },
            error: () => {
              this.mostrarError('Error al consultar datos de Coberturas para exportar.');
              this.cargando = false;
              this.cdr.markForCheck();
            }
          });
          break;
        }

        case 'periodos': {
          this.contableService.listarFacturasPeriodoCorregido(0, 10000).subscribe({
            next: async (res) => {
              try {
                if (!res.content || res.content.length === 0) {
                  this.mostrarError('No hay facturas con período corregido para exportar.');
                  this.cargando = false;
                  this.cdr.markForCheck();
                  return;
                }
                const filename = `gestion_periodos_corregidos_${timestamp}.xlsx`;
                await this.excelExportService.exportarGestionPeriodos(res.content, filename);
                this.mostrarExito('Archivo Excel de Períodos de Facturas generado exitosamente.');
              } catch (e) {
                this.mostrarError('Error al generar el archivo Excel de Períodos.');
              } finally {
                this.cargando = false;
                this.cdr.markForCheck();
              }
            },
            error: () => {
              this.mostrarError('Error al consultar facturas con período corregido para exportar.');
              this.cargando = false;
              this.cdr.markForCheck();
            }
          });
          break;
        }

        case 'prestaciones': {
          this.contableService.listarPrestaciones(
            this.filtroPrestacionCodigo,
            0,
            10000,
            this.ordenPrestaciones.columna || undefined,
            this.ordenPrestaciones.columna ? this.ordenPrestaciones.direccion : undefined,
            this.filtroPrestacionEstadoAmb || this.filtroPrestacionEstado || undefined,
            this.filtroPrestacionEstadoInt || undefined
          ).subscribe({
            next: async (res) => {
              try {
                if (!res.content || res.content.length === 0) {
                  this.mostrarError('No hay prestaciones para exportar.');
                  this.cargando = false;
                  this.cdr.markForCheck();
                  return;
                }
                const filename = `gestion_prestaciones_${timestamp}.xlsx`;
                const partesFiltro: string[] = [];
                if (this.filtroPrestacionCodigo?.trim()) partesFiltro.push(this.filtroPrestacionCodigo.trim());
                if (this.filtroPrestacionEstadoAmb) partesFiltro.push(`Ambulatorios: ${this.filtroPrestacionEstadoAmb}`);
                if (this.filtroPrestacionEstadoInt) partesFiltro.push(`Internados: ${this.filtroPrestacionEstadoInt}`);
                if (!this.filtroPrestacionEstadoAmb && !this.filtroPrestacionEstadoInt && this.filtroPrestacionEstado) {
                  partesFiltro.push(`Estado: ${this.filtroPrestacionEstado}`);
                }
                await this.excelExportService.exportarGestionPrestaciones(res.content, partesFiltro.join(' | '), filename);
                this.mostrarExito('Archivo Excel de Prestaciones generado exitosamente.');
              } catch (e) {
                this.mostrarError('Error al generar el archivo Excel de Prestaciones.');
              } finally {
                this.cargando = false;
                this.cdr.markForCheck();
              }
            },
            error: () => {
              this.mostrarError('Error al consultar datos de Prestaciones para exportar.');
              this.cargando = false;
              this.cdr.markForCheck();
            }
          });
          break;
        }

        case 'anuladas': {
          const tipoParam = this.filtroAnuladasTipo?.trim() || undefined;
          const filtroParam = this.filtroAnuladasTexto?.trim() || undefined;
          const obsAnuladas$ = (tipoParam || filtroParam)
            ? this.contableService.listarFacturasAnuladas(
                0,
                10000,
                this.ordenAnuladas.columna || undefined,
                this.ordenAnuladas.columna ? this.ordenAnuladas.direccion : undefined,
                tipoParam,
                filtroParam
              )
            : this.contableService.listarFacturasAnuladas(
                0,
                10000,
                this.ordenAnuladas.columna || undefined,
                this.ordenAnuladas.columna ? this.ordenAnuladas.direccion : undefined
              );
          obsAnuladas$.subscribe({
            next: async (res) => {
              try {
                if (!res.content || res.content.length === 0) {
                  this.mostrarError('No hay facturas anuladas para exportar.');
                  this.cargando = false;
                  this.cdr.markForCheck();
                  return;
                }
                const filename = `gestion_facturas_anuladas_${timestamp}.xlsx`;
                await this.excelExportService.exportarGestionFacturasAnuladas(res.content, filename);
                this.mostrarExito('Archivo Excel de Facturas Anuladas generado exitosamente.');
              } catch (e) {
                this.mostrarError('Error al generar el archivo Excel de Facturas Anuladas.');
              } finally {
                this.cargando = false;
                this.cdr.markForCheck();
              }
            },
            error: () => {
              this.mostrarError('Error al consultar facturas anuladas para exportar.');
              this.cargando = false;
              this.cdr.markForCheck();
            }
          });
          break;
        }

        case 'historial': {
          this.contableService.obtenerHistorial(
            this.filtroHistorialRef,
            0,
            10000,
            this.ordenHistorial.columna || undefined,
            this.ordenHistorial.columna ? this.ordenHistorial.direccion : undefined
          ).subscribe({
            next: async (res) => {
              try {
                if (!res.content || res.content.length === 0) {
                  this.mostrarError('No hay eventos de historial para exportar.');
                  this.cargando = false;
                  this.cdr.markForCheck();
                  return;
                }
                const filename = `gestion_historial_ajustes_${timestamp}.xlsx`;
                await this.excelExportService.exportarGestionHistorial(res.content, this.filtroHistorialRef, filename);
                this.mostrarExito('Archivo Excel de Historial de Ajustes generado exitosamente.');
              } catch (e) {
                this.mostrarError('Error al generar el archivo Excel de Historial.');
              } finally {
                this.cargando = false;
                this.cdr.markForCheck();
              }
            },
            error: () => {
              this.mostrarError('Error al consultar historial de ajustes para exportar.');
              this.cargando = false;
              this.cdr.markForCheck();
            }
          });
          break;
        }
      }
    } catch (e) {
      this.mostrarError('Ocurrió un error inesperado al iniciar la exportación.');
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }
}
