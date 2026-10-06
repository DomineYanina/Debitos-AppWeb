import {
  ChangeDetectionStrategy,
  CommonModule,
  Component,
  Input,
  Output,
  __spreadProps,
  __spreadValues,
  input,
  output,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomListener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵtext
} from "./chunk-QD5XYPYB.js";

// src/app/core/components/help-drawer/help-drawer.component.ts
var HelpDrawerComponent = class _HelpDrawerComponent {
  /**
   * Estado visual del panel lateral (abierto/cerrado).
   * Angular 21 Signal input con valor por defecto false.
   */
  isOpen = input(false, ...ngDevMode ? [{ debugName: "isOpen" }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Evento emitido cuando el usuario solicita cerrar el panel.
   */
  closeDrawer = output();
  /**
   * Evento opcional para reiniciar el tour guiado interactivo.
   */
  startTourRequested = output();
  /**
   * Estado desplegable de cada grupo de preguntas frecuentes (por defecto todos colapsados/ocultos).
   */
  openGroups = signal({
    busqueda: false,
    edicion: false,
    motivos: false,
    grilla: false,
    calculos: false,
    documentos: false,
    exportacion: false
  }, ...ngDevMode ? [{ debugName: "openGroups" }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Alterna la visibilidad de un grupo de preguntas (abierto / cerrado).
   */
  toggleGroup(groupId) {
    this.openGroups.update((state) => __spreadProps(__spreadValues({}, state), {
      [groupId]: !state[groupId]
    }));
  }
  /**
   * Indica si un grupo en específico está desplegado.
   */
  isGroupOpen(groupId) {
    return !!this.openGroups()[groupId];
  }
  /**
   * Estado desplegable de cada pregunta individual (por defecto todas colapsadas/ocultas).
   */
  openQuestions = signal({}, ...ngDevMode ? [{ debugName: "openQuestions" }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Alterna la visibilidad de la respuesta a una pregunta individual.
   */
  toggleQuestion(questionId) {
    this.openQuestions.update((state) => __spreadProps(__spreadValues({}, state), {
      [questionId]: !state[questionId]
    }));
  }
  /**
   * Indica si la respuesta a una pregunta individual está desplegada.
   */
  isQuestionOpen(questionId) {
    return !!this.openQuestions()[questionId];
  }
  /**
   * Notifica al componente padre el cierre del panel.
   */
  onClose() {
    this.closeDrawer.emit();
  }
  /**
   * Manejador del botón inferior para volver a ver el recorrido guiado.
   */
  onRestartTour() {
    this.startTourRequested.emit();
  }
  static \u0275fac = function HelpDrawerComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HelpDrawerComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HelpDrawerComponent, selectors: [["app-help-drawer"]], inputs: { isOpen: [1, "isOpen"] }, outputs: { closeDrawer: "closeDrawer", startTourRequested: "startTourRequested" }, decls: 252, vars: 137, consts: [[1, "drawer-backdrop", 3, "click"], [1, "drawer-container"], [1, "drawer-header"], [1, "drawer-header-title"], ["type", "button", "aria-label", "Cerrar panel de ayuda", 1, "btn-close", 3, "click"], [1, "drawer-body"], [1, "faq-group"], ["type", "button", "aria-controls", "faq-group-busqueda", 1, "faq-group-header", 3, "click"], [1, "faq-group-title"], [1, "faq-chevron"], ["width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2.5", "stroke-linecap", "round", "stroke-linejoin", "round"], ["points", "6 9 12 15 18 9"], ["id", "faq-group-busqueda", 1, "faq-group-content"], [1, "faq-group-inner"], [1, "faq-item"], ["type", "button", "aria-controls", "faq-ans-busqueda-q1", 1, "faq-question-button", 3, "click"], [1, "faq-question-text"], [1, "faq-question-chevron"], ["width", "14", "height", "14", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2.5", "stroke-linecap", "round", "stroke-linejoin", "round"], ["id", "faq-ans-busqueda-q1", 1, "faq-answer-wrapper"], [1, "faq-answer-inner"], ["type", "button", "aria-controls", "faq-ans-busqueda-q2", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-busqueda-q2", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-group-edicion", 1, "faq-group-header", 3, "click"], ["id", "faq-group-edicion", 1, "faq-group-content"], ["type", "button", "aria-controls", "faq-ans-edicion-q1", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-edicion-q1", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-ans-edicion-q2", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-edicion-q2", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-group-motivos", 1, "faq-group-header", 3, "click"], ["id", "faq-group-motivos", 1, "faq-group-content"], ["type", "button", "aria-controls", "faq-ans-motivos-q1", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-motivos-q1", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-ans-motivos-q2", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-motivos-q2", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-group-grilla", 1, "faq-group-header", 3, "click"], ["id", "faq-group-grilla", 1, "faq-group-content"], ["type", "button", "aria-controls", "faq-ans-grilla-q1", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-grilla-q1", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-ans-grilla-q2", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-grilla-q2", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-group-calculos", 1, "faq-group-header", 3, "click"], ["id", "faq-group-calculos", 1, "faq-group-content"], ["type", "button", "aria-controls", "faq-ans-calculos-q1", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-calculos-q1", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-ans-calculos-q2", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-calculos-q2", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-group-documentos", 1, "faq-group-header", 3, "click"], ["id", "faq-group-documentos", 1, "faq-group-content"], ["type", "button", "aria-controls", "faq-ans-documentos-q1", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-documentos-q1", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-ans-documentos-q2", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-documentos-q2", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-group-exportacion", 1, "faq-group-header", 3, "click"], ["id", "faq-group-exportacion", 1, "faq-group-content"], ["type", "button", "aria-controls", "faq-ans-exportacion-q1", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-exportacion-q1", 1, "faq-answer-wrapper"], ["type", "button", "aria-controls", "faq-ans-exportacion-q2", 1, "faq-question-button", 3, "click"], ["id", "faq-ans-exportacion-q2", 1, "faq-answer-wrapper"], [1, "drawer-footer"], ["type", "button", 1, "btn-restart-tour", 3, "click"]], template: function HelpDrawerComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "div", 0);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_div_click_0_listener() {
        return ctx.onClose();
      });
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(1, "div", 1)(2, "header", 2)(3, "div", 3)(4, "h2");
      \u0275\u0275text(5, "Preguntas Frecuentes");
      \u0275\u0275domElementEnd()();
      \u0275\u0275domElementStart(6, "button", 4);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_6_listener() {
        return ctx.onClose();
      });
      \u0275\u0275text(7, "\xD7");
      \u0275\u0275domElementEnd()();
      \u0275\u0275domElementStart(8, "main", 5)(9, "section", 6)(10, "button", 7);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_10_listener() {
        return ctx.toggleGroup("busqueda");
      });
      \u0275\u0275domElementStart(11, "span", 8);
      \u0275\u0275text(12, "B\xFAsqueda y Filtros");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(13, "span", 9);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(14, "svg", 10);
      \u0275\u0275domElement(15, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(16, "div", 12)(17, "div", 13)(18, "article", 14)(19, "button", 15);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_19_listener() {
        return ctx.toggleQuestion("busqueda-q1");
      });
      \u0275\u0275domElementStart(20, "span", 16);
      \u0275\u0275text(21, "\xBFC\xF3mo busco un documento espec\xEDfico?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(22, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(23, "svg", 18);
      \u0275\u0275domElement(24, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(25, "div", 19)(26, "div", 20)(27, "p");
      \u0275\u0275text(28, "Seleccion\xE1 el Tipo de documento (ej. Factura o Nota de D\xE9bito) en el panel superior, complet\xE1 los campos de Letra, Punto de Venta y N\xFAmero, y presion\xE1 el bot\xF3n azul ");
      \u0275\u0275domElementStart(29, "strong");
      \u0275\u0275text(30, "Buscar");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(31, ".");
      \u0275\u0275domElementEnd()()()();
      \u0275\u0275domElementStart(32, "article", 14)(33, "button", 21);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_33_listener() {
        return ctx.toggleQuestion("busqueda-q2");
      });
      \u0275\u0275domElementStart(34, "span", 16);
      \u0275\u0275text(35, "\xBFC\xF3mo borro los filtros aplicados?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(36, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(37, "svg", 18);
      \u0275\u0275domElement(38, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(39, "div", 22)(40, "div", 20)(41, "p");
      \u0275\u0275text(42, "Para restablecer los men\xFAs desplegables a su estado original sin perder la b\xFAsqueda, presion\xE1 el bot\xF3n ");
      \u0275\u0275domElementStart(43, "strong");
      \u0275\u0275text(44, "Limpiar Filtros");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(45, ".");
      \u0275\u0275domElementEnd()()()()()()();
      \u0275\u0275domElementStart(46, "section", 6)(47, "button", 23);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_47_listener() {
        return ctx.toggleGroup("edicion");
      });
      \u0275\u0275domElementStart(48, "span", 8);
      \u0275\u0275text(49, "Edici\xF3n y Aplicaci\xF3n Masiva");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(50, "span", 9);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(51, "svg", 10);
      \u0275\u0275domElement(52, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(53, "div", 24)(54, "div", 13)(55, "article", 14)(56, "button", 25);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_56_listener() {
        return ctx.toggleQuestion("edicion-q1");
      });
      \u0275\u0275domElementStart(57, "span", 16);
      \u0275\u0275text(58, "\xBFC\xF3mo aplico cambios a m\xFAltiples registros al mismo tiempo?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(59, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(60, "svg", 18);
      \u0275\u0275domElement(61, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(62, "div", 26)(63, "div", 20)(64, "p");
      \u0275\u0275text(65, "Seleccion\xE1 las prestaciones deseadas utilizando las casillas de verificaci\xF3n de la primera columna de la grilla. Luego, utiliz\xE1 la barra de acciones masivas sobre la tabla para definir el estado (D\xE9bito Aceptado, Motivo, Importe o Comentario) y presion\xE1 el bot\xF3n azul ");
      \u0275\u0275domElementStart(66, "strong");
      \u0275\u0275text(67, "Aplicar masivo");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(68, ". ");
      \u0275\u0275domElementEnd()()()();
      \u0275\u0275domElementStart(69, "article", 14)(70, "button", 27);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_70_listener() {
        return ctx.toggleQuestion("edicion-q2");
      });
      \u0275\u0275domElementStart(71, "span", 16);
      \u0275\u0275text(72, "\xBFQu\xE9 sucede si modifico datos y no los guardo de inmediato?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(73, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(74, "svg", 18);
      \u0275\u0275domElement(75, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(76, "div", 28)(77, "div", 20)(78, "p");
      \u0275\u0275text(79, "Los registros modificados se destacan visualmente en la grilla y el sistema activa una protecci\xF3n. Si intent\xE1s cerrar la pesta\xF1a del navegador o salir de la p\xE1gina antes de guardar, se mostrar\xE1 un cartel de advertencia para evitar la p\xE9rdida accidental de datos.");
      \u0275\u0275domElementEnd()()()()()()();
      \u0275\u0275domElementStart(80, "section", 6)(81, "button", 29);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_81_listener() {
        return ctx.toggleGroup("motivos");
      });
      \u0275\u0275domElementStart(82, "span", 8);
      \u0275\u0275text(83, "Clasificaci\xF3n de Motivos y Criterios");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(84, "span", 9);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(85, "svg", 10);
      \u0275\u0275domElement(86, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(87, "div", 30)(88, "div", 13)(89, "article", 14)(90, "button", 31);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_90_listener() {
        return ctx.toggleQuestion("motivos-q1");
      });
      \u0275\u0275domElementStart(91, "span", 16);
      \u0275\u0275text(92, "\xBFC\xF3mo est\xE1n organizados los motivos de d\xE9bito y refacturaci\xF3n?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(93, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(94, "svg", 18);
      \u0275\u0275domElement(95, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(96, "div", 32)(97, "div", 20)(98, "p");
      \u0275\u0275text(99, "Los motivos se agrupan en 6 categor\xEDas normalizadas (Administrativos, M\xE9dicos/Auditor\xEDa, Contractuales/Nomenclador, Operativos/Documentales, Ajustes Comerciales, y Otros). Esto te permite encontrar r\xE1pidamente la justificaci\xF3n exacta seleccionando la categor\xEDa correspondiente.");
      \u0275\u0275domElementEnd()()()();
      \u0275\u0275domElementStart(100, "article", 14)(101, "button", 33);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_101_listener() {
        return ctx.toggleQuestion("motivos-q2");
      });
      \u0275\u0275domElementStart(102, "span", 16);
      \u0275\u0275text(103, "\xBFC\xF3mo puedo quitar un motivo que asign\xE9 por error a una prestaci\xF3n?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(104, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(105, "svg", 18);
      \u0275\u0275domElement(106, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(107, "div", 34)(108, "div", 20)(109, "p");
      \u0275\u0275text(110, "Pod\xE9s seleccionar la opci\xF3n ");
      \u0275\u0275domElementStart(111, "strong");
      \u0275\u0275text(112, "Borrar");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(113, " en el desplegable de motivos (tanto en edici\xF3n individual como masiva). Al hacerlo, el campo volver\xE1 a quedar vac\xEDo.");
      \u0275\u0275domElementEnd()()()()()()();
      \u0275\u0275domElementStart(114, "section", 6)(115, "button", 35);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_115_listener() {
        return ctx.toggleGroup("grilla");
      });
      \u0275\u0275domElementStart(116, "span", 8);
      \u0275\u0275text(117, "Interacci\xF3n con la Grilla");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(118, "span", 9);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(119, "svg", 10);
      \u0275\u0275domElement(120, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(121, "div", 36)(122, "div", 13)(123, "article", 14)(124, "button", 37);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_124_listener() {
        return ctx.toggleQuestion("grilla-q1");
      });
      \u0275\u0275domElementStart(125, "span", 16);
      \u0275\u0275text(126, "\xBFC\xF3mo selecciono los registros a procesar?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(127, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(128, "svg", 18);
      \u0275\u0275domElement(129, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(130, "div", 38)(131, "div", 20)(132, "p");
      \u0275\u0275text(133, "Utiliz\xE1 las casillas de verificaci\xF3n de la primera columna. Para seleccionar todo, us\xE1 la casilla vac\xEDa del encabezado superior izquierdo.");
      \u0275\u0275domElementEnd()()()();
      \u0275\u0275domElementStart(134, "article", 14)(135, "button", 39);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_135_listener() {
        return ctx.toggleQuestion("grilla-q2");
      });
      \u0275\u0275domElementStart(136, "span", 16);
      \u0275\u0275text(137, "\xBFQu\xE9 indican los totales inferiores?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(138, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(139, "svg", 18);
      \u0275\u0275domElement(140, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(141, "div", 40)(142, "div", 20)(143, "p");
      \u0275\u0275text(144, "Resumen los valores de los registros visualizados actualmente (Cantidad, Total Neto, Coseguro), reflejando inmediatamente los filtros aplicados.");
      \u0275\u0275domElementEnd()()()()()()();
      \u0275\u0275domElementStart(145, "section", 6)(146, "button", 41);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_146_listener() {
        return ctx.toggleGroup("calculos");
      });
      \u0275\u0275domElementStart(147, "span", 8);
      \u0275\u0275text(148, "C\xE1lculos y Totales Autom\xE1ticos");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(149, "span", 9);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(150, "svg", 10);
      \u0275\u0275domElement(151, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(152, "div", 42)(153, "div", 13)(154, "article", 14)(155, "button", 43);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_155_listener() {
        return ctx.toggleQuestion("calculos-q1");
      });
      \u0275\u0275domElementStart(156, "span", 16);
      \u0275\u0275text(157, '\xBFC\xF3mo se calcula el importe de "Total Refacturado"?');
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(158, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(159, "svg", 18);
      \u0275\u0275domElement(160, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(161, "div", 44)(162, "div", 20)(163, "p");
      \u0275\u0275text(164, "El indicador suma autom\xE1ticamente los importes de refacturaci\xF3n de aquellas prestaciones donde marcaste que el d\xE9bito NO fue aceptado (D\xE9bito Aceptado = NO).");
      \u0275\u0275domElementEnd()()()();
      \u0275\u0275domElementStart(165, "article", 14)(166, "button", 45);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_166_listener() {
        return ctx.toggleQuestion("calculos-q2");
      });
      \u0275\u0275domElementStart(167, "span", 16);
      \u0275\u0275text(168, "\xBFLos totales inferiores cambian si aplico un filtro en la tabla?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(169, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(170, "svg", 18);
      \u0275\u0275domElement(171, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(172, "div", 46)(173, "div", 20)(174, "p");
      \u0275\u0275text(175, "S\xED. Todos los contadores del pie de p\xE1gina son din\xE1micos y resumen \xFAnicamente las prestaciones que ten\xE9s visibles en pantalla en ese momento, reflejando inmediatamente cualquier filtro o b\xFAsqueda aplicada.");
      \u0275\u0275domElementEnd()()()()()()();
      \u0275\u0275domElementStart(176, "section", 6)(177, "button", 47);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_177_listener() {
        return ctx.toggleGroup("documentos");
      });
      \u0275\u0275domElementStart(178, "span", 8);
      \u0275\u0275text(179, "Gesti\xF3n de Documentos y Guardado");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(180, "span", 9);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(181, "svg", 10);
      \u0275\u0275domElement(182, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(183, "div", 48)(184, "div", 13)(185, "article", 14)(186, "button", 49);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_186_listener() {
        return ctx.toggleQuestion("documentos-q1");
      });
      \u0275\u0275domElementStart(187, "span", 16);
      \u0275\u0275text(188, "\xBFPuedo retomar una auditor\xEDa guardada parcialmente?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(189, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(190, "svg", 18);
      \u0275\u0275domElement(191, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(192, "div", 50)(193, "div", 20)(194, "p");
      \u0275\u0275text(195, "S\xED. Al seleccionar ");
      \u0275\u0275domElementStart(196, "strong");
      \u0275\u0275text(197, "Guardar parcialmente");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(198, ", tu progreso queda registrado en la base de datos sin emitir un comprobante definitivo. Pod\xE9s buscar el documento nuevamente en cualquier momento y continuar desde donde lo dejaste.");
      \u0275\u0275domElementEnd()()()();
      \u0275\u0275domElementStart(199, "article", 14)(200, "button", 51);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_200_listener() {
        return ctx.toggleQuestion("documentos-q2");
      });
      \u0275\u0275domElementStart(201, "span", 16);
      \u0275\u0275text(202, "\xBFQu\xE9 diferencia hay entre guardar parcialmente y generar un nuevo documento?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(203, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(204, "svg", 18);
      \u0275\u0275domElement(205, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(206, "div", 52)(207, "div", 20)(208, "p")(209, "strong");
      \u0275\u0275text(210, "Guardar parcialmente");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(211, " almacena tu avance en estado borrador para seguir edit\xE1ndolo m\xE1s tarde sin emitir ning\xFAn comprobante. En cambio, ");
      \u0275\u0275domElementStart(212, "strong");
      \u0275\u0275text(213, "generar un nuevo documento");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(214, " (ya sea Nota de Cr\xE9dito o Nota de D\xE9bito) finaliza el proceso de auditor\xEDa y emite el comprobante oficial definitivo.");
      \u0275\u0275domElementEnd()()()()()()();
      \u0275\u0275domElementStart(215, "section", 6)(216, "button", 53);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_216_listener() {
        return ctx.toggleGroup("exportacion");
      });
      \u0275\u0275domElementStart(217, "span", 8);
      \u0275\u0275text(218, "Herramientas y Exportaci\xF3n");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(219, "span", 9);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(220, "svg", 10);
      \u0275\u0275domElement(221, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(222, "div", 54)(223, "div", 13)(224, "article", 14)(225, "button", 55);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_225_listener() {
        return ctx.toggleQuestion("exportacion-q1");
      });
      \u0275\u0275domElementStart(226, "span", 16);
      \u0275\u0275text(227, '\xBFQu\xE9 informaci\xF3n se descarga al presionar "Exportar Excel"?');
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(228, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(229, "svg", 18);
      \u0275\u0275domElement(230, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(231, "div", 56)(232, "div", 20)(233, "p");
      \u0275\u0275text(234, "Descarga una planilla de c\xE1lculo (.xlsx) con las filas y columnas exactas que est\xE1s viendo en pantalla, respetando los filtros actuales y los importes calculados.");
      \u0275\u0275domElementEnd()()()();
      \u0275\u0275domElementStart(235, "article", 14)(236, "button", 57);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_236_listener() {
        return ctx.toggleQuestion("exportacion-q2");
      });
      \u0275\u0275domElementStart(237, "span", 16);
      \u0275\u0275text(238, "\xBFC\xF3mo puedo volver a ver el recorrido guiado por la pantalla?");
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(239, "span", 17);
      \u0275\u0275namespaceSVG();
      \u0275\u0275domElementStart(240, "svg", 18);
      \u0275\u0275domElement(241, "polyline", 11);
      \u0275\u0275domElementEnd()()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275domElementStart(242, "div", 58)(243, "div", 20)(244, "p");
      \u0275\u0275text(245, "Pod\xE9s reiniciar el tutorial interactivo en cualquier momento haciendo clic en el bot\xF3n azul ");
      \u0275\u0275domElementStart(246, "strong");
      \u0275\u0275text(247, "Volver a ver el recorrido guiado");
      \u0275\u0275domElementEnd();
      \u0275\u0275text(248, " ubicado en el pie de este panel o desde el \xEDcono correspondiente en la barra superior. ");
      \u0275\u0275domElementEnd()()()()()()()();
      \u0275\u0275domElementStart(249, "footer", 59)(250, "button", 60);
      \u0275\u0275domListener("click", function HelpDrawerComponent_Template_button_click_250_listener() {
        return ctx.onRestartTour();
      });
      \u0275\u0275text(251, " Volver a ver el recorrido guiado ");
      \u0275\u0275domElementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275classProp("open", ctx.isOpen());
      \u0275\u0275advance();
      \u0275\u0275classProp("open", ctx.isOpen());
      \u0275\u0275advance(9);
      \u0275\u0275attribute("aria-expanded", ctx.isGroupOpen("busqueda"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isGroupOpen("busqueda"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isGroupOpen("busqueda"));
      \u0275\u0275advance(2);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("busqueda-q1"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("busqueda-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("busqueda-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("busqueda-q1"));
      \u0275\u0275advance(7);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("busqueda-q2"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("busqueda-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("busqueda-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("busqueda-q2"));
      \u0275\u0275advance(8);
      \u0275\u0275attribute("aria-expanded", ctx.isGroupOpen("edicion"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isGroupOpen("edicion"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isGroupOpen("edicion"));
      \u0275\u0275advance(2);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("edicion-q1"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("edicion-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("edicion-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("edicion-q1"));
      \u0275\u0275advance(7);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("edicion-q2"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("edicion-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("edicion-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("edicion-q2"));
      \u0275\u0275advance(5);
      \u0275\u0275attribute("aria-expanded", ctx.isGroupOpen("motivos"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isGroupOpen("motivos"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isGroupOpen("motivos"));
      \u0275\u0275advance(2);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("motivos-q1"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("motivos-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("motivos-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("motivos-q1"));
      \u0275\u0275advance(4);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("motivos-q2"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("motivos-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("motivos-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("motivos-q2"));
      \u0275\u0275advance(8);
      \u0275\u0275attribute("aria-expanded", ctx.isGroupOpen("grilla"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isGroupOpen("grilla"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isGroupOpen("grilla"));
      \u0275\u0275advance(2);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("grilla-q1"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("grilla-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("grilla-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("grilla-q1"));
      \u0275\u0275advance(4);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("grilla-q2"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("grilla-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("grilla-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("grilla-q2"));
      \u0275\u0275advance(5);
      \u0275\u0275attribute("aria-expanded", ctx.isGroupOpen("calculos"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isGroupOpen("calculos"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isGroupOpen("calculos"));
      \u0275\u0275advance(2);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("calculos-q1"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("calculos-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("calculos-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("calculos-q1"));
      \u0275\u0275advance(4);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("calculos-q2"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("calculos-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("calculos-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("calculos-q2"));
      \u0275\u0275advance(5);
      \u0275\u0275attribute("aria-expanded", ctx.isGroupOpen("documentos"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isGroupOpen("documentos"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isGroupOpen("documentos"));
      \u0275\u0275advance(2);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("documentos-q1"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("documentos-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("documentos-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("documentos-q1"));
      \u0275\u0275advance(7);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("documentos-q2"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("documentos-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("documentos-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("documentos-q2"));
      \u0275\u0275advance(10);
      \u0275\u0275attribute("aria-expanded", ctx.isGroupOpen("exportacion"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isGroupOpen("exportacion"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isGroupOpen("exportacion"));
      \u0275\u0275advance(2);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("exportacion-q1"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("exportacion-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("exportacion-q1"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("exportacion-q1"));
      \u0275\u0275advance(4);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("exportacion-q2"));
      \u0275\u0275advance();
      \u0275\u0275attribute("aria-expanded", ctx.isQuestionOpen("exportacion-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("rotated", ctx.isQuestionOpen("exportacion-q2"));
      \u0275\u0275advance(3);
      \u0275\u0275classProp("open", ctx.isQuestionOpen("exportacion-q2"));
    }
  }, dependencies: [CommonModule], styles: ["\n.drawer-backdrop[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  background-color: rgba(15, 23, 42, 0.45);\n  -webkit-backdrop-filter: blur(2px);\n  backdrop-filter: blur(2px);\n  z-index: 1049;\n  opacity: 0;\n  visibility: hidden;\n  transition: opacity 0.3s ease, visibility 0.3s ease;\n}\n.drawer-backdrop.open[_ngcontent-%COMP%] {\n  opacity: 1;\n  visibility: visible;\n}\n.drawer-container[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  right: 0;\n  height: 100vh;\n  width: 380px;\n  max-width: 92vw;\n  background-color: #ffffff;\n  z-index: 1050;\n  display: flex;\n  flex-direction: column;\n  box-shadow: -6px 0 25px rgba(0, 0, 0, 0.18);\n  transform: translateX(100%);\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-sizing: border-box;\n}\n.drawer-container.open[_ngcontent-%COMP%] {\n  transform: translateX(0);\n}\n.drawer-header[_ngcontent-%COMP%] {\n  padding: 1.25rem 1.5rem;\n  background:\n    linear-gradient(\n      135deg,\n      #1e3a8a 0%,\n      #2563eb 100%);\n  color: #ffffff;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n  flex-shrink: 0;\n}\n.drawer-header-title[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n}\n.drawer-header-title[_ngcontent-%COMP%]   .faq-icon[_ngcontent-%COMP%] {\n  font-size: 1.3rem;\n}\n.drawer-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.2rem;\n  font-weight: 700;\n  letter-spacing: 0.3px;\n  color: #ffffff;\n}\n.btn-close[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.15);\n  border: none;\n  color: #ffffff;\n  font-size: 1.6rem;\n  width: 34px;\n  height: 34px;\n  border-radius: 50%;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  line-height: 1;\n  transition: background-color 0.2s ease, transform 0.2s ease;\n}\n.btn-close[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.3);\n  transform: scale(1.08);\n}\n.drawer-body[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 1.5rem;\n  overflow-y: auto;\n  scroll-behavior: smooth;\n}\n.drawer-body[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 6px;\n}\n.drawer-body[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: #f1f5f9;\n}\n.drawer-body[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 3px;\n}\n.drawer-body[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}\n.faq-group[_ngcontent-%COMP%] {\n  margin-bottom: 1.25rem;\n}\n.faq-group[_ngcontent-%COMP%]:last-child {\n  margin-bottom: 0.5rem;\n}\n.faq-group-header[_ngcontent-%COMP%] {\n  width: 100%;\n  background: none;\n  border: none;\n  border-bottom: 2px solid #e2e8f0;\n  padding: 0.4rem 0.25rem 0.5rem 0.25rem;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  cursor: pointer;\n  text-align: left;\n  transition: border-color 0.2s ease, background-color 0.2s ease;\n  border-radius: 4px 4px 0 0;\n}\n.faq-group-header[_ngcontent-%COMP%]:hover {\n  border-bottom-color: #2563eb;\n}\n.faq-group-header[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #2563eb;\n  outline-offset: 2px;\n}\n.faq-group-title[_ngcontent-%COMP%] {\n  font-size: 1.05rem;\n  font-weight: 700;\n  color: #1e293b;\n  transition: color 0.2s ease;\n}\n.faq-group-header[_ngcontent-%COMP%]:hover   .faq-group-title[_ngcontent-%COMP%] {\n  color: #2563eb;\n}\n.faq-chevron[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  color: #64748b;\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;\n}\n.faq-group-header[_ngcontent-%COMP%]:hover   .faq-chevron[_ngcontent-%COMP%] {\n  color: #2563eb;\n}\n.faq-chevron.rotated[_ngcontent-%COMP%] {\n  transform: rotate(180deg);\n}\n.faq-group-content[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-rows: 0fr;\n  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;\n  opacity: 0;\n}\n.faq-group-content.open[_ngcontent-%COMP%] {\n  grid-template-rows: 1fr;\n  opacity: 1;\n}\n.faq-group-inner[_ngcontent-%COMP%] {\n  overflow: hidden;\n  padding-top: 0.75rem;\n}\n.faq-item[_ngcontent-%COMP%] {\n  background-color: #f8fafc;\n  border-left: 4px solid #3b82f6;\n  border-radius: 0 8px 8px 0;\n  margin-bottom: 0.65rem;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);\n  transition:\n    transform 0.2s ease,\n    box-shadow 0.2s ease,\n    background-color 0.2s ease;\n  overflow: hidden;\n}\n.faq-item[_ngcontent-%COMP%]:hover, \n.faq-item.open[_ngcontent-%COMP%] {\n  background-color: #ffffff;\n  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.12);\n}\n.faq-question-button[_ngcontent-%COMP%] {\n  width: 100%;\n  background: none;\n  border: none;\n  padding: 0.75rem 0.85rem;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  cursor: pointer;\n  text-align: left;\n  transition: background-color 0.2s ease;\n}\n.faq-question-button[_ngcontent-%COMP%]:focus-visible {\n  outline: 2px solid #2563eb;\n  outline-offset: -2px;\n}\n.faq-question-text[_ngcontent-%COMP%] {\n  font-size: 0.92rem;\n  font-weight: 600;\n  color: #1e3a8a;\n  line-height: 1.35;\n  transition: color 0.2s ease;\n}\n.faq-question-button[_ngcontent-%COMP%]:hover   .faq-question-text[_ngcontent-%COMP%] {\n  color: #2563eb;\n}\n.faq-question-chevron[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  color: #3b82f6;\n  flex-shrink: 0;\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;\n}\n.faq-question-chevron.rotated[_ngcontent-%COMP%] {\n  transform: rotate(180deg);\n}\n.faq-answer-wrapper[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-rows: 0fr;\n  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;\n  opacity: 0;\n}\n.faq-answer-wrapper.open[_ngcontent-%COMP%] {\n  grid-template-rows: 1fr;\n  opacity: 1;\n}\n.faq-answer-inner[_ngcontent-%COMP%] {\n  overflow: hidden;\n  padding: 0 0.85rem 0.75rem 0.85rem;\n}\n.faq-answer-inner[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 0.85rem;\n  line-height: 1.5;\n  color: #475569;\n  border-top: 1px dashed #e2e8f0;\n  padding-top: 0.6rem;\n}\n.drawer-footer[_ngcontent-%COMP%] {\n  padding: 1rem 1.5rem;\n  background-color: #f8fafc;\n  border-top: 1px solid #e2e8f0;\n  flex-shrink: 0;\n}\n.btn-restart-tour[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.75rem 1rem;\n  background:\n    linear-gradient(\n      135deg,\n      #2563eb 0%,\n      #1d4ed8 100%);\n  color: #ffffff;\n  border: none;\n  border-radius: 8px;\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.25);\n  transition:\n    background 0.2s ease,\n    transform 0.15s ease,\n    box-shadow 0.2s ease;\n}\n.btn-restart-tour[_ngcontent-%COMP%]:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #1d4ed8 0%,\n      #1e40af 100%);\n  box-shadow: 0 5px 14px rgba(37, 99, 235, 0.35);\n  transform: translateY(-1px);\n}\n.btn-restart-tour[_ngcontent-%COMP%]:active {\n  transform: translateY(0);\n  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);\n}\n/*# sourceMappingURL=help-drawer.component.css.map */"], changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HelpDrawerComponent, [{
    type: Component,
    args: [{ selector: "app-help-drawer", standalone: true, imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `<!-- Backdrop transl\xFAcido para oscurecer la pantalla al abrir -->
<div class="drawer-backdrop" [class.open]="isOpen()" (click)="onClose()"></div>

<!-- Contenedor Principal del Panel Offcanvas/Drawer -->
<div class="drawer-container" [class.open]="isOpen()">
  <!-- Encabezado del Panel -->
  <header class="drawer-header">
    <div class="drawer-header-title">
      <h2>Preguntas Frecuentes</h2>
    </div>
    <button type="button" class="btn-close" (click)="onClose()" aria-label="Cerrar panel de ayuda">&times;</button>
  </header>

  <!-- Contenido Principal con FAQ agrupado -->
  <main class="drawer-body">
    <!-- Categor\xEDa 1: B\xFAsqueda y Filtros -->
    <section class="faq-group">
      <button type="button" class="faq-group-header" (click)="toggleGroup('busqueda')"
        [attr.aria-expanded]="isGroupOpen('busqueda')" aria-controls="faq-group-busqueda">
        <span class="faq-group-title">B\xFAsqueda y Filtros</span>
        <span class="faq-chevron" [class.rotated]="isGroupOpen('busqueda')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div id="faq-group-busqueda" class="faq-group-content" [class.open]="isGroupOpen('busqueda')">
        <div class="faq-group-inner">
          <article class="faq-item" [class.open]="isQuestionOpen('busqueda-q1')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('busqueda-q1')"
              [attr.aria-expanded]="isQuestionOpen('busqueda-q1')" aria-controls="faq-ans-busqueda-q1">
              <span class="faq-question-text">\xBFC\xF3mo busco un documento espec\xEDfico?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('busqueda-q1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-busqueda-q1" class="faq-answer-wrapper" [class.open]="isQuestionOpen('busqueda-q1')">
              <div class="faq-answer-inner">
                <p>Seleccion\xE1 el Tipo de documento (ej. Factura o Nota de D\xE9bito) en el panel superior, complet\xE1 los
                  campos de Letra, Punto de Venta y N\xFAmero, y presion\xE1 el bot\xF3n azul <strong>Buscar</strong>.</p>
              </div>
            </div>
          </article>

          <article class="faq-item" [class.open]="isQuestionOpen('busqueda-q2')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('busqueda-q2')"
              [attr.aria-expanded]="isQuestionOpen('busqueda-q2')" aria-controls="faq-ans-busqueda-q2">
              <span class="faq-question-text">\xBFC\xF3mo borro los filtros aplicados?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('busqueda-q2')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-busqueda-q2" class="faq-answer-wrapper" [class.open]="isQuestionOpen('busqueda-q2')">
              <div class="faq-answer-inner">
                <p>Para restablecer los men\xFAs desplegables a su estado original sin perder la b\xFAsqueda, presion\xE1 el
                  bot\xF3n <strong>Limpiar Filtros</strong>.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Categor\xEDa 2: Edici\xF3n y Aplicaci\xF3n Masiva -->
    <section class="faq-group">
      <button type="button" class="faq-group-header" (click)="toggleGroup('edicion')"
        [attr.aria-expanded]="isGroupOpen('edicion')" aria-controls="faq-group-edicion">
        <span class="faq-group-title">Edici\xF3n y Aplicaci\xF3n Masiva</span>
        <span class="faq-chevron" [class.rotated]="isGroupOpen('edicion')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div id="faq-group-edicion" class="faq-group-content" [class.open]="isGroupOpen('edicion')">
        <div class="faq-group-inner">
          <article class="faq-item" [class.open]="isQuestionOpen('edicion-q1')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('edicion-q1')"
              [attr.aria-expanded]="isQuestionOpen('edicion-q1')" aria-controls="faq-ans-edicion-q1">
              <span class="faq-question-text">\xBFC\xF3mo aplico cambios a m\xFAltiples registros al mismo tiempo?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('edicion-q1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-edicion-q1" class="faq-answer-wrapper" [class.open]="isQuestionOpen('edicion-q1')">
              <div class="faq-answer-inner">
                <p>Seleccion\xE1 las prestaciones deseadas utilizando las casillas de verificaci\xF3n de la primera columna de
                  la grilla. Luego, utiliz\xE1 la barra de acciones masivas sobre la tabla para definir el estado (D\xE9bito
                  Aceptado, Motivo, Importe o Comentario) y presion\xE1 el bot\xF3n azul <strong>Aplicar masivo</strong>.
                </p>
              </div>
            </div>
          </article>

          <article class="faq-item" [class.open]="isQuestionOpen('edicion-q2')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('edicion-q2')"
              [attr.aria-expanded]="isQuestionOpen('edicion-q2')" aria-controls="faq-ans-edicion-q2">
              <span class="faq-question-text">\xBFQu\xE9 sucede si modifico datos y no los guardo de inmediato?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('edicion-q2')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-edicion-q2" class="faq-answer-wrapper" [class.open]="isQuestionOpen('edicion-q2')">
              <div class="faq-answer-inner">
                <p>Los registros modificados se destacan visualmente en la grilla y el sistema activa una protecci\xF3n. Si
                  intent\xE1s cerrar la pesta\xF1a del navegador o salir de la p\xE1gina antes de guardar, se mostrar\xE1 un cartel
                  de advertencia para evitar la p\xE9rdida accidental de datos.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Categor\xEDa 3: Clasificaci\xF3n de Motivos y Criterios -->
    <section class="faq-group">
      <button type="button" class="faq-group-header" (click)="toggleGroup('motivos')"
        [attr.aria-expanded]="isGroupOpen('motivos')" aria-controls="faq-group-motivos">
        <span class="faq-group-title">Clasificaci\xF3n de Motivos y Criterios</span>
        <span class="faq-chevron" [class.rotated]="isGroupOpen('motivos')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div id="faq-group-motivos" class="faq-group-content" [class.open]="isGroupOpen('motivos')">
        <div class="faq-group-inner">
          <article class="faq-item" [class.open]="isQuestionOpen('motivos-q1')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('motivos-q1')"
              [attr.aria-expanded]="isQuestionOpen('motivos-q1')" aria-controls="faq-ans-motivos-q1">
              <span class="faq-question-text">\xBFC\xF3mo est\xE1n organizados los motivos de d\xE9bito y refacturaci\xF3n?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('motivos-q1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-motivos-q1" class="faq-answer-wrapper" [class.open]="isQuestionOpen('motivos-q1')">
              <div class="faq-answer-inner">
                <p>Los motivos se agrupan en 6 categor\xEDas normalizadas (Administrativos, M\xE9dicos/Auditor\xEDa,
                  Contractuales/Nomenclador, Operativos/Documentales, Ajustes Comerciales, y Otros). Esto te permite
                  encontrar r\xE1pidamente la justificaci\xF3n exacta seleccionando la categor\xEDa correspondiente.</p>
              </div>
            </div>
          </article>

          <article class="faq-item" [class.open]="isQuestionOpen('motivos-q2')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('motivos-q2')"
              [attr.aria-expanded]="isQuestionOpen('motivos-q2')" aria-controls="faq-ans-motivos-q2">
              <span class="faq-question-text">\xBFC\xF3mo puedo quitar un motivo que asign\xE9 por error a una prestaci\xF3n?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('motivos-q2')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-motivos-q2" class="faq-answer-wrapper" [class.open]="isQuestionOpen('motivos-q2')">
              <div class="faq-answer-inner">
                <p>Pod\xE9s seleccionar la opci\xF3n <strong>Borrar</strong> en el desplegable de motivos (tanto en edici\xF3n
                  individual como masiva). Al hacerlo, el campo volver\xE1 a quedar vac\xEDo.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Categor\xEDa 4: Interacci\xF3n con la Grilla -->
    <section class="faq-group">
      <button type="button" class="faq-group-header" (click)="toggleGroup('grilla')"
        [attr.aria-expanded]="isGroupOpen('grilla')" aria-controls="faq-group-grilla">
        <span class="faq-group-title">Interacci\xF3n con la Grilla</span>
        <span class="faq-chevron" [class.rotated]="isGroupOpen('grilla')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div id="faq-group-grilla" class="faq-group-content" [class.open]="isGroupOpen('grilla')">
        <div class="faq-group-inner">
          <article class="faq-item" [class.open]="isQuestionOpen('grilla-q1')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('grilla-q1')"
              [attr.aria-expanded]="isQuestionOpen('grilla-q1')" aria-controls="faq-ans-grilla-q1">
              <span class="faq-question-text">\xBFC\xF3mo selecciono los registros a procesar?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('grilla-q1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-grilla-q1" class="faq-answer-wrapper" [class.open]="isQuestionOpen('grilla-q1')">
              <div class="faq-answer-inner">
                <p>Utiliz\xE1 las casillas de verificaci\xF3n de la primera columna. Para seleccionar todo, us\xE1 la casilla
                  vac\xEDa del encabezado superior izquierdo.</p>
              </div>
            </div>
          </article>

          <article class="faq-item" [class.open]="isQuestionOpen('grilla-q2')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('grilla-q2')"
              [attr.aria-expanded]="isQuestionOpen('grilla-q2')" aria-controls="faq-ans-grilla-q2">
              <span class="faq-question-text">\xBFQu\xE9 indican los totales inferiores?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('grilla-q2')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-grilla-q2" class="faq-answer-wrapper" [class.open]="isQuestionOpen('grilla-q2')">
              <div class="faq-answer-inner">
                <p>Resumen los valores de los registros visualizados actualmente (Cantidad, Total Neto, Coseguro),
                  reflejando inmediatamente los filtros aplicados.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Categor\xEDa 5: C\xE1lculos y Totales Autom\xE1ticos -->
    <section class="faq-group">
      <button type="button" class="faq-group-header" (click)="toggleGroup('calculos')"
        [attr.aria-expanded]="isGroupOpen('calculos')" aria-controls="faq-group-calculos">
        <span class="faq-group-title">C\xE1lculos y Totales Autom\xE1ticos</span>
        <span class="faq-chevron" [class.rotated]="isGroupOpen('calculos')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div id="faq-group-calculos" class="faq-group-content" [class.open]="isGroupOpen('calculos')">
        <div class="faq-group-inner">
          <article class="faq-item" [class.open]="isQuestionOpen('calculos-q1')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('calculos-q1')"
              [attr.aria-expanded]="isQuestionOpen('calculos-q1')" aria-controls="faq-ans-calculos-q1">
              <span class="faq-question-text">\xBFC\xF3mo se calcula el importe de "Total Refacturado"?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('calculos-q1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-calculos-q1" class="faq-answer-wrapper" [class.open]="isQuestionOpen('calculos-q1')">
              <div class="faq-answer-inner">
                <p>El indicador suma autom\xE1ticamente los importes de refacturaci\xF3n de aquellas prestaciones donde
                  marcaste que el d\xE9bito NO fue aceptado (D\xE9bito Aceptado = NO).</p>
              </div>
            </div>
          </article>

          <article class="faq-item" [class.open]="isQuestionOpen('calculos-q2')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('calculos-q2')"
              [attr.aria-expanded]="isQuestionOpen('calculos-q2')" aria-controls="faq-ans-calculos-q2">
              <span class="faq-question-text">\xBFLos totales inferiores cambian si aplico un filtro en la tabla?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('calculos-q2')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-calculos-q2" class="faq-answer-wrapper" [class.open]="isQuestionOpen('calculos-q2')">
              <div class="faq-answer-inner">
                <p>S\xED. Todos los contadores del pie de p\xE1gina son din\xE1micos y resumen \xFAnicamente las prestaciones que
                  ten\xE9s visibles en pantalla en ese momento, reflejando inmediatamente cualquier filtro o b\xFAsqueda
                  aplicada.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Categor\xEDa 4: Gesti\xF3n de Documentos y Guardado -->
    <section class="faq-group">
      <button type="button" class="faq-group-header" (click)="toggleGroup('documentos')"
        [attr.aria-expanded]="isGroupOpen('documentos')" aria-controls="faq-group-documentos">
        <span class="faq-group-title">Gesti\xF3n de Documentos y Guardado</span>
        <span class="faq-chevron" [class.rotated]="isGroupOpen('documentos')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div id="faq-group-documentos" class="faq-group-content" [class.open]="isGroupOpen('documentos')">
        <div class="faq-group-inner">
          <article class="faq-item" [class.open]="isQuestionOpen('documentos-q1')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('documentos-q1')"
              [attr.aria-expanded]="isQuestionOpen('documentos-q1')" aria-controls="faq-ans-documentos-q1">
              <span class="faq-question-text">\xBFPuedo retomar una auditor\xEDa guardada parcialmente?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('documentos-q1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-documentos-q1" class="faq-answer-wrapper" [class.open]="isQuestionOpen('documentos-q1')">
              <div class="faq-answer-inner">
                <p>S\xED. Al seleccionar <strong>Guardar parcialmente</strong>, tu progreso queda registrado en la base
                  de datos sin emitir un comprobante definitivo. Pod\xE9s buscar el documento nuevamente en cualquier
                  momento y continuar desde donde lo dejaste.</p>
              </div>
            </div>
          </article>

          <article class="faq-item" [class.open]="isQuestionOpen('documentos-q2')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('documentos-q2')"
              [attr.aria-expanded]="isQuestionOpen('documentos-q2')" aria-controls="faq-ans-documentos-q2">
              <span class="faq-question-text">\xBFQu\xE9 diferencia hay entre guardar parcialmente y generar un nuevo
                documento?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('documentos-q2')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-documentos-q2" class="faq-answer-wrapper" [class.open]="isQuestionOpen('documentos-q2')">
              <div class="faq-answer-inner">
                <p><strong>Guardar parcialmente</strong> almacena tu avance en estado borrador para seguir edit\xE1ndolo
                  m\xE1s tarde sin emitir ning\xFAn comprobante. En cambio, <strong>generar un nuevo documento</strong> (ya
                  sea Nota de Cr\xE9dito o Nota de D\xE9bito) finaliza el proceso de auditor\xEDa y emite el comprobante oficial
                  definitivo.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Categor\xEDa 5: Herramientas y Exportaci\xF3n -->
    <section class="faq-group">
      <button type="button" class="faq-group-header" (click)="toggleGroup('exportacion')"
        [attr.aria-expanded]="isGroupOpen('exportacion')" aria-controls="faq-group-exportacion">
        <span class="faq-group-title">Herramientas y Exportaci\xF3n</span>
        <span class="faq-chevron" [class.rotated]="isGroupOpen('exportacion')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div id="faq-group-exportacion" class="faq-group-content" [class.open]="isGroupOpen('exportacion')">
        <div class="faq-group-inner">
          <article class="faq-item" [class.open]="isQuestionOpen('exportacion-q1')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('exportacion-q1')"
              [attr.aria-expanded]="isQuestionOpen('exportacion-q1')" aria-controls="faq-ans-exportacion-q1">
              <span class="faq-question-text">\xBFQu\xE9 informaci\xF3n se descarga al presionar "Exportar Excel"?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('exportacion-q1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-exportacion-q1" class="faq-answer-wrapper" [class.open]="isQuestionOpen('exportacion-q1')">
              <div class="faq-answer-inner">
                <p>Descarga una planilla de c\xE1lculo (.xlsx) con las filas y columnas exactas que est\xE1s viendo en
                  pantalla, respetando los filtros actuales y los importes calculados.</p>
              </div>
            </div>
          </article>

          <article class="faq-item" [class.open]="isQuestionOpen('exportacion-q2')">
            <button type="button" class="faq-question-button" (click)="toggleQuestion('exportacion-q2')"
              [attr.aria-expanded]="isQuestionOpen('exportacion-q2')" aria-controls="faq-ans-exportacion-q2">
              <span class="faq-question-text">\xBFC\xF3mo puedo volver a ver el recorrido guiado por la pantalla?</span>
              <span class="faq-question-chevron" [class.rotated]="isQuestionOpen('exportacion-q2')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            <div id="faq-ans-exportacion-q2" class="faq-answer-wrapper" [class.open]="isQuestionOpen('exportacion-q2')">
              <div class="faq-answer-inner">
                <p>Pod\xE9s reiniciar el tutorial interactivo en cualquier momento haciendo clic en el bot\xF3n azul
                  <strong>Volver a ver el recorrido guiado</strong> ubicado en el pie de este panel o desde el \xEDcono
                  correspondiente en la barra superior.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </main>

  <!-- Pie del Panel con Acci\xF3n Guiada -->
  <footer class="drawer-footer">
    <button type="button" class="btn-restart-tour" (click)="onRestartTour()">
      Volver a ver el recorrido guiado
    </button>
  </footer>
</div>`, styles: ["/* src/app/core/components/help-drawer/help-drawer.component.css */\n.drawer-backdrop {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  background-color: rgba(15, 23, 42, 0.45);\n  -webkit-backdrop-filter: blur(2px);\n  backdrop-filter: blur(2px);\n  z-index: 1049;\n  opacity: 0;\n  visibility: hidden;\n  transition: opacity 0.3s ease, visibility 0.3s ease;\n}\n.drawer-backdrop.open {\n  opacity: 1;\n  visibility: visible;\n}\n.drawer-container {\n  position: fixed;\n  top: 0;\n  right: 0;\n  height: 100vh;\n  width: 380px;\n  max-width: 92vw;\n  background-color: #ffffff;\n  z-index: 1050;\n  display: flex;\n  flex-direction: column;\n  box-shadow: -6px 0 25px rgba(0, 0, 0, 0.18);\n  transform: translateX(100%);\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-sizing: border-box;\n}\n.drawer-container.open {\n  transform: translateX(0);\n}\n.drawer-header {\n  padding: 1.25rem 1.5rem;\n  background:\n    linear-gradient(\n      135deg,\n      #1e3a8a 0%,\n      #2563eb 100%);\n  color: #ffffff;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n  flex-shrink: 0;\n}\n.drawer-header-title {\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n}\n.drawer-header-title .faq-icon {\n  font-size: 1.3rem;\n}\n.drawer-header h2 {\n  margin: 0;\n  font-size: 1.2rem;\n  font-weight: 700;\n  letter-spacing: 0.3px;\n  color: #ffffff;\n}\n.btn-close {\n  background: rgba(255, 255, 255, 0.15);\n  border: none;\n  color: #ffffff;\n  font-size: 1.6rem;\n  width: 34px;\n  height: 34px;\n  border-radius: 50%;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  line-height: 1;\n  transition: background-color 0.2s ease, transform 0.2s ease;\n}\n.btn-close:hover {\n  background: rgba(255, 255, 255, 0.3);\n  transform: scale(1.08);\n}\n.drawer-body {\n  flex: 1;\n  padding: 1.5rem;\n  overflow-y: auto;\n  scroll-behavior: smooth;\n}\n.drawer-body::-webkit-scrollbar {\n  width: 6px;\n}\n.drawer-body::-webkit-scrollbar-track {\n  background: #f1f5f9;\n}\n.drawer-body::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 3px;\n}\n.drawer-body::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}\n.faq-group {\n  margin-bottom: 1.25rem;\n}\n.faq-group:last-child {\n  margin-bottom: 0.5rem;\n}\n.faq-group-header {\n  width: 100%;\n  background: none;\n  border: none;\n  border-bottom: 2px solid #e2e8f0;\n  padding: 0.4rem 0.25rem 0.5rem 0.25rem;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  cursor: pointer;\n  text-align: left;\n  transition: border-color 0.2s ease, background-color 0.2s ease;\n  border-radius: 4px 4px 0 0;\n}\n.faq-group-header:hover {\n  border-bottom-color: #2563eb;\n}\n.faq-group-header:focus-visible {\n  outline: 2px solid #2563eb;\n  outline-offset: 2px;\n}\n.faq-group-title {\n  font-size: 1.05rem;\n  font-weight: 700;\n  color: #1e293b;\n  transition: color 0.2s ease;\n}\n.faq-group-header:hover .faq-group-title {\n  color: #2563eb;\n}\n.faq-chevron {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  color: #64748b;\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;\n}\n.faq-group-header:hover .faq-chevron {\n  color: #2563eb;\n}\n.faq-chevron.rotated {\n  transform: rotate(180deg);\n}\n.faq-group-content {\n  display: grid;\n  grid-template-rows: 0fr;\n  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;\n  opacity: 0;\n}\n.faq-group-content.open {\n  grid-template-rows: 1fr;\n  opacity: 1;\n}\n.faq-group-inner {\n  overflow: hidden;\n  padding-top: 0.75rem;\n}\n.faq-item {\n  background-color: #f8fafc;\n  border-left: 4px solid #3b82f6;\n  border-radius: 0 8px 8px 0;\n  margin-bottom: 0.65rem;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);\n  transition:\n    transform 0.2s ease,\n    box-shadow 0.2s ease,\n    background-color 0.2s ease;\n  overflow: hidden;\n}\n.faq-item:hover,\n.faq-item.open {\n  background-color: #ffffff;\n  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.12);\n}\n.faq-question-button {\n  width: 100%;\n  background: none;\n  border: none;\n  padding: 0.75rem 0.85rem;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n  cursor: pointer;\n  text-align: left;\n  transition: background-color 0.2s ease;\n}\n.faq-question-button:focus-visible {\n  outline: 2px solid #2563eb;\n  outline-offset: -2px;\n}\n.faq-question-text {\n  font-size: 0.92rem;\n  font-weight: 600;\n  color: #1e3a8a;\n  line-height: 1.35;\n  transition: color 0.2s ease;\n}\n.faq-question-button:hover .faq-question-text {\n  color: #2563eb;\n}\n.faq-question-chevron {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  color: #3b82f6;\n  flex-shrink: 0;\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;\n}\n.faq-question-chevron.rotated {\n  transform: rotate(180deg);\n}\n.faq-answer-wrapper {\n  display: grid;\n  grid-template-rows: 0fr;\n  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;\n  opacity: 0;\n}\n.faq-answer-wrapper.open {\n  grid-template-rows: 1fr;\n  opacity: 1;\n}\n.faq-answer-inner {\n  overflow: hidden;\n  padding: 0 0.85rem 0.75rem 0.85rem;\n}\n.faq-answer-inner p {\n  margin: 0;\n  font-size: 0.85rem;\n  line-height: 1.5;\n  color: #475569;\n  border-top: 1px dashed #e2e8f0;\n  padding-top: 0.6rem;\n}\n.drawer-footer {\n  padding: 1rem 1.5rem;\n  background-color: #f8fafc;\n  border-top: 1px solid #e2e8f0;\n  flex-shrink: 0;\n}\n.btn-restart-tour {\n  width: 100%;\n  padding: 0.75rem 1rem;\n  background:\n    linear-gradient(\n      135deg,\n      #2563eb 0%,\n      #1d4ed8 100%);\n  color: #ffffff;\n  border: none;\n  border-radius: 8px;\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.25);\n  transition:\n    background 0.2s ease,\n    transform 0.15s ease,\n    box-shadow 0.2s ease;\n}\n.btn-restart-tour:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #1d4ed8 0%,\n      #1e40af 100%);\n  box-shadow: 0 5px 14px rgba(37, 99, 235, 0.35);\n  transform: translateY(-1px);\n}\n.btn-restart-tour:active {\n  transform: translateY(0);\n  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);\n}\n/*# sourceMappingURL=help-drawer.component.css.map */\n"] }]
  }], null, { isOpen: [{ type: Input, args: [{ isSignal: true, alias: "isOpen", required: false }] }], closeDrawer: [{ type: Output, args: ["closeDrawer"] }], startTourRequested: [{ type: Output, args: ["startTourRequested"] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HelpDrawerComponent, { className: "HelpDrawerComponent", filePath: "src/app/core/components/help-drawer/help-drawer.component.ts", lineNumber: 12 });
})();
export {
  HelpDrawerComponent
};
//# sourceMappingURL=chunk-6WPXSIWJ.js.map
