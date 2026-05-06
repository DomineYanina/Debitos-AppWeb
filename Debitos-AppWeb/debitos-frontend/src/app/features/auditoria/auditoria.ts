import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria';
import {ExcelExportService} from '../../core/services/excel-export';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule, themeQuartz, GridApi, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { GroupedSelectEditor } from '../../core/components/grouped-select-editor/grouped-select-editor';
import { LISTA_MOTIVOS_DEBITO, LISTA_MOTIVOS_REFACTURA} from '../../core/constants/motivos';

ModuleRegistry.registerModules([AllCommunityModule]);

import {AuditoriaMathService} from '../../core/services/auditoria-math';
import {AuditoriaGridConfigService} from '../../core/services/auditoria-grid-config';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, AgGridModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AuditoriaComponent implements OnInit, OnDestroy {
  modificadosSinGuardar = new Set<number>(); // Guarda los IDs de las filas tocadas
  guardandoSilencioso = false;
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
    this.autoguardadoSub = this.autoguardado$.pipe(debounceTime(10000)).subscribe(() => {
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
  }

  ngOnDestroy() {
    if (this.autoguardadoSub) this.autoguardadoSub.unsubscribe();
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

  importeDebitadoMasivo?: number;
  importeRefacturaMasivo?: number;
  comentariosMasivo: string = '';
  comentariosDebitoMasivo: string = '';

  cargando : boolean = false;
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

  filtroPaciente: string = '';
  filtroProfesional: string = '';
  filtroPrestacion: string = '';
  filtroGrupo: string = '';
  filtroFecha: string = '';
  tipoBusquedaRealizada: string = '';

  soloSinMotivoDebito: boolean = false;
  soloSinMotivoRefactura: boolean = false;
  soloValorizadas: boolean = false;

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
  modalAceptarCb: () => void = () => {};
  modalCancelarCb: () => void = () => {};

  modalNuevaNotaVisible: boolean = false;
  tipoNuevaNota: 'NC' | 'ND' = 'NC'; // Variable para saber qué estamos generando

  busquedaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]]
  });

  nuevaNotaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required]
  });

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

  registrarCambio(idPrestacion?: number) {
    if (idPrestacion) {
      this.modificadosSinGuardar.add(idPrestacion);
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
      }).subscribe({ error: () => {} });

      this.registrosSeleccionados.forEach(p => {
        p.debitoAceptado = '';
        p.motivoDebito = '';
        p.importeDebitado = undefined;  // Queda vacío en la grilla
        p.comentariosDebito = '';
        p.motivoRefactura = '';
        p.importeRefactura = undefined; // Queda vacío en la grilla
        p.comentarios = '';
        this.registrarCambio(p.id);
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
        }).subscribe({ error: () => {} });

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
      this.registrarCambio(p.id);
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
      this.registrarCambio(p.id);
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
      this.registrarCambio(p.id);
    });

    if (aplicados === 0) {
      // Disparar métrica
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}...`,
        evento: 'ACCION_MASIVA_FALLIDA_COMENTARIOS',
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: this.registrosSeleccionados.length // Guardamos cuántas filas seleccionó mal
      }).subscribe({ error: () => {} });

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
      }).subscribe({ error: () => {} });

      this.mostrarAlerta("No se aplicó el comentario porque ninguna fila seleccionada tiene un Motivo de Débito cargado.", undefined, 'error');
    }else if (aplicados < this.registrosSeleccionados.length) {
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
      }).subscribe({ error: () => {} });

      this.mostrarAlerta('Revise los datos de búsqueda, faltan campos obligatorios.', undefined, 'error');
      return; // Cortamos la ejecución
    }

    // 3. SI PASÓ LOS DOS CANDADOS, SE EJECUTA LA BÚSQUEDA
    this.cargando = true; // Bloqueamos la UI

    const filtros = { ...this.busquedaForm.value };
    filtros.letra = filtros.letra ? filtros.letra.toUpperCase() : '';

    this.auditoriaService.buscarPrestaciones(filtros).subscribe({
      next: (data) => {
        this.tipoBusquedaRealizada = this.busquedaForm.value.tipo || '';

        this.prestaciones = data.map((p: any) => {
          p.debitoAceptado = p.debitoAceptado || '';
          return p as Prestacion;
        });

        this.prestacionesFiltradas = [...this.prestaciones];

        this.prepararFiltros(this.prestaciones);
        this.aplicarFiltros();
        this.configurarColumnas();
        this.cdr.detectChanges();

        this.cargando = false;
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
        }).subscribe({ error: () => {} });

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
      }).subscribe({ error: () => {} });

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
      }).subscribe({ error: () => {} });

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
        }).subscribe({ error: () => {} });

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

  ejecutarMasivoDebito(motivo: string, sobreescribirTodos: boolean) {
    this.registrosSeleccionados.forEach(p => {
      if (!sobreescribirTodos && p.motivoDebito && p.motivoDebito !== '') return;

      if (motivo === 'Borrar') {
        p.motivoDebito = '';
        p.importeDebitado = undefined;
        p.comentariosDebito = ''; // <--- Agregamos la limpieza acá también
      } else {
        p.motivoDebito = motivo;
        if (motivo !== 'No aplica') p.importeDebitado = p.total;
      }
      this.registrarCambio(p.id);
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
      p.importeDebitado = p.total;
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

      return cumpleCombos && cumpleSinDebito && cumpleSinRefactura && cumpleValorizadas;
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
      }).subscribe({ error: () => {} });
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
    }).subscribe({ error: () => {} });
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
      }).subscribe({ error: () => {} });

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
    }).subscribe({ error: () => {} });

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
        }).subscribe({ error: () => {} });

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
        }).subscribe({ error: () => {} });

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

  validarLetraInput(event: Event, tipoFormulario: 'busqueda' | 'nuevaNota') {
    const input = event.target as HTMLInputElement;
    const valor = input.value;

    // Identificamos dinámicamente cuál formulario estamos tocando
    const formActual = tipoFormulario === 'busqueda' ? this.busquedaForm : this.nuevaNotaForm;

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
      }).subscribe({ error: () => {} });

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
      const prestacionesConDebito = this.prestaciones.filter(p => p.motivoDebito && p.motivoDebito.trim() !== '');
      if (prestacionesConDebito.length === 0) {
        this.mostrarAlerta('No hay registros con Motivo de Débito cargado para generar una NC. Recuerde Guardar Parcialmente primero.', undefined, 'error');
        return;
      }
      this.nuevaNotaForm.reset({ tipo: 'NC' });
    } else {
      // Candado 1: Verificamos que haya registros con Débito Aceptado en "NO"
      const prestacionesConRefactura = this.prestaciones.filter(p => p.debitoAceptado === 'NO');

      if (prestacionesConRefactura.length === 0) {
        // Disparar métrica
        this.auditoriaService.registrarMetricaUsabilidad({
          usuario: this.authService.obtenerUsuario(),
          documentoReferencia: `${this.tipoBusquedaRealizada}-${this.busquedaForm.value.letra}-${this.busquedaForm.value.puntoVenta}-${this.busquedaForm.value.numero}`,
          evento: 'INTENTO_CREAR_ND_SIN_RECHAZOS',
          fechaHora: new Date().toISOString(),
          cantidadRegistrosPendientes: 0
        }).subscribe({ error: () => {} });

        this.mostrarAlerta('No hay registros con Débito Aceptado en "NO" para generar una ND', undefined, 'error');
        return;
      }
      this.nuevaNotaForm.reset({ tipo: 'ND' });
    }

    this.modalNuevaNotaVisible = true;
    this.cdr.detectChanges();
  }

  cerrarModalNuevaNota() {
    this.modalNuevaNotaVisible = false;
    this.cdr.detectChanges();
  }

  guardarNuevaNotaBD() {
    if (this.nuevaNotaForm.invalid) {
      // Métrica: Se trabó porque no llenó bien los campos
      this.auditoriaService.registrarMetricaUsabilidad({
        usuario: this.authService.obtenerUsuario(),
        documentoReferencia: 'MODAL_NUEVA_NOTA',
        evento: `INTENTO_CREAR_NOTA_FORMULARIO_INVALIDO`,
        fechaHora: new Date().toISOString(),
        cantidadRegistrosPendientes: 0
      }).subscribe({ error: () => {} });

      this.mostrarAlerta('Por favor, complete todos los campos correctamente.', undefined, 'error');
      return;
    }

    const registrosParaGuardar = this.prestaciones.filter(p => {
      if (this.tipoNuevaNota === 'NC') {
        return p.motivoDebito && p.motivoDebito.trim() !== '';
      } else {
        // Candado 2: Solo enviamos al backend los que dicen estrictamente "NO"
        return p.debitoAceptado === 'NO';
      }
    });

    // 2. Preparamos los datos del formulario (Letra en Mayúscula)
    const datosNotaForm = { ...this.nuevaNotaForm.value };
    datosNotaForm.letra = datosNotaForm.letra ? datosNotaForm.letra.toUpperCase() : '';

    // 3. Armamos el Payload "Todo en Uno"
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
        this.cerrarModalNuevaNota();
        this.mostrarAlerta(`¡Nota de ${this.tipoNuevaNota === 'NC' ? 'Crédito' : 'Débito'} generada y guardada con éxito!`, undefined, 'exito');
        this.cargando = false;
        this.cdr.detectChanges();
        this.modificadosSinGuardar.clear();
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
        }).subscribe({ error: () => {} });

        this.mostrarAlerta(`Error al procesar la Nota de ${this.tipoNuevaNota === 'NC' ? 'Crédito' : 'Débito'}.`, undefined, 'error');
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
      this.registrarCambio(p.id);
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
          }).subscribe({ error: () => {} });

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
          }).subscribe({ error: () => {} });

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
    this.registrarCambio(p.id);
  }

}
