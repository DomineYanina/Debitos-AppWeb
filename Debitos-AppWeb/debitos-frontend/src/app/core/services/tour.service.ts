import { inject, Injectable } from '@angular/core';
import { ShepherdService } from 'angular-shepherd';
import { BehaviorSubject } from 'rxjs';

/** Claves independientes de localStorage para persistir el avance de cada fase del tour. */
const KEY_TOUR_BUSQUEDA = 'tour_busqueda_completado';
const KEY_TOUR_RESULTADOS = 'tour_resultados_completado';

@Injectable({
  providedIn: 'root'
})
export class TourService {

  // ── Inyección de dependencias ─────────────────────────────────────────────
  private readonly shepherd = inject(ShepherdService);

  // ── Estado reactivo RxJS ──────────────────────────────────────────────────
  private readonly _tourActivo$ = new BehaviorSubject<boolean>(false);
  readonly tourActivo$ = this._tourActivo$.asObservable();

  // ── FASE 1: Tour del Buscador Inicial ──────────────────────────────────────
  /**
   * Inicia la primera fase del tour guiado (Inputs de búsqueda y Botón Buscar).
   * Se debe llamar en `ngAfterViewInit` cuando la pantalla de inicio está lista.
   */
  startSearchTour(): void {
    if (localStorage.getItem(KEY_TOUR_BUSQUEDA) === 'true') {
      return; // El usuario ya completó el tour de búsqueda.
    }

    this.limpiarPasosPrevios();
    this.configurarOpcionesDefault();

    this.shepherd.addSteps([
      {
        id: 'paso-inputs-busqueda',
        attachTo: { element: '.busqueda-section', on: 'bottom' },
        title: 'Parámetros de Búsqueda',
        text: 'Ingrese aquí los datos del comprobante (Tipo, Letra, Punto de Venta y Número) para realizar la consulta.',
        buttons: [
          {
            text: 'Siguiente →',
            classes: 'shepherd-button-primary',
            action: () => this.shepherd.next()
          }
        ]
      },
      {
        id: 'paso-btn-buscar',
        attachTo: { element: '.btn-buscar', on: 'bottom' },
        title: 'Ejecutar Búsqueda',
        text: 'Una vez completados los parámetros, haga clic aquí para traer la información desde el servidor.',
        buttons: [
          {
            text: '← Atrás',
            classes: 'shepherd-button-secondary',
            action: () => this.shepherd.back()
          },
          {
            text: 'Finalizar ✓',
            classes: 'shepherd-button-primary',
            action: () => {
              this.shepherd.complete();
              this.finalizarTourBusqueda();
            }
          }
        ]
      }
    ]);

    this.suscribirEventosFin(() => this.finalizarTourBusqueda());
    this._tourActivo$.next(true);
    this.shepherd.start();
  }

  // ── FASE 2: Tour de Resultados (Orden Top-to-Bottom de la UI) ─────────────
  /**
   * Inicia la segunda fase del tour guiado respetando estrictamente el orden visual:
   * Filtros → Contadores → Limpieza → Acciones → Grilla AG Grid → Totales Footer.
   */
  startResultsTour(): void {
    if (localStorage.getItem(KEY_TOUR_RESULTADOS) === 'true') {
      return; // El usuario ya completó el tour de resultados.
    }

    this.limpiarPasosPrevios();
    this.configurarOpcionesDefault();

    this.shepherd.addSteps([
      // 1. Filtros de Resultados
      {
        id: 'paso-filtros-dinamicos',
        attachTo: { element: '.filtros-grid', on: 'bottom' },
        title: 'Filtros de Resultados',
        text: 'Utilice estos desplegables y casillas de verificación para acotar los registros mostrados por paciente, profesional, prestación o fecha.',
        buttons: [
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 2. Documentos Aceptados
      {
        id: 'paso-contador-aceptados',
        attachTo: { element: '.contador-aceptados', on: 'bottom' },
        title: 'Documentos Aceptados',
        text: 'Muestra la cantidad total de documentos que fueron aprobados sin débitos.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 3. Total Debitado Acumulado
      {
        id: 'paso-contador-debitado',
        attachTo: { element: '.contador-debitado', on: 'bottom' },
        title: 'Total Debitado Acumulado',
        text: 'Muestra la suma del importe neto de los débitos aplicados en la auditoría.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 4. Total a Refacturar
      {
        id: 'paso-contador-refacturar',
        attachTo: { element: '.contador-refacturar', on: 'bottom' },
        title: 'Total a Refacturar',
        text: 'Indica el monto total acumulado habilitado para ser enviado a refacturación.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 5. Limpiar Filas
      {
        id: 'paso-btn-limpiar-filas',
        attachTo: { element: '.btn-clear-rows', on: 'bottom' },
        title: 'Limpiar Filas',
        text: 'Borra los datos de débitos y refacturas cargados en las filas seleccionadas de la grilla.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 6. Exportar a Excel
      {
        id: 'paso-exportar-excel',
        attachTo: { element: '.btn-exportar', on: 'left' },
        title: 'Exportar a Excel',
        text: 'Descarga la información de las prestaciones de la grilla a una planilla de cálculo Excel.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 7. Guardar Parcialmente
      {
        id: 'paso-guardar-parcialmente',
        attachTo: { element: '.btn-guardar', on: 'left' },
        title: 'Guardar Parcialmente',
        text: 'Guarda temporalmente el avance realizado en débitos y refacturas sin cerrar el documento.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 8. Nueva Nota de Crédito / Débito
      {
        id: 'paso-nueva-nota',
        attachTo: { element: '.btn-nueva-nota', on: 'left' },
        title: 'Nueva Nota de Crédito / Débito',
        text: 'Abre el formulario para generar el nuevo comprobante definitivo según la auditoría.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 9. Grilla de Resultados (AG Grid)
      {
        id: 'paso-grilla-resultados',
        attachTo: { element: '.tabla-grid-container', on: 'top' },
        title: 'Grilla de Resultados',
        text: 'Aquí se visualizan las prestaciones. Puede ordenar columnas y seleccionar múltiples filas para realizar modificaciones masivas.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 10. Total Cantidad
      {
        id: 'paso-total-cantidad',
        attachTo: { element: '.total-cantidad-item', on: 'top' },
        title: 'Total Cantidad',
        text: 'Suma de las cantidades de todas las prestaciones visibles en la grilla.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 11. Total Neto
      {
        id: 'paso-total-neto',
        attachTo: { element: '.total-neto-item', on: 'top' },
        title: 'Total Neto',
        text: 'Sumatoria del importe neto acumulado de todas las prestaciones.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 12. Coseguro
      {
        id: 'paso-total-coseguro',
        attachTo: { element: '.total-coseguro-item', on: 'top' },
        title: 'Coseguro',
        text: 'Monto total del coseguro acumulado a cargo del paciente en este comprobante.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 13. Total Facturado
      {
        id: 'paso-total-facturado',
        attachTo: { element: '.total-facturado-item', on: 'top' },
        title: 'Total Facturado',
        text: 'Importe total consolidado del documento (suma de Neto + Coseguro).',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 14. Total Debitado
      {
        id: 'paso-total-debitado',
        attachTo: { element: '.total-debitado-item', on: 'top' },
        title: 'Total Debitado',
        text: 'Sumatoria total de los importes de débitos aplicados a las prestaciones.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      // 15. Total Refacturado (FIN DEL TOUR)
      {
        id: 'paso-total-refacturado',
        attachTo: { element: '.total-refacturado-item', on: 'top' },
        title: 'Total Refacturado',
        text: 'Monto total aprobado y disponible para una nueva refacturación.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          {
            text: 'Finalizar ✓',
            classes: 'shepherd-button-primary',
            action: () => {
              this.shepherd.complete();
              this.finalizarTourResultados();
            }
          }
        ]
      }
    ]);

    this.suscribirEventosFin(() => this.finalizarTourResultados());
    this._tourActivo$.next(true);
    this.shepherd.start();
  }

  // ── TOUR REPRODUCIBLE A DEMANDA ───────────────────────────────────────────
  /**
   * Ejecuta manualmente el tour completo desde el botón de ayuda de la interfaz.
   * Ignora las banderas de localStorage y encadena todos los pasos disponibles.
   */
  startFullTour(hasResults: boolean): void {
    this.limpiarPasosPrevios();
    this.configurarOpcionesDefault();

    const pasos: any[] = [
      {
        id: 'paso-inputs-busqueda',
        attachTo: { element: '.busqueda-section', on: 'bottom' },
        title: 'Parámetros de Búsqueda',
        text: 'Ingrese aquí los datos del comprobante (Tipo, Letra, Punto de Venta y Número) para realizar la consulta.',
        buttons: [
          { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
        ]
      },
      {
        id: 'paso-btn-buscar',
        attachTo: { element: '.btn-buscar', on: 'bottom' },
        title: 'Ejecutar Búsqueda',
        text: 'Una vez completados los parámetros, haga clic aquí para traer la información desde el servidor.',
        buttons: [
          { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
          {
            text: hasResults ? 'Siguiente →' : 'Finalizar ✓',
            classes: 'shepherd-button-primary',
            action: () => {
              if (hasResults) {
                this.shepherd.next();
              } else {
                this.shepherd.complete();
              }
            }
          }
        ]
      }
    ];

    if (hasResults) {
      pasos.push(
        {
          id: 'paso-filtros-dinamicos',
          attachTo: { element: '.filtros-grid', on: 'bottom' },
          title: 'Filtros de Resultados',
          text: 'Utilice estos desplegables y casillas de verificación para acotar los registros mostrados por paciente, profesional, prestación o fecha.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-contador-aceptados',
          attachTo: { element: '.contador-aceptados', on: 'bottom' },
          title: 'Documentos Aceptados',
          text: 'Muestra la cantidad total de documentos que fueron aprobados sin débitos.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-contador-debitado',
          attachTo: { element: '.contador-debitado', on: 'bottom' },
          title: 'Total Debitado Acumulado',
          text: 'Muestra la suma del importe neto de los débitos aplicados en la auditoría.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-contador-refacturar',
          attachTo: { element: '.contador-refacturar', on: 'bottom' },
          title: 'Total a Refacturar',
          text: 'Indica el monto total acumulado habilitado para ser enviado a refacturación.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-btn-limpiar-filas',
          attachTo: { element: '.btn-clear-rows', on: 'bottom' },
          title: 'Limpiar Filas',
          text: 'Borra los datos de débitos y refacturas cargados en las filas seleccionadas de la grilla.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-exportar-excel',
          attachTo: { element: '.btn-exportar', on: 'left' },
          title: 'Exportar a Excel',
          text: 'Descarga la información de las prestaciones de la grilla a una planilla de cálculo Excel.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-guardar-parcialmente',
          attachTo: { element: '.btn-guardar', on: 'left' },
          title: 'Guardar Parcialmente',
          text: 'Guarda temporalmente el avance realizado en débitos y refacturas sin cerrar el documento.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-nueva-nota',
          attachTo: { element: '.btn-nueva-nota', on: 'left' },
          title: 'Nueva Nota de Crédito / Débito',
          text: 'Abre el formulario para generar el nuevo comprobante definitivo según la auditoría.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-grilla-resultados',
          attachTo: { element: '.tabla-grid-container', on: 'top' },
          title: 'Grilla de Resultados',
          text: 'Aquí se visualizan las prestaciones. Puede ordenar columnas y seleccionar múltiples filas para realizar modificaciones masivas.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-total-cantidad',
          attachTo: { element: '.total-cantidad-item', on: 'top' },
          title: 'Total Cantidad',
          text: 'Suma de las cantidades de todas las prestaciones visibles en la grilla.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-total-neto',
          attachTo: { element: '.total-neto-item', on: 'top' },
          title: 'Total Neto',
          text: 'Sumatoria del importe neto acumulado de todas las prestaciones.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-total-coseguro',
          attachTo: { element: '.total-coseguro-item', on: 'top' },
          title: 'Coseguro',
          text: 'Monto total del coseguro acumulado a cargo del paciente en este comprobante.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-total-facturado',
          attachTo: { element: '.total-facturado-item', on: 'top' },
          title: 'Total Facturado',
          text: 'Importe total consolidado del documento (suma de Neto + Coseguro).',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-total-debitado',
          attachTo: { element: '.total-debitado-item', on: 'top' },
          title: 'Total Debitado',
          text: 'Sumatoria total de los importes de débitos aplicados a las prestaciones.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            { text: 'Siguiente →', classes: 'shepherd-button-primary', action: () => this.shepherd.next() }
          ]
        },
        {
          id: 'paso-total-refacturado',
          attachTo: { element: '.total-refacturado-item', on: 'top' },
          title: 'Total Refacturado',
          text: 'Monto total aprobado y disponible para una nueva refacturación.',
          buttons: [
            { text: '← Atrás', classes: 'shepherd-button-secondary', action: () => this.shepherd.back() },
            {
              text: 'Finalizar ✓',
              classes: 'shepherd-button-primary',
              action: () => this.shepherd.complete()
            }
          ]
        }
      );
    }

    this.shepherd.addSteps(pasos);
    this._tourActivo$.next(true);
    this.shepherd.start();
  }

  // ── Métodos de Ayuda Privados ──────────────────────────────────────────────
  private configurarOpcionesDefault(): void {
    this.shepherd.defaultStepOptions = {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 4,
    };
    this.shepherd.modal = true;          // Habilita el modal oscuro y permite clic afuera
    this.shepherd.confirmCancel = false; // Cancela directamente sin prompt adicional
  }

  private limpiarPasosPrevios(): void {
    if (this.shepherd.tourObject) {
      // Limpia cualquier paso anterior guardado en el objeto Tour subyacente
      this.shepherd.tourObject.steps = [];
    }
  }

  private suscribirEventosFin(callbackFinalizar: () => void): void {
    if (this.shepherd.tourObject) {
      this.shepherd.tourObject.once('complete', callbackFinalizar);
      this.shepherd.tourObject.once('cancel', callbackFinalizar);
    }
  }

  private finalizarTourBusqueda(): void {
    localStorage.setItem(KEY_TOUR_BUSQUEDA, 'true');
    this._tourActivo$.next(false);
  }

  private finalizarTourResultados(): void {
    localStorage.setItem(KEY_TOUR_RESULTADOS, 'true');
    this._tourActivo$.next(false);
  }
}
