import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DirectorioService } from '../../core/services/directorio.service';
import { DirectorioPrestacionDetalle } from '../../core/models/directorio.model';

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
  filtroBusqueda: string = '';

  totalMontoDebitado: number = 0;
  totalCasos: number = 0;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const motivoParam = params.get('motivoId');
      this.motivo = motivoParam ? decodeURIComponent(motivoParam) : '';
    });

    this.route.queryParamMap.subscribe(queryParams => {
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

  get prestacionesFiltradas(): DirectorioPrestacionDetalle[] {
    if (!this.filtroBusqueda || this.filtroBusqueda.trim() === '') {
      return this.prestaciones;
    }
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.prestaciones.filter(p =>
      (p.paciente && p.paciente.toLowerCase().includes(q)) ||
      (p.carnet && p.carnet.toLowerCase().includes(q)) ||
      (p.codigo && p.codigo.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
      (p.comentariosDebito && p.comentariosDebito.toLowerCase().includes(q)) ||
      (p.efector && p.efector.toLowerCase().includes(q)) ||
      (p.medico && p.medico.toLowerCase().includes(q))
    );
  }

  volverAlTablero(): void {
    this.router.navigate(['/directorio']);
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
}
