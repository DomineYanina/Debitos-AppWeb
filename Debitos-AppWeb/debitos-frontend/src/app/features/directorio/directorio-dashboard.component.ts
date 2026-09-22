import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  registerables
} from 'chart.js';
import { DirectorioService } from '../../core/services/directorio.service';
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
  EventoTrazabilidadDTO,
  MetricaAnalistaDTO,
  MetricaMedicoDTO,
  MetricaOperadorDTO,
  DesempenoGlobalDTO,
  DesgloseMotivoDTO,
  DesgloseFinanciadorDTO,
  BalanceFinanciadorDTO,
  PuntoDonutDTO,
  TiemposCobranzaDTO
} from '../../core/models/directorio.model';

// Registro global de todos los módulos y controladores de Chart.js necesarios (doughnut, line, bar, etc.)
Chart.register(...registerables);


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
  styleUrl: './directorio-dashboard.component.css'
})
export class DirectorioDashboardComponent implements OnInit {
  private directorioService = inject(DirectorioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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
    | 'trazabilidad' = 'tablero';

  solapasCargadas = new Set<string>();

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
  ): void {
    this.solapaActiva = solapa;
    if (solapa === 'bucles') {
      this.tipoDocSeleccionado = 'TODOS';
      if (this.codigoCoberturaSeleccionada !== 'TODAS' && this.coberturasBucles.length > 0) {
        if (!this.coberturasBucles.some(c => c.codigo === this.codigoCoberturaSeleccionada)) {
          this.codigoCoberturaSeleccionada = 'TODAS';
        }
      }
    }
    this.cargarDatosSolapa(solapa);
    if (solapa === 'tablero' || solapa === 'tiempos-cobranza' || solapa === 'motivos') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }

  cargarDatosSolapa(solapa: string, forzarRecarga = false): void {
    if (!forzarRecarga && this.solapasCargadas.has(solapa)) {
      return;
    }
    this.solapasCargadas.add(solapa);

    switch (solapa) {
      case 'tablero':
        this.cargarBalanceFinanciero();
        this.cargarDistribucionCartera();
        this.cargarEvolucionMensual();
        break;
      case 'cuenta-corriente':
        this.cargarCuentaCorriente();
        break;
      case 'tiempos-cobranza':
        this.cargarAgingFinanciero();
        break;
      case 'matriz-cobranzas':
        this.cargarMatrizRecaudacion();
        break;
      case 'motivos':
        this.cargarParetoMotivos();
        break;
      case 'analistas':
      case 'medicos':
      case 'usuarios-carga':
        this.cargarDesempenoOperativo();
        this.solapasCargadas.add('analistas');
        this.solapasCargadas.add('medicos');
        this.solapasCargadas.add('usuarios-carga');
        break;
      case 'bucles':
        this.cargarBucles();
        break;
      case 'trazabilidad':
        this.cargarTrazabilidad();
        break;
    }
  }

  // Filtros
  coberturas: DirectorioCobertura[] = [];
  coberturasBucles: DirectorioCobertura[] = [];
  buclesTodos: CadenaTrazabilidadDTO[] = [];
  codigoCoberturaSeleccionada: string = 'TODAS';
  tiposDocumento: string[] = [];
  tipoDocSeleccionado: string = 'TODOS';
  fechaDesde: string = '';
  fechaHasta: string = '';

  get coberturasVisibles(): DirectorioCobertura[] {
    if (this.solapaActiva === 'bucles') {
      return this.coberturasBucles;
    }
    return this.coberturas;
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

  // Datos
  cuentaCorrienteDatos: CcFinanciadorDTO[] = [];
  columnaOrdenCc: string = '';
  direccionOrdenCc: 'asc' | 'desc' = 'desc';
  pasoOrdenCc: number = 0;

  matrizRecaudacion: MatrizRecaudacionDTO | null = null;
  columnaOrdenMatriz: string = '';
  direccionOrdenMatriz: 'asc' | 'desc' = 'desc';
  pasoOrdenMatriz: number = 0;

  trazabilidadDatos: CadenaTrazabilidadDTO[] = [];
  columnaOrdenTrazabilidad: string = '';
  direccionOrdenTrazabilidad: 'asc' | 'desc' = 'desc';
  pasoOrdenTrazabilidad: number = 0;

  buclesDatos: CadenaTrazabilidadDTO[] = [];
  columnaOrdenBucles: string = '';
  direccionOrdenBucles: 'asc' | 'desc' = 'desc';
  pasoOrdenBucles: number = 0;

  analistasDatos: MetricaAnalistaDTO[] = [];
  filtroAnalistaSeleccionado: string = 'TODOS';
  columnaOrdenAnalista: string = '';
  direccionOrdenAnalista: 'asc' | 'desc' = 'desc';
  pasoOrdenAnalista: number = 0;

  medicosDatos: MetricaMedicoDTO[] = [];
  columnaOrdenMedico: string = '';
  direccionOrdenMedico: 'asc' | 'desc' = 'desc';
  pasoOrdenMedico: number = 0;

  operadoresDatos: MetricaOperadorDTO[] = [];
  columnaOrdenOperador: string = '';
  direccionOrdenOperador: 'asc' | 'desc' = 'desc';
  pasoOrdenOperador: number = 0;
  balanceFinanciadores: BalanceFinanciadorDTO[] = [];
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
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          font: { size: 12, family: 'Inter, sans-serif' },
          padding: 14,
          boxWidth: 14
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
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(148,163,184,0.10)' }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (v) => '$ ' + Number(v).toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })
        },
        grid: { color: 'rgba(148,163,184,0.10)' }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: { size: 12, family: 'Inter, sans-serif' },
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

  /** Colores por rango: verde→azul→ámbar→rojo→rojo oscuro */
  private readonly COLORES_AGING = [
    '#059669',  // 0-30 días   (verde)
    '#2563eb',  // 31-60 días  (azul)
    '#b45309',  // 61-90 días  (naranja/ámbar)
    '#dc2626',  // 91-180 días (rojo)
    '#7f1d1d'   // +180 días   (rojo oscuro)
  ];

  tiemposCobranzaDatos: TiemposCobranzaDTO | null = null;

  agingChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      label: 'Saldo en Mora',
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
          label: ctx => ` Saldo en Mora: $${Number(ctx.raw).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        },
        grid: { display: false }
      },
      y: {
        ticks: {
          color: '#64748b',
          font: { size: 9 },
          callback: v => '$' + Math.round(Number(v) / 1000) + 'k'
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' }
      }
    }
  };

  // ── Pareto de Motivos / Glosas (Bar apilada) ────────────────────────────────

  motivosChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Refacturado',
        data: [],
        backgroundColor: '#2563eb',
        borderColor: '#1d4ed8',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Pérdida',
        data: [],
        backgroundColor: '#dc2626',
        borderColor: '#b91c1c',
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
        labels: {
          color: '#cbd5e1',
          font: { size: 12 },
          padding: 14,
          boxWidth: 14
        }
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: $ ${Number(ctx.raw).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          // El formato de moneda ahora va en el eje X (montos)
          callback: v => '$ ' + Number(v).toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })
        },
        grid: { color: 'rgba(148,163,184,0.10)' }
      },
      y: {
        stacked: true,
        ticks: {
          color: '#94a3b8',
          font: { size: 10 }
          // maxRotation y minRotation eliminados: los textos largos ya no necesitan rotarse
        },
        grid: { display: false }
      }
    }
  };

  ngOnInit(): void {
    this.inicializarFechasMesAnterior();
    this.cargarCoberturas();
    this.cargarTiposDocumento();
    this.precargarBucles();
    this.cargarDashboard();
  }

  // Establece por defecto el primer y último día del mes anterior
  inicializarFechasMesAnterior(): void {
    const hoy = new Date();
    const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    this.fechaDesde = this.formatearFechaIso(primerDiaMesAnterior);
    this.fechaHasta = this.formatearFechaIso(ultimoDiaMesAnterior);
  }

  formatearFechaIso(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  cargarCoberturas(): void {
    this.directorioService.obtenerCoberturas().subscribe({
      next: (data) => {
        this.coberturas = data || [];
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
        this.tiposDocumento = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error al cargar tipos de documento:', err)
    });
  }

  cargarDashboard(): void {
    this.solapasCargadas.clear();
    this.cargarTotales();
    this.cargarGrupos();
    this.cargarMotivos();
    this.cargarDatosSolapa(this.solapaActiva, true);
  }

  aplicarFiltros(): void {
    this.cargarDashboard();
  }

  irAlMesAnterior(): void {
    let baseDate = new Date();
    if (this.fechaDesde) {
      const parts = this.fechaDesde.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        baseDate = new Date(year, month, 1);
      }
    }

    const primerDiaMesAnterior = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(baseDate.getFullYear(), baseDate.getMonth(), 0);

    this.fechaDesde = this.formatearFechaIso(primerDiaMesAnterior);
    this.fechaHasta = this.formatearFechaIso(ultimoDiaMesAnterior);

    this.cargarDashboard();
  }

  restablecerFiltros(): void {
    this.filtroAnalistaSeleccionado = 'TODOS';
    this.columnaOrdenAnalista = '';
    this.pasoOrdenAnalista = 0;
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
    this.irAlMesAnterior();
  }

  cargarTotales(): void {
    this.cargandoTotales = true;
    this.directorioService.obtenerTotales(this.codigoCoberturaSeleccionada, this.tipoDocSeleccionado, this.fechaDesde, this.fechaHasta).subscribe({
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
    this.directorioService.obtenerGrupos(this.codigoCoberturaSeleccionada, this.tipoDocSeleccionado, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.gruposFacturas = (data || []).map(g => ({ ...g, expandido: false }));
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
    this.directorioService.obtenerMotivos(this.codigoCoberturaSeleccionada, this.tipoDocSeleccionado, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.motivosDebito = (data || []).map((m, idx) => ({
          ...m,
          color: this.paletaColores[idx % this.paletaColores.length]
        }));
        this.calcularSlicesDonut();
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

  formatearMoneda(valor?: number | null): string {
    if (valor === undefined || valor === null || isNaN(valor)) return '$ 0,00';
    return '$ ' + Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  obtenerTotalDebitadoGeneral(): number {
    return this.motivosDebito.reduce((acc, m) => acc + (m.montoTotal || 0), 0);
  }

  // ---------------------------------------------------------------------------
  // Métricas y Contadores - Solapa Motivos de Débito y Refacturación
  // ---------------------------------------------------------------------------

  get totalDebitadoMotivos(): number {
    if (this.totales?.totalDebitosNc && this.totales.totalDebitosNc > 0) {
      return this.totales.totalDebitosNc;
    }
    return this.obtenerTotalDebitadoGeneral() || 0;
  }

  get totalCasosAfectadosMotivos(): number {
    return (this.motivosDebito || []).reduce((acc, m) => acc + (m.cantidadCasos || 0), 0);
  }

  get totalRefacturadoMotivos(): number {
    return this.totales?.totalRefacturacionNd || 0;
  }

  get debitoAceptadoPerdidaMotivos(): number {
    if (this.totales?.perdidaAsumida && this.totales.perdidaAsumida > 0) {
      return this.totales.perdidaAsumida;
    }
    const deb = this.totalDebitadoMotivos;
    const ref = this.totalRefacturadoMotivos;
    return Math.max(0, deb - ref);
  }

  get tasaPerdidaMotivos(): number {
    const deb = this.totalDebitadoMotivos;
    if (!deb || deb <= 0) return 0;
    const perdida = this.debitoAceptadoPerdidaMotivos;
    return Math.min(100, Math.max(0, Math.round((perdida / deb) * 100)));
  }

  get tasaRecuperoMotivos(): number {
    if (this.totales?.tasaRecupero !== undefined && this.totales?.tasaRecupero !== null && this.totales.tasaRecupero > 0) {
      return Math.round(this.totales.tasaRecupero);
    }
    const deb = this.totalDebitadoMotivos;
    if (!deb || deb <= 0) return 0;
    const ref = this.totalRefacturadoMotivos;
    return Math.min(100, Math.max(0, Math.round((ref / deb) * 100)));
  }

  get motivosIdentificadosCount(): number {
    return (this.motivosDebito || []).length;
  }

  formatearMontoContador(monto?: number | null): string {
    if (!monto || monto <= 0 || isNaN(monto)) return '$0';
    return '$' + Math.round(monto).toLocaleString('es-AR');
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
    if (!this.directorioService.getCarteraDonut) return;
    this.iniciarCargaGrafico();
    this.directorioService.getCarteraDonut().subscribe({
      next: (puntos: PuntoDonutDTO[]) => {
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
        this.finalizarCargaGrafico();
      },
      error: (err) => {
        console.error('Error al cargar distribución de cartera:', err);
        this.finalizarCargaGrafico();
      }
    });
  }

  cargarBalanceFinanciero(): void {
    if (!this.directorioService.getBalanceFinanciero) return;
    this.cargandoBalance = true;
    this.directorioService.getBalanceFinanciero().subscribe({
      next: (data: BalanceFinanciadorDTO[]) => {
        this.balanceFinanciadores = data || [];
        this.calcularTotalesBalance();
        this.cargandoBalance = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar balance financiero:', err);
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
    this.iniciarCargaGrafico();
    this.directorioService.getEvolucionMensual().subscribe({
      next: (datasets: DatasetGraficoDTO[]) => {
        if (!datasets || datasets.length < 3) {
          this.finalizarCargaGrafico();
          return;
        }

        // Los 3 datasets llegan en orden: [0]=Facturación, [1]=Débitos, [2]=Cobranzas
        const labels = datasets[0].puntos.map(p => p.etiqueta);

        this.evolucionChartData = {
          labels,
          datasets: [
            {
              label: 'Facturación',
              data: datasets[0].puntos.map(p => Number(p.valor)),
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
              data: datasets[1].puntos.map(p => Number(p.valor)),
              borderColor: '#f87171',
              backgroundColor: 'rgba(248,113,113,0.08)',
              fill: false,
              tension: 0.4,
              borderDash: [6, 3],
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            },
            {
              label: 'Cobranzas (RC)',
              data: datasets[2].puntos.map(p => Number(p.valor)),
              borderColor: '#34d399',
              backgroundColor: 'rgba(52,211,153,0.10)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            }
          ]
        };
        this.finalizarCargaGrafico();
      },
      error: (err) => {
        console.error('Error al cargar evolución mensual:', err);
        this.finalizarCargaGrafico();
      }
    });
  }

  private cargarAgingFinanciero(): void {
    if (!this.directorioService.getTiemposCobranza) return;
    this.iniciarCargaGrafico();
    this.directorioService.getTiemposCobranza().subscribe({
      next: (res: TiemposCobranzaDTO) => {
        this.tiemposCobranzaDatos = res;
        const detalles = res?.detalles ?? [];
        this.agingChartData = {
          labels: detalles.map(d => d.rango),
          datasets: [{
            label: 'Saldo en Mora',
            data: detalles.map(d => Number(d.saldoEnMora)),
            backgroundColor: this.COLORES_AGING.slice(0, detalles.length),
            borderRadius: 4,
            maxBarThickness: 75
          }]
        };
        this.finalizarCargaGrafico();
      },
      error: (err) => {
        console.error('Error al cargar tiempos de cobranza:', err);
        this.finalizarCargaGrafico();
      }
    });
  }

  private cargarParetoMotivos(): void {
    if (!this.directorioService.getParetoMotivos) return;
    this.iniciarCargaGrafico();
    const codCob = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;
    const tipoDoc = this.tipoDocSeleccionado !== 'TODOS' ? this.tipoDocSeleccionado : undefined;

    this.directorioService.getParetoMotivos(codCob, tipoDoc, this.fechaDesde, this.fechaHasta).subscribe({
      next: (datasets: DatasetGraficoDTO[]) => {
        if (!datasets || datasets.length < 2 || !datasets[0]?.puntos?.length) {
          this.motivosChartData = {
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
                backgroundColor: '#dc2626',
                borderColor: '#b91c1c',
                borderWidth: 1,
                borderRadius: 4
              }
            ]
          };
          this.finalizarCargaGrafico();
          return;
        }

        // [0] = Refacturado, [1] = Pérdida — comparten las mismas etiquetas (motivos)
        const labels = datasets[0].puntos.map(p => p.etiqueta);
        this.motivosChartData = {
          labels,
          datasets: [
            {
              label: 'Refacturado ($)',
              data: datasets[0].puntos.map(p => Number(p.valor)),
              backgroundColor: '#2563eb',
              borderColor: '#1d4ed8',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Pérdida ($)',
              data: datasets[1].puntos.map(p => Number(p.valor)),
              backgroundColor: '#dc2626',
              borderColor: '#b91c1c',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        };
        this.finalizarCargaGrafico();
      },
      error: (err) => {
        console.error('Error al cargar pareto de motivos:', err);
        this.motivosChartData = { labels: [], datasets: [] };
        this.finalizarCargaGrafico();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Cuenta Corriente a 3 Niveles
  // ---------------------------------------------------------------------------

  cargarCuentaCorriente(): void {
    if (!this.directorioService.getCuentaCorrienteTresNiveles) return;
    this.cargandoCuentaCorriente = true;
    const financiador = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;

    this.directorioService.getCuentaCorrienteTresNiveles(financiador).subscribe({
      next: (data) => {
        this.cuentaCorrienteDatos = (data || []).map((f, idxF) => ({
          ...f,
          _originalIndex: idxF,
          expanded: false,
          periodos: (f.periodos || []).map((p, idxP) => ({
            ...p,
            _originalIndex: idxP,
            expanded: false,
            comprobantes: (p.comprobantes || []).map((c, idxC) => ({
              ...c,
              _originalIndex: idxC,
              hijos: (c.hijos || []).map((h, idxH) => ({
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
  }

  togglePeriodo(p: CcPeriodoDTO): void {
    p.expanded = !p.expanded;
  }

  toggleFactura(fc: CcComprobanteDTO): void {
    fc.expanded = !fc.expanded;
  }

  expandirTodosCuentaCorriente(expandir: boolean): void {
    this.cuentaCorrienteDatos.forEach(f => {
      f.expanded = expandir;
      f.periodos?.forEach(p => {
        p.expanded = expandir;
        p.comprobantes?.forEach(fc => fc.expanded = expandir);
      });
    });
  }

  obtenerBadgeClase(tipo: string): string {
    if (!tipo) return 'badge-fc';
    const t = tipo.trim().toUpperCase();
    if (t.startsWith('FC') || t.startsWith('FAC')) return 'badge-fc';
    if (t.startsWith('NC')) return 'badge-nc';
    if (t.startsWith('ND')) return 'badge-nd';
    if (t.startsWith('RC') || t.startsWith('REC')) return 'badge-rc';
    return 'badge-fc';
  }

  trackByFinanciador(index: number, item: CcFinanciadorDTO): string { return item.financiador; }
  trackByPeriodo(index: number, item: CcPeriodoDTO): string { return item.periodo; }
  trackByComprobante(index: number, item: CcComprobanteDTO): string { return item.comprobante; }

  // ---------------------------------------------------------------------------
  // Matriz Anual de Recaudación
  // ---------------------------------------------------------------------------

  cargarMatrizRecaudacion(anio?: number): void {
    if (!this.directorioService.getMatrizRecaudacion) return;
    this.cargandoMatriz = true;
    const anioConsulta = anio ?? this.matrizRecaudacion?.anioSeleccionado;
    const financiador = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;

    this.directorioService.getMatrizRecaudacion(anioConsulta, financiador).subscribe({
      next: (data) => {
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

  cargarTrazabilidad(): void {
    if (!this.directorioService.getTrazabilidad) return;
    this.cargandoTrazabilidad = true;
    const financiador = this.codigoCoberturaSeleccionada !== 'TODAS' ? this.codigoCoberturaSeleccionada : undefined;

    this.directorioService.getTrazabilidad(financiador, undefined, undefined, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.trazabilidadDatos = (data || []).map((c, idx) => ({
          ...c,
          _originalIndex: idx,
          expanded: false
        }));
        if (this.columnaOrdenTrazabilidad) {
          this.aplicarOrdenTrazabilidad();
        }
        this.cargandoTrazabilidad = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar trazabilidad:', err);
        this.cargandoTrazabilidad = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleCadena(cadena: CadenaTrazabilidadDTO): void {
    cadena.expanded = !cadena.expanded;
  }

  trackByCadena(index: number, item: CadenaTrazabilidadDTO): string {
    return item.idPrestacion;
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
    this.directorioService.getBuclesInsistencia(undefined, undefined, undefined, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        const chains = (data || []).map(c => ({
          ...c,
          expanded: false
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

    if (this.columnaOrdenBucles) {
      this.aplicarOrdenBucles();
    }
  }

  cargarBucles(): void {
    if (!this.directorioService.getBuclesInsistencia) return;
    this.cargandoBucles = true;

    this.directorioService.getBuclesInsistencia(undefined, undefined, undefined, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        const chains = (data || []).map((c, idx) => ({
          ...c,
          _originalIndex: idx,
          expanded: false
        }));
        this.buclesTodos = chains;
        this.actualizarCoberturasBucles(chains);
        this.filtrarBuclesLocales();
        this.cargandoBucles = false;
        this.cdr.markForCheck();
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

  cargarDesempenoOperativo(): void {
    if (!this.directorioService.getDesempenoGlobal) return;
    this.cargandoAnalistas = true;
    this.cargandoMedicos = true;
    this.cargandoOperadores = true;
    const periodo = (this.fechaDesde && this.fechaHasta) ? this.fechaDesde.substring(0, 7) : undefined;

    this.directorioService.getDesempenoGlobal(periodo, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.analistasDatos = (data?.analistas || []).map((a, idxA) => ({
          ...a,
          _originalIndex: idxA,
          expanded: false,
          motivos: (a.motivos || []).map((m, idxM) => ({
            ...m,
            _originalIndex: idxM,
            expanded: false,
            financiadores: (m.financiadores || []).map((f, idxF) => ({
              ...f,
              _originalIndex: idxF
            }))
          }))
        }));

        if (this.filtroAnalistaSeleccionado !== 'TODOS' &&
            !this.analistasDatos.some(a => a.analista === this.filtroAnalistaSeleccionado)) {
          this.filtroAnalistaSeleccionado = 'TODOS';
        }

        if (this.columnaOrdenAnalista) {
          this.aplicarOrdenAnalistas();
        }

        this.medicosDatos = (data?.medicos || []).map((med, idxMed) => ({
          ...med,
          _originalIndex: idxMed,
          expanded: false,
          motivos: (med.motivos || []).map((m, idxM) => ({
            ...m,
            _originalIndex: idxM,
            expanded: false,
            financiadores: (m.financiadores || []).map((f, idxF) => ({
              ...f,
              _originalIndex: idxF
            }))
          }))
        }));

        if (this.columnaOrdenMedico) {
          this.aplicarOrdenMedicos();
        }

        this.operadoresDatos = (data?.operadores || []).map((op, idxOp) => ({
          ...op,
          _originalIndex: idxOp,
          expanded: false,
          motivos: (op.motivos || []).map((m, idxM) => ({
            ...m,
            _originalIndex: idxM,
            expanded: false,
            financiadores: (m.financiadores || []).map((f, idxF) => ({
              ...f,
              _originalIndex: idxF
            }))
          }))
        }));

        if (this.columnaOrdenOperador) {
          this.aplicarOrdenOperadores();
        }

        this.cargandoAnalistas = false;
        this.cargandoMedicos = false;
        this.cargandoOperadores = false;
        this.cdr.markForCheck();
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

    this.analistasDatos.sort((a, b) => {
      switch (columna) {
        case 'analista':
          return (a.analista || '').localeCompare(b.analista || '') * factor;
        case 'documentos':
          return ((a.cantidadRegistros || 0) - (b.cantidadRegistros || 0)) * factor;
        case 'aceptados':
          return ((a.debitosAceptados || 0) - (b.debitosAceptados || 0)) * factor;
        case 'refacturados':
          return ((a.debitosRefacturados || 0) - (b.debitosRefacturados || 0)) * factor;
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

    for (const a of this.analistasDatos) {
      if (a.motivos && a.motivos.length > 0) {
        a.motivos.sort((m1, m2) => {
          switch (columna) {
            case 'analista':
              return (m1.motivo || '').localeCompare(m2.motivo || '') * factor;
            case 'documentos':
              return ((m1.casos || 0) - (m2.casos || 0)) * factor;
            case 'aceptados':
              return ((m1.aceptado || 0) - (m2.aceptado || 0)) * factor;
            case 'refacturados':
              return ((m1.refacturado || 0) - (m2.refacturado || 0)) * factor;
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

        for (const m of a.motivos) {
          if (m.financiadores && m.financiadores.length > 0) {
            m.financiadores.sort((f1, f2) => {
              switch (columna) {
                case 'analista':
                  return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
                case 'documentos':
                  return ((f1.casos || 0) - (f2.casos || 0)) * factor;
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
        a.motivos = [...a.motivos];
      }
    }
    this.analistasDatos = [...this.analistasDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenAnalistas(): void {
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

    this.medicosDatos.sort((a, b) => {
      switch (columna) {
        case 'medico':
          return (a.medico || '').localeCompare(b.medico || '') * factor;
        case 'documentos':
          return ((a.cantidadRegistros || 0) - (b.cantidadRegistros || 0)) * factor;
        case 'aceptados':
          return ((a.debitosAceptados || 0) - (b.debitosAceptados || 0)) * factor;
        case 'refacturados':
          return ((a.debitosRefacturados || 0) - (b.debitosRefacturados || 0)) * factor;
        case 'ticket':
          return ((a.ticketPromedio || 0) - (b.ticketPromedio || 0)) * factor;
        case 'recupero':
          return ((a.tasaRecupero || 0) - (b.tasaRecupero || 0)) * factor;
        default:
          return 0;
      }
    });

    for (const med of this.medicosDatos) {
      if (med.motivos && med.motivos.length > 0) {
        med.motivos.sort((m1, m2) => {
          switch (columna) {
            case 'medico':
              return (m1.motivo || '').localeCompare(m2.motivo || '') * factor;
            case 'documentos':
              return ((m1.casos || 0) - (m2.casos || 0)) * factor;
            case 'aceptados':
              return ((m1.aceptado || 0) - (m2.aceptado || 0)) * factor;
            case 'refacturados':
              return ((m1.refacturado || 0) - (m2.refacturado || 0)) * factor;
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

        for (const m of med.motivos) {
          if (m.financiadores && m.financiadores.length > 0) {
            m.financiadores.sort((f1, f2) => {
              switch (columna) {
                case 'medico':
                  return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
                case 'documentos':
                  return ((f1.casos || 0) - (f2.casos || 0)) * factor;
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
        med.motivos = [...med.motivos];
      }
    }
    this.medicosDatos = [...this.medicosDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenMedicos(): void {
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
    this.medicosDatos = [...this.medicosDatos];
    this.cdr.markForCheck();
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

    // 1. Ordenar Nivel 1: Operadores
    this.operadoresDatos.sort((a, b) => {
      switch (columna) {
        case 'operador':
          return (a.operador || '').localeCompare(b.operador || '') * factor;
        case 'documentos':
          return ((a.cantidadRegistros || 0) - (b.cantidadRegistros || 0)) * factor;
        case 'aceptados':
          return ((a.debitosAceptados || 0) - (b.debitosAceptados || 0)) * factor;
        case 'refacturados':
          return ((a.debitosRefacturados || 0) - (b.debitosRefacturados || 0)) * factor;
        case 'ticket':
          return ((a.ticketPromedio || 0) - (b.ticketPromedio || 0)) * factor;
        case 'recupero':
          return ((a.tasaRecupero || 0) - (b.tasaRecupero || 0)) * factor;
        default:
          return 0;
      }
    });

    // 2. Ordenar Nivel 2: Motivos y Nivel 3: Financiadores dentro de cada operador
    for (const op of this.operadoresDatos) {
      if (op.motivos && op.motivos.length > 0) {
        op.motivos.sort((m1, m2) => {
          switch (columna) {
            case 'operador':
              return (m1.motivo || '').localeCompare(m2.motivo || '') * factor;
            case 'documentos':
              return ((m1.casos || 0) - (m2.casos || 0)) * factor;
            case 'aceptados':
              return ((m1.aceptado || 0) - (m2.aceptado || 0)) * factor;
            case 'refacturados':
              return ((m1.refacturado || 0) - (m2.refacturado || 0)) * factor;
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

        // Nivel 3: Financiadores
        for (const m of op.motivos) {
          if (m.financiadores && m.financiadores.length > 0) {
            m.financiadores.sort((f1, f2) => {
              switch (columna) {
                case 'operador':
                  return (f1.financiador || '').localeCompare(f2.financiador || '') * factor;
                case 'documentos':
                  return ((f1.casos || 0) - (f2.casos || 0)) * factor;
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
        op.motivos = [...op.motivos];
      }
    }

    this.operadoresDatos = [...this.operadoresDatos];
    this.cdr.markForCheck();
  }

  restaurarOrdenOperadores(): void {
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
    this.operadoresDatos = [...this.operadoresDatos];
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  restaurarOrdenTrazabilidad(): void {
    this.trazabilidadDatos.sort((a, b) => ((a as any)._originalIndex ?? 0) - ((b as any)._originalIndex ?? 0));
    this.trazabilidadDatos = [...this.trazabilidadDatos];
    this.cdr.markForCheck();
  }

  toggleMedico(medico: MetricaMedicoDTO): void {
    medico.expanded = !medico.expanded;
  }

  toggleOperador(operador: MetricaOperadorDTO): void {
    operador.expanded = !operador.expanded;
  }

  toggleMotivo(motivo: DesgloseMotivoDTO): void {
    motivo.expanded = !motivo.expanded;
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
}
