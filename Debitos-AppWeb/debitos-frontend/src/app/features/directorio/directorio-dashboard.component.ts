import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DirectorioService } from '../../core/services/directorio.service';
import {
  DirectorioCobertura,
  DirectorioGrupoFactura,
  DirectorioMotivoDebito,
  DirectorioTotales
} from '../../core/models/directorio.model';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './directorio-dashboard.component.html',
  styleUrl: './directorio-dashboard.component.css'
})
export class DirectorioDashboardComponent implements OnInit {
  private directorioService = inject(DirectorioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Filtros
  coberturas: DirectorioCobertura[] = [];
  codigoCoberturaSeleccionada: string = 'TODAS';
  tiposDocumento: string[] = [];
  tipoDocSeleccionado: string = 'TODOS';
  fechaDesde: string = '';
  fechaHasta: string = '';

  // Estados de carga
  cargandoTotales: boolean = false;
  cargandoGrupos: boolean = false;
  cargandoMotivos: boolean = false;

  // Datos
  totales: DirectorioTotales = {
    totalFacturado: 0,
    cobranzaEfectiva: 0,
    perdidaAsumida: 0,
    deudaNeta: 0,
    cantidadFacturas: 0,
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

  ngOnInit(): void {
    this.inicializarFechasMesAnterior();
    this.cargarCoberturas();
    this.cargarTiposDocumento();
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
    this.cargarTotales();
    this.cargarGrupos();
    this.cargarMotivos();
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

  formatearMoneda(valor: number): string {
    if (valor === undefined || valor === null || isNaN(valor)) return '$ 0,00';
    return '$ ' + valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  obtenerTotalDebitadoGeneral(): number {
    return this.motivosDebito.reduce((acc, m) => acc + (m.montoTotal || 0), 0);
  }
}
