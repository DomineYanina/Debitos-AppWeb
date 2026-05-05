import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria';
import { LISTA_MOTIVOS_DEBITO, LISTA_MOTIVOS_REFACTURA } from '../../core/constants/motivos';
import {ExcelExportService} from '../../core/services/excel-export';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule, themeQuartz, GridApi, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { ICellEditorAngularComp } from 'ag-grid-angular';

// 1. La nueva estructura de datos agrupada
export const MOTIVOS_DEBITO_AGRUPADOS = [
  {
    categoria: '1. ADMINISTRATIVOS',
    motivos: [
      'Afiliado dado de baja', 'Afiliado capitado', 'Coseguro no cobrado', 'Diferencia de coseguro',
      'Error de carga (códigos-inclusiones)', 'Error en el cálculo de porcentaje de códigos múltiples',
      'Facturación duplicada', 'Facturado a financiador incorrecto', 'Falta de autorización',
      'Honorarios profesionales pagados en forma directa', 'Iva mal facturado', 'Prestación fuera de término',
      'Prestación incluida en otra liquidación', 'Supera tope'
    ]
  },
  {
    categoria: '2. MÉDICOS / AUDITORÍA',
    motivos: [
      'Alta demorada', 'Demora en Inter Consulta', 'Demora en resolución quirúrgica', 'Diagnóstico ilegible',
      'Diagnóstico no reconocido', 'Diferencia de criterio médico', 'Prestación no prescrita',
      'Prestación no reconocida', 'Prestación no justificada', 'Refactura con HC firmada',
      'Tratamiento Medico justificado en Auditoria'
    ]
  },
  {
    categoria: '3. CONTRACTUALES / NOMENCLADOR',
    motivos: [
      'Débito por normas operativas', 'Débito 20% urgencia módulos', 'Débito 20% urgencia prestaciones',
      'Débito por diferencia en la inclusiones modulares', 'Débito por normas contractuales (ejemplo veda+vcc)',
      'Débito según normas del nomenclador', 'Diferencia de aranceles', 'Prestaciones incluidas en otra',
      'Incluido en APB', 'Diferencia de valor en medicamentos/descartables', 'Prestación no homologada',
      'Prestación sin convenio', 'Prestación brindada previa a la Internación',
      'Prestación facturada según módulos vigentes', 'Prestación facturada según presupuesto acordado',
      'Prestación homologada', 'Prestación no incluida según norma del Nomenclador Nacional',
      'Recargo por urgencia según norma del Nomenclador Nacional', 'Se adjunta norma del Nomenclador Nacional'
    ]
  },
  {
    categoria: '4. OPERATIVOS Y DOCUMENTALES (administrativo)',
    motivos: [
      'Conteo de medicación erróneo hojas de enfermería no identificadas con fecha', 'Débito por falta de historia clínica',
      'Débito por historias clínicas de distintos pacientes en la misma internación', 'Documentación adulterada',
      'Exceso de facturación en medicamentos y descartables', 'Falta de documentación avalatoria',
      'Falta de troqueles-stickers de medicación o materiales', 'Falta firma paciente', 'Falta firma profesional',
      'Falta informe', 'Historia clínica incompleta', 'Material/ Medicamentos provistos por O.S.',
      'Material no utilizado', 'Medicación no suministrada', 'Orden sin diagnóstico'
    ]
  },
  {
    categoria: '5. AJUSTES Y GESTIÓN COMERCIAL',
    motivos: [
      'Débitos varios, informados fuera de término por Tesorería, emisión de NC a efectos del cobro de la factura',
      'El costo de los impuestos en el proceso de la refactura superan el importe posible de cobro de la misma',
      'Prestación/Presupuesto facturado con nota rechazados', 'Rechazo de refactura por mantener motivos de débitos originales'
    ]
  },
  {
    categoria: '6. OTROS / SIN CLASIFICAR',
    motivos: ['Borrar', 'No aplica']
  }
];

export const MOTIVOS_REFACTURA_AGRUPADOS = [
  {
    categoria: '1. ADMINISTRATIVOS',
    motivos: [
      'Afiliado activo', 'Ajuste de coseguro mal debitado', 'Facturado en tiempo y forma',
      'Información filiatoria completa y vigente', 'Refacturación con Iva correspondiente a la afiliación'
    ]
  },
  {
    categoria: '2. MÉDICOS / AUDITORÍA',
    motivos: [
      'Ajuste por demora en alta medica por pedido de derivación', 'Aclaración de diagnóstico ilegible (adjunto HC)',
      'Descripción aclaratoria de procedimiento realizado', 'Medico externo sin HC en Sanatorio',
      'Normas Medico Sanatoriales', 'Norma para tratamiento de infecciones', 'Normas post operatorias/antibioticoterapia',
      'Prestación de urgencia sin consentimiento', 'Procedimiento quirúrgico ampliado', 'Refactura con HC firmada',
      'Tratamiento Medico justificado en Auditoria'
    ]
  },
  {
    categoria: '3. CONTRACTUALES / NOMENCLADOR',
    motivos: [
      'APB aranceles vigentes -Colegio Bioquímico-', 'Ajuste de valores por acuerdo de presupuesto  post facturación',
      'Aplicación de normas acordadas según convenio vigentes', 'Aranceles facturados según convenio vigente',
      'Contraste facturado a valores vigentes.', 'Discrepancia en alcance de la cobertura de pensiones',
      'Exclusiones no detalladas explícitamente', 'Materiales Radioactivos facturados según valores CEDIM',
      'Medicación, descartable, materiales facturados según convenio vigente', 'No corresponde ajuste de valores medicación /materiales',
      'No corresponde aplicación de Normas unilateralmente', 'Obligación de cobertura avalada por Ley',
      'Prestación brindada previa a la Internación', 'Prestación facturada según módulos vigentes',
      'Prestación facturada según presupuesto acordado', 'Prestación homologada',
      'Prestación no incluida según norma del Nomenclador Nacional', 'Recargo por urgencia según norma del Nomenclador Nacional',
      'Se adjunta norma del Nomenclador Nacional'
    ]
  },
  {
    categoria: '4. OPERATIVOS Y DOCUMENTALES (administrativo)',
    motivos: [
      'Autorización no respondida por el financiador', 'Autorización recibida post cierre de facturación',
      'Autorización vigente al momento de la facturación', 'Corrección de error en S. Operativo',
      'Documentación completa enviada al Financiador', 'Incompatibilidad de normas aplicadas para la aplicación del débito',
      'Orden con diagnóstico, se adjunta HC como ampliación diag.', 'Prestación justificada en HC',
      'Se adjunta troquel/stiker', 'Refacturación de medicación según consumo correcto',
      'Refacturación en ámbito de realización correcto', 'Refacturación por corrección de los módulos liquidados',
      'Se adjunta documentación omitida en facturación original'
    ]
  },
  {
    categoria: '5. AJUSTES Y GESTIÓN COMERCIAL',
    motivos: [
      'Acuerdo de bonificación de medicación administrada', 'Acuerdo de bonificación en prestación brindada',
      'Excepciones refacturas acordadas'
    ]
  },
  {
    categoria: '6. OTROS / SIN CLASIFICAR',
    motivos: [
      'Borrar', 'Débito erróneamente aplicado', 'No aplica'
    ]
  }
];

// 2. Nuestro Custom Cell Editor para ag-Grid
@Component({
  selector: 'app-grouped-select-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <select [(ngModel)]="value" class="input-grilla" style="width: 100%; height: 100%; border: none; outline: none;">
      <option value="">Seleccionar...</option>
      <optgroup *ngFor="let grupo of grupos" [label]="grupo.categoria">
        <option *ngFor="let motivo of grupo.motivos" [value]="motivo">{{ motivo }}</option>
      </optgroup>
    </select>
  `
})
export class GroupedSelectEditor implements ICellEditorAngularComp {
  value: string = '';
  grupos: any[] = [];

  agInit(params: any): void {
    this.value = params.value || '';
    this.grupos = params.grupos || [];
  }

  getValue(): string {
    return this.value;
  }
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, AgGridModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AuditoriaComponent {
  debitoAceptadoMasivoSeleccionado: string = '';
  listaDebitoAceptado: string[] = ['Borrar', 'SI', 'NO'];
  private excelService = inject(ExcelExportService);

  listaMotivosAgrupados = MOTIVOS_DEBITO_AGRUPADOS;
  listaMotivosRefacturaAgrupados = MOTIVOS_REFACTURA_AGRUPADOS;

  motivoMasivoSeleccionado: string = '';
  motivoRefacturaMasivoSeleccionado: string = '';

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
    const tipo = this.tipoBusquedaRealizada;
    const englobante = this.debeMostrarEnglobante();

    // La NC queda como solo lectura, FC y ND se pueden editar
    const esSoloLectura = tipo === 'NC';

    let columnas: ColDef[] = [
      { headerName: '', field: 'seleccionada', checkboxSelection: true, headerCheckboxSelection: true, width: 50, pinned: 'left' },
      { headerName: 'Paciente', field: 'paciente', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Plan', field: 'plan', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Efector', field: 'efector', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Médico', field: 'medico', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Fecha', field: 'fecha', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 105, minWidth: 105, suppressAutoSize: true, valueFormatter: params => params.value ? new Date(params.value).toLocaleDateString() : '' },
      { headerName: 'Código', field: 'codigo', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 84, minWidth: 84, suppressAutoSize: true },
      { headerName: 'Descripción', field: 'descripcion', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Cant.', field: 'cantidad', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 67, minWidth: 67, suppressAutoSize: true },
      { headerName: 'Total\nNeto', field: 'totalNeto', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 103, minWidth: 103, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' },
      { headerName: 'Coseguro', field: 'coseguro', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 103, minWidth: 103, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' },
      { headerName: 'Total', field: 'total', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 99, minWidth: 99, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' }
    ];

    // Evaluamos si al menos un registro de la búsqueda tiene un comentario previo cargado
    const tieneComentariosPrevios = this.prestacionesFiltradas.some(p => p.comentarioPrevio && p.comentarioPrevio.trim() !== '');

    // Se muestra SIEMPRE en la ND. En la NC, SOLO se muestra si detectamos comentarios previos (es decir, si viene de una ND).
    if (tipo === 'ND' || (tipo === 'NC' && tieneComentariosPrevios)) {
      columnas.push({
        headerName: 'Comentarios\nPrevios',
        field: 'comentarioPrevio',
        editable: false,
        cellClass: 'bg-azul-auditoria',
        headerClass: 'bg-azul-auditoria'
      });
    }

    // Y acá empujamos todas las columnas de auditoría siempre (editables o bloqueadas según esSoloLectura)
    columnas.push(
      { headerName: 'Débito\nAceptado', field: 'debitoAceptado', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['', 'SI', 'NO'] }, width: 95, minWidth: 95, suppressAutoSize: true },
      { headerName: 'Motivo\nDébito', field: 'motivoDebito', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', cellEditor: GroupedSelectEditor, cellEditorParams: { grupos: this.listaMotivosAgrupados } },
      { headerName: 'Días\nFact.', field: 'diasFacturados', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', width: 63 }
    );

    if (englobante) {
      columnas.push({ headerName: 'Prestación\nEnglobante', field: 'prestacionEnglobante', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris' });
    }

    columnas.push({
      headerName: 'Imp.\nDebitado', field: 'importeDebitado', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', width: 93,
      valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
    });

    columnas.push({
      headerName: 'Comentarios\nDébito', field: 'comentariosDebito', headerClass: 'bg-naranja',
      editable: params => !esSoloLectura && !!params.data.motivoDebito && params.data.motivoDebito !== '',
      cellClassRules: {
        'bg-gris': params => !esSoloLectura && !!params.data.motivoDebito && params.data.motivoDebito !== '',
        'bg-naranja': params => esSoloLectura || (!params.data.motivoDebito || params.data.motivoDebito === '')
      }
    });

    columnas.push(
      { headerName: 'Motivo\nRefactura', field: 'motivoRefactura', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', cellEditor: GroupedSelectEditor, cellEditorParams: { grupos: this.listaMotivosRefacturaAgrupados } },
      { headerName: 'Imp.\nRefactura', field: 'importeRefactura', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', width: 94,
        valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
      },
      { headerName: 'Comentarios', field: 'comentarios', headerClass: 'bg-naranja',
        editable: params => !esSoloLectura && params.data.debitoAceptado === 'NO',
        cellClassRules: {
          'bg-gris': params => !esSoloLectura && params.data.debitoAceptado === 'NO',
          'bg-naranja': params => esSoloLectura || params.data.debitoAceptado !== 'NO'
        }
      }
    );

    this.columnDefs = columnas;
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

  limpiarFilasSeleccionadas() {
    if (this.registrosSeleccionados.length === 0) return;

    this.modalMensaje = `¿Estás seguro de que querés borrar el contenido de las ${this.registrosSeleccionados.length} filas seleccionadas?`;

    this.modalAceptarCb = () => {
      this.registrosSeleccionados.forEach(p => {
        p.debitoAceptado = '';
        p.motivoDebito = '';
        p.importeDebitado = undefined;  // Queda vacío en la grilla
        p.comentariosDebito = '';
        p.motivoRefactura = '';
        p.importeRefactura = undefined; // Queda vacío en la grilla
        p.comentarios = '';
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
    });

    if (aplicados === 0) {
      this.mostrarAlerta("No se aplicó el comentario porque ninguna de las filas seleccionadas tiene el Débito Aceptado marcado como 'NO'.");
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
      this.mostrarAlerta("No se aplicó el comentario porque ninguna fila seleccionada tiene un Motivo de Débito cargado.");
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
    if (this.busquedaForm.valid) {
      this.cargando = true; // Bloqueamos la UI

      const filtros = { ...this.busquedaForm.value };
      filtros.letra = filtros.letra ? filtros.letra.toUpperCase() : '';
      this.auditoriaService.buscarPrestaciones(filtros).subscribe({
        next: (data) => {
          this.tipoBusquedaRealizada = this.busquedaForm.value.tipo || '';

          this.prestaciones = data.map((p: any) => {
            // El backend ya envía 'SI', 'NO' o null. Solo convertimos los nulls a texto vacío.
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
          if (err.status === 404) {
            this.mostrarAlerta('Documento no encontrado. Verifique los datos ingresados.');
          } else {
            this.mostrarAlerta('Ocurrió un error al intentar comunicarse con el servidor.');
          }
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    }
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
    if (this.registrosSeleccionados.length === 0 || !this.motivoMasivoSeleccionado) return;

    const motivo = this.motivoMasivoSeleccionado;
    const registrosConPrevio = this.registrosSeleccionados.filter(p => p.motivoDebito && p.motivoDebito !== '');

    if (registrosConPrevio.length > 0) {
      this.modalMensaje = `Hay ${registrosConPrevio.length} registro(s) seleccionado(s) que ya tienen un motivo de débito.\n\n¿Desea REEMPLAZAR los motivos existentes?\n\n(Si selecciona Cancelar, se aplicará el nuevo motivo únicamente a las filas que estén vacías)`;

      this.modalAceptarCb = () => {
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
    this.calcularTotales();
    this.actualizarEstadoSeleccion();
    this.actualizarPaginacion();
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
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const marcado = checkbox.checked;

    // Actualizamos toda la lista filtrada (rápido en memoria)
    this.prestacionesFiltradas.forEach(p => p.seleccionada = marcado);
    this.actualizarEstadoSeleccion();
    this.cdr.detectChanges();
    // El HTML solo actualizará las 100 filas de 'prestacionesPaginadas' gracias a OnPush
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
    this.totalFacturado = 0;
    this.totalDebitado = 0;
    this.totalCantidad = 0;
    this.totalNetoGlobal = 0;
    this.totalCoseguroGlobal = 0;
    this.totalRefacturadoGlobal = 0;

    // Reiniciamos los nuevos contadores
    this.cantAceptados = 0;
    this.totalDebitadoAceptado = 0;
    this.totalRefacturarRechazado = 0;

    for (const p of this.prestacionesFiltradas) {
      // Sumas generales
      this.totalFacturado += (p.total || 0);
      this.totalDebitado += (p.importeDebitado || 0);
      this.totalCantidad += (p.cantidad || 0);
      this.totalNetoGlobal += (p.totalNeto || 0);
      this.totalCoseguroGlobal += (p.coseguro || 0);
      this.totalRefacturadoGlobal += (p.importeRefactura || 0);

      // Lógica de los nuevos KPIs
      // Lógica de los nuevos KPIs (Sin el PARCIAL)
      if (p.debitoAceptado === 'SI') {
        this.cantAceptados++;
        this.totalDebitadoAceptado += (p.importeDebitado || 0);
      } else if (p.debitoAceptado === 'NO') {
        this.totalRefacturarRechazado += (p.importeRefactura || 0);
      }
    }
    this.cdr.detectChanges();
  }

  exportarAExcel() {
    const f = this.busquedaForm.value;
    const nombreArchivo = `${f.tipo}-${f.letra}-${f.puntoVenta}-${f.numero}.xlsx`;

    this.excelService.exportarPrestaciones(
      this.prestacionesFiltradas,
      this.tipoBusquedaRealizada,
      nombreArchivo
    );
  }

  guardarParcialmente() {
    // 1. Recolectar solo los registros que cumplan las condiciones
    const registrosParaGuardar = this.prestaciones.filter(p => {
      if (this.tipoBusquedaRealizada === 'NC') {
        return p.motivoRefactura && p.motivoRefactura.trim() !== '';
      } else {
        // Para FC o ND, exigimos que haya Motivo de Débito
        return p.motivoDebito && p.motivoDebito.trim() !== '';
      }
    });

    if (registrosParaGuardar.length === 0) {
      this.mostrarAlerta('No hay registros con motivos asignados para guardar.'); // <-- Usamos el modal custom
      return;
    }

    // 2. Preparar el paquete (Payload) para enviar a Java
    const payload = {
      documentoOrigen: this.tipoBusquedaRealizada,
      letra: this.busquedaForm.value.letra ? this.busquedaForm.value.letra.toUpperCase() : '',
      ptovta: this.busquedaForm.value.puntoVenta,
      numero: this.busquedaForm.value.numero,
      usuario: this.authService.obtenerUsuario(),
      registros: registrosParaGuardar
    };

    // 3. Bloquear UI y disparar petición
    this.cargando = true;
    this.cdr.detectChanges();

    this.auditoriaService.guardarParcialmente(payload).subscribe({
      next: () => {
        // Mensaje coherente con la acción realizada
        this.mostrarAlerta('¡Los registros se guardaron parcialmente con éxito!');
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.mostrarAlerta('Ocurrió un error al intentar guardar en la base de datos.'); // <-- Usamos el modal custom
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  debeMostrarEnglobante(): boolean {
    return this.prestacionesFiltradas.some(p => p.motivoDebito === 'Prestacion incluida en otra');
  }

  mostrarAlerta(mensaje: string, callback?: () => void) {
    this.modalAlertaMensaje = mensaje;
    this.modalAlertaCallback = callback || null;
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
      this.mostrarAlerta('El campo "Letra" no puede contener números. Por favor, ingrese una letra válida.', () => {
        // Limpiamos el campo del formulario correspondiente
        formActual.patchValue({ letra: '' });
      });
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
        this.mostrarAlerta('No hay registros con Motivo de Débito cargado para generar una NC. Recuerde Guardar Parcialmente primero.');
        return;
      }
      this.nuevaNotaForm.reset({ tipo: 'NC' });
    } else {
      // Candado 1: Verificamos que haya registros con Débito Aceptado en "NO"
      const prestacionesConRefactura = this.prestaciones.filter(p => p.debitoAceptado === 'NO');

      if (prestacionesConRefactura.length === 0) {
        this.mostrarAlerta('No hay registros con Débito Aceptado en "NO" para generar una ND. Solo se refacturan los débitos rechazados.');
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
      this.mostrarAlerta('Por favor, complete todos los campos correctamente.');
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
        this.mostrarAlerta(`¡Nota de ${this.tipoNuevaNota === 'NC' ? 'Crédito' : 'Débito'} generada y guardada con éxito!`);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.mostrarAlerta(`Error al procesar la Nota de ${this.tipoNuevaNota === 'NC' ? 'Crédito' : 'Débito'}.`);
        this.cargando = false;
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
      // Refrescamos la fila completa para que la celda de Comentarios se bloquee/desbloquee instantáneamente
      event.api.refreshCells({ rowNodes: [event.node], force: true });
      return;
    }

    if (colId === 'motivoDebito') {
      if (previo && previo !== '' && previo !== nuevo) {
        this.modalMensaje = `Este registro ya tenía un motivo de débito ("${previo}").\n¿Desea reemplazarlo?`;

        this.modalAceptarCb = () => {
          this.ejecutarIndividualDebito(p, nuevo);
          event.api.refreshCells({ rowNodes: [event.node] }); // Repinta la fila (para mostrar el importe nuevo)
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
  }

}
