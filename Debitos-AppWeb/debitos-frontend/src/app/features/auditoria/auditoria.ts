import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditoriaComponent {
  debitoAceptadoMasivoSeleccionado: string = '';
  listaDebitoAceptado: string[] = ['Borrar', 'SI', 'NO'];

  listaMotivos: string[] = [
    'Borrar',
    'No aplica',
    'Afiliado capitado',
    'Afiliado dado de baja',
    'Alta demorada criterio audotoria medica',
    'Conteo de medicacion erroneo hojas de enfermeria no identificadas con fecha',
    'Coseguro no cobrado',
    'Debito 20% urgencia modulos',
    'Debito 20% urgencia prestaciones',
    'Debito por diferencia en la inclusiones modulares',
    'Debito por falta de historia clinica',
    'Debito por historias clinicas de distintos pacientes en la misma internacion',
    'Debito por normas contractuales (ejemplo veda+vcc)',
    'Debito por normas operativas',
    'Debito segun normas del nomenclador',
    'Débitos varios, recibido fuera de término por Tesorería, emisión de nc condicional al cobro de la factura',
    'Demora en Inter Consulta',
    'Demora en resolución quirúrgica',
    'Diagnostico ilegible',
    'Diagnostico no reconocido',
    'Diferencia de aranceles',
    'Diferencia de coseguro',
    'Diferencia de criterio medico/prestaciones no justificadas',
    'Diferencia de valor en medicamentos/descartables',
    'Documentacion adulterada',
    'Ecografia de partes blandas incluida en ecografia abdominal',
    'Ecografia renal incluida en abdominal',
    'El valor de los impuestos a abonar en el proceso de la refactura superan el importe a refacturar',
    'Error de carga (codigos-inclusiones)',
    'Error de Open',
    'Error en el cálculo de porcentaje de códigos múltiples',
    'Exceso de facturacion en medicamentos y descartables',
    'Facturacion duplicada',
    'Facturado a financiador incorrecto',
    'Facturado con nota de departamento comercial',
    'Falta de autorizacion',
    'Falta de documentacion avalatoria',
    'Falta de historia/informe.',
    'Falta de troqueles-stickers de medicacion o materiales',
    'Falta firma paciente',
    'Falta firma profesional',
    'Falta informe',
    'Historia clinica incompleta',
    'Honorarios profesionales pagados en forma directa',
    'Incluido en APB',
    'Iva mal facturado',
    'Material/ Medicamentos provistos por O.S.',
    'Material no utilizado',
    'Medicación no suministrada',
    'No indicado',
    'No reconoce prestación',
    'Orden sin diagnóstico',
    'Prestacion fuera de termino',
    'Prestacion incluida en otra',
    'Prestacion incluida en otra liquidacion',
    'Prestacion no homologada',
    'Prestacion no justificada',
    'Prestacion sin convenio',
    'Presupuesto facturado con nota no reconocido',
    'Presupuesto rechazado y facturados con indicacion comercial',
    'Rechazo de refactura por mantener motivos de debitos originales',
    'Supera tope anual'
  ];

  listaMotivosRefactura: string[] = [
    'Borrar', 'No aplica', 'Casos: Afiliados activos.', 'Casos: Discrepancia cobertura pensión.',
    'Casos: Excepciones refacturadas.', 'Casos: Médico externo sin historia clínica.',
    'Corrección de error de Open', 'Débitos Inválidos: Aplicados erróneamente.',
    'Doc. y Aut.: Autorización recibida posterior al cierre.', 'Doc. y Aut.: Autorización vigente.',
    'Doc. y Aut.: Doc. completa enviada.', 'Doc. y Aut.: Facturado en tiempo.',
    'Doc. y Aut.: Info. filiatoria completa.', 'Doc. y Aut.: Justificado en historia clínica.',
    'Doc. y Aut.: Orden con diagnóstico, se aclara con historia clínica',
    'Doc. y Aut.: Se envía documentación omitida', 'Doc. y Aut.: Se envía troquel/sticker',
    'Doc. y Aut.: Según normas vigentes.', 'Excepciones: Bonificación medicación.',
    'Excepciones: Bonificación prestación.', 'Excepciones: Reclamos/comerciales.',
    'Gestión: Aclaración procedimiento.', 'Gestión: Afiliado dado de baja.',
    'Gestión: Ajustes en coseguro.', 'Gestión: Ajuste por presupuesto.',
    'Gestión: Aplicación incorrecta de IVA.', 'Gestión: Consumos correctos.',
    'Gestión: Corrección facturación módulos.', 'Gestión: Financidor demoró respuesta.',
    'Gestión: Medicamentos mal facturados.', 'Gestión Méd.: Aclaración de diagnóstico',
    'Gestión Méd.: Ajuste fechas derivación.', 'Gestión Méd.: Criterio en diagnósticos.',
    'Gestión Méd.: Historia clínica firmada.', 'Gestión Méd.: Normas sanatoriales.',
    'Gestión Méd.: Postoperatorios/antibióticos.', 'Gestión Méd.: Tratamientos infecciones.',
    'Gestión Méd.: Tratamientos médicos.', 'Gestión Méd.: Urgencia sin consentimiento.',
    'Normas: Adjunta norma del Nom. Nac.', 'Normas: Ajustes valores medicación/material.',
    'Normas: Aplicación de normas acordadas.', 'Normas: Aranceles vigentes Colegio Bioquím.',
    'Normas: Cambios deben ser acordados.', 'Normas: Exclusión no explícita.',
    'Normas: Facturación según módulos vigentes.', 'Normas: Inclusión/Exclusión según acuerdo.',
    'Normas: Incompatibilidad normativa.', 'Normas: Obligación de cobertura por ley',
    'Normas: Prestación arancel convenido.', 'Normas: Prestación no respondida por financ.',
    'Normas: Prestación según presupuesto.', 'Normas: Recargos urgencia según Nac. Nom.',
    'Normas: Refacturación por IVA.', 'Normas: Valores de contrastes vigentes.',
    'Normas: Valores medicación/material convenio.', 'Prestaciones: Aranceles según CEDIM.',
    'Prestaciones: Consultas previas/post-proced.', 'Prestaciones: Homologada.',
    'Prestaciones: Inclusión incorrecta.', 'Prestaciones: No incluidas según Nom. Nac.',
    'Prestaciones: Material no incluido en base.', 'Prestaciones: Procedimientos ampliados.',
    'Prestaciones: Relacionadas a prestación.'
  ];

  motivoMasivoSeleccionado: string = '';
  motivoRefacturaMasivoSeleccionado: string = '';
  cargando : boolean = false;
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  prestaciones: Prestacion[] = [];
  prestacionesFiltradas: Prestacion[] = [];
  columnaOrden: string = '';
  direccionOrden: 'asc' | 'desc' = 'asc';
  private auditoriaService = inject(AuditoriaService);

  // Listas para llenar los combos
  pacientesList: string[] = [];
  profesionalesList: string[] = [];
  prestacionesList: string[] = [];
  gruposList: (string | undefined)[] = [];
  fechasList: string[] = [];

  // Valores seleccionados en los filtros
  filtroPaciente: string = '';
  filtroProfesional: string = '';
  filtroPrestacion: string = '';
  filtroGrupo: string = '';
  filtroFecha: string = '';

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

  // Mapeamos los 4 campos con sus validaciones
  busquedaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]]
  });

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

  aplicarMotivoRefacturaMasivo() {
    if (this.registrosSeleccionados.length === 0 || !this.motivoRefacturaMasivoSeleccionado) return;

    const valor = this.motivoRefacturaMasivoSeleccionado === 'Borrar' ? '' : this.motivoRefacturaMasivoSeleccionado;

    this.registrosSeleccionados.forEach(p => {
      p.motivoRefactura = valor;
    });

    this.motivoRefacturaMasivoSeleccionado = '';
    this.calcularTotales();
    this.cdr.detectChanges(); // Vital para OnPush
  }

  aplicarDebitoAceptadoMasivo() {
    if (this.registrosSeleccionados.length === 0 || !this.debitoAceptadoMasivoSeleccionado) return;

    const valor = this.debitoAceptadoMasivoSeleccionado === 'Borrar' ? '' : this.debitoAceptadoMasivoSeleccionado;

    this.registrosSeleccionados.forEach(p => {
      p.debitoAceptado = valor;
    });

    this.debitoAceptadoMasivoSeleccionado = '';
    this.calcularTotales();
    this.cdr.detectChanges(); // Vital para que la pantalla se actualice
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

      this.auditoriaService.buscarPrestaciones(this.busquedaForm.value).subscribe({
        next: (data) => {
          this.prestaciones = data;
          this.prestacionesFiltradas = [...this.prestaciones];

          this.prepararFiltros(this.prestaciones);
          this.aplicarFiltros();
          this.cdr.detectChanges();

          this.cargando = false; // Liberamos la UI (Éxito)
        },
        error: (err) => {
          alert('Error en el servidor');
          this.cargando = false; // Liberamos la UI (Error)
        }
      });
    }
  }

  aplicarMotivoMasivo() {
    if (this.registrosSeleccionados.length === 0 || !this.motivoMasivoSeleccionado) {
      return;
    }

    const motivo = this.motivoMasivoSeleccionado;

    this.registrosSeleccionados.forEach(p => {
      if (motivo === 'Borrar') {
        p.motivoDebito = '';
        p.importeDebitado = 0; // Vaciamos también el importe
      } else {
        p.motivoDebito = motivo;
        // Si no es "No aplica", le clavamos automáticamente el total neto de esa prestación
        if (motivo !== 'No aplica') {
          p.importeDebitado = p.total;
        }
      }
    });

    this.motivoMasivoSeleccionado = '';

    // CRÍTICO: Recalcular los contadores (KPIs) y totales después de la modificación masiva
    this.calcularTotales();
    this.cdr.detectChanges();
  }

  alCambiarMotivoDebito(p: Prestacion) {
    if (p.motivoDebito === 'Borrar') {
      p.motivoDebito = '';
      p.importeDebitado = 0;
    } else if (p.motivoDebito && p.motivoDebito !== 'No aplica') {
      p.importeDebitado = p.total;
    }

    // Recalculamos totales al instante
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
    this.prestacionesList = [...new Set(datos.map(p => p.modulo))].sort();
    this.gruposList = [...new Set(datos.map(p => p.grupomodulo))].sort();
    this.fechasList = [...new Set(datos.map(p => p.fecha))].sort();
    //debugger;
  }

  aplicarFiltros() {
    this.prestacionesFiltradas = this.prestaciones.filter(p => {
      const cumpleCombos =
        (this.filtroPaciente === '' || p.paciente === this.filtroPaciente) &&
        (this.filtroProfesional === '' || p.medico === this.filtroProfesional) &&
        (this.filtroPrestacion === '' || p.modulo === this.filtroPrestacion) &&
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

  totalFacturado: number = 0;
  totalDebitado: number = 0;
  totalCantidad: number = 0;
  totalNetoGlobal: number = 0;
  totalCoseguroGlobal: number = 0;
  totalRefacturadoGlobal: number = 0;

// Función para el checkbox principal de la cabecera
  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const marcado = checkbox.checked;

    // Actualizamos toda la lista filtrada (rápido en memoria)
    this.prestacionesFiltradas.forEach(p => p.seleccionada = marcado);
    this.actualizarEstadoSeleccion();
    this.cdr.detectChanges();
    // El HTML solo actualizará las 100 filas de 'prestacionesPaginadas' gracias a OnPush
  }

  todasSeleccionadas: boolean = false;
  registrosSeleccionados: Prestacion[] = [];

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
      if (p.debitoAceptado === 'SI' || p.debitoAceptado === 'PARCIAL') {
        this.cantAceptados++;
        this.totalDebitadoAceptado += (p.importeDebitado || 0);
      } else if (p.debitoAceptado === 'NO') {
        this.totalRefacturarRechazado += (p.importeRefactura || 0);
      }
    }
    this.cdr.detectChanges();
  }
}
