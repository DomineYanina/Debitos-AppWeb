import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria';
import { DocumentoAsociado } from '../../core/models/documento-asociado';
import { ExcelExportService } from '../../core/services/excel-export';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule, themeQuartz, GridApi, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { GroupedSelectEditor } from '../../core/components/grouped-select-editor/grouped-select-editor';
import { LISTA_MOTIVOS_DEBITO, LISTA_MOTIVOS_REFACTURA } from '../../core/constants/motivos';


ModuleRegistry.registerModules([AllCommunityModule]);

import { AuditoriaMathService } from '../../core/services/auditoria-math';
import { AuditoriaGridConfigService } from '../../core/services/auditoria-grid-config';
import { InactividadService } from '../../core/services/InactividadService';
import { TourService } from '../../core/services/tour.service';
import { HelpDrawerComponent } from '../../core/components/help-drawer/help-drawer.component';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, AgGridModule, HelpDrawerComponent],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AuditoriaComponent implements OnInit, OnDestroy, AfterViewInit {
  isHelpDrawerOpen = false;
  modificadosSinGuardar = new Set<number>(); // Guarda los IDs de las filas tocadas
  guardandoSilencioso = false;

  // ── Tour guiado ─────────────────────────────────────────────────────────────
  private readonly tourService = inject(TourService);
  private autoguardado$ = new Subject<void>();
  private autoguardadoSub?: Subscription;

  // === CANDADO 1: Bloquea si el usuario intenta cerrar la pestaña del navegador ===
  @HostListener('window:beforeunload', ['$event'])
  alIntentarCerrar($event: BeforeUnloadEvent) {
    if (this.modificadosSinGuardar.size > 0) {

      // 1. Armamos el registro de telemetría (AHORA CON FECHA)
      const payloadTelemetria = {
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: this.tipoBusquedaRealizada ?
          `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}` : 'SIN_DOCUMENTO_CARGADO',
        evento: 'INTENTO_CERRAR_PESTANA_SIN_GUARDAR',
        cantidadRegistrosPendientes: this.modificadosSinGuardar.size,
        fechaHora: new Date().toISOString() // <-- ESTA ES LA MAGIA QUE FALTABA
      };

      // 2. Disparamos la métrica silenciosamente (Fire and Forget)
      this.auditoriaService.registrarMetricaUsabilidad(payloadTelemetria).subscribe({
        error: (err) => {
          console.warn('[Telemetría] Fallo al registrar cierre de pestaña', err);

          // Si el servidor local está apagado, guardamos en la caja negra (Store and Forward)
          if (err.status === 0) {
            this.guardarMetricaEnLocal(payloadTelemetria);
          }
        }
      });

      // 3. Frenamos el cierre y mostramos el cartel nativo del navegador
      $event.preventDefault();
      $event.returnValue = 'Tenés cambios sin guardar. ¿Seguro que querés salir?';
    }
  }

  ngOnInit() {
    this.autoguardadoSub = this.autoguardado$.pipe(debounceTime(60000)).subscribe(() => {
      if (this.modificadosSinGuardar.size > 0) {
        this.guardarParcialmente(true);
      }
    });

    // --- NUEVO: STORE AND FORWARD ---
    const pendientesStr = localStorage.getItem('telemetria_pendientes');
    if (pendientesStr) {
      const pendientes = JSON.parse(pendientesStr);
      if (pendientes.length > 0) {
        this.auditoriaService.registrarMetricasLote(pendientes).subscribe({
          next: () => {
            console.log(`[Telemetría] ${pendientes.length} métricas atrasadas sincronizadas con éxito.`);
            localStorage.removeItem('telemetria_pendientes'); // Vaciamos la caja negra
          },
          error: (err) => console.warn('[Telemetría] El servidor sigue caído, las métricas se retendrán.', err)
        });
      }
    }
    this.inactividadService.iniciarSeguimiento();
  }

  /**
   * Se ejecuta UNA VEZ, después de que Angular renderizó el HTML del componente.
   * Es el momento seguro para iniciar el tour, ya que todos los selectores
   * CSS (.busqueda-section, .btn-buscar, .grilla-section) ya existen en el DOM.
   *
   * El setTimeout de 300 ms le da tiempo a AG Grid para terminar
   * su propia inicialización interna antes de que Shepherd tome el control.
   */
  ngAfterViewInit(): void {
    setTimeout(() => this.tourService.startSearchTour(), 300);
  }

  /**
   * Permite al usuario volver a reproducir el tour guiado completo por toda la plataforma
   * en cualquier momento desde el botón de la cabecera.
   */
  reproducirTourCompleto(): void {
    const tieneResultados = this.prestaciones.length > 0;
    this.tourService.startFullTour(tieneResultados);
  }

  /**
   * Cierra el panel de ayuda y desencadena la reproducción del tour guiado.
   */
  reproducirTourDesdeAyuda(): void {
    this.isHelpDrawerOpen = false;
    this.reproducirTourCompleto();
  }

  ngOnDestroy() {
    if (this.autoguardadoSub) this.autoguardadoSub.unsubscribe();
    this.inactividadService.pararSeguimiento();
  }
  debitoAceptadoMasivoSeleccionado: string = '';
  listaDebitoAceptado: string[] = ['Borrar', 'SI', 'NO'];
  private excelService = inject(ExcelExportService);

  listaMotivosAgrupados = LISTA_MOTIVOS_DEBITO;
  listaMotivosRefacturaAgrupados = LISTA_MOTIVOS_REFACTURA;
  motivoMasivoSeleccionado: string = '';
  motivoRefacturaMasivoSeleccionado: string = '';

  private mathService = inject(AuditoriaMathService);
  private gridConfigService = inject(AuditoriaGridConfigService);
  private inactividadService = inject(InactividadService);

  importeDebitadoMasivo?: number;
  importeRefacturaMasivo?: number;
  comentariosMasivo: string = '';
  comentariosDebitoMasivo: string = '';

  cargando: boolean = false;
  private fb = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  prestaciones: Prestacion[] = [];
  prestacionesFiltradas: Prestacion[] = [];
  columnaOrden: string = '';
  direccionOrden: 'asc' | 'desc' = 'asc';
  private auditoriaService = inject(AuditoriaService);

  pacientesList: string[] = [];
  profesionalesList: string[] = [];
  prestacionesList: string[] = [];
  gruposList: (string | undefined)[] = [];
  fechasList: string[] = [];

  modalAlertaVisible: boolean = false;
  modalAlertaMensaje: string = '';
  modalAlertaCallback: any = null;
  modalAlertaTipo: 'exito' | 'error' | 'peligro' | 'normal' = 'normal';

  modalDocumentosAsociadosVisible: boolean = false;

  filtroPaciente: string = '';
  filtroProfesional: string = '';
  filtroPrestacion: string = '';
  filtroGrupo: string = '';
  filtroFecha: string = '';
  tipoBusquedaRealizada: string = '';
  notaDeCreditoYaCreada: boolean = false; // solo se usa para ND (relación 1:1)
  notaDeDebitoYaCreada: boolean = false;  // solo se usa para ND→NC (relación 1:1)

  // Regla 1/2: listas de documentos asociados ya creados
  documentosCreadosInfo: DocumentoAsociado[] = [];
  ndsCreadasDesdeNc: DocumentoAsociado[] = [];

  // Regla 2: indica si la NC buscada es hija de una ND (true) → bloquea nueva ND
  ncEsHijaDeND: boolean = false;

  // Mantener por compatibilidad con /tiene-nc-para-nd (relación 1:1 ND→NC)
  documentoCreadoInfo: DocumentoAsociado | null = null;

  soloSinMotivoDebito: boolean = false;
  soloSinMotivoRefactura: boolean = false;
  soloValorizadas: boolean = false;
  soloSinNC: boolean = false;

  get hayFiltrosActivos(): boolean {
    return !!(
      this.filtroPaciente ||
      this.filtroProfesional ||
      this.filtroPrestacion ||
      this.filtroGrupo ||
      this.filtroFecha ||
      this.soloValorizadas ||
      this.soloSinMotivoDebito ||
      this.soloSinMotivoRefactura ||
      this.soloSinNC
    );
  }

  // Formatea una fecha ISO 'YYYY-MM-DD' a 'DD/MM/YYYY' sin usar el constructor Date,
  // evitando el desplazamiento de un día causado por la conversión UTC → local.
  formatearFecha(fechaIso: string): string {
    if (!fechaIso) return '';
    const [anio, mes, dia] = fechaIso.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  prestacionesPaginadas: Prestacion[] = []; // Esta es la que va a leer el HTML
  paginaActual: number = 1;
  itemsPorPagina: number = 100;
  totalPaginas: number = 1;
  cantAceptados: number = 0;
  totalDebitadoAceptado: number = 0;
  totalRefacturarRechazado: number = 0;

  totalFacturado: number = 0;
  totalDebitado: number = 0;
  totalCantidad: number = 0;
  totalNetoGlobal: number = 0;
  totalCoseguroGlobal: number = 0;
  totalRefacturadoGlobal: number = 0;

  todasSeleccionadas: boolean = false;
  registrosSeleccionados: Prestacion[] = [];

  public rowSelection: 'single' | 'multiple' = 'multiple';
  public theme = themeQuartz; // <-- Inyectamos el tema moderno acá

  // Estrategia para que las columnas se adapten al contenido o al título automáticamente
  public autoSizeStrategy: any = {
    type: 'fitCellContents'
  };

  public columnDefs: ColDef[] = []; // Ahora arranca vacío

  configurarColumnas() {
    const englobante = this.debeMostrarEnglobante();
    const tieneComentariosPrevios = this.prestacionesFiltradas.some(p => p.comentarioPrevio && p.comentarioPrevio.trim() !== '');

    // Delegamos la configuración de AG-Grid al servicio
    this.columnDefs = this.gridConfigService.getConfiguracionColumnas(
      this.tipoBusquedaRealizada,
      englobante,
      tieneComentariosPrevios,
      this.listaMotivosAgrupados,
      this.listaMotivosRefacturaAgrupados,
      GroupedSelectEditor // Pasamos el componente editor para que el servicio pueda inyectarlo
    );
  }

  public overlayNoRowsTemplate: string = '<span class="ag-overlay-no-rows-center">Sin resultados</span>';
  public localeText: { [key: string]: string } = {
    noRowsToShow: 'Sin resultados'
  };

  // Configuración por defecto para no repetir código en cada columna
  public defaultColDef: ColDef = {
    sortable: true,
    filter: false,
    resizable: true,
    suppressMovable: false, // Permite al usuario mover las columnas de lugar
    wrapHeaderText: true,
    autoHeaderHeight: true
  };

  modalVisible: boolean = false;
  modalMensaje: string = '';
  modalAceptarCb: () => void = () => { };
  modalCancelarCb: () => void = () => { };

  modalNuevaNotaVisible: boolean = false;
  tipoNuevaNota: 'NC' | 'ND' = 'NC'; // Variable para saber qué estamos generando

  mostrarRadioTipoNd: boolean = false;
  deshabilitarTipoIva: boolean = false;
  deshabilitarTipoRefactura: boolean = false;
  tooltipTipoIva: string = '';
  tooltipTipoRefactura: string = '';

  busquedaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]]
  });

  montoNetoPrestacional: number = 0;
  montoIvaPrestacionalOriginal: number = 0;
  montoIvaCalculado: number = 0;
  hasPrestacionesIvaMalFacturado: boolean = false;

  ncGuardadaExitosamente: boolean = false;
  datosNcCreada: any = null;
  netoAjusteIva: number = 0;
  montoIvaNdCalculado: number = 0;
  cargandoNdIva: boolean = false;
  deshabilitarPorAjusteIva: boolean = false;
  esTablaAjusteIva: boolean = false;
  filasResumenAjusteIva: any[] = [];
  soloCrearNdAjusteIva: boolean = false;
  modalHistorialVisible: boolean = false;
  filasHistorialComprobantes: any[] = [];
  cantidadHistorial: number = 1;

  obtenerFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  nuevaNotaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required],
    tipoNc: ['Refactura'],
    subtipoIva: [''],
    netoNc: [null as number | null],
    porcIva: [null as number | null],
    ivaNc: [null as number | null],
    tipoNd: [''],
    importeNd: [null as number | null]
  });

  nuevaNotaDebitoIvaForm = this.fb.group({
    tipo: ['ND', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]],
    fecha: [this.obtenerFechaHoy(), Validators.required],
    porcIva: [null as number | null, Validators.required],
    ivaNd: [null as number | null]
  });

  calcularTotalesIvaPrestacional() {
    const prestIvaMalFacturado = this.prestaciones.filter(
      p => p.motivoDebito && p.motivoDebito.trim().toLowerCase() === 'iva mal facturado'
    );
    this.hasPrestacionesIvaMalFacturado = prestIvaMalFacturado.length > 0;
    this.montoNetoPrestacional = prestIvaMalFacturado.reduce((sum, p) => sum + (p.totalNeto || 0), 0);
    this.montoIvaPrestacionalOriginal = prestIvaMalFacturado.reduce((sum, p) => sum + this.obtenerMontoIva(p), 0);

    const porc = this.nuevaNotaForm.get('porcIva')?.value;
    if (porc !== null && porc !== undefined && String(porc) !== '') {
      this.montoIvaCalculado = Number((this.montoNetoPrestacional * (Number(porc) / 100)).toFixed(2));
    } else {
      this.montoIvaCalculado = Number(this.montoIvaPrestacionalOriginal.toFixed(2));
    }
    this.nuevaNotaForm.patchValue({ ivaNc: this.montoIvaCalculado }, { emitEvent: false });

    if (!this.hasPrestacionesIvaMalFacturado) {
      this.nuevaNotaForm.get('subtipoIva')?.setErrors({ sinIvaMalFacturado: true });
    } else {
      this.nuevaNotaForm.get('subtipoIva')?.setErrors(null);
    }
    this.netoAjusteIva = this.montoNetoPrestacional;
    this.onPorcIvaNdChange();
    this.cdr.detectChanges();
  }

  onRadioOptionClick(event: MouseEvent, opcion: string) {
    if (opcion === 'Por ajuste de IVA' && this.deshabilitarPorAjusteIva) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onTipoNcChange() {
    const tipoNc = this.nuevaNotaForm.get('tipoNc')?.value;

    if (this.deshabilitarPorAjusteIva && tipoNc === 'Por ajuste de IVA') {
      this.nuevaNotaForm.patchValue({ tipoNc: 'Refactura' });
      this.cdr.detectChanges();
      return;
    }

    if (tipoNc === 'Por ajuste de IVA') {
      this.nuevaNotaForm.get('subtipoIva')?.setValidators([Validators.required]);
      this.nuevaNotaForm.patchValue({ subtipoIva: '', netoNc: null, porcIva: null, ivaNc: null });
      this.nuevaNotaForm.get('subtipoIva')?.updateValueAndValidity();
      this.onSubtipoIvaChange();
    } else {
      // Refactura
      this.nuevaNotaForm.get('subtipoIva')?.clearValidators();
      this.nuevaNotaForm.get('netoNc')?.clearValidators();
      this.nuevaNotaForm.get('porcIva')?.clearValidators();
      this.nuevaNotaForm.patchValue({ subtipoIva: '', netoNc: null, porcIva: null, ivaNc: null });
      this.nuevaNotaForm.get('subtipoIva')?.updateValueAndValidity();
      this.nuevaNotaForm.get('netoNc')?.updateValueAndValidity();
      this.nuevaNotaForm.get('porcIva')?.updateValueAndValidity();
    }
    this.cdr.detectChanges();
  }

  onSubtipoIvaChange() {
    const subtipoIva = this.nuevaNotaForm.get('subtipoIva')?.value;
    const netoCtrl = this.nuevaNotaForm.get('netoNc');
    const porcCtrl = this.nuevaNotaForm.get('porcIva');

    if (subtipoIva === 'No prestacional') {
      this.nuevaNotaForm.get('subtipoIva')?.setErrors(null);
      netoCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
      porcCtrl?.setValidators([Validators.required]);
      this.onNetoManualChange();
    } else if (subtipoIva === 'Prestacional') {
      netoCtrl?.clearValidators();
      netoCtrl?.setValue(null);
      porcCtrl?.clearValidators();
      this.calcularTotalesIvaPrestacional();
    } else {
      this.nuevaNotaForm.get('subtipoIva')?.setErrors(null);
      netoCtrl?.clearValidators();
      netoCtrl?.setValue(null);
      porcCtrl?.clearValidators();
      this.nuevaNotaForm.patchValue({ porcIva: null, ivaNc: null });
    }
    netoCtrl?.updateValueAndValidity();
    porcCtrl?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  onNetoManualChange() {
    const neto = Number(this.nuevaNotaForm.get('netoNc')?.value) || 0;
    const porcVal = this.nuevaNotaForm.get('porcIva')?.value;
    if (neto > 0 && porcVal !== null && porcVal !== undefined && String(porcVal) !== '') {
      const ivaCalc = Number((neto * (Number(porcVal) / 100)).toFixed(2));
      this.nuevaNotaForm.patchValue({ ivaNc: ivaCalc }, { emitEvent: false });
      this.montoIvaCalculado = ivaCalc;
    } else {
      this.nuevaNotaForm.patchValue({ ivaNc: null }, { emitEvent: false });
      this.montoIvaCalculado = 0;
    }
    this.netoAjusteIva = neto;
    this.onPorcIvaNdChange();
    this.cdr.detectChanges();
  }

  onPorcIvaNdChange() {
    const porcNd = this.nuevaNotaDebitoIvaForm.get('porcIva')?.value;
    if (this.netoAjusteIva > 0 && porcNd !== null && porcNd !== undefined && String(porcNd) !== '') {
      this.montoIvaNdCalculado = Number((this.netoAjusteIva * (Number(porcNd) / 100)).toFixed(2));
    } else {
      this.montoIvaNdCalculado = 0;
    }
      this.nuevaNotaDebitoIvaForm.patchValue({ ivaNd: this.montoIvaNdCalculado }, { emitEvent: false });
    this.cdr.detectChanges();
  }

  guardarNotaDebitoAjusteIva() {
    if (this.soloCrearNdAjusteIva) {
      this.guardarNdAjusteIvaSolo();
      return;
    }

    if (this.nuevaNotaDebitoIvaForm.invalid || !this.datosNcCreada) {
      this.mostrarAlerta('Por favor, complete todos los campos requeridos de la Nota de Débito.', undefined, 'error');
      return;
    }

    const payload = {
      tipoNc: this.datosNcCreada.tipo,
      letraNc: this.datosNcCreada.letra,
      ptovtaNc: this.datosNcCreada.puntoVenta,
      numeroNc: this.datosNcCreada.numero,

      tipoNd: this.nuevaNotaDebitoIvaForm.value.tipo,
      letraNd: this.nuevaNotaDebitoIvaForm.value.letra?.toUpperCase(),
      ptovtaNd: this.nuevaNotaDebitoIvaForm.value.puntoVenta,
      numeroNd: this.nuevaNotaDebitoIvaForm.value.numero,

      neto: this.netoAjusteIva,
      iva: this.montoIvaNdCalculado,
      porcIva: this.nuevaNotaDebitoIvaForm.value.porcIva,
      fecha: this.nuevaNotaDebitoIvaForm.value.fecha,
      usuario: this.authService.obtenerUsuario()
    };

    this.cargandoNdIva = true;
    this.cdr.detectChanges();

    this.auditoriaService.guardarNuevaNotaDebitoAjusteIva(payload).subscribe({
      next: () => {
        this.cargandoNdIva = false;
        this.cerrarModalNuevaNota();
        this.mostrarAlerta('¡Nota de Crédito y Nota de Débito por Ajuste de IVA generadas y guardadas con éxito!', undefined, 'exito');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.cargandoNdIva = false;
        const mensajeServer = err.error?.message || err.error?.mensaje || 'Error al procesar la Nota de Débito por Ajuste de IVA.';
        this.mostrarAlerta(mensajeServer, undefined, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  onPorcIvaChange() {
    const subtipoIva = this.nuevaNotaForm.get('subtipoIva')?.value;
    if (subtipoIva === 'No prestacional') {
      this.onNetoManualChange();
    } else {
      this.calcularTotalesIvaPrestacional();
    }
  }

  onTipoNdChange() {
    const val = this.nuevaNotaForm.get('tipoNd')?.value;
    const ctrl = this.nuevaNotaForm.get('importeNd');
    if (val === 'Por ajuste de IVA') {
      ctrl?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      ctrl?.clearValidators();
      ctrl?.setValue(null);
    }
    ctrl?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.modalVisible = false;
    this.cdr.detectChanges();
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.prestacionesFiltradas.length / this.itemsPorPagina);

    // Validamos que la página actual no quede fuera de rango tras un filtro
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = 1;
    }

    const indiceInicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const indiceFin = indiceInicio + this.itemsPorPagina;

    // Le pasamos al HTML solo la porción que debe renderizar
    this.prestacionesPaginadas = this.prestacionesFiltradas.slice(indiceInicio, indiceFin);
  }

  registrarCambio(p?: Prestacion) {
    // Le agregamos la validación p.id != null para calmar a TypeScript
    if (p && p.id != null) {
      // Evaluamos si la fila realmente tiene algo digno de ser guardado
      const tieneDebito = p.motivoDebito && p.motivoDebito.trim() !== '';
      const tieneRefactura = p.motivoRefactura && p.motivoRefactura.trim() !== '';

      if (tieneDebito || tieneRefactura) {
        this.modificadosSinGuardar.add(p.id); // Lo marcamos como pendiente
      } else {
        this.modificadosSinGuardar.delete(p.id); // Lo sacamos de la lista si quedó vacío
      }
    }

    // Le avisa a RxJS que hubo actividad, reiniciando los 10 segundos
    this.autoguardado$.next();
    this.cdr.detectChanges();
  }

  limpiarFilasSeleccionadas() {
    if (this.registrosSeleccionados.length === 0) return;

    this.modalMensaje = `¿Estás seguro de que querés borrar el contenido de las ${this.registrosSeleccionados.length} filas seleccionadas?`;

    this.modalAceptarCb = () => {
      // Métrica: El usuario borró sus propios datos conscientemente
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
        evento: 'LIMPIEZA_FILAS_CONFIRMADA',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.registrosSeleccionados.length // Cantidad de filas blanqueadas
      }).subscribe({ error: () => { } });

      this.registrosSeleccionados.forEach(p => {
        p.debitoAceptado = '';
        p.motivoDebito = '';
        p.importeDebitado = undefined;  // Queda vacío en la grilla
        p.comentariosDebito = '';
        p.motivoRefactura = '';
        p.importeRefactura = undefined;
        p.comentarios = '';
        this.registrarCambio(p); // <-- CAMBIAR ACÁ
      });
      this.calcularTotales();
      this.cerrarModal();
      this.gridApi?.refreshCells();
    };

    this.modalCancelarCb = () => this.cerrarModal();
    this.modalVisible = true;
  }

  aplicarMotivoRefacturaMasivo() {
    if (this.registrosSeleccionados.length === 0 || !this.motivoRefacturaMasivoSeleccionado) return;

    const motivo = this.motivoRefacturaMasivoSeleccionado;
    const registrosConPrevio = this.registrosSeleccionados.filter(p => p.motivoRefactura && p.motivoRefactura !== '');

    if (registrosConPrevio.length > 0) {
      this.modalMensaje = `Hay ${registrosConPrevio.length} registro(s) seleccionado(s) que ya tienen un motivo de refactura.\n\n¿Desea REEMPLAZAR los motivos existentes?\n\n(Si selecciona Cancelar, se aplicará el nuevo motivo únicamente a las filas que estén vacías)`;

      this.modalAceptarCb = () => {
        // Disparamos métrica: Sobreescritura masiva confirmada (Refactura)
        this.auditoriaService.registrarMetricaUsabilidad({
          usuario: this.authService.obtenerUsuario(),
          documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
          evento: 'SOBREESCRIBIR_MASIVO_CONFIRMADO_REFACTURA',
          fechaHora: new Date().toISOString(),
          cantidadRegistrosPendientes: registrosConPrevio.length
        }).subscribe({ error: () => { } });

        this.ejecutarMasivoRefactura(motivo, true);
        this.cerrarModal();
      };

      this.modalCancelarCb = () => {
        this.ejecutarMasivoRefactura(motivo, false);
        this.cerrarModal();
      };

      this.modalVisible = true;
    } else {
      this.ejecutarMasivoRefactura(motivo, true);
    }
  }

  ejecutarMasivoRefactura(motivo: string, sobreescribirTodos: boolean) {
    this.registrosSeleccionados.forEach(p => {
      if (!sobreescribirTodos && p.motivoRefactura && p.motivoRefactura !== '') return;
      p.motivoRefactura = motivo === 'Borrar' ? '' : motivo;
      this.registrarCambio(p);
    });

    this.motivoRefacturaMasivoSeleccionado = '';
    this.calcularTotales();
    this.gridApi?.refreshCells();
    this.cdr.detectChanges();
  }

  aplicarDebitoAceptadoMasivo() {
    if (this.registrosSeleccionados.length === 0 || !this.debitoAceptadoMasivoSeleccionado) return;

    const valor = this.debitoAceptadoMasivoSeleccionado === 'Borrar' ? '' : this.debitoAceptadoMasivoSeleccionado;

    this.registrosSeleccionados.forEach(p => {
      p.debitoAceptado = valor;
      this.registrarCambio(p);
    });

    this.debitoAceptadoMasivoSeleccionado = '';
    this.calcularTotales();
    this.gridApi?.refreshCells();
    this.cdr.detectChanges(); // Vital para que la pantalla se actualice
  }

  aplicarImporteDebitadoMasivo() {
    if (this.registrosSeleccionados.length === 0 || this.importeDebitadoMasivo == null) return;

    this.registrosSeleccionados.forEach(p => {
      p.importeDebitado = this.importeDebitadoMasivo;
    });

    this.importeDebitadoMasivo = undefined; // Limpiamos el input
    this.calcularTotales();
    this.gridApi?.refreshCells();
    this.cdr.detectChanges();
  }

  aplicarImporteRefacturaMasivo() {
    if (this.registrosSeleccionados.length === 0 || this.importeRefacturaMasivo == null) return;

    this.registrosSeleccionados.forEach(p => {
      p.importeRefactura = this.importeRefacturaMasivo;
    });

    this.importeRefacturaMasivo = undefined; // Limpiamos el input
    this.calcularTotales();
    this.gridApi?.refreshCells();
    this.cdr.detectChanges();
  }

  aplicarComentariosMasivo() {
    if (this.registrosSeleccionados.length === 0 || !this.comentariosMasivo) return;

    let aplicados = 0;
    this.registrosSeleccionados.forEach(p => {
      // REGLA DE ORO: Solo inyectamos el comentario si el débito NO fue aceptado
      if (p.debitoAceptado === 'NO') {
        p.comentarios = this.comentariosMasivo;
        aplicados++;
      }
      this.registrarCambio(p);
    });

    if (aplicados === 0) {
      // Disparar métrica
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}...`,
        evento: 'ACCION_MASIVA_FALLIDA_COMENTARIOS',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.registrosSeleccionados.length // Guardamos cuántas filas seleccionó mal
      }).subscribe({ error: () => { } });

      this.mostrarAlerta("No se aplicó el comentario porque ninguna de las filas seleccionadas tiene el Débito Aceptado marcado como 'NO'.", undefined, 'error');
    } else if (aplicados < this.registrosSeleccionados.length) {
      this.mostrarAlerta(`El comentario se aplicó solo a ${aplicados} fila(s) que tenían el Débito Aceptado en 'NO'. Las demás fueron ignoradas para no generar datos inconsistentes.`);
    }

    this.comentariosMasivo = ''; // Limpiamos el input
    this.gridApi?.refreshCells();
    this.cdr.detectChanges();
  }

  aplicarComentariosDebitoMasivo() {
    if (this.registrosSeleccionados.length === 0 || !this.comentariosDebitoMasivo) return;

    let aplicados = 0;
    this.registrosSeleccionados.forEach(p => {
      // NUEVA REGLA: Solo inyectamos si hay un motivo de débito cargado
      if (p.motivoDebito && p.motivoDebito !== '') {
        p.comentariosDebito = this.comentariosDebitoMasivo;
        aplicados++;
      }
    });

    if (aplicados === 0) {
      // Disparar métrica
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}...`,
        evento: 'ACCION_MASIVA_FALLIDA_COMENTARIOS',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.registrosSeleccionados.length // Guardamos cuántas filas seleccionó mal
      }).subscribe({ error: () => { } });

      this.mostrarAlerta("No se aplicó el comentario porque ninguna fila seleccionada tiene un Motivo de Débito cargado.", undefined, 'error');
    } else if (aplicados < this.registrosSeleccionados.length) {
      this.mostrarAlerta(`El comentario se aplicó solo a ${aplicados} fila(s). Las demás fueron ignoradas por no tener Motivo de Débito.`);
    }

    this.comentariosDebitoMasivo = ''; // Limpiamos el input
    this.gridApi?.refreshCells();
    this.cdr.detectChanges();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarPaginacion();
      this.cdr.detectChanges(); // Forzamos el renderizado de la nueva página
    }
  }

  onBuscar() {
    // 1. PRIMER CANDADO: Verificar si hay cambios sin guardar
    if (this.modificadosSinGuardar.size > 0) {

      const payloadTelemetria = {
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: this.tipoBusquedaRealizada ?
          `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}` : 'SIN_DOCUMENTO_CARGADO',
        evento: 'INTENTO_BUSCAR_SIN_GUARDAR',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.modificadosSinGuardar.size
      };

      this.auditoriaService.registrarMetricaUsabilidad(payloadTelemetria).subscribe({
        error: (e) => console.warn('Fallo silencioso al registrar métrica', e)
      });

      this.mostrarAlerta("Tenés registros sin guardar del documento actual. Por favor, guardá los cambios antes de buscar uno nuevo.", undefined, 'peligro');
      return; // Cortamos la ejecución
    }

    // 2. SEGUNDO CANDADO: Verificar si el formulario de búsqueda es inválido
    if (this.busquedaForm.invalid) {
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: 'FORMULARIO_BUSQUEDA',
        evento: 'INTENTO_BUSQUEDA_FORMULARIO_INVALIDO',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: 0
      }).subscribe({ error: () => { } });

      this.mostrarAlerta('Revise los datos de búsqueda, faltan campos obligatorios.', undefined, 'error');
      return; // Cortamos la ejecución
    }

    // 3. SI PASÓ LOS DOS CANDADOS, SE EJECUTA LA BÚSQUEDA
    this.cargando = true; // Bloqueamos la UI

    const filtros = { ...this.busquedaForm.value };
    filtros.letra = filtros.letra ? filtros.letra.toUpperCase() : '';

    this.auditoriaService.buscarPrestaciones(filtros).subscribe({
      next: (res: any) => {
        this.tipoBusquedaRealizada = this.busquedaForm.value.tipo || '';

        // Asignación directa de datos consolidados recibidos en la respuesta única de /buscar
        this.documentosCreadosInfo = (res && res.documentosCreadosInfo) ? res.documentosCreadosInfo : [];
        this.documentoCreadoInfo = (res && res.documentoCreadoInfo) ? res.documentoCreadoInfo : null;
        this.notaDeCreditoYaCreada = !!this.documentoCreadoInfo;

        this.filasHistorialComprobantes = (res && res.historialComprobantes) ? res.historialComprobantes : [];
        this.cantidadHistorial = this.filasHistorialComprobantes.length > 0 ? this.filasHistorialComprobantes.length : 1;

        if (res && res.tipoVista === 'TABLA_AJUSTE_IVA') {
          this.esTablaAjusteIva = true;
          this.filasResumenAjusteIva = res.resumenAjusteIva || [];
          this.prestaciones = [];
          this.prestacionesFiltradas = [];
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }

        this.esTablaAjusteIva = false;
        this.filasResumenAjusteIva = [];
        const data = (res && res.prestaciones) ? res.prestaciones : (Array.isArray(res) ? res : []);

        this.prestaciones = data.map((p: any) => {
          p.debitoAceptado = p.debitoAceptado || '';
          return p as Prestacion;
        });

        this.prestacionesFiltradas = [...this.prestaciones];

        this.prepararFiltros(this.prestaciones);
        this.aplicarFiltros();
        this.configurarColumnas();

        this.cargando = false;
        this.cdr.detectChanges();

        // Disparar la Fase 2 del tour guiado cuando los datos están renderizados
        if (this.prestaciones.length > 0) {
          setTimeout(() => this.tourService.startResultsTour(), 400);
        }
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;

        if (err.status === 0) {
          this.guardarMetricaEnLocal({
            usuario: this.authService.obtenerUsuario(),
            documentoReferencia: `${this.busquedaForm.value.tipo}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
            evento: 'ERROR_CONEXION_0_AL_BUSCAR',
            cantidadRegistrosPendientes: this.modificadosSinGuardar.size
          });

          this.mostrarAlerta('No hay conexión con el servidor. Verifique que la computadora central esté encendida y conectada a la red.', undefined, 'error');
          this.cdr.detectChanges();
          return;
        }

        this.auditoriaService.registrarMetricaUsabilidad({
          usuario: this.authService.obtenerUsuario(),
          documentoReferencia: `${this.busquedaForm.value.tipo}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
          evento: `ERROR_HTTP_${err.status}_AL_BUSCAR`,
          cantidadRegistrosPendientes: this.modificadosSinGuardar.size
        }).subscribe({ error: () => { } });

        if (err.status === 404) {
          this.mostrarAlerta('Documento no encontrado. Verifique los datos ingresados.', undefined, 'error');
        } else {
          this.mostrarAlerta(`Ocurrió un error (Código ${err.status}) al intentar comunicarse con el servidor.`, undefined, 'error');
        }
        this.cdr.detectChanges();
      }
    });
  }

  ejecutarIndividualRefactura(p: Prestacion, nuevoMotivo: string) {
    p.motivoRefactura = nuevoMotivo;
    if (nuevoMotivo === 'Borrar') p.motivoRefactura = '';
    (p as any)._motivoRefacturaPrevio = p.motivoRefactura;
    this.calcularTotales();
  }

  alCambiarMotivoRefactura(p: Prestacion) {
    const previo = (p as any)._motivoRefacturaPrevio;
    const nuevo = p.motivoRefactura || '';

    if (previo && previo !== '' && previo !== nuevo) {
      this.modalMensaje = `Este registro ya tenía un motivo de refactura ("${previo}").\n¿Desea reemplazarlo?`;

      this.modalAceptarCb = () => {
        this.ejecutarIndividualRefactura(p, nuevo);
        this.cerrarModal();
      };

      this.modalCancelarCb = () => {
        p.motivoRefactura = previo; // Revertimos
        this.cerrarModal();
      };

      this.modalVisible = true;
    } else {
      this.ejecutarIndividualRefactura(p, nuevo);
    }
  }

  aplicarMotivoMasivo() {
    // 1. Validación: Intento de aplicar sin seleccionar filas
    if (this.registrosSeleccionados.length === 0) {
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: this.tipoBusquedaRealizada ?
          `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}` : 'SIN_DOCUMENTO_CARGADO',
        evento: 'INTENTO_ACCION_MASIVA_SIN_FILAS',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: 0
      }).subscribe({ error: () => { } });

      this.mostrarAlerta('Primero tenés que seleccionar al menos una fila en la grilla usando las casillas de verificación.', undefined, 'error');
      return;
    }

    // 2. Validación: Intento de aplicar sin elegir un motivo del combo
    if (!this.motivoMasivoSeleccionado) {
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
        evento: 'INTENTO_ACCION_MASIVA_SIN_MOTIVO',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.registrosSeleccionados.length
      }).subscribe({ error: () => { } });

      this.mostrarAlerta('Seleccioná un motivo de débito del menú desplegable antes de aplicar.', undefined, 'error');
      return;
    }

    // 3. Ejecución normal si pasa las validaciones
    const motivo = this.motivoMasivoSeleccionado;
    const registrosConPrevio = this.registrosSeleccionados.filter(p => p.motivoDebito && p.motivoDebito !== '');

    if (registrosConPrevio.length > 0) {
      this.modalMensaje = `Hay ${registrosConPrevio.length} registro(s) seleccionado(s) que ya tienen un motivo de débito.\n\n¿Desea REEMPLAZAR los motivos existentes?\n\n(Si selecciona Cancelar, se aplicará el nuevo motivo únicamente a las filas que estén vacías)`;

      this.modalAceptarCb = () => {
        // Disparamos métrica: Sobreescritura masiva confirmada (Débito)
        this.auditoriaService.registrarMetricaUsabilidad({
          usuario: this.authService.obtenerUsuario(),
          documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
          evento: 'SOBREESCRIBIR_MASIVO_CONFIRMADO_DEBITO',
          fechaHora: new Date().toISOString(),
          cantidadRegistrosPendientes: registrosConPrevio.length // Cantidad de celdas pisadas
        }).subscribe({ error: () => { } });

        this.ejecutarMasivoDebito(motivo, true);
        this.cerrarModal();
      };

      this.modalCancelarCb = () => {
        this.ejecutarMasivoDebito(motivo, false);
        this.cerrarModal();
      };

      this.modalVisible = true;
    } else {
      this.ejecutarMasivoDebito(motivo, true);
    }
  }

  private obtenerMontoIva(p: Prestacion): number {
    if ((p as any).iva != null && !isNaN(Number((p as any).iva))) {
      return Number((p as any).iva);
    }
    const total = p.total || 0;
    const totalNeto = p.totalNeto || 0;
    const diferencia = total - totalNeto;
    return diferencia > 0 ? Number(diferencia.toFixed(2)) : 0;
  }

  ejecutarMasivoDebito(motivo: string, sobreescribirTodos: boolean) {
    this.registrosSeleccionados.forEach(p => {
      if (!sobreescribirTodos && p.motivoDebito && p.motivoDebito !== '') return;

      if (motivo === 'Borrar') {
        p.motivoDebito = '';
        p.importeDebitado = undefined;
        p.comentariosDebito = ''; // <--- Agregamos la limpieza acá también
      } else {
        p.motivoDebito = motivo;
        if (motivo !== 'No aplica') {
          if (motivo.trim().toLowerCase() === 'iva mal facturado') {
            p.importeDebitado = this.obtenerMontoIva(p);
          } else {
            p.importeDebitado = p.total;
          }
        }
      }
      this.registrarCambio(p);
    });

    this.motivoMasivoSeleccionado = '';
    this.calcularTotales();
    this.gridApi?.refreshCells();
    this.cdr.detectChanges();
  }

  guardarMotivoPrevio(p: Prestacion, tipo: 'debito' | 'refactura') {
    if (tipo === 'debito') {
      (p as any)._motivoDebitoPrevio = p.motivoDebito;
    } else {
      (p as any)._motivoRefacturaPrevio = p.motivoRefactura;
    }
  }

  alCambiarMotivoDebito(p: Prestacion) {
    const previo = (p as any)._motivoDebitoPrevio;
    const nuevo = p.motivoDebito || '';

    if (previo && previo !== '' && previo !== nuevo) {
      this.modalMensaje = `Este registro ya tenía un motivo de débito ("${previo}").\n¿Desea reemplazarlo?`;

      this.modalAceptarCb = () => {
        this.ejecutarIndividualDebito(p, nuevo);
        this.cerrarModal();
      };

      this.modalCancelarCb = () => {
        p.motivoDebito = previo; // Revertimos el combo al valor anterior
        this.cerrarModal();
      };

      this.modalVisible = true;
    } else {
      this.ejecutarIndividualDebito(p, nuevo);
    }
  }

  ejecutarIndividualDebito(p: Prestacion, nuevoMotivo: string) {
    p.motivoDebito = nuevoMotivo;
    if (nuevoMotivo === 'Borrar') {
      p.motivoDebito = '';
      p.importeDebitado = undefined;
      p.comentariosDebito = ''; // <--- Agregamos la limpieza acá
    } else if (nuevoMotivo && nuevoMotivo !== 'No aplica') {
      if (nuevoMotivo.trim().toLowerCase() === 'iva mal facturado') {
        p.importeDebitado = this.obtenerMontoIva(p);
      } else {
        p.importeDebitado = p.total;
      }
    }
    (p as any)._motivoDebitoPrevio = p.motivoDebito;
    this.calcularTotales();
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
    this.prestacionesList = [...new Set(datos.map(p => p.codigo))].sort();
    this.gruposList = [...new Set(datos.map(p => p.grupomodulo))].sort();
    this.fechasList = [...new Set(datos.map(p => p.fecha))].sort();
  }

  aplicarFiltros() {
    this.prestacionesFiltradas = this.prestaciones.filter(p => {
      const cumpleCombos =
        (this.filtroPaciente === '' || p.paciente === this.filtroPaciente) &&
        (this.filtroProfesional === '' || p.medico === this.filtroProfesional) &&
        (this.filtroPrestacion === '' || p.codigo === this.filtroPrestacion) &&
        (this.filtroGrupo === '' || p.grupomodulo === this.filtroGrupo) &&
        (this.filtroFecha === '' || p.fecha === this.filtroFecha);

      const cumpleSinDebito = !this.soloSinMotivoDebito || (!p.motivoDebito || p.motivoDebito.trim() === '');
      const cumpleSinRefactura = !this.soloSinMotivoRefactura || (!p.motivoRefactura || p.motivoRefactura.trim() === '');
      const cumpleValorizadas = !this.soloValorizadas || (p.total > 0);
      const cumpleSinNC = !this.soloSinNC || !p.ncNumero;

      return cumpleCombos && cumpleSinDebito && cumpleSinRefactura && cumpleValorizadas && cumpleSinNC;
    });

    this.prepararFiltros(this.prestacionesFiltradas);

    // ¡CLAVE! Calculamos totales solo una vez después de filtrar
    // Al final del método aplicarFiltros()
    this.calcularTotales();
    this.actualizarEstadoSeleccion();
    this.actualizarPaginacion();

    // Métrica: Los filtros ocultaron toda la información
    if (this.prestaciones.length > 0 && this.prestacionesFiltradas.length === 0) {
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
        evento: 'GRILLA_VACIA_POR_FILTROS_ACTIVOS',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: 0
      }).subscribe({ error: () => { } });
    }
  }

  actualizarEstadoSeleccion() {
    this.registrosSeleccionados = this.prestacionesFiltradas.filter(p => p.seleccionada);
    this.todasSeleccionadas = this.prestacionesFiltradas.length > 0 &&
      this.registrosSeleccionados.length === this.prestacionesFiltradas.length;
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
    this.soloSinNC = false;
    this.prepararFiltros(this.prestaciones);
    this.aplicarFiltros();
  }

  getIcono(col: string) {
    if (this.columnaOrden === col) {
      return this.direccionOrden === 'asc' ? '▲' : '▼';
    }
    return '';
  }

  onLogout() {
    if (this.modificadosSinGuardar.size > 0) {

      const payloadTelemetria = {
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: this.tipoBusquedaRealizada ?
          `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}` : 'SIN_DOCUMENTO_CARGADO',
        evento: 'INTENTO_LOGOUT_SIN_GUARDAR',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.modificadosSinGuardar.size
      };

      this.auditoriaService.registrarMetricaUsabilidad(payloadTelemetria).subscribe({
        error: (e) => console.warn('Fallo silencioso al registrar métrica', e)
      });

      this.mostrarAlerta("Tenés registros sin guardar. Por favor, guardá los cambios antes de cerrar sesión.", undefined, 'peligro');
      return;
    }
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
    this.actualizarPaginacion();
    this.auditoriaService.registrarMetricaUsabilidad({
      usuario: this.authService.obtenerUsuario(),
      documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
      evento: `GRILLA_ORDENADA_POR_${String(columna).toUpperCase()}_${this.direccionOrden.toUpperCase()}`,
      fechaHora: new Date().toISOString(),
      cantidadRegistrosPendientes: 0
    }).subscribe({ error: () => { } });
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const marcado = checkbox.checked;

    this.prestacionesFiltradas.forEach(p => p.seleccionada = marcado);
    this.actualizarEstadoSeleccion();
    this.cdr.detectChanges();

  }

  trackByPrestacion(index: number, p: Prestacion): any {
    return p.id || index;
  }

  toggleRow(p: Prestacion, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    p.seleccionada = checkbox.checked;
    this.actualizarEstadoSeleccion();
    this.cdr.detectChanges();
  }

  calcularTotales() {
    // 1. Delegamos el cálculo al servicio
    const totales = this.mathService.calcularTotales(this.prestacionesFiltradas);

    // 2. Asignamos los resultados devueltos a las variables del componente
    this.totalFacturado = totales.totalFacturado;
    this.totalDebitado = totales.totalDebitado;
    this.totalCantidad = totales.totalCantidad;
    this.totalNetoGlobal = totales.totalNetoGlobal;
    this.totalCoseguroGlobal = totales.totalCoseguroGlobal;
    this.totalRefacturadoGlobal = totales.totalRefacturadoGlobal;
    this.cantAceptados = totales.cantAceptados;
    this.totalDebitadoAceptado = totales.totalDebitadoAceptado;
    this.totalRefacturarRechazado = totales.totalRefacturarRechazado;

    this.cdr.detectChanges();
  }

  exportarAExcel() {
    if (this.prestacionesFiltradas.length === 0) {
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
        evento: 'INTENTO_EXPORTAR_EXCEL_VACIO',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: 0
      }).subscribe({ error: () => { } });

      this.mostrarAlerta('No hay datos visibles en la grilla para exportar. Revisá los filtros aplicados.', undefined, 'error');
      return;
    }

    // Métrica opcional: Exportación exitosa (te sirve para saber qué tanto usan esta función)
    this.auditoriaService.registrarMetricaUsabilidad({
      usuario: this.authService.obtenerUsuario(),
      documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
      evento: 'EXPORTACION_EXCEL_EXITOSA',
      fechaHora: new Date().toISOString(),
      cantidadRegistrosPendientes: this.prestacionesFiltradas.length
    }).subscribe({ error: () => { } });

    const f = this.busquedaForm.value;
    const nombreArchivo = `${f.tipo}-${f.letra}-${f.puntoVenta}-${f.numero}.xlsx`;

    this.excelService.exportarPrestaciones(
      this.prestacionesFiltradas,
      this.tipoBusquedaRealizada,
      nombreArchivo
    );
  }

  guardarParcialmente(silencioso: boolean = false) {

    const registrosParaGuardar = this.prestaciones.filter(p => {
      if (this.tipoBusquedaRealizada === 'NC') return p.motivoRefactura && p.motivoRefactura.trim() !== '';
      return p.motivoDebito && p.motivoDebito.trim() !== '';
    });

    if (registrosParaGuardar.length === 0) {
      if (!silencioso) {
        // Disparar métrica
        this.auditoriaService.registrarMetricaUsabilidad({
          usuario: this.authService.obtenerUsuario(),
          documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
          evento: 'INTENTO_GUARDAR_VACIO',
          fechaHora: new Date().toISOString(),
          cantidadRegistrosPendientes: 0
        }).subscribe({ error: () => { } });

        this.mostrarAlerta('No hay registros con motivos asignados para guardar.', undefined, 'error');
      }
      return;
    }

    const payload = {
      documentoOrigen: this.tipoBusquedaRealizada,
      letra: this.busquedaForm.value.letra ? this.busquedaForm.value.letra.toUpperCase() : '',
      ptovta: this.busquedaForm.value.puntoVenta,
      numero: this.busquedaForm.value.numero,
      usuario: this.authService.obtenerUsuario(),
      registros: registrosParaGuardar
    };

    if (silencioso) this.guardandoSilencioso = true;
    else this.cargando = true;

    this.cdr.detectChanges();

    this.auditoriaService.guardarParcialmente(payload).subscribe({
      next: () => {
        this.modificadosSinGuardar.clear(); // <-- ÉXITO: Limpiamos el contador

        if (silencioso) {
          this.guardandoSilencioso = false;
        } else {
          this.cargando = false;
          this.mostrarAlerta('¡Los registros se guardaron parcialmente con éxito!', undefined, 'exito');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);

        if (err.status === 0) {
          // Guardamos en la caja negra
          this.guardarMetricaEnLocal({
            usuario: this.authService.obtenerUsuario(),
            documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
            evento: 'ERROR_CONEXION_0_AL_GUARDAR_PARCIAL',
            fechaHora: new Date().toISOString(),
            cantidadRegistrosPendientes: registrosParaGuardar.length
          });

          if (!silencioso) {
            this.cargando = false;
            this.mostrarAlerta('No hay conexión con el servidor. Verifique que la computadora central esté encendida y conectada a la red.', undefined, 'error');
            this.cdr.detectChanges();
          } else {
            this.guardandoSilencioso = false;
          }
          return;
        }

        // Métrica específica para fallos al guardar
        this.auditoriaService.registrarMetricaUsabilidad({
          usuario: this.authService.obtenerUsuario(),
          documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
          evento: `ERROR_HTTP_${err.status}_AL_GUARDAR`,
          fechaHora: new Date().toISOString(),
          cantidadRegistrosPendientes: registrosParaGuardar.length
        }).subscribe({ error: () => { } });

        if (silencioso) {
          this.guardandoSilencioso = false;
        } else {
          this.cargando = false;
          this.mostrarAlerta('Ocurrió un error al intentar guardar en la base de datos.', undefined, 'error');
        }
        this.cdr.detectChanges();
      }
    });
  }

  debeMostrarEnglobante(): boolean {
    return this.prestacionesFiltradas.some(p => p.motivoDebito === 'Prestacion incluida en otra');
  }

  mostrarAlerta(mensaje: string, callback?: () => void, tipo: 'exito' | 'error' | 'peligro' | 'normal' = 'normal') {
    this.modalAlertaMensaje = mensaje;
    this.modalAlertaCallback = callback || null;
    this.modalAlertaTipo = tipo;
    this.modalAlertaVisible = true;
    this.cdr.detectChanges();
  }

  cerrarModalAlerta() {
    this.modalAlertaVisible = false;

    // Si había una orden pendiente (como borrar un campo), la ejecutamos al cerrar
    if (this.modalAlertaCallback) {
      this.modalAlertaCallback();
      this.modalAlertaCallback = null; // Limpiamos
    }
    this.cdr.detectChanges();
  }

  validarLetraInput(event: Event, tipoFormulario: 'busqueda' | 'nuevaNota' | 'nuevaNotaDebitoIva') {
    const input = event.target as HTMLInputElement;
    const valor = input.value;

    // Identificamos dinámicamente cuál formulario estamos tocando
    const formActual = tipoFormulario === 'busqueda'
      ? this.busquedaForm
      : (tipoFormulario === 'nuevaNotaDebitoIva' ? this.nuevaNotaDebitoIvaForm : this.nuevaNotaForm);

    // Si el valor contiene algún dígito del 0 al 9
    if (/[0-9]/.test(valor)) {
      // Disparar métrica
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        // Usamos un ternario para saber exactamente dónde se equivocó el usuario
        documentoReferencia: tipoFormulario === 'busqueda' ? 'FORMULARIO_BUSQUEDA' : 'FORMULARIO_NUEVA_NOTA',
        evento: 'ERROR_TIPEO_LETRA_NUMERO',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.modificadosSinGuardar.size // Dato real
      }).subscribe({ error: () => { } });

      this.mostrarAlerta(
        'El campo "Letra" no puede contener números. Por favor, ingrese una letra válida.',
        () => {
          // Limpiamos el campo del formulario correspondiente
          formActual.patchValue({ letra: '' });
        },
        'error'
      );
    } else {
      // Forzamos la mayúscula en el formulario correspondiente
      formActual.patchValue({ letra: valor.toUpperCase() }, { emitEvent: false });
    }
  }

  abrirModalNuevaNota(tipo: 'NC' | 'ND') {
    this.tipoNuevaNota = tipo;

    // Validación según el tipo de nota
    if (tipo === 'NC') {
      if (this.tipoBusquedaRealizada === 'ND') {
        const motivosND = this.prestaciones.map(p => p.motivoRefactura?.trim()).filter(Boolean);
        const esAjusteIVA = motivosND.some(m => m === 'Por ajuste de IVA');
        if (esAjusteIVA) {
          this.mostrarAlerta(
            'No se puede generar una Nota de Crédito a partir de una Nota de Débito cuyo motivo sea "Por ajuste de IVA".',
            undefined,
            'error'
          );
          return;
        }
      }

      this.mostrarRadioTipoNd = false;
      this.nuevaNotaForm.get('tipoNd')?.clearValidators();
      this.nuevaNotaForm.get('tipoNd')?.updateValueAndValidity();

      this.ncGuardadaExitosamente = false;
      this.datosNcCreada = null;
      this.netoAjusteIva = 0;
      this.montoIvaNdCalculado = 0;
      this.nuevaNotaForm.enable();

      this.nuevaNotaForm.reset({
        tipo: 'NC',
        letra: '',
        puntoVenta: null,
        numero: null,
        fecha: this.obtenerFechaHoy(),
        tipoNc: 'Refactura',
        subtipoIva: '',
        netoNc: null,
        porcIva: null,
        ivaNc: null,
        tipoNd: '',
        importeNd: null
      });

      this.nuevaNotaDebitoIvaForm.reset({
        tipo: 'ND',
        letra: '',
        puntoVenta: null,
        numero: null,
        fecha: this.obtenerFechaHoy(),
        porcIva: null,
        ivaNd: null
      });

      this.deshabilitarPorAjusteIva = false;

      if (this.tipoBusquedaRealizada === 'FC') {
        const letra = this.busquedaForm.value.letra ?? '';
        const ptoVta = this.busquedaForm.value.puntoVenta ?? 0;
        const numero = this.busquedaForm.value.numero ?? 0;

        this.auditoriaService.verificarTieneNcAjusteIva('FC', letra, ptoVta, numero).subscribe({
          next: (existe) => {
            this.deshabilitarPorAjusteIva = existe;
            if (existe && this.nuevaNotaForm.get('tipoNc')?.value === 'Por ajuste de IVA') {
              this.nuevaNotaForm.patchValue({ tipoNc: 'Refactura' });
              this.onTipoNcChange();
            }
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error al verificar NC por Ajuste de IVA previa:', err)
        });
      }

      this.onTipoNcChange();
      this.calcularTotalesIvaPrestacional();
    } else {
      const prestacionesConRefactura = this.prestaciones.filter(p => p.debitoAceptado === 'NO');

      if (prestacionesConRefactura.length === 0) {
        this.mostrarAlerta('No hay registros con Débito Aceptado en "NO" para generar una ND por Refactura.', undefined, 'error');
        return;
      }

      this.mostrarRadioTipoNd = false;
      this.deshabilitarTipoIva = false;
      this.deshabilitarTipoRefactura = false;
      this.tooltipTipoIva = '';
      this.tooltipTipoRefactura = '';
      this.nuevaNotaForm.get('tipoNd')?.clearValidators();
      this.nuevaNotaForm.get('tipoNd')?.updateValueAndValidity();
      this.nuevaNotaForm.get('importeNd')?.clearValidators();
      this.nuevaNotaForm.get('importeNd')?.updateValueAndValidity();
      this.nuevaNotaForm.get('netoNc')?.clearValidators();
      this.nuevaNotaForm.get('porcIva')?.clearValidators();
      this.nuevaNotaForm.get('netoNc')?.updateValueAndValidity();
      this.nuevaNotaForm.get('porcIva')?.updateValueAndValidity();

      this.nuevaNotaForm.reset({
        tipo: 'ND',
        letra: '',
        puntoVenta: null,
        numero: null,
        fecha: this.obtenerFechaHoy(),
        tipoNd: 'Por Refactura',
        importeNd: null
      });
    }

    this.modalNuevaNotaVisible = true;
    this.cdr.detectChanges();
  }

  cerrarModalNuevaNota() {
    this.modalNuevaNotaVisible = false;
    this.soloCrearNdAjusteIva = false;
    this.nuevaNotaForm.enable();
    this.nuevaNotaDebitoIvaForm.enable();
    this.nuevaNotaForm.reset();
    this.nuevaNotaDebitoIvaForm.reset();
    this.cdr.detectChanges();
  }

  abrirModalCrearNdAjusteIvaDesdeTabla() {
    if (!this.filasResumenAjusteIva || this.filasResumenAjusteIva.length < 2) return;

    const filaNc = this.filasResumenAjusteIva[1];
    if (!filaNc) return;

    this.soloCrearNdAjusteIva = true;
    this.modalNuevaNotaVisible = true;
    this.tipoNuevaNota = 'NC';

    this.nuevaNotaForm.patchValue({
      tipo: filaNc.tipoDocumento || 'NC',
      letra: filaNc.letra || '',
      puntoVenta: filaNc.puntoVenta || '',
      numero: filaNc.numero || '',
      fecha: filaNc.fechaDocumento || this.obtenerFechaHoy(),
      tipoNc: 'Por ajuste de IVA',
      subtipoIva: 'No prestacional',
      netoNc: filaNc.montoNeto,
      porcIva: filaNc.porcentajeIva,
      ivaNc: filaNc.montoIva
    });

    this.nuevaNotaForm.disable();

    this.nuevaNotaDebitoIvaForm.enable();
    this.nuevaNotaDebitoIvaForm.patchValue({
      tipo: 'ND',
      letra: '',
      puntoVenta: '',
      numero: '',
      fecha: this.obtenerFechaHoy(),
      porcIva: filaNc.porcentajeIva
    });

    this.netoAjusteIva = filaNc.montoNeto || 0;
    this.onPorcIvaNdChange();

    this.cdr.detectChanges();
  }

  guardarNdAjusteIvaSolo() {
    if (this.nuevaNotaDebitoIvaForm.invalid) {
      this.nuevaNotaDebitoIvaForm.markAllAsTouched();
      this.mostrarAlerta('Por favor, complete todos los campos obligatorios de la Nota de Débito por Ajuste de IVA.', undefined, 'error');
      return;
    }

    const filaNc = this.filasResumenAjusteIva && this.filasResumenAjusteIva.length > 1 ? this.filasResumenAjusteIva[1] : null;
    if (!filaNc) {
      this.mostrarAlerta('No se encontraron los datos de la Nota de Crédito padre.', undefined, 'error');
      return;
    }

    const payload = {
      tipoNc: filaNc.tipoDocumento || 'NC',
      letraNc: filaNc.letra,
      ptovtaNc: filaNc.puntoVenta,
      numeroNc: filaNc.numero,

      tipoNd: this.nuevaNotaDebitoIvaForm.value.tipo,
      letraNd: this.nuevaNotaDebitoIvaForm.value.letra?.toUpperCase(),
      ptovtaNd: this.nuevaNotaDebitoIvaForm.value.puntoVenta,
      numeroNd: this.nuevaNotaDebitoIvaForm.value.numero,

      neto: this.netoAjusteIva,
      iva: this.montoIvaNdCalculado,
      porcIva: this.nuevaNotaDebitoIvaForm.value.porcIva,
      fecha: this.nuevaNotaDebitoIvaForm.value.fecha,
      usuario: this.authService.obtenerUsuario()
    };

    this.cargandoNdIva = true;
    this.cdr.detectChanges();

    this.auditoriaService.guardarNuevaNotaDebitoAjusteIva(payload).subscribe({
      next: () => {
        this.cargandoNdIva = false;
        this.cerrarModalNuevaNota();
        this.mostrarAlerta('¡Nota de Débito por Ajuste de IVA generada y guardada con éxito!', undefined, 'exito');
        this.onBuscar();
      },
      error: (err) => {
        console.error(err);
        this.cargandoNdIva = false;
        const mensajeServer = err.error?.message || err.error?.mensaje || 'Error al procesar la Nota de Débito por Ajuste de IVA.';
        this.mostrarAlerta(mensajeServer, undefined, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalDocumentosAsociados() {
    this.abrirModalHistorialComprobantes();
  }

  cerrarModalDocumentosAsociados() {
    this.cerrarModalHistorialComprobantes();
  }

  cargarHistorialComprobantes(tipo: string, letra: string, puntoVenta: string | number, numero: string | number) {
    this.auditoriaService.obtenerHistorialComprobantes(tipo, letra, puntoVenta, numero).subscribe({
      next: (res) => {
        this.filasHistorialComprobantes = res || [];
        this.cantidadHistorial = this.filasHistorialComprobantes.length;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Error al obtener historial de comprobantes', err);
      }
    });
  }

  abrirModalHistorialComprobantes() {
    if (this.filasHistorialComprobantes.length === 0 && this.busquedaForm.valid) {
      const filtros = this.busquedaForm.value;
      this.cargarHistorialComprobantes(filtros.tipo || 'FC', filtros.letra || '', filtros.puntoVenta || '', filtros.numero || '');
    }
    this.modalHistorialVisible = true;
    this.cdr.detectChanges();
  }

  cerrarModalHistorialComprobantes() {
    this.modalHistorialVisible = false;
    this.cdr.detectChanges();
  }

  obtenerTipoDisplay(tipo: string): string {
    if (!tipo) return 'FC';
    const t = tipo.trim();
    if (t === 'Internados' || t === 'Ambulatorios') return 'FC';
    return t;
  }

  esDocumentoBuscado(fila: any): boolean {
    if (!fila || !this.busquedaForm || !this.busquedaForm.value) return false;
    const tipo = (this.busquedaForm.value.tipo || '').toUpperCase();
    const letra = (this.busquedaForm.value.letra || '').toUpperCase();
    const ptovta = Number(this.busquedaForm.value.puntoVenta);
    const numero = Number(this.busquedaForm.value.numero);

    const filaTipo = this.obtenerTipoDisplay(fila.tipoDocumento).toUpperCase();
    const filaLetra = (fila.letra || '').toUpperCase();
    const filaPtovta = Number(fila.puntoVenta);
    const filaNumero = Number(fila.numero);

    if (filaLetra !== letra || filaPtovta !== ptovta || filaNumero !== numero) {
      return false;
    }

    if (tipo === 'FC' && filaTipo === 'FC') return true;
    if (tipo === 'NC' && (filaTipo === 'NC' || filaTipo === 'NCE')) return true;
    if (tipo === 'ND' && (filaTipo === 'ND' || filaTipo === 'NDE')) return true;

    return tipo === filaTipo;
  }

  cargarDocumentoDesdeHistorial(fila: any) {
    if (!fila) return;

    this.cerrarModalHistorialComprobantes();

    let tipoMapeado = 'FC';
    const tipoRaw = this.obtenerTipoDisplay(fila.tipoDocumento).toUpperCase();
    if (tipoRaw.includes('NC')) {
      tipoMapeado = 'NC';
    } else if (tipoRaw.includes('ND')) {
      tipoMapeado = 'ND';
    } else {
      tipoMapeado = 'FC';
    }

    this.busquedaForm.patchValue({
      tipo: tipoMapeado,
      letra: fila.letra || '',
      puntoVenta: fila.puntoVenta || '',
      numero: fila.numero || ''
    });

    this.onBuscar();
  }

  guardarNuevaNotaBD() {
    if (this.nuevaNotaForm.invalid) {
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: 'MODAL_NUEVA_NOTA',
        evento: `INTENTO_CREAR_NOTA_FORMULARIO_INVALIDO`,
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: 0
      }).subscribe({ error: () => { } });

      this.mostrarAlerta('Por favor, complete todos los campos correctamente.', undefined, 'error');
      return;
    }

    if (this.tipoBusquedaRealizada === 'FC' && this.tipoNuevaNota === 'NC') {
      const modificadosConNcPrevia = this.prestaciones.filter(p => p.ncNumero && this.modificadosSinGuardar.has(p.id!));
      if (modificadosConNcPrevia.length > 0) {
        this.guardarParcialmente(true);
      }
    }

    const tipoNdSeleccionado = this.nuevaNotaForm.get('tipoNd')?.value;
    let registrosParaGuardar: Prestacion[] = [];

    if (this.tipoNuevaNota === 'NC') {
      const tipoNc = this.nuevaNotaForm.get('tipoNc')?.value;
      const subtipoIva = this.nuevaNotaForm.get('subtipoIva')?.value;

      if (tipoNc === 'Por ajuste de IVA') {
        if (subtipoIva === 'No prestacional') {
          registrosParaGuardar = [];
        } else {
          // Prestacional
          registrosParaGuardar = this.prestaciones.filter(p => {
            if (this.tipoBusquedaRealizada === 'FC' && p.ncNumero) {
              return false;
            }
            return p.motivoDebito && p.motivoDebito.trim().toLowerCase() === 'iva mal facturado';
          });

          if (registrosParaGuardar.length === 0) {
            this.mostrarAlerta('No hay prestaciones con Motivo de Débito "Iva mal facturado" para generar una NC por Ajuste de IVA Prestacional.', undefined, 'error');
            return;
          }
        }
      } else {
        // Refactura
        registrosParaGuardar = this.prestaciones.filter(p => {
          if (this.tipoBusquedaRealizada === 'FC' && p.ncNumero) {
            return false;
          }
          return p.motivoDebito && p.motivoDebito.trim() !== '';
        });

        if (registrosParaGuardar.length === 0) {
          this.mostrarAlerta('No hay prestaciones pendientes (sin NC previa) con Motivo de Débito cargado para generar una nueva NC.', undefined, 'error');
          return;
        }
      }
    } else if (tipoNdSeleccionado === 'Por ajuste de IVA') {
      registrosParaGuardar = [];
    } else {
      registrosParaGuardar = this.prestaciones.filter(p => p.debitoAceptado === 'NO');

      if (registrosParaGuardar.length === 0) {
        this.mostrarAlerta('No hay prestaciones con Débito Aceptado en "NO" para generar una ND por Refactura.', undefined, 'error');
        return;
      }
    }

    const datosNotaForm: any = { ...this.nuevaNotaForm.getRawValue() };
    datosNotaForm.letra = datosNotaForm.letra ? datosNotaForm.letra.toUpperCase() : '';
    if (this.tipoNuevaNota === 'NC' && datosNotaForm.tipoNc === 'Por ajuste de IVA') {
      if (datosNotaForm.subtipoIva === 'No prestacional') {
        datosNotaForm.neto = datosNotaForm.netoNc;
        datosNotaForm.iva = datosNotaForm.ivaNc;
        datosNotaForm.porcIva = datosNotaForm.porcIva;
      } else {
        datosNotaForm.neto = this.montoNetoPrestacional;
        datosNotaForm.iva = this.montoIvaCalculado;
        datosNotaForm.porcIva = datosNotaForm.porcIva;
      }
    } else if (tipoNdSeleccionado === 'Por ajuste de IVA') {
      datosNotaForm.importeRefactura = datosNotaForm.importeNd;
    }

    // 4. Armamos el Payload "Todo en Uno"
    const payload = {
      // Datos del documento que está cargado en la grilla (Original)
      origen: this.tipoBusquedaRealizada,
      letraOriginal: this.busquedaForm.value.letra?.toUpperCase(),
      ptovtaOriginal: this.busquedaForm.value.puntoVenta,
      numeroOriginal: this.busquedaForm.value.numero,

      // Datos de la nueva nota y registros
      datosNota: datosNotaForm,
      registros: registrosParaGuardar,
      usuario: this.authService.obtenerUsuario()
    };

    this.cargando = true;
    this.cdr.detectChanges();

    const request$ = this.tipoNuevaNota === 'NC'
      ? this.auditoriaService.guardarNuevaNotaCredito(payload)
      : this.auditoriaService.guardarNuevaNotaDebito(payload);

    request$.subscribe({
      next: () => {
        this.modificadosSinGuardar.clear(); // <-- Limpiamos PRIMERO la lista de pendientes sin guardar
        this.cargando = false;

        // Construimos el objeto del documento recién creado
        const nuevaEntrada: DocumentoAsociado = {
          tipo: datosNotaForm.tipo ?? '',
          letra: datosNotaForm.letra ?? '',
          ptovta: Number(datosNotaForm.puntoVenta) || 0,
          numero: Number(datosNotaForm.numero) || 0,
          fecha: datosNotaForm.fecha ?? '',
          tipoNd: datosNotaForm.tipoNd || undefined
        };

        if (this.tipoNuevaNota === 'NC') {
          // Actualizamos en memoria local del frontend solo los registros que NO pertenecían a una NC previa
          registrosParaGuardar.forEach(p => {
            if (!p.ncNumero) {
              p.ncNumero = Number(datosNotaForm.numero) || 0;
              p.ncTipo = datosNotaForm.tipo ?? '';
              p.ncLetra = datosNotaForm.letra ?? '';
              p.ncPtoVenta = Number(datosNotaForm.puntoVenta) || 0;
              p.ncFecha = datosNotaForm.fecha ?? '';
            }
          });

          // Regla 1: agregamos al historial sin reemplazar (puede haber varias NC)
          this.documentosCreadosInfo = [...this.documentosCreadosInfo, nuevaEntrada];
          // Para FC el botón nunca se bloquea; para ND sí (relación 1:1)
          if (this.tipoBusquedaRealizada === 'ND') {
            this.notaDeCreditoYaCreada = true;
            this.documentoCreadoInfo = nuevaEntrada;
          }
        } else if (this.tipoNuevaNota === 'ND') {
          // Guardamos la ND creada en la lista interna para validar los radiobuttons
          this.ndsCreadasDesdeNc = [...this.ndsCreadasDesdeNc, nuevaEntrada];
        }

        this.aplicarFiltros();

        if (this.tipoNuevaNota === 'NC' && datosNotaForm.tipoNc === 'Por ajuste de IVA') {
          this.datosNcCreada = datosNotaForm;
          this.ncGuardadaExitosamente = true;
          this.nuevaNotaForm.disable();
          this.cdr.detectChanges();
          return;
        }

        this.cerrarModalNuevaNota();
        this.mostrarAlerta(`¡Nota de ${this.tipoNuevaNota === 'NC' ? 'Crédito' : 'Débito'} generada y guardada con éxito!`, undefined, 'exito');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;

        if (err.status === 0) {
          // Guardamos en la caja negra
          this.guardarMetricaEnLocal({
            usuario: this.authService.obtenerUsuario(),
            documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
            evento: `ERROR_CONEXION_0_AL_CREAR_NOTA_${this.tipoNuevaNota}`,
            fechaHora: new Date().toISOString(),
            cantidadRegistrosPendientes: registrosParaGuardar.length
          });

          this.mostrarAlerta('No hay conexión con el servidor. Verifique que la computadora central esté encendida y conectada a la red.', undefined, 'error');
          this.cdr.detectChanges();
          return;
        }

        // Métrica específica para fallos al generar notas
        this.auditoriaService.registrarMetricaUsabilidad({
          usuario: this.authService.obtenerUsuario(),
          documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
          evento: `ERROR_HTTP_${err.status}_AL_CREAR_NOTA_${this.tipoNuevaNota}`,
          cantidadRegistrosPendientes: registrosParaGuardar.length,
          fechaHora: new Date().toISOString(),
        }).subscribe({ error: () => { } });

        const mensajeServer = err.error?.message || err.error?.mensaje || `Error al procesar la Nota de ${this.tipoNuevaNota === 'NC' ? 'Crédito' : 'Débito'}.`;
        this.mostrarAlerta(mensajeServer, undefined, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // 1. Guardamos la API de la grilla para poder darle órdenes directas
  private gridApi!: GridApi;

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  // 2. Evento: Cuando el usuario arrastra el mouse por los checkboxes
  onSelectionChanged(event: SelectionChangedEvent) {
    this.registrosSeleccionados = event.api.getSelectedRows();
    this.cdr.detectChanges(); // Habilita los botones de acciones masivas
  }

  private guardarMetricaEnLocal(payload: any) {
    // 1. Le estampamos la fecha y hora EXACTA del momento del error (en formato ISO 8601)
    payload.fechaHora = new Date().toISOString();

    // 2. Leemos la "caja negra" del navegador
    const pendientesStr = localStorage.getItem('telemetria_pendientes');
    const pendientes: any[] = pendientesStr ? JSON.parse(pendientesStr) : [];

    // 3. Agregamos el nuevo error y volvemos a cerrar la caja
    pendientes.push(payload);
    localStorage.setItem('telemetria_pendientes', JSON.stringify(pendientes));
  }

  // 3. Evento: Cuando el usuario edita una celda (selects o inputs numéricos)
  onCellValueChanged(event: CellValueChangedEvent) {
    const p = event.data as Prestacion;
    const colId = event.colDef.field;
    const nuevo = event.newValue;
    const previo = event.oldValue;

    if (nuevo === previo) return;

    // --- NUEVA LÓGICA PARA EL "NO" ---
    // --- LÓGICA PARA EL CAMBIO DE "DÉBITO ACEPTADO" ---
    if (colId === 'debitoAceptado') {
      if (nuevo === 'NO') {
        p.importeDebitado = undefined; // Limpia el importe si NO acepta el débito
      } else {
        // Si cambió a "SI" o "Borrar", limpiamos los comentarios para no enviar basura al backend
        p.comentarios = '';
      }

      this.calcularTotales();
      this.registrarCambio(p);
      // Refrescamos la fila completa para que la celda de Comentarios se bloquee/desbloquee instantáneamente
      event.api.refreshCells({ rowNodes: [event.node], force: true });
      return;
    }

    if (colId === 'motivoDebito') {
      if (previo && previo !== '' && previo !== nuevo) {
        this.modalMensaje = `Este registro ya tenía un motivo de débito ("${previo}").\n¿Desea reemplazarlo?`;

        this.modalAceptarCb = () => {
          // Disparamos métrica: Sobreescritura individual confirmada (Débito)
          this.auditoriaService.registrarMetricaUsabilidad({
            usuario: this.authService.obtenerUsuario(),
            documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
            evento: 'SOBREESCRIBIR_CELDA_CONFIRMADO_DEBITO',
            fechaHora: new Date().toISOString(),
            cantidadRegistrosPendientes: 1
          }).subscribe({ error: () => { } });

          this.ejecutarIndividualDebito(p, nuevo);
          event.api.refreshCells({ rowNodes: [event.node] }); // Repinta la fila
          this.cerrarModal();
        };

        this.modalCancelarCb = () => {
          p.motivoDebito = previo; // Revertimos en el objeto
          event.node.setDataValue('motivoDebito', previo); // Revertimos visualmente en la grilla
          this.cerrarModal();
        };

        this.modalVisible = true;
        this.cdr.detectChanges();
      } else {
        this.ejecutarIndividualDebito(p, nuevo);
        event.api.refreshCells({ rowNodes: [event.node] });
      }
    }
    else if (colId === 'motivoRefactura') {
      if (previo && previo !== '' && previo !== nuevo) {
        this.modalMensaje = `Este registro ya tenía un motivo de refactura ("${previo}").\n¿Desea reemplazarlo?`;

        this.modalAceptarCb = () => {
          // Disparamos métrica: Sobreescritura individual confirmada (Refactura)
          this.auditoriaService.registrarMetricaUsabilidad({
            usuario: this.authService.obtenerUsuario(),
            documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
            evento: 'SOBREESCRIBIR_CELDA_CONFIRMADO_REFACTURA',
            fechaHora: new Date().toISOString(),
            cantidadRegistrosPendientes: 1
          }).subscribe({ error: () => { } });

          this.ejecutarIndividualRefactura(p, nuevo);
          event.api.refreshCells({ rowNodes: [event.node] });
          this.cerrarModal();
        };

        this.modalCancelarCb = () => {
          p.motivoRefactura = previo;
          event.node.setDataValue('motivoRefactura', previo);
          this.cerrarModal();
        };

        this.modalVisible = true;
        this.cdr.detectChanges();
      } else {
        this.ejecutarIndividualRefactura(p, nuevo);
        event.api.refreshCells({ rowNodes: [event.node] });
      }
    }
    else {
      // Si tocó importes manuales, aceptado, días facturados o englobante:
      if (colId === 'importeDebitado' || colId === 'importeRefactura') {

        let valorIngresado = nuevo;

        // Si el usuario metió una coma, la cambiamos por un punto silenciosamente
        if (typeof valorIngresado === 'string') {
          valorIngresado = valorIngresado.replace(',', '.');
        }

        // Convertimos el texto ya limpio a número decimal
        const numeroParseado = parseFloat(valorIngresado);

        // Si es un número válido lo guardamos, si lo dejó en blanco o escribió letras lo dejamos vacío
        p[colId] = isNaN(numeroParseado) ? undefined : numeroParseado;
      }
      this.calcularTotales();
    }
    this.registrarCambio(p);
  }

}
