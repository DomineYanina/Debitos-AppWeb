import {
  DirectorioService
} from "./chunk-SCS44KY4.js";
import {
  ActivatedRoute,
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel,
  Router
} from "./chunk-FKTKYBCK.js";
import {
  ChangeDetectorRef,
  CommonModule,
  Component,
  DatePipe,
  NgForOf,
  NgIf,
  combineLatest,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-IXY2MHCK.js";

// src/app/features/directorio/directorio-motivo-detalle.component.ts
function DirectorioMotivoDetalleComponent_span_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1, "\u{1F4C4} Comprobante: ");
    \u0275\u0275elementStart(2, "strong");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r0.tipoDoc);
  }
}
function DirectorioMotivoDetalleComponent_span_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 10);
    \u0275\u0275text(1, "\u{1F4C5} Per\xEDodo: ");
    \u0275\u0275elementStart(2, "strong");
    \u0275\u0275text(3);
    \u0275\u0275pipe(4, "date");
    \u0275\u0275pipe(5, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", \u0275\u0275pipeBind2(4, 2, ctx_r0.fechaDesde, "dd/MM/yyyy") || "Inicio", " - ", \u0275\u0275pipeBind2(5, 5, ctx_r0.fechaHasta, "dd/MM/yyyy") || "Hoy");
  }
}
function DirectorioMotivoDetalleComponent_div_42_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 26);
    \u0275\u0275element(1, "div", 27);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando detalle de prestaciones debitadas...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioMotivoDetalleComponent_div_43_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 28)(1, "span", 29);
    \u0275\u0275text(2, "\u{1F4C2}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron prestaciones debitadas para el motivo y filtros seleccionados.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioMotivoDetalleComponent_div_44_tr_23_span_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 53);
    \u0275\u0275text(1, "\u{1F4AC}");
    \u0275\u0275elementEnd();
  }
}
function DirectorioMotivoDetalleComponent_div_44_tr_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td")(2, "div", 35)(3, "span", 36);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "strong");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(7, "td", 37);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td")(11, "div", 38)(12, "strong", 39);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 40);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "td")(17, "div", 41)(18, "span", 42);
    \u0275\u0275text(19);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "span", 43);
    \u0275\u0275text(21);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(22, "td")(23, "div", 44)(24, "code", 45);
    \u0275\u0275text(25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "span", 46);
    \u0275\u0275text(27);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(28, "td")(29, "span", 47);
    \u0275\u0275text(30);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(31, "td")(32, "div", 48);
    \u0275\u0275template(33, DirectorioMotivoDetalleComponent_div_44_tr_23_span_33_Template, 2, 0, "span", 49);
    \u0275\u0275elementStart(34, "span", 50);
    \u0275\u0275text(35);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(36, "td", 51);
    \u0275\u0275text(37);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "td", 33)(39, "span", 52);
    \u0275\u0275text(40);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const p_r2 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(p_r2.tipoDoc || "NC");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.formatearComprobante(p_r2.letraDoc, p_r2.ptovtaDoc, p_r2.numeroDoc));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(9, 22, p_r2.fechaDoc, "dd/MM/yyyy"));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(p_r2.paciente || "S/D");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(p_r2.carnet || "Sin Carnet");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(p_r2.plan || "General");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(p_r2.medico || p_r2.efector || "Efector S/D");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(p_r2.codigo);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(p_r2.descripcion);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(p_r2.motivoDebito);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("no-comment", !p_r2.comentariosDebito || p_r2.comentariosDebito.trim() === "");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", p_r2.comentariosDebito);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(p_r2.comentariosDebito || "Sin observaciones registradas");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r0.formatearMoneda(p_r2.importeDebitado), " ");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("badge-aceptado", p_r2.debitoAceptado === true)("badge-rechazado", p_r2.debitoAceptado === false)("badge-pendiente", p_r2.debitoAceptado === null);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", p_r2.debitoAceptado === true ? "S\xCD (P\xE9rdida)" : p_r2.debitoAceptado === false ? "NO (Refacturable)" : "Pendiente", " ");
  }
}
function DirectorioMotivoDetalleComponent_div_44_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 30)(1, "table", 31)(2, "thead")(3, "tr")(4, "th");
    \u0275\u0275text(5, "Comprobante NC");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th");
    \u0275\u0275text(7, "Fecha");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th");
    \u0275\u0275text(9, "Paciente / Carnet");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th");
    \u0275\u0275text(11, "Plan & M\xE9dico");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th");
    \u0275\u0275text(13, "Prestaci\xF3n M\xE9dica");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th");
    \u0275\u0275text(15, "Motivo de D\xE9bito");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "th");
    \u0275\u0275text(17, "Comentarios del Operador (Texto Libre)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "th", 32);
    \u0275\u0275text(19, "Importe Debitado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "th", 33);
    \u0275\u0275text(21, "Aceptado");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(22, "tbody");
    \u0275\u0275template(23, DirectorioMotivoDetalleComponent_div_44_tr_23_Template, 41, 25, "tr", 34);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(23);
    \u0275\u0275property("ngForOf", ctx_r0.prestacionesFiltradas);
  }
}
var DirectorioMotivoDetalleComponent = class _DirectorioMotivoDetalleComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  directorioService = inject(DirectorioService);
  cdr = inject(ChangeDetectorRef);
  motivo = "";
  codigoCobertura = "TODAS";
  tipoDoc = "TODOS";
  fechaDesde = "";
  fechaHasta = "";
  cargando = false;
  prestaciones = [];
  filtroBusqueda = "";
  totalMontoDebitado = 0;
  totalCasos = 0;
  ngOnInit() {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const motivoParam = params.get("motivoId") || "";
      try {
        this.motivo = decodeURIComponent(motivoParam);
      } catch {
        this.motivo = motivoParam;
      }
      this.codigoCobertura = queryParams.get("codigoCobertura") || "TODAS";
      this.tipoDoc = queryParams.get("tipoDoc") || "TODOS";
      this.fechaDesde = queryParams.get("fechaDesde") || "";
      this.fechaHasta = queryParams.get("fechaHasta") || "";
      this.cargarDetalle();
    });
  }
  cargarDetalle() {
    if (!this.motivo)
      return;
    this.cargando = true;
    this.directorioService.obtenerMotivoDetalle(this.motivo, this.codigoCobertura, this.tipoDoc, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.prestaciones = data || [];
        this.calcularTotales();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar prestaciones por motivo:", err);
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }
  calcularTotales() {
    this.totalMontoDebitado = this.prestaciones.reduce((acc, p) => acc + (p.importeDebitado || 0), 0);
    this.totalCasos = this.prestaciones.length;
  }
  get prestacionesFiltradas() {
    if (!this.filtroBusqueda || this.filtroBusqueda.trim() === "") {
      return this.prestaciones;
    }
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.prestaciones.filter((p) => p.paciente && p.paciente.toLowerCase().includes(q) || p.carnet && p.carnet.toLowerCase().includes(q) || p.codigo && p.codigo.toLowerCase().includes(q) || p.descripcion && p.descripcion.toLowerCase().includes(q) || p.comentariosDebito && p.comentariosDebito.toLowerCase().includes(q) || p.efector && p.efector.toLowerCase().includes(q) || p.medico && p.medico.toLowerCase().includes(q));
  }
  volverAlTablero() {
    this.router.navigate(["/directorio"]);
  }
  formatearComprobante(letra, ptovta, numero) {
    const l = letra ? letra.trim() + " " : "";
    const pto = String(ptovta || 0).padStart(4, "0");
    const num = String(numero || 0).padStart(8, "0");
    return `${l}${pto}-${num}`;
  }
  formatearMoneda(valor) {
    if (valor === void 0 || valor === null || isNaN(valor))
      return "$ 0,00";
    return "$ " + valor.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  static \u0275fac = function DirectorioMotivoDetalleComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DirectorioMotivoDetalleComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DirectorioMotivoDetalleComponent, selectors: [["app-directorio-motivo-detalle"]], decls: 45, vars: 12, consts: [[1, "drilldown-container"], [1, "drilldown-header"], [1, "breadcrumb-bar"], ["type", "button", "title", "Regresar al Tablero de Control", 1, "btn-back", 3, "click"], [1, "breadcrumb-sep"], [1, "breadcrumb-current"], [1, "header-main-card"], [1, "header-info"], [1, "motivo-title"], [1, "context-filters"], [1, "filter-pill"], ["class", "filter-pill", 4, "ngIf"], [1, "header-stats"], [1, "stat-box"], [1, "stat-label"], [1, "stat-value", "text-danger"], [1, "stat-value"], [1, "search-bar-card"], [1, "search-input-wrapper"], [1, "search-icon"], ["type", "text", "placeholder", "Buscar por paciente, carnet, c\xF3digo de prestaci\xF3n, m\xE9dico o texto del comentario...", 1, "form-control-search", 3, "ngModelChange", "ngModel"], [1, "results-count"], [1, "table-card"], ["class", "loading-state", 4, "ngIf"], ["class", "empty-state", 4, "ngIf"], ["class", "table-responsive", 4, "ngIf"], [1, "loading-state"], [1, "spinner"], [1, "empty-state"], [1, "empty-icon"], [1, "table-responsive"], [1, "table-drilldown"], [1, "text-right"], [1, "text-center"], [4, "ngFor", "ngForOf"], [1, "doc-badge-wrapper"], [1, "badge-nc"], [1, "text-nowrap"], [1, "patient-info"], [1, "patient-name"], [1, "patient-carnet"], [1, "medical-info"], [1, "plan-badge"], [1, "medico-name"], [1, "prestation-info"], [1, "code-pill"], [1, "desc-text"], [1, "motivo-highlight"], [1, "operator-comment-box"], ["class", "comment-icon", 4, "ngIf"], [1, "comment-text"], [1, "text-right", "font-weight-bold", "color-debito", "text-nowrap"], [1, "status-badge"], [1, "comment-icon"]], template: function DirectorioMotivoDetalleComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "div", 2)(3, "button", 3);
      \u0275\u0275listener("click", function DirectorioMotivoDetalleComponent_Template_button_click_3_listener() {
        return ctx.volverAlTablero();
      });
      \u0275\u0275text(4, " \u2190 Volver al Tablero Principal ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "span", 4);
      \u0275\u0275text(6, "/");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "span", 5);
      \u0275\u0275text(8, "Detalle por Motivo");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(9, "div", 6)(10, "div", 7)(11, "h1", 8);
      \u0275\u0275text(12);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(13, "div", 9)(14, "span", 10);
      \u0275\u0275text(15, "\u{1F3E5} Cobertura: ");
      \u0275\u0275elementStart(16, "strong");
      \u0275\u0275text(17);
      \u0275\u0275elementEnd()();
      \u0275\u0275template(18, DirectorioMotivoDetalleComponent_span_18_Template, 4, 1, "span", 11)(19, DirectorioMotivoDetalleComponent_span_19_Template, 6, 8, "span", 11);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(20, "div", 12)(21, "div", 13)(22, "span", 14);
      \u0275\u0275text(23, "Total Debitado en este Motivo");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(24, "span", 15);
      \u0275\u0275text(25);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(26, "div", 13)(27, "span", 14);
      \u0275\u0275text(28, "Cantidad de Prestaciones");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(29, "span", 16);
      \u0275\u0275text(30);
      \u0275\u0275elementEnd()()()()();
      \u0275\u0275elementStart(31, "div", 17)(32, "div", 18)(33, "span", 19);
      \u0275\u0275text(34, "\u{1F50D}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(35, "input", 20);
      \u0275\u0275twoWayListener("ngModelChange", function DirectorioMotivoDetalleComponent_Template_input_ngModelChange_35_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.filtroBusqueda, $event) || (ctx.filtroBusqueda = $event);
        return $event;
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(36, "div", 21);
      \u0275\u0275text(37, " Mostrando ");
      \u0275\u0275elementStart(38, "strong");
      \u0275\u0275text(39);
      \u0275\u0275elementEnd();
      \u0275\u0275text(40);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(41, "section", 22);
      \u0275\u0275template(42, DirectorioMotivoDetalleComponent_div_42_Template, 4, 0, "div", 23)(43, DirectorioMotivoDetalleComponent_div_43_Template, 5, 0, "div", 24)(44, DirectorioMotivoDetalleComponent_div_44_Template, 24, 1, "div", 25);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(12);
      \u0275\u0275textInterpolate(ctx.motivo);
      \u0275\u0275advance(5);
      \u0275\u0275textInterpolate(ctx.codigoCobertura === "TODAS" ? "Todas las Instituciones" : ctx.codigoCobertura);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.tipoDoc && ctx.tipoDoc !== "TODOS");
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.fechaDesde || ctx.fechaHasta);
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate(ctx.formatearMoneda(ctx.totalMontoDebitado));
      \u0275\u0275advance(5);
      \u0275\u0275textInterpolate(ctx.totalCasos);
      \u0275\u0275advance(5);
      \u0275\u0275twoWayProperty("ngModel", ctx.filtroBusqueda);
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate(ctx.prestacionesFiltradas.length);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" de ", ctx.prestaciones.length, " prestaciones ");
      \u0275\u0275advance(2);
      \u0275\u0275property("ngIf", ctx.cargando);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargando && ctx.prestaciones.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargando && ctx.prestacionesFiltradas.length > 0);
    }
  }, dependencies: [CommonModule, NgForOf, NgIf, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, DatePipe], styles: ['\n.drilldown-container[_ngcontent-%COMP%] {\n  max-width: 1600px;\n  margin: 0 auto;\n  padding: 1.5rem 2rem 3rem 2rem;\n  color: #1e293b;\n  font-family:\n    system-ui,\n    -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    Roboto,\n    Oxygen,\n    Ubuntu,\n    Cantarell,\n    sans-serif;\n}\n.breadcrumb-bar[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 1rem;\n}\n.btn-back[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #cbd5e1;\n  color: #2563eb;\n  font-size: 0.85rem;\n  font-weight: 600;\n  padding: 0.4rem 0.85rem;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  display: inline-flex;\n  align-items: center;\n}\n.btn-back[_ngcontent-%COMP%]:hover {\n  background: #eff6ff;\n  border-color: #3b82f6;\n  transform: translateX(-2px);\n}\n.breadcrumb-sep[_ngcontent-%COMP%] {\n  color: #94a3b8;\n}\n.breadcrumb-current[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.85rem;\n  font-weight: 500;\n}\n.header-main-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.5rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  flex-wrap: wrap;\n  gap: 1.5rem;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);\n  margin-bottom: 1.5rem;\n}\n.badge-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  align-items: center;\n  margin-bottom: 0.5rem;\n}\n.badge-drilldown[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #0284c7,\n      #0369a1);\n  color: #ffffff;\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n  text-transform: uppercase;\n}\n.badge-readonly[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n  font-size: 0.72rem;\n  font-weight: 600;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n}\n.motivo-title[_ngcontent-%COMP%] {\n  font-size: 1.6rem;\n  font-weight: 800;\n  color: #0f172a;\n  margin: 0 0 0.5rem 0;\n  letter-spacing: -0.02em;\n}\n.context-filters[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n}\n.filter-pill[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  padding: 0.25rem 0.65rem;\n  border-radius: 6px;\n  font-size: 0.8rem;\n  color: #475569;\n}\n.filter-pill[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  color: #0f172a;\n}\n.header-stats[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 1rem;\n}\n.stat-box[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 0.85rem 1.25rem;\n  display: flex;\n  flex-direction: column;\n  min-width: 170px;\n}\n.stat-label[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  color: #64748b;\n  margin-bottom: 0.25rem;\n}\n.stat-value[_ngcontent-%COMP%] {\n  font-size: 1.4rem;\n  font-weight: 800;\n  color: #0f172a;\n}\n.text-danger[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\n.search-bar-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 0.85rem 1.25rem;\n  margin-bottom: 1.25rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.search-input-wrapper[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  flex: 1;\n  min-width: 280px;\n}\n.search-icon[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  color: #94a3b8;\n}\n.form-control-search[_ngcontent-%COMP%] {\n  width: 100%;\n  border: 1px solid #cbd5e1;\n  background-color: #f8fafc;\n  color: #0f172a;\n  padding: 0.5rem 0.85rem;\n  border-radius: 8px;\n  font-size: 0.88rem;\n  outline: none;\n  transition: all 0.2s ease;\n}\n.form-control-search[_ngcontent-%COMP%]:focus {\n  border-color: #3b82f6;\n  background-color: #ffffff;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);\n}\n.results-count[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  color: #64748b;\n}\n.table-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.25rem;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);\n}\n.table-responsive[_ngcontent-%COMP%] {\n  overflow-x: auto;\n}\n.table-drilldown[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.85rem;\n}\n.table-drilldown[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  color: #475569;\n  font-size: 0.72rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  padding: 0.75rem 0.85rem;\n  border-bottom: 2px solid #e2e8f0;\n  text-align: left;\n}\n.table-drilldown[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.85rem 0.85rem;\n  border-bottom: 1px solid #f1f5f9;\n  vertical-align: top;\n}\n.table-drilldown[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:hover {\n  background-color: #f8fafc;\n}\n.doc-badge-wrapper[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.badge-nc[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #b91c1c;\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.4rem;\n  border-radius: 4px;\n}\n.patient-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n}\n.patient-name[_ngcontent-%COMP%] {\n  color: #0f172a;\n  font-size: 0.88rem;\n}\n.patient-carnet[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.78rem;\n  font-family: monospace;\n}\n.medical-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.plan-badge[_ngcontent-%COMP%] {\n  background: #e0f2fe;\n  color: #0369a1;\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.1rem 0.4rem;\n  border-radius: 4px;\n  width: fit-content;\n}\n.medico-name[_ngcontent-%COMP%] {\n  color: #475569;\n  font-size: 0.78rem;\n}\n.prestation-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.code-pill[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #0f172a;\n  padding: 0.15rem 0.4rem;\n  border-radius: 4px;\n  font-weight: 700;\n  width: fit-content;\n  font-size: 0.78rem;\n}\n.desc-text[_ngcontent-%COMP%] {\n  color: #334155;\n  font-size: 0.8rem;\n}\n.motivo-highlight[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #1e293b;\n  background: #fef3c7;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  font-size: 0.8rem;\n}\n.operator-comment-box[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-left: 3px solid #3b82f6;\n  border-radius: 6px;\n  padding: 0.4rem 0.6rem;\n  font-size: 0.82rem;\n  color: #334155;\n  display: flex;\n  align-items: flex-start;\n  gap: 0.35rem;\n  max-width: 320px;\n}\n.operator-comment-box.no-comment[_ngcontent-%COMP%] {\n  border-left-color: #cbd5e1;\n  color: #94a3b8;\n  font-style: italic;\n}\n.comment-icon[_ngcontent-%COMP%] {\n  font-size: 0.8rem;\n}\n.comment-text[_ngcontent-%COMP%] {\n  line-height: 1.35;\n  word-break: break-word;\n}\n.color-debito[_ngcontent-%COMP%] {\n  color: #dc2626;\n  font-size: 0.95rem;\n}\n.status-badge[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.2rem 0.55rem;\n  border-radius: 9999px;\n  display: inline-block;\n}\n.badge-aceptado[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #991b1b;\n  border: 1px solid #fecaca;\n}\n.badge-rechazado[_ngcontent-%COMP%] {\n  background: #f3e8ff;\n  color: #6b21a8;\n  border: 1px solid #e9d5ff;\n}\n.badge-pendiente[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n}\n.text-right[_ngcontent-%COMP%] {\n  text-align: right;\n}\n.text-center[_ngcontent-%COMP%] {\n  text-align: center;\n}\n.text-nowrap[_ngcontent-%COMP%] {\n  white-space: nowrap;\n}\n.font-weight-bold[_ngcontent-%COMP%] {\n  font-weight: 700;\n}\n.loading-state[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 3rem 1rem;\n  color: #64748b;\n  text-align: center;\n}\n.spinner[_ngcontent-%COMP%] {\n  width: 32px;\n  height: 32px;\n  border: 3px solid #e2e8f0;\n  border-top-color: #3b82f6;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 0.8s linear infinite;\n  margin-bottom: 0.75rem;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.empty-icon[_ngcontent-%COMP%] {\n  font-size: 2.2rem;\n  margin-bottom: 0.5rem;\n}\n@media (max-width: 768px) {\n  .drilldown-container[_ngcontent-%COMP%] {\n    padding: 1rem;\n  }\n  .header-main-card[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n  .header-stats[_ngcontent-%COMP%] {\n    width: 100%;\n    flex-direction: column;\n  }\n}\n/*# sourceMappingURL=directorio-motivo-detalle.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DirectorioMotivoDetalleComponent, [{
    type: Component,
    args: [{ selector: "app-directorio-motivo-detalle", standalone: true, imports: [CommonModule, FormsModule], template: `<div class="drilldown-container">

  <!-- Header de Navegaci\xF3n & T\xEDtulo -->
  <header class="drilldown-header">
    <div class="breadcrumb-bar">
      <button type="button" class="btn-back" (click)="volverAlTablero()" title="Regresar al Tablero de Control">
        \u2190 Volver al Tablero Principal
      </button>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Detalle por Motivo</span>
    </div>

    <div class="header-main-card">
      <div class="header-info">
        <h1 class="motivo-title">{{ motivo }}</h1>
        <div class="context-filters">
          <span class="filter-pill">\u{1F3E5} Cobertura: <strong>{{ codigoCobertura === 'TODAS' ? 'Todas las Instituciones' :
              codigoCobertura }}</strong></span>
          <span class="filter-pill" *ngIf="tipoDoc && tipoDoc !== 'TODOS'">\u{1F4C4} Comprobante: <strong>{{ tipoDoc
              }}</strong></span>
          <span class="filter-pill" *ngIf="fechaDesde || fechaHasta">\u{1F4C5} Per\xEDodo: <strong>{{ (fechaDesde |
              date:'dd/MM/yyyy') || 'Inicio' }} - {{ (fechaHasta | date:'dd/MM/yyyy') || 'Hoy' }}</strong></span>
        </div>
      </div>

      <div class="header-stats">
        <div class="stat-box">
          <span class="stat-label">Total Debitado en este Motivo</span>
          <span class="stat-value text-danger">{{ formatearMoneda(totalMontoDebitado) }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Cantidad de Prestaciones</span>
          <span class="stat-value">{{ totalCasos }}</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Barra de B\xFAsqueda R\xE1pida -->
  <div class="search-bar-card">
    <div class="search-input-wrapper">
      <span class="search-icon">\u{1F50D}</span>
      <input type="text" class="form-control-search" [(ngModel)]="filtroBusqueda"
        placeholder="Buscar por paciente, carnet, c\xF3digo de prestaci\xF3n, m\xE9dico o texto del comentario...">
    </div>
    <div class="results-count">
      Mostrando <strong>{{ prestacionesFiltradas.length }}</strong> de {{ prestaciones.length }} prestaciones
    </div>
  </div>

  <!-- Contenedor de Tabla de Prestaciones -->
  <section class="table-card">
    <div *ngIf="cargando" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando detalle de prestaciones debitadas...</p>
    </div>

    <div *ngIf="!cargando && prestaciones.length === 0" class="empty-state">
      <span class="empty-icon">\u{1F4C2}</span>
      <p>No se encontraron prestaciones debitadas para el motivo y filtros seleccionados.</p>
    </div>

    <div *ngIf="!cargando && prestacionesFiltradas.length > 0" class="table-responsive">
      <table class="table-drilldown">
        <thead>
          <tr>
            <th>Comprobante NC</th>
            <th>Fecha</th>
            <th>Paciente / Carnet</th>
            <th>Plan & M\xE9dico</th>
            <th>Prestaci\xF3n M\xE9dica</th>
            <th>Motivo de D\xE9bito</th>
            <th>Comentarios del Operador (Texto Libre)</th>
            <th class="text-right">Importe Debitado</th>
            <th class="text-center">Aceptado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of prestacionesFiltradas">

            <!-- Comprobante NC -->
            <td>
              <div class="doc-badge-wrapper">
                <span class="badge-nc">{{ p.tipoDoc || 'NC' }}</span>
                <strong>{{ formatearComprobante(p.letraDoc, p.ptovtaDoc, p.numeroDoc) }}</strong>
              </div>
            </td>

            <!-- Fecha -->
            <td class="text-nowrap">{{ p.fechaDoc | date:'dd/MM/yyyy' }}</td>

            <!-- Paciente & Carnet -->
            <td>
              <div class="patient-info">
                <strong class="patient-name">{{ p.paciente || 'S/D' }}</strong>
                <span class="patient-carnet">{{ p.carnet || 'Sin Carnet' }}</span>
              </div>
            </td>

            <!-- Plan & M\xE9dico -->
            <td>
              <div class="medical-info">
                <span class="plan-badge">{{ p.plan || 'General' }}</span>
                <span class="medico-name">{{ p.medico || p.efector || 'Efector S/D' }}</span>
              </div>
            </td>

            <!-- Prestaci\xF3n -->
            <td>
              <div class="prestation-info">
                <code class="code-pill">{{ p.codigo }}</code>
                <span class="desc-text">{{ p.descripcion }}</span>
              </div>
            </td>

            <!-- Motivo de D\xE9bito -->
            <td>
              <span class="motivo-highlight">{{ p.motivoDebito }}</span>
            </td>

            <!-- Comentarios del Operador (Texto libre) -->
            <td>
              <div class="operator-comment-box"
                [class.no-comment]="!p.comentariosDebito || p.comentariosDebito.trim() === ''">
                <span class="comment-icon" *ngIf="p.comentariosDebito">\u{1F4AC}</span>
                <span class="comment-text">{{ p.comentariosDebito || 'Sin observaciones registradas' }}</span>
              </div>
            </td>

            <!-- Importe Debitado -->
            <td class="text-right font-weight-bold color-debito text-nowrap">
              {{ formatearMoneda(p.importeDebitado) }}
            </td>

            <!-- Estado D\xE9bito Aceptado -->
            <td class="text-center">
              <span class="status-badge" [class.badge-aceptado]="p.debitoAceptado === true"
                [class.badge-rechazado]="p.debitoAceptado === false"
                [class.badge-pendiente]="p.debitoAceptado === null">
                {{ p.debitoAceptado === true ? 'S\xCD (P\xE9rdida)' : p.debitoAceptado === false ? 'NO (Refacturable)' :
                'Pendiente' }}
              </span>
            </td>

          </tr>
        </tbody>
      </table>
    </div>
  </section>

</div>`, styles: ['/* src/app/features/directorio/directorio-motivo-detalle.component.css */\n.drilldown-container {\n  max-width: 1600px;\n  margin: 0 auto;\n  padding: 1.5rem 2rem 3rem 2rem;\n  color: #1e293b;\n  font-family:\n    system-ui,\n    -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    Roboto,\n    Oxygen,\n    Ubuntu,\n    Cantarell,\n    sans-serif;\n}\n.breadcrumb-bar {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 1rem;\n}\n.btn-back {\n  background: #ffffff;\n  border: 1px solid #cbd5e1;\n  color: #2563eb;\n  font-size: 0.85rem;\n  font-weight: 600;\n  padding: 0.4rem 0.85rem;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  display: inline-flex;\n  align-items: center;\n}\n.btn-back:hover {\n  background: #eff6ff;\n  border-color: #3b82f6;\n  transform: translateX(-2px);\n}\n.breadcrumb-sep {\n  color: #94a3b8;\n}\n.breadcrumb-current {\n  color: #64748b;\n  font-size: 0.85rem;\n  font-weight: 500;\n}\n.header-main-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.5rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  flex-wrap: wrap;\n  gap: 1.5rem;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);\n  margin-bottom: 1.5rem;\n}\n.badge-row {\n  display: flex;\n  gap: 0.5rem;\n  align-items: center;\n  margin-bottom: 0.5rem;\n}\n.badge-drilldown {\n  background:\n    linear-gradient(\n      135deg,\n      #0284c7,\n      #0369a1);\n  color: #ffffff;\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n  text-transform: uppercase;\n}\n.badge-readonly {\n  background: #f1f5f9;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n  font-size: 0.72rem;\n  font-weight: 600;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n}\n.motivo-title {\n  font-size: 1.6rem;\n  font-weight: 800;\n  color: #0f172a;\n  margin: 0 0 0.5rem 0;\n  letter-spacing: -0.02em;\n}\n.context-filters {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n}\n.filter-pill {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  padding: 0.25rem 0.65rem;\n  border-radius: 6px;\n  font-size: 0.8rem;\n  color: #475569;\n}\n.filter-pill strong {\n  color: #0f172a;\n}\n.header-stats {\n  display: flex;\n  gap: 1rem;\n}\n.stat-box {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 0.85rem 1.25rem;\n  display: flex;\n  flex-direction: column;\n  min-width: 170px;\n}\n.stat-label {\n  font-size: 0.72rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  color: #64748b;\n  margin-bottom: 0.25rem;\n}\n.stat-value {\n  font-size: 1.4rem;\n  font-weight: 800;\n  color: #0f172a;\n}\n.text-danger {\n  color: #dc2626;\n}\n.search-bar-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 0.85rem 1.25rem;\n  margin-bottom: 1.25rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.search-input-wrapper {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  flex: 1;\n  min-width: 280px;\n}\n.search-icon {\n  font-size: 1rem;\n  color: #94a3b8;\n}\n.form-control-search {\n  width: 100%;\n  border: 1px solid #cbd5e1;\n  background-color: #f8fafc;\n  color: #0f172a;\n  padding: 0.5rem 0.85rem;\n  border-radius: 8px;\n  font-size: 0.88rem;\n  outline: none;\n  transition: all 0.2s ease;\n}\n.form-control-search:focus {\n  border-color: #3b82f6;\n  background-color: #ffffff;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);\n}\n.results-count {\n  font-size: 0.82rem;\n  color: #64748b;\n}\n.table-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.25rem;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);\n}\n.table-responsive {\n  overflow-x: auto;\n}\n.table-drilldown {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.85rem;\n}\n.table-drilldown th {\n  background: #f8fafc;\n  color: #475569;\n  font-size: 0.72rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  padding: 0.75rem 0.85rem;\n  border-bottom: 2px solid #e2e8f0;\n  text-align: left;\n}\n.table-drilldown td {\n  padding: 0.85rem 0.85rem;\n  border-bottom: 1px solid #f1f5f9;\n  vertical-align: top;\n}\n.table-drilldown tbody tr:hover {\n  background-color: #f8fafc;\n}\n.doc-badge-wrapper {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.badge-nc {\n  background: #fee2e2;\n  color: #b91c1c;\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.4rem;\n  border-radius: 4px;\n}\n.patient-info {\n  display: flex;\n  flex-direction: column;\n}\n.patient-name {\n  color: #0f172a;\n  font-size: 0.88rem;\n}\n.patient-carnet {\n  color: #64748b;\n  font-size: 0.78rem;\n  font-family: monospace;\n}\n.medical-info {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.plan-badge {\n  background: #e0f2fe;\n  color: #0369a1;\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.1rem 0.4rem;\n  border-radius: 4px;\n  width: fit-content;\n}\n.medico-name {\n  color: #475569;\n  font-size: 0.78rem;\n}\n.prestation-info {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.code-pill {\n  background: #f1f5f9;\n  color: #0f172a;\n  padding: 0.15rem 0.4rem;\n  border-radius: 4px;\n  font-weight: 700;\n  width: fit-content;\n  font-size: 0.78rem;\n}\n.desc-text {\n  color: #334155;\n  font-size: 0.8rem;\n}\n.motivo-highlight {\n  font-weight: 600;\n  color: #1e293b;\n  background: #fef3c7;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  font-size: 0.8rem;\n}\n.operator-comment-box {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-left: 3px solid #3b82f6;\n  border-radius: 6px;\n  padding: 0.4rem 0.6rem;\n  font-size: 0.82rem;\n  color: #334155;\n  display: flex;\n  align-items: flex-start;\n  gap: 0.35rem;\n  max-width: 320px;\n}\n.operator-comment-box.no-comment {\n  border-left-color: #cbd5e1;\n  color: #94a3b8;\n  font-style: italic;\n}\n.comment-icon {\n  font-size: 0.8rem;\n}\n.comment-text {\n  line-height: 1.35;\n  word-break: break-word;\n}\n.color-debito {\n  color: #dc2626;\n  font-size: 0.95rem;\n}\n.status-badge {\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.2rem 0.55rem;\n  border-radius: 9999px;\n  display: inline-block;\n}\n.badge-aceptado {\n  background: #fee2e2;\n  color: #991b1b;\n  border: 1px solid #fecaca;\n}\n.badge-rechazado {\n  background: #f3e8ff;\n  color: #6b21a8;\n  border: 1px solid #e9d5ff;\n}\n.badge-pendiente {\n  background: #f1f5f9;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n}\n.text-right {\n  text-align: right;\n}\n.text-center {\n  text-align: center;\n}\n.text-nowrap {\n  white-space: nowrap;\n}\n.font-weight-bold {\n  font-weight: 700;\n}\n.loading-state,\n.empty-state {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 3rem 1rem;\n  color: #64748b;\n  text-align: center;\n}\n.spinner {\n  width: 32px;\n  height: 32px;\n  border: 3px solid #e2e8f0;\n  border-top-color: #3b82f6;\n  border-radius: 50%;\n  animation: spin 0.8s linear infinite;\n  margin-bottom: 0.75rem;\n}\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.empty-icon {\n  font-size: 2.2rem;\n  margin-bottom: 0.5rem;\n}\n@media (max-width: 768px) {\n  .drilldown-container {\n    padding: 1rem;\n  }\n  .header-main-card {\n    flex-direction: column;\n  }\n  .header-stats {\n    width: 100%;\n    flex-direction: column;\n  }\n}\n/*# sourceMappingURL=directorio-motivo-detalle.component.css.map */\n'] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DirectorioMotivoDetalleComponent, { className: "DirectorioMotivoDetalleComponent", filePath: "src/app/features/directorio/directorio-motivo-detalle.component.ts", lineNumber: 16 });
})();
export {
  DirectorioMotivoDetalleComponent
};
//# sourceMappingURL=chunk-2LO6WTVM.js.map
