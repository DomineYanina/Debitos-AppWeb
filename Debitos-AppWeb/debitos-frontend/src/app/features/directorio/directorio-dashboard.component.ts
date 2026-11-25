import { Component, OnInit, inject, ChangeDetectorRef, AfterViewInit, HostListener, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription, takeUntil, firstValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  registerables
} from 'chart.js';
import { DirectorioService } from '../../core/services/directorio.service';
import { AuthService } from '../../core/services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { ExcelExportService, ContextoFiltroExportacion } from '../../core/services/excel-export';
import {
  CcComprobanteDTO,
  CcFinanciadorDTO,
  CcPeriodoDTO,
  DatasetGraficoDTO,
  DirectorioCobertura,
  DirectorioGrupoFactura,
  DirectorioMotivoDebito,
  DirectorioTotales,
  MatrizRecaudacionDTO,
  MatrizRecaudacionFilaDTO,
  CadenaTrazabilidadDTO,
  BuclePrestacionDTO,
  EventoTrazabilidadDTO,
  MetricaAnalistaDTO,
  MetricaMedicoDTO,
  MetricaOperadorDTO,
  DesempenoGlobalDTO,
  DesgloseMotivoDTO,
  DesgloseFinanciadorDTO,
  BalanceFinanciadorDTO,
  PuntoDonutDTO,
  TiemposCobranzaDTO,
  ReciboSinImputarDTO,
  DirectorioPrestacionItem,
  DirectorioPrestacionesResponse
} from '../../core/models/directorio.model';
import { LISTA_MOTIVOS_DEBITO, normalizarTextoMotivo, obtenerCategoriaDeMotivo } from '../../core/constants/motivos';

// Registro global de todos los módulos y controladores de Chart.js necesarios (doughnut, line, bar, etc.)
Chart.register(...registerables);


export interface OpcionPeriodoItem {
  value: string;
  label: string;
  primerDiaIso: string;
  ultimoDiaIso: string;
}

interface SliceDonut {
  motivo: string;
  montoTotal: number;
  porcentaje: number;
  cantidadCasos: number;
  color: string;
  pathData: string;
  middleAngle: number;
}

@Component({
  selector: 'app-directorio-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CurrencyPipe],
  templateUrl: './directorio-dashboard.component.html',
  styleUrl: './directorio-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DirectorioDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private directorioService = inject(DirectorioService);
  private excelExportService = inject(ExcelExportService);
  public authService = inject(AuthService);
  private themeService = inject(ThemeService, { optional: true });
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  exportandoExcel: boolean = false;

  private readonly destroy$ = new Subject<void>();
  private readonly cancelarPeticionesEnVuelo$ = new Subject<void>();

  private readonly SOLAPAS_VALIDAS = new Set([
    'tablero',
    'cuenta-corriente',
    'tiempos-cobranza',
    'matriz-cobranzas',
    'motivos',
    'analistas',
    'bucles',
    'usuarios-carga',
    'medicos',
    'trazabilidad',
    'prestaciones'
  ]);

  esSolapaValida(solapa: string): boolean {
    return this.SOLAPAS_VALIDAS.has(solapa);
  }

  get esGerenteDebitos(): boolean {
    return this.authService.hasRole('GERENTE_DEBITOS');
  }

  get esTesoreria(): boolean {
    return this.authService.hasRole('TESORERIA');
  }

  esSolapaPermitida(solapa: string): boolean {
    if (solapa === 'prestaciones') {
      return this.authService.isAdmin();
    }
    if (this.esGerenteDebitos) {
      const solapasExcluidas = ['tablero', 'cuenta-corriente', 'tiempos-cobranza', 'matriz-cobranzas', 'trazabilidad'];
      return !solapasExcluidas.includes(solapa);
    }
    if (this.esTesoreria) {
      const solapasPermitidas = ['tablero', 'cuenta-corriente', 'tiempos-cobranza', 'matriz-cobranzas', 'trazabilidad'];
      return solapasPermitidas.includes(solapa);
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Sistema de Solapas / Pestañas de Navegación del Tablero (10 Sectores Individuales)
  // ---------------------------------------------------------------------------
  solapaActiva:
    | 'tablero'
    | 'cuenta-corriente'
    | 'tiempos-cobranza'
    | 'matriz-cobranzas'
    | 'motivos'
    | 'analistas'
    | 'bucles'
    | 'usuarios-carga'
    | 'medicos'
    | 'trazabilidad'
    | 'prestaciones' = 'tablero';

  solapasCargadas = new Set<string>();
  private debounceFiltroTimer: any = null;

  private dispararFiltroDebounced(): void {
    if (this.debounceFiltroTimer) {
      clearTimeout(this.debounceFiltroTimer);
    }
    this.debounceFiltroTimer = setTimeout(() => {
      if (this.esRangoFechasValido) {
        this.aplicarFiltros();
      }
    }, 350);
  }

  private algunEstadoCargando(): boolean {
    return (
      this.cargandoTotales ||
      this.cargandoGrupos ||
      this.cargandoMotivos ||
      this.cargandoCuentaCorriente ||
      this.cargandoRecibosNoImputados ||
      this.cargandoMatriz ||
      this.cargandoTrazabilidad ||
      this.cargandoBucles ||
      this.cargandoAnalistas ||
      this.cargandoMedicos ||
      this.cargandoOperadores ||
      this.cargandoBalance ||
      this.cargandoTiemposCobranza ||
      this.cargandoEvolucion ||
      this.cargandoGraficos
    );
  }

  seleccionarSolapa(
    solapa:
      | 'tablero'
      | 'cuenta-corriente'
      | 'tiempos-cobranza'
      | 'matriz-cobranzas'
      | 'motivos'
      | 'analistas'
      | 'bucles'
      | 'usuarios-carga'
      | 'medicos'
      | 'trazabilidad'
      | 'prestaciones'
  ): void {
    if (!this.esSolapaPermitida(solapa)) {
      if (this.esGerenteDebitos) {
        solapa = 'motivos';
      } else if (this.esTesoreria) {
        solapa = 'tablero';
      } else {
        return;
      }
    }
    if (this.solapaActiva === solapa && this.solapasCargadas.has(solapa)) {
      return;
    }

    const solapaPrevia = this.solapaActiva;
    if (this.algunEstadoCargando() && solapaPrevia) {
      this.solapasCargadas.delete(solapaPrevia);
    }
    this.cancelarPeticionesEnVuelo$.next();
    this.resetearEstadosCarga();

    this.solapaActiva = solapa;
    if (
      solapa === 'tiempos-cobranza' ||
      solapa === 'matriz-cobranzas' ||
      solapa === 'bucles' ||
      solapa === 'analistas' ||
      solapa === 'medicos' ||
      solapa === 'usuarios-carga'
    ) {
      this.tipoDocSeleccionado = 'TODOS';
    }
    if (solapa === 'usuarios-carga') {
      this.tipoRegistroOperador = 'Todos';
    }
    if (solapa !== 'analistas' && this.criterioFechaCc === 'analisis') {
      this.criterioFechaCc = 'periodo';
      const fDesde = this._ccPeriodoDesde || this.fechaDesde;
      const fHasta = this._ccPeriodoHasta || this.fechaHasta;
      if (fDesde) this.fechaDesde = fDesde;
      if (fHasta) this.fechaHasta = fHasta;
      this.fechaDesdeAplicada = this.fechaDesde;
      this.fechaHastaAplicada = this.fechaHasta;
      this.validarFechas();
    }
    if (solapa === 'bucles') {
      if (this.codigoCoberturaSeleccionada !== 'TODAS' && this.coberturasBucles.length > 0) {
        if (!this.coberturasBucles.some(c => c.codigo === this.codigoCoberturaSeleccionada)) {
          this.codigoCoberturaSeleccionada = 'TODAS';
        }
      }
    }
    this.cargarDatosSolapa(solapa);
    this.actualizarAlturasSticky();
    if (solapa === 'tablero' || solapa === 'tiempos-cobranza' || solapa === 'motivos') {
      if (solapa === 'motivos') {
        const isDark = (this.themeService ? this.themeService.getResolvedTheme() : document.documentElement.getAttribute('data-theme')) === 'dark';
        this.actualizarColoresMotivosChart(isDark);
      }
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }

  cargarDatosSolapa(solapa: string, forzarRecarga = false): void {
    if (!this.esSolapaPermitida(solapa)) {
      return;
    }
    if (!forzarRecarga && this.solapasCargadas.has(solapa)) {
      return;
    }
    this.solapasCargadas.add(solapa);

    switch (solapa) {
      case 'tablero':
        this.cargarTotales();
        this.cargarBalanceFinanciero();
        this.cargarEvolucionMensual();
        break;
      case 'cuenta-corriente':
        this.cargarCuentaCorriente();
        this.cargarRecibosNoImputados();
        break;
      case 'tiempos-cobranza':
        this.cargarAgingFinanciero();
        break;
      case 'matriz-cobranzas':
        this.cargarMatrizRecaudacion();
        break;
      case 'motivos':
        this.cargarMotivos();
        this.cargarParetoMotivos();
        break;
      case 'analistas':
        this.cargarAnalistas();
        break;
      case 'medicos':
        this.cargarMedicos();
        break;
      case 'usuarios-carga':
        this.cargarOperadores();
        break;
      case 'bucles':
        this.cargarBucles();
        break;
      case 'trazabilidad':
        this.cargarTrazabilidad();
        break;
      case 'prestaciones':
        this.cargarPrestaciones(1);
        break;
    }
  }

  // Filtros
  coberturas: DirectorioCobertura[] = [];
  coberturasBucles: DirectorioCobertura[] = [];
  buclesTodos: CadenaTrazabilidadDTO[] = [];
  codigoCoberturaSeleccionada: string = 'TODAS';
  tiposDocumento: string[] = ['Facturas', 'Notas de Crédito', 'Notas de Débito', 'Recibos (RC)'];
  tipoDocSeleccionado: string = 'TODOS';
  fechaDesde: string = '';
  fechaHasta: string = '';
  fechaDesdeAplicada: string = '';
  fechaHastaAplicada: string = '';
  fechaMinimaPermitida: string = '2024-07-01';
  opcionesPeriodos: OpcionPeriodoItem[] = [];
  errorFechaDesde: string | null = null;
  errorFechaHasta: string | null = null;
  errorRangoFechas: string | null = null;

  get hayFiltrosFechasPendientes(): boolean {
    if (this.esFiltroFechaDeshabilitado) return false;
    return (
      (!!this.fechaDesde && this.fechaDesde !== this.fechaDesdeAplicada) ||
      (!!this.fechaHasta && this.fechaHasta !== this.fechaHastaAplicada)
    );
  }

  get noPuedeIrAlMesAnterior(): boolean {
    if (!this.fechaDesde) return false;
    const parts = this.fechaDesde.split('-');
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const ultimoDiaMesAnterior = new Date(year, month, 0);
    const isoFin = this.formatearFechaIso(ultimoDiaMesAnterior);
    return isoFin < this.fechaMinimaPermitida;
  }

  get esRangoFechasValido(): boolean {
    if (this.esFiltroFechaDeshabilitado) {
      return true;
    }
    return !this.errorFechaDesde && !this.errorFechaHasta && !this.errorRangoFechas && !!this.fechaDesde && !!this.fechaHasta;
  }

  get coberturasVisibles(): DirectorioCobertura[] {
    if (this.solapaActiva === 'bucles') {
      return this.coberturasBucles;
    }
    return this.coberturas;
  }

  get esFiltroFechaDeshabilitado(): boolean {
    return this.solapaActiva === 'matriz-cobranzas';
  }

  get esFiltroTipoDocDeshabilitado(): boolean {
    return (
      this.solapaActiva === 'analistas' ||
      this.solapaActiva === 'bucles' ||
      this.solapaActiva === 'medicos' ||
      this.solapaActiva === 'matriz-cobranzas' ||
      this.solapaActiva === 'tiempos-cobranza'
    );
  }

  get etiquetaFechaDesde(): string {
    if (
      this.solapaActiva === 'tablero' ||
      this.solapaActiva === 'motivos' ||
      this.solapaActiva === 'cuenta-corriente' ||
      this.solapaActiva === 'tiempos-cobranza'
    ) {
      return 'Período Desde';
    }
    return 'Fecha Desde';
  }

  get etiquetaFechaHasta(): string {
    if (
      this.solapaActiva === 'tablero' ||
      this.solapaActiva === 'motivos' ||
      this.solapaActiva === 'cuenta-corriente' ||
      this.solapaActiva === 'tiempos-cobranza'
    ) {
      return 'Período Hasta';
    }
    return 'Fecha Hasta';
  }

  get tooltipFiltroFecha(): string {
    switch (this.solapaActiva) {
      case 'tablero':
        return 'Filtra comprobantes según su período prestacional (período de la Factura Madre).';
      case 'motivos':
        return 'Filtra motivos de débito y refacturación según el período prestacional imputado a la Factura Madre.';
      case 'cuenta-corriente':
        return 'Filtra los períodos prestacionales visualizados en el desglose de cada institución médica.';
      case 'analistas':
        return 'Filtra débitos y refacturaciones según la fecha de auditoría o gestión del comprobante.';
      case 'bucles':
        return 'Filtra bucles de insistencia según la fecha de emisión cronológica de la Factura Original.';
      case 'usuarios-carga':
        return 'Filtra la productividad del operador según la fecha de emisión cronológica de la Factura Original.';
      case 'medicos':
        return 'Filtra el desempeño por prestador según la fecha de emisión cronológica de la Factura Original.';
      case 'trazabilidad':
        return 'Filtra expedientes según la fecha de emisión cronológica de la Factura Original.';
      case 'tiempos-cobranza':
        return 'Filtra comprobantes según su período prestacional o fecha de emisión de la Factura Madre (desde enero 2025 en adelante).';
      case 'matriz-cobranzas':
        return 'Esta solapa no filtra por rango de fechas; utiliza el selector anual de recaudación de la tabla.';
      default:
        return 'Rango de fechas para el filtrado de comprobantes.';
    }
  }

  // Estados de carga
  cargandoTotales: boolean = false;
  cargandoGrupos: boolean = false;
  cargandoMotivos: boolean = false;
  cargandoCuentaCorriente: boolean = false;
  cargandoMatriz: boolean = false;
  cargandoTrazabilidad: boolean = false;
  cargandoBucles: boolean = false;
  cargandoAnalistas: boolean = false;
  cargandoMedicos: boolean = false;
  cargandoOperadores: boolean = false;
  cargandoTiemposCobranza: boolean = false;

  // Datos
  cuentaCorrienteDatos: CcFinanciadorDTO[] = [];
  columnaOrdenCc: string = '';
  direccionOrdenCc: 'asc' | 'desc' = 'desc';
  pasoOrdenCc: number = 0;

  matrizRecaudacion: MatrizRecaudacionDTO | null = null;
  columnaOrdenMatriz: string = '';
  direccionOrdenMatriz: 'asc' | 'desc' = 'desc';
  pasoOrdenMatriz: number = 0;

  // Solapa Prestaciones Facturadas
  prestacionesDatos: DirectorioPrestacionItem[] = [];
  cargandoPrestaciones: boolean = false;
  errorCargaPrestaciones: string | null = null;
  prestacionesTotalRegistros: number = 0;
  prestacionesTotalMonto: number = 0;
  prestacionesTotalMedicos: number = 0;
  prestacionesTotalPacientes: number = 0;
  prestacionesPaginaActual: number = 1;
  prestacionesTamanioPagina: number = 50;
  prestacionesTotalPaginas: number = 1;
  columnaOrdenPrestaciones: string = '';
  direccionOrdenPrestaciones: 'asc' | 'desc' = 'desc';
  pasoOrdenPrestaciones: number = 0;

  filtroPrestacionTipoRegistro: 'TODOS' | 'Ambulatorios' | 'Internados' = 'TODOS';
  filtroPrestacionMedico: string = '';
  filtroPrestacionCodigo: string = '';

  sugerenciasMedicosPrestaciones: string[] = [];
  cargandoSugerenciasMedicos: boolean = false;
  mostrarSugerenciasMedicos: boolean = false;
  private debounceSugerenciasMedicoTimer: any = null;
  private sugerenciasMedicoSub?: Subscription;
  /** Texto que el usuario está escribiendo en el input de Médico (borrador, no filtra la tabla). */
  textoMedicoInput: string = '';
  sugerenciaMedicoActiva: number = -1;

  /** El backend devuelve como máximo esta cantidad de sugerencias (LIMIT 15). */
  readonly limiteSugerencias: number = 15;

  sugerenciasCodigosPrestaciones: { codigo: string; descripcion: string }[] = [];
  cargandoSugerenciasPrestaciones: boolean = false;
  mostrarSugerenciasPrestaciones: boolean = false;
  private debounceSugerenciasPrestacionTimer: any = null;
  private sugerenciasPrestacionSub?: Subscription;
  /** Texto que el usuario está escribiendo en el input de Prestación (borrador, no filtra la tabla). */
  textoPrestacionInput: string = '';
  /** Texto visible de la opción de Prestación aplicada como filtro (ej. "420101 - Consulta"). */
  textoPrestacionAplicado: string = '';
  sugerenciaPrestacionActiva: number = -1;

  /** Determina si existe al menos un filtro específico aplicado (Médico, Prestación o Atención). */
  get tieneFiltroLocalPrestaciones(): boolean {
    const tieneMedico = !!this.filtroPrestacionMedico && this.filtroPrestacionMedico.trim().length > 0;
    const tienePrestacion = !!this.filtroPrestacionCodigo && this.filtroPrestacionCodigo.trim().length > 0;
    const tieneAtencion = !!this.filtroPrestacionTipoRegistro && this.filtroPrestacionTipoRegistro !== 'TODOS';
    return tieneMedico || tienePrestacion || tieneAtencion;
  }

  // Estado del Modal de Límite de Exportación (Máximo 3 meses)
  modalExportPrestacionesVisible: boolean = false;
  modalExportCriterio: 'periodo' | 'fecha' = 'periodo';
  modalExportPeriodoDesde: string = '';
  modalExportPeriodoHasta: string = '';
  modalExportOpcionesDesde: OpcionPeriodoItem[] = [];
  modalExportOpcionesHasta: OpcionPeriodoItem[] = [];
  modalExportFechaDesde: string = '';
  modalExportFechaHasta: string = '';
  modalExportFechaHastaMin: string = '';
  modalExportFechaHastaMax: string = '';
  exportandoExcelModal: boolean = false;
  errorModalExport: string | null = null;

  trazabilidadDatos: CadenaTrazabilidadDTO[] = [];
  trazabilidadPaginaActual: number = 1;
  trazabilidadItemsPorPagina: number = 25;
  trazabilidadOpcionesItemsPorPagina: number[] = [10, 25, 50, 100];
  columnaOrdenTrazabilidad: string = '';
  direccionOrdenTrazabilidad: 'asc' | 'desc' = 'desc';
  pasoOrdenTrazabilidad: number = 0;
  filtroTrazabilidadLetra: string = '';
  filtroTrazabilidadPtoVta: string = 'TODOS';
  filtroTrazabilidadNumero: string = '';
  trazabilidadBusquedaRemotaActiva: boolean = false;
  private ultimoKeyRemotoTrazabilidad: string = '';

  buclesDatos: CadenaTrazabilidadDTO[] = [];
  columnaOrdenBucles: string = '';
  direccionOrdenBucles: 'asc' | 'desc' = 'desc';
  pasoOrdenBucles: number = 0;

  analistasDatos: MetricaAnalistaDTO[] = [];
  filtroAnalistaSeleccionado: string = 'TODOS';
  columnaOrdenAnalista: string = '';
  direccionOrdenAnalista: 'asc' | 'desc' = 'desc';
  pasoOrdenAnalista: number = 0;
  columnaOrdenMotivoAnalista: string = '';
  direccionOrdenMotivoAnalista: 'asc' | 'desc' = 'desc';
  pasoOrdenMotivoAnalista: number = 0;

  medicosDatos: MetricaMedicoDTO[] = [];
  filtroMedicoSeleccionado: string = 'TODOS';
  busquedaTextoMedico: string = '';
  medicosPaginaActual: number = 1;
  medicosItemsPorPagina: number = 25;
  medicosOpcionesItemsPorPagina: number[] = [25, 50, 100];
  columnaOrdenMedico: string = '';
  direccionOrdenMedico: 'asc' | 'desc' = 'desc';
  pasoOrdenMedico: number = 0;

  operadoresDatos: MetricaOperadorDTO[] = [];
  tipoRegistroOperador: 'Ambulatorios' | 'Internados' | 'Todos' = 'Todos';
  filtroOperadorSeleccionado: string = 'TODOS';
  busquedaTextoOperador: string = '';
  operadoresPaginaActual: number = 1;
  operadoresItemsPorPagina: number = 25;
  operadoresOpcionesItemsPorPagina: number[] = [25, 50, 100];
  columnaOrdenOperador: string = '';
  direccionOrdenOperador: 'asc' | 'desc' = 'desc';
  pasoOrdenOperador: number = 0;

  balanceFinanciadores: BalanceFinanciadorDTO[] = [];
  columnaOrdenBalance: string = '';
  direccionOrdenBalance: 'asc' | 'desc' = 'desc';
  pasoOrdenBalance: number = 0;
  cargandoBalance: boolean = false;
  totalesBalance = {
    facturacionFc: 0,
    incrementosNd: 0,
    debitosNc: 0,
    refacturadoNd: 0,
    cobradoRc: 0,
    saldoPendiente: 0
  };
  totales: DirectorioTotales = {
    totalFacturado: 0,
    cantidadFacturas: 0,
    totalIncrementosNd: 0,
    totalDebitosNc: 0,
    totalRefacturacionNd: 0,
    tasaRecupero: 0,
    totalCobranzas: 0,
    efectividadCobro: 0,
    saldoPendienteReal: 0,
    dsoPonderadoDias: 429,
    cobranzaEfectiva: 0,
    perdidaAsumida: 0,
    deudaNeta: 0,
    cantidadComprobantes: 0
  };

  gruposFacturas: DirectorioGrupoFactura[] = [];
  motivosDebito: DirectorioMotivoDebito[] = [];
  motivosDebitoOriginal: DirectorioMotivoDebito[] = [];
  categoriasMotivoDisponibles: { categoria: string; cantidad: number }[] = [];
  categoriaMotivoSeleccionada: string = 'TODAS';
  rawDatasetsPareto: DatasetGraficoDTO[] = [];
  totalElementsMotivos: number = 0;
  columnaOrdenMotivos: string = '';
  direccionOrdenMotivos: 'asc' | 'desc' = 'desc';
  pasoOrdenMotivos: number = 0;

  // Paleta de colores para el gráfico Donut
  private paletaColores: string[] = [
    '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185',
    '#fb923c', '#fbbf24', '#34d399', '#2dd4bf', '#22d3ee',
    '#60a5fa', '#a78bfa', '#e879f9', '#4ade80', '#a3e635'
  ];

  slicesDonut: SliceDonut[] = [];
  sectorHover: SliceDonut | null = null;

  // ---------------------------------------------------------------------------
  // Gráficos Chart.js
  // ---------------------------------------------------------------------------

  /** Paleta para el doughnut (distribución de cartera) */
  private readonly COLORES_DONA: string[] = [
    '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185',
    '#fb923c', '#fbbf24', '#34d399', '#2dd4bf', '#4ade80',
    '#60a5fa', '#a78bfa', '#e879f9', '#22d3ee', '#a3e635'
  ];
  private readonly COLORES_DONA_BORDE: string[] = this.COLORES_DONA.map(c => c); // mismo color de borde

  cargandoGraficos = false;
  cargandoEvolucion = false;

  puntosDonut: PuntoDonutDTO[] = [];

  /** Doughnut: Distribución de cartera por financiador */
  distribucionChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.COLORES_DONA,
      borderColor: '#1e293b',
      borderWidth: 2,
      hoverOffset: 8
    }]
  };

  distribucionChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    onHover: (event, activeElements) => {
      const target = event.native?.target as HTMLElement | null;
      if (target) {
        target.style.cursor = activeElements && activeElements.length > 0 ? 'pointer' : 'default';
      }
    },
    onClick: (_event, activeElements, chart) => {
      if (activeElements && activeElements.length > 0) {
        const index = activeElements[0].index;
        const label = chart.data.labels?.[index] as string;
        this.seleccionarInstitucionDesdeGrafico(label, index);
      }
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#1e293b',
          font: { size: 12, family: 'Inter, sans-serif', weight: 500 },
          padding: 14,
          boxWidth: 14
        },
        onClick: (_event, legendItem, legend) => {
          if (legendItem.index !== undefined && legend.chart) {
            const label = legend.chart.data.labels?.[legendItem.index] as string;
            this.seleccionarInstitucionDesdeGrafico(label, legendItem.index);
          }
        }
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const v = (ctx.raw as number) ?? 0;
            return ` ${ctx.label}: $ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    }
  };

  /** Line: Evolución mensual (Facturación / Débitos / Cobranzas) */
  evolucionChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Facturación',
        data: [],
        borderColor: '#38bdf8',        // Azul corporativo
        backgroundColor: 'rgba(56,189,248,0.10)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      },
      {
        label: 'Débitos (NC)',
        data: [],
        borderColor: '#f87171',        // Rojo
        backgroundColor: 'rgba(248,113,113,0.08)',
        fill: false,
        tension: 0.4,
        borderDash: [6, 3],            // Punteado
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      },
      {
        label: 'Cobranzas (RC)',
        data: [],
        borderColor: '#34d399',        // Verde
        backgroundColor: 'rgba(52,211,153,0.10)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };

  evolucionChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        ticks: { color: '#475569', font: { size: 11, weight: 500 } },
        grid: { color: 'rgba(148,163,184,0.15)' }
      },
      y: {
        ticks: {
          color: '#475569',
          font: { size: 11, weight: 500 },
          callback: (v) => '$ ' + Number(v).toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })
        },
        grid: { color: 'rgba(148,163,184,0.15)' }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#1e293b',
          font: { size: 12, family: 'Inter, sans-serif', weight: 500 },
          padding: 16,
          boxWidth: 16,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: $ ${Number(ctx.raw).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        }
      }
    }
  };

  // ── Aging Financiero (Bar vertical) ───────────────────────────────────────

  /** Colores por rango: 5 tramos cobrados + 1 tramo aún no cobrado */
  readonly COLORES_AGING = [
    '#059669',  // De 0 a 45 días   (verde esmeralda)
    '#0284c7',  // De 46 a 75 días  (celeste)
    '#2563eb',  // De 76 a 105 días (azul)
    '#d97706',  // De 106 a 135 días (ámbar)
    '#7c3aed',  // Más de 135 días  (púrpura)
    '#dc2626'   // Aún no cobrados  (rojo alerta)
  ];

  obtenerColorRango(rango: string): string {
    const r = (rango || '').toLowerCase();
    if (r.includes('aún no') || r.includes('aun no') || r.includes('no cobrad')) return '#dc2626';
    if (r.includes('0 a 45') || r.includes('0 a 30')) return '#059669';
    if (r.includes('46 a 75') || r.includes('31 a 60')) return '#0284c7';
    if (r.includes('76 a 105') || r.includes('61 a 90')) return '#2563eb';
    if (r.includes('106 a 135') || r.includes('91 a 180')) return '#d97706';
    if (r.includes('135') || r.includes('180')) return '#7c3aed';
    return '#64748b';
  }

  tiemposCobranzaDatos: TiemposCobranzaDTO | null = null;

  agingChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      label: 'Monto',
      data: [],
      backgroundColor: this.COLORES_AGING,
      borderColor: this.COLORES_AGING.map(c => c + 'cc'),
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  agingChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` Monto: $${Number(ctx.raw).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          font: { size: 10, weight: 500 }
        },
        grid: { display: false }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { size: 9, weight: 500 },
          callback: v => '$' + Math.round(Number(v) / 1000) + 'k'
        },
        grid: { color: '#334155' }
      }
    }
  };

  actualizarColoresAgingChart(isDark: boolean): void {
    const tickColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#334155' : 'rgba(226, 232, 240, 0.6)';
    if (this.agingChartOptions?.scales) {
      if (this.agingChartOptions.scales['x']?.ticks) {
        (this.agingChartOptions.scales['x'].ticks as any).color = tickColor;
      }
      if (this.agingChartOptions.scales['y']?.ticks) {
        (this.agingChartOptions.scales['y'].ticks as any).color = tickColor;
      }
      if (this.agingChartOptions.scales['y']?.grid) {
        (this.agingChartOptions.scales['y'].grid as any).color = gridColor;
      }
    }
    this.cdr.markForCheck();
  }

  actualizarColoresMotivosChart(isDark: boolean): void {
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const yTextColor = isDark ? '#cbd5e1' : '#0f172a';
    const gridColor = isDark ? '#334155' : 'rgba(148,163,184,0.18)';
    const legendColor = isDark ? '#cbd5e1' : '#1e293b';

    if (this.motivosChartOptions?.scales) {
      if (this.motivosChartOptions.scales['x']) {
        if (this.motivosChartOptions.scales['x'].ticks) {
          (this.motivosChartOptions.scales['x'].ticks as any).color = textColor;
        }
        if (this.motivosChartOptions.scales['x'].grid) {
          (this.motivosChartOptions.scales['x'].grid as any).color = gridColor;
        }
      }
      if (this.motivosChartOptions.scales['y']) {
        if (this.motivosChartOptions.scales['y'].ticks) {
          (this.motivosChartOptions.scales['y'].ticks as any).color = yTextColor;
        }
        if (this.motivosChartOptions.scales['y'].grid) {
          (this.motivosChartOptions.scales['y'].grid as any).color = gridColor;
        }
      }
    }
    if (this.motivosChartOptions?.plugins?.legend?.labels) {
      (this.motivosChartOptions.plugins.legend.labels as any).color = legendColor;
    }
    this.cdr.markForCheck();
  }

  // ── Pareto de Motivos / Glosas (Bar apilada) ────────────────────────────────

  motivosChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Refacturado ($)',
        data: [],
        backgroundColor: '#2563eb',
        borderColor: '#1d4ed8',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Pérdida ($)',
        data: [],
        backgroundColor: '#881337',
        borderColor: '#881337',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Diferencia ($)',
        data: [],
        backgroundColor: '#7c3aed',
        borderColor: '#6d28d9',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  motivosChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y', // Convierte el gráfico a barras horizontales
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1e293b',
          font: { size: 13, weight: 600 },
          padding: 16,
          boxWidth: 16
        }
      },
      tooltip: {
        titleFont: { size: 13, weight: 600 },
        bodyFont: { size: 13, weight: 500 },
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: $ ${Number(ctx.raw).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        min: 0,
        beginAtZero: true,
        ticks: {
          color: '#334155',
          font: { size: 12, weight: 600 },
          // El formato de moneda ahora va en el eje X (montos)
          callback: v => '$ ' + Number(v).toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })
        },
        grid: { color: 'rgba(148,163,184,0.18)' }
      },
      y: {
        stacked: true,
        ticks: {
          color: '#0f172a',
          font: { size: 13, weight: 600 },
          padding: 8
        },
        grid: { display: false }
      }
    }
  };

  ngOnInit(): void {
    this.inicializarFechasMesAnterior();

    this.directorioService.obtenerFechaMinimaFiltro().subscribe({
      next: (res) => {
        if (res && res.fechaMinima) {
          this.fechaMinimaPermitida = res.fechaMinima;
          if (this.fechaDesde && this.fechaDesde < this.fechaMinimaPermitida) {
            this.fechaDesde = this.fechaMinimaPermitida;
          }
          this.generarOpcionesPeriodos();
          this.validarFechas();
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error al obtener fecha mínima permitida:', err)
    });

    if (this.themeService) {
      this.themeService.resolvedTheme$.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
        const isDark = theme === 'dark';
        this.actualizarColoresAgingChart(isDark);
        this.actualizarColoresMotivosChart(isDark);
      });
    }

    this.authService.rolActual$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.esGerenteDebitos && !this.esSolapaPermitida(this.solapaActiva)) {
        this.seleccionarSolapa('motivos');
        this.cdr.markForCheck();
      } else if (!this.esSolapaPermitida(this.solapaActiva)) {
        this.seleccionarSolapa('tablero');
        this.cdr.markForCheck();
      }
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const solapaParam = params.get('solapa');
      if (solapaParam && this.esSolapaValida(solapaParam) && this.esSolapaPermitida(solapaParam)) {
        this.solapaActiva = solapaParam as any;
      } else if (this.esGerenteDebitos && !this.esSolapaPermitida(this.solapaActiva)) {
        this.solapaActiva = 'motivos';
      } else if (!this.esSolapaPermitida(this.solapaActiva)) {
        this.solapaActiva = 'tablero';
      }
      const codCob = params.get('codigoCobertura');
      if (codCob) {
        this.codigoCoberturaSeleccionada = codCob;
      }
      const tipo = params.get('tipoDoc');
      if (tipo) {
        this.tipoDocSeleccionado = tipo;
      }
      const fDesde = params.get('fechaDesde');
      if (fDesde) {
        this.fechaDesde = fDesde;
      }
      const fHasta = params.get('fechaHasta');
      if (fHasta) {
        this.fechaHasta = fHasta;
      }
      this.fechaDesdeAplicada = this.fechaDesde;
      this.fechaHastaAplicada = this.fechaHasta;
      this.validarFechas();

      this.cargarCoberturas();
      this.cargarTiposDocumento();
      this.cargarDashboard();

      if (this.solapaActiva === 'motivos' || this.solapaActiva === 'tablero' || this.solapaActiva === 'tiempos-cobranza') {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          this.actualizarAlturasSticky();
        }, 80);
      }
    });
  }

  ngAfterViewInit(): void {
    this.actualizarAlturasSticky();
  }

  ngOnDestroy(): void {
    this.cancelarPeticionesEnVuelo$.next();
    this.cancelarPeticionesEnVuelo$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.debounceFiltroTimer) {
      clearTimeout(this.debounceFiltroTimer);
      this.debounceFiltroTimer = null;
    }
    if (this.precargaTimer) {
      clearTimeout(this.precargaTimer);
      this.precargaTimer = null;
    }
    if (this.debounceSugerenciasMedicoTimer) {
      clearTimeout(this.debounceSugerenciasMedicoTimer);
      this.debounceSugerenciasMedicoTimer = null;
    }
    if (this.debounceSugerenciasPrestacionTimer) {
      clearTimeout(this.debounceSugerenciasPrestacionTimer);
      this.debounceSugerenciasPrestacionTimer = null;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.actualizarAlturasSticky();
  }

  /**
   * Mide dinámicamente la altura real de la cabecera (thead) y filas expandidas de las tablas,
   * asignando las variables CSS correspondientes para que las filas fijas encajen a la perfección
   * sin superposiciones ni saltos al hacer scroll vertical.
   * Optimizado por lotes (Lecturas -> Escrituras) en requestAnimationFrame para evitar Layout Thrashing.
   */
  actualizarAlturasSticky(): void {
    requestAnimationFrame(() => {
      const tables = document.querySelectorAll('.table-sanatorial');
      if (!tables || tables.length === 0) return;

      // FASE 1: Lecturas en lote (sin invalidar layout entre tablas)
      const updates: Array<{
        table: HTMLElement;
        theadHeight: number;
        l1Height: number;
        l2Height: number;
        totalRowHeight: number;
      }> = [];

      tables.forEach((tableEl) => {
        const table = tableEl as HTMLElement;
        if (table.offsetParent === null && table.offsetWidth === 0 && table.offsetHeight === 0) {
          return;
        }

        let theadHeight = 0;
        const th = table.querySelector('thead th');
        if (th) {
          theadHeight = Math.round(th.getBoundingClientRect().height);
        } else {
          const thead = table.querySelector('thead');
          if (thead) {
            theadHeight = Math.round(thead.getBoundingClientRect().height);
          }
        }

        let totalRowHeight = 0;
        const totalRow = table.querySelector('tr.tr-total-superior-operadores, tr.tr-total-superior-medicos, tr.tr-totales-fijos, tr.tr-totales-cc') as HTMLElement | null;
        if (totalRow) {
          totalRowHeight = Math.round(totalRow.getBoundingClientRect().height);
        }

        let l1Height = 0;
        const l1Expanded = table.querySelector(
          'tr.is-expanded.tr-analista, tr.is-expanded.tr-financiador, tr.is-expanded.tr-parent-nivel1'
        ) as HTMLElement | null;
        if (l1Expanded) {
          const td = l1Expanded.querySelector('td');
          l1Height = Math.round((td || l1Expanded).getBoundingClientRect().height);
        }

        let l2Height = 0;
        const l2Expanded = table.querySelector(
          'tr.is-expanded.tr-motivo, tr.is-expanded.tr-periodo'
        ) as HTMLElement | null;
        if (l2Expanded) {
          const td = l2Expanded.querySelector('td');
          l2Height = Math.round((td || l2Expanded).getBoundingClientRect().height);
        }

        updates.push({ table, theadHeight, l1Height, l2Height, totalRowHeight });
      });

      // FASE 2: Escrituras en lote (aplica propiedades CSS sin re-leer layout)
      for (const u of updates) {
        if (u.theadHeight > 0) {
          u.table.style.setProperty('--sticky-header-top', `${u.theadHeight}px`);
        }
        if (u.totalRowHeight > 0) {
          u.table.style.setProperty('--sticky-total-height', `${u.totalRowHeight}px`);
        }
        if (u.l1Height > 0) {
          u.table.style.setProperty('--sticky-l1-height', `${u.l1Height}px`);
        }
        if (u.l2Height > 0) {
          u.table.style.setProperty('--sticky-l2-height', `${u.l2Height}px`);
        }
      }
    });
  }

  // Establece por defecto el primer y último día del mes anterior
  inicializarFechasMesAnterior(): void {
    const hoy = new Date();
    const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    this.fechaDesde = this.formatearFechaIso(primerDiaMesAnterior);
    this.fechaHasta = this.formatearFechaIso(ultimoDiaMesAnterior);
    this.fechaDesdeAplicada = this.fechaDesde;
    this.fechaHastaAplicada = this.fechaHasta;

    // Inicializar los rangos independientes de Cuenta Corriente con el mismo período
    this._ccPeriodoDesde = this.fechaDesde;
    this._ccPeriodoHasta = this.fechaHasta;
    this._ccFechaDesde = this.fechaDesde;
    this._ccFechaHasta = this.fechaHasta;
    this._ccAnalisisDesde = this.fechaDesde;
    this._ccAnalisisHasta = this.fechaHasta;

    this.validarFechas();
    this.generarOpcionesPeriodos();
  }

  formatearFechaIso(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  validarFormatoFecha(fechaStr: string): string | null {
    if (!fechaStr || fechaStr.trim() === '') {
      return 'Debe ingresar una fecha';
    }

    const partes = fechaStr.split('-');
    if (partes.length !== 3) {
      return 'Formato de fecha incompleto';
    }

    const anioStr = partes[0];
    const mesStr = partes[1];
    const diaStr = partes[2];

    if (anioStr.length !== 4) {
      return 'El año debe tener exactamente 4 dígitos';
    }

    const anio = parseInt(anioStr, 10);
    const mes = parseInt(mesStr, 10);
    const dia = parseInt(diaStr, 10);

    if (isNaN(anio) || isNaN(mes) || isNaN(dia)) {
      return 'Fecha con formato numérico inválido';
    }

    const anioMinimo = 2000;
    const anioMaximo = Math.max(new Date().getFullYear() + 5, 2035);

    if (anio < anioMinimo) {
      return `El año no puede ser anterior a ${anioMinimo}`;
    }

    if (anio > anioMaximo) {
      return `El año no puede ser posterior a ${anioMaximo}`;
    }

    if (mes < 1 || mes > 12) {
      return 'El mes debe estar entre 01 y 12';
    }

    const diasEnMes = new Date(anio, mes, 0).getDate();
    if (dia < 1 || dia > diasEnMes) {
      return `Día inválido para el mes (máximo ${diasEnMes} días)`;
    }

    return null;
  }

  superaBrechaMaxima48Meses(desdeStr: string, hastaStr: string): boolean {
    if (!desdeStr || !hastaStr) return false;
    const partesD = desdeStr.split('-');
    const partesH = hastaStr.split('-');
    if (partesD.length !== 3 || partesH.length !== 3) return false;

    const yD = parseInt(partesD[0], 10);
    const mD = parseInt(partesD[1], 10);
    const dD = parseInt(partesD[2], 10);

    const yH = parseInt(partesH[0], 10);
    const mH = parseInt(partesH[1], 10);
    const dH = parseInt(partesH[2], 10);

    if (isNaN(yD) || isNaN(mD) || isNaN(dD) || isNaN(yH) || isNaN(mH) || isNaN(dH)) {
      return false;
    }

    // Límite de 48 meses (4 años) calendario a partir de fechaDesde
    const maxHastaDate = new Date(yD, mD - 1 + 48, dD);
    const hastaDate = new Date(yH, mH - 1, dH);

    return hastaDate > maxHastaDate;
  }

  validarFechas(): boolean {
    if (this.esFiltroFechaDeshabilitado) {
      this.errorFechaDesde = null;
      this.errorFechaHasta = null;
      this.errorRangoFechas = null;
      return true;
    }

    this.errorFechaDesde = this.validarFormatoFecha(this.fechaDesde);
    this.errorFechaHasta = this.validarFormatoFecha(this.fechaHasta);

    if (this.errorFechaDesde || this.errorFechaHasta) {
      this.errorRangoFechas = null;
      return false;
    }

    if (this.fechaDesde > this.fechaHasta) {
      this.errorRangoFechas = 'La Fecha Desde no puede ser posterior a la Fecha Hasta';
      return false;
    }

    if (this.superaBrechaMaxima48Meses(this.fechaDesde, this.fechaHasta)) {
      this.errorRangoFechas = 'El rango entre fechas no puede superar los 48 meses (4 años)';
      return false;
    }

    if (this.fechaDesde && this.fechaMinimaPermitida && this.fechaDesde < this.fechaMinimaPermitida) {
      this.errorFechaDesde = `La fecha mínima permitida es ${this.fechaMinimaPermitida}`;
      return false;
    }

    this.errorRangoFechas = null;
    return true;
  }

  onFechaInput(event: Event, tipo: 'desde' | 'hasta'): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    // Si el usuario está tipeando (badInput es true durante el ingreso de los dígitos del año),
    // no mostramos mensaje de error para evitar parpadeos agresivos y permitir completar los 4 dígitos.
    if (input.validity && input.validity.badInput) {
      if (tipo === 'desde') {
        this.errorFechaDesde = null;
      } else {
        this.errorFechaHasta = null;
      }
      this.cdr.markForCheck();
      return;
    }

    if (!input.value) {
      if (tipo === 'desde') {
        this.errorFechaDesde = null;
      } else {
        this.errorFechaHasta = null;
      }
      this.cdr.markForCheck();
      return;
    }

    // Detectar si el usuario está a mitad del tipeo del año (ej. '0002', '0020', año < 1000)
    const partes = input.value.split('-');
    if (partes.length === 3) {
      const anioNum = parseInt(partes[0], 10);
      if (partes[0].startsWith('0') || (anioNum > 0 && anioNum < 1000)) {
        if (tipo === 'desde') {
          this.fechaDesde = input.value;
          this.errorFechaDesde = null;
        } else {
          this.fechaHasta = input.value;
          this.errorFechaHasta = null;
        }
        this.errorRangoFechas = null;
        this.cdr.markForCheck();
        return;
      }
    }

    // El usuario ingresó una fecha completa válida (YYYY-MM-DD)
    if (tipo === 'desde') {
      this.fechaDesde = input.value;
      this.errorFechaDesde = null;
    } else {
      this.fechaHasta = input.value;
      this.errorFechaHasta = null;
    }

    this.validarFechas();
    this.cdr.markForCheck();
  }

  onFechaBlur(event: Event, tipo: 'desde' | 'hasta'): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      if (input.validity && input.validity.badInput) {
        if (tipo === 'desde') {
          this.errorFechaDesde = 'Fecha incompleta o inválida';
        } else {
          this.errorFechaHasta = 'Fecha incompleta o inválida';
        }
      } else if (!input.value) {
        if (tipo === 'desde') {
          this.errorFechaDesde = 'Debe ingresar una fecha';
        } else {
          this.errorFechaHasta = 'Debe ingresar una fecha';
        }
      } else {
        if (tipo === 'desde') {
          this.fechaDesde = input.value;
        } else {
          this.fechaHasta = input.value;
        }
        this.validarFechas();
      }
    } else {
      this.validarFechas();
    }
    this.cdr.markForCheck();
  }

  onEnterFiltro(): void {
    this.validarFechas();
    if (this.esRangoFechasValido) {
      this.aplicarFiltros();
    }
    this.cdr.markForCheck();
  }

  cargarCoberturas(): void {
    const fDesde = this.criterioFechaCc === 'fecha'
      ? (this.ccFechaDesde || this.fechaDesde)
      : (this.fechaDesde || this._ccPeriodoDesde);
    const fHasta = this.criterioFechaCc === 'fecha'
      ? (this.ccFechaHasta || this.fechaHasta)
      : (this.fechaHasta || this._ccPeriodoHasta);
    const criterio = this.criterioFechaCc || 'periodo';

    this.directorioService.obtenerCoberturas(fDesde, fHasta, criterio).pipe(
      takeUntil(this.cancelarPeticionesEnVuelo$),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.coberturas = data || [];
        if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
          const existe = this.coberturas.some(c => c.codigo === this.codigoCoberturaSeleccionada);
          if (!existe) {
            this.codigoCoberturaSeleccionada = 'TODAS';
          }
        }
        if (this.buclesTodos.length > 0) {
          this.actualizarCoberturasBucles(this.buclesTodos);
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error al cargar coberturas:', err)
    });
  }

  cargarTiposDocumento(): void {
    this.directorioService.obtenerTiposDocumento().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.tiposDocumento = data;
        } else {
          this.tiposDocumento = ['Facturas', 'Notas de Crédito', 'Notas de Débito', 'Recibos (RC)'];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar tipos de documento:', err);
        this.tiposDocumento = ['Facturas', 'Notas de Crédito', 'Notas de Débito', 'Recibos (RC)'];
        this.cdr.markForCheck();
      }
    });
  }

  private resetearEstadosCarga(): void {
    this.cargandoTotales = false;
    this.cargandoGrupos = false;
    this.cargandoMotivos = false;
    this.cargandoCuentaCorriente = false;
    this.cargandoRecibosNoImputados = false;
    this.cargandoMatriz = false;
    this.cargandoTrazabilidad = false;
    this.cargandoBucles = false;
    this.cargandoAnalistas = false;
    this.cargandoMedicos = false;
    this.cargandoOperadores = false;
    this.cargandoBalance = false;
    this.cargandoTiemposCobranza = false;
    this.cargandoEvolucion = false;
    this.cargandoGraficos = false;
    this.graficosPendientes = 0;
  }

  private precargaTimer: any = null;

  private programarPrecargaSolapasSecundarias(): void {
    if (this.precargaTimer) {
      clearTimeout(this.precargaTimer);
      this.precargaTimer = null;
    }
    // Desactivada la precarga automática en ráfaga para evitar sobrecargar PostgreSQL
    // con múltiples consultas analíticas pesadas simultáneas (previniendo statement timeouts).
    // Cada solapa se carga bajo demanda al hacer clic en ella y se almacena en solapasCargadas.
  }

  cargarDashboard(): void {
    this.cancelarPeticionesEnVuelo$.next();
    this.resetearEstadosCarga();
    this.solapasCargadas.clear();
    this.cargarCoberturas();
    this.cargarDatosSolapa(this.solapaActiva, true);
    this.programarPrecargaSolapasSecundarias();
  }

  onFechaDesdeChange(): void {
    this.validarFechas();
    this.cargarCoberturas();
    this.cdr.markForCheck();
  }

  onFechaHastaChange(): void {
    this.validarFechas();
    this.cargarCoberturas();
    this.cdr.markForCheck();
  }

  validarRangoFechas(): void {
    this.validarFechas();
    this.cdr.markForCheck();
  }

  aplicarFiltros(): void {
    if (this.debounceFiltroTimer) {
      clearTimeout(this.debounceFiltroTimer);
      this.debounceFiltroTimer = null;
    }
    this.validarRangoFechas();
    if (!this.esRangoFechasValido) {
      this.cdr.markForCheck();
      return;
    }
    this.ccPaginaActual = 1;
    this.fechaDesdeAplicada = this.fechaDesde;
    this.fechaHastaAplicada = this.fechaHasta;
    this.solapasCargadas.clear();
    this.cargarDashboard();
  }

  irAlMesAnterior(): void {
    if (this.esFiltroFechaDeshabilitado) return;
    if (this.noPuedeIrAlMesAnterior) return;

    let baseDate = new Date();
    if (this.fechaDesde) {
      const parts = this.fechaDesde.split('-');
      if (parts.length === 3) {
        baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    } else if (this.fechaHasta) {
      const parts = this.fechaHasta.split('-');
      if (parts.length === 3) {
        baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    const primerDia = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
    const ultimoDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), 0);
    let fDesdeIso = this.formatearFechaIso(primerDia);
    const fHastaIso = this.formatearFechaIso(ultimoDia);

    if (fHastaIso < this.fechaMinimaPermitida) return;
    if (fDesdeIso < this.fechaMinimaPermitida) fDesdeIso = this.fechaMinimaPermitida;

    this.fechaDesde = fDesdeIso;
    this.fechaHasta = fHastaIso;
    this.fechaDesdeAplicada = this.fechaDesde;
    this.fechaHastaAplicada = this.fechaHasta;
    if (this.criterioFechaCc === 'periodo') {
      this._ccPeriodoDesde = this.fechaDesde;
      this._ccPeriodoHasta = this.fechaHasta;
    }
    this.validarFechas();

    this.solapasCargadas.clear();
    this.cargarDashboard();
  }

  irAlMesSiguiente(): void {
    if (this.esFiltroFechaDeshabilitado) return;

    let baseDate = new Date();
    if (this.fechaDesde) {
      const parts = this.fechaDesde.split('-');
      if (parts.length === 3) {
        baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    } else if (this.fechaHasta) {
      const parts = this.fechaHasta.split('-');
      if (parts.length === 3) {
        baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    const primerDia = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
    const ultimoDia = new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 0);
    const fDesdeIso = this.formatearFechaIso(primerDia);
    const fHastaIso = this.formatearFechaIso(ultimoDia);

    this.fechaDesde = fDesdeIso;
    this.fechaHasta = fHastaIso;
    this.fechaDesdeAplicada = this.fechaDesde;
    this.fechaHastaAplicada = this.fechaHasta;
    if (this.criterioFechaCc === 'periodo') {
      this._ccPeriodoDesde = this.fechaDesde;
      this._ccPeriodoHasta = this.fechaHasta;
    }
    this.validarFechas();

    this.solapasCargadas.clear();
    this.cargarDashboard();
  }

  restablecerFiltros(): void {
    this.filtroAnalistaSeleccionado = 'TODOS';
    this.filtroMedicoSeleccionado = 'TODOS';
    this.columnaOrdenAnalista = '';
    this.pasoOrdenAnalista = 0;
    this.columnaOrdenMotivoAnalista = '';
    this.pasoOrdenMotivoAnalista = 0;
    this.columnaOrdenMedico = '';
    this.pasoOrdenMedico = 0;
    this.columnaOrdenCc = '';
    this.pasoOrdenCc = 0;
    this.columnaOrdenMatriz = '';
    this.pasoOrdenMatriz = 0;
    this.columnaOrdenBucles = '';
    this.pasoOrdenBucles = 0;
    this.columnaOrdenOperador = '';
    this.pasoOrdenOperador = 0;
    this.columnaOrdenTrazabilidad = '';
    this.pasoOrdenTrazabilidad = 0;
    this.columnaOrdenBalance = '';
    this.pasoOrdenBalance = 0;
    this.columnaOrdenMotivos = '';
    this.pasoOrdenMotivos = 0;
    this.irAlMesAnterior();
  }

  cargarTotales(): void {
    this.cargandoTotales = true;
    this.directorioService.obtenerTotales(this.codigoCoberturaSeleccionada, this.tipoDocSeleccionado, this.fechaDesde, this.fechaHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.totales = data || {
            totalFacturado: 0,
            cobranzaEfectiva: 0,
            perdidaAsumida: 0,
            deudaNeta: 0,
            cantidadFacturas: 0,
            cantidadComprobantes: 0
          };
          this.cargandoTotales = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar totales:', err);
          this.cargandoTotales = false;
          this.cdr.markForCheck();
        }
      });
  }

  cargarGrupos(): void {
    this.cargandoGrupos = true;
    this.directorioService.obtenerGrupos(this.codigoCoberturaSeleccionada, this.tipoDocSeleccionado, this.fechaDesde, this.fechaHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          const items: DirectorioGrupoFactura[] = Array.isArray(data) ? data : (data?.content || []);
          this.gruposFacturas = items.map(g => ({ ...g, expandido: false }));
          this.cargandoGrupos = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar grupos:', err);
          this.cargandoGrupos = false;
          this.cdr.markForCheck();
        }
      });
  }

  cargarMotivos(): void {
    this.cargandoMotivos = true;
    this.directorioService.obtenerMotivos(
      this.codigoCoberturaSeleccionada,
      this.tipoDocSeleccionado,
      this.fechaDesde,
      this.fechaHasta,
      0,
      1000,
      this.criterioFechaCc
    )
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          const items: DirectorioMotivoDebito[] = Array.isArray(data) ? data : (data?.content || []);
          this.totalElementsMotivos = (data && typeof data.totalElements === 'number') ? data.totalElements : items.length;
          this.motivosDebitoOriginal = items.map((m, idx) => ({
            ...m,
            categoria: this.obtenerCategoriaDeMotivo(m.motivo),
            montoAceptado: m.montoAceptado ?? 0,
            montoRefacturado: m.montoRefacturado ?? 0,
            porcentajeAceptados: m.porcentajeAceptados ?? 0,
            porcentajeRefacturados: m.porcentajeRefacturados ?? 0,
            _originalIndex: idx,
            color: this.paletaColores[idx % this.paletaColores.length]
          }));
          this.totalDebitadoGeneralCalculado = this.motivosDebitoOriginal.reduce((acc, m) => acc + (m.montoTotal || 0), 0);
          this.calcularCategoriasMotivosDisponibles();
          if (this.categoriaMotivoSeleccionada !== 'TODAS' && !this.categoriasMotivoDisponibles.some(c => c.categoria === this.categoriaMotivoSeleccionada)) {
            this.categoriaMotivoSeleccionada = 'TODAS';
          }
          this.aplicarFiltroCategoriaMotivos();
          this.cargandoMotivos = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar motivos:', err);
          this.cargandoMotivos = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleGrupo(grupo: DirectorioGrupoFactura): void {
    grupo.expandido = !grupo.expandido;
  }

  expandirTodos(expandir: boolean): void {
    this.gruposFacturas.forEach(g => g.expandido = expandir);
  }

  // Generación de Arcos SVG para Donut Chart
  calcularSlicesDonut(): void {
    this.slicesDonut = [];
    if (!this.motivosDebito || this.motivosDebito.length === 0) return;

    const radioExterior = 90;
    const radioInterior = 55;
    const centroX = 100;
    const centroY = 100;

    let anguloAcumulado = -90; // Empezar arriba a las 12:00

    this.motivosDebito.forEach((item) => {
      const porcentaje = item.porcentaje || 0;
      if (porcentaje <= 0) return;

      const anguloGiro = (porcentaje / 100) * 360;
      const anguloInicio = anguloAcumulado;
      const anguloFin = anguloAcumulado + (anguloGiro >= 360 ? 359.99 : anguloGiro);
      const anguloMedio = anguloInicio + (anguloGiro / 2);

      const pathData = this.crearPathArcoDonut(centroX, centroY, radioInterior, radioExterior, anguloInicio, anguloFin);

      this.slicesDonut.push({
        motivo: item.motivo,
        montoTotal: item.montoTotal,
        porcentaje: item.porcentaje,
        cantidadCasos: item.cantidadCasos,
        color: item.color || '#38bdf8',
        pathData: pathData,
        middleAngle: anguloMedio
      });

      anguloAcumulado += anguloGiro;
    });
  }

  private crearPathArcoDonut(cx: number, cy: number, rIn: number, rOut: number, angInicioDeg: number, angFinDeg: number): string {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const radIni = toRad(angInicioDeg);
    const radFin = toRad(angFinDeg);

    const xOutIni = cx + rOut * Math.cos(radIni);
    const yOutIni = cy + rOut * Math.sin(radIni);
    const xOutFin = cx + rOut * Math.cos(radFin);
    const yOutFin = cy + rOut * Math.sin(radFin);

    const xInFin = cx + rIn * Math.cos(radFin);
    const yInFin = cy + rIn * Math.sin(radFin);
    const xInIni = cx + rIn * Math.cos(radIni);
    const yInIni = cy + rIn * Math.sin(radIni);

    const arcSweep = (angFinDeg - angInicioDeg) <= 180 ? '0' : '1';

    return [
      `M ${xOutIni} ${yOutIni}`,
      `A ${rOut} ${rOut} 0 ${arcSweep} 1 ${xOutFin} ${yOutFin}`,
      `L ${xInFin} ${yInFin}`,
      `A ${rIn} ${rIn} 0 ${arcSweep} 0 ${xInIni} ${yInIni}`,
      'Z'
    ].join(' ');
  }

  onHoverSector(slice: SliceDonut | null): void {
    this.sectorHover = slice;
  }

  navegarADetalleMotivo(motivo: string): void {
    if (!motivo) return;
    this.router.navigate(['/directorio/motivo', encodeURIComponent(motivo)], {
      queryParams: {
        codigoCobertura: this.codigoCoberturaSeleccionada,
        tipoDoc: this.tipoDocSeleccionado,
        fechaDesde: this.fechaDesde,
        fechaHasta: this.fechaHasta,
        criterioFecha: this.criterioFechaCc,
        solapa: this.solapaActiva
      }
    });
  }

  formatearComprobante(letra?: string, ptovta?: number, numero?: number): string {
    const l = letra ? letra.trim() + ' ' : '';
    const pto = String(ptovta || 0).padStart(4, '0');
    const num = String(numero || 0).padStart(8, '0');
    return `${l}${pto}-${num}`;
  }

  formatearMoneda(valor?: number | null): string {
    if (valor === undefined || valor === null || isNaN(valor)) return '$ 0,00';
    return '$ ' + Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  obtenerClaseTamanoMonto(valor?: number | null): string {
    const texto = this.formatearMoneda(valor);
    const len = texto.length;
    if (len >= 22) return 'kpi-value--xs';
    if (len >= 19) return 'kpi-value--sm';
    if (len >= 17) return 'kpi-value--md';
    return '';
  }

  totalDebitadoGeneralCalculado: number = 0;

  obtenerTotalDebitadoGeneral(): number {
    return this.totalDebitadoGeneralCalculado || (this.motivosDebito || []).reduce((acc, m) => acc + (m.montoTotal || 0), 0);
  }

  // ---------------------------------------------------------------------------
  // Métricas y Contadores - Solapa Motivos de Débito y Refacturación
  // ---------------------------------------------------------------------------

  get totalDebitadoMotivos(): number {
    if (this.categoriaMotivoSeleccionada !== 'TODAS') {
      return (this.motivosDebito || []).reduce((acc, m) => acc + (m.montoTotal || 0), 0);
    }
    return this.obtenerTotalDebitadoGeneral() || 0;
  }

  get totalCasosAfectadosMotivos(): number {
    return (this.motivosDebito || []).reduce((acc, m) => acc + (m.cantidadCasos || 0), 0);
  }

  get totalRefacturadoMotivos(): number {
    return (this.motivosDebito || []).reduce((acc, m) => acc + (m.montoRefacturado || 0), 0);
  }

  get debitoAceptadoPerdidaMotivos(): number {
    return (this.motivosDebito || []).reduce((acc, m) => acc + (m.montoAceptado || 0), 0);
  }

  get diferenciaDebitadoVsRefacturado(): number {
    const deb = Math.round(this.totalDebitadoMotivos);
    const aceptado = Math.round(this.debitoAceptadoPerdidaMotivos);
    const refacturado = Math.round(this.totalRefacturadoMotivos);
    return Math.max(0, deb - (aceptado + refacturado));
  }

  get tasaPerdidaMotivos(): number {
    const deb = Math.round(this.totalDebitadoMotivos);
    if (!deb || deb <= 0) return 0;
    const perdida = Math.round(this.debitoAceptadoPerdidaMotivos);
    return Math.round((perdida / deb) * 1000) / 10;
  }

  get tasaRecuperoMotivos(): number {
    const deb = Math.round(this.totalDebitadoMotivos);
    if (!deb || deb <= 0) return 0;
    const ref = Math.round(this.totalRefacturadoMotivos);
    return Math.round((ref / deb) * 1000) / 10;
  }

  get tasaDiferenciaMotivos(): number {
    const deb = Math.round(this.totalDebitadoMotivos);
    if (!deb || deb <= 0) return 0;
    const p = this.tasaPerdidaMotivos;
    const r = this.tasaRecuperoMotivos;
    return Math.max(0, Math.round((100.0 - (p + r)) * 10) / 10);
  }

  get motivosIdentificadosCount(): number {
    if (this.categoriaMotivoSeleccionada !== 'TODAS') {
      return (this.motivosDebito || []).length;
    }
    return this.totalElementsMotivos || (this.motivosDebito || []).length;
  }

  formatearMontoContador(monto?: number | null): string {
    if (!monto || monto <= 0 || isNaN(monto)) return '$0';
    return '$' + Math.round(monto).toLocaleString('es-AR');
  }

  // ── Clasificación por Categorías para Motivos de Débito ───────────────────
  normalizarTextoMotivo(txt: string): string {
    return normalizarTextoMotivo(txt);
  }

  obtenerCategoriaDeMotivo(motivo: string): string {
    return obtenerCategoriaDeMotivo(motivo);
  }

  calcularCategoriasMotivosDisponibles(): void {
    const countsMap = new Map<string, number>();
    (this.motivosDebitoOriginal || []).forEach(m => {
      const cat = this.obtenerCategoriaDeMotivo(m.motivo);
      countsMap.set(cat, (countsMap.get(cat) || 0) + 1);
    });

    this.categoriasMotivoDisponibles = LISTA_MOTIVOS_DEBITO
      .map(c => ({
        categoria: c.categoria,
        cantidad: countsMap.get(c.categoria) || 0
      }))
      .filter(c => c.cantidad > 0);
  }

  aplicarFiltroCategoriaMotivos(): void {
    if (!this.motivosDebitoOriginal || this.motivosDebitoOriginal.length === 0) {
      this.motivosDebito = [];
      this.slicesDonut = [];
      return;
    }

    let filtrados: DirectorioMotivoDebito[];
    if (this.categoriaMotivoSeleccionada === 'TODAS') {
      filtrados = [...this.motivosDebitoOriginal];
    } else {
      filtrados = this.motivosDebitoOriginal.filter(
        m => this.obtenerCategoriaDeMotivo(m.motivo) === this.categoriaMotivoSeleccionada
      );
    }

    const totalFiltrado = filtrados.reduce((acc, m) => acc + (m.montoTotal || 0), 0);
    this.motivosDebito = filtrados.map((m, idx) => ({
      ...m,
      porcentaje: totalFiltrado > 0 ? Math.round(((m.montoTotal || 0) / totalFiltrado) * 1000) / 10 : 0,
      color: this.paletaColores[idx % this.paletaColores.length]
    }));

    if (this.columnaOrdenMotivos) {
      this.aplicarOrdenMotivos();
    } else {
      this.calcularSlicesDonut();
    }
  }

  onCategoriaMotivoChange(): void {
    this.aplicarFiltroCategoriaMotivos();
    this.renderizarParetoMotivos();
    this.cdr.markForCheck();
  }

  limpiarFiltroCategoriaMotivo(): void {
    this.categoriaMotivoSeleccionada = 'TODAS';
    this.onCategoriaMotivoChange();
  }

  // ---------------------------------------------------------------------------
  // Carga de gráficos Chart.js
  // ---------------------------------------------------------------------------

  private graficosPendientes = 0;

  private iniciarCargaGrafico(): void {
    this.graficosPendientes++;
    this.cargandoGraficos = true;
    this.cdr.markForCheck();
  }

  private finalizarCargaGrafico(): void {
    this.graficosPendientes = Math.max(0, this.graficosPendientes - 1);
    if (this.graficosPendientes === 0) {
      this.cargandoGraficos = false;
    }
    this.cdr.markForCheck();
  }

  cargarGraficos(): void {
    this.cargarDistribucionCartera();
    this.cargarEvolucionMensual();
    this.cargarAgingFinanciero();
    this.cargarParetoMotivos();
  }

  private cargarDistribucionCartera(): void {
    // Si la dona ya fue nutrida directamente por el balance financiero, evitamos la petición duplicada
    if (this.puntosDonut && this.puntosDonut.length > 0 && !this.cargandoBalance) {
      return;
    }
    if (!this.directorioService.getCarteraDonut) return;
    this.iniciarCargaGrafico();
    const codCob = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;
    const tipoDoc = this.tipoDocSeleccionado !== 'TODOS' ? this.tipoDocSeleccionado : undefined;

    this.directorioService.getCarteraDonut(codCob, tipoDoc, this.fechaDesde, this.fechaHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (puntos: PuntoDonutDTO[]) => {
          this.actualizarGraficoDonut(puntos);
          this.finalizarCargaGrafico();
        },
        error: (err) => {
          console.error('Error al cargar distribución de cartera:', err);
          this.finalizarCargaGrafico();
        }
      });
  }

  private actualizarGraficoDonut(puntos: PuntoDonutDTO[]): void {
    this.puntosDonut = puntos || [];
    const labels = (puntos || []).map(p => p.etiqueta);
    const data = (puntos || []).map(p => Number(p.saldo));
    this.distribucionChartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: this.COLORES_DONA.slice(0, labels.length),
        borderColor: '#1e293b',
        borderWidth: 2,
        hoverOffset: 8
      }]
    };
    this.cdr.markForCheck();
  }

  onDistribucionChartClick(e: { event?: any; active?: any[] }): void {
    if (e.active && e.active.length > 0) {
      const activeEl = e.active[0];
      const index = activeEl.index;
      if (index !== undefined) {
        const label = this.distribucionChartData.labels?.[index] as string;
        this.seleccionarInstitucionDesdeGrafico(label, index);
      }
    }
  }

  seleccionarInstitucionDesdeGrafico(etiquetaOcodigo: string, indice?: number): void {
    if (indice !== undefined && this.puntosDonut[indice]) {
      etiquetaOcodigo = this.puntosDonut[indice].etiqueta || etiquetaOcodigo;
    }
    const codigo = this.resolverCodigoCobertura(etiquetaOcodigo);
    if (!codigo) return;

    if (this.codigoCoberturaSeleccionada === codigo) {
      return;
    }

    this.codigoCoberturaSeleccionada = codigo;
    this.aplicarFiltros();
    this.cdr.markForCheck();
  }

  resolverCodigoCobertura(etiqueta: string): string | null {
    if (!etiqueta) return null;

    const etiquetaTrim = etiqueta.trim();

    // 1. Coincidencia directa con código existente
    const cobDirecta = this.coberturas.find(
      c => c.codigo.trim().toLowerCase() === etiquetaTrim.toLowerCase()
    );
    if (cobDirecta) return cobDirecta.codigo;

    // 2. Coincidencia por nombre completo de la cobertura
    const cobPorNombreCompleto = this.coberturas.find(
      c => c.nombre.trim().toLowerCase() === etiquetaTrim.toLowerCase()
    );
    if (cobPorNombreCompleto) return cobPorNombreCompleto.codigo;

    // 3. Extraer código antes del primer guión "COD - Nombre"
    const partes = etiquetaTrim.split(' - ');
    const posibleCodigo = partes[0]?.trim();
    if (posibleCodigo) {
      const cobPorCodigo = this.coberturas.find(
        c => c.codigo.trim().toLowerCase() === posibleCodigo.toLowerCase()
      );
      if (cobPorCodigo) return cobPorCodigo.codigo;
    }

    // 4. Coincidencia por nombre de la cobertura posterior al guión
    const posibleNombre = partes.slice(1).join(' - ').trim();
    if (posibleNombre) {
      const cobPorNombre = this.coberturas.find(
        c => c.nombre.trim().toLowerCase() === posibleNombre.toLowerCase()
      );
      if (cobPorNombre) return cobPorNombre.codigo;
    }

    // 5. Si el código extraído tiene valor y no es 'S/C'
    if (posibleCodigo && posibleCodigo !== 'S/C' && partes.length > 1) {
      return posibleCodigo;
    }

    return null;
  }

  cargarBalanceFinanciero(): void {
    if (!this.directorioService.getBalanceFinanciero) return;
    this.cargandoBalance = true;
    const codCob = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;
    const tipoDoc = this.tipoDocSeleccionado !== 'TODOS' ? this.tipoDocSeleccionado : undefined;

    this.directorioService.getBalanceFinanciero(codCob, tipoDoc, this.fechaDesde, this.fechaHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data: BalanceFinanciadorDTO[]) => {
          this.balanceFinanciadores = (data || []).map((b, idx) => ({
            ...b,
            _originalIndex: idx
          }));
          if (this.columnaOrdenBalance) {
            this.aplicarOrdenBalance();
          }
          this.calcularTotalesBalance();
          // Sincronizar inmediatamente la dona de distribución de cartera con los saldos calculados del balance
          const puntosDonut = (data || [])
            .filter(b => Number(b.saldoPendiente || 0) > 0)
            .map(b => ({
              etiqueta: b.financiador,
              saldo: Number(b.saldoPendiente || 0)
            }));
          this.actualizarGraficoDonut(puntosDonut);
          this.cargandoBalance = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar balance financiero:', err);
          this.actualizarGraficoDonut([]);
          this.cargandoBalance = false;
          this.cdr.markForCheck();
        }
      });
  }

  private calcularTotalesBalance(): void {
    let fac = 0, inc = 0, deb = 0, ref = 0, cob = 0, sal = 0;
    for (const b of this.balanceFinanciadores) {
      fac += Number(b.facturacionFc || 0);
      inc += Number(b.incrementosNd || 0);
      deb += Number(b.debitosNc || 0);
      ref += Number(b.refacturadoNd || 0);
      cob += Number(b.cobradoRc || 0);
      sal += Number(b.saldoPendiente || 0);
    }
    this.totalesBalance = {
      facturacionFc: fac,
      incrementosNd: inc,
      debitosNc: deb,
      refacturadoNd: ref,
      cobradoRc: cob,
      saldoPendiente: sal
    };
  }

  private cargarEvolucionMensual(): void {
    if (!this.directorioService.getEvolucionMensual) return;
    this.cargandoEvolucion = true;
    this.iniciarCargaGrafico();
    const codCob = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;
    const tipoDoc = this.tipoDocSeleccionado !== 'TODOS' ? this.tipoDocSeleccionado : undefined;

    this.directorioService.getEvolucionMensual(codCob, tipoDoc, this.fechaDesde, this.fechaHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (datasets: DatasetGraficoDTO[]) => {
          if (!datasets || datasets.length < 3) {
            this.cargandoEvolucion = false;
            this.finalizarCargaGrafico();
            return;
          }

          // Los datasets llegan: Facturación, Débitos, Refacturación (ND), Cobranzas y Deudas
          const dsFacturacion = datasets.find(d => d.tituloDataset.toLowerCase().includes('factura')) || datasets[0];
          const dsDebitos = datasets.find(d => d.tituloDataset.toLowerCase().includes('débito') || d.tituloDataset.toLowerCase().includes('debito')) || datasets[1];
          const dsRefacturacion = datasets.find(d => d.tituloDataset.toLowerCase().includes('refactura'));
          const dsCobranzas = datasets.find(d => d.tituloDataset.toLowerCase().includes('cobra')) || datasets[Math.min(3, datasets.length - 1)];
          const dsDeudas = datasets.find(d => d.tituloDataset.toLowerCase().includes('deuda'));

          const labels = dsFacturacion.puntos.map(p => p.etiqueta);

          const chartDatasets: any[] = [
            {
              label: 'Facturación',
              data: dsFacturacion.puntos.map(p => Number(p.valor)),
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56,189,248,0.10)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            },
            {
              label: 'Débitos (NC)',
              data: dsDebitos.puntos.map(p => Number(p.valor)),
              borderColor: '#f87171',
              backgroundColor: 'rgba(248,113,113,0.08)',
              fill: false,
              tension: 0.4,
              borderDash: [6, 3],
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            }
          ];

          if (dsRefacturacion) {
            chartDatasets.push({
              label: 'Refacturación (ND)',
              data: dsRefacturacion.puntos.map(p => Number(p.valor)),
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245,158,11,0.08)',
              fill: false,
              tension: 0.4,
              borderDash: [5, 5],
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            });
          }

          chartDatasets.push({
            label: 'Cobranzas (RC)',
            data: dsCobranzas.puntos.map(p => Number(p.valor)),
            borderColor: '#34d399',
            backgroundColor: 'rgba(52,211,153,0.10)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
          });

          if (dsDeudas) {
            chartDatasets.push({
              label: 'Deudas',
              data: dsDeudas.puntos.map(p => Number(p.valor)),
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.08)',
              fill: false,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2.5
            });
          }

          this.evolucionChartData = {
            labels,
            datasets: chartDatasets
          };
          this.cargandoEvolucion = false;
          this.finalizarCargaGrafico();
        },
        error: (err) => {
          console.error('Error al cargar evolución mensual:', err);
          this.cargandoEvolucion = false;
          this.finalizarCargaGrafico();
        }
      });
  }

  private cargarAgingFinanciero(): void {
    if (!this.directorioService.getTiemposCobranza) return;
    this.cargandoTiemposCobranza = true;
    this.iniciarCargaGrafico();
    const codCob = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;
    const tipoDoc = undefined;
    // En Tiempos de Cobranza se consideran las facturas con período desde enero de 2025 en adelante
    const fDesde = (this.fechaDesde && this.fechaDesde >= '2025-01-01') ? this.fechaDesde : '2025-01-01';
    const fHasta = this.fechaHasta || undefined;

    this.directorioService.getTiemposCobranza(codCob, tipoDoc, fDesde, fHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (res: TiemposCobranzaDTO) => {
          this.tiemposCobranzaDatos = res;
          const detalles = res?.detalles ?? [];
          this.agingChartData = {
            labels: detalles.map(d => d.rango),
            datasets: [{
              label: 'Monto',
              data: detalles.map(d => Number(d.saldoEnMora)),
              backgroundColor: detalles.map(d => this.obtenerColorRango(d.rango)),
              borderRadius: 4,
              maxBarThickness: 75
            }]
          };
          this.cargandoTiemposCobranza = false;
          this.finalizarCargaGrafico();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar tiempos de cobranza:', err);
          this.cargandoTiemposCobranza = false;
          this.finalizarCargaGrafico();
          this.cdr.markForCheck();
        }
      });
  }

  private cargarParetoMotivos(): void {
    if (!this.directorioService.getParetoMotivos) return;
    this.iniciarCargaGrafico();
    const codCob = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;
    const tipoDoc = this.tipoDocSeleccionado !== 'TODOS' ? this.tipoDocSeleccionado : undefined;

    this.directorioService.getParetoMotivos(codCob, tipoDoc, this.fechaDesde, this.fechaHasta, this.criterioFechaCc)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (datasets: DatasetGraficoDTO[]) => {
          this.rawDatasetsPareto = datasets || [];
          this.renderizarParetoMotivos();
          this.finalizarCargaGrafico();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar pareto de motivos:', err);
          this.rawDatasetsPareto = [];
          this.renderizarParetoMotivos();
          this.finalizarCargaGrafico();
          this.cdr.markForCheck();
        }
      });
  }

  renderizarParetoMotivos(): void {
    if (this.categoriaMotivoSeleccionada !== 'TODAS') {
      const topItems = (this.motivosDebito || []).slice(0, 10);
      const labels = topItems.map(m => m.motivo);
      const dataRef = topItems.map(m => m.montoRefacturado || 0);
      const dataPer = topItems.map(m => m.montoAceptado || 0);
      const dataDif = topItems.map(m =>
        Math.max(0, Math.round((m.montoTotal || 0) - ((m.montoAceptado || 0) + (m.montoRefacturado || 0))))
      );

      this.motivosChartData = {
        labels,
        datasets: [
          {
            label: 'Refacturado ($)',
            data: dataRef,
            backgroundColor: '#2563eb',
            borderColor: '#1d4ed8',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Pérdida ($)',
            data: dataPer,
            backgroundColor: '#881337',
            borderColor: '#881337',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Diferencia ($)',
            data: dataDif,
            backgroundColor: '#7c3aed',
            borderColor: '#6d28d9',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      };
      return;
    }

    const datasets = this.rawDatasetsPareto;
    if (!datasets || datasets.length === 0 || !datasets[0]?.puntos?.length) {
      this.motivosChartData = {
        labels: [],
        datasets: [
          { label: 'Refacturado ($)', data: [], backgroundColor: '#2563eb', borderColor: '#1d4ed8', borderWidth: 1, borderRadius: 4 },
          { label: 'Pérdida ($)', data: [], backgroundColor: '#881337', borderColor: '#881337', borderWidth: 1, borderRadius: 4 },
          { label: 'Diferencia ($)', data: [], backgroundColor: '#7c3aed', borderColor: '#6d28d9', borderWidth: 1, borderRadius: 4 }
        ]
      };
      return;
    }

    // [0] = Refacturado, [1] = Pérdida, [2] = Diferencia — comparten las mismas etiquetas (motivos)
    const labels = datasets[0].puntos.map(p => p.etiqueta);
    const datasetRef = datasets.find(d => d.tituloDataset?.toLowerCase().includes('refact')) || datasets[0];
    const datasetPer = datasets.find(d => d.tituloDataset?.toLowerCase().includes('pérd') || d.tituloDataset?.toLowerCase().includes('perd')) || (datasets.length > 1 ? datasets[1] : null);
    const datasetDif = datasets.find(d => d.tituloDataset?.toLowerCase().includes('dif')) || (datasets.length > 2 ? datasets[2] : null);

    this.motivosChartData = {
      labels,
      datasets: [
        {
          label: 'Refacturado ($)',
          data: datasetRef?.puntos ? datasetRef.puntos.map(p => Number(p.valor)) : [],
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Pérdida ($)',
          data: datasetPer?.puntos ? datasetPer.puntos.map(p => Number(p.valor)) : [],
          backgroundColor: '#881337',
          borderColor: '#881337',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Diferencia ($)',
          data: datasetDif?.puntos ? datasetDif.puntos.map(p => Number(p.valor)) : [],
          backgroundColor: '#7c3aed',
          borderColor: '#6d28d9',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }

  // ---------------------------------------------------------------------------
  // Cuenta Corriente a 3 Niveles y Recibos No Imputados
  // ---------------------------------------------------------------------------

  subSolapaCc: 'imputados' | 'no-imputados' = 'imputados';

  // ── Selector de criterio de filtrado (Cuenta Corriente / Analistas) ────────
  // En Cuenta Corriente: Período de FC Madre o Fecha de emisión de FC Madre.
  // En Analista de Débito: se suma la opción de Fecha de Análisis de Débito.
  criterioFechaCc: 'periodo' | 'fecha' | 'analisis' = 'periodo';

  // Rango para filtro por Período de la Factura Madre
  private _ccPeriodoDesde: string = '';
  get ccPeriodoDesde(): string {
    return this.criterioFechaCc === 'periodo' ? this.fechaDesde : this._ccPeriodoDesde;
  }
  set ccPeriodoDesde(val: string) {
    this._ccPeriodoDesde = val;
    if (this.criterioFechaCc === 'periodo') {
      this.fechaDesde = val;
    }
  }

  private _ccPeriodoHasta: string = '';
  get ccPeriodoHasta(): string {
    return this.criterioFechaCc === 'periodo' ? this.fechaHasta : this._ccPeriodoHasta;
  }
  set ccPeriodoHasta(val: string) {
    this._ccPeriodoHasta = val;
    if (this.criterioFechaCc === 'periodo') {
      this.fechaHasta = val;
    }
  }

  get periodoMesDesde(): string {
    const f = this.criterioFechaCc === 'periodo' ? this.fechaDesde : this._ccPeriodoDesde;
    return f ? f.substring(0, 7) : '';
  }
  set periodoMesDesde(mes: string) {
    if (!mes) return;
    const primerDia = mes + '-01';
    this._ccPeriodoDesde = primerDia;
    if (this.criterioFechaCc === 'periodo') {
      this.fechaDesde = primerDia;
    }
  }

  get periodoMesHasta(): string {
    const f = this.criterioFechaCc === 'periodo' ? this.fechaHasta : this._ccPeriodoHasta;
    return f ? f.substring(0, 7) : '';
  }
  set periodoMesHasta(mes: string) {
    if (!mes) return;
    const ultimoDia = this.calcularUltimoDiaMes(mes);
    this._ccPeriodoHasta = ultimoDia;
    if (this.criterioFechaCc === 'periodo') {
      this.fechaHasta = ultimoDia;
    }
  }

  calcularUltimoDiaMes(mes: string): string {
    if (!mes) return '';
    const parts = mes.split('-');
    if (parts.length < 2) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(y) || isNaN(m)) return '';
    const ultimoDia = new Date(y, m, 0);
    return this.formatearFechaIso(ultimoDia);
  }

  onPeriodoDesdeChange(): void {
    if (this.periodoMesDesde && this.periodoMesHasta && this.periodoMesDesde > this.periodoMesHasta) {
      this.periodoMesHasta = this.periodoMesDesde;
    }
    this.validarFechas();
    this.cargarCoberturas();
    this.cdr.markForCheck();
  }

  onPeriodoHastaChange(): void {
    if (this.periodoMesDesde && this.periodoMesHasta && this.periodoMesHasta < this.periodoMesDesde) {
      this.periodoMesDesde = this.periodoMesHasta;
    }
    this.validarFechas();
    this.cargarCoberturas();
    this.cdr.markForCheck();
  }

  generarOpcionesPeriodos(): void {
    const NOMBRES_MESES = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    let anioMin = 2024;
    let mesMin = 7;
    if (this.fechaMinimaPermitida) {
      const parts = this.fechaMinimaPermitida.split('-');
      if (parts.length >= 2) {
        anioMin = parseInt(parts[0], 10) || 2024;
        mesMin = parseInt(parts[1], 10) || 1;
      }
    }

    const hoy = new Date();
    let anioMax = hoy.getFullYear();
    if (this.fechaHasta) {
      const anioHasta = parseInt(this.fechaHasta.substring(0, 4), 10);
      if (!isNaN(anioHasta) && anioHasta > anioMax) {
        anioMax = anioHasta;
      }
    }
    const mesMax = 12;

    const items: OpcionPeriodoItem[] = [];

    for (let y = anioMax; y >= anioMin; y--) {
      const mInicio = (y === anioMax) ? mesMax : 12;
      const mFin = (y === anioMin) ? mesMin : 1;

      for (let m = mInicio; m >= mFin; m--) {
        const mStr = String(m).padStart(2, '0');
        const val = y + '-' + mStr;
        const primerDiaIso = val + '-01';
        const ultimoDiaDate = new Date(y, m, 0);
        const ultimoDiaIso = this.formatearFechaIso(ultimoDiaDate);

        items.push({
          value: val,
          label: NOMBRES_MESES[m - 1] + ' ' + y,
          primerDiaIso,
          ultimoDiaIso
        });
      }
    }

    this.opcionesPeriodos = items;
  }

  ccErrorPeriodoDesde: string | null = null;
  ccErrorPeriodoHasta: string | null = null;

  // Rango para filtro por Fecha de emisión de la Factura Madre
  private _ccFechaDesde: string = '';
  get ccFechaDesde(): string {
    return this.criterioFechaCc === 'fecha' ? this.fechaDesde : this._ccFechaDesde;
  }
  set ccFechaDesde(val: string) {
    this._ccFechaDesde = val;
    if (this.criterioFechaCc === 'fecha') {
      this.fechaDesde = val;
    }
  }

  private _ccFechaHasta: string = '';
  get ccFechaHasta(): string {
    return this.criterioFechaCc === 'fecha' ? this.fechaHasta : this._ccFechaHasta;
  }
  set ccFechaHasta(val: string) {
    this._ccFechaHasta = val;
    if (this.criterioFechaCc === 'fecha') {
      this.fechaHasta = val;
    }
  }

  ccErrorFechaDesde: string | null = null;
  ccErrorFechaHasta: string | null = null;

  // Rango para filtro por Fecha de Análisis de Débito
  private _ccAnalisisDesde: string = '';
  get ccAnalisisDesde(): string {
    return this.criterioFechaCc === 'analisis' ? this.fechaDesde : this._ccAnalisisDesde;
  }
  set ccAnalisisDesde(val: string) {
    this._ccAnalisisDesde = val;
    if (this.criterioFechaCc === 'analisis') {
      this.fechaDesde = val;
    }
  }

  private _ccAnalisisHasta: string = '';
  get ccAnalisisHasta(): string {
    return this.criterioFechaCc === 'analisis' ? this.fechaHasta : this._ccAnalisisHasta;
  }
  set ccAnalisisHasta(val: string) {
    this._ccAnalisisHasta = val;
    if (this.criterioFechaCc === 'analisis') {
      this.fechaHasta = val;
    }
  }

  ccErrorAnalisisDesde: string | null = null;
  ccErrorAnalisisHasta: string | null = null;

  cambiarSubSolapaCc(sub: 'imputados' | 'no-imputados'): void {
    if (this.subSolapaCc === sub) return;
    this.subSolapaCc = sub;
    if (sub === 'no-imputados') {
      if (!this.recibosNoImputados || this.recibosNoImputados.length === 0) {
        this.cargarRecibosNoImputados();
      }
    } else {
      if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) {
        this.cargarCuentaCorriente();
      }
    }
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  /** Cambia el criterio de filtrado (periodo/fecha/analisis) y recarga los datos de la solapa activa */
  seleccionarCriterioCc(criterio: 'periodo' | 'fecha' | 'analisis'): void {
    if (this.criterioFechaCc === criterio) return;

    // Guardar el estado actual en el backing field del criterio saliente
    if (this.criterioFechaCc === 'periodo') {
      this._ccPeriodoDesde = this.fechaDesde;
      this._ccPeriodoHasta = this.fechaHasta;
    } else if (this.criterioFechaCc === 'fecha') {
      this._ccFechaDesde = this.fechaDesde;
      this._ccFechaHasta = this.fechaHasta;
    } else if (this.criterioFechaCc === 'analisis') {
      this._ccAnalisisDesde = this.fechaDesde;
      this._ccAnalisisHasta = this.fechaHasta;
    }

    this.criterioFechaCc = criterio;

    // Recuperar fechas del criterio al que pasamos
    const fDesde = criterio === 'fecha'
      ? this._ccFechaDesde
      : (criterio === 'analisis' ? this._ccAnalisisDesde : this._ccPeriodoDesde);
    const fHasta = criterio === 'fecha'
      ? this._ccFechaHasta
      : (criterio === 'analisis' ? this._ccAnalisisHasta : this._ccPeriodoHasta);

    if (fDesde) this.fechaDesde = fDesde;
    if (fHasta) this.fechaHasta = fHasta;
    this.fechaDesdeAplicada = this.fechaDesde;
    this.fechaHastaAplicada = this.fechaHasta;
    this.validarFechas();
    this.solapasCargadas.clear();
    this.cargarDashboard();
    this.cdr.markForCheck();
  }

  /** Getter: si no puede retroceder un mes (según el criterio activo) */
  get noPuedeIrAlMesAnteriorCc(): boolean {
    return this.noPuedeIrAlMesAnterior;
  }

  // ── Recibos No Imputados (Sin asociadogrupo) ──────────────────────────────
  recibosNoImputados: ReciboSinImputarDTO[] = [];
  cargandoRecibosNoImputados: boolean = false;
  busquedaTextoNoImputados: string = '';

  noImputadosPaginaActual: number = 1;
  noImputadosItemsPorPagina: number = 15;
  readonly noImputadosOpcionesItemsPorPagina: number[] = [10, 15, 25, 50];

  columnaOrdenNoImputados: string = '';
  direccionOrdenNoImputados: 'asc' | 'desc' = 'desc';
  pasoOrdenNoImputados: number = 0;
  filtrarFechasNoImputados: boolean = false;

  toggleFiltroFechasNoImputados(): void {
    this.filtrarFechasNoImputados = !this.filtrarFechasNoImputados;
    this.cargarRecibosNoImputados();
  }

  cargarRecibosNoImputados(): void {
    if (!this.directorioService.getRecibosNoImputados) return;
    this.cargandoRecibosNoImputados = true;
    this.noImputadosPaginaActual = 1;
    const financiador = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;
    const fDesde = this.filtrarFechasNoImputados ? (this.fechaDesde || undefined) : undefined;
    const fHasta = this.filtrarFechasNoImputados ? (this.fechaHasta || undefined) : undefined;

    this.directorioService.getRecibosNoImputados(financiador, fDesde, fHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.recibosNoImputados = (data || []).map((r, idx) => ({
            ...r,
            _originalIndex: idx
          }));
          if (this.columnaOrdenNoImputados) {
            this.aplicarOrdenNoImputados();
          }
          this.cargandoRecibosNoImputados = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
        },
        error: (err) => {
          console.error('Error al cargar recibos no imputados:', err);
          this.cargandoRecibosNoImputados = false;
          this.cdr.markForCheck();
        }
      });
  }

  get recibosNoImputadosFiltrados(): ReciboSinImputarDTO[] {
    let lista = this.recibosNoImputados;
    if (this.busquedaTextoNoImputados && this.busquedaTextoNoImputados.trim() !== '') {
      const q = this.busquedaTextoNoImputados.trim().toLowerCase();
      lista = lista.filter(r =>
        (r.comprobante && r.comprobante.toLowerCase().includes(q)) ||
        (r.cobertura && r.cobertura.toLowerCase().includes(q)) ||
        (r.codigoCobertura && r.codigoCobertura.toLowerCase().includes(q)) ||
        (r.tipo && r.tipo.toLowerCase().includes(q)) ||
        (r.numero && String(r.numero).includes(q))
      );
    }
    return lista;
  }

  get totalPaginasNoImputados(): number {
    const total = this.recibosNoImputadosFiltrados.length;
    if (total === 0) return 1;
    return Math.ceil(total / this.noImputadosItemsPorPagina);
  }

  get recibosNoImputadosPaginados(): ReciboSinImputarDTO[] {
    const lista = this.recibosNoImputadosFiltrados;
    if (lista.length === 0) return [];
    if (this.noImputadosPaginaActual > this.totalPaginasNoImputados) {
      this.noImputadosPaginaActual = 1;
    }
    const inicio = (this.noImputadosPaginaActual - 1) * this.noImputadosItemsPorPagina;
    return lista.slice(inicio, inicio + this.noImputadosItemsPorPagina);
  }

  cambiarPaginaNoImputados(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasNoImputados) {
      this.noImputadosPaginaActual = pagina;
      this.cdr.markForCheck();
      this.actualizarAlturasSticky();
    }
  }

  onNoImputadosItemsPorPaginaChange(tamano: any): void {
    this.noImputadosItemsPorPagina = Number(tamano) || 15;
    this.noImputadosPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  get totalMontoNoImputados(): number {
    return this.recibosNoImputadosFiltrados.reduce((acc, r) => acc + (r.importe || r.haber || 0), 0);
  }

  ordenarNoImputados(columna: string): void {
    if (this.columnaOrdenNoImputados === columna) {
      if (this.pasoOrdenNoImputados === 1) {
        this.pasoOrdenNoImputados = 2;
        this.direccionOrdenNoImputados = this.direccionOrdenNoImputados === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenNoImputados();
      } else {
        this.columnaOrdenNoImputados = '';
        this.pasoOrdenNoImputados = 0;
        this.restaurarOrdenNoImputados();
      }
    } else {
      this.columnaOrdenNoImputados = columna;
      this.pasoOrdenNoImputados = 1;
      this.direccionOrdenNoImputados = (columna === 'fecha' || columna === 'importe') ? 'desc' : 'asc';
      this.aplicarOrdenNoImputados();
    }
  }

  aplicarOrdenNoImputados(): void {
    const factor = this.direccionOrdenNoImputados === 'asc' ? 1 : -1;
    const col = this.columnaOrdenNoImputados;

    this.recibosNoImputados.sort((a, b) => {
      switch (col) {
        case 'comprobante':
          return (a.comprobante || '').localeCompare(b.comprobante || '') * factor;
        case 'fecha':
          return ((a.fecha || '').localeCompare(b.fecha || '')) * factor;
        case 'financiador':
          return ((a.cobertura || a.codigoCobertura || '').localeCompare(b.cobertura || b.codigoCobertura || '')) * factor;
        case 'periodo':
          return ((a.periodo || '').localeCompare(b.periodo || '')) * factor;
        case 'importe':
          return ((a.importe || a.haber || 0) - (b.importe || b.haber || 0)) * factor;
        case 'origen':
          return ((a.origen || '').localeCompare(b.origen || '')) * factor;
        default:
          return 0;
      }
    });
    this.recibosNoImputados = [...this.recibosNoImputados];
    this.cdr.markForCheck();
  }

  restaurarOrdenNoImputados(): void {
    this.recibosNoImputados.sort((a, b) => (a._originalIndex ?? 0) - (b._originalIndex ?? 0));
    this.recibosNoImputados = [...this.recibosNoImputados];
    this.cdr.markForCheck();
  }

  cargarCuentaCorriente(): void {
    if (!this.directorioService.getCuentaCorrienteTresNiveles) return;
    this.cargandoCuentaCorriente = true;
    this.ccPaginaActual = 1;
    const financiador = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;

    // Seleccionar el rango de fechas según el criterio activo del selector de CC
    const fDesde = this.criterioFechaCc === 'fecha'
      ? (this.ccFechaDesde || this.fechaDesde || undefined)
      : (this.ccPeriodoDesde || this.fechaDesde || undefined);
    const fHasta = this.criterioFechaCc === 'fecha'
      ? (this.ccFechaHasta || this.fechaHasta || undefined)
      : (this.ccPeriodoHasta || this.fechaHasta || undefined);

    const criterioCc: 'periodo' | 'fecha' = this.criterioFechaCc === 'fecha' ? 'fecha' : 'periodo';
    this.directorioService.getCuentaCorrienteTresNiveles(financiador, undefined, fDesde, fHasta, criterioCc)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const esFiltradoEspecifico = (financiador !== undefined && financiador !== 'TODAS') || (data && data.length === 1);
          this.cuentaCorrienteDatos = (data || []).map((f, idxF) => ({
            ...f,
            _originalIndex: idxF,
            expanded: esFiltradoEspecifico ? true : false,
            periodos: (f.periodos || []).map((p, idxP) => ({
              ...p,
              _originalIndex: idxP,
              expanded: esFiltradoEspecifico ? true : false,
              comprobantes: (p.comprobantes || [])
                .filter((c) => {
                  const t = (c.tipo || '').trim().toUpperCase();
                  return t !== 'OP' && !t.startsWith('OP');
                })
                .map((c, idxC) => ({
                  ...c,
                  _originalIndex: idxC,
                  hijos: (c.hijos || [])
                    .filter((h) => {
                      const t = (h.tipo || '').trim().toUpperCase();
                      return t !== 'OP' && !t.startsWith('OP');
                    })
                    .map((h, idxH) => ({
                      ...h,
                      _originalIndex: idxH
                    }))
                }))
            }))
          }));
          if (this.columnaOrdenCc) {
            this.aplicarOrdenCuentaCorriente();
          }
          this.cargandoCuentaCorriente = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
        },
        error: (err) => {
          console.error('Error al cargar cuenta corriente:', err);
          this.cargandoCuentaCorriente = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleFinanciador(f: CcFinanciadorDTO): void {
    f.expanded = !f.expanded;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  togglePeriodo(p: CcPeriodoDTO): void {
    p.expanded = !p.expanded;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  toggleFactura(fc: CcComprobanteDTO): void {
    fc.expanded = !fc.expanded;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  abrirPrestacionesEnBuscador(item: CcComprobanteDTO, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!item || !item.tienePrestaciones) {
      return;
    }
    const queryParams: Record<string, string | number> = {
      tipo: item.tipo || 'FC',
      letra: item.letra || '',
      puntoVenta: item.ptovta != null ? item.ptovta : '',
      numero: item.numero != null ? item.numero : ''
    };

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/auditoria'], { queryParams })
    );
    window.open(url, '_blank');
  }

  // Paginación Cuenta Corriente (Nivel 1: Financiadores)
  ccPaginaActual: number = 1;
  ccItemsPorPagina: number = 15;
  readonly ccOpcionesItemsPorPagina: number[] = [10, 15, 25, 50];

  get totalPaginasCc(): number {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return 1;
    return Math.ceil(this.cuentaCorrienteDatos.length / this.ccItemsPorPagina);
  }

  get cuentaCorrienteDatosPaginados(): CcFinanciadorDTO[] {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return [];
    if (this.ccPaginaActual > this.totalPaginasCc) {
      this.ccPaginaActual = 1;
    }
    const inicio = (this.ccPaginaActual - 1) * this.ccItemsPorPagina;
    return this.cuentaCorrienteDatos.slice(inicio, inicio + this.ccItemsPorPagina);
  }

  cambiarPaginaCc(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasCc) {
      this.ccPaginaActual = pagina;
      this.cdr.markForCheck();
      this.actualizarAlturasSticky();
    }
  }

  onCcItemsPorPaginaChange(tamano: any): void {
    this.ccItemsPorPagina = Number(tamano) || 15;
    this.ccPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  // ── Totales Consolidados Fila Superior Cuenta Corriente ──────────────────
  get totalFacturacionCc(): number {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return 0;
    return this.cuentaCorrienteDatos.reduce((acc, f) => acc + (f.facturacionFc || 0), 0);
  }

  get totalIncrementosCc(): number {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return 0;
    return this.cuentaCorrienteDatos.reduce((acc, f) => acc + (f.incrementosNd || 0), 0);
  }

  get totalDebitosCc(): number {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return 0;
    return this.cuentaCorrienteDatos.reduce((acc, f) => acc + (f.debitosNc || 0), 0);
  }

  get totalRefacturacionCc(): number {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return 0;
    return this.cuentaCorrienteDatos.reduce((acc, f) => acc + (f.refacturacionNd || 0), 0);
  }

  get totalCobranzasCc(): number {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return 0;
    return this.cuentaCorrienteDatos.reduce((acc, f) => acc + (f.cobranzasRc || 0), 0);
  }

  get totalSaldoCc(): number {
    if (!this.cuentaCorrienteDatos || this.cuentaCorrienteDatos.length === 0) return 0;
    return this.cuentaCorrienteDatos.reduce((acc, f) => acc + (f.saldo || 0), 0);
  }

  expandirTodosCuentaCorriente(expandir: boolean): void {
    const lista = this.cuentaCorrienteDatosPaginados.length > 0 ? this.cuentaCorrienteDatosPaginados : this.cuentaCorrienteDatos;
    lista.forEach(f => {
      f.expanded = expandir;
      f.periodos?.forEach(p => {
        p.expanded = expandir;
        p.comprobantes?.forEach(fc => fc.expanded = expandir);
      });
    });
    this.actualizarAlturasSticky();
  }

  obtenerBadgeClase(tipo: string): string {
    if (!tipo) return 'badge-fc';
    const t = tipo.trim().toUpperCase();
    if (t === 'GRUPO') return 'badge-grupo';
    if (t.startsWith('FC') || t.startsWith('FAC')) return 'badge-fc';
    if (t.startsWith('NC')) return 'badge-nc';
    if (t.startsWith('ND')) return 'badge-nd';
    if (t.startsWith('RC') || t.startsWith('REC')) return 'badge-rc';
    return 'badge-fc';
  }

  formatearNumeroComprobante(comprobante: string): string {
    if (!comprobante) return '';
    return comprobante.replace(/^(FC[A-Z]?|FAC)\s+/i, '');
  }

  formatearNumeroComprobanteNoImputado(r: ReciboSinImputarDTO): string {
    if (!r || !r.comprobante) return '';
    const tipo = (r.tipo || '').trim().toUpperCase();
    let comp = r.comprobante.trim();
    if (tipo && comp.toUpperCase().startsWith(tipo)) {
      comp = comp.substring(tipo.length).trim();
    }
    return comp;
  }

  trackByFinanciador(index: number, item: CcFinanciadorDTO): string { return item.financiador; }
  trackByPeriodo(index: number, item: CcPeriodoDTO): string { return item.periodo; }
  trackByComprobante(index: number, item: CcComprobanteDTO): string { return item.comprobante; }
  trackByNoImputado(index: number, item: ReciboSinImputarDTO): number | string { return item.id || index; }

  // ---------------------------------------------------------------------------
  // Matriz Anual de Recaudación
  // ---------------------------------------------------------------------------

  cargarMatrizRecaudacion(anio?: number): void {
    if (!this.directorioService.getMatrizRecaudacion) return;
    this.cargandoMatriz = true;
    const anioConsulta = anio ?? this.matrizRecaudacion?.anioSeleccionado;
    const financiador = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;

    this.directorioService.getMatrizRecaudacion(anioConsulta, financiador)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data?.filas) {
            data.filas.forEach(f => {
              if (f.codigoFinanciador && !f.financiador.toLowerCase().startsWith(f.codigoFinanciador.toLowerCase() + ' - ') && !f.financiador.toLowerCase().startsWith(f.codigoFinanciador.toLowerCase() + '-')) {
                f.financiador = `${f.codigoFinanciador} - ${f.financiador}`;
              } else if (!f.financiador.includes(' - ')) {
                const cob = this.coberturas.find(c =>
                  c.nombre && f.financiador && (
                    c.nombre.trim().toLowerCase() === f.financiador.trim().toLowerCase()
                  )
                );
                if (cob && cob.codigo && !f.financiador.toLowerCase().startsWith(cob.codigo.toLowerCase())) {
                  f.codigoFinanciador = cob.codigo;
                  f.financiador = `${cob.codigo} - ${f.financiador}`;
                }
              }
            });
          }

          if (data && financiador) {
            const cobObj = this.coberturas.find(c => c.codigo === financiador);

            const normalizar = (txt: string) =>
              (txt || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const fNorm = normalizar(financiador);
            const nomFiltroNorm = normalizar(cobObj ? cobObj.nombre : '');
            const palabrasFiltro = nomFiltroNorm.split(' ').filter(w => w.length > 2);

            // Filtrar filas coincidentes (por código, por nombre completo o por palabras clave)
            const filasFiltradas = (data.filas || []).filter(f => {
              const rowFinNorm = normalizar(f.financiador || '');
              if (!rowFinNorm) return false;
              if (rowFinNorm.includes(fNorm) || (nomFiltroNorm && (rowFinNorm.includes(nomFiltroNorm) || nomFiltroNorm.includes(rowFinNorm)))) {
                return true;
              }
              if (palabrasFiltro.length > 0 && palabrasFiltro.every(palabra => rowFinNorm.includes(palabra))) {
                return true;
              }
              return false;
            });

            // Recalcular siempre totales mensuales y total general para la vista filtrada
            const totalesMes = new Array(12).fill(0);
            let granTotal = 0;
            for (const f of filasFiltradas) {
              granTotal += (f.totalAnual || 0);
              for (let i = 0; i < 12; i++) {
                totalesMes[i] += (f.meses?.[i] || 0);
              }
            }

            data = {
              ...data,
              filas: filasFiltradas.map((f, idx) => ({ ...f, _originalIndex: idx })),
              totalesMes,
              granTotal
            };
          } else {
            data = {
              ...data,
              filas: (data.filas || []).map((f, idx) => ({ ...f, _originalIndex: idx }))
            };
          }

          this.matrizRecaudacion = data;
          if (this.columnaOrdenMatriz) {
            this.aplicarOrdenMatriz();
          }
          this.cargandoMatriz = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
        },
        error: (err) => {
          console.error('Error al cargar matriz de recaudación:', err);
          this.cargandoMatriz = false;
          this.cdr.markForCheck();
        }
      });
  }

  onAnioMatrizChange(nuevoAnio: any): void {
    const anioNum = Number(nuevoAnio);
    if (anioNum) {
      this.cargarMatrizRecaudacion(anioNum);
    }
  }

  trackByMes(index: number, item: number): number {
    return index;
  }

  trackByFinanciadorFila(index: number, item: MatrizRecaudacionFilaDTO): string {
    return item.financiador;
  }

  // ---------------------------------------------------------------------------
  // Detalle y Trazabilidad (Árbol Encadenado)
  // ---------------------------------------------------------------------------

  cargarTrazabilidad(forzarConFiltrosFactura: boolean = false): void {
    if (!this.directorioService.getTrazabilidad) return;
    this.cargandoTrazabilidad = true;
    const financiador = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;

    const ptovtaParam = (forzarConFiltrosFactura && this.filtroTrazabilidadPtoVta && this.filtroTrazabilidadPtoVta !== 'TODOS')
      ? Number(this.filtroTrazabilidadPtoVta)
      : undefined;
    const letraParam = (forzarConFiltrosFactura && this.filtroTrazabilidadLetra && this.filtroTrazabilidadLetra.trim() !== '')
      ? this.filtroTrazabilidadLetra.trim().toUpperCase()
      : undefined;
    const numLimpio = (this.filtroTrazabilidadNumero || '').trim().replace(/^0+/, '');
    const numeroParam = (forzarConFiltrosFactura && numLimpio !== '' && /^\d+$/.test(numLimpio))
      ? Number(numLimpio)
      : undefined;

    const usaParametrosFactura = ptovtaParam !== undefined || letraParam !== undefined || numeroParam !== undefined;
    this.trazabilidadBusquedaRemotaActiva = usaParametrosFactura;
    if (!usaParametrosFactura) {
      this.ultimoKeyRemotoTrazabilidad = '';
    }

    const request$ = usaParametrosFactura
      ? this.directorioService.getTrazabilidad(
          financiador, undefined, undefined, this.fechaDesde, this.fechaHasta,
          ptovtaParam, letraParam, numeroParam
        )
      : this.directorioService.getTrazabilidad(financiador, undefined, undefined, this.fechaDesde, this.fechaHasta);

    request$
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const lista = (data || []).map((c, idx) => ({
            ...c,
            _originalIndex: idx,
            expanded: false
          }));
          if (lista.length === 1 && this.tieneFiltrosFacturaTrazabilidad) {
            lista[0].expanded = true;
          }
          this.trazabilidadDatos = lista;
          this.trazabilidadPaginaActual = 1;
          if (this.columnaOrdenTrazabilidad) {
            this.aplicarOrdenTrazabilidad();
          }
          this.cargandoTrazabilidad = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
        },
        error: (err) => {
          console.error('Error al cargar trazabilidad:', err);
          this.cargandoTrazabilidad = false;
          this.cdr.markForCheck();
        }
      });
  }

  get tieneFiltrosFacturaTrazabilidad(): boolean {
    return (this.filtroTrazabilidadLetra || '').trim() !== '' ||
      (!!this.filtroTrazabilidadPtoVta && this.filtroTrazabilidadPtoVta !== 'TODOS') ||
      (this.filtroTrazabilidadNumero || '').trim() !== '';
  }

  extraerDatosFacturaTrazabilidad(idPrestacion: string): { letra: string; ptovta: number | null; numeroStr: string } {
    const raw = (idPrestacion || '').trim().toUpperCase();
    // Formatos habituales: "FAC A0030-00005364", "FCE B0031-31052026", "FC A-0030-00005364"
    const m = raw.match(/^(?:[A-Z]+\s+)?([A-Z])[- ]?0*(\d+)[- ]0*(\d+)$/);
    if (m) {
      const letra = m[1];
      const ptovta = parseInt(m[2], 10);
      const numeroStr = m[3].replace(/^0+/, '') || '0';
      return {
        letra,
        ptovta: isNaN(ptovta) ? null : ptovta,
        numeroStr
      };
    }
    return { letra: '', ptovta: null, numeroStr: raw.replace(/^0+/, '') };
  }

  get trazabilidadFiltrada(): CadenaTrazabilidadDTO[] {
    if (!this.trazabilidadDatos || this.trazabilidadDatos.length === 0) return [];
    if (!this.tieneFiltrosFacturaTrazabilidad) {
      return this.trazabilidadDatos;
    }

    const letraBuscada = (this.filtroTrazabilidadLetra || '').trim().toUpperCase();
    const ptoVtaBuscado = (this.filtroTrazabilidadPtoVta && this.filtroTrazabilidadPtoVta !== 'TODOS')
      ? parseInt(this.filtroTrazabilidadPtoVta, 10)
      : null;
    const numBuscadoRaw = (this.filtroTrazabilidadNumero || '').trim();
    const numBuscadoSinCeros = numBuscadoRaw.replace(/^0+/, '') || (numBuscadoRaw ? '0' : '');

    const filtrados = this.trazabilidadDatos.filter(cadena => {
      const info = this.extraerDatosFacturaTrazabilidad(cadena.idPrestacion);
      if (letraBuscada && info.letra !== letraBuscada) {
        return false;
      }
      if (ptoVtaBuscado !== null && !isNaN(ptoVtaBuscado) && info.ptovta !== ptoVtaBuscado) {
        return false;
      }
      if (numBuscadoSinCeros) {
        if (info.numeroStr !== numBuscadoSinCeros && !info.numeroStr.includes(numBuscadoSinCeros)) {
          return false;
        }
      }
      return true;
    });

    if (filtrados.length === 1) {
      filtrados[0].expanded = true;
    }
    return filtrados;
  }

  onInputLetraTrazabilidad(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = (input.value || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1);
    input.value = limpio;
    this.filtroTrazabilidadLetra = limpio;
    this.onFiltroTrazabilidadChange();
  }

  onInputNumeroTrazabilidad(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = (input.value || '').replace(/[^0-9]/g, '');
    input.value = limpio;
    this.filtroTrazabilidadNumero = limpio;
    this.onFiltroTrazabilidadChange();
  }

  onFiltroTrazabilidadChange(): void {
    this.trazabilidadPaginaActual = 1;
    // Si todos los filtros se vaciaron y veníamos de una búsqueda remota puntual, restaurar el lote general
    if (!this.tieneFiltrosFacturaTrazabilidad && this.trazabilidadBusquedaRemotaActiva) {
      this.cargarTrazabilidad(false);
      return;
    }
    // Opción C (Híbrida): si hay filtros activos y en memoria no hay coincidencias dentro de los 500 cargados,
    // disparar automáticamente la consulta al backend para esa combinación.
    if (this.tieneFiltrosFacturaTrazabilidad && this.trazabilidadFiltrada.length === 0 && !this.cargandoTrazabilidad) {
      const key = `${(this.filtroTrazabilidadLetra || '').trim().toUpperCase()}|${this.filtroTrazabilidadPtoVta}|${(this.filtroTrazabilidadNumero || '').trim().replace(/^0+/, '')}`;
      if (key !== this.ultimoKeyRemotoTrazabilidad) {
        this.ultimoKeyRemotoTrazabilidad = key;
        this.cargarTrazabilidad(true);
        return;
      }
    }
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  buscarTrazabilidadFactura(): void {
    if (!this.tieneFiltrosFacturaTrazabilidad) {
      if (this.trazabilidadBusquedaRemotaActiva) {
        this.cargarTrazabilidad(false);
      }
      return;
    }
    const key = `${(this.filtroTrazabilidadLetra || '').trim().toUpperCase()}|${this.filtroTrazabilidadPtoVta}|${(this.filtroTrazabilidadNumero || '').trim().replace(/^0+/, '')}`;
    this.ultimoKeyRemotoTrazabilidad = key;
    this.cargarTrazabilidad(true);
  }

  limpiarFiltrosTrazabilidad(): void {
    this.filtroTrazabilidadLetra = '';
    this.filtroTrazabilidadPtoVta = 'TODOS';
    this.filtroTrazabilidadNumero = '';
    this.trazabilidadPaginaActual = 1;
    if (this.trazabilidadBusquedaRemotaActiva) {
      this.cargarTrazabilidad(false);
    } else {
      this.cdr.markForCheck();
      this.actualizarAlturasSticky();
    }
  }

  get totalPaginasTrazabilidad(): number {
    const lista = this.trazabilidadFiltrada;
    if (!lista || lista.length === 0) return 1;
    return Math.ceil(lista.length / this.trazabilidadItemsPorPagina);
  }

  get trazabilidadDatosPaginados(): CadenaTrazabilidadDTO[] {
    const lista = this.trazabilidadFiltrada;
    if (!lista || lista.length === 0) return [];
    const inicio = (this.trazabilidadPaginaActual - 1) * this.trazabilidadItemsPorPagina;
    return lista.slice(inicio, inicio + this.trazabilidadItemsPorPagina);
  }

  cambiarPaginaTrazabilidad(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasTrazabilidad) {
      this.trazabilidadPaginaActual = pagina;
      this.cdr.markForCheck();
      this.actualizarAlturasSticky();
    }
  }

  onTrazabilidadItemsPorPaginaChange(tamano: any): void {
    this.trazabilidadItemsPorPagina = Number(tamano) || 25;
    this.trazabilidadPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  toggleCadena(cadena: CadenaTrazabilidadDTO): void {
    cadena.expanded = !cadena.expanded;
    this.actualizarAlturasSticky();
  }

  togglePrestacion(prestacion: BuclePrestacionDTO, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    prestacion.expanded = !prestacion.expanded;
    this.actualizarAlturasSticky();
  }

  trackByCadena(index: number, item: CadenaTrazabilidadDTO): string {
    return item.idPrestacion;
  }

  trackByPrestacion(index: number, item: BuclePrestacionDTO): any {
    return item.id ?? item.codigo ?? index;
  }

  trackByEvento(index: number, item: EventoTrazabilidadDTO): string {
    return item.comprobante;
  }

  obtenerClaseNodo(tipo: string): string {
    if (!tipo) return 'bg-primary';
    const t = tipo.trim().toUpperCase();
    if (t.startsWith('FC') || t.startsWith('FAC')) return 'bg-primary';
    if (t.startsWith('NC')) return 'bg-danger';
    if (t.startsWith('ND')) return 'bg-warning';
    if (t.startsWith('RC') || t.startsWith('REC') || t.startsWith('OP')) return 'bg-success';
    return 'bg-primary';
  }

  obtenerClaseMonto(tipo: string): string {
    if (!tipo) return 'color-facturado';
    const t = tipo.trim().toUpperCase();
    if (t.startsWith('FC') || t.startsWith('FAC')) return 'color-facturado';
    if (t.startsWith('NC')) return 'color-aceptado';
    if (t.startsWith('ND')) return 'color-refacturado';
    if (t.startsWith('RC') || t.startsWith('REC')) return 'color-cobranza';
    return 'color-facturado';
  }

  // ---------------------------------------------------------------------------
  // Bucles de Insistencia
  // ---------------------------------------------------------------------------

  precargarBucles(): void {
    if (!this.directorioService.getBuclesInsistencia) return;
    this.directorioService.getBuclesInsistencia(undefined, undefined, undefined, this.fechaDesde, this.fechaHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const chains = (data || []).map(c => ({
            ...c,
            expanded: false,
            prestaciones: (c.prestaciones || []).map(p => ({
              ...p,
              expanded: (c.prestaciones?.length === 1)
            }))
          }));
          this.buclesTodos = chains;
          this.actualizarCoberturasBucles(chains);
          if (this.solapaActiva === 'bucles') {
            this.filtrarBuclesLocales();
          }
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error al precargar bucles de insistencia:', err)
      });
  }

  actualizarCoberturasBucles(cadenas: CadenaTrazabilidadDTO[]): void {
    const fDesde = this.fechaDesde ? this.fechaDesde.trim() : '';
    const fHasta = this.fechaHasta ? this.fechaHasta.trim() : '';

    const cadenasEnRango = cadenas.filter(c => {
      const fechaFac = c.fechaFactura || (c.historialEventos && c.historialEventos.length > 0 ? c.historialEventos[0].fecha : '');
      if (fechaFac) {
        if (fDesde && fechaFac < fDesde) return false;
        if (fHasta && fechaFac > fHasta) return false;
      }
      return true;
    });

    const mapa = new Map<string, DirectorioCobertura>();
    for (const c of cadenasEnRango) {
      let codigo = c.codigoCobertura?.trim();
      let nombre = '';

      if (!codigo && c.financiador) {
        const parts = c.financiador.split(' - ');
        if (parts.length > 1) {
          codigo = parts[0].trim();
          nombre = parts.slice(1).join(' - ').trim();
        } else {
          codigo = c.financiador.trim();
          nombre = c.financiador.trim();
        }
      }

      if (codigo) {
        // Asociar con el nombre oficial si ya cargó this.coberturas
        const cobOficial = this.coberturas.find(cob => cob.codigo === codigo);
        if (cobOficial) {
          mapa.set(codigo, { codigo: cobOficial.codigo, nombre: cobOficial.nombre });
        } else {
          if (!nombre) {
            nombre = c.financiador ? c.financiador.replace(new RegExp(`^${codigo}\\s*-\\s*`), '').trim() : codigo;
          }
          mapa.set(codigo, { codigo, nombre: nombre || codigo });
        }
      }
    }
    this.coberturasBucles = Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (this.solapaActiva === 'bucles' && this.codigoCoberturaSeleccionada !== 'TODAS') {
      if (!this.coberturasBucles.some(c => c.codigo === this.codigoCoberturaSeleccionada)) {
        this.codigoCoberturaSeleccionada = 'TODAS';
      }
    }
  }

  extraerCodigoDeFinanciador(financiador?: string): string {
    if (!financiador) return '';
    const parts = financiador.split(' - ');
    return parts[0].trim();
  }

  filtrarBuclesLocales(): void {
    const fDesde = this.fechaDesde ? this.fechaDesde.trim() : '';
    const fHasta = this.fechaHasta ? this.fechaHasta.trim() : '';
    const codFiltro = (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS')
      ? this.codigoCoberturaSeleccionada.trim().toLowerCase()
      : null;

    this.buclesDatos = this.buclesTodos.filter(b => {
      // 1. Filtro por Rango de Fecha de la factura origen
      const fechaFac = b.fechaFactura || (b.historialEventos && b.historialEventos.length > 0 ? b.historialEventos[0].fecha : '');
      if (fechaFac) {
        if (fDesde && fechaFac < fDesde) return false;
        if (fHasta && fechaFac > fHasta) return false;
      }

      // 2. Filtro por Institución / Cobertura
      if (codFiltro) {
        const cod = (b.codigoCobertura || this.extraerCodigoDeFinanciador(b.financiador) || '').trim().toLowerCase();
        const fin = (b.financiador || '').toLowerCase();
        if (cod !== codFiltro && !fin.includes(codFiltro)) {
          return false;
        }
      }

      return true;
    });

    this.buclesPaginaActual = 1;
    if (this.columnaOrdenBucles) {
      this.aplicarOrdenBucles();
    }
  }

  // Paginación Bucles de Insistencia
  buclesPaginaActual: number = 1;
  buclesItemsPorPagina: number = 25;
  readonly buclesOpcionesItemsPorPagina: number[] = [15, 25, 50, 100];

  get totalPaginasBucles(): number {
    if (!this.buclesDatos || this.buclesDatos.length === 0) return 1;
    return Math.ceil(this.buclesDatos.length / this.buclesItemsPorPagina);
  }

  get buclesDatosPaginados(): CadenaTrazabilidadDTO[] {
    if (!this.buclesDatos || this.buclesDatos.length === 0) return [];
    const inicio = (this.buclesPaginaActual - 1) * this.buclesItemsPorPagina;
    return this.buclesDatos.slice(inicio, inicio + this.buclesItemsPorPagina);
  }

  cambiarPaginaBucles(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasBucles) {
      this.buclesPaginaActual = pagina;
      this.cdr.markForCheck();
      this.actualizarAlturasSticky();
    }
  }

  onBuclesItemsPorPaginaChange(tamano: any): void {
    this.buclesItemsPorPagina = Number(tamano) || 25;
    this.buclesPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  cargarBucles(): void {
    if (!this.directorioService.getBuclesInsistencia) return;
    this.cargandoBucles = true;
    const codCob = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;

    this.directorioService.getBuclesInsistencia(codCob, undefined, undefined, this.fechaDesde, this.fechaHasta)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const chains = (data || []).map((c, idx) => ({
            ...c,
            _originalIndex: idx,
            expanded: false,
            prestaciones: (c.prestaciones || []).map(p => ({
              ...p,
              expanded: false
            }))
          }));
          this.buclesTodos = chains;
          this.actualizarCoberturasBucles(chains);
          this.filtrarBuclesLocales();
          this.buclesPaginaActual = 1;
          this.cargandoBucles = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
        },
        error: (err) => {
          console.error('Error al cargar bucles de insistencia:', err);
          this.cargandoBucles = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ---------------------------------------------------------------------------
  // Desempeño Operativo a 3 Niveles (Analistas, Médicos, Operadores)
  // ---------------------------------------------------------------------------

  cargarAnalistas(): void {
    if (!this.directorioService.getDesempenoAnalistas) {
      this.cargarDesempenoOperativo();
      return;
    }
    this.cargandoAnalistas = true;
    const periodo = (this.fechaDesde && this.fechaDesde.length >= 7) ? this.fechaDesde.substring(0, 7) : undefined;

    this.directorioService.getDesempenoAnalistas(periodo, this.fechaDesde, this.fechaHasta, this.criterioFechaCc)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (analistas) => {
          this.analistasDatos = (analistas || []).map((a, idxA) => {
            const distinctFins = new Set<string>();
            (a.motivos || []).forEach(m => (m.financiadores || []).forEach(f => {
              if (f.financiador) distinctFins.add(f.financiador);
            }));
            const totalMontoA = a.totalTramitado || (a.debitosAceptados + a.debitosRefacturados) || 0;
            const difA = totalMontoA - ((a.debitosAceptados || 0) + (a.debitosRefacturados || 0));
            return {
              ...a,
              _originalIndex: idxA,
              expanded: false,
              cantidadFinanciadores: distinctFins.size,
              diferencia: difA,
              motivos: (a.motivos || []).map((m, idxM) => {
                const montoM = m.montoDebitado || 0;
                const difM = montoM - ((m.aceptado || 0) + (m.refacturado || 0));
                return {
                  ...m,
                  _originalIndex: idxM,
                  expanded: false,
                  diferencia: difM,
                  financiadores: (m.financiadores || []).map((f, idxF) => {
                    const montoF = (f.montoDebitado != null ? f.montoDebitado : f.monto) || 0;
                    const difF = montoF - ((f.aceptado || 0) + (f.refacturado || 0));
                    return {
                      ...f,
                      _originalIndex: idxF,
                      diferencia: difF
                    };
                  })
                };
              })
            };
          });

          if (this.filtroAnalistaSeleccionado !== 'TODOS' &&
            !this.analistasDatos.some(a => a.analista === this.filtroAnalistaSeleccionado)) {
            this.filtroAnalistaSeleccionado = 'TODOS';
          }

          if (this.columnaOrdenAnalista) {
            this.aplicarOrdenAnalistas();
          }
          if (this.columnaOrdenMotivoAnalista) {
            this.aplicarOrdenMotivosAnalistas();
          }

          this.cargandoAnalistas = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
          setTimeout(() => this.actualizarAlturasSticky(), 80);
        },
        error: (err) => {
          console.error('Error al cargar analistas de débito:', err);
          this.cargandoAnalistas = false;
          this.cdr.markForCheck();
        }
      });
  }

  cambiarTipoRegistroOperador(tipo: 'Ambulatorios' | 'Internados' | 'Todos'): void {
    if (this.tipoRegistroOperador === tipo) return;
    this.tipoRegistroOperador = tipo;
    this.operadoresPaginaActual = 1;
    this.cargarOperadores();
  }

  cargarOperadores(): void {
    if (!this.directorioService.getDesempenoOperadores) {
      this.cargarDesempenoOperativo();
      return;
    }
    this.cargandoOperadores = true;
    const periodo = (this.fechaDesde && this.fechaDesde.length >= 7) ? this.fechaDesde.substring(0, 7) : undefined;

    this.directorioService.getDesempenoOperadores(periodo, this.fechaDesde, this.fechaHasta, this.criterioFechaCc, this.tipoRegistroOperador)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (operadores) => {
          this.operadoresDatos = (operadores || []).map((op, idxOp) => {
            const totalMontoOp = op.totalTramitado || (op.debitosAceptados + op.debitosRefacturados) || 0;
            const difOp = totalMontoOp - ((op.debitosAceptados || 0) + (op.debitosRefacturados || 0));
            return {
              ...op,
              _originalIndex: idxOp,
              expanded: false,
              diferencia: difOp,
              motivos: (op.motivos || []).map((m, idxM) => {
                const montoM = m.montoDebitado || 0;
                const difM = montoM - ((m.aceptado || 0) + (m.refacturado || 0));
                return {
                  ...m,
                  _originalIndex: idxM,
                  expanded: false,
                  diferencia: difM,
                  financiadores: (m.financiadores || []).map((f, idxF) => {
                    const montoF = (f.montoDebitado != null ? f.montoDebitado : f.monto) || 0;
                    const difF = montoF - ((f.aceptado || 0) + (f.refacturado || 0));
                    return {
                      ...f,
                      _originalIndex: idxF,
                      diferencia: difF
                    };
                  })
                };
              })
            };
          });

          if (this.columnaOrdenOperador) {
            this.aplicarOrdenOperadores();
          }

          if (this.filtroOperadorSeleccionado !== 'TODOS' &&
            !this.operadoresDatos.some(o => o.operador === this.filtroOperadorSeleccionado)) {
            this.filtroOperadorSeleccionado = 'TODOS';
          }
          this.operadoresPaginaActual = 1;

          this.cargandoOperadores = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
          setTimeout(() => this.actualizarAlturasSticky(), 80);
        },
        error: (err) => {
          console.error('Error al cargar operadores de carga:', err);
          this.cargandoOperadores = false;
          this.cdr.markForCheck();
        }
      });
  }

  cargarMedicos(): void {
    if (!this.directorioService.getDesempenoMedicos) {
      this.cargarDesempenoOperativo();
      return;
    }
    this.cargandoMedicos = true;
    const periodo = (this.fechaDesde && this.fechaDesde.length >= 7) ? this.fechaDesde.substring(0, 7) : undefined;

    this.directorioService.getDesempenoMedicos(periodo, this.fechaDesde, this.fechaHasta, this.criterioFechaCc)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (medicos) => {
          this.medicosDatos = (medicos || []).map((med, idxMed) => {
            const totalMontoMed = med.totalTramitado || (med.debitosAceptados + med.debitosRefacturados) || 0;
            const difMed = totalMontoMed - ((med.debitosAceptados || 0) + (med.debitosRefacturados || 0));
            return {
              ...med,
              _originalIndex: idxMed,
              expanded: false,
              diferencia: difMed,
              motivos: (med.motivos || []).map((m, idxM) => {
                const montoM = m.montoDebitado || 0;
                const difM = montoM - ((m.aceptado || 0) + (m.refacturado || 0));
                return {
                  ...m,
                  _originalIndex: idxM,
                  expanded: false,
                  diferencia: difM,
                  financiadores: (m.financiadores || []).map((f, idxF) => {
                    const montoF = (f.montoDebitado != null ? f.montoDebitado : f.monto) || 0;
                    const difF = montoF - ((f.aceptado || 0) + (f.refacturado || 0));
                    return {
                      ...f,
                      _originalIndex: idxF,
                      diferencia: difF
                    };
                  })
                };
              })
            };
          });

          if (this.columnaOrdenMedico) {
            this.aplicarOrdenMedicos();
          }

          if (this.filtroMedicoSeleccionado !== 'TODOS' &&
            !this.medicosDatos.some(m => m.medico === this.filtroMedicoSeleccionado)) {
            this.filtroMedicoSeleccionado = 'TODOS';
          }

          this.cargandoMedicos = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
        },
        error: (err) => {
          console.error('Error al cargar médicos:', err);
          this.cargandoMedicos = false;
          this.cdr.markForCheck();
        }
      });
  }

  cargarDesempenoOperativo(): void {
    if (!this.directorioService.getDesempenoGlobal) return;
    this.cargandoAnalistas = true;
    this.cargandoMedicos = true;
    this.cargandoOperadores = true;
    const periodo = (this.fechaDesde && this.fechaDesde.length >= 7) ? this.fechaDesde.substring(0, 7) : undefined;

    this.directorioService.getDesempenoGlobal(periodo, this.fechaDesde, this.fechaHasta, this.criterioFechaCc)
      .pipe(takeUntil(this.cancelarPeticionesEnVuelo$), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analistasDatos = (data?.analistas || []).map((a, idxA) => {
            const distinctFins = new Set<string>();
            (a.motivos || []).forEach(m => (m.financiadores || []).forEach(f => {
              if (f.financiador) distinctFins.add(f.financiador);
            }));
            const totalMontoA = a.totalTramitado || (a.debitosAceptados + a.debitosRefacturados) || 0;
            const difA = totalMontoA - ((a.debitosAceptados || 0) + (a.debitosRefacturados || 0));
            return {
              ...a,
              _originalIndex: idxA,
              expanded: false,
              cantidadFinanciadores: distinctFins.size,
              diferencia: difA,
              motivos: (a.motivos || []).map((m, idxM) => {
                const montoM = m.montoDebitado || 0;
                const difM = montoM - ((m.aceptado || 0) + (m.refacturado || 0));
                return {
                  ...m,
                  _originalIndex: idxM,
                  expanded: false,
                  diferencia: difM,
                  financiadores: (m.financiadores || []).map((f, idxF) => {
                    const montoF = (f.montoDebitado != null ? f.montoDebitado : f.monto) || 0;
                    const difF = montoF - ((f.aceptado || 0) + (f.refacturado || 0));
                    return {
                      ...f,
                      _originalIndex: idxF,
                      diferencia: difF
                    };
                  })
                };
              })
            };
          });

          if (this.filtroAnalistaSeleccionado !== 'TODOS' &&
            !this.analistasDatos.some(a => a.analista === this.filtroAnalistaSeleccionado)) {
            this.filtroAnalistaSeleccionado = 'TODOS';
          }

          if (this.columnaOrdenAnalista) {
            this.aplicarOrdenAnalistas();
          }
          if (this.columnaOrdenMotivoAnalista) {
            this.aplicarOrdenMotivosAnalistas();
          }

          this.medicosDatos = (data?.medicos || []).map((med, idxMed) => {
            const totalMontoMed = med.totalTramitado || (med.debitosAceptados + med.debitosRefacturados) || 0;
            const difMed = totalMontoMed - ((med.debitosAceptados || 0) + (med.debitosRefacturados || 0));
            return {
              ...med,
              _originalIndex: idxMed,
              expanded: false,
              diferencia: difMed,
              motivos: (med.motivos || []).map((m, idxM) => {
                const montoM = m.montoDebitado || 0;
                const difM = montoM - ((m.aceptado || 0) + (m.refacturado || 0));
                return {
                  ...m,
                  _originalIndex: idxM,
                  expanded: false,
                  diferencia: difM,
                  financiadores: (m.financiadores || []).map((f, idxF) => {
                    const montoF = (f.montoDebitado != null ? f.montoDebitado : f.monto) || 0;
                    const difF = montoF - ((f.aceptado || 0) + (f.refacturado || 0));
                    return {
                      ...f,
                      _originalIndex: idxF,
                      diferencia: difF
                    };
                  })
                };
              })
            };
          });

          if (this.columnaOrdenMedico) {
            this.aplicarOrdenMedicos();
          }

          if (this.filtroMedicoSeleccionado !== 'TODOS' &&
            !this.medicosDatos.some(m => m.medico === this.filtroMedicoSeleccionado)) {
            this.filtroMedicoSeleccionado = 'TODOS';
          }

          this.operadoresDatos = (data?.operadores || []).map((op, idxOp) => {
            const totalMontoOp = op.totalTramitado || (op.debitosAceptados + op.debitosRefacturados) || 0;
            const difOp = totalMontoOp - ((op.debitosAceptados || 0) + (op.debitosRefacturados || 0));
            return {
              ...op,
              _originalIndex: idxOp,
              expanded: false,
              diferencia: difOp,
              motivos: (op.motivos || []).map((m, idxM) => {
                const montoM = m.montoDebitado || 0;
                const difM = montoM - ((m.aceptado || 0) + (m.refacturado || 0));
                return {
                  ...m,
                  _originalIndex: idxM,
                  expanded: false,
                  diferencia: difM,
                  financiadores: (m.financiadores || []).map((f, idxF) => {
                    const montoF = (f.montoDebitado != null ? f.montoDebitado : f.monto) || 0;
                    const difF = montoF - ((f.aceptado || 0) + (f.refacturado || 0));
                    return {
                      ...f,
                      _originalIndex: idxF,
                      diferencia: difF
                    };
                  })
                };
              })
            };
          });

          if (this.columnaOrdenOperador) {
            this.aplicarOrdenOperadores();
          }

          this.cargandoAnalistas = false;
          this.cargandoMedicos = false;
          this.cargandoOperadores = false;
          this.cdr.markForCheck();
          this.actualizarAlturasSticky();
        },
        error: (err) => {
          console.error('Error al cargar desempeño operativo global:', err);
          this.cargandoAnalistas = false;
          this.cargandoMedicos = false;
          this.cargandoOperadores = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleAnalista(analista: MetricaAnalistaDTO): void {
    analista.expanded = !analista.expanded;
    this.actualizarAlturasSticky();
  }

  get listaNombresAnalistas(): string[] {
    const nombres = this.analistasDatos
      .map(a => a.analista)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b));
  }

  get analistasFiltrados(): MetricaAnalistaDTO[] {
    if (!this.filtroAnalistaSeleccionado || this.filtroAnalistaSeleccionado === 'TODOS') {
      return this.analistasDatos;
    }
    return this.analistasDatos.filter(a => a.analista === this.filtroAnalistaSeleccionado);
  }

  limpiarFiltroAnalista(): void {
    this.filtroAnalistaSeleccionado = 'TODOS';
  }

  // ── Totales Consolidados Fila Fija Analistas ──────────────────────────────
  get totalCasosAnalistas(): number {
    return (this.analistasFiltrados || []).reduce((acc, a) => acc + (a.cantidadRegistros || 0), 0);
  }

  get totalFinanciadoresAnalistas(): number {
    return (this.analistasFiltrados || []).reduce((acc, a) => acc + (a.cantidadFinanciadores || 0), 0);
  }

  get totalMontoDebitadoAnalistas(): number {
    return (this.analistasFiltrados || []).reduce((acc, a) =>
      acc + (a.totalTramitado || (a.debitosAceptados + a.debitosRefacturados) || 0), 0);
  }

  get totalAceptadosAnalistas(): number {
    return (this.analistasFiltrados || []).reduce((acc, a) => acc + (a.debitosAceptados || 0), 0);
  }

  get totalRefacturadosAnalistas(): number {
    return (this.analistasFiltrados || []).reduce((acc, a) => acc + (a.debitosRefacturados || 0), 0);
  }

  get totalDiferenciaAnalistas(): number {
    return (this.analistasFiltrados || []).reduce((acc, a) => {
      const dif = a.diferencia != null
        ? a.diferencia
        : ((a.totalTramitado || ((a.debitosAceptados || 0) + (a.debitosRefacturados || 0))) - ((a.debitosAceptados || 0) + (a.debitosRefacturados || 0)));
      return acc + dif;
    }, 0);
  }

  get ticketPromedioGlobalAnalistas(): number {
    const casos = this.totalCasosAnalistas;
    return casos > 0 ? (this.totalMontoDebitadoAnalistas / casos) : 0;
  }

  get tasaRecuperoGlobalAnalistas(): number {
    const deb = this.totalMontoDebitadoAnalistas;
    return deb > 0 ? ((this.totalRefacturadosAnalistas * 100) / deb) : 0;
  }

  get distribucionAtencionGlobalAnalistas(): string {
    const amb = (this.analistasFiltrados || []).reduce((acc, a) => acc + (a.cantidadAmb || 0), 0);
    const in_ = (this.analistasFiltrados || []).reduce((acc, a) => acc + (a.cantidadInt || 0), 0);
    const tot = amb + in_;
    if (tot === 0) return '—';
    const pAmb = Math.round((amb * 100) / tot);
    const pInt = 100 - pAmb;
    return `${pAmb}% Amb / ${pInt}% Int`;
  }

  // ── Ordenamiento Analistas ───────────────────────────────────────────────
  ordenarAnalistas(columna: string): void {
    if (this.columnaOrdenAnalista === columna) {
      if (this.pasoOrdenAnalista === 1) {
        this.pasoOrdenAnalista = 2;
        this.direccionOrdenAnalista = this.direccionOrdenAnalista === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenAnalistas();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenAnalista = '';
        this.pasoOrdenAnalista = 0;
        this.restaurarOrdenAnalistas();
      }
    } else {
      this.columnaOrdenAnalista = columna;
      this.pasoOrdenAnalista = 1;
      this.direccionOrdenAnalista = columna === 'analista' ? 'asc' : 'desc';
      this.aplicarOrdenAnalistas();
    }
  }

  aplicarOrdenAnalistas(): void {
    const factor = this.direccionOrdenAnalista === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenAnalista;

    // Detectar si hay algún motivo desplegado (Nivel 3 activo)
    const hayMotivoDesplegado = this.analistasDatos.some(a =>
      a.expanded && a.motivos?.some(m => m.expanded)
    );
    // Detectar si hay algún analista desplegado pero ningún motivo (Nivel 2 activo)
    const hayAnalistaDesplegado = !hayMotivoDesplegado && this.analistasDatos.some(a => a.expanded);

    // CASO 1: Si NO hay nada desplegado -> ordenar Nivel 1 (Analistas)
    if (!hayMotivoDesplegado && !hayAnalistaDesplegado) {
      this.analistasDatos.sort((a, b) => {
        switch (columna) {
          case 'analista':
            return (a.analista || '').localeCompare(b.analista || '') * factor;
          case 'financiadores':
            return ((a.cantidadFinanciadores || 0) - (b.cantidadFinanciadores || 0)) * factor;
          case 'documentos':
          case 'casos':
            return ((a.cantidadRegistros || 0) - (b.cantidadRegistros || 0)) * factor;
          case 'monto':
          case 'montoDebitado':
            return ((a.totalTramitado || (a.debitosAceptados + a.debitosRefacturados) || 0) -
              (b.totalTramitado || (b.debitosAceptados + b.debitosRefacturados) || 0)) * factor;
          case 'aceptados':
            return ((a.debitosAceptados || 0) - (b.debitosAceptados || 0)) * factor;
          case 'refacturados':
            return ((a.debitosRefacturados || 0) - (b.debitosRefacturados || 0)) * factor;
          case 'diferencia':
            return (((a as any).diferencia || 0) - ((b as any).diferencia || 0)) * factor;
          case 'ticket':
            return ((a.ticketPromedio || 0) - (b.ticketPromedio || 0)) * factor;
          case 'atencion':
            return (((a.porcentajeAmb ?? 100)) - ((b.porcentajeAmb ?? 100))) * factor;
          case 'recupero':
            return ((a.tasaRecupero || 0) - (b.tasaRecupero || 0)) * factor;
          default:
            return 0;
        }
      });
    }

    if (hayAnalistaDesplegado || (!hayMotivoDesplegado && !hayAnalistaDesplegado)) {
      for (const a of this.analistasDatos) {
        if (hayAnalistaDesplegado && !a.expanded) continue;
        if (a.motivos && a.motivos.length > 0) {
          a.motivos.sort((m1, m2) => {
            switch (columna) {
              case 'analista':
                return (m1.motivo || '').localeCompare(m2.motivo || '') * factor;
              case 'financiadores':
                return ((m1.financiadores?.length || 0) - (m2.financiadores?.length || 0)) * factor;
              case 'documentos':
              case 'casos':
                return ((m1.casos || 0) - (m2.casos || 0)) * factor;
              case 'monto':
              case 'montoDebitado':
                return ((m1.montoDebitado || 0) - (m2.montoDebitado || 0)) * factor;
              case 'aceptados':
                return ((m1.aceptado || 0) - (m2.aceptado || 0)) * factor;
              case 'refacturados':
                return ((m1.refacturado || 0) - (m2.refacturado || 0)) * factor;
              case 'diferencia':
                return (((m1 as any).diferencia || 0) - ((m2 as any).diferencia || 0)) * factor;
              case 'ticket': {
                const t1 = (m1.casos && m1.casos > 0) ? (m1.montoDebitado / m1.casos) : 0;
                const t2 = (m2.casos && m2.casos > 0) ? (m2.montoDebitado / m2.casos) : 0;
                return (t1 - t2) * factor;
              }
              case 'atencion': {
                const amb1 = m1.porcentajeAmb ?? 100;
                const amb2 = m2.porcentajeAmb ?? 100;
                return (amb1 - amb2) * factor;
              }
              case 'recupero': {
                const r1 = m1.montoDebitado > 0 ? (m1.refacturado * 100 / m1.montoDebitado) : 0;
                const r2 = m2.montoDebitado > 0 ? (m2.refacturado * 100 / m2.montoDebitado) : 0;
                return (r1 - r2) * factor;
              }
              default:
                return 0;
            }
          });

          a.motivos = [...a.motivos];
        }
      }
    }

    // CASO 3: La menor categoría desplegada es Nivel 3 (Financiadores)
    if (hayMotivoDesplegado) {
      for (const a of this.analistasDatos) {
        if (!a.expanded || !a.motivos) continue;
        for (const m of a.motivos) {
          if (!m.expanded || !m.financiadores || m.financiadores.length === 0) continue;
          m.financiadores.sort((f1, f2) => {
            switch (columna) {
              case 'analista':
              case 'financiadores':
                return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
              case 'documentos':
              case 'casos':
                return ((f1.casos || 0) - (f2.casos || 0)) * factor;
              case 'monto':
              case 'montoDebitado': {
                const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                return (mFin1 - mFin2) * factor;
              }
              case 'aceptados':
                return ((f1.aceptado || 0) - (f2.aceptado || 0)) * factor;
              case 'refacturados':
                return ((f1.refacturado || 0) - (f2.refacturado || 0)) * factor;
              case 'diferencia':
                return (((f1 as any).diferencia || 0) - ((f2 as any).diferencia || 0)) * factor;
              case 'ticket': {
                const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                const tf1 = (f1.casos && f1.casos > 0) ? (mFin1 / f1.casos) : 0;
                const tf2 = (f2.casos && f2.casos > 0) ? (mFin2 / f2.casos) : 0;
                return (tf1 - tf2) * factor;
              }
              case 'atencion': {
                const amb1 = (f1 as any).porcentajeAmb ?? (f1.distribucionAtencion ? parseFloat(f1.distribucionAtencion) : 100);
                const amb2 = (f2 as any).porcentajeAmb ?? (f2.distribucionAtencion ? parseFloat(f2.distribucionAtencion) : 100);
                return (amb1 - amb2) * factor;
              }
              case 'recupero': {
                const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                const rf1 = mFin1 > 0 ? ((f1.refacturado || 0) * 100 / mFin1) : 0;
                const rf2 = mFin2 > 0 ? ((f2.refacturado || 0) * 100 / mFin2) : 0;
                return (rf1 - rf2) * factor;
              }
              default:
                return 0;
            }
          });
          m.financiadores = [...m.financiadores];
        }
      }
    } else if (!hayAnalistaDesplegado) {
      for (const a of this.analistasDatos) {
        if (a.motivos) {
          for (const m of a.motivos) {
            if (m.financiadores && m.financiadores.length > 0) {
              m.financiadores.sort((f1, f2) => {
                switch (columna) {
                  case 'analista':
                  case 'financiadores':
                    return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
                  case 'documentos':
                  case 'casos':
                    return ((f1.casos || 0) - (f2.casos || 0)) * factor;
                  case 'monto':
                  case 'montoDebitado': {
                    const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                    const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                    return (mFin1 - mFin2) * factor;
                  }
                  case 'aceptados':
                    return ((f1.aceptado || 0) - (f2.aceptado || 0)) * factor;
                  case 'refacturados':
                    return ((f1.refacturado || 0) - (f2.refacturado || 0)) * factor;
                  case 'ticket': {
                    const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                    const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                    const tf1 = (f1.casos && f1.casos > 0) ? (mFin1 / f1.casos) : 0;
                    const tf2 = (f2.casos && f2.casos > 0) ? (mFin2 / f2.casos) : 0;
                    return (tf1 - tf2) * factor;
                  }
                  case 'atencion': {
                    const amb1 = (f1 as any).porcentajeAmb ?? (f1.distribucionAtencion ? parseFloat(f1.distribucionAtencion) : 100);
                    const amb2 = (f2 as any).porcentajeAmb ?? (f2.distribucionAtencion ? parseFloat(f2.distribucionAtencion) : 100);
                    return (amb1 - amb2) * factor;
                  }
                  case 'recupero': {
                    const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                    const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                    const rf1 = mFin1 > 0 ? ((f1.refacturado || 0) * 100 / mFin1) : 0;
                    const rf2 = mFin2 > 0 ? ((f2.refacturado || 0) * 100 / mFin2) : 0;
                    return (rf1 - rf2) * factor;
                  }
                  default:
                    return 0;
                }
              });
              m.financiadores = [...m.financiadores];
            }
          }
        }
      }
    }
    this.analistasDatos = [...this.analistasDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenAnalistas(): void {
    const hayMotivoDesplegado = this.analistasDatos.some(a =>
      a.expanded && a.motivos?.some(m => m.expanded)
    );
    const hayAnalistaDesplegado = !hayMotivoDesplegado && this.analistasDatos.some(a => a.expanded);

    if (hayMotivoDesplegado) {
      for (const a of this.analistasDatos) {
        if (!a.expanded || !a.motivos) continue;
        for (const m of a.motivos) {
          if (!m.expanded || !m.financiadores) continue;
          m.financiadores.sort((f1, f2) => ((f1 as any)._originalIndex ?? 0) - ((f2 as any)._originalIndex ?? 0));
          m.financiadores = [...m.financiadores];
        }
      }
    } else if (hayAnalistaDesplegado) {
      for (const a of this.analistasDatos) {
        if (!a.expanded || !a.motivos) continue;
        a.motivos.sort((m1, m2) => ((m1 as any)._originalIndex ?? 0) - ((m2 as any)._originalIndex ?? 0));
        a.motivos = [...a.motivos];
      }
    } else {
      this.analistasDatos.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
      for (const a of this.analistasDatos) {
        if (a.motivos) {
          a.motivos.sort((m1, m2) => ((m1 as any)._originalIndex ?? 0) - ((m2 as any)._originalIndex ?? 0));
          for (const m of a.motivos) {
            if (m.financiadores) {
              m.financiadores.sort((f1, f2) => ((f1 as any)._originalIndex ?? 0) - ((f2 as any)._originalIndex ?? 0));
              m.financiadores = [...m.financiadores];
            }
          }
          a.motivos = [...a.motivos];
        }
      }
    }
    this.analistasDatos = [...this.analistasDatos];
    this.cdr.markForCheck();
  }

  // ── Ordenamiento Subnivel Motivos Analistas ─────────────────────────────────
  ordenarMotivosAnalistas(columna: string): void {
    if (this.columnaOrdenMotivoAnalista === columna) {
      if (this.pasoOrdenMotivoAnalista === 1) {
        this.pasoOrdenMotivoAnalista = 2;
        this.direccionOrdenMotivoAnalista = this.direccionOrdenMotivoAnalista === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenMotivosAnalistas();
      } else {
        // 3er click: deshacer ordenamiento de motivos
        this.columnaOrdenMotivoAnalista = '';
        this.pasoOrdenMotivoAnalista = 0;
        this.restaurarOrdenMotivosAnalistas();
      }
    } else {
      this.columnaOrdenMotivoAnalista = columna;
      this.pasoOrdenMotivoAnalista = 1;
      this.direccionOrdenMotivoAnalista = columna === 'motivo' ? 'asc' : 'desc';
      this.aplicarOrdenMotivosAnalistas();
    }
  }

  aplicarOrdenMotivosAnalistas(): void {
    if (!this.columnaOrdenMotivoAnalista) return;
    const factor = this.direccionOrdenMotivoAnalista === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenMotivoAnalista;

    for (const a of this.analistasDatos) {
      if (a.motivos && a.motivos.length > 0) {
        a.motivos.sort((m1, m2) => {
          switch (columna) {
            case 'motivo':
              return (m1.motivo || '').localeCompare(m2.motivo || '') * factor;
            case 'financiadores':
              return ((m1.financiadores?.length || 0) - (m2.financiadores?.length || 0)) * factor;
            case 'casos':
              return ((m1.casos || 0) - (m2.casos || 0)) * factor;
            case 'montoDebitado':
              return ((m1.montoDebitado || 0) - (m2.montoDebitado || 0)) * factor;
            case 'aceptado':
              return ((m1.aceptado || 0) - (m2.aceptado || 0)) * factor;
            case 'refacturado':
              return ((m1.refacturado || 0) - (m2.refacturado || 0)) * factor;
            case 'atencion': {
              const amb1 = m1.porcentajeAmb ?? 100;
              const amb2 = m2.porcentajeAmb ?? 100;
              return (amb1 - amb2) * factor;
            }
            case 'recupero': {
              const r1 = m1.montoDebitado > 0 ? (m1.refacturado * 100 / m1.montoDebitado) : 0;
              const r2 = m2.montoDebitado > 0 ? (m2.refacturado * 100 / m2.montoDebitado) : 0;
              return (r1 - r2) * factor;
            }
            default:
              return 0;
          }
        });

        for (const m of a.motivos) {
          if (m.financiadores && m.financiadores.length > 0) {
            m.financiadores.sort((f1, f2) => {
              switch (columna) {
                case 'motivo':
                case 'financiadores':
                  return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
                case 'casos':
                  return ((f1.casos || 0) - (f2.casos || 0)) * factor;
                case 'montoDebitado': {
                  const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
                  const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
                  return ((mFin1 || 0) - (mFin2 || 0)) * factor;
                }
                case 'aceptado':
                  return ((f1.aceptado || 0) - (f2.aceptado || 0)) * factor;
                case 'refacturado':
                  return ((f1.refacturado || 0) - (f2.refacturado || 0)) * factor;
                case 'recupero': {
                  const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
                  const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
                  const rf1 = mFin1 > 0 ? ((f1.refacturado || 0) * 100 / mFin1) : 0;
                  const rf2 = mFin2 > 0 ? ((f2.refacturado || 0) * 100 / mFin2) : 0;
                  return (rf1 - rf2) * factor;
                }
                default:
                  return 0;
              }
            });
            m.financiadores = [...m.financiadores];
          }
        }
        a.motivos = [...a.motivos];
      }
    }
    this.analistasDatos = [...this.analistasDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenMotivosAnalistas(): void {
    for (const a of this.analistasDatos) {
      if (a.motivos) {
        a.motivos.sort((m1, m2) => ((m1 as any)._originalIndex ?? 0) - ((m2 as any)._originalIndex ?? 0));
        for (const m of a.motivos) {
          if (m.financiadores) {
            m.financiadores.sort((f1, f2) => ((f1 as any)._originalIndex ?? 0) - ((f2 as any)._originalIndex ?? 0));
            m.financiadores = [...m.financiadores];
          }
        }
        a.motivos = [...a.motivos];
      }
    }
    this.analistasDatos = [...this.analistasDatos];
    this.cdr.markForCheck();
  }

  // ── Ordenamiento Médicos ─────────────────────────────────────────────────
  ordenarMedicos(columna: string): void {
    if (this.columnaOrdenMedico === columna) {
      if (this.pasoOrdenMedico === 1) {
        this.pasoOrdenMedico = 2;
        this.direccionOrdenMedico = this.direccionOrdenMedico === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenMedicos();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenMedico = '';
        this.pasoOrdenMedico = 0;
        this.restaurarOrdenMedicos();
      }
    } else {
      this.columnaOrdenMedico = columna;
      this.pasoOrdenMedico = 1;
      this.direccionOrdenMedico = columna === 'medico' ? 'asc' : 'desc';
      this.aplicarOrdenMedicos();
    }
  }

  aplicarOrdenMedicos(): void {
    const factor = this.direccionOrdenMedico === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenMedico;

    // Detectar si hay algún motivo desplegado (Nivel 3 activo)
    const hayMotivoDesplegado = this.medicosDatos.some(med =>
      med.expanded && med.motivos?.some(m => m.expanded)
    );

    // Detectar si hay algún médico desplegado pero ningún motivo (Nivel 2 activo)
    const hayMedicoDesplegado = !hayMotivoDesplegado && this.medicosDatos.some(med => med.expanded);

    // Helpers para obtener valores considerando posible filtro de cobertura
    const obtenerMontoMotivo = (mot: DesgloseMotivoDTO): number => {
      if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
        const fins = (mot.financiadores || []).filter(f => this.coincideFinanciador(f.financiador, this.codigoCoberturaSeleccionada));
        return fins.reduce((acc, f) => acc + (f.montoDebitado != null ? f.montoDebitado : (f.monto || 0)), 0);
      }
      return mot.montoDebitado || 0;
    };

    const obtenerCasosMotivo = (mot: DesgloseMotivoDTO): number => {
      if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
        const fins = (mot.financiadores || []).filter(f => this.coincideFinanciador(f.financiador, this.codigoCoberturaSeleccionada));
        return fins.reduce((acc, f) => acc + (f.casos || 0), 0);
      }
      return mot.casos || 0;
    };

    const obtenerAceptadoMotivo = (mot: DesgloseMotivoDTO): number => {
      if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
        const fins = (mot.financiadores || []).filter(f => this.coincideFinanciador(f.financiador, this.codigoCoberturaSeleccionada));
        return fins.reduce((acc, f) => acc + (f.aceptado || 0), 0);
      }
      return mot.aceptado || 0;
    };

    const obtenerRefacturadoMotivo = (mot: DesgloseMotivoDTO): number => {
      if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
        const fins = (mot.financiadores || []).filter(f => this.coincideFinanciador(f.financiador, this.codigoCoberturaSeleccionada));
        return fins.reduce((acc, f) => acc + (f.refacturado || 0), 0);
      }
      return mot.refacturado || 0;
    };

    // Comparador reutilizable de Motivos (Nivel 2)
    const compararMotivos = (m1: DesgloseMotivoDTO, m2: DesgloseMotivoDTO) => {
      switch (columna) {
        case 'medico':
          return (m1.motivo || '').localeCompare(m2.motivo || '') * factor;
        case 'motivos':
          return ((m1.financiadores?.length || 0) - (m2.financiadores?.length || 0)) * factor;
        case 'documentos':
        case 'casos':
          return (obtenerCasosMotivo(m1) - obtenerCasosMotivo(m2)) * factor;
        case 'monto':
        case 'montoDebitado':
          return (obtenerMontoMotivo(m1) - obtenerMontoMotivo(m2)) * factor;
        case 'aceptados':
          return (obtenerAceptadoMotivo(m1) - obtenerAceptadoMotivo(m2)) * factor;
        case 'refacturados':
          return (obtenerRefacturadoMotivo(m1) - obtenerRefacturadoMotivo(m2)) * factor;
        case 'diferencia':
          return (((m1 as any).diferencia || 0) - ((m2 as any).diferencia || 0)) * factor;
        case 'ticket': {
          const c1 = obtenerCasosMotivo(m1);
          const c2 = obtenerCasosMotivo(m2);
          const t1 = (c1 > 0) ? (obtenerMontoMotivo(m1) / c1) : 0;
          const t2 = (c2 > 0) ? (obtenerMontoMotivo(m2) / c2) : 0;
          return (t1 - t2) * factor;
        }
        case 'recupero': {
          const mnt1 = obtenerMontoMotivo(m1);
          const mnt2 = obtenerMontoMotivo(m2);
          const r1 = mnt1 > 0 ? (obtenerRefacturadoMotivo(m1) * 100 / mnt1) : 0;
          const r2 = mnt2 > 0 ? (obtenerRefacturadoMotivo(m2) * 100 / mnt2) : 0;
          return (r1 - r2) * factor;
        }
        default:
          return 0;
      }
    };

    // Comparador reutilizable de Financiadores (Nivel 3)
    const compararFinanciadores = (f1: DesgloseFinanciadorDTO, f2: DesgloseFinanciadorDTO) => {
      switch (columna) {
        case 'medico':
        case 'motivos':
          return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
        case 'documentos':
        case 'casos':
          return ((f1.casos || 0) - (f2.casos || 0)) * factor;
        case 'monto':
        case 'montoDebitado': {
          const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
          const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
          return (mFin1 - mFin2) * factor;
        }
        case 'aceptados':
          return ((f1.aceptado || 0) - (f2.aceptado || 0)) * factor;
        case 'refacturados':
          return ((f1.refacturado || 0) - (f2.refacturado || 0)) * factor;
        case 'diferencia':
          return (((f1 as any).diferencia || 0) - ((f2 as any).diferencia || 0)) * factor;
        case 'ticket': {
          const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
          const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
          const tf1 = (f1.casos && f1.casos > 0) ? (mFin1 / f1.casos) : 0;
          const tf2 = (f2.casos && f2.casos > 0) ? (mFin2 / f2.casos) : 0;
          return (tf1 - tf2) * factor;
        }
        case 'recupero': {
          const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
          const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
          const rf1 = mFin1 > 0 ? ((f1.refacturado || 0) * 100 / mFin1) : 0;
          const rf2 = mFin2 > 0 ? ((f2.refacturado || 0) * 100 / mFin2) : 0;
          return (rf1 - rf2) * factor;
        }
        default:
          return 0;
      }
    };

    // CASO 1: Si NO hay ningún elemento desplegado -> ordenar Nivel 1 (Médicos)
    if (!hayMotivoDesplegado && !hayMedicoDesplegado) {
      this.medicosDatos.sort((a, b) => {
        switch (columna) {
          case 'medico':
            return (a.medico || '').localeCompare(b.medico || '') * factor;
          case 'motivos':
            return ((a.motivos?.length || 0) - (b.motivos?.length || 0)) * factor;
          case 'documentos':
          case 'casos':
            return ((a.cantidadRegistros || 0) - (b.cantidadRegistros || 0)) * factor;
          case 'monto':
          case 'montoDebitado':
            return ((a.totalTramitado || (a.debitosAceptados + a.debitosRefacturados) || 0) -
              (b.totalTramitado || (b.debitosAceptados + b.debitosRefacturados) || 0)) * factor;
          case 'aceptados':
            return ((a.debitosAceptados || 0) - (b.debitosAceptados || 0)) * factor;
          case 'refacturados':
            return ((a.debitosRefacturados || 0) - (b.debitosRefacturados || 0)) * factor;
          case 'diferencia':
            return (((a as any).diferencia || 0) - ((b as any).diferencia || 0)) * factor;
          case 'ticket':
            return ((a.ticketPromedio || 0) - (b.ticketPromedio || 0)) * factor;
          case 'recupero':
            return ((a.tasaRecupero || 0) - (b.tasaRecupero || 0)) * factor;
          default:
            return 0;
        }
      });
    }

    // CASO 2: La menor categoría desplegada es Nivel 2 (Motivos)
    if (hayMedicoDesplegado) {
      for (const med of this.medicosDatos) {
        if (!med.expanded) continue; // No tocar médicos que no estén desplegados
        if (med.motivos && med.motivos.length > 0) {
          med.motivos.sort(compararMotivos);
          med.motivos = [...med.motivos];
        }
      }
    } else if (!hayMotivoDesplegado) {
      // Si nada estaba desplegado, preparar motivos de todos los médicos en cascada
      for (const med of this.medicosDatos) {
        if (med.motivos && med.motivos.length > 0) {
          med.motivos.sort(compararMotivos);
          med.motivos = [...med.motivos];
        }
      }
    }

    // CASO 3: La menor categoría desplegada es Nivel 3 (Financiadores)
    if (hayMotivoDesplegado) {
      for (const med of this.medicosDatos) {
        if (!med.expanded || !med.motivos) continue;
        for (const m of med.motivos) {
          if (!m.expanded || !m.financiadores || m.financiadores.length === 0) continue;
          m.financiadores.sort(compararFinanciadores);
          m.financiadores = [...m.financiadores];
        }
      }
    } else if (!hayMedicoDesplegado) {
      // Si nada estaba desplegado, preparar financiadores en cascada
      for (const med of this.medicosDatos) {
        if (med.motivos) {
          for (const m of med.motivos) {
            if (m.financiadores && m.financiadores.length > 0) {
              m.financiadores.sort(compararFinanciadores);
              m.financiadores = [...m.financiadores];
            }
          }
        }
      }
    }

    this.medicosDatos = [...this.medicosDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenMedicos(): void {
    const hayMotivoDesplegado = this.medicosDatos.some(med =>
      med.expanded && med.motivos?.some(m => m.expanded)
    );
    const hayMedicoDesplegado = !hayMotivoDesplegado && this.medicosDatos.some(med => med.expanded);

    if (hayMotivoDesplegado) {
      for (const med of this.medicosDatos) {
        if (!med.expanded || !med.motivos) continue;
        for (const m of med.motivos) {
          if (!m.expanded || !m.financiadores) continue;
          m.financiadores.sort((f1, f2) => ((f1 as any)._originalIndex ?? 0) - ((f2 as any)._originalIndex ?? 0));
          m.financiadores = [...m.financiadores];
        }
      }
    } else if (hayMedicoDesplegado) {
      for (const med of this.medicosDatos) {
        if (!med.expanded || !med.motivos) continue;
        med.motivos.sort((m1, m2) => ((m1 as any)._originalIndex ?? 0) - ((m2 as any)._originalIndex ?? 0));
        med.motivos = [...med.motivos];
      }
    } else {
      this.medicosDatos.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
      for (const med of this.medicosDatos) {
        if (med.motivos) {
          med.motivos.sort((m1, m2) => ((m1 as any)._originalIndex ?? 0) - ((m2 as any)._originalIndex ?? 0));
          for (const m of med.motivos) {
            if (m.financiadores) {
              m.financiadores.sort((f1, f2) => ((f1 as any)._originalIndex ?? 0) - ((f2 as any)._originalIndex ?? 0));
              m.financiadores = [...m.financiadores];
            }
          }
          med.motivos = [...med.motivos];
        }
      }
    }
    this.medicosDatos = [...this.medicosDatos];
    this.cdr.markForCheck();
  }

  coincideFinanciador(nombreFinanciador?: string, codigoFiltro?: string): boolean {
    if (!nombreFinanciador) return false;
    const codFiltro = (codigoFiltro || this.codigoCoberturaSeleccionada || 'TODAS').trim().toLowerCase();
    if (codFiltro === 'todas' || codFiltro === '') return true;

    const cobObj = this.coberturas.find(c => c.codigo.toLowerCase() === codFiltro);
    const nomFiltro = cobObj?.nombre ? cobObj.nombre.trim().toLowerCase() : '';

    const finTexto = (nombreFinanciador || '').trim().toLowerCase();

    if (finTexto === codFiltro) return true;
    if (finTexto.includes(codFiltro)) return true;
    if (nomFiltro && (finTexto.includes(nomFiltro) || nomFiltro.includes(finTexto))) return true;

    const partes = finTexto.split('-');
    if (partes.length > 1 && partes[0].trim() === codFiltro) return true;

    return false;
  }

  medicoTieneCobertura(med: MetricaMedicoDTO, codigoCobertura?: string): boolean {
    const cod = (codigoCobertura || this.codigoCoberturaSeleccionada || 'TODAS').trim();
    if (!cod || cod === 'TODAS') return true;
    if (!med.motivos || med.motivos.length === 0) return false;
    return med.motivos.some(m =>
      m.financiadores && m.financiadores.some(f => this.coincideFinanciador(f.financiador, cod))
    );
  }

  get listaNombresMedicos(): string[] {
    let medicosBase = this.medicosDatos;
    if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
      medicosBase = medicosBase.filter(med => this.medicoTieneCobertura(med, this.codigoCoberturaSeleccionada));
    }
    const nombres = medicosBase
      .map(m => m.medico)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b));
  }

  get medicosFiltrados(): MetricaMedicoDTO[] {
    let lista = this.medicosDatos;

    // 1. Filtrar por Búsqueda rápida de texto
    if (this.busquedaTextoMedico && this.busquedaTextoMedico.trim() !== '') {
      const term = this.busquedaTextoMedico.trim().toLowerCase();
      lista = lista.filter(m => (m.medico || '').toLowerCase().includes(term));
    }

    // 2. Filtrar por Médico seleccionado en dropdown
    if (this.filtroMedicoSeleccionado && this.filtroMedicoSeleccionado !== 'TODOS') {
      lista = lista.filter(m => m.medico === this.filtroMedicoSeleccionado);
    }

    // 3. Filtrar por Institución / Cobertura
    if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
      const codCob = this.codigoCoberturaSeleccionada;
      lista = lista
        .filter(med => this.medicoTieneCobertura(med, codCob))
        .map((med): MetricaMedicoDTO => {
          const motivosFiltrados: DesgloseMotivoDTO[] = [];
          for (const mot of (med.motivos || [])) {
            const finsFiltrados = (mot.financiadores || []).filter(f =>
              this.coincideFinanciador(f.financiador, codCob)
            );
            if (finsFiltrados.length === 0) continue;

            const casosMot = finsFiltrados.reduce((acc, f) => acc + (f.casos || 0), 0);
            const montoMot = finsFiltrados.reduce((acc, f) => acc + (f.monto || (f as any).montoDebitado || 0), 0);
            const aceptadoMot = finsFiltrados.reduce((acc, f) => acc + (f.aceptado || 0), 0);
            const refacturadoMot = finsFiltrados.reduce((acc, f) => acc + (f.refacturado || 0), 0);

            motivosFiltrados.push({
              ...mot,
              expanded: !!mot.expanded,
              casos: casosMot,
              montoDebitado: montoMot,
              aceptado: aceptadoMot,
              refacturado: refacturadoMot,
              financiadores: finsFiltrados
            });
          }

          const casosTotal = motivosFiltrados.reduce((acc, m) => acc + (m.casos || 0), 0);
          const aceptadosTotal = motivosFiltrados.reduce((acc, m) => acc + (m.aceptado || 0), 0);
          const refacturadosTotal = motivosFiltrados.reduce((acc, m) => acc + (m.refacturado || 0), 0);
          const montoTotal = motivosFiltrados.reduce((acc, m) => acc + (m.montoDebitado || 0), 0);
          const ticketProm = casosTotal > 0 ? (montoTotal / casosTotal) : 0;
          const tasaRec = montoTotal > 0 ? (refacturadosTotal * 100 / montoTotal) : 0;

          return {
            ...med,
            expanded: !!med.expanded,
            cantidadRegistros: casosTotal > 0 ? casosTotal : med.cantidadRegistros,
            debitosAceptados: aceptadosTotal,
            debitosRefacturados: refacturadosTotal,
            totalTramitado: montoTotal,
            ticketPromedio: ticketProm,
            tasaRecupero: tasaRec,
            motivos: motivosFiltrados
          };
        });
    }

    return lista;
  }

  get totalPaginasMedicos(): number {
    const total = this.medicosFiltrados.length;
    if (total === 0) return 1;
    return Math.ceil(total / this.medicosItemsPorPagina) || 1;
  }

  get medicosDatosPaginados(): MetricaMedicoDTO[] {
    const filtrados = this.medicosFiltrados;
    if (!filtrados || filtrados.length === 0) return [];
    if (this.medicosItemsPorPagina >= filtrados.length) return filtrados;
    const inicio = (this.medicosPaginaActual - 1) * this.medicosItemsPorPagina;
    return filtrados.slice(inicio, inicio + this.medicosItemsPorPagina);
  }

  cambiarPaginaMedicos(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasMedicos) {
      this.medicosPaginaActual = pagina;
      this.cdr.markForCheck();
      this.actualizarAlturasSticky();
    }
  }

  onMedicosItemsPorPaginaChange(tamano: any): void {
    this.medicosItemsPorPagina = Number(tamano) || 25;
    this.medicosPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  onBusquedaTextoMedicoChange(): void {
    this.medicosPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  limpiarFiltroMedico(): void {
    this.filtroMedicoSeleccionado = 'TODOS';
    this.medicosPaginaActual = 1;
    this.actualizarAlturasSticky();
  }

  restablecerFiltrosMedicos(): void {
    this.filtroMedicoSeleccionado = 'TODOS';
    this.codigoCoberturaSeleccionada = 'TODAS';
    this.busquedaTextoMedico = '';
    this.medicosPaginaActual = 1;
    this.actualizarAlturasSticky();
  }

  get tieneFiltroMedicoActivo(): boolean {
    const tieneTexto = !!(this.busquedaTextoMedico && this.busquedaTextoMedico.trim() !== '');
    const tieneCob = !!(this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS');
    const tieneDropdown = !!(this.filtroMedicoSeleccionado && this.filtroMedicoSeleccionado !== 'TODOS');
    return tieneTexto || tieneCob || tieneDropdown;
  }

  // ── Totales Consolidados Fila Superior Médicos (Prestadores) ─────────────
  get totalMotivosMedicos(): number {
    return (this.medicosFiltrados || []).reduce((acc, med) => acc + (med.motivos?.length || 0), 0);
  }

  get totalCasosMedicos(): number {
    return (this.medicosFiltrados || []).reduce((acc, med) => acc + (med.cantidadRegistros || 0), 0);
  }

  get totalMontoDebitadoMedicos(): number {
    return (this.medicosFiltrados || []).reduce((acc, med) =>
      acc + (med.totalTramitado || (med.debitosAceptados + med.debitosRefacturados) || 0), 0);
  }

  get totalAceptadosMedicos(): number {
    return (this.medicosFiltrados || []).reduce((acc, med) => acc + (med.debitosAceptados || 0), 0);
  }

  get totalRefacturadosMedicos(): number {
    return (this.medicosFiltrados || []).reduce((acc, med) => acc + (med.debitosRefacturados || 0), 0);
  }

  get totalDiferenciaMedicos(): number {
    return (this.medicosFiltrados || []).reduce((acc, med) => {
      const dif = med.diferencia != null
        ? med.diferencia
        : ((med.totalTramitado || ((med.debitosAceptados || 0) + (med.debitosRefacturados || 0))) - ((med.debitosAceptados || 0) + (med.debitosRefacturados || 0)));
      return acc + dif;
    }, 0);
  }

  get ticketPromedioGlobalMedicos(): number {
    const casos = this.totalCasosMedicos;
    return casos > 0 ? (this.totalMontoDebitadoMedicos / casos) : 0;
  }

  get tasaRecuperoGlobalMedicos(): number {
    const deb = this.totalMontoDebitadoMedicos;
    return deb > 0 ? ((this.totalRefacturadosMedicos * 100) / deb) : 0;
  }

  // ── Ordenamiento Cuenta Corriente ─────────────────────────────────────────
  ordenarCuentaCorriente(columna: string): void {
    if (this.columnaOrdenCc === columna) {
      if (this.pasoOrdenCc === 1) {
        this.pasoOrdenCc = 2;
        this.direccionOrdenCc = this.direccionOrdenCc === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenCuentaCorriente();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenCc = '';
        this.pasoOrdenCc = 0;
        this.restaurarOrdenCuentaCorriente();
      }
    } else {
      this.columnaOrdenCc = columna;
      this.pasoOrdenCc = 1;
      this.direccionOrdenCc = (columna === 'entidad' || columna === 'fecha') ? 'asc' : 'desc';
      this.aplicarOrdenCuentaCorriente();
    }
  }

  aplicarOrdenCuentaCorriente(): void {
    const factor = this.direccionOrdenCc === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenCc;

    // 1. Ordenar Nivel 1: Financiadores
    this.cuentaCorrienteDatos.sort((a, b) => {
      switch (columna) {
        case 'entidad':
          return (a.financiador || '').localeCompare(b.financiador || '') * factor;
        case 'fecha': {
          const f1 = a.periodos?.[0]?.periodo || '';
          const f2 = b.periodos?.[0]?.periodo || '';
          return f1.localeCompare(f2) * factor;
        }
        case 'facturacion':
          return ((a.facturacionFc || 0) - (b.facturacionFc || 0)) * factor;
        case 'incrementos':
          return ((a.incrementosNd || 0) - (b.incrementosNd || 0)) * factor;
        case 'debitos':
          return ((a.debitosNc || 0) - (b.debitosNc || 0)) * factor;
        case 'refacturacion':
          return ((a.refacturacionNd || 0) - (b.refacturacionNd || 0)) * factor;
        case 'cobranzas':
          return ((a.cobranzasRc || 0) - (b.cobranzasRc || 0)) * factor;
        case 'saldo':
          return ((a.saldo || 0) - (b.saldo || 0)) * factor;
        default:
          return 0;
      }
    });

    // 2. Ordenar Nivel 2: Períodos y Nivel 3: Comprobantes dentro de cada financiador
    for (const f of this.cuentaCorrienteDatos) {
      if (f.periodos && f.periodos.length > 0) {
        f.periodos.sort((p1, p2) => {
          switch (columna) {
            case 'entidad':
            case 'fecha':
              return (p1.periodo || '').localeCompare(p2.periodo || '') * factor;
            case 'facturacion':
              return ((p1.facturacionFc || 0) - (p2.facturacionFc || 0)) * factor;
            case 'incrementos':
              return ((p1.incrementosNd || 0) - (p2.incrementosNd || 0)) * factor;
            case 'debitos':
              return ((p1.debitosNc || 0) - (p2.debitosNc || 0)) * factor;
            case 'refacturacion':
              return ((p1.refacturacionNd || 0) - (p2.refacturacionNd || 0)) * factor;
            case 'cobranzas':
              return ((p1.cobranzasRc || 0) - (p2.cobranzasRc || 0)) * factor;
            case 'saldo':
              return ((p1.saldo || 0) - (p2.saldo || 0)) * factor;
            default:
              return 0;
          }
        });

        // Nivel 3: Comprobantes dentro de cada período
        for (const p of f.periodos) {
          if (p.comprobantes && p.comprobantes.length > 0) {
            p.comprobantes.sort((c1, c2) => {
              switch (columna) {
                case 'entidad':
                  return (c1.comprobante || '').localeCompare(c2.comprobante || '') * factor;
                case 'fecha':
                  return (c1.fecha || '').localeCompare(c2.fecha || '') * factor;
                case 'facturacion':
                  return ((c1.facturacionFc || 0) - (c2.facturacionFc || 0)) * factor;
                case 'incrementos':
                  return ((c1.incrementosNd || 0) - (c2.incrementosNd || 0)) * factor;
                case 'debitos':
                  return ((c1.debitosNc || 0) - (c2.debitosNc || 0)) * factor;
                case 'refacturacion':
                  return ((c1.refacturacionNd || 0) - (c2.refacturacionNd || 0)) * factor;
                case 'cobranzas':
                  return ((c1.cobranzasRc || 0) - (c2.cobranzasRc || 0)) * factor;
                case 'saldo':
                  return ((c1.saldo || 0) - (c2.saldo || 0)) * factor;
                default:
                  return 0;
              }
            });

            for (const c of p.comprobantes) {
              if (c.hijos && c.hijos.length > 0) {
                c.hijos.sort((h1, h2) => {
                  switch (columna) {
                    case 'entidad':
                      return (h1.comprobante || '').localeCompare(h2.comprobante || '') * factor;
                    case 'fecha':
                      return (h1.fecha || '').localeCompare(h2.fecha || '') * factor;
                    case 'facturacion':
                      return ((h1.facturacionFc || 0) - (h2.facturacionFc || 0)) * factor;
                    case 'incrementos':
                      return ((h1.incrementosNd || 0) - (h2.incrementosNd || 0)) * factor;
                    case 'debitos':
                      return ((h1.debitosNc || 0) - (h2.debitosNc || 0)) * factor;
                    case 'refacturacion':
                      return ((h1.refacturacionNd || 0) - (h2.refacturacionNd || 0)) * factor;
                    case 'cobranzas':
                      return ((h1.cobranzasRc || 0) - (h2.cobranzasRc || 0)) * factor;
                    case 'saldo':
                      return ((h1.saldo || 0) - (h2.saldo || 0)) * factor;
                    default:
                      return 0;
                  }
                });
                c.hijos = [...c.hijos];
              }
            }
            p.comprobantes = [...p.comprobantes];
          }
        }
        f.periodos = [...f.periodos];
      }
    }

    this.cuentaCorrienteDatos = [...this.cuentaCorrienteDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenCuentaCorriente(): void {
    this.cuentaCorrienteDatos.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
    for (const f of this.cuentaCorrienteDatos) {
      if (f.periodos) {
        f.periodos.sort((p1, p2) => ((p1 as any)._originalIndex ?? 0) - ((p2 as any)._originalIndex ?? 0));
        for (const p of f.periodos) {
          if (p.comprobantes) {
            p.comprobantes.sort((c1, c2) => ((c1 as any)._originalIndex ?? 0) - ((c2 as any)._originalIndex ?? 0));
            for (const c of p.comprobantes) {
              if (c.hijos) {
                c.hijos.sort((h1, h2) => ((h1 as any)._originalIndex ?? 0) - ((h2 as any)._originalIndex ?? 0));
                c.hijos = [...c.hijos];
              }
            }
            p.comprobantes = [...p.comprobantes];
          }
        }
        f.periodos = [...f.periodos];
      }
    }
    this.cuentaCorrienteDatos = [...this.cuentaCorrienteDatos];
    this.cdr.markForCheck();
  }

  // ── Ordenamiento Matriz ───────────────────────────────────────────────────
  ordenarMatriz(columna: string): void {
    if (!this.matrizRecaudacion?.filas) return;

    if (this.columnaOrdenMatriz === columna) {
      if (this.pasoOrdenMatriz === 1) {
        this.pasoOrdenMatriz = 2;
        this.direccionOrdenMatriz = this.direccionOrdenMatriz === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenMatriz();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenMatriz = '';
        this.pasoOrdenMatriz = 0;
        this.restaurarOrdenMatriz();
      }
    } else {
      this.columnaOrdenMatriz = columna;
      this.pasoOrdenMatriz = 1;
      this.direccionOrdenMatriz = columna === 'financiador' ? 'asc' : 'desc';
      this.aplicarOrdenMatriz();
    }
  }

  aplicarOrdenMatriz(): void {
    if (!this.matrizRecaudacion?.filas) return;
    const factor = this.direccionOrdenMatriz === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenMatriz;

    this.matrizRecaudacion.filas.sort((a, b) => {
      switch (columna) {
        case 'financiador':
          return (a.financiador || '').localeCompare(b.financiador || '') * factor;
        case 'totalAnual':
          return ((a.totalAnual || 0) - (b.totalAnual || 0)) * factor;
        default:
          return 0;
      }
    });

    this.matrizRecaudacion.filas = [...this.matrizRecaudacion.filas];
    this.cdr.markForCheck();
  }

  restaurarOrdenMatriz(): void {
    if (!this.matrizRecaudacion?.filas) return;
    this.matrizRecaudacion.filas.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
    this.matrizRecaudacion.filas = [...this.matrizRecaudacion.filas];
    this.cdr.markForCheck();
  }

  // ── Ordenamiento Bucles ───────────────────────────────────────────────────
  ordenarBucles(columna: string): void {
    if (this.columnaOrdenBucles === columna) {
      if (this.pasoOrdenBucles === 1) {
        this.pasoOrdenBucles = 2;
        this.direccionOrdenBucles = this.direccionOrdenBucles === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenBucles();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenBucles = '';
        this.pasoOrdenBucles = 0;
        this.restaurarOrdenBucles();
      }
    } else {
      this.columnaOrdenBucles = columna;
      this.pasoOrdenBucles = 1;
      this.direccionOrdenBucles = (columna === 'prestacion' || columna === 'financiador' || columna === 'medico') ? 'asc' : 'desc';
      this.aplicarOrdenBucles();
    }
  }

  aplicarOrdenBucles(): void {
    const factor = this.direccionOrdenBucles === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenBucles;

    this.buclesDatos.sort((a, b) => {
      switch (columna) {
        case 'prestacion':
          return (a.idPrestacion || '').localeCompare(b.idPrestacion || '') * factor;
        case 'financiador':
          return (a.financiador || '').localeCompare(b.financiador || '') * factor;
        case 'medico':
          return (a.medico || '').localeCompare(b.medico || '') * factor;
        case 'facturado':
          return ((a.montoFacturadoOriginal || 0) - (b.montoFacturadoOriginal || 0)) * factor;
        case 'debitos':
          return ((a.totalDebitado || 0) - (b.totalDebitado || 0)) * factor;
        default:
          return 0;
      }
    });

    this.buclesDatos = [...this.buclesDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenBucles(): void {
    this.buclesDatos.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
    this.buclesDatos = [...this.buclesDatos];
    this.cdr.markForCheck();
  }

  // ── Ordenamiento Operadores ───────────────────────────────────────────────
  ordenarOperadores(columna: string): void {
    if (this.columnaOrdenOperador === columna) {
      if (this.pasoOrdenOperador === 1) {
        this.pasoOrdenOperador = 2;
        this.direccionOrdenOperador = this.direccionOrdenOperador === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenOperadores();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenOperador = '';
        this.pasoOrdenOperador = 0;
        this.restaurarOrdenOperadores();
      }
    } else {
      this.columnaOrdenOperador = columna;
      this.pasoOrdenOperador = 1;
      this.direccionOrdenOperador = columna === 'operador' ? 'asc' : 'desc';
      this.aplicarOrdenOperadores();
    }
  }

  aplicarOrdenOperadores(): void {
    const factor = this.direccionOrdenOperador === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenOperador;

    // Detectar si hay algún motivo desplegado (Nivel 3 activo)
    const hayMotivoDesplegado = this.operadoresDatos.some(op =>
      op.expanded && op.motivos?.some(m => m.expanded)
    );
    // Detectar si hay algún operador desplegado pero ningún motivo (Nivel 2 activo)
    const hayOperadorDesplegado = !hayMotivoDesplegado && this.operadoresDatos.some(op => op.expanded);

    // 1. Si no hay nada desplegado: ordenar Nivel 1 (Operadores)
    if (!hayMotivoDesplegado && !hayOperadorDesplegado) {
      this.operadoresDatos.sort((a, b) => {
        switch (columna) {
          case 'operador':
            return (a.operador || '').localeCompare(b.operador || '') * factor;
          case 'motivo':
            return ((a.motivos?.length || 0) - (b.motivos?.length || 0)) * factor;
          case 'financiador': {
            const finsA = new Set((a.motivos || []).flatMap(m => (m.financiadores || []).map(f => f.financiador))).size;
            const finsB = new Set((b.motivos || []).flatMap(m => (m.financiadores || []).map(f => f.financiador))).size;
            return (finsA - finsB) * factor;
          }
          case 'documentos':
          case 'casos':
            return ((a.cantidadRegistros || 0) - (b.cantidadRegistros || 0)) * factor;
          case 'monto':
          case 'montoDebitado':
            return ((a.totalTramitado || (a.debitosAceptados + a.debitosRefacturados) || 0) -
              (b.totalTramitado || (b.debitosAceptados + b.debitosRefacturados) || 0)) * factor;
          case 'aceptados':
            return ((a.debitosAceptados || 0) - (b.debitosAceptados || 0)) * factor;
          case 'refacturados':
            return ((a.debitosRefacturados || 0) - (b.debitosRefacturados || 0)) * factor;
          case 'diferencia':
            return (((a as any).diferencia || 0) - ((b as any).diferencia || 0)) * factor;
          case 'ticket':
            return ((a.ticketPromedio || 0) - (b.ticketPromedio || 0)) * factor;
          case 'recupero':
            return ((a.tasaRecupero || 0) - (b.tasaRecupero || 0)) * factor;
          default:
            return 0;
        }
      });
    }

    // 2. Si la menor categoría es Nivel 2 (Motivos) o si nada estaba desplegado
    if (hayOperadorDesplegado || (!hayMotivoDesplegado && !hayOperadorDesplegado)) {
      for (const op of this.operadoresDatos) {
        if (hayOperadorDesplegado && !op.expanded) continue;
        if (op.motivos && op.motivos.length > 0) {
          op.motivos.sort((m1, m2) => {
            switch (columna) {
              case 'operador':
              case 'motivo':
                return (m1.motivo || '').localeCompare(m2.motivo || '') * factor;
              case 'financiador':
                return ((m1.financiadores?.length || 0) - (m2.financiadores?.length || 0)) * factor;
              case 'documentos':
              case 'casos':
                return ((m1.casos || 0) - (m2.casos || 0)) * factor;
              case 'monto':
              case 'montoDebitado':
                return ((m1.montoDebitado || 0) - (m2.montoDebitado || 0)) * factor;
              case 'aceptados':
                return ((m1.aceptado || 0) - (m2.aceptado || 0)) * factor;
              case 'refacturados':
                return ((m1.refacturado || 0) - (m2.refacturado || 0)) * factor;
              case 'diferencia':
                return (((m1 as any).diferencia || 0) - ((m2 as any).diferencia || 0)) * factor;
              case 'ticket': {
                const t1 = (m1.casos && m1.casos > 0) ? (m1.montoDebitado / m1.casos) : 0;
                const t2 = (m2.casos && m2.casos > 0) ? (m2.montoDebitado / m2.casos) : 0;
                return (t1 - t2) * factor;
              }
              case 'recupero': {
                const r1 = m1.montoDebitado > 0 ? (m1.refacturado * 100 / m1.montoDebitado) : 0;
                const r2 = m2.montoDebitado > 0 ? (m2.refacturado * 100 / m2.montoDebitado) : 0;
                return (r1 - r2) * factor;
              }
              default:
                return 0;
            }
          });

          op.motivos = [...op.motivos];
        }
      }
    }

    // CASO 3: La menor categoría desplegada es Nivel 3 (Financiadores)
    if (hayMotivoDesplegado) {
      for (const op of this.operadoresDatos) {
        if (!op.expanded || !op.motivos) continue;
        for (const m of op.motivos) {
          if (!m.expanded || !m.financiadores || m.financiadores.length === 0) continue;
          m.financiadores.sort((f1, f2) => {
            switch (columna) {
              case 'operador':
              case 'motivo':
              case 'financiador':
                return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
              case 'documentos':
              case 'casos':
                return ((f1.casos || 0) - (f2.casos || 0)) * factor;
              case 'monto':
              case 'montoDebitado': {
                const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                return (mFin1 - mFin2) * factor;
              }
              case 'aceptados':
                return ((f1.aceptado || 0) - (f2.aceptado || 0)) * factor;
              case 'refacturados':
                return ((f1.refacturado || 0) - (f2.refacturado || 0)) * factor;
              case 'diferencia':
                return (((f1 as any).diferencia || 0) - ((f2 as any).diferencia || 0)) * factor;
              case 'ticket': {
                const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
                const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
                const tf1 = (f1.casos && f1.casos > 0) ? (mFin1 / f1.casos) : 0;
                const tf2 = (f2.casos && f2.casos > 0) ? (mFin2 / f2.casos) : 0;
                return (tf1 - tf2) * factor;
              }
              case 'recupero': {
                const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
                const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
                const rf1 = mFin1 > 0 ? ((f1.refacturado || 0) * 100 / mFin1) : 0;
                const rf2 = mFin2 > 0 ? ((f2.refacturado || 0) * 100 / mFin2) : 0;
                return (rf1 - rf2) * factor;
              }
              default:
                return 0;
            }
          });
          m.financiadores = [...m.financiadores];
        }
      }
    } else if (!hayOperadorDesplegado) {
      for (const op of this.operadoresDatos) {
        if (op.motivos) {
          for (const m of op.motivos) {
            if (m.financiadores && m.financiadores.length > 0) {
              m.financiadores.sort((f1, f2) => {
                switch (columna) {
                  case 'operador':
                  case 'motivo':
                  case 'financiador':
                    return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
                  case 'documentos':
                  case 'casos':
                    return ((f1.casos || 0) - (f2.casos || 0)) * factor;
                  case 'monto':
                  case 'montoDebitado': {
                    const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : (f1.monto || 0);
                    const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : (f2.monto || 0);
                    return (mFin1 - mFin2) * factor;
                  }
                  case 'aceptados':
                    return ((f1.aceptado || 0) - (f2.aceptado || 0)) * factor;
                  case 'refacturados':
                    return ((f1.refacturado || 0) - (f2.refacturado || 0)) * factor;
                  case 'ticket': {
                    const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
                    const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
                    const tf1 = (f1.casos && f1.casos > 0) ? (mFin1 / f1.casos) : 0;
                    const tf2 = (f2.casos && f2.casos > 0) ? (mFin2 / f2.casos) : 0;
                    return (tf1 - tf2) * factor;
                  }
                  case 'recupero': {
                    const mFin1 = f1.montoDebitado != null ? f1.montoDebitado : f1.monto;
                    const mFin2 = f2.montoDebitado != null ? f2.montoDebitado : f2.monto;
                    const rf1 = mFin1 > 0 ? ((f1.refacturado || 0) * 100 / mFin1) : 0;
                    const rf2 = mFin2 > 0 ? ((f2.refacturado || 0) * 100 / mFin2) : 0;
                    return (rf1 - rf2) * factor;
                  }
                  default:
                    return 0;
                }
              });
              m.financiadores = [...m.financiadores];
            }
          }
        }
      }
    }

    this.operadoresDatos = [...this.operadoresDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenOperadores(): void {
    const hayMotivoDesplegado = this.operadoresDatos.some(op =>
      op.expanded && op.motivos?.some(m => m.expanded)
    );
    const hayOperadorDesplegado = !hayMotivoDesplegado && this.operadoresDatos.some(op => op.expanded);

    if (hayMotivoDesplegado) {
      for (const op of this.operadoresDatos) {
        if (!op.expanded || !op.motivos) continue;
        for (const m of op.motivos) {
          if (!m.expanded || !m.financiadores) continue;
          m.financiadores.sort((f1, f2) => ((f1 as any)._originalIndex ?? 0) - ((f2 as any)._originalIndex ?? 0));
          m.financiadores = [...m.financiadores];
        }
      }
    } else if (hayOperadorDesplegado) {
      for (const op of this.operadoresDatos) {
        if (!op.expanded || !op.motivos) continue;
        op.motivos.sort((m1, m2) => ((m1 as any)._originalIndex ?? 0) - ((m2 as any)._originalIndex ?? 0));
        op.motivos = [...op.motivos];
      }
    } else {
      this.operadoresDatos.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
      for (const op of this.operadoresDatos) {
        if (op.motivos) {
          op.motivos.sort((m1, m2) => ((m1 as any)._originalIndex ?? 0) - ((m2 as any)._originalIndex ?? 0));
          for (const m of op.motivos) {
            if (m.financiadores) {
              m.financiadores.sort((f1, f2) => ((f1 as any)._originalIndex ?? 0) - ((f2 as any)._originalIndex ?? 0));
              m.financiadores = [...m.financiadores];
            }
          }
          op.motivos = [...op.motivos];
        }
      }
    }
    this.operadoresDatos = [...this.operadoresDatos];
    this.cdr.markForCheck();
  }

  operadorTieneCobertura(op: MetricaOperadorDTO, codigoCobertura?: string): boolean {
    const cod = (codigoCobertura || this.codigoCoberturaSeleccionada || 'TODAS').trim();
    if (!cod || cod === 'TODAS') return true;
    if (!op.motivos || op.motivos.length === 0) return false;
    return op.motivos.some(m =>
      m.financiadores && m.financiadores.some(f => this.coincideFinanciador(f.financiador, cod))
    );
  }

  get listaNombresOperadores(): string[] {
    let operadoresBase = this.operadoresDatos;
    if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
      operadoresBase = operadoresBase.filter(op => this.operadorTieneCobertura(op, this.codigoCoberturaSeleccionada));
    }
    const nombres = operadoresBase
      .map(o => o.operador)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b));
  }

  get operadoresFiltrados(): MetricaOperadorDTO[] {
    let lista = this.operadoresDatos;

    // 1. Filtrar por Búsqueda rápida de texto
    if (this.busquedaTextoOperador && this.busquedaTextoOperador.trim() !== '') {
      const term = this.busquedaTextoOperador.trim().toLowerCase();
      lista = lista.filter(o => (o.operador || '').toLowerCase().includes(term));
    }

    // 2. Filtrar por Operador seleccionado en dropdown
    if (this.filtroOperadorSeleccionado && this.filtroOperadorSeleccionado !== 'TODOS') {
      lista = lista.filter(o => o.operador === this.filtroOperadorSeleccionado);
    }

    // 3. Filtrar por Institución / Cobertura
    if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
      const codCob = this.codigoCoberturaSeleccionada;
      lista = lista
        .filter(op => this.operadorTieneCobertura(op, codCob))
        .map((op): MetricaOperadorDTO => {
          const motivosFiltrados: DesgloseMotivoDTO[] = [];
          for (const mot of (op.motivos || [])) {
            const finsFiltrados = (mot.financiadores || []).filter(f =>
              this.coincideFinanciador(f.financiador, codCob)
            );
            if (finsFiltrados.length === 0) continue;

            const casosMot = finsFiltrados.reduce((acc, f) => acc + (f.casos || 0), 0);
            const montoMot = finsFiltrados.reduce((acc, f) => acc + (f.monto || (f as any).montoDebitado || 0), 0);
            const aceptadoMot = finsFiltrados.reduce((acc, f) => acc + (f.aceptado || 0), 0);
            const refacturadoMot = finsFiltrados.reduce((acc, f) => acc + (f.refacturado || 0), 0);
            const difMot = montoMot - (aceptadoMot + refacturadoMot);

            motivosFiltrados.push({
              ...mot,
              expanded: !!mot.expanded,
              casos: casosMot,
              montoDebitado: montoMot,
              aceptado: aceptadoMot,
              refacturado: refacturadoMot,
              diferencia: difMot,
              financiadores: finsFiltrados
            });
          }

          const casosTotal = motivosFiltrados.reduce((acc, m) => acc + (m.casos || 0), 0);
          const aceptadosTotal = motivosFiltrados.reduce((acc, m) => acc + (m.aceptado || 0), 0);
          const refacturadosTotal = motivosFiltrados.reduce((acc, m) => acc + (m.refacturado || 0), 0);
          const montoTotal = motivosFiltrados.reduce((acc, m) => acc + (m.montoDebitado || 0), 0);
          const difTotal = montoTotal - (aceptadosTotal + refacturadosTotal);
          const ticketProm = casosTotal > 0 ? (montoTotal / casosTotal) : 0;
          const tasaRec = montoTotal > 0 ? (refacturadosTotal * 100 / montoTotal) : 0;

          return {
            ...op,
            expanded: !!op.expanded,
            cantidadRegistros: casosTotal > 0 ? casosTotal : op.cantidadRegistros,
            debitosAceptados: aceptadosTotal,
            debitosRefacturados: refacturadosTotal,
            totalTramitado: montoTotal,
            diferencia: difTotal,
            ticketPromedio: ticketProm,
            tasaRecupero: tasaRec,
            motivos: motivosFiltrados
          };
        });
    }

    return lista;
  }

  get totalPaginasOperadores(): number {
    const total = this.operadoresFiltrados.length;
    if (total === 0) return 1;
    return Math.ceil(total / this.operadoresItemsPorPagina) || 1;
  }

  get operadoresDatosPaginados(): MetricaOperadorDTO[] {
    const filtrados = this.operadoresFiltrados;
    if (!filtrados || filtrados.length === 0) return [];
    if (this.operadoresItemsPorPagina >= filtrados.length) return filtrados;
    const inicio = (this.operadoresPaginaActual - 1) * this.operadoresItemsPorPagina;
    return filtrados.slice(inicio, inicio + this.operadoresItemsPorPagina);
  }

  cambiarPaginaOperadores(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasOperadores) {
      this.operadoresPaginaActual = pagina;
      this.cdr.markForCheck();
      this.actualizarAlturasSticky();
    }
  }

  onOperadoresItemsPorPaginaChange(tamano: any): void {
    this.operadoresItemsPorPagina = Number(tamano) || 25;
    this.operadoresPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  onBusquedaTextoOperadorChange(): void {
    this.operadoresPaginaActual = 1;
    this.cdr.markForCheck();
    this.actualizarAlturasSticky();
  }

  limpiarFiltroOperador(): void {
    this.filtroOperadorSeleccionado = 'TODOS';
    this.operadoresPaginaActual = 1;
    this.actualizarAlturasSticky();
  }

  restablecerFiltrosOperadores(): void {
    this.filtroOperadorSeleccionado = 'TODOS';
    this.codigoCoberturaSeleccionada = 'TODAS';
    this.busquedaTextoOperador = '';
    this.operadoresPaginaActual = 1;
    this.actualizarAlturasSticky();
  }

  get tieneFiltroOperadorActivo(): boolean {
    const tieneTexto = !!(this.busquedaTextoOperador && this.busquedaTextoOperador.trim() !== '');
    const tieneCob = !!(this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS');
    const tieneDropdown = !!(this.filtroOperadorSeleccionado && this.filtroOperadorSeleccionado !== 'TODOS');
    return tieneTexto || tieneCob || tieneDropdown;
  }

  // ── Totales Consolidados Fila Superior Operadores (Usuario de Carga) ───────
  get totalCasosOperadores(): number {
    return (this.operadoresFiltrados || []).reduce((acc, op) => acc + (op.cantidadRegistros || 0), 0);
  }

  get totalMontoDebitadoOperadores(): number {
    return (this.operadoresFiltrados || []).reduce((acc, op) =>
      acc + (op.totalTramitado || (op.debitosAceptados + op.debitosRefacturados) || 0), 0);
  }

  get totalAceptadosOperadores(): number {
    return (this.operadoresFiltrados || []).reduce((acc, op) => acc + (op.debitosAceptados || 0), 0);
  }

  get totalRefacturadosOperadores(): number {
    return (this.operadoresFiltrados || []).reduce((acc, op) => acc + (op.debitosRefacturados || 0), 0);
  }

  get totalDiferenciaOperadores(): number {
    return (this.operadoresFiltrados || []).reduce((acc, op) => {
      const dif = op.diferencia != null
        ? op.diferencia
        : ((op.totalTramitado || ((op.debitosAceptados || 0) + (op.debitosRefacturados || 0))) - ((op.debitosAceptados || 0) + (op.debitosRefacturados || 0)));
      return acc + dif;
    }, 0);
  }

  get ticketPromedioGlobalOperadores(): number {
    const casos = this.totalCasosOperadores;
    return casos > 0 ? (this.totalMontoDebitadoOperadores / casos) : 0;
  }

  get tasaRecuperoGlobalOperadores(): number {
    const deb = this.totalMontoDebitadoOperadores;
    return deb > 0 ? ((this.totalRefacturadosOperadores * 100) / deb) : 0;
  }

  // ── Ordenamiento Trazabilidad ─────────────────────────────────────────────
  ordenarTrazabilidad(columna: string): void {
    if (this.columnaOrdenTrazabilidad === columna) {
      if (this.pasoOrdenTrazabilidad === 1) {
        this.pasoOrdenTrazabilidad = 2;
        this.direccionOrdenTrazabilidad = this.direccionOrdenTrazabilidad === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenTrazabilidad();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenTrazabilidad = '';
        this.pasoOrdenTrazabilidad = 0;
        this.restaurarOrdenTrazabilidad();
      }
    } else {
      this.columnaOrdenTrazabilidad = columna;
      this.pasoOrdenTrazabilidad = 1;
      this.direccionOrdenTrazabilidad = (columna === 'prestacion' || columna === 'financiador' || columna === 'medico') ? 'asc' : 'desc';
      this.aplicarOrdenTrazabilidad();
    }
  }

  aplicarOrdenTrazabilidad(): void {
    const factor = this.direccionOrdenTrazabilidad === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenTrazabilidad;

    this.trazabilidadDatos.sort((a, b) => {
      switch (columna) {
        case 'prestacion':
          return (a.idPrestacion || '').localeCompare(b.idPrestacion || '') * factor;
        case 'financiador':
          return (a.financiador || '').localeCompare(b.financiador || '') * factor;
        case 'medico':
          return (a.medico || '').localeCompare(b.medico || '') * factor;
        case 'facturado':
          return ((a.montoFacturadoOriginal || 0) - (b.montoFacturadoOriginal || 0)) * factor;
        case 'debitos':
          return ((a.totalDebitado || 0) - (b.totalDebitado || 0)) * factor;
        default:
          return 0;
      }
    });

    this.trazabilidadDatos = [...this.trazabilidadDatos];
    this.trazabilidadPaginaActual = 1;
    this.cdr.markForCheck();
  }

  restaurarOrdenTrazabilidad(): void {
    this.trazabilidadDatos.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
    this.trazabilidadDatos = [...this.trazabilidadDatos];
    this.trazabilidadPaginaActual = 1;
    this.cdr.markForCheck();
  }

  // ── Ordenamiento Resumen de Cartera y Balance Financiero ─────────────────
  ordenarBalance(columna: string): void {
    if (this.columnaOrdenBalance === columna) {
      if (this.pasoOrdenBalance === 1) {
        this.pasoOrdenBalance = 2;
        this.direccionOrdenBalance = this.direccionOrdenBalance === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenBalance();
      } else {
        // 3er click: deshacer ordenamiento
        this.columnaOrdenBalance = '';
        this.pasoOrdenBalance = 0;
        this.restaurarOrdenBalance();
      }
    } else {
      this.columnaOrdenBalance = columna;
      this.pasoOrdenBalance = 1;
      this.direccionOrdenBalance = columna === 'financiador' ? 'asc' : 'desc';
      this.aplicarOrdenBalance();
    }
  }

  aplicarOrdenBalance(): void {
    const factor = this.direccionOrdenBalance === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenBalance;

    this.balanceFinanciadores.sort((a, b) => {
      switch (columna) {
        case 'financiador':
          return (a.financiador || '').localeCompare(b.financiador || '') * factor;
        case 'facturacion':
          return ((a.facturacionFc || 0) - (b.facturacionFc || 0)) * factor;
        case 'incrementos':
          return ((a.incrementosNd || 0) - (b.incrementosNd || 0)) * factor;
        case 'debitos':
          return ((a.debitosNc || 0) - (b.debitosNc || 0)) * factor;
        case 'refacturado':
          return ((a.refacturadoNd || 0) - (b.refacturadoNd || 0)) * factor;
        case 'cobrado':
          return ((a.cobradoRc || 0) - (b.cobradoRc || 0)) * factor;
        case 'saldo':
          return ((a.saldoPendiente || 0) - (b.saldoPendiente || 0)) * factor;
        default:
          return 0;
      }
    });

    this.balanceFinanciadores = [...this.balanceFinanciadores];
    this.cdr.markForCheck();
  }

  restaurarOrdenBalance(): void {
    this.balanceFinanciadores.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
    this.balanceFinanciadores = [...this.balanceFinanciadores];
    this.cdr.markForCheck();
  }

  toggleMedico(medico: MetricaMedicoDTO): void {
    medico.expanded = !medico.expanded;
    const orig = this.medicosDatos.find(m => (m.medico || '').trim().toLowerCase() === (medico.medico || '').trim().toLowerCase());
    if (orig) {
      orig.expanded = medico.expanded;
    }
    this.actualizarAlturasSticky();
    this.cdr.markForCheck();
  }

  toggleOperador(operador: MetricaOperadorDTO): void {
    operador.expanded = !operador.expanded;
    const origOp = this.operadoresDatos.find(o => (o.operador || '').trim().toLowerCase() === (operador.operador || '').trim().toLowerCase());
    if (origOp) {
      origOp.expanded = operador.expanded;
    }
    this.actualizarAlturasSticky();
    this.cdr.markForCheck();
  }

  toggleMotivo(motivo: DesgloseMotivoDTO, actor?: MetricaMedicoDTO | MetricaOperadorDTO): void {
    motivo.expanded = !motivo.expanded;
    if (actor && 'medico' in actor) {
      const origMed = this.medicosDatos.find(m => (m.medico || '').trim().toLowerCase() === ((actor as MetricaMedicoDTO).medico || '').trim().toLowerCase());
      if (origMed?.motivos) {
        const origM = origMed.motivos.find(m => (m.motivo || '').trim().toLowerCase() === (motivo.motivo || '').trim().toLowerCase());
        if (origM) {
          origM.expanded = motivo.expanded;
        }
      }
    } else if (actor && 'operador' in actor) {
      const origOp = this.operadoresDatos.find(o => (o.operador || '').trim().toLowerCase() === ((actor as MetricaOperadorDTO).operador || '').trim().toLowerCase());
      if (origOp?.motivos) {
        const origM = origOp.motivos.find(m => (m.motivo || '').trim().toLowerCase() === (motivo.motivo || '').trim().toLowerCase());
        if (origM) {
          origM.expanded = motivo.expanded;
        }
      }
    } else {
      for (const med of this.medicosDatos) {
        if (med.motivos) {
          const origM = med.motivos.find(m => (m.motivo || '').trim().toLowerCase() === (motivo.motivo || '').trim().toLowerCase());
          if (origM) {
            origM.expanded = motivo.expanded;
          }
        }
      }
      for (const op of this.operadoresDatos) {
        if (op.motivos) {
          const origM = op.motivos.find(m => (m.motivo || '').trim().toLowerCase() === (motivo.motivo || '').trim().toLowerCase());
          if (origM) {
            origM.expanded = motivo.expanded;
          }
        }
      }
    }
    this.actualizarAlturasSticky();
    this.cdr.markForCheck();
  }

  trackByAnalista(index: number, item: MetricaAnalistaDTO): string {
    return item.analista;
  }

  trackByMedico(index: number, item: MetricaMedicoDTO): string {
    return item.medico;
  }

  trackByOperador(index: number, item: MetricaOperadorDTO): string {
    return item.operador;
  }

  trackByMotivo(index: number, item: DesgloseMotivoDTO): string {
    return item.motivo;
  }

  trackByFinanciadorAnalista(index: number, item: DesgloseFinanciadorDTO): string {
    return item.financiador;
  }

  // ── Ordenamiento de Distribución de Débitos por Causa / Motivo ───────────
  ordenarMotivos(columna: string): void {
    if (this.columnaOrdenMotivos === columna) {
      if (this.pasoOrdenMotivos === 1) {
        this.pasoOrdenMotivos = 2;
        this.direccionOrdenMotivos = this.direccionOrdenMotivos === 'asc' ? 'desc' : 'asc';
        this.aplicarOrdenMotivos();
      } else {
        // 3er click: restaurar orden original
        this.columnaOrdenMotivos = '';
        this.pasoOrdenMotivos = 0;
        this.restaurarOrdenMotivos();
      }
    } else {
      this.columnaOrdenMotivos = columna;
      this.pasoOrdenMotivos = 1;
      this.direccionOrdenMotivos = columna === 'motivo' ? 'asc' : 'desc';
      this.aplicarOrdenMotivos();
    }
  }

  aplicarOrdenMotivos(): void {
    const factor = this.direccionOrdenMotivos === 'asc' ? 1 : -1;
    const columna = this.columnaOrdenMotivos;

    this.motivosDebito.sort((a, b) => {
      switch (columna) {
        case 'motivo':
          return (a.motivo || '').localeCompare(b.motivo || '') * factor;
        case 'casos':
          return ((a.cantidadCasos || 0) - (b.cantidadCasos || 0)) * factor;
        case 'monto':
          return ((a.montoTotal || 0) - (b.montoTotal || 0)) * factor;
        case 'aceptados':
        case 'porcentajeAceptados':
          return ((a.porcentajeAceptados ?? 0) - (b.porcentajeAceptados ?? 0)) * factor;
        case 'refacturados':
        case 'porcentajeRefacturados':
          return ((a.porcentajeRefacturados ?? 0) - (b.porcentajeRefacturados ?? 0)) * factor;
        case 'porcentaje':
          return ((a.porcentaje || 0) - (b.porcentaje || 0)) * factor;
        default:
          return 0;
      }
    });
    this.motivosDebito = [...this.motivosDebito];
    this.calcularSlicesDonut();
    this.cdr.markForCheck();
  }

  restaurarOrdenMotivos(): void {
    this.motivosDebito.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
    this.motivosDebito = [...this.motivosDebito];
    this.calcularSlicesDonut();
    this.cdr.markForCheck();
  }

  // ===========================================================================
  // EXPORTACIÓN A EXCEL POR SOLAPA (10 SOLAPAS DEL TABLERO)
  // ===========================================================================

  private formatearFechaLegibleExport(fechaIso?: string): string {
    if (!fechaIso) return '';
    const partes = fechaIso.split('T')[0].split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fechaIso;
  }

  obtenerContextoFiltrosExportacion(solapaTitulo: string, filtrosLocalesTexto?: string): ContextoFiltroExportacion {
    let coberturaTexto = 'Todas las Instituciones';
    if (this.codigoCoberturaSeleccionada && this.codigoCoberturaSeleccionada !== 'TODAS') {
      const listaCob = this.solapaActiva === 'bucles' && this.coberturasBucles.length > 0
        ? this.coberturasBucles
        : this.coberturas;
      const cobObj = listaCob.find(c => c.codigo === this.codigoCoberturaSeleccionada);
      coberturaTexto = cobObj
        ? `${cobObj.codigo} - ${cobObj.nombre}`
        : this.codigoCoberturaSeleccionada;
    }

    const tipoComprobanteTexto = !this.esFiltroTipoDocDeshabilitado
      ? (this.tipoDocSeleccionado === 'TODOS' ? 'Todos los Tipos' : this.tipoDocSeleccionado)
      : undefined;

    let criterioFechaTexto = 'Período de Factura Madre';
    if (this.criterioFechaCc === 'fecha') {
      criterioFechaTexto = 'Fecha de Factura Madre';
    } else if (this.criterioFechaCc === 'analisis') {
      criterioFechaTexto = 'Fecha de Análisis de Débito';
    }

    const rangoFechasTexto = !this.esFiltroFechaDeshabilitado && (this.fechaDesde || this.fechaHasta)
      ? `${this.formatearFechaLegibleExport(this.fechaDesde)} al ${this.formatearFechaLegibleExport(this.fechaHasta)}`
      : undefined;

    return {
      solapaTitulo,
      coberturaTexto,
      tipoComprobanteTexto,
      criterioFechaTexto,
      rangoFechasTexto,
      filtrosLocalesTexto
    };
  }

  async exportarExcelTablero(): Promise<void> {
    if (this.exportandoExcel || (!this.balanceFinanciadores?.length && !this.totales)) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const ctx = this.obtenerContextoFiltrosExportacion('Tablero de Control y Balance Financiero');
      await this.excelExportService.exportarTableroControl(
        this.totales,
        this.balanceFinanciadores,
        this.totalesBalance,
        ctx
      );
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelCuentaCorriente(): Promise<void> {
    if (this.subSolapaCc === 'no-imputados') {
      await this.exportarExcelNoImputados();
    } else {
      await this.exportarExcelCuentaCorrienteImputados();
    }
  }

  async exportarExcelCuentaCorrienteImputados(): Promise<void> {
    if (this.exportandoExcel || !this.cuentaCorrienteDatos?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const ctx = this.obtenerContextoFiltrosExportacion('Cuenta Corriente — Imputados');
      await this.excelExportService.exportarCuentaCorrienteImputados(
        this.cuentaCorrienteDatos,
        {
          facturacion: this.totalFacturacionCc,
          incrementos: this.totalIncrementosCc,
          debitos: this.totalDebitosCc,
          refacturacion: this.totalRefacturacionCc,
          cobranzas: this.totalCobranzasCc,
          saldo: this.totalSaldoCc
        },
        ctx
      );
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelNoImputados(): Promise<void> {
    const lista = this.recibosNoImputadosFiltrados;
    if (this.exportandoExcel || !lista?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const extras: string[] = [];
      extras.push(this.filtrarFechasNoImputados ? 'Acotado al rango de fechas' : 'Histórico completo');
      if (this.busquedaTextoNoImputados?.trim()) {
        extras.push(`Búsqueda: "${this.busquedaTextoNoImputados.trim()}"`);
      }
      const ctx = this.obtenerContextoFiltrosExportacion(
        'Cuenta Corriente — Recibos No Imputados',
        extras.join(' | ')
      );
      await this.excelExportService.exportarCuentaCorrienteNoImputados(
        lista,
        this.totalMontoNoImputados,
        ctx
      );
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelTiemposCobranza(): Promise<void> {
    if (this.exportandoExcel || !this.tiemposCobranzaDatos?.detalles?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const ctx = this.obtenerContextoFiltrosExportacion('Tiempos de Cobranza (Aging de Deuda)');
      await this.excelExportService.exportarTiemposCobranza(this.tiemposCobranzaDatos, ctx);
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelMatriz(): Promise<void> {
    if (this.exportandoExcel || !this.matrizRecaudacion?.filas?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const ctx = this.obtenerContextoFiltrosExportacion(
        'Matriz Anual de Recaudación por Fecha Real de Recibo (RC)'
      );
      await this.excelExportService.exportarMatrizCobranzas(this.matrizRecaudacion, ctx);
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelMotivos(): Promise<void> {
    if (this.exportandoExcel || !this.motivosDebito?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const filtroLocal = this.categoriaMotivoSeleccionada !== 'TODAS'
        ? `Categoría: ${this.categoriaMotivoSeleccionada}`
        : undefined;
      const ctx = this.obtenerContextoFiltrosExportacion('Motivos de Débito y Refacturación', filtroLocal);
      await this.excelExportService.exportarMotivosDebito(
        this.motivosDebito,
        {
          totalDebitado: this.totalDebitadoMotivos,
          totalCasos: this.totalCasosAfectadosMotivos,
          debitoAceptado: this.debitoAceptadoPerdidaMotivos,
          tasaPerdida: this.tasaPerdidaMotivos,
          totalRefacturado: this.totalRefacturadoMotivos,
          tasaRecupero: this.tasaRecuperoMotivos,
          diferencia: this.diferenciaDebitadoVsRefacturado,
          tasaDiferencia: this.tasaDiferenciaMotivos,
          motivosIdentificados: this.motivosIdentificadosCount
        },
        ctx
      );
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelAnalistas(): Promise<void> {
    const lista = this.analistasFiltrados;
    if (this.exportandoExcel || !lista?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const filtroLocal = this.filtroAnalistaSeleccionado !== 'TODOS'
        ? `Analista: ${this.filtroAnalistaSeleccionado}`
        : undefined;
      const ctx = this.obtenerContextoFiltrosExportacion(
        'Desempeño y Gestión por Analista de Débito',
        filtroLocal
      );
      await this.excelExportService.exportarAnalistasDebito(
        lista,
        {
          financiadores: this.totalFinanciadoresAnalistas,
          casos: this.totalCasosAnalistas,
          montoDebitado: this.totalMontoDebitadoAnalistas,
          aceptados: this.totalAceptadosAnalistas,
          refacturados: this.totalRefacturadosAnalistas,
          diferencia: this.totalDiferenciaAnalistas
        },
        ctx
      );
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelBucles(): Promise<void> {
    if (this.exportandoExcel || !this.buclesDatos?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const ctx = this.obtenerContextoFiltrosExportacion('Auditoría de Bucles de Insistencia');
      await this.excelExportService.exportarBuclesInsistencia(this.buclesDatos, ctx);
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelOperadores(): Promise<void> {
    const lista = this.operadoresFiltrados;
    if (this.exportandoExcel || !lista?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const tipoLabel = this.tipoRegistroOperador === 'Internados'
        ? 'Operador Liquidación'
        : (this.tipoRegistroOperador === 'Todos' ? 'Operador Carga / Liquidación' : 'Operador Carga');
      const extras: string[] = [
        `Atención: ${this.tipoRegistroOperador} (${tipoLabel})`
      ];
      if (this.filtroOperadorSeleccionado !== 'TODOS') {
        extras.push(`Operador: ${this.filtroOperadorSeleccionado}`);
      }
      if (this.busquedaTextoOperador?.trim()) {
        extras.push(`Búsqueda: "${this.busquedaTextoOperador.trim()}"`);
      }
      const ctx = this.obtenerContextoFiltrosExportacion(
        `Desempeño por Usuarios de Carga (${this.tipoRegistroOperador})`,
        extras.length > 0 ? extras.join(' | ') : undefined
      );
      await this.excelExportService.exportarUsuariosCarga(
        lista,
        {
          casos: this.totalCasosOperadores,
          montoDebitado: this.totalMontoDebitadoOperadores,
          aceptados: this.totalAceptadosOperadores,
          refacturados: this.totalRefacturadosOperadores,
          diferencia: this.totalDiferenciaOperadores
        },
        ctx
      );
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelMedicos(): Promise<void> {
    const lista = this.medicosFiltrados;
    if (this.exportandoExcel || !lista?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const extras: string[] = [];
      if (this.filtroMedicoSeleccionado !== 'TODOS') {
        extras.push(`Médico: ${this.filtroMedicoSeleccionado}`);
      }
      if (this.busquedaTextoMedico?.trim()) {
        extras.push(`Búsqueda: "${this.busquedaTextoMedico.trim()}"`);
      }
      const ctx = this.obtenerContextoFiltrosExportacion(
        'Desempeño por Prestadores / Médicos',
        extras.length > 0 ? extras.join(' | ') : undefined
      );
      await this.excelExportService.exportarPrestadoresMedicos(
        lista,
        {
          motivos: this.totalMotivosMedicos,
          casos: this.totalCasosMedicos,
          montoDebitado: this.totalMontoDebitadoMedicos,
          aceptados: this.totalAceptadosMedicos,
          refacturados: this.totalRefacturadosMedicos,
          diferencia: this.totalDiferenciaMedicos
        },
        ctx
      );
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  cargarPrestaciones(pagina: number = 1): void {
    this.cargandoPrestaciones = true;
    this.errorCargaPrestaciones = null;
    this.prestacionesPaginaActual = Math.max(1, pagina);

    const fDesde = this.criterioFechaCc === 'fecha'
      ? (this.ccFechaDesde || this.fechaDesde || undefined)
      : (this.ccPeriodoDesde || this.fechaDesde || undefined);
    const fHasta = this.criterioFechaCc === 'fecha'
      ? (this.ccFechaHasta || this.fechaHasta || undefined)
      : (this.ccPeriodoHasta || this.fechaHasta || undefined);

    const codCob = this.codigoCoberturaSeleccionada === 'TODAS' ? undefined : this.codigoCoberturaSeleccionada;
    const tipoDoc = this.tipoDocSeleccionado === 'TODOS' ? undefined : this.tipoDocSeleccionado;

    this.directorioService.getPrestacionesFacturadas(
      codCob,
      tipoDoc,
      fDesde,
      fHasta,
      this.criterioFechaCc,
      this.filtroPrestacionTipoRegistro,
      this.filtroPrestacionMedico,
      this.filtroPrestacionCodigo,
      this.prestacionesPaginaActual - 1,
      this.prestacionesTamanioPagina,
      this.columnaOrdenPrestaciones || undefined,
      this.direccionOrdenPrestaciones
    ).pipe(takeUntil(this.destroy$), takeUntil(this.cancelarPeticionesEnVuelo$)).subscribe({
      next: (res) => {
        this.cargandoPrestaciones = false;
        if (res) {
          this.prestacionesDatos = res.items || [];
          this.prestacionesTotalRegistros = res.totalRegistros || 0;
          this.prestacionesTotalMonto = res.totalMontoFacturado || 0;
          this.prestacionesTotalMedicos = res.cantidadMedicos || 0;
          this.prestacionesTotalPacientes = res.cantidadPacientes || 0;
          this.prestacionesTotalPaginas = res.totalPaginas || 1;
        } else {
          this.prestacionesDatos = [];
          this.prestacionesTotalRegistros = 0;
          this.prestacionesTotalMonto = 0;
          this.prestacionesTotalMedicos = 0;
          this.prestacionesTotalPacientes = 0;
          this.prestacionesTotalPaginas = 1;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoPrestaciones = false;
        this.errorCargaPrestaciones = 'Error al cargar las prestaciones facturadas. Reintente más tarde.';
        console.error('Error al cargar prestaciones:', err);
        this.cdr.markForCheck();
      }
    });
  }

  cambiarPaginaPrestaciones(pagina: number): void {
    if (pagina < 1 || pagina > this.prestacionesTotalPaginas || pagina === this.prestacionesPaginaActual) return;
    this.cargarPrestaciones(pagina);
  }

  cambiarTamanioPaginaPrestaciones(tamanio: number): void {
    if (this.prestacionesTamanioPagina === tamanio) return;
    this.prestacionesTamanioPagina = tamanio;
    this.cargarPrestaciones(1);
  }

  onFiltroPrestacionTipoRegistroChange(): void {
    this.cargarPrestaciones(1);
  }

  ordenarPrestaciones(columna: string): void {
    if (this.columnaOrdenPrestaciones === columna) {
      if (this.pasoOrdenPrestaciones === 1) {
        this.pasoOrdenPrestaciones = 2;
        this.direccionOrdenPrestaciones = this.direccionOrdenPrestaciones === 'asc' ? 'desc' : 'asc';
      } else {
        // 3er click: deshacer ordenamiento y volver al orden natural
        this.columnaOrdenPrestaciones = '';
        this.pasoOrdenPrestaciones = 0;
      }
    } else {
      this.columnaOrdenPrestaciones = columna;
      this.pasoOrdenPrestaciones = 1;
      // Alfabéticas: asc por defecto; fechas, importes y cantidades: desc por defecto
      const esDescPorDefecto = (columna === 'fecha' || columna === 'importe' || columna === 'cantidad');
      this.direccionOrdenPrestaciones = esDescPorDefecto ? 'desc' : 'asc';
    }
    this.cargarPrestaciones(1);
  }

  // ── Filtro Médico: se aplica SOLO al seleccionar una sugerencia ─────────────
  // `textoMedicoInput` es el borrador que escribe el usuario; `filtroPrestacionMedico` es el filtro aplicado.
  onInputPrestacionMedico(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.textoMedicoInput = input ? input.value : '';
    this.cancelarBusquedaSugerenciasMedicos();
    this.sugerenciaMedicoActiva = -1;

    const q = this.textoMedicoInput.trim();
    if (q.length === 0) {
      // Campo vacío = quitar el filtro aplicado (si lo había)
      this.sugerenciasMedicosPrestaciones = [];
      this.mostrarSugerenciasMedicos = false;
      if (this.filtroPrestacionMedico) {
        this.filtroPrestacionMedico = '';
        this.cargarPrestaciones(1);
      }
      this.cdr.markForCheck();
      return;
    }
    if (q.length < 2) {
      this.sugerenciasMedicosPrestaciones = [];
      this.mostrarSugerenciasMedicos = false;
      this.cdr.markForCheck();
      return;
    }
    this.debounceSugerenciasMedicoTimer = setTimeout(() => this.buscarSugerenciasMedicos(q), 300);
  }

  private buscarSugerenciasMedicos(q: string): void {
    this.cargandoSugerenciasMedicos = true;
    this.sugerenciasMedicosPrestaciones = [];
    this.mostrarSugerenciasMedicos = true;
    this.cdr.markForCheck();
    const fDesde = this.criterioFechaCc === 'fecha' ? this.fechaDesde : this.ccPeriodoDesde;
    const fHasta = this.criterioFechaCc === 'fecha' ? this.fechaHasta : this.ccPeriodoHasta;
    this.sugerenciasMedicoSub = this.directorioService
      .getSugerenciasMedicos(q, this.codigoCoberturaSeleccionada, fDesde, fHasta, this.criterioFechaCc)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sugs) => {
          this.cargandoSugerenciasMedicos = false;
          this.sugerenciasMedicosPrestaciones = sugs || [];
          this.mostrarSugerenciasMedicos = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoSugerenciasMedicos = false;
          this.sugerenciasMedicosPrestaciones = [];
          this.mostrarSugerenciasMedicos = false;
          this.cdr.markForCheck();
        }
      });
  }

  private cancelarBusquedaSugerenciasMedicos(): void {
    if (this.debounceSugerenciasMedicoTimer) {
      clearTimeout(this.debounceSugerenciasMedicoTimer);
      this.debounceSugerenciasMedicoTimer = null;
    }
    if (this.sugerenciasMedicoSub) {
      this.sugerenciasMedicoSub.unsubscribe();
      this.sugerenciasMedicoSub = undefined;
    }
    this.cargandoSugerenciasMedicos = false;
  }

  onFocusMedico(): void {
    this.mostrarSugerenciasMedicos = this.sugerenciasMedicosPrestaciones.length > 0;
  }

  /** Al salir del campo sin elegir una opción, el texto vuelve al último filtro aplicado. */
  onBlurMedico(): void {
    this.cancelarBusquedaSugerenciasMedicos();
    this.mostrarSugerenciasMedicos = false;
    this.sugerenciasMedicosPrestaciones = [];
    this.sugerenciaMedicoActiva = -1;
    this.textoMedicoInput = this.filtroPrestacionMedico;
  }

  onKeydownMedico(event: KeyboardEvent): void {
    const n = this.sugerenciasMedicosPrestaciones.length;
    switch (event.key) {
      case 'ArrowDown':
        if (!this.mostrarSugerenciasMedicos || n === 0) return;
        event.preventDefault();
        this.sugerenciaMedicoActiva = (this.sugerenciaMedicoActiva + 1) % n;
        break;
      case 'ArrowUp':
        if (!this.mostrarSugerenciasMedicos || n === 0) return;
        event.preventDefault();
        this.sugerenciaMedicoActiva = this.sugerenciaMedicoActiva <= 0 ? n - 1 : this.sugerenciaMedicoActiva - 1;
        break;
      case 'Enter':
        if (this.mostrarSugerenciasMedicos && this.sugerenciaMedicoActiva >= 0 && this.sugerenciaMedicoActiva < n) {
          event.preventDefault();
          this.seleccionarSugerenciaMedico(this.sugerenciasMedicosPrestaciones[this.sugerenciaMedicoActiva]);
        }
        break;
      case 'Escape':
        if (this.mostrarSugerenciasMedicos) {
          event.preventDefault();
          this.mostrarSugerenciasMedicos = false;
          this.sugerenciaMedicoActiva = -1;
        }
        break;
    }
    this.cdr.markForCheck();
  }

  seleccionarSugerenciaMedico(med: string): void {
    this.cancelarBusquedaSugerenciasMedicos();
    this.filtroPrestacionMedico = med;
    this.textoMedicoInput = med;
    this.mostrarSugerenciasMedicos = false;
    this.sugerenciasMedicosPrestaciones = [];
    this.sugerenciaMedicoActiva = -1;
    this.cargarPrestaciones(1);
  }

  private reiniciarFiltroMedico(): void {
    this.cancelarBusquedaSugerenciasMedicos();
    this.filtroPrestacionMedico = '';
    this.textoMedicoInput = '';
    this.mostrarSugerenciasMedicos = false;
    this.sugerenciasMedicosPrestaciones = [];
    this.sugerenciaMedicoActiva = -1;
  }

  limpiarFiltroPrestacionMedico(): void {
    const habiaFiltro = !!this.filtroPrestacionMedico;
    this.reiniciarFiltroMedico();
    if (habiaFiltro) {
      this.cargarPrestaciones(1);
    }
  }

  // ── Filtro Prestación: se aplica SOLO al seleccionar una sugerencia ─────────
  // `textoPrestacionInput` es el borrador; `filtroPrestacionCodigo` es el filtro aplicado.
  onInputPrestacionCodigo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.textoPrestacionInput = input ? input.value : '';
    this.cancelarBusquedaSugerenciasPrestaciones();
    this.sugerenciaPrestacionActiva = -1;

    const q = this.textoPrestacionInput.trim();
    if (q.length === 0) {
      // Campo vacío = quitar el filtro aplicado (si lo había)
      this.sugerenciasCodigosPrestaciones = [];
      this.mostrarSugerenciasPrestaciones = false;
      if (this.filtroPrestacionCodigo) {
        this.filtroPrestacionCodigo = '';
        this.textoPrestacionAplicado = '';
        this.cargarPrestaciones(1);
      }
      this.cdr.markForCheck();
      return;
    }
    if (q.length < 2) {
      this.sugerenciasCodigosPrestaciones = [];
      this.mostrarSugerenciasPrestaciones = false;
      this.cdr.markForCheck();
      return;
    }
    this.debounceSugerenciasPrestacionTimer = setTimeout(() => this.buscarSugerenciasPrestaciones(q), 300);
  }

  private buscarSugerenciasPrestaciones(q: string): void {
    this.cargandoSugerenciasPrestaciones = true;
    this.sugerenciasCodigosPrestaciones = [];
    this.mostrarSugerenciasPrestaciones = true;
    this.cdr.markForCheck();
    const fDesde = this.criterioFechaCc === 'fecha' ? this.fechaDesde : this.ccPeriodoDesde;
    const fHasta = this.criterioFechaCc === 'fecha' ? this.fechaHasta : this.ccPeriodoHasta;
    this.sugerenciasPrestacionSub = this.directorioService
      .getSugerenciasPrestaciones(q, this.codigoCoberturaSeleccionada, fDesde, fHasta, this.criterioFechaCc)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sugs) => {
          this.cargandoSugerenciasPrestaciones = false;
          this.sugerenciasCodigosPrestaciones = sugs || [];
          this.mostrarSugerenciasPrestaciones = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoSugerenciasPrestaciones = false;
          this.sugerenciasCodigosPrestaciones = [];
          this.mostrarSugerenciasPrestaciones = false;
          this.cdr.markForCheck();
        }
      });
  }

  private cancelarBusquedaSugerenciasPrestaciones(): void {
    if (this.debounceSugerenciasPrestacionTimer) {
      clearTimeout(this.debounceSugerenciasPrestacionTimer);
      this.debounceSugerenciasPrestacionTimer = null;
    }
    if (this.sugerenciasPrestacionSub) {
      this.sugerenciasPrestacionSub.unsubscribe();
      this.sugerenciasPrestacionSub = undefined;
    }
    this.cargandoSugerenciasPrestaciones = false;
  }

  onFocusPrestacion(): void {
    this.mostrarSugerenciasPrestaciones = this.sugerenciasCodigosPrestaciones.length > 0;
  }

  /** Al salir del campo sin elegir una opción, el texto vuelve al último filtro aplicado. */
  onBlurPrestacion(): void {
    this.cancelarBusquedaSugerenciasPrestaciones();
    this.mostrarSugerenciasPrestaciones = false;
    this.sugerenciasCodigosPrestaciones = [];
    this.sugerenciaPrestacionActiva = -1;
    this.textoPrestacionInput = this.textoPrestacionAplicado;
  }

  onKeydownPrestacion(event: KeyboardEvent): void {
    const n = this.sugerenciasCodigosPrestaciones.length;
    switch (event.key) {
      case 'ArrowDown':
        if (!this.mostrarSugerenciasPrestaciones || n === 0) return;
        event.preventDefault();
        this.sugerenciaPrestacionActiva = (this.sugerenciaPrestacionActiva + 1) % n;
        break;
      case 'ArrowUp':
        if (!this.mostrarSugerenciasPrestaciones || n === 0) return;
        event.preventDefault();
        this.sugerenciaPrestacionActiva = this.sugerenciaPrestacionActiva <= 0 ? n - 1 : this.sugerenciaPrestacionActiva - 1;
        break;
      case 'Enter':
        if (this.mostrarSugerenciasPrestaciones && this.sugerenciaPrestacionActiva >= 0 && this.sugerenciaPrestacionActiva < n) {
          event.preventDefault();
          this.seleccionarSugerenciaPrestacion(this.sugerenciasCodigosPrestaciones[this.sugerenciaPrestacionActiva]);
        }
        break;
      case 'Escape':
        if (this.mostrarSugerenciasPrestaciones) {
          event.preventDefault();
          this.mostrarSugerenciasPrestaciones = false;
          this.sugerenciaPrestacionActiva = -1;
        }
        break;
    }
    this.cdr.markForCheck();
  }

  seleccionarSugerenciaPrestacion(item: { codigo: string; descripcion: string }): void {
    this.cancelarBusquedaSugerenciasPrestaciones();
    const codigo = (item.codigo || '').trim();
    const descripcion = (item.descripcion || '').trim();
    this.filtroPrestacionCodigo = codigo || descripcion;
    this.textoPrestacionAplicado = [codigo, descripcion].filter(t => !!t).join(' - ');
    this.textoPrestacionInput = this.textoPrestacionAplicado;
    this.mostrarSugerenciasPrestaciones = false;
    this.sugerenciasCodigosPrestaciones = [];
    this.sugerenciaPrestacionActiva = -1;
    this.cargarPrestaciones(1);
  }

  private reiniciarFiltroPrestacion(): void {
    this.cancelarBusquedaSugerenciasPrestaciones();
    this.filtroPrestacionCodigo = '';
    this.textoPrestacionAplicado = '';
    this.textoPrestacionInput = '';
    this.mostrarSugerenciasPrestaciones = false;
    this.sugerenciasCodigosPrestaciones = [];
    this.sugerenciaPrestacionActiva = -1;
  }

  limpiarFiltroPrestacionCodigo(): void {
    const habiaFiltro = !!this.filtroPrestacionCodigo;
    this.reiniciarFiltroPrestacion();
    if (habiaFiltro) {
      this.cargarPrestaciones(1);
    }
  }

  formatearComprobanteItem(item: DirectorioPrestacionItem): string {
    if (!item) return '-';
    const tipo = item.tipoDoc || 'FC';
    const letra = item.letraDoc || 'A';
    const ptovta = String(item.ptovtaDoc || 0).padStart(4, '0');
    const num = String(item.numeroDoc || 0).padStart(8, '0');
    return `${tipo} ${letra} ${ptovta}-${num}`;
  }

  limpiarTodosFiltrosPrestaciones(): void {
    this.filtroPrestacionTipoRegistro = 'TODOS';
    this.columnaOrdenPrestaciones = '';
    this.pasoOrdenPrestaciones = 0;
    this.reiniciarFiltroMedico();
    this.reiniciarFiltroPrestacion();
    this.cargarPrestaciones(1);
  }

  /** Calcula un período (YYYY-MM) sumando una cantidad determinada de meses. */
  calcularPeriodoMasMeses(periodoIso: string, mesesASumar: number): string {
    if (!periodoIso) return '';
    const parts = periodoIso.split('-');
    if (parts.length < 2) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(y) || isNaN(m)) return '';
    let targetYear = y;
    let targetMonth = m + mesesASumar;
    while (targetMonth > 12) {
      targetYear++;
      targetMonth -= 12;
    }
    while (targetMonth < 1) {
      targetYear--;
      targetMonth += 12;
    }
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  }

  /** Calcula la fecha límite (máximo 3 meses) a partir de una fecha ISO (YYYY-MM-DD). */
  calcularFechaMasTresMeses(fechaIso: string): string {
    if (!fechaIso) return '';
    const parts = fechaIso.split('-');
    if (parts.length < 3) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
    let targetYear = y;
    let targetMonth = m + 3;
    while (targetMonth > 12) {
      targetYear++;
      targetMonth -= 12;
    }
    const ultimoDiaMes = new Date(targetYear, targetMonth, 0).getDate();
    const targetDay = Math.min(d, ultimoDiaMes);
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
  }

  /** Calcula la fecha 3 meses anterior a partir de una fecha ISO (YYYY-MM-DD). */
  calcularFechaMenosTresMeses(fechaIso: string): string {
    if (!fechaIso) return '';
    const parts = fechaIso.split('-');
    if (parts.length < 3) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
    let targetYear = y;
    let targetMonth = m - 2; // Ventana de 3 meses inclusiva (ej: Octubre -> Agosto)
    while (targetMonth < 1) {
      targetYear--;
      targetMonth += 12;
    }
    const primerDia = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    return primerDia;
  }

  /** Evalúa si el rango de fechas actualmente filtrado en la pantalla supera los 3 meses. */
  superaTresMesesPrestaciones(): boolean {
    if (this.criterioFechaCc === 'fecha') {
      const fD = this.ccFechaDesde || this.fechaDesde;
      const fH = this.ccFechaHasta || this.fechaHasta;
      if (!fD || !fH) return false;
      const maxFecha = this.calcularFechaMasTresMeses(fD);
      return fH > maxFecha;
    } else {
      const pD = this.periodoMesDesde;
      const pH = this.periodoMesHasta;
      if (!pD || !pH) return false;
      const partsD = pD.split('-');
      const partsH = pH.split('-');
      if (partsD.length < 2 || partsH.length < 2) return false;
      const yD = parseInt(partsD[0], 10);
      const mD = parseInt(partsD[1], 10);
      const yH = parseInt(partsH[0], 10);
      const mH = parseInt(partsH[1], 10);
      if (isNaN(yD) || isNaN(mD) || isNaN(yH) || isNaN(mH)) return false;
      const cantMeses = (yH - yD) * 12 + (mH - mD) + 1;
      return cantMeses > 3;
    }
  }

  /** Abre la ventana modal para acotar el rango de exportación a un máximo de 3 meses. */
  abrirModalExportarPrestaciones(): void {
    this.modalExportCriterio = this.criterioFechaCc === 'fecha' ? 'fecha' : 'periodo';
    this.errorModalExport = null;

    if (this.modalExportCriterio === 'periodo') {
      const pDesde = this.periodoMesDesde;
      const pHasta = this.periodoMesHasta;
      this.modalExportOpcionesDesde = this.opcionesPeriodos
        .filter(opt => (!pDesde || opt.value >= pDesde) && (!pHasta || opt.value <= pHasta))
        .slice()
        .sort((a, b) => a.value.localeCompare(b.value));

      // Por defecto, sugerir la ventana de 3 meses más reciente que incluya los datos actuales
      const desdeIdeal = pHasta ? this.calcularPeriodoMasMeses(pHasta, -2) : pDesde;
      const desdeFinal = (desdeIdeal && (!pDesde || desdeIdeal >= pDesde)) ? desdeIdeal : pDesde;

      this.modalExportPeriodoDesde = desdeFinal || (this.modalExportOpcionesDesde[0]?.value || '');
      this.modalExportPeriodoHasta = pHasta || this.modalExportPeriodoDesde;
      this.actualizarOpcionesModalPeriodoHasta();
    } else {
      const fHasta = this.ccFechaHasta || this.fechaHasta;
      const fDesde = this.ccFechaDesde || this.fechaDesde;
      const fDesdeIdeal = fHasta ? this.calcularFechaMenosTresMeses(fHasta) : fDesde;
      this.modalExportFechaDesde = (fDesdeIdeal && (!fDesde || fDesdeIdeal >= fDesde)) ? fDesdeIdeal : fDesde;
      this.modalExportFechaHasta = fHasta;
      this.actualizarLimitesModalFechaHasta();
    }

    this.modalExportPrestacionesVisible = true;
    this.cdr.markForCheck();
  }

  /** Actualiza las opciones del selector 'Hasta' en el modal según el 'Desde' elegido (máximo 3 meses). */
  actualizarOpcionesModalPeriodoHasta(): void {
    if (!this.modalExportPeriodoDesde) return;
    const maxPeriodo3Meses = this.calcularPeriodoMasMeses(this.modalExportPeriodoDesde, 2);
    const topeGlobal = this.periodoMesHasta;
    const topeReal = (!topeGlobal || maxPeriodo3Meses < topeGlobal) ? maxPeriodo3Meses : topeGlobal;

    this.modalExportOpcionesHasta = this.opcionesPeriodos
      .filter(opt => opt.value >= this.modalExportPeriodoDesde && opt.value <= topeReal)
      .slice()
      .sort((a, b) => a.value.localeCompare(b.value));

    const existe = this.modalExportOpcionesHasta.some(opt => opt.value === this.modalExportPeriodoHasta);
    if (!existe || !this.modalExportPeriodoHasta) {
      const ultimo = this.modalExportOpcionesHasta[this.modalExportOpcionesHasta.length - 1];
      this.modalExportPeriodoHasta = ultimo ? ultimo.value : this.modalExportPeriodoDesde;
    }
  }

  onModalPeriodoDesdeChange(nuevoDesde?: string): void {
    if (nuevoDesde) {
      this.modalExportPeriodoDesde = nuevoDesde;
    }
    this.errorModalExport = null;
    this.actualizarOpcionesModalPeriodoHasta();
    this.cdr.markForCheck();
  }

  onModalPeriodoHastaChange(): void {
    this.errorModalExport = null;
    this.cdr.markForCheck();
  }

  /** Actualiza los límites del selector fecha 'Hasta' en el modal (máximo 3 meses). */
  actualizarLimitesModalFechaHasta(): void {
    if (!this.modalExportFechaDesde) return;
    this.modalExportFechaHastaMin = this.modalExportFechaDesde;
    const max3Meses = this.calcularFechaMasTresMeses(this.modalExportFechaDesde);
    const topeGlobal = this.ccFechaHasta || this.fechaHasta;
    this.modalExportFechaHastaMax = (topeGlobal && topeGlobal < max3Meses) ? topeGlobal : max3Meses;

    if (!this.modalExportFechaHasta ||
        this.modalExportFechaHasta < this.modalExportFechaHastaMin ||
        this.modalExportFechaHasta > this.modalExportFechaHastaMax) {
      this.modalExportFechaHasta = this.modalExportFechaHastaMax;
    }
  }

  onModalFechaDesdeChange(nuevaFecha?: string): void {
    if (nuevaFecha) {
      this.modalExportFechaDesde = nuevaFecha;
    }
    this.errorModalExport = null;
    this.actualizarLimitesModalFechaHasta();
    this.cdr.markForCheck();
  }

  onModalFechaHastaChange(): void {
    this.errorModalExport = null;
    if (this.modalExportFechaHastaMax && this.modalExportFechaHasta > this.modalExportFechaHastaMax) {
      this.modalExportFechaHasta = this.modalExportFechaHastaMax;
    } else if (this.modalExportFechaHastaMin && this.modalExportFechaHasta < this.modalExportFechaHastaMin) {
      this.modalExportFechaHasta = this.modalExportFechaHastaMin;
    }
    this.cdr.markForCheck();
  }

  cerrarModalExportarPrestaciones(): void {
    if (this.exportandoExcelModal) return;
    this.modalExportPrestacionesVisible = false;
    this.errorModalExport = null;
    this.cdr.markForCheck();
  }

  /** Confirma la exportación con el rango acotado de 3 meses sin alterar los filtros de la pantalla principal. */
  async confirmarExportacionModalPrestaciones(): Promise<void> {
    if (this.exportandoExcelModal) return;
    this.exportandoExcelModal = true;
    this.errorModalExport = null;
    this.cdr.markForCheck();

    try {
      let fDesde: string | undefined;
      let fHasta: string | undefined;
      let rangoFechasTexto: string = '';

      if (this.modalExportCriterio === 'periodo') {
        const optD = this.opcionesPeriodos.find(o => o.value === this.modalExportPeriodoDesde);
        const optH = this.opcionesPeriodos.find(o => o.value === this.modalExportPeriodoHasta);
        fDesde = optD ? optD.primerDiaIso : `${this.modalExportPeriodoDesde}-01`;
        fHasta = optH ? optH.ultimoDiaIso : this.calcularUltimoDiaMes(this.modalExportPeriodoHasta);
        rangoFechasTexto = `${optD ? optD.label : this.modalExportPeriodoDesde} al ${optH ? optH.label : this.modalExportPeriodoHasta}`;
      } else {
        fDesde = this.modalExportFechaDesde;
        fHasta = this.modalExportFechaHasta;
        rangoFechasTexto = `${this.formatearFechaLegibleExport(fDesde)} al ${this.formatearFechaLegibleExport(fHasta)}`;
      }

      const codCob = this.codigoCoberturaSeleccionada === 'TODAS' ? undefined : this.codigoCoberturaSeleccionada;
      const tipoDoc = this.tipoDocSeleccionado === 'TODOS' ? undefined : this.tipoDocSeleccionado;

      const res = await firstValueFrom(
        this.directorioService.getPrestacionesFacturadas(
          codCob,
          tipoDoc,
          fDesde,
          fHasta,
          this.modalExportCriterio,
          this.filtroPrestacionTipoRegistro,
          this.filtroPrestacionMedico,
          this.filtroPrestacionCodigo,
          0,
          10000,
          this.columnaOrdenPrestaciones || undefined,
          this.direccionOrdenPrestaciones
        )
      );

      const itemsParaExportar = res?.items || [];
      if (itemsParaExportar.length === 0) {
        this.errorModalExport = `No se encontraron prestaciones facturadas en el rango seleccionado (${rangoFechasTexto}). Por favor, seleccioná otro período.`;
        this.exportandoExcelModal = false;
        this.cdr.markForCheck();
        return;
      }

      const filtrosLocales: string[] = [];
      if (this.filtroPrestacionTipoRegistro !== 'TODOS') filtrosLocales.push(`Atención: ${this.filtroPrestacionTipoRegistro}`);
      if (this.filtroPrestacionMedico?.trim()) filtrosLocales.push(`Médico: "${this.filtroPrestacionMedico.trim()}"`);
      if (this.filtroPrestacionCodigo?.trim()) filtrosLocales.push(`Prestación: "${this.filtroPrestacionCodigo.trim()}"`);

      const ctx = this.obtenerContextoFiltrosExportacion(
        'Prestaciones Facturadas en Factura Madre',
        filtrosLocales.length > 0 ? filtrosLocales.join(' | ') : undefined
      );
      ctx.rangoFechasTexto = rangoFechasTexto;

      await this.excelExportService.exportarPrestacionesFacturadas(
        itemsParaExportar,
        {
          totalRegistros: res?.totalRegistros || itemsParaExportar.length,
          totalMonto: res?.totalMontoFacturado || 0,
          cantidadMedicos: res?.cantidadMedicos || 0,
          cantidadPacientes: res?.cantidadPacientes || 0
        },
        ctx
      );

      this.modalExportPrestacionesVisible = false;
    } catch (e) {
      console.error('Error al exportar prestaciones desde el modal:', e);
      this.errorModalExport = 'Ocurrió un error al generar el archivo Excel. Por favor, reintentá.';
    } finally {
      this.exportandoExcelModal = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelPrestaciones(): Promise<void> {
    if (this.exportandoExcel || this.prestacionesTotalRegistros === 0) return;
    if (!this.tieneFiltroLocalPrestaciones) return;

    if (this.superaTresMesesPrestaciones()) {
      this.abrirModalExportarPrestaciones();
      return;
    }

    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const fDesde = this.criterioFechaCc === 'fecha'
        ? (this.ccFechaDesde || this.fechaDesde || undefined)
        : (this.ccPeriodoDesde || this.fechaDesde || undefined);
      const fHasta = this.criterioFechaCc === 'fecha'
        ? (this.ccFechaHasta || this.fechaHasta || undefined)
        : (this.ccPeriodoHasta || this.fechaHasta || undefined);
      const codCob = this.codigoCoberturaSeleccionada === 'TODAS' ? undefined : this.codigoCoberturaSeleccionada;
      const tipoDoc = this.tipoDocSeleccionado === 'TODOS' ? undefined : this.tipoDocSeleccionado;

      let itemsParaExportar = this.prestacionesDatos;
      if (this.prestacionesTotalRegistros > this.prestacionesDatos.length) {
        const resFull = await firstValueFrom(
          this.directorioService.getPrestacionesFacturadas(
            codCob, tipoDoc, fDesde, fHasta, this.criterioFechaCc,
            this.filtroPrestacionTipoRegistro, this.filtroPrestacionMedico, this.filtroPrestacionCodigo,
            0, Math.min(10000, this.prestacionesTotalRegistros),
            this.columnaOrdenPrestaciones || undefined,
            this.direccionOrdenPrestaciones
          )
        );
        if (resFull && resFull.items && resFull.items.length > 0) {
          itemsParaExportar = resFull.items;
        }
      }

      const filtrosLocales: string[] = [];
      if (this.filtroPrestacionTipoRegistro !== 'TODOS') filtrosLocales.push(`Atención: ${this.filtroPrestacionTipoRegistro}`);
      if (this.filtroPrestacionMedico?.trim()) filtrosLocales.push(`Médico: "${this.filtroPrestacionMedico.trim()}"`);
      if (this.filtroPrestacionCodigo?.trim()) filtrosLocales.push(`Prestación: "${this.filtroPrestacionCodigo.trim()}"`);

      const ctx = this.obtenerContextoFiltrosExportacion(
        'Prestaciones Facturadas en Factura Madre',
        filtrosLocales.length > 0 ? filtrosLocales.join(' | ') : undefined
      );

      await this.excelExportService.exportarPrestacionesFacturadas(
        itemsParaExportar,
        {
          totalRegistros: this.prestacionesTotalRegistros,
          totalMonto: this.prestacionesTotalMonto,
          cantidadMedicos: this.prestacionesTotalMedicos,
          cantidadPacientes: this.prestacionesTotalPacientes
        },
        ctx
      );
    } catch (e) {
      console.error('Error al exportar prestaciones a Excel:', e);
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcelTrazabilidad(): Promise<void> {
    const lista = this.trazabilidadFiltrada;
    if (this.exportandoExcel || !lista?.length) return;
    this.exportandoExcel = true;
    this.cdr.markForCheck();
    try {
      const extras: string[] = [];
      if (this.filtroTrazabilidadLetra?.trim()) {
        extras.push(`Letra: ${this.filtroTrazabilidadLetra.trim().toUpperCase()}`);
      }
      if (this.filtroTrazabilidadPtoVta && this.filtroTrazabilidadPtoVta !== 'TODOS') {
        extras.push(`Pto. Venta: ${String(this.filtroTrazabilidadPtoVta).padStart(4, '0')}`);
      }
      if (this.filtroTrazabilidadNumero?.trim()) {
        extras.push(`Número: ${this.filtroTrazabilidadNumero.trim()}`);
      }
      const ctx = this.obtenerContextoFiltrosExportacion(
        'Detalle y Trazabilidad (Árbol Encadenado)',
        extras.length > 0 ? extras.join(' | ') : undefined
      );
      await this.excelExportService.exportarTrazabilidad(lista, ctx);
    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }
}
