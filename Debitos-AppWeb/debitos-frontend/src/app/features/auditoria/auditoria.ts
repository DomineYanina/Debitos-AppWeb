import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

  modalVisible: boolean = false;
  modalMensaje: string = '';
  modalAceptarCb: () => void = () => {};
  modalCancelarCb: () => void = () => {};

  cerrarModal() {
    this.modalVisible = false;
    this.cdr.detectChanges();
  }

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

  limpiarFilasSeleccionadas() {
    if (this.registrosSeleccionados.length === 0) return;

    this.modalMensaje = `¿Estás seguro de que querés borrar el contenido de las ${this.registrosSeleccionados.length} filas seleccionadas?`;

    this.modalAceptarCb = () => {
      this.registrosSeleccionados.forEach(p => {
        p.debitoAceptado = '';
        p.motivoDebito = '';
        p.importeDebitado = 0;
        p.motivoRefactura = '';
        p.importeRefactura = 0;
        p.comentarios = '';
      });
      this.calcularTotales();
      this.cerrarModal();
    };

    // Si cancela, solo cerramos
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

      const filtros = { ...this.busquedaForm.value };
      filtros.letra = filtros.letra ? filtros.letra.toUpperCase() : '';
      this.auditoriaService.buscarPrestaciones(filtros).subscribe({
        next: (data) => {
          this.tipoBusquedaRealizada = this.busquedaForm.value.tipo || '';

          this.prestaciones = data.map((p: any) => {
            if (p.debitoAceptado === true) {
              p.debitoAceptado = 'SI';
            } else if (p.debitoAceptado === false) {
              p.debitoAceptado = 'NO';
            } else {
              p.debitoAceptado = '';
            }

            return p as Prestacion;
          });

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
        p.importeDebitado = 0;
      } else {
        p.motivoDebito = motivo;
        if (motivo !== 'No aplica') p.importeDebitado = p.total;
      }
    });

    this.motivoMasivoSeleccionado = '';
    this.calcularTotales();
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
      p.importeDebitado = 0;
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

  async exportarAExcel() {
    if (this.prestacionesFiltradas.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Auditoría');

    // Helper para fecha
    const formatearFecha = (fechaISO: string) => {
      if (!fechaISO) return '';
      const soloFecha = fechaISO.split('T')[0];
      const partes = soloFecha.split('-');
      return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : soloFecha;
    };

    // 1. Definición de Columnas con el nuevo orden solicitado
    let columnas: any[] = [];
    if (this.tipoBusquedaRealizada === 'NC') {
      columnas = [
        { header: 'Carnet', key: 'carnet' },
        { header: 'Paciente', key: 'paciente' },
        { header: 'Cobertura', key: 'cobertura' },
        { header: 'Plan', key: 'plan' },
        { header: 'Grupo Módulo', key: 'grupomodulo' },
        { header: 'Médico', key: 'medico' },
        { header: 'Fecha', key: 'fecha' },
        { header: 'Código', key: 'codigo' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Cant.', key: 'cantidad' },
        { header: 'Total Neto', key: 'totalNeto', style: { numFmt: '#,##0.00' } },
        { header: 'Coseguro', key: 'coseguro', style: { numFmt: '#,##0.00' } },
        { header: 'Total', key: 'total', style: { numFmt: '#,##0.00' } },
        { header: 'Comentario Previo', key: 'comentarioPrevio' },
        { header: 'Motivo Refactura', key: 'motivoRefactura' },
        { header: 'Imp. Refactura', key: 'importeRefactura', style: { numFmt: '#,##0.00' } },
        { header: 'Comentarios', key: 'comentarios' }
      ];
    } else {
      columnas = [
        { header: 'Carnet', key: 'carnet' },
        { header: 'Paciente', key: 'paciente' },
        { header: 'Cobertura', key: 'cobertura' },
        { header: 'Plan', key: 'plan' },
        { header: 'Efector', key: 'efector' },
        { header: 'Médico', key: 'medico' },
        { header: 'Fecha', key: 'fecha' },
        { header: 'Código', key: 'codigo' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Cant.', key: 'cantidad' },
        { header: 'Total Neto', key: 'totalNeto', style: { numFmt: '#,##0.00' } },
        { header: 'Coseguro', key: 'coseguro', style: { numFmt: '#,##0.00' } },
        { header: 'Total', key: 'total', style: { numFmt: '#,##0.00' } },
        { header: 'Débito Aceptado', key: 'debitoAceptado' },
        { header: 'Motivo Débito', key: 'motivoDebito' },
        { header: 'Días Fact.', key: 'diasFacturados' },
        { header: 'Imp. Debitado', key: 'importeDebitado', style: { numFmt: '#,##0.00' } },
        { header: 'Motivo Refactura', key: 'motivoRefactura' },
        { header: 'Imp. Refactura', key: 'importeRefactura', style: { numFmt: '#,##0.00' } },
        { header: 'Comentarios', key: 'comentarios' }
      ];
    }

    worksheet.columns = columnas;

    // 2. Mapeo de datos
    this.prestacionesFiltradas.forEach(p => {
      const registro = { ...p } as any;
      registro.fecha = formatearFecha(p.fecha || '');
      worksheet.addRow(registro);
    });

    // 3. Auto-size
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength < 12 ? 12 : maxLength + 3;
    });

    // 4. Estilo de encabezados (Azul oscuro)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF002060' }
      };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'medium' }, right: { style: 'thin' }
      };
    });

    // 5. Estilo intercalado y delimitadores de bloques (BORDES)
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Intercalado
          if (rowNumber % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F8FC' } };
          }

          // Bordes delgados base
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };

          // Borde grueso para separar bloques de colores originales (ahora en col 13)
          if (colNumber === 13) {
            cell.border.right = { style: 'medium' };
          }
        });
      }
    });

    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };

    // 6. Nombre de archivo dinámico
    const f = this.busquedaForm.value;
    const nombreArchivo = `${f.tipo}-${f.letra}-${f.puntoVenta}-${f.numero}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), nombreArchivo);
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
      alert('No hay registros con motivos asignados para guardar.');
      return;
    }

    // 2. Preparar el paquete (Payload) para enviar a Java
    // Asegurate de cambiar el string del usuario por el método real de tu AuthService
    const payload = {
      documentoOrigen: this.tipoBusquedaRealizada,
      letra: this.busquedaForm.value.letra ? this.busquedaForm.value.letra.toUpperCase() : '',
      ptovta: this.busquedaForm.value.puntoVenta,
      numero: this.busquedaForm.value.numero,
      usuario: this.authService.obtenerUsuario(), // TODO: Reemplazar por this.authService.getUsuario()...
      registros: registrosParaGuardar
    };

    // 3. Bloquear UI y disparar petición
    this.cargando = true;
    this.cdr.detectChanges();

    this.auditoriaService.guardarParcialmente(payload).subscribe({
      next: () => {
        alert('¡Los registros se guardaron parcialmente con éxito!');
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Ocurrió un error al intentar guardar en la base de datos.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // VARIABLES DEL MODAL DE NUEVA NOTA DE DÉBITO
  // ==========================================
  modalNuevaNotaDebitoVisible: boolean = false;

  nuevaNotaDebitoForm = this.fb.group({
    tipo: ['ND', Validators.required], // Valor por defecto ND
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required]
  });

  // Reemplazamos tu método vacío nuevaNotaDebito() por este:
  nuevaNotaDebito() {
    // Para la ND, validamos que hayan cargado un Motivo de Refactura
    const prestacionesConRefactura = this.prestaciones.filter(p => p.motivoRefactura && p.motivoRefactura.trim() !== '');

    if (prestacionesConRefactura.length === 0) {
      alert('No hay registros con Motivo de Refactura cargado para generar una Nota de Débito. Recuerde Guardar Parcialmente primero.');
      return;
    }

    this.nuevaNotaDebitoForm.reset({ tipo: 'ND' });
    this.modalNuevaNotaDebitoVisible = true;
    this.cdr.detectChanges();
  }

  cerrarModalNuevaNotaDebito() {
    this.modalNuevaNotaDebitoVisible = false;
    this.cdr.detectChanges();
  }

  guardarNuevaNotaDebitoBD() {
    if (this.nuevaNotaDebitoForm.invalid) {
      alert('Por favor, complete todos los campos correctamente.');
      return;
    }

    // Recolectamos los IDs de las prestaciones originales
    const prestacionesConRefactura = this.prestaciones.filter(p => p.motivoRefactura && p.motivoRefactura.trim() !== '');
    const ids = prestacionesConRefactura.map(p => p.id);

    const datosNotaForm = { ...this.nuevaNotaDebitoForm.value };
    datosNotaForm.letra = datosNotaForm.letra ? datosNotaForm.letra.toUpperCase() : '';

    const payload = {
      origen: this.tipoBusquedaRealizada,
      idsPrestaciones: ids,
      datosNota: datosNotaForm // Pasamos el objeto modificado
    };

    this.cargando = true;
    this.cdr.detectChanges();

    this.auditoriaService.guardarNuevaNotaDebito(payload).subscribe({
      next: () => {
        alert('¡Nota de Débito generada y guardada con éxito!');
        this.cerrarModalNuevaNotaDebito();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Error al guardar la Nota de Débito en la base de datos.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // VARIABLES DEL MODAL DE NUEVA NOTA
  // ==========================================
  modalNuevaNotaVisible: boolean = false;

  // Formulario reactivo para la nueva nota
  nuevaNotaForm = this.fb.group({
    tipo: ['NC', Validators.required], // Valor por defecto NC
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required]
  });

  // Reemplazamos el método vacío por este
  nuevaNotaCredito() {
    // Verificamos que haya algo para asociar
    const prestacionesConDebito = this.prestaciones.filter(p => p.motivoDebito && p.motivoDebito.trim() !== '');

    if (prestacionesConDebito.length === 0) {
      alert('No hay registros con Motivo de Débito cargado para generar una Nota de Crédito. Recuerde Guardar Parcialmente primero.');
      return;
    }

    this.nuevaNotaForm.reset({ tipo: 'NC' }); // Limpiamos el form al abrir
    this.modalNuevaNotaVisible = true;
    this.cdr.detectChanges();
  }

  cerrarModalNuevaNota() {
    this.modalNuevaNotaVisible = false;
    this.cdr.detectChanges();
  }

  guardarNuevaNotaCreditoBD() {
    if (this.nuevaNotaForm.invalid) {
      alert('Por favor, complete todos los campos correctamente.');
      return;
    }

    // Recolectamos los IDs de las prestaciones originales que tienen débito
    const prestacionesConDebito = this.prestaciones.filter(p => p.motivoDebito && p.motivoDebito.trim() !== '');
    const ids = prestacionesConDebito.map(p => p.id);

    const datosNotaForm = { ...this.nuevaNotaForm.value };
    datosNotaForm.letra = datosNotaForm.letra ? datosNotaForm.letra.toUpperCase() : '';

    const payload = {
      origen: this.tipoBusquedaRealizada,
      idsPrestaciones: ids,
      datosNota: datosNotaForm // Pasamos el objeto modificado
    };

    this.cargando = true;
    this.cdr.detectChanges();

    this.auditoriaService.guardarNuevaNotaCredito(payload).subscribe({
      next: () => {
        alert('¡Nota de Crédito generada y guardada con éxito!');
        this.cerrarModalNuevaNota();
        this.cargando = false;
        // Opcional: Podrías llamar a onBuscar() acá para recargar la grilla
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Error al guardar la Nota de Crédito en la base de datos.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
