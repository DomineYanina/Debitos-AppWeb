import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import {
  EstadoSincronizacion,
  PrevisualizacionSincronizacion,
  ResumenSincronizacion,
  ComprobanteCandidato,
  ComprobanteSinAsociar,
  EstadoSincronizacionPrestaciones,
  PrevisualizacionPrestaciones,
  PrestacionCandidata,
  ResumenSincronizacionPrestaciones
} from '../../core/models/admin.model';
import { AuthService } from '../../core/services/auth';
import { ExcelExportService } from '../../core/services/excel-export';

// Sincronización de Prestaciones amb_liquidado
@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private excelExportService = inject(ExcelExportService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioLogueado: string = '';
  anioActual: number = new Date().getFullYear();
  anioSeleccionado: number = new Date().getFullYear();
  aniosDisponibles: number[] = [];

  estado: EstadoSincronizacion | null = null;
  cargandoEstado: boolean = false;
  sincronizando: boolean = false;
  exportandoSinAsociar: boolean = false;
  mensajeExitoExportacion: string = '';
  errorCarga: string = '';

  // Modal de Previsualización
  mostrarModalPrevisualizacion: boolean = false;
  cargandoPrevisualizacion: boolean = false;
  datosPrevisualizacion: PrevisualizacionSincronizacion | null = null;
  filtroTextoPrev: string = '';
  filtroTipoPrev: string = 'TODOS';

  // Modal de resultado
  mostrarModalResultado: boolean = false;
  resumenResultado: ResumenSincronizacion | null = null;

  // Estado Prestaciones (amb_liquidado)
  estadoPrestaciones: EstadoSincronizacionPrestaciones | null = null;
  cargandoEstadoPrestaciones: boolean = false;
  sincronizandoPrestaciones: boolean = false;
  reconciliandoPrestaciones: boolean = false;

  // Modal de Previsualización Prestaciones
  mostrarModalPrevPrestaciones: boolean = false;
  cargandoPrevPrestaciones: boolean = false;
  datosPrevPrestaciones: PrevisualizacionPrestaciones | null = null;
  filtroTipoPrevPrestaciones: string = 'TODOS';
  filtroTextoPrevPrestaciones: string = '';

  // Modal de resultado Prestaciones
  mostrarModalResultadoPrestaciones: boolean = false;
  resumenResultadoPrestaciones: ResumenSincronizacionPrestaciones | null = null;

  ngOnInit(): void {
    this.usuarioLogueado = this.authService.obtenerUsuario() || 'Administrador';
    this.generarAniosDisponibles();
    this.cargarEstado();
    this.cargarEstadoPrestaciones();
  }

  generarAniosDisponibles(): void {
    const anioBase = new Date().getFullYear();
    this.aniosDisponibles = [];
    for (let y = anioBase; y >= anioBase - 4; y--) {
      this.aniosDisponibles.push(y);
    }
  }

  cargarEstado(): void {
    this.cargandoEstado = true;
    this.errorCarga = '';
    this.cdr.markForCheck();

    this.adminService.obtenerEstado(this.anioSeleccionado).subscribe({
      next: (resp) => {
        this.estado = resp;
        this.cargandoEstado = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoEstado = false;
        this.errorCarga = 'No se pudo obtener el estado del servidor. Verifique que el servicio esté activo.';
        this.cdr.markForCheck();
      }
    });
  }

  onCambioAnio(): void {
    this.cargarEstado();
    this.cargarEstadoPrestaciones();
  }

  abrirPrevisualizacion(): void {
    this.cargandoPrevisualizacion = true;
    this.filtroTextoPrev = '';
    this.filtroTipoPrev = 'TODOS';
    this.mostrarModalPrevisualizacion = true;
    this.cdr.markForCheck();

    this.adminService.previsualizar(this.anioSeleccionado, 300).subscribe({
      next: (prev) => {
        this.datosPrevisualizacion = prev;
        this.cargandoPrevisualizacion = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoPrevisualizacion = false;
        this.errorCarga = 'No se pudo cargar la previsualización de comprobantes.';
        this.cdr.markForCheck();
      }
    });
  }

  cerrarModalPrevisualizacion(): void {
    this.mostrarModalPrevisualizacion = false;
    this.datosPrevisualizacion = null;
    this.cdr.markForCheck();
  }

  exportandoComprobantes: boolean = false;

  exportarComprobantesExcel(): void {
    if (this.exportandoComprobantes) return;
    this.exportandoComprobantes = true;
    this.cdr.markForCheck();

    this.adminService.obtenerCandidatosAExportar(this.anioSeleccionado, this.filtroTipoPrev).subscribe({
      next: (lista) => {
        if (!lista || lista.length === 0) {
          this.exportandoComprobantes = false;
          this.cdr.markForCheck();
          return;
        }

        const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const tipoStr = this.filtroTipoPrev || 'TODOS';
        const filename = `Comprobantes_A_Importar_${tipoStr}_${this.anioSeleccionado}_${fechaStr}.xlsx`;

        this.excelExportService.exportarComprobantesCandidatos(lista, this.anioSeleccionado, filename)
          .then(() => {
            this.exportandoComprobantes = false;
            this.cdr.markForCheck();
          })
          .catch((err) => {
            console.error('Error al generar Excel de comprobantes:', err);
            this.exportandoComprobantes = false;
            this.cdr.markForCheck();
          });
      },
      error: (err) => {
        console.error('Error al obtener comprobantes candidatos para Excel:', err);
        this.exportandoComprobantes = false;
        this.cdr.markForCheck();
      }
    });
  }

  confirmarDesdePrevisualizacion(): void {
    this.cerrarModalPrevisualizacion();
    this.ejecutarSincronizacion();
  }

  seleccionarTipo(tipo: string): void {
    if (this.filtroTipoPrev === tipo) return;
    this.filtroTipoPrev = tipo;
    this.cargandoMuestraTipo = true;
    this.cdr.markForCheck();

    this.adminService.previsualizar(this.anioSeleccionado, 300, tipo).subscribe({
      next: (data) => {
        this.cargandoMuestraTipo = false;
        if (data && this.datosPrevisualizacion) {
          this.datosPrevisualizacion.comprobantes = data.comprobantes || [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoMuestraTipo = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargandoMuestraTipo = false;

  get comprobantesFiltrados(): ComprobanteCandidato[] {
    if (!this.datosPrevisualizacion?.comprobantes) return [];

    let lista = this.datosPrevisualizacion.comprobantes;

    if (this.filtroTipoPrev !== 'TODOS') {
      lista = lista.filter(c => (c.tipo || '').toUpperCase() === this.filtroTipoPrev.toUpperCase());
    }

    if (this.filtroTextoPrev.trim()) {
      const q = this.filtroTextoPrev.trim().toLowerCase();
      lista = lista.filter(c =>
        (c.comprobante && c.comprobante.toLowerCase().includes(q)) ||
        (c.cobertura && c.cobertura.toLowerCase().includes(q)) ||
        (c.codigoCobertura && c.codigoCobertura.toLowerCase().includes(q)) ||
        (c.comprobanteAsociado && c.comprobanteAsociado.toLowerCase().includes(q))
      );
    }

    return lista;
  }

  get tiposDisponiblesPrev(): string[] {
    if (!this.datosPrevisualizacion?.desglosePorTipo) return [];
    return Object.keys(this.datosPrevisualizacion.desglosePorTipo);
  }

  ejecutarSincronizacion(): void {
    if (this.sincronizando) return;

    this.sincronizando = true;
    this.cdr.markForCheck();

    this.adminService.ejecutarSincronizacion(this.anioSeleccionado).subscribe({
      next: (resumen) => {
        this.sincronizando = false;
        this.resumenResultado = resumen;
        this.mostrarModalResultado = true;
        this.cargarEstado(); // refrescar contadores
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.sincronizando = false;
        this.resumenResultado = {
          exito: false,
          mensaje: err?.error?.message || 'Error al ejecutar la sincronización. Verifique la conexión con Gestión.',
          anioProcesado: this.anioSeleccionado,
          totalLeidosGestion: 0,
          nuevosInsertados: 0,
          existentesOmitidos: 0,
          asociadosActualizados: 0,
          duracionMs: 0,
          fechaHora: new Date().toISOString()
        };
        this.mostrarModalResultado = true;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarModalResultado(): void {
    this.mostrarModalResultado = false;
    this.resumenResultado = null;
    this.cdr.markForCheck();
  }

  irAAuditoria(): void {
    this.router.navigate(['/auditoria']);
  }

  irADirectorio(): void {
    this.router.navigate(['/directorio']);
  }

  exportarSinAsociar(): void {
    if (this.exportandoSinAsociar) return;
    this.exportandoSinAsociar = true;
    this.mensajeExitoExportacion = '';
    this.cdr.markForCheck();

    this.adminService.obtenerComprobantesSinAsociar().subscribe({
      next: async (docs) => {
        if (!docs || docs.length === 0) {
          this.exportandoSinAsociar = false;
          this.cdr.markForCheck();
          return;
        }

        const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `Comprobantes_Sin_Asociar_${fechaStr}.xlsx`;
        await this.excelExportService.exportarComprobantesSinAsociar(docs, filename);

        this.exportandoSinAsociar = false;
        this.mensajeExitoExportacion = `Se descargó con éxito el archivo Excel con ${docs.length} comprobantes sin asociar.`;
        setTimeout(() => {
          this.mensajeExitoExportacion = '';
          this.cdr.markForCheck();
        }, 6000);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al exportar comprobantes sin asociar:', err);
        this.exportandoSinAsociar = false;
        this.errorCarga = 'Ocurrió un error al consultar los comprobantes para la exportación.';
        this.cdr.markForCheck();
      }
    });
  }

  // --- MÉTODOS DE SINCRONIZACIÓN DE PRESTACIONES (amb_liquidado) ---

  cargarEstadoPrestaciones(): void {
    this.cargandoEstadoPrestaciones = true;
    this.cdr.markForCheck();

    this.adminService.obtenerEstadoPrestaciones(this.anioSeleccionado).subscribe({
      next: (resp) => {
        this.estadoPrestaciones = resp;
        this.cargandoEstadoPrestaciones = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoEstadoPrestaciones = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirPrevisualizacionPrestaciones(): void {
    this.cargandoPrevPrestaciones = true;
    this.filtroTextoPrevPrestaciones = '';
    this.filtroTipoPrevPrestaciones = 'TODOS';
    this.mostrarModalPrevPrestaciones = true;
    this.cdr.markForCheck();

    this.adminService.previsualizarPrestaciones(this.anioSeleccionado, 300).subscribe({
      next: (prev) => {
        this.datosPrevPrestaciones = prev;
        this.cargandoPrevPrestaciones = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoPrevPrestaciones = false;
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarTipoPrestacion(tipo: string): void {
    if (this.filtroTipoPrevPrestaciones === tipo) return;
    this.filtroTipoPrevPrestaciones = tipo;
    this.cargandoPrevPrestaciones = true;
    this.cdr.markForCheck();

    this.adminService.previsualizarPrestaciones(this.anioSeleccionado, 300, tipo).subscribe({
      next: (data) => {
        this.cargandoPrevPrestaciones = false;
        if (data && this.datosPrevPrestaciones) {
          this.datosPrevPrestaciones.prestaciones = data.prestaciones || [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoPrevPrestaciones = false;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarModalPrevPrestaciones(): void {
    this.mostrarModalPrevPrestaciones = false;
    this.datosPrevPrestaciones = null;
    this.cdr.markForCheck();
  }

  confirmarDesdePrevisualizacionPrestaciones(): void {
    this.cerrarModalPrevPrestaciones();
    this.ejecutarSincronizacionPrestaciones();
  }

  ejecutarSincronizacionPrestaciones(): void {
    if (this.sincronizandoPrestaciones) return;
    this.sincronizandoPrestaciones = true;
    this.cdr.markForCheck();

    this.adminService.sincronizarPrestaciones(this.anioSeleccionado).subscribe({
      next: (res) => {
        this.sincronizandoPrestaciones = false;
        this.resumenResultadoPrestaciones = res;
        this.mostrarModalResultadoPrestaciones = true;
        this.cargarEstadoPrestaciones();
        this.cargarEstado();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.sincronizandoPrestaciones = false;
        this.resumenResultadoPrestaciones = {
          exito: false,
          mensaje: err?.error?.message || 'Error al ejecutar sincronización de prestaciones.',
          anioProcesado: this.anioSeleccionado,
          totalLeidosGestion: 0,
          nuevasInsertadas: 0,
          existentesOmitidas: 0,
          vinculadasCabecera: 0,
          huerfanasSinCabecera: 0,
          huerfanasPreviasReconciliadas: 0,
          duracionMs: 0,
          fechaHora: new Date().toISOString()
        };
        this.mostrarModalResultadoPrestaciones = true;
        this.cdr.markForCheck();
      }
    });
  }

  reconciliarPrestaciones(): void {
    if (this.reconciliandoPrestaciones) return;
    this.reconciliandoPrestaciones = true;
    this.cdr.markForCheck();

    this.adminService.reconciliarPrestacionesCabecera(this.anioSeleccionado).subscribe({
      next: (resp) => {
        this.reconciliandoPrestaciones = false;
        this.mensajeExitoExportacion = resp?.mensaje || 'Reconciliación de prestaciones completada.';
        setTimeout(() => {
          this.mensajeExitoExportacion = '';
          this.cdr.markForCheck();
        }, 8000);
        this.cargarEstadoPrestaciones();
        this.cdr.markForCheck();
      },
      error: () => {
        this.reconciliandoPrestaciones = false;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarModalResultadoPrestaciones(): void {
    this.mostrarModalResultadoPrestaciones = false;
    this.resumenResultadoPrestaciones = null;
    this.cdr.markForCheck();
  }

  exportandoPrestaciones: boolean = false;
  mensajeExitoExportacionPrestaciones: string = '';

  exportarPrestacionesExcel(): void {
    if (this.exportandoPrestaciones) return;
    const lista = this.prestacionesFiltradas;
    if (!lista || lista.length === 0) return;

    this.exportandoPrestaciones = true;
    this.cdr.markForCheck();

    try {
      const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const tipo = this.filtroTipoPrevPrestaciones || 'TODOS';
      const filename = `Prestaciones_A_Importar_${tipo}_${this.anioSeleccionado}_${fechaStr}.xlsx`;

      this.excelExportService.exportarPrestacionesCandidatas(lista, this.anioSeleccionado, filename)
        .then(() => {
          this.exportandoPrestaciones = false;
          this.mensajeExitoExportacionPrestaciones = `Se descargó con éxito el archivo Excel con ${lista.length} prestaciones a importar.`;
          setTimeout(() => {
            this.mensajeExitoExportacionPrestaciones = '';
            this.cdr.markForCheck();
          }, 5000);
          this.cdr.markForCheck();
        })
        .catch((err) => {
          console.error('Error al exportar prestaciones a Excel:', err);
          this.exportandoPrestaciones = false;
          this.cdr.markForCheck();
        });
    } catch (e) {
      console.error('Error al generar Excel de prestaciones:', e);
      this.exportandoPrestaciones = false;
      this.cdr.markForCheck();
    }
  }

  exportarPrestacionesDesdeCard(): void {
    if (this.exportandoPrestaciones) return;
    this.exportandoPrestaciones = true;
    this.cdr.markForCheck();

    if (this.datosPrevPrestaciones?.prestaciones && this.datosPrevPrestaciones.prestaciones.length > 0) {
      const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `Prestaciones_A_Importar_${this.anioSeleccionado}_${fechaStr}.xlsx`;
      this.excelExportService.exportarPrestacionesCandidatas(this.datosPrevPrestaciones.prestaciones, this.anioSeleccionado, filename)
        .then(() => {
          this.exportandoPrestaciones = false;
          this.cdr.markForCheck();
        })
        .catch(() => {
          this.exportandoPrestaciones = false;
          this.cdr.markForCheck();
        });
    } else {
      this.adminService.previsualizarPrestaciones(this.anioSeleccionado, 500, 'TODOS').subscribe({
        next: (data) => {
          const lista = data?.prestaciones || [];
          if (lista.length === 0) {
            this.exportandoPrestaciones = false;
            this.cdr.markForCheck();
            return;
          }
          const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const filename = `Prestaciones_A_Importar_${this.anioSeleccionado}_${fechaStr}.xlsx`;
          this.excelExportService.exportarPrestacionesCandidatas(lista, this.anioSeleccionado, filename)
            .then(() => {
              this.exportandoPrestaciones = false;
              this.cdr.markForCheck();
            })
            .catch(() => {
              this.exportandoPrestaciones = false;
              this.cdr.markForCheck();
            });
        },
        error: () => {
          this.exportandoPrestaciones = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  get prestacionesFiltradas(): PrestacionCandidata[] {
    if (!this.datosPrevPrestaciones?.prestaciones) return [];
    let lista = this.datosPrevPrestaciones.prestaciones;
    if (this.filtroTipoPrevPrestaciones !== 'TODOS') {
      lista = lista.filter(p => p.tiporegistro === this.filtroTipoPrevPrestaciones);
    }
    if (this.filtroTextoPrevPrestaciones && this.filtroTextoPrevPrestaciones.trim() !== '') {
      const q = this.filtroTextoPrevPrestaciones.trim().toLowerCase();
      lista = lista.filter(p =>
        (p.codigo && p.codigo.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
        (p.paciente && p.paciente.toLowerCase().includes(q)) ||
        (p.medico && p.medico.toLowerCase().includes(q)) ||
        (p.facturaComprobante && p.facturaComprobante.toLowerCase().includes(q)) ||
        (p.codigoCobertura && p.codigoCobertura.toLowerCase().includes(q))
      );
    }
    return lista;
  }
}
