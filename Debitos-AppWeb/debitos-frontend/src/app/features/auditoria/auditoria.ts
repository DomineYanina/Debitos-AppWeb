import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { Prestacion } from '../../core/models/prestacion';
import { CommonModule } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria';
import { LISTA_MOTIVOS_DEBITO, LISTA_MOTIVOS_REFACTURA } from '../../core/constants/motivos';
import {ExcelExportService} from '../../core/services/excel-export';

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
  private excelService = inject(ExcelExportService);

  listaMotivos: string[] = LISTA_MOTIVOS_DEBITO;
  listaMotivosRefactura: string[] = LISTA_MOTIVOS_REFACTURA;

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

  modalVisible: boolean = false;
  modalMensaje: string = '';
  modalAceptarCb: () => void = () => {};
  modalCancelarCb: () => void = () => {};

  cerrarModal() {
    this.modalVisible = false;
    this.cdr.detectChanges();
  }

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

  modalNuevaNotaVisible: boolean = false;
  tipoNuevaNota: 'NC' | 'ND' = 'NC'; // Variable para saber qué estamos generando

  // Un solo formulario para ambos casos
  nuevaNotaForm = this.fb.group({
    tipo: ['', Validators.required],
    letra: ['', [Validators.required, Validators.maxLength(1)]],
    puntoVenta: ['', [Validators.required, Validators.min(1)]],
    numero: ['', [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required]
  });

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
      const prestacionesConRefactura = this.prestaciones.filter(p => p.motivoRefactura && p.motivoRefactura.trim() !== '');
      if (prestacionesConRefactura.length === 0) {
        this.mostrarAlerta('No hay registros con Motivo de Refactura cargado para generar una ND. Recuerde Guardar Parcialmente primero.');
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

    // 1. Recolectamos los registros con datos de auditoría (igual que en guardado parcial)
    const registrosParaGuardar = this.prestaciones.filter(p => {
      if (this.tipoNuevaNota === 'NC') {
        return p.motivoDebito && p.motivoDebito.trim() !== '';
      } else {
        return p.motivoRefactura && p.motivoRefactura.trim() !== '';
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

}
