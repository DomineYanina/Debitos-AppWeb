import {
  Chart,
  defaults,
  registerables
} from "./chunk-TXAAD75R.js";
import {
  DirectorioService
} from "./chunk-SCS44KY4.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  Router,
  SelectControlValueAccessor,
  ɵNgSelectMultipleOption
} from "./chunk-FKTKYBCK.js";
import {
  BehaviorSubject,
  ChangeDetectorRef,
  CommonModule,
  Component,
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  Directive,
  ElementRef,
  EventEmitter,
  Injectable,
  InjectionToken,
  Input,
  NgClass,
  NgForOf,
  NgIf,
  NgZone,
  Output,
  PLATFORM_ID,
  __spreadProps,
  __spreadValues,
  distinctUntilChanged,
  inject,
  isPlatformBrowser,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinterpolate1,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵpipeBind3,
  ɵɵpipeBindV,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-IXY2MHCK.js";

// node_modules/es-toolkit/dist/predicate/isPlainObject.mjs
function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  if (!(proto === null || proto === Object.prototype || Object.getPrototypeOf(proto) === null)) return false;
  return Object.prototype.toString.call(value) === "[object Object]";
}

// node_modules/es-toolkit/dist/_internal/isMergeableValue.mjs
function isMergeableValue(value) {
  return isPlainObject(value) || Array.isArray(value);
}

// node_modules/es-toolkit/dist/_internal/isUnsafeProperty.mjs
function isUnsafeProperty(key) {
  return key === "__proto__";
}

// node_modules/es-toolkit/dist/object/merge.mjs
function merge(target, source) {
  const sourceKeys = Object.keys(source);
  for (let i = 0; i < sourceKeys.length; i++) {
    const key = sourceKeys[i];
    if (isUnsafeProperty(key)) continue;
    const sourceValue = source[key];
    const targetValue = target[key];
    if (isMergeableValue(sourceValue) && isMergeableValue(targetValue)) target[key] = merge(targetValue, sourceValue);
    else if (Array.isArray(sourceValue)) target[key] = merge([], sourceValue);
    else if (isPlainObject(sourceValue)) target[key] = merge({}, sourceValue);
    else if (targetValue === void 0 || sourceValue !== void 0) target[key] = sourceValue;
  }
  return target;
}

// node_modules/ng2-charts/fesm2022/ng2-charts.mjs
var NG_CHARTS_CONFIGURATION = new InjectionToken("Configuration for ngCharts");
var ThemeService = class _ThemeService {
  constructor() {
    this.colorschemesOptions = new BehaviorSubject(void 0);
  }
  setColorschemesOptions(options) {
    this.pColorschemesOptions = options;
    this.colorschemesOptions.next(options);
  }
  getColorschemesOptions() {
    return this.pColorschemesOptions;
  }
  static {
    this.\u0275fac = function ThemeService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _ThemeService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
      token: _ThemeService,
      factory: _ThemeService.\u0275fac,
      providedIn: "root"
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ThemeService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var BaseChartDirective = class _BaseChartDirective {
  constructor() {
    this.type = "bar";
    this.plugins = [];
    this.chartClick = new EventEmitter();
    this.chartHover = new EventEmitter();
    this.ctx = null;
    this.subs = [];
    this.themeOverrides = {};
    this.element = inject(ElementRef);
    this.zone = inject(NgZone);
    this.themeService = inject(ThemeService);
    this.config = inject(NG_CHARTS_CONFIGURATION, {
      optional: true
    });
    this.platformId = inject(PLATFORM_ID);
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.config?.registerables) {
      Chart.register(...this.config.registerables);
    }
    if (this.config?.defaults) {
      defaults.set(this.config.defaults);
    }
    if (this.isBrowser) {
      this.ctx = this.element.nativeElement.getContext("2d");
    }
    this.subs.push(this.themeService.colorschemesOptions.pipe(distinctUntilChanged()).subscribe((r) => this.themeChanged(r)));
  }
  ngOnChanges(changes) {
    if (!this.isBrowser) {
      return;
    }
    const requireRender = ["type"];
    const propertyNames = Object.getOwnPropertyNames(changes);
    if (propertyNames.some((key) => requireRender.includes(key)) || propertyNames.every((key) => changes[key].isFirstChange())) {
      this.render();
    } else {
      if (this.chart && changes["legend"]) {
        const config = this.getChartConfiguration();
        if (config.options) {
          this.chart.options = config.options;
        }
        this.update();
      } else if (this.chart) {
        const config = this.getChartConfiguration();
        if (config.data && this.chart.config.data) {
          Object.assign(this.chart.config.data, config.data);
        }
        if (config.plugins && this.chart.config.plugins) {
          Object.assign(this.chart.config.plugins, config.plugins);
        }
        if (config.options && this.chart.config.options) {
          Object.assign(this.chart.config.options, config.options);
        }
        this.update();
      }
    }
  }
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = void 0;
    }
    this.subs.forEach((s) => s.unsubscribe());
  }
  render() {
    if (!this.isBrowser || !this.ctx) {
      return void 0;
    }
    if (this.chart) {
      this.chart.destroy();
    }
    return this.zone.runOutsideAngular(() => this.chart = new Chart(this.ctx, this.getChartConfiguration()));
  }
  update(mode) {
    if (this.chart && this.isBrowser) {
      this.zone.runOutsideAngular(() => this.chart?.update(mode));
    }
  }
  hideDataset(index, hidden) {
    if (this.chart && this.isBrowser) {
      this.chart.getDatasetMeta(index).hidden = hidden;
      this.update();
    }
  }
  isDatasetHidden(index) {
    return this.chart?.getDatasetMeta(index)?.hidden;
  }
  toBase64Image() {
    return this.chart?.toBase64Image();
  }
  themeChanged(options) {
    this.themeOverrides = options;
    if (this.chart) {
      if (this.chart.config.options) {
        Object.assign(this.chart.config.options, this.getChartOptions());
      }
      this.update();
    }
  }
  getChartOptions() {
    return [{
      onHover: (event, active) => {
        if (!this.chartHover.observed && !this.chartHover.observers?.length) {
          return;
        }
        this.zone.run(() => this.chartHover.emit({
          event,
          active
        }));
      },
      onClick: (event, active) => {
        if (!this.chartClick.observed && !this.chartClick.observers?.length) {
          return;
        }
        this.zone.run(() => this.chartClick.emit({
          event,
          active
        }));
      }
    }, this.themeOverrides ?? {}, this.options ?? {}, {
      plugins: {
        legend: {
          display: this.legend
        }
      }
    }].reduce(merge, {});
  }
  getChartConfiguration() {
    return {
      type: this.type,
      data: this.getChartData(),
      options: this.getChartOptions(),
      plugins: this.plugins
    };
  }
  getChartData() {
    return this.data ? this.data : {
      labels: this.labels || [],
      datasets: this.datasets || []
    };
  }
  static {
    this.\u0275fac = function BaseChartDirective_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _BaseChartDirective)();
    };
  }
  static {
    this.\u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
      type: _BaseChartDirective,
      selectors: [["canvas", "baseChart", ""]],
      inputs: {
        type: "type",
        legend: "legend",
        data: "data",
        options: "options",
        plugins: "plugins",
        labels: "labels",
        datasets: "datasets"
      },
      outputs: {
        chartClick: "chartClick",
        chartHover: "chartHover"
      },
      exportAs: ["base-chart"],
      features: [\u0275\u0275NgOnChangesFeature]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseChartDirective, [{
    type: Directive,
    args: [{
      // eslint-disable-next-line @angular-eslint/directive-selector
      selector: "canvas[baseChart]",
      exportAs: "base-chart",
      standalone: true
    }]
  }], () => [], {
    type: [{
      type: Input
    }],
    legend: [{
      type: Input
    }],
    data: [{
      type: Input
    }],
    options: [{
      type: Input
    }],
    plugins: [{
      type: Input
    }],
    labels: [{
      type: Input
    }],
    datasets: [{
      type: Input
    }],
    chartClick: [{
      type: Output
    }],
    chartHover: [{
      type: Output
    }]
  });
})();

// src/app/features/directorio/directorio-dashboard.component.ts
var _c0 = (a0) => [a0, "ARS", "symbol-narrow", "1.2-2", "es-AR"];
var _c1 = (a0) => [a0, "ARS", "symbol-narrow", "1.0-0", "es-AR"];
function DirectorioDashboardComponent_option_65_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 131);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cob_r1 = ctx.$implicit;
    \u0275\u0275property("value", cob_r1.codigo);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", cob_r1.nombre, " (", cob_r1.codigo, ") ");
  }
}
function DirectorioDashboardComponent_option_72_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 131);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const tipo_r2 = ctx.$implicit;
    \u0275\u0275property("value", tipo_r2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", tipo_r2, " ");
  }
}
function DirectorioDashboardComponent_span_97_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totales.totalFacturado));
  }
}
function DirectorioDashboardComponent_span_98_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 132);
    \u0275\u0275text(1, "Cargando...");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_span_107_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totales.totalIncrementosNd));
  }
}
function DirectorioDashboardComponent_span_108_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 132);
    \u0275\u0275text(1, "Cargando...");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_span_117_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totales.totalDebitosNc));
  }
}
function DirectorioDashboardComponent_span_118_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 132);
    \u0275\u0275text(1, "Cargando...");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_span_127_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totales.totalRefacturacionNd));
  }
}
function DirectorioDashboardComponent_span_128_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 132);
    \u0275\u0275text(1, "Cargando...");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_span_138_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totales.totalCobranzas));
  }
}
function DirectorioDashboardComponent_span_139_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 132);
    \u0275\u0275text(1, "Cargando...");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_span_149_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totales.saldoPendienteReal));
  }
}
function DirectorioDashboardComponent_span_150_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 132);
    \u0275\u0275text(1, "Cargando...");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_div_172_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 133)(1, "span", 134);
    \u0275\u0275text(2, "\u23F3");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Cargando datos\u2026 ");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_div_173_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 135)(1, "span");
    \u0275\u0275text(2, "Sin datos de evoluci\xF3n disponibles");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_canvas_174_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "canvas", 136);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("type", "line")("data", ctx_r2.evolucionChartData)("options", ctx_r2.evolucionChartOptions);
  }
}
function DirectorioDashboardComponent_div_186_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 133)(1, "span", 134);
    \u0275\u0275text(2, "\u23F3");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Cargando datos\u2026 ");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_div_187_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 135)(1, "span");
    \u0275\u0275text(2, "Sin datos de saldo pendiente");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_canvas_188_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "canvas", 137);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("type", "doughnut")("data", ctx_r2.distribucionChartData)("options", ctx_r2.distribucionChartOptions);
  }
}
function DirectorioDashboardComponent_div_197_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando balance financiero por financiador...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_198_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4CA}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron datos de balance financiero.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_199_tr_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 155)(1, "td", 156);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td", 145);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td", 145);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td", 157);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "td", 158);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td", 159);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 160);
    \u0275\u0275text(14);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const b_r4 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(b_r4.financiador);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(b_r4.facturacionFc));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(b_r4.incrementosNd));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(b_r4.debitosNc));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(b_r4.refacturadoNd));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(b_r4.cobradoRc));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(b_r4.saldoPendiente));
  }
}
function DirectorioDashboardComponent_div_199_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 142)(1, "table", 143)(2, "thead")(3, "tr")(4, "th", 144);
    \u0275\u0275text(5, "FINANCIADOR");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 145);
    \u0275\u0275text(7, "FACTURACI\xD3N (FC)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 145);
    \u0275\u0275text(9, "INCREMENTOS (ND)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 145);
    \u0275\u0275text(11, "D\xC9BITOS (NC)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 145);
    \u0275\u0275text(13, "REFACTURADO (ND-NC)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th", 145);
    \u0275\u0275text(15, "COBRADO (RC)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "th", 146);
    \u0275\u0275text(17, "SALDO PENDIENTE");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(18, "tbody");
    \u0275\u0275template(19, DirectorioDashboardComponent_div_199_tr_19_Template, 15, 7, "tr", 147);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "tfoot")(21, "tr", 148)(22, "td", 149);
    \u0275\u0275text(23, "TOTAL GENERAL");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "td", 150);
    \u0275\u0275text(25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "td", 150);
    \u0275\u0275text(27);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "td", 151);
    \u0275\u0275text(29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "td", 152);
    \u0275\u0275text(31);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "td", 153);
    \u0275\u0275text(33);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "td", 154);
    \u0275\u0275text(35);
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(19);
    \u0275\u0275property("ngForOf", ctx_r2.balanceFinanciadores);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totalesBalance.facturacionFc));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totalesBalance.incrementosNd));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totalesBalance.debitosNc));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totalesBalance.refacturadoNd));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totalesBalance.cobradoRc));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.totalesBalance.saldoPendiente));
  }
}
function DirectorioDashboardComponent_div_214_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando cuenta corriente a 3 niveles...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_215_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4C1}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron registros de cuenta corriente para los filtros aplicados.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_button_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 190);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_button_3_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r11);
      const fc_r10 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(6);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.toggleFactura(fc_r10));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const fc_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275classProp("is-expanded", fc_r10.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", fc_r10.expanded ? "\u25BC" : "\u25B6", " ");
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 191);
    \u0275\u0275text(1, "\u2022");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_ng_container_30_tr_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 193)(1, "td", 194)(2, "span", 195);
    \u0275\u0275text(3, "\u2514\u2500");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 187);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "strong", 188);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "td", 189);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td", 181);
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "td", 171);
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "td", 172);
    \u0275\u0275text(18);
    \u0275\u0275pipe(19, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "td", 173);
    \u0275\u0275text(21);
    \u0275\u0275pipe(22, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "td", 174);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "td", 175);
    \u0275\u0275text(27);
    \u0275\u0275pipe(28, "currency");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const h_r12 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(8);
    \u0275\u0275advance();
    \u0275\u0275styleProp("padding-left", 74 + ((h_r12.nivel || 1) - 1) * 25, "px");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngClass", ctx_r2.obtenerBadgeClase(h_r12.tipo));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(h_r12.tipo);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(h_r12.comprobante);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(10, 13, h_r12.fecha, "dd/MM/yyyy"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", h_r12.facturacionFc > 0 ? \u0275\u0275pipeBindV(13, 16, \u0275\u0275pureFunction1(52, _c0, h_r12.facturacionFc)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", h_r12.incrementosNd > 0 ? \u0275\u0275pipeBindV(16, 22, \u0275\u0275pureFunction1(54, _c0, h_r12.incrementosNd)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", h_r12.debitosNc > 0 ? \u0275\u0275pipeBindV(19, 28, \u0275\u0275pureFunction1(56, _c0, h_r12.debitosNc)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", h_r12.refacturacionNd > 0 ? \u0275\u0275pipeBindV(22, 34, \u0275\u0275pureFunction1(58, _c0, h_r12.refacturacionNd)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", h_r12.cobranzasRc > 0 ? \u0275\u0275pipeBindV(25, 40, \u0275\u0275pureFunction1(60, _c0, h_r12.cobranzasRc)) : "\u2014", " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", h_r12.saldo > 0 ? "color-saldo-positivo" : h_r12.saldo < 0 ? "color-saldo-negativo" : "color-saldo-cero");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(28, 46, \u0275\u0275pureFunction1(62, _c0, h_r12.saldo)), " ");
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_ng_container_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_ng_container_30_tr_1_Template, 29, 64, "tr", 192);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const fc_r10 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", fc_r10.hijos);
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 183);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_Template_tr_click_1_listener() {
      const fc_r10 = \u0275\u0275restoreView(_r9).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(6);
      return \u0275\u0275resetView(ctx_r2.toggleFactura(fc_r10));
    });
    \u0275\u0275elementStart(2, "td", 184);
    \u0275\u0275template(3, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_button_3_Template, 2, 3, "button", 185)(4, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_span_4_Template, 2, 0, "span", 186);
    \u0275\u0275elementStart(5, "span", 187);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "strong", 188);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "td", 189);
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "td", 181);
    \u0275\u0275text(13);
    \u0275\u0275pipe(14, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "td", 171);
    \u0275\u0275text(16);
    \u0275\u0275pipe(17, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "td", 172);
    \u0275\u0275text(19);
    \u0275\u0275pipe(20, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "td", 173);
    \u0275\u0275text(22);
    \u0275\u0275pipe(23, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "td", 174);
    \u0275\u0275text(25);
    \u0275\u0275pipe(26, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(27, "td", 175);
    \u0275\u0275text(28);
    \u0275\u0275pipe(29, "currency");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(30, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_ng_container_30_Template, 2, 1, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const fc_r10 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(6);
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", fc_r10.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", fc_r10.hijos && fc_r10.hijos.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !fc_r10.hijos || fc_r10.hijos.length === 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r2.obtenerBadgeClase(fc_r10.tipo));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(fc_r10.tipo);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(fc_r10.comprobante);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(11, 16, fc_r10.fecha, "dd/MM/yyyy"), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", fc_r10.facturacionFc > 0 ? \u0275\u0275pipeBindV(14, 19, \u0275\u0275pureFunction1(55, _c0, fc_r10.facturacionFc)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", fc_r10.incrementosNd > 0 ? \u0275\u0275pipeBindV(17, 25, \u0275\u0275pureFunction1(57, _c0, fc_r10.incrementosNd)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", fc_r10.debitosNc > 0 ? \u0275\u0275pipeBindV(20, 31, \u0275\u0275pureFunction1(59, _c0, fc_r10.debitosNc)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", fc_r10.refacturacionNd > 0 ? \u0275\u0275pipeBindV(23, 37, \u0275\u0275pureFunction1(61, _c0, fc_r10.refacturacionNd)) : "\u2014", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", fc_r10.cobranzasRc > 0 ? \u0275\u0275pipeBindV(26, 43, \u0275\u0275pureFunction1(63, _c0, fc_r10.cobranzasRc)) : "\u2014", " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", fc_r10.saldo > 0 ? "color-saldo-positivo" : fc_r10.saldo < 0 ? "color-saldo-negativo" : "color-saldo-cero");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(29, 49, \u0275\u0275pureFunction1(65, _c0, fc_r10.saldo)), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", fc_r10.expanded && fc_r10.hijos && fc_r10.hijos.length > 0);
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_ng_container_1_Template, 31, 67, "ng-container", 182);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const p_r8 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", p_r8.comprobantes)("ngForTrackBy", ctx_r2.trackByComprobante);
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 176);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_Template_tr_click_1_listener() {
      const p_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.togglePeriodo(p_r8));
    });
    \u0275\u0275elementStart(2, "td", 177)(3, "button", 178);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 179);
    \u0275\u0275text(6, "\u{1F4C5}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 180);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "td", 169);
    \u0275\u0275text(10, "\u2014");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td", 181);
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "td", 171);
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "td", 172);
    \u0275\u0275text(18);
    \u0275\u0275pipe(19, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "td", 173);
    \u0275\u0275text(21);
    \u0275\u0275pipe(22, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "td", 174);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "td", 175);
    \u0275\u0275text(27);
    \u0275\u0275pipe(28, "currency");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(29, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_ng_container_29_Template, 2, 2, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const p_r8 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", p_r8.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", p_r8.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", p_r8.expanded ? "\u25BC" : "\u25B6", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(p_r8.periodo);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(13, 14, \u0275\u0275pureFunction1(50, _c0, p_r8.facturacionFc)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(16, 20, \u0275\u0275pureFunction1(52, _c0, p_r8.incrementosNd)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(19, 26, \u0275\u0275pureFunction1(54, _c0, p_r8.debitosNc)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(22, 32, \u0275\u0275pureFunction1(56, _c0, p_r8.refacturacionNd)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(25, 38, \u0275\u0275pureFunction1(58, _c0, p_r8.cobranzasRc)), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", p_r8.saldo > 0 ? "color-saldo-positivo" : p_r8.saldo < 0 ? "color-saldo-negativo" : "color-saldo-cero");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(28, 44, \u0275\u0275pureFunction1(60, _c0, p_r8.saldo)), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", p_r8.expanded);
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_ng_container_1_Template, 30, 62, "ng-container", 103);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const f_r6 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", f_r6.periodos);
  }
}
function DirectorioDashboardComponent_div_216_ng_container_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 164);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_216_ng_container_21_Template_tr_click_1_listener() {
      const f_r6 = \u0275\u0275restoreView(_r5).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleFinanciador(f_r6));
    });
    \u0275\u0275elementStart(2, "td", 165)(3, "button", 166);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 167);
    \u0275\u0275text(6, "\u{1F3E2}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 168);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "td", 169);
    \u0275\u0275text(10, "\u2014");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td", 170);
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "td", 171);
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "td", 172);
    \u0275\u0275text(18);
    \u0275\u0275pipe(19, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "td", 173);
    \u0275\u0275text(21);
    \u0275\u0275pipe(22, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(23, "td", 174);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "td", 175);
    \u0275\u0275text(27);
    \u0275\u0275pipe(28, "currency");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(29, DirectorioDashboardComponent_div_216_ng_container_21_ng_container_29_Template, 2, 1, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const f_r6 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", f_r6.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", f_r6.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", f_r6.expanded ? "\u25BC" : "\u25B6", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(f_r6.financiador);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(13, 14, \u0275\u0275pureFunction1(50, _c0, f_r6.facturacionFc)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(16, 20, \u0275\u0275pureFunction1(52, _c0, f_r6.incrementosNd)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(19, 26, \u0275\u0275pureFunction1(54, _c0, f_r6.debitosNc)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(22, 32, \u0275\u0275pureFunction1(56, _c0, f_r6.refacturacionNd)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(25, 38, \u0275\u0275pureFunction1(58, _c0, f_r6.cobranzasRc)), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", f_r6.saldo > 0 ? "color-saldo-positivo" : f_r6.saldo < 0 ? "color-saldo-negativo" : "color-saldo-cero");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(28, 44, \u0275\u0275pureFunction1(60, _c0, f_r6.saldo)), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", f_r6.expanded);
  }
}
function DirectorioDashboardComponent_div_216_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 142)(1, "table", 161)(2, "thead")(3, "tr")(4, "th", 162);
    \u0275\u0275text(5, "Entidad / Per\xEDodo / Comprobante");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 163);
    \u0275\u0275text(7, "Fecha");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 145);
    \u0275\u0275text(9, "Facturaci\xF3n (FC)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 145);
    \u0275\u0275text(11, "Incrementos (ND)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 145);
    \u0275\u0275text(13, "D\xE9bitos (NC)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th", 145);
    \u0275\u0275text(15, "Refacturaci\xF3n (ND)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "th", 145);
    \u0275\u0275text(17, "Cobranzas (RC)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "th", 145);
    \u0275\u0275text(19, "Saldo");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(20, "tbody");
    \u0275\u0275template(21, DirectorioDashboardComponent_div_216_ng_container_21_Template, 30, 62, "ng-container", 103);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(21);
    \u0275\u0275property("ngForOf", ctx_r2.cuentaCorrienteDatos);
  }
}
function DirectorioDashboardComponent_div_251_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 133)(1, "span", 134);
    \u0275\u0275text(2, "\u23F3");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Cargando datos\u2026 ");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_div_252_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 135)(1, "span");
    \u0275\u0275text(2, "Sin deuda pendiente en los rangos configurados");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_canvas_253_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "canvas", 196);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("type", "bar")("data", ctx_r2.agingChartData)("options", ctx_r2.agingChartOptions);
  }
}
function DirectorioDashboardComponent_tr_274_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 197);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td", 198);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "number");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "td", 199);
    \u0275\u0275text(7);
    \u0275\u0275pipe(8, "number");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "td", 200);
    \u0275\u0275text(10);
    \u0275\u0275pipe(11, "number");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r13 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r13.rango);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind3(5, 4, item_r13.cantidadComprobantes, "1.0-0", "es-AR"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("$", \u0275\u0275pipeBind3(8, 8, item_r13.saldoEnMora, "1.0-0", "es-AR"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind3(11, 12, item_r13.porcentajeCartera, "1.1-1", "es-AR"), "%");
  }
}
function DirectorioDashboardComponent_tr_275_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 201);
    \u0275\u0275text(2, " Sin datos de antig\xFCedad disponibles ");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_option_289_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 131);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const anio_r14 = ctx.$implicit;
    \u0275\u0275property("value", anio_r14);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", anio_r14, " ");
  }
}
function DirectorioDashboardComponent_div_290_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando matriz anual de cobranzas...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_291_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4C1}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron registros de cobros para el a\xF1o seleccionado.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_292_tr_33_td_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 215);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "number");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const mes_r15 = ctx.$implicit;
    \u0275\u0275classProp("valor-cero", mes_r15 === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", mes_r15 > 0 ? "$" + \u0275\u0275pipeBind3(2, 3, mes_r15, "1.0-0", "es-AR") : "-", " ");
  }
}
function DirectorioDashboardComponent_div_292_tr_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 212)(1, "td", 209)(2, "span", 167);
    \u0275\u0275text(3, "\u{1F3E2}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(6, DirectorioDashboardComponent_div_292_tr_33_td_6_Template, 3, 7, "td", 213);
    \u0275\u0275elementStart(7, "td", 214);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "number");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const fila_r16 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(fila_r16.financiador);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", fila_r16.meses)("ngForTrackBy", ctx_r2.trackByMes);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" $", \u0275\u0275pipeBind3(9, 4, fila_r16.totalAnual, "1.0-0", "es-AR"), " ");
  }
}
function DirectorioDashboardComponent_div_292_td_38_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "td", 216);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "number");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const totalMes_r17 = ctx.$implicit;
    \u0275\u0275classProp("valor-cero", totalMes_r17 === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", totalMes_r17 > 0 ? "$" + \u0275\u0275pipeBind3(2, 3, totalMes_r17, "1.0-0", "es-AR") : "-", " ");
  }
}
function DirectorioDashboardComponent_div_292_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 202)(1, "table", 203)(2, "thead")(3, "tr")(4, "th", 204);
    \u0275\u0275text(5, "FINANCIADOR");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 205);
    \u0275\u0275text(7, "ENE");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 205);
    \u0275\u0275text(9, "FEB");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 205);
    \u0275\u0275text(11, "MAR");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 205);
    \u0275\u0275text(13, "ABR");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th", 205);
    \u0275\u0275text(15, "MAY");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "th", 205);
    \u0275\u0275text(17, "JUN");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "th", 205);
    \u0275\u0275text(19, "JUL");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "th", 205);
    \u0275\u0275text(21, "AGO");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "th", 205);
    \u0275\u0275text(23, "SEP");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "th", 205);
    \u0275\u0275text(25, "OCT");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "th", 205);
    \u0275\u0275text(27, "NOV");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(28, "th", 205);
    \u0275\u0275text(29, "DIC");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(30, "th", 206);
    \u0275\u0275text(31, "TOTAL ANUAL");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(32, "tbody");
    \u0275\u0275template(33, DirectorioDashboardComponent_div_292_tr_33_Template, 10, 8, "tr", 207);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "tfoot")(35, "tr", 208)(36, "td", 209);
    \u0275\u0275text(37, "TOTAL GENERAL");
    \u0275\u0275elementEnd();
    \u0275\u0275template(38, DirectorioDashboardComponent_div_292_td_38_Template, 3, 7, "td", 210);
    \u0275\u0275elementStart(39, "td", 211);
    \u0275\u0275text(40);
    \u0275\u0275pipe(41, "number");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(33);
    \u0275\u0275property("ngForOf", ctx_r2.matrizRecaudacion == null ? null : ctx_r2.matrizRecaudacion.filas)("ngForTrackBy", ctx_r2.trackByFinanciadorFila);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngForOf", ctx_r2.matrizRecaudacion == null ? null : ctx_r2.matrizRecaudacion.totalesMes)("ngForTrackBy", ctx_r2.trackByMes);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" $", \u0275\u0275pipeBind3(41, 5, (ctx_r2.matrizRecaudacion == null ? null : ctx_r2.matrizRecaudacion.granTotal) || 0, "1.0-0", "es-AR"), " ");
  }
}
function DirectorioDashboardComponent_div_351_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 133)(1, "span", 134);
    \u0275\u0275text(2, "\u23F3");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3, " Cargando datos\u2026 ");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_div_352_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 135)(1, "span");
    \u0275\u0275text(2, "Sin datos de motivos de d\xE9bito disponibles");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_canvas_353_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "canvas", 217);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("type", "bar")("data", ctx_r2.motivosChartData)("options", ctx_r2.motivosChartOptions);
  }
}
function DirectorioDashboardComponent_div_362_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 218);
    \u0275\u0275text(1, " Total Debitado: ");
    \u0275\u0275elementStart(2, "strong");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r2.formatearMoneda(ctx_r2.obtenerTotalDebitadoGeneral()));
  }
}
function DirectorioDashboardComponent_div_363_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Analizando motivos de d\xE9bito...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_364_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4CA}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se registran d\xE9bitos para el per\xEDodo y cobertura seleccionados.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_365__svg_path_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = \u0275\u0275getCurrentView();
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "path", 231);
    \u0275\u0275listener("mouseenter", function DirectorioDashboardComponent_div_365__svg_path_4_Template_path_mouseenter_0_listener() {
      const slice_r19 = \u0275\u0275restoreView(_r18).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onHoverSector(slice_r19));
    })("mouseleave", function DirectorioDashboardComponent_div_365__svg_path_4_Template_path_mouseleave_0_listener() {
      \u0275\u0275restoreView(_r18);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onHoverSector(null));
    })("click", function DirectorioDashboardComponent_div_365__svg_path_4_Template_path_click_0_listener() {
      const slice_r19 = \u0275\u0275restoreView(_r18).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.navegarADetalleMotivo(slice_r19.motivo));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const slice_r19 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("slice-active", (ctx_r2.sectorHover == null ? null : ctx_r2.sectorHover.motivo) === slice_r19.motivo);
    \u0275\u0275attribute("d", slice_r19.pathData)("fill", slice_r19.color);
  }
}
function DirectorioDashboardComponent_div_365_div_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 232);
    \u0275\u0275listener("mouseenter", function DirectorioDashboardComponent_div_365_div_23_Template_div_mouseenter_0_listener() {
      const item_r21 = \u0275\u0275restoreView(_r20).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onHoverSector({ motivo: item_r21.motivo, montoTotal: item_r21.montoTotal, porcentaje: item_r21.porcentaje, cantidadCasos: item_r21.cantidadCasos, color: item_r21.color || "#38bdf8", pathData: "", middleAngle: 0 }));
    })("mouseleave", function DirectorioDashboardComponent_div_365_div_23_Template_div_mouseleave_0_listener() {
      \u0275\u0275restoreView(_r20);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.onHoverSector(null));
    })("click", function DirectorioDashboardComponent_div_365_div_23_Template_div_click_0_listener() {
      const item_r21 = \u0275\u0275restoreView(_r20).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.navegarADetalleMotivo(item_r21.motivo));
    });
    \u0275\u0275elementStart(1, "div", 233);
    \u0275\u0275element(2, "span", 234);
    \u0275\u0275elementStart(3, "span", 235);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 236);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 237);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div", 238)(10, "div", 239);
    \u0275\u0275element(11, "div", 240);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "span", 241);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "div", 242)(15, "button", 243);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_365_div_23_Template_button_click_15_listener($event) {
      const item_r21 = \u0275\u0275restoreView(_r20).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.navegarADetalleMotivo(item_r21.motivo));
    });
    \u0275\u0275text(16, " Ver Detalle \u2794 ");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r21 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("legend-hover", (ctx_r2.sectorHover == null ? null : ctx_r2.sectorHover.motivo) === item_r21.motivo);
    \u0275\u0275property("title", \u0275\u0275interpolate1("Ver detalle de prestaciones para: ", item_r21.motivo));
    \u0275\u0275advance(2);
    \u0275\u0275styleProp("background-color", item_r21.color);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r21.motivo);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", item_r21.cantidadCasos, " casos");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r2.formatearMoneda(item_r21.montoTotal), " ");
    \u0275\u0275advance(3);
    \u0275\u0275styleProp("width", item_r21.porcentaje, "%")("background-color", item_r21.color);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", item_r21.porcentaje, "%");
  }
}
function DirectorioDashboardComponent_div_365_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 219)(1, "div", 220);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 221)(3, "g");
    \u0275\u0275template(4, DirectorioDashboardComponent_div_365__svg_path_4_Template, 1, 4, "path", 222);
    \u0275\u0275elementEnd();
    \u0275\u0275element(5, "circle", 223);
    \u0275\u0275elementStart(6, "text", 224);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "text", 225);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(10, "div", 226);
    \u0275\u0275text(11, "\u{1F4A1} Clic en un sector para ver prestaciones");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(12, "div", 227)(13, "div", 228)(14, "span");
    \u0275\u0275text(15, "Motivo / Causa de Rechazo");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "span");
    \u0275\u0275text(17, "Monto ($)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "span");
    \u0275\u0275text(19, "% Part.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "span");
    \u0275\u0275text(21, "Acci\xF3n");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(22, "div", 229);
    \u0275\u0275template(23, DirectorioDashboardComponent_div_365_div_23_Template, 17, 14, "div", 230);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275property("ngForOf", ctx_r2.slicesDonut);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx_r2.sectorHover ? ctx_r2.sectorHover.porcentaje + "%" : ctx_r2.motivosDebito.length + " Motivos", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r2.sectorHover ? ctx_r2.formatearMoneda(ctx_r2.sectorHover.montoTotal) : "Total D\xE9bitos", " ");
    \u0275\u0275advance(14);
    \u0275\u0275property("ngForOf", ctx_r2.motivosDebito);
  }
}
function DirectorioDashboardComponent_div_375_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 244);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.analistasDatos.length, " Analistas Activos ");
  }
}
function DirectorioDashboardComponent_div_376_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando m\xE9tricas de analistas de d\xE9bito...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_377_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4C1}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron d\xE9bitos registrados para los analistas en el per\xEDodo seleccionado.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_span_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 277);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const m_r26 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", m_r26.distribucionAtencion, " ");
  }
}
function DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_span_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 278);
    \u0275\u0275text(1, "\u2014");
    \u0275\u0275elementEnd();
  }
}
function DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_ng_container_29_tr_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 283)(1, "td", 284)(2, "span", 195);
    \u0275\u0275text(3, "\u2514\u2500");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 167);
    \u0275\u0275text(5, "\u{1F3E2}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "strong", 285);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "td", 169);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td", 286);
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 169);
    \u0275\u0275text(14, "\u2014");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const fin_r27 = ctx.$implicit;
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(fin_r27.financiador);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(fin_r27.casos);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(12, 3, \u0275\u0275pureFunction1(9, _c1, fin_r27.monto)), " ");
  }
}
function DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_ng_container_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 279)(2, "th", 280);
    \u0275\u0275text(3, "\u2514\u2500\u2500 Financiador Afectado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "th", 267);
    \u0275\u0275text(5, "Casos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 281);
    \u0275\u0275text(7, "Monto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 267);
    \u0275\u0275text(9, "\u2014");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_ng_container_29_tr_10_Template, 15, 11, "tr", 282);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const m_r26 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(10);
    \u0275\u0275property("ngForOf", m_r26.financiadores)("ngForTrackBy", ctx_r2.trackByFinanciadorAnalista);
  }
}
function DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 269);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_Template_tr_click_1_listener() {
      const m_r26 = \u0275\u0275restoreView(_r25).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.toggleMotivo(m_r26));
    });
    \u0275\u0275elementStart(2, "td", 270)(3, "button", 178);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 271);
    \u0275\u0275text(6, "\u{1F4CB}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 272);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 273);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 258);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 170);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "td", 172);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "td", 173);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "td", 163);
    \u0275\u0275template(23, DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_span_23_Template, 2, 1, "span", 274)(24, DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_span_24_Template, 2, 0, "span", 275);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(25, "td", 145)(26, "span", 276);
    \u0275\u0275text(27);
    \u0275\u0275pipe(28, "number");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(29, DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_ng_container_29_Template, 11, 2, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const m_r26 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", m_r26.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", m_r26.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", m_r26.expanded ? "\u25BC" : "\u25B6", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(m_r26.motivo);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", m_r26.financiadores.length, " financiadores");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(m_r26.casos);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(15, 21, \u0275\u0275pureFunction1(42, _c1, m_r26.montoDebitado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(18, 27, \u0275\u0275pureFunction1(44, _c1, m_r26.aceptado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(21, 33, \u0275\u0275pureFunction1(46, _c1, m_r26.refacturado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", m_r26.distribucionAtencion);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !m_r26.distribucionAtencion);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("recupero-alto", m_r26.montoDebitado > 0 && m_r26.refacturado * 100 / m_r26.montoDebitado >= 50)("recupero-medio", m_r26.montoDebitado > 0 && m_r26.refacturado * 100 / m_r26.montoDebitado > 0 && m_r26.refacturado * 100 / m_r26.montoDebitado < 50)("recupero-cero", m_r26.refacturado === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(28, 39, m_r26.montoDebitado > 0 ? m_r26.refacturado * 100 / m_r26.montoDebitado : 0, "1.1-1"), "% ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", m_r26.expanded);
  }
}
function DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 265)(2, "th", 266);
    \u0275\u0275text(3, "\u21B3 Motivo de D\xE9bito");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "th", 267);
    \u0275\u0275text(5, "Casos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 268);
    \u0275\u0275text(7, "Monto Debitado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 268);
    \u0275\u0275text(9, "Aceptado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 268);
    \u0275\u0275text(11, "Refacturado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 267);
    \u0275\u0275text(13, "Atenci\xF3n (AMB / INT)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th", 268);
    \u0275\u0275text(15, "% Rec.");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(16, DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_ng_container_16_Template, 30, 48, "ng-container", 182);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const a_r24 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(16);
    \u0275\u0275property("ngForOf", a_r24.motivos)("ngForTrackBy", ctx_r2.trackByMotivo);
  }
}
function DirectorioDashboardComponent_div_378_ng_container_35_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 253);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_ng_container_35_Template_tr_click_1_listener() {
      const a_r24 = \u0275\u0275restoreView(_r23).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleAnalista(a_r24));
    });
    \u0275\u0275elementStart(2, "td", 254)(3, "button", 255);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_ng_container_35_Template_button_click_3_listener($event) {
      const a_r24 = \u0275\u0275restoreView(_r23).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      ctx_r2.toggleAnalista(a_r24);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "td", 256)(6, "span", 257);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "td", 258)(9, "span", 259);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 260);
    \u0275\u0275text(12);
    \u0275\u0275pipe(13, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "td", 261);
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "td", 262);
    \u0275\u0275text(18);
    \u0275\u0275pipe(19, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "td", 163)(21, "span", 263);
    \u0275\u0275text(22);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(23, "td", 145)(24, "span", 264);
    \u0275\u0275text(25);
    \u0275\u0275pipe(26, "number");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(27, DirectorioDashboardComponent_div_378_ng_container_35_ng_container_27_Template, 17, 2, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const a_r24 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", a_r24.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", a_r24.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", a_r24.expanded ? "\u2212" : "+", " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(a_r24.analista);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(a_r24.cantidadRegistros);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(13, 19, \u0275\u0275pureFunction1(40, _c1, a_r24.debitosAceptados)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(16, 25, \u0275\u0275pureFunction1(42, _c1, a_r24.debitosRefacturados)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(19, 31, \u0275\u0275pureFunction1(44, _c1, a_r24.ticketPromedio)), " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", a_r24.distribucionAtencion || "100% Amb / 0% Int", " ");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("recupero-alto", a_r24.tasaRecupero >= 50)("recupero-medio", a_r24.tasaRecupero > 0 && a_r24.tasaRecupero < 50)("recupero-cero", a_r24.tasaRecupero === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(26, 37, a_r24.tasaRecupero, "1.1-1"), "% ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", a_r24.expanded);
  }
}
function DirectorioDashboardComponent_div_378_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 142)(1, "table", 245)(2, "thead")(3, "tr")(4, "th", 246);
    \u0275\u0275text(5, "#");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 247);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_Template_th_click_6_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ordenarAnalistas("analista"));
    });
    \u0275\u0275text(7, " ANALISTA / AUDITOR ");
    \u0275\u0275elementStart(8, "span", 248);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "th", 249);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_Template_th_click_10_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ordenarAnalistas("documentos"));
    });
    \u0275\u0275text(11, " DOCUMENTOS ");
    \u0275\u0275elementStart(12, "span", 248);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(14, "th", 250);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_Template_th_click_14_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ordenarAnalistas("aceptados"));
    });
    \u0275\u0275text(15, " D\xC9BITOS ACEPTADOS ($) ");
    \u0275\u0275elementStart(16, "span", 248);
    \u0275\u0275text(17);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "th", 250);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_Template_th_click_18_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ordenarAnalistas("refacturados"));
    });
    \u0275\u0275text(19, " REFACTURADOS ($) ");
    \u0275\u0275elementStart(20, "span", 248);
    \u0275\u0275text(21);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(22, "th", 250);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_Template_th_click_22_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ordenarAnalistas("ticket"));
    });
    \u0275\u0275text(23, " TICKET PROMEDIO ");
    \u0275\u0275elementStart(24, "span", 248);
    \u0275\u0275text(25);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(26, "th", 251);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_Template_th_click_26_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ordenarAnalistas("atencion"));
    });
    \u0275\u0275text(27, " ATENCI\xD3N (AMB / INT) ");
    \u0275\u0275elementStart(28, "span", 248);
    \u0275\u0275text(29);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(30, "th", 252);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_378_Template_th_click_30_listener() {
      \u0275\u0275restoreView(_r22);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.ordenarAnalistas("recupero"));
    });
    \u0275\u0275text(31, " % RECUPERO ");
    \u0275\u0275elementStart(32, "span", 248);
    \u0275\u0275text(33);
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(34, "tbody");
    \u0275\u0275template(35, DirectorioDashboardComponent_div_378_ng_container_35_Template, 28, 46, "ng-container", 182);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(9);
    \u0275\u0275textInterpolate(ctx_r2.columnaOrdenAnalista === "analista" ? ctx_r2.direccionOrdenAnalista === "asc" ? "\u2191" : "\u2193" : "\u2195");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.columnaOrdenAnalista === "documentos" ? ctx_r2.direccionOrdenAnalista === "asc" ? "\u2191" : "\u2193" : "\u2195");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.columnaOrdenAnalista === "aceptados" ? ctx_r2.direccionOrdenAnalista === "asc" ? "\u2191" : "\u2193" : "\u2195");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.columnaOrdenAnalista === "refacturados" ? ctx_r2.direccionOrdenAnalista === "asc" ? "\u2191" : "\u2193" : "\u2195");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.columnaOrdenAnalista === "ticket" ? ctx_r2.direccionOrdenAnalista === "asc" ? "\u2191" : "\u2193" : "\u2195");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.columnaOrdenAnalista === "atencion" ? ctx_r2.direccionOrdenAnalista === "asc" ? "\u2191" : "\u2193" : "");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.columnaOrdenAnalista === "recupero" ? ctx_r2.direccionOrdenAnalista === "asc" ? "\u2191" : "\u2193" : "\u2195");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", ctx_r2.analistasDatos)("ngForTrackBy", ctx_r2.trackByAnalista);
  }
}
function DirectorioDashboardComponent_div_388_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando bucles de insistencia...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_389_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u2705");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se detectaron bucles de insistencia (expedientes con 2 o m\xE1s d\xE9bitos NC) para los filtros seleccionados.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_390_ng_container_16_tr_22_span_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 305);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cadena_r29 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("M\xE9dico: ", cadena_r29.medico);
  }
}
function DirectorioDashboardComponent_div_390_ng_container_16_tr_22_div_10_div_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 317)(1, "small", 318);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const evento_r30 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("\u{1F464} ", evento_r30.responsable);
  }
}
function DirectorioDashboardComponent_div_390_ng_container_16_tr_22_div_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 306)(1, "div", 307);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "div", 308);
    \u0275\u0275elementStart(4, "div", 309)(5, "div", 310)(6, "strong", 311);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 312);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 313)(12, "span", 314);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 315);
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "currency");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(17, DirectorioDashboardComponent_div_390_ng_container_16_tr_22_div_10_div_17_Template, 3, 1, "div", 316);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const evento_r30 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r2.obtenerClaseNodo(evento_r30.tipo));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", evento_r30.tipo, " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(evento_r30.comprobante);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(10, 8, evento_r30.fecha, "dd/MM/yyyy"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(evento_r30.descripcion);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r2.obtenerClaseMonto(evento_r30.tipo));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(16, 11, \u0275\u0275pureFunction1(17, _c0, evento_r30.monto)), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", evento_r30.responsable);
  }
}
function DirectorioDashboardComponent_div_390_ng_container_16_tr_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 296)(1, "td", 297)(2, "div", 298)(3, "div", 299)(4, "span", 300);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, DirectorioDashboardComponent_div_390_ng_container_16_tr_22_span_6_Template, 2, 1, "span", 301);
    \u0275\u0275elementStart(7, "span", 302);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 303);
    \u0275\u0275template(10, DirectorioDashboardComponent_div_390_ng_container_16_tr_22_div_10_Template, 18, 19, "div", 304);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const cadena_r29 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("Expediente: ", cadena_r29.idPrestacion);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", cadena_r29.medico && cadena_r29.medico !== "No especificado");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", cadena_r29.historialEventos.length, " evento(s) en la cadena");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", cadena_r29.historialEventos)("ngForTrackBy", ctx_r2.trackByEvento);
  }
}
function DirectorioDashboardComponent_div_390_ng_container_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r28 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 289);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_390_ng_container_16_Template_tr_click_1_listener() {
      const cadena_r29 = \u0275\u0275restoreView(_r28).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleCadena(cadena_r29));
    });
    \u0275\u0275elementStart(2, "td", 163)(3, "button", 290);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_390_ng_container_16_Template_button_click_3_listener($event) {
      const cadena_r29 = \u0275\u0275restoreView(_r28).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.toggleCadena(cadena_r29));
    });
    \u0275\u0275text(4, " \u25B6 ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "td")(6, "strong", 188);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 291);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "td")(11, "span");
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "td")(14, "span", 292);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "td", 293);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "td", 294);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "currency");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(22, DirectorioDashboardComponent_div_390_ng_container_16_tr_22_Template, 11, 5, "tr", 295);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const cadena_r29 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", cadena_r29.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", cadena_r29.expanded);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(cadena_r29.idPrestacion);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(cadena_r29.descripcion);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(cadena_r29.financiador);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(cadena_r29.medico);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(18, 11, \u0275\u0275pureFunction1(23, _c0, cadena_r29.montoFacturadoOriginal)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", cadena_r29.totalDebitado > 0 ? \u0275\u0275pipeBindV(21, 17, \u0275\u0275pureFunction1(25, _c0, cadena_r29.totalDebitado)) : "\u2014", " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", cadena_r29.expanded);
  }
}
function DirectorioDashboardComponent_div_390_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 142)(1, "table", 287)(2, "thead")(3, "tr");
    \u0275\u0275element(4, "th", 288);
    \u0275\u0275elementStart(5, "th");
    \u0275\u0275text(6, "Prestaci\xF3n / Detalle");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "th");
    \u0275\u0275text(8, "Financiador");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "th");
    \u0275\u0275text(10, "M\xE9dico");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "th", 145);
    \u0275\u0275text(12, "Facturado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "th", 145);
    \u0275\u0275text(14, "D\xE9bitos");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(15, "tbody");
    \u0275\u0275template(16, DirectorioDashboardComponent_div_390_ng_container_16_Template, 23, 27, "ng-container", 182);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(16);
    \u0275\u0275property("ngForOf", ctx_r2.buclesDatos)("ngForTrackBy", ctx_r2.trackByCadena);
  }
}
function DirectorioDashboardComponent_div_400_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando m\xE9tricas de operadores de carga...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_401_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4C1}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron d\xE9bitos vinculados a operadores de carga en el per\xEDodo seleccionado.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_ng_container_14_ng_container_26_tr_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 283)(1, "td", 331)(2, "span", 195);
    \u0275\u0275text(3, "\u2514\u2500");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 167);
    \u0275\u0275text(5, "\u{1F3E2}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "strong", 285);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "td", 332);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td", 333);
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 169);
    \u0275\u0275text(14, "\u2014");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const fin_r35 = ctx.$implicit;
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(fin_r35.financiador);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(fin_r35.casos);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(12, 3, \u0275\u0275pureFunction1(9, _c0, fin_r35.monto)), " ");
  }
}
function DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_ng_container_14_ng_container_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 279)(2, "th", 329);
    \u0275\u0275text(3, "\u2514\u2500\u2500 Financiador Afectado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "th", 268);
    \u0275\u0275text(5, "Casos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 330);
    \u0275\u0275text(7, "Monto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 267);
    \u0275\u0275text(9, "\u2014");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_ng_container_14_ng_container_26_tr_10_Template, 15, 11, "tr", 282);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const m_r34 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(10);
    \u0275\u0275property("ngForOf", m_r34.financiadores)("ngForTrackBy", ctx_r2.trackByFinanciadorAnalista);
  }
}
function DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_ng_container_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r33 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 269);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_ng_container_14_Template_tr_click_1_listener() {
      const m_r34 = \u0275\u0275restoreView(_r33).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.toggleMotivo(m_r34));
    });
    \u0275\u0275elementStart(2, "td", 328)(3, "button", 178);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 271);
    \u0275\u0275text(6, "\u{1F4CB}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 272);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 273);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 145);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 170);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "td", 172);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "td", 173);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "td", 145)(23, "span", 276);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "number");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(26, DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_ng_container_14_ng_container_26_Template, 11, 2, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const m_r34 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", m_r34.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", m_r34.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", m_r34.expanded ? "\u25BC" : "\u25B6", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(m_r34.motivo);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", m_r34.financiadores.length, " financiadores");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(m_r34.casos);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(15, 19, \u0275\u0275pureFunction1(40, _c0, m_r34.montoDebitado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(18, 25, \u0275\u0275pureFunction1(42, _c0, m_r34.aceptado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(21, 31, \u0275\u0275pureFunction1(44, _c0, m_r34.refacturado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275classProp("recupero-alto", m_r34.montoDebitado > 0 && m_r34.refacturado * 100 / m_r34.montoDebitado >= 50)("recupero-medio", m_r34.montoDebitado > 0 && m_r34.refacturado * 100 / m_r34.montoDebitado > 0 && m_r34.refacturado * 100 / m_r34.montoDebitado < 50)("recupero-cero", m_r34.refacturado === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(25, 37, m_r34.montoDebitado > 0 ? m_r34.refacturado * 100 / m_r34.montoDebitado : 0, "1.1-1"), "% ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", m_r34.expanded);
  }
}
function DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 265)(2, "th", 327);
    \u0275\u0275text(3, "\u21B3 Motivo de D\xE9bito");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "th", 268);
    \u0275\u0275text(5, "Casos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 268);
    \u0275\u0275text(7, "Monto Debitado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 268);
    \u0275\u0275text(9, "Aceptado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 268);
    \u0275\u0275text(11, "Refacturado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 268);
    \u0275\u0275text(13, "% Rec.");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(14, DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_ng_container_14_Template, 27, 46, "ng-container", 182);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const op_r32 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(14);
    \u0275\u0275property("ngForOf", op_r32.motivos)("ngForTrackBy", ctx_r2.trackByMotivo);
  }
}
function DirectorioDashboardComponent_div_402_ng_container_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r31 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 323);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_402_ng_container_17_Template_tr_click_1_listener() {
      const op_r32 = \u0275\u0275restoreView(_r31).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleOperador(op_r32));
    });
    \u0275\u0275elementStart(2, "td", 256)(3, "button", 166);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 324);
    \u0275\u0275text(6, "\u{1F4BB}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 257);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 273);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 325);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 260);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "td", 261);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "td", 326);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "td", 145)(23, "span", 264);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "number");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(26, DirectorioDashboardComponent_div_402_ng_container_17_ng_container_26_Template, 15, 2, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const op_r32 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", op_r32.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", op_r32.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", op_r32.expanded ? "\u25BC" : "\u25B6", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(op_r32.operador);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", op_r32.motivos.length, " motivos");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", op_r32.cantidadRegistros, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(15, 19, \u0275\u0275pureFunction1(40, _c0, op_r32.debitosAceptados)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(18, 25, \u0275\u0275pureFunction1(42, _c0, op_r32.debitosRefacturados)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(21, 31, \u0275\u0275pureFunction1(44, _c0, op_r32.ticketPromedio)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275classProp("recupero-alto", op_r32.tasaRecupero >= 50)("recupero-medio", op_r32.tasaRecupero > 0 && op_r32.tasaRecupero < 50)("recupero-cero", op_r32.tasaRecupero === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(25, 37, op_r32.tasaRecupero, "1.1-1"), "% ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", op_r32.expanded);
  }
}
function DirectorioDashboardComponent_div_402_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 142)(1, "table", 245)(2, "thead")(3, "tr")(4, "th", 319);
    \u0275\u0275text(5, "Operador / Motivo / Financiador");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 320);
    \u0275\u0275text(7, "Documentos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 321);
    \u0275\u0275text(9, "Aceptados (P\xE9rdida)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 321);
    \u0275\u0275text(11, "Refacturados");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 321);
    \u0275\u0275text(13, "Ticket Promedio");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th", 322);
    \u0275\u0275text(15, "% Recupero");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "tbody");
    \u0275\u0275template(17, DirectorioDashboardComponent_div_402_ng_container_17_Template, 27, 46, "ng-container", 182);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(17);
    \u0275\u0275property("ngForOf", ctx_r2.operadoresDatos)("ngForTrackBy", ctx_r2.trackByOperador);
  }
}
function DirectorioDashboardComponent_div_412_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando m\xE9tricas de m\xE9dicos / prestadores...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_413_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4C1}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron d\xE9bitos registrados para los m\xE9dicos en el per\xEDodo seleccionado.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_ng_container_14_ng_container_26_tr_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 283)(1, "td", 331)(2, "span", 195);
    \u0275\u0275text(3, "\u2514\u2500");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 167);
    \u0275\u0275text(5, "\u{1F3E2}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "strong", 285);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "td", 332);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "td", 333);
    \u0275\u0275text(11);
    \u0275\u0275pipe(12, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 169);
    \u0275\u0275text(14, "\u2014");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const fin_r40 = ctx.$implicit;
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate(fin_r40.financiador);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(fin_r40.casos);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(12, 3, \u0275\u0275pureFunction1(9, _c0, fin_r40.monto)), " ");
  }
}
function DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_ng_container_14_ng_container_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 279)(2, "th", 329);
    \u0275\u0275text(3, "\u2514\u2500\u2500 Financiador Afectado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "th", 268);
    \u0275\u0275text(5, "Casos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 330);
    \u0275\u0275text(7, "Monto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 267);
    \u0275\u0275text(9, "\u2014");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(10, DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_ng_container_14_ng_container_26_tr_10_Template, 15, 11, "tr", 282);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const m_r39 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(10);
    \u0275\u0275property("ngForOf", m_r39.financiadores)("ngForTrackBy", ctx_r2.trackByFinanciadorAnalista);
  }
}
function DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_ng_container_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r38 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 269);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_ng_container_14_Template_tr_click_1_listener() {
      const m_r39 = \u0275\u0275restoreView(_r38).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.toggleMotivo(m_r39));
    });
    \u0275\u0275elementStart(2, "td", 328)(3, "button", 178);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 271);
    \u0275\u0275text(6, "\u{1F4CB}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 272);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 273);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 145);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 170);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "td", 172);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "td", 173);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "td", 145)(23, "span", 276);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "number");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(26, DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_ng_container_14_ng_container_26_Template, 11, 2, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const m_r39 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", m_r39.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", m_r39.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", m_r39.expanded ? "\u25BC" : "\u25B6", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(m_r39.motivo);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", m_r39.financiadores.length, " financiadores");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(m_r39.casos);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(15, 19, \u0275\u0275pureFunction1(40, _c0, m_r39.montoDebitado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(18, 25, \u0275\u0275pureFunction1(42, _c0, m_r39.aceptado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(21, 31, \u0275\u0275pureFunction1(44, _c0, m_r39.refacturado)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275classProp("recupero-alto", m_r39.montoDebitado > 0 && m_r39.refacturado * 100 / m_r39.montoDebitado >= 50)("recupero-medio", m_r39.montoDebitado > 0 && m_r39.refacturado * 100 / m_r39.montoDebitado > 0 && m_r39.refacturado * 100 / m_r39.montoDebitado < 50)("recupero-cero", m_r39.refacturado === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(25, 37, m_r39.montoDebitado > 0 ? m_r39.refacturado * 100 / m_r39.montoDebitado : 0, "1.1-1"), "% ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", m_r39.expanded);
  }
}
function DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 265)(2, "th", 327);
    \u0275\u0275text(3, "\u21B3 Motivo de D\xE9bito");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "th", 268);
    \u0275\u0275text(5, "Casos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 268);
    \u0275\u0275text(7, "Monto Debitado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 268);
    \u0275\u0275text(9, "Aceptado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 268);
    \u0275\u0275text(11, "Refacturado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 268);
    \u0275\u0275text(13, "% Rec.");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(14, DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_ng_container_14_Template, 27, 46, "ng-container", 182);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const med_r37 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(14);
    \u0275\u0275property("ngForOf", med_r37.motivos)("ngForTrackBy", ctx_r2.trackByMotivo);
  }
}
function DirectorioDashboardComponent_div_414_ng_container_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r36 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 334);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_414_ng_container_17_Template_tr_click_1_listener() {
      const med_r37 = \u0275\u0275restoreView(_r36).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleMedico(med_r37));
    });
    \u0275\u0275elementStart(2, "td", 256)(3, "button", 166);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 324);
    \u0275\u0275text(6, "\u{1FA7A}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 257);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 273);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "td", 325);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td", 260);
    \u0275\u0275text(14);
    \u0275\u0275pipe(15, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "td", 261);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "td", 326);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "td", 145)(23, "span", 264);
    \u0275\u0275text(24);
    \u0275\u0275pipe(25, "number");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(26, DirectorioDashboardComponent_div_414_ng_container_17_ng_container_26_Template, 15, 2, "ng-container", 32);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const med_r37 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", med_r37.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", med_r37.expanded);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", med_r37.expanded ? "\u25BC" : "\u25B6", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(med_r37.medico);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", med_r37.motivos.length, " motivos");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", med_r37.cantidadRegistros, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(15, 19, \u0275\u0275pureFunction1(40, _c0, med_r37.debitosAceptados)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(18, 25, \u0275\u0275pureFunction1(42, _c0, med_r37.debitosRefacturados)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(21, 31, \u0275\u0275pureFunction1(44, _c0, med_r37.ticketPromedio)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275classProp("recupero-alto", med_r37.tasaRecupero >= 50)("recupero-medio", med_r37.tasaRecupero > 0 && med_r37.tasaRecupero < 50)("recupero-cero", med_r37.tasaRecupero === 0);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind2(25, 37, med_r37.tasaRecupero, "1.1-1"), "% ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", med_r37.expanded);
  }
}
function DirectorioDashboardComponent_div_414_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 142)(1, "table", 245)(2, "thead")(3, "tr")(4, "th", 319);
    \u0275\u0275text(5, "M\xE9dico / Motivo / Financiador");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th", 320);
    \u0275\u0275text(7, "Documentos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th", 321);
    \u0275\u0275text(9, "Aceptados (P\xE9rdida)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th", 321);
    \u0275\u0275text(11, "Refacturados");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "th", 321);
    \u0275\u0275text(13, "Ticket Promedio");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "th", 322);
    \u0275\u0275text(15, "% Recupero");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(16, "tbody");
    \u0275\u0275template(17, DirectorioDashboardComponent_div_414_ng_container_17_Template, 27, 46, "ng-container", 182);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(17);
    \u0275\u0275property("ngForOf", ctx_r2.medicosDatos)("ngForTrackBy", ctx_r2.trackByMedico);
  }
}
function DirectorioDashboardComponent_div_424_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 138);
    \u0275\u0275element(1, "div", 139);
    \u0275\u0275elementStart(2, "p");
    \u0275\u0275text(3, "Cargando trazabilidad de expedientes...");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_425_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 140)(1, "span", 141);
    \u0275\u0275text(2, "\u{1F4C1}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No se encontraron expedientes vinculados para los filtros seleccionados.");
    \u0275\u0275elementEnd()();
  }
}
function DirectorioDashboardComponent_div_426_ng_container_16_tr_22_span_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 305);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cadena_r42 = \u0275\u0275nextContext(2).$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("M\xE9dico: ", cadena_r42.medico);
  }
}
function DirectorioDashboardComponent_div_426_ng_container_16_tr_22_div_10_div_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 317)(1, "small", 318);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const evento_r43 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("\u{1F464} ", evento_r43.responsable);
  }
}
function DirectorioDashboardComponent_div_426_ng_container_16_tr_22_div_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 306)(1, "div", 307);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275element(3, "div", 308);
    \u0275\u0275elementStart(4, "div", 309)(5, "div", 310)(6, "strong", 311);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 312);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 313)(12, "span", 314);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 315);
    \u0275\u0275text(15);
    \u0275\u0275pipe(16, "currency");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(17, DirectorioDashboardComponent_div_426_ng_container_16_tr_22_div_10_div_17_Template, 3, 1, "div", 316);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const evento_r43 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r2.obtenerClaseNodo(evento_r43.tipo));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", evento_r43.tipo, " ");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(evento_r43.comprobante);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(10, 8, evento_r43.fecha, "dd/MM/yyyy"));
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(evento_r43.descripcion);
    \u0275\u0275advance();
    \u0275\u0275property("ngClass", ctx_r2.obtenerClaseMonto(evento_r43.tipo));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(16, 11, \u0275\u0275pureFunction1(17, _c0, evento_r43.monto)), " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", evento_r43.responsable);
  }
}
function DirectorioDashboardComponent_div_426_ng_container_16_tr_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr", 296)(1, "td", 297)(2, "div", 298)(3, "div", 299)(4, "span", 300);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, DirectorioDashboardComponent_div_426_ng_container_16_tr_22_span_6_Template, 2, 1, "span", 301);
    \u0275\u0275elementStart(7, "span", 302);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 303);
    \u0275\u0275template(10, DirectorioDashboardComponent_div_426_ng_container_16_tr_22_div_10_Template, 18, 19, "div", 304);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const cadena_r42 = \u0275\u0275nextContext().$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("Expediente: ", cadena_r42.idPrestacion);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", cadena_r42.medico && cadena_r42.medico !== "No especificado");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", cadena_r42.historialEventos.length, " evento(s) en la cadena");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", cadena_r42.historialEventos)("ngForTrackBy", ctx_r2.trackByEvento);
  }
}
function DirectorioDashboardComponent_div_426_ng_container_16_Template(rf, ctx) {
  if (rf & 1) {
    const _r41 = \u0275\u0275getCurrentView();
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "tr", 289);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_426_ng_container_16_Template_tr_click_1_listener() {
      const cadena_r42 = \u0275\u0275restoreView(_r41).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleCadena(cadena_r42));
    });
    \u0275\u0275elementStart(2, "td", 163)(3, "button", 290);
    \u0275\u0275listener("click", function DirectorioDashboardComponent_div_426_ng_container_16_Template_button_click_3_listener($event) {
      const cadena_r42 = \u0275\u0275restoreView(_r41).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      $event.stopPropagation();
      return \u0275\u0275resetView(ctx_r2.toggleCadena(cadena_r42));
    });
    \u0275\u0275text(4, " \u25B6 ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "td")(6, "strong", 188);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 291);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "td")(11, "span");
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "td")(14, "span", 292);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "td", 293);
    \u0275\u0275text(17);
    \u0275\u0275pipe(18, "currency");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "td", 294);
    \u0275\u0275text(20);
    \u0275\u0275pipe(21, "currency");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(22, DirectorioDashboardComponent_div_426_ng_container_16_tr_22_Template, 11, 5, "tr", 295);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const cadena_r42 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275classProp("is-expanded", cadena_r42.expanded);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("is-expanded", cadena_r42.expanded);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(cadena_r42.idPrestacion);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(cadena_r42.descripcion);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(cadena_r42.financiador);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(cadena_r42.medico);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBindV(18, 11, \u0275\u0275pureFunction1(23, _c0, cadena_r42.montoFacturadoOriginal)), " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", cadena_r42.totalDebitado > 0 ? \u0275\u0275pipeBindV(21, 17, \u0275\u0275pureFunction1(25, _c0, cadena_r42.totalDebitado)) : "\u2014", " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", cadena_r42.expanded);
  }
}
function DirectorioDashboardComponent_div_426_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 142)(1, "table", 287)(2, "thead")(3, "tr");
    \u0275\u0275element(4, "th", 288);
    \u0275\u0275elementStart(5, "th");
    \u0275\u0275text(6, "Prestaci\xF3n / Detalle");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "th");
    \u0275\u0275text(8, "Financiador");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "th");
    \u0275\u0275text(10, "M\xE9dico");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "th", 145);
    \u0275\u0275text(12, "Facturado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "th", 145);
    \u0275\u0275text(14, "D\xE9bitos");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(15, "tbody");
    \u0275\u0275template(16, DirectorioDashboardComponent_div_426_ng_container_16_Template, 23, 27, "ng-container", 182);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(16);
    \u0275\u0275property("ngForOf", ctx_r2.trazabilidadDatos)("ngForTrackBy", ctx_r2.trackByCadena);
  }
}
Chart.register(...registerables);
var DirectorioDashboardComponent = class _DirectorioDashboardComponent {
  directorioService = inject(DirectorioService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  // ---------------------------------------------------------------------------
  // Sistema de Solapas / Pestañas de Navegación del Tablero (10 Sectores Individuales)
  // ---------------------------------------------------------------------------
  solapaActiva = "tablero";
  solapasCargadas = /* @__PURE__ */ new Set();
  seleccionarSolapa(solapa) {
    this.solapaActiva = solapa;
    this.cargarDatosSolapa(solapa);
    if (solapa === "tablero" || solapa === "tiempos-cobranza" || solapa === "motivos") {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 50);
    }
  }
  cargarDatosSolapa(solapa, forzarRecarga = false) {
    if (!forzarRecarga && this.solapasCargadas.has(solapa)) {
      return;
    }
    this.solapasCargadas.add(solapa);
    switch (solapa) {
      case "tablero":
        this.cargarBalanceFinanciero();
        this.cargarDistribucionCartera();
        this.cargarEvolucionMensual();
        break;
      case "cuenta-corriente":
        this.cargarCuentaCorriente();
        break;
      case "tiempos-cobranza":
        this.cargarAgingFinanciero();
        break;
      case "matriz-cobranzas":
        this.cargarMatrizRecaudacion();
        break;
      case "motivos":
        this.cargarParetoMotivos();
        break;
      case "analistas":
      case "medicos":
      case "usuarios-carga":
        this.cargarDesempenoOperativo();
        this.solapasCargadas.add("analistas");
        this.solapasCargadas.add("medicos");
        this.solapasCargadas.add("usuarios-carga");
        break;
      case "bucles":
        this.cargarBucles();
        break;
      case "trazabilidad":
        this.cargarTrazabilidad();
        break;
    }
  }
  // Filtros
  coberturas = [];
  codigoCoberturaSeleccionada = "TODAS";
  tiposDocumento = [];
  tipoDocSeleccionado = "TODOS";
  fechaDesde = "";
  fechaHasta = "";
  // Estados de carga
  cargandoTotales = false;
  cargandoGrupos = false;
  cargandoMotivos = false;
  cargandoCuentaCorriente = false;
  cargandoMatriz = false;
  cargandoTrazabilidad = false;
  cargandoBucles = false;
  cargandoAnalistas = false;
  cargandoMedicos = false;
  cargandoOperadores = false;
  // Datos
  cuentaCorrienteDatos = [];
  matrizRecaudacion = null;
  trazabilidadDatos = [];
  buclesDatos = [];
  analistasDatos = [];
  columnaOrdenAnalista = "";
  direccionOrdenAnalista = "desc";
  medicosDatos = [];
  operadoresDatos = [];
  balanceFinanciadores = [];
  cargandoBalance = false;
  totalesBalance = {
    facturacionFc: 0,
    incrementosNd: 0,
    debitosNc: 0,
    refacturadoNd: 0,
    cobradoRc: 0,
    saldoPendiente: 0
  };
  totales = {
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
  gruposFacturas = [];
  motivosDebito = [];
  // Paleta de colores para el gráfico Donut
  paletaColores = [
    "#38bdf8",
    "#818cf8",
    "#c084fc",
    "#f472b6",
    "#fb7185",
    "#fb923c",
    "#fbbf24",
    "#34d399",
    "#2dd4bf",
    "#22d3ee",
    "#60a5fa",
    "#a78bfa",
    "#e879f9",
    "#4ade80",
    "#a3e635"
  ];
  slicesDonut = [];
  sectorHover = null;
  // ---------------------------------------------------------------------------
  // Gráficos Chart.js
  // ---------------------------------------------------------------------------
  /** Paleta para el doughnut (distribución de cartera) */
  COLORES_DONA = [
    "#38bdf8",
    "#818cf8",
    "#c084fc",
    "#f472b6",
    "#fb7185",
    "#fb923c",
    "#fbbf24",
    "#34d399",
    "#2dd4bf",
    "#4ade80",
    "#60a5fa",
    "#a78bfa",
    "#e879f9",
    "#22d3ee",
    "#a3e635"
  ];
  COLORES_DONA_BORDE = this.COLORES_DONA.map((c) => c);
  // mismo color de borde
  cargandoGraficos = false;
  /** Doughnut: Distribución de cartera por financiador */
  distribucionChartData = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.COLORES_DONA,
      borderColor: "#1e293b",
      borderWidth: 2,
      hoverOffset: 8
    }]
  };
  distribucionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#cbd5e1",
          font: { size: 12, family: "Inter, sans-serif" },
          padding: 14,
          boxWidth: 14
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw ?? 0;
            return ` ${ctx.label}: $ ${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
          }
        }
      }
    }
  };
  /** Line: Evolución mensual (Facturación / Débitos / Cobranzas) */
  evolucionChartData = {
    labels: [],
    datasets: [
      {
        label: "Facturaci\xF3n",
        data: [],
        borderColor: "#38bdf8",
        // Azul corporativo
        backgroundColor: "rgba(56,189,248,0.10)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      },
      {
        label: "D\xE9bitos (NC)",
        data: [],
        borderColor: "#f87171",
        // Rojo
        backgroundColor: "rgba(248,113,113,0.08)",
        fill: false,
        tension: 0.4,
        borderDash: [6, 3],
        // Punteado
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      },
      {
        label: "Cobranzas (RC)",
        data: [],
        borderColor: "#34d399",
        // Verde
        backgroundColor: "rgba(52,211,153,0.10)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };
  evolucionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "rgba(148,163,184,0.10)" }
      },
      y: {
        ticks: {
          color: "#94a3b8",
          font: { size: 11 },
          callback: (v) => "$ " + Number(v).toLocaleString("es-AR", { notation: "compact", maximumFractionDigits: 1 })
        },
        grid: { color: "rgba(148,163,184,0.10)" }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: "#cbd5e1",
          font: { size: 12, family: "Inter, sans-serif" },
          padding: 16,
          boxWidth: 16,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: $ ${Number(ctx.raw).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
        }
      }
    }
  };
  // ── Aging Financiero (Bar vertical) ───────────────────────────────────────
  /** Colores por rango: verde→azul→ámbar→rojo→rojo oscuro */
  COLORES_AGING = [
    "#059669",
    // 0-30 días   (verde)
    "#2563eb",
    // 31-60 días  (azul)
    "#b45309",
    // 61-90 días  (naranja/ámbar)
    "#dc2626",
    // 91-180 días (rojo)
    "#7f1d1d"
    // +180 días   (rojo oscuro)
  ];
  tiemposCobranzaDatos = null;
  agingChartData = {
    labels: [],
    datasets: [{
      label: "Saldo en Mora",
      data: [],
      backgroundColor: this.COLORES_AGING,
      borderColor: this.COLORES_AGING.map((c) => c + "cc"),
      borderWidth: 1,
      borderRadius: 6
    }]
  };
  agingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Saldo en Mora: $${Number(ctx.raw).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#64748b",
          font: { size: 10 }
        },
        grid: { display: false }
      },
      y: {
        ticks: {
          color: "#64748b",
          font: { size: 9 },
          callback: (v) => "$" + Math.round(Number(v) / 1e3) + "k"
        },
        grid: { color: "rgba(226, 232, 240, 0.6)" }
      }
    }
  };
  // ── Pareto de Motivos / Glosas (Bar apilada) ────────────────────────────────
  motivosChartData = {
    labels: [],
    datasets: [
      {
        label: "Refacturado",
        data: [],
        backgroundColor: "#2563eb",
        borderColor: "#1d4ed8",
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: "P\xE9rdida",
        data: [],
        backgroundColor: "#dc2626",
        borderColor: "#b91c1c",
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };
  motivosChartOptions = {
    indexAxis: "y",
    // Convierte el gráfico a barras horizontales
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#cbd5e1",
          font: { size: 12 },
          padding: 14,
          boxWidth: 14
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: $ ${Number(ctx.raw).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          font: { size: 10 },
          // El formato de moneda ahora va en el eje X (montos)
          callback: (v) => "$ " + Number(v).toLocaleString("es-AR", { notation: "compact", maximumFractionDigits: 1 })
        },
        grid: { color: "rgba(148,163,184,0.10)" }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          font: { size: 10 }
          // maxRotation y minRotation eliminados: los textos largos ya no necesitan rotarse
        },
        grid: { display: false }
      }
    }
  };
  ngOnInit() {
    this.inicializarFechasMesAnterior();
    this.cargarCoberturas();
    this.cargarTiposDocumento();
    this.cargarDashboard();
  }
  // Establece por defecto el primer y último día del mes anterior
  inicializarFechasMesAnterior() {
    const hoy = /* @__PURE__ */ new Date();
    const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    this.fechaDesde = this.formatearFechaIso(primerDiaMesAnterior);
    this.fechaHasta = this.formatearFechaIso(ultimoDiaMesAnterior);
  }
  formatearFechaIso(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  cargarCoberturas() {
    this.directorioService.obtenerCoberturas().subscribe({
      next: (data) => {
        this.coberturas = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error("Error al cargar coberturas:", err)
    });
  }
  cargarTiposDocumento() {
    this.directorioService.obtenerTiposDocumento().subscribe({
      next: (data) => {
        this.tiposDocumento = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error("Error al cargar tipos de documento:", err)
    });
  }
  cargarDashboard() {
    this.solapasCargadas.clear();
    this.cargarTotales();
    this.cargarGrupos();
    this.cargarMotivos();
    this.cargarDatosSolapa(this.solapaActiva, true);
  }
  aplicarFiltros() {
    this.cargarDashboard();
  }
  irAlMesAnterior() {
    let baseDate = /* @__PURE__ */ new Date();
    if (this.fechaDesde) {
      const parts = this.fechaDesde.split("-");
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
  restablecerFiltros() {
    this.irAlMesAnterior();
  }
  cargarTotales() {
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
        console.error("Error al cargar totales:", err);
        this.cargandoTotales = false;
        this.cdr.markForCheck();
      }
    });
  }
  cargarGrupos() {
    this.cargandoGrupos = true;
    this.directorioService.obtenerGrupos(this.codigoCoberturaSeleccionada, this.tipoDocSeleccionado, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.gruposFacturas = (data || []).map((g) => __spreadProps(__spreadValues({}, g), { expandido: false }));
        this.cargandoGrupos = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar grupos:", err);
        this.cargandoGrupos = false;
        this.cdr.markForCheck();
      }
    });
  }
  cargarMotivos() {
    this.cargandoMotivos = true;
    this.directorioService.obtenerMotivos(this.codigoCoberturaSeleccionada, this.tipoDocSeleccionado, this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.motivosDebito = (data || []).map((m, idx) => __spreadProps(__spreadValues({}, m), {
          color: this.paletaColores[idx % this.paletaColores.length]
        }));
        this.calcularSlicesDonut();
        this.cargandoMotivos = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar motivos:", err);
        this.cargandoMotivos = false;
        this.cdr.markForCheck();
      }
    });
  }
  toggleGrupo(grupo) {
    grupo.expandido = !grupo.expandido;
  }
  expandirTodos(expandir) {
    this.gruposFacturas.forEach((g) => g.expandido = expandir);
  }
  // Generación de Arcos SVG para Donut Chart
  calcularSlicesDonut() {
    this.slicesDonut = [];
    if (!this.motivosDebito || this.motivosDebito.length === 0)
      return;
    const radioExterior = 90;
    const radioInterior = 55;
    const centroX = 100;
    const centroY = 100;
    let anguloAcumulado = -90;
    this.motivosDebito.forEach((item) => {
      const porcentaje = item.porcentaje || 0;
      if (porcentaje <= 0)
        return;
      const anguloGiro = porcentaje / 100 * 360;
      const anguloInicio = anguloAcumulado;
      const anguloFin = anguloAcumulado + (anguloGiro >= 360 ? 359.99 : anguloGiro);
      const anguloMedio = anguloInicio + anguloGiro / 2;
      const pathData = this.crearPathArcoDonut(centroX, centroY, radioInterior, radioExterior, anguloInicio, anguloFin);
      this.slicesDonut.push({
        motivo: item.motivo,
        montoTotal: item.montoTotal,
        porcentaje: item.porcentaje,
        cantidadCasos: item.cantidadCasos,
        color: item.color || "#38bdf8",
        pathData,
        middleAngle: anguloMedio
      });
      anguloAcumulado += anguloGiro;
    });
  }
  crearPathArcoDonut(cx, cy, rIn, rOut, angInicioDeg, angFinDeg) {
    const toRad = (deg) => deg * Math.PI / 180;
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
    const arcSweep = angFinDeg - angInicioDeg <= 180 ? "0" : "1";
    return [
      `M ${xOutIni} ${yOutIni}`,
      `A ${rOut} ${rOut} 0 ${arcSweep} 1 ${xOutFin} ${yOutFin}`,
      `L ${xInFin} ${yInFin}`,
      `A ${rIn} ${rIn} 0 ${arcSweep} 0 ${xInIni} ${yInIni}`,
      "Z"
    ].join(" ");
  }
  onHoverSector(slice) {
    this.sectorHover = slice;
  }
  navegarADetalleMotivo(motivo) {
    if (!motivo)
      return;
    this.router.navigate(["/directorio/motivo", encodeURIComponent(motivo)], {
      queryParams: {
        codigoCobertura: this.codigoCoberturaSeleccionada,
        tipoDoc: this.tipoDocSeleccionado,
        fechaDesde: this.fechaDesde,
        fechaHasta: this.fechaHasta
      }
    });
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
    return "$ " + Number(valor).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  obtenerTotalDebitadoGeneral() {
    return this.motivosDebito.reduce((acc, m) => acc + (m.montoTotal || 0), 0);
  }
  // ---------------------------------------------------------------------------
  // Métricas y Contadores - Solapa Motivos de Débito y Refacturación
  // ---------------------------------------------------------------------------
  get totalDebitadoMotivos() {
    if (this.totales?.totalDebitosNc && this.totales.totalDebitosNc > 0) {
      return this.totales.totalDebitosNc;
    }
    return this.obtenerTotalDebitadoGeneral() || 0;
  }
  get totalCasosAfectadosMotivos() {
    return (this.motivosDebito || []).reduce((acc, m) => acc + (m.cantidadCasos || 0), 0);
  }
  get totalRefacturadoMotivos() {
    return this.totales?.totalRefacturacionNd || 0;
  }
  get debitoAceptadoPerdidaMotivos() {
    if (this.totales?.perdidaAsumida && this.totales.perdidaAsumida > 0) {
      return this.totales.perdidaAsumida;
    }
    const deb = this.totalDebitadoMotivos;
    const ref = this.totalRefacturadoMotivos;
    return Math.max(0, deb - ref);
  }
  get tasaPerdidaMotivos() {
    const deb = this.totalDebitadoMotivos;
    if (!deb || deb <= 0)
      return 0;
    const perdida = this.debitoAceptadoPerdidaMotivos;
    return Math.min(100, Math.max(0, Math.round(perdida / deb * 100)));
  }
  get tasaRecuperoMotivos() {
    if (this.totales?.tasaRecupero !== void 0 && this.totales?.tasaRecupero !== null && this.totales.tasaRecupero > 0) {
      return Math.round(this.totales.tasaRecupero);
    }
    const deb = this.totalDebitadoMotivos;
    if (!deb || deb <= 0)
      return 0;
    const ref = this.totalRefacturadoMotivos;
    return Math.min(100, Math.max(0, Math.round(ref / deb * 100)));
  }
  get motivosIdentificadosCount() {
    return (this.motivosDebito || []).length;
  }
  formatearMontoContador(monto) {
    if (!monto || monto <= 0 || isNaN(monto))
      return "$0";
    return "$" + Math.round(monto).toLocaleString("es-AR");
  }
  // ---------------------------------------------------------------------------
  // Carga de gráficos Chart.js
  // ---------------------------------------------------------------------------
  graficosPendientes = 0;
  iniciarCargaGrafico() {
    this.graficosPendientes++;
    this.cargandoGraficos = true;
    this.cdr.markForCheck();
  }
  finalizarCargaGrafico() {
    this.graficosPendientes = Math.max(0, this.graficosPendientes - 1);
    if (this.graficosPendientes === 0) {
      this.cargandoGraficos = false;
    }
    this.cdr.markForCheck();
  }
  cargarGraficos() {
    this.cargarDistribucionCartera();
    this.cargarEvolucionMensual();
    this.cargarAgingFinanciero();
    this.cargarParetoMotivos();
  }
  cargarDistribucionCartera() {
    if (!this.directorioService.getCarteraDonut)
      return;
    this.iniciarCargaGrafico();
    this.directorioService.getCarteraDonut().subscribe({
      next: (puntos) => {
        const labels = (puntos || []).map((p) => p.etiqueta);
        const data = (puntos || []).map((p) => Number(p.saldo));
        this.distribucionChartData = {
          labels,
          datasets: [{
            data,
            backgroundColor: this.COLORES_DONA.slice(0, labels.length),
            borderColor: "#1e293b",
            borderWidth: 2,
            hoverOffset: 8
          }]
        };
        this.finalizarCargaGrafico();
      },
      error: (err) => {
        console.error("Error al cargar distribuci\xF3n de cartera:", err);
        this.finalizarCargaGrafico();
      }
    });
  }
  cargarBalanceFinanciero() {
    if (!this.directorioService.getBalanceFinanciero)
      return;
    this.cargandoBalance = true;
    this.directorioService.getBalanceFinanciero().subscribe({
      next: (data) => {
        this.balanceFinanciadores = data || [];
        this.calcularTotalesBalance();
        this.cargandoBalance = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar balance financiero:", err);
        this.cargandoBalance = false;
        this.cdr.markForCheck();
      }
    });
  }
  calcularTotalesBalance() {
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
  cargarEvolucionMensual() {
    if (!this.directorioService.getEvolucionMensual)
      return;
    this.iniciarCargaGrafico();
    this.directorioService.getEvolucionMensual().subscribe({
      next: (datasets) => {
        if (!datasets || datasets.length < 3) {
          this.finalizarCargaGrafico();
          return;
        }
        const labels = datasets[0].puntos.map((p) => p.etiqueta);
        this.evolucionChartData = {
          labels,
          datasets: [
            {
              label: "Facturaci\xF3n",
              data: datasets[0].puntos.map((p) => Number(p.valor)),
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.10)",
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            },
            {
              label: "D\xE9bitos (NC)",
              data: datasets[1].puntos.map((p) => Number(p.valor)),
              borderColor: "#f87171",
              backgroundColor: "rgba(248,113,113,0.08)",
              fill: false,
              tension: 0.4,
              borderDash: [6, 3],
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
            },
            {
              label: "Cobranzas (RC)",
              data: datasets[2].puntos.map((p) => Number(p.valor)),
              borderColor: "#34d399",
              backgroundColor: "rgba(52,211,153,0.10)",
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
        console.error("Error al cargar evoluci\xF3n mensual:", err);
        this.finalizarCargaGrafico();
      }
    });
  }
  cargarAgingFinanciero() {
    if (!this.directorioService.getTiemposCobranza)
      return;
    this.iniciarCargaGrafico();
    this.directorioService.getTiemposCobranza().subscribe({
      next: (res) => {
        this.tiemposCobranzaDatos = res;
        const detalles = res?.detalles ?? [];
        this.agingChartData = {
          labels: detalles.map((d) => d.rango),
          datasets: [{
            label: "Saldo en Mora",
            data: detalles.map((d) => Number(d.saldoEnMora)),
            backgroundColor: this.COLORES_AGING.slice(0, detalles.length),
            borderRadius: 4,
            maxBarThickness: 75
          }]
        };
        this.finalizarCargaGrafico();
      },
      error: (err) => {
        console.error("Error al cargar tiempos de cobranza:", err);
        this.finalizarCargaGrafico();
      }
    });
  }
  cargarParetoMotivos() {
    if (!this.directorioService.getParetoMotivos)
      return;
    this.iniciarCargaGrafico();
    const codCob = this.codigoCoberturaSeleccionada !== "TODAS" ? this.codigoCoberturaSeleccionada : void 0;
    const tipoDoc = this.tipoDocSeleccionado !== "TODOS" ? this.tipoDocSeleccionado : void 0;
    this.directorioService.getParetoMotivos(codCob, tipoDoc, this.fechaDesde, this.fechaHasta).subscribe({
      next: (datasets) => {
        if (!datasets || datasets.length < 2 || !datasets[0]?.puntos?.length) {
          this.motivosChartData = {
            labels: [],
            datasets: [
              {
                label: "Refacturado ($)",
                data: [],
                backgroundColor: "#2563eb",
                borderColor: "#1d4ed8",
                borderWidth: 1,
                borderRadius: 4
              },
              {
                label: "P\xE9rdida ($)",
                data: [],
                backgroundColor: "#dc2626",
                borderColor: "#b91c1c",
                borderWidth: 1,
                borderRadius: 4
              }
            ]
          };
          this.finalizarCargaGrafico();
          return;
        }
        const labels = datasets[0].puntos.map((p) => p.etiqueta);
        this.motivosChartData = {
          labels,
          datasets: [
            {
              label: "Refacturado ($)",
              data: datasets[0].puntos.map((p) => Number(p.valor)),
              backgroundColor: "#2563eb",
              borderColor: "#1d4ed8",
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: "P\xE9rdida ($)",
              data: datasets[1].puntos.map((p) => Number(p.valor)),
              backgroundColor: "#dc2626",
              borderColor: "#b91c1c",
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        };
        this.finalizarCargaGrafico();
      },
      error: (err) => {
        console.error("Error al cargar pareto de motivos:", err);
        this.motivosChartData = { labels: [], datasets: [] };
        this.finalizarCargaGrafico();
      }
    });
  }
  // ---------------------------------------------------------------------------
  // Cuenta Corriente a 3 Niveles
  // ---------------------------------------------------------------------------
  cargarCuentaCorriente() {
    if (!this.directorioService.getCuentaCorrienteTresNiveles)
      return;
    this.cargandoCuentaCorriente = true;
    const financiador = this.codigoCoberturaSeleccionada !== "TODAS" ? this.codigoCoberturaSeleccionada : void 0;
    this.directorioService.getCuentaCorrienteTresNiveles(financiador).subscribe({
      next: (data) => {
        this.cuentaCorrienteDatos = (data || []).map((f) => __spreadProps(__spreadValues({}, f), {
          expanded: false,
          periodos: (f.periodos || []).map((p) => __spreadProps(__spreadValues({}, p), {
            expanded: false
          }))
        }));
        this.cargandoCuentaCorriente = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar cuenta corriente:", err);
        this.cargandoCuentaCorriente = false;
        this.cdr.markForCheck();
      }
    });
  }
  toggleFinanciador(f) {
    f.expanded = !f.expanded;
  }
  togglePeriodo(p) {
    p.expanded = !p.expanded;
  }
  toggleFactura(fc) {
    fc.expanded = !fc.expanded;
  }
  expandirTodosCuentaCorriente(expandir) {
    this.cuentaCorrienteDatos.forEach((f) => {
      f.expanded = expandir;
      f.periodos?.forEach((p) => {
        p.expanded = expandir;
        p.comprobantes?.forEach((fc) => fc.expanded = expandir);
      });
    });
  }
  obtenerBadgeClase(tipo) {
    if (!tipo)
      return "badge-fc";
    const t = tipo.trim().toUpperCase();
    if (t.startsWith("FC") || t.startsWith("FAC"))
      return "badge-fc";
    if (t.startsWith("NC"))
      return "badge-nc";
    if (t.startsWith("ND"))
      return "badge-nd";
    if (t.startsWith("RC") || t.startsWith("REC"))
      return "badge-rc";
    return "badge-fc";
  }
  trackByFinanciador(index, item) {
    return item.financiador;
  }
  trackByPeriodo(index, item) {
    return item.periodo;
  }
  trackByComprobante(index, item) {
    return item.comprobante;
  }
  // ---------------------------------------------------------------------------
  // Matriz Anual de Recaudación
  // ---------------------------------------------------------------------------
  cargarMatrizRecaudacion(anio) {
    if (!this.directorioService.getMatrizRecaudacion)
      return;
    this.cargandoMatriz = true;
    const anioConsulta = anio ?? this.matrizRecaudacion?.anioSeleccionado;
    const financiador = this.codigoCoberturaSeleccionada !== "TODAS" ? this.codigoCoberturaSeleccionada : void 0;
    this.directorioService.getMatrizRecaudacion(anioConsulta, financiador).subscribe({
      next: (data) => {
        if (data && financiador) {
          const cobObj = this.coberturas.find((c) => c.codigo === financiador);
          const normalizar = (txt) => (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
          const fNorm = normalizar(financiador);
          const nomFiltroNorm = normalizar(cobObj ? cobObj.nombre : "");
          const palabrasFiltro = nomFiltroNorm.split(" ").filter((w) => w.length > 2);
          const filasFiltradas = (data.filas || []).filter((f) => {
            const rowFinNorm = normalizar(f.financiador || "");
            if (!rowFinNorm)
              return false;
            if (rowFinNorm.includes(fNorm) || nomFiltroNorm && (rowFinNorm.includes(nomFiltroNorm) || nomFiltroNorm.includes(rowFinNorm))) {
              return true;
            }
            if (palabrasFiltro.length > 0 && palabrasFiltro.every((palabra) => rowFinNorm.includes(palabra))) {
              return true;
            }
            return false;
          });
          const totalesMes = new Array(12).fill(0);
          let granTotal = 0;
          for (const f of filasFiltradas) {
            granTotal += f.totalAnual || 0;
            for (let i = 0; i < 12; i++) {
              totalesMes[i] += f.meses?.[i] || 0;
            }
          }
          data = __spreadProps(__spreadValues({}, data), {
            filas: filasFiltradas,
            totalesMes,
            granTotal
          });
        }
        this.matrizRecaudacion = data;
        this.cargandoMatriz = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar matriz de recaudaci\xF3n:", err);
        this.cargandoMatriz = false;
        this.cdr.markForCheck();
      }
    });
  }
  onAnioMatrizChange(nuevoAnio) {
    const anioNum = Number(nuevoAnio);
    if (anioNum) {
      this.cargarMatrizRecaudacion(anioNum);
    }
  }
  trackByMes(index, item) {
    return index;
  }
  trackByFinanciadorFila(index, item) {
    return item.financiador;
  }
  // ---------------------------------------------------------------------------
  // Detalle y Trazabilidad (Árbol Encadenado)
  // ---------------------------------------------------------------------------
  cargarTrazabilidad() {
    if (!this.directorioService.getTrazabilidad)
      return;
    this.cargandoTrazabilidad = true;
    const financiador = this.codigoCoberturaSeleccionada !== "TODAS" ? this.codigoCoberturaSeleccionada : void 0;
    this.directorioService.getTrazabilidad(financiador).subscribe({
      next: (data) => {
        this.trazabilidadDatos = (data || []).map((c) => __spreadProps(__spreadValues({}, c), {
          expanded: false
        }));
        this.cargandoTrazabilidad = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar trazabilidad:", err);
        this.cargandoTrazabilidad = false;
        this.cdr.markForCheck();
      }
    });
  }
  toggleCadena(cadena) {
    cadena.expanded = !cadena.expanded;
  }
  trackByCadena(index, item) {
    return item.idPrestacion;
  }
  trackByEvento(index, item) {
    return item.comprobante;
  }
  obtenerClaseNodo(tipo) {
    if (!tipo)
      return "bg-primary";
    const t = tipo.trim().toUpperCase();
    if (t.startsWith("FC") || t.startsWith("FAC"))
      return "bg-primary";
    if (t.startsWith("NC"))
      return "bg-danger";
    if (t.startsWith("ND"))
      return "bg-warning";
    if (t.startsWith("RC") || t.startsWith("REC") || t.startsWith("OP"))
      return "bg-success";
    return "bg-primary";
  }
  obtenerClaseMonto(tipo) {
    if (!tipo)
      return "color-facturado";
    const t = tipo.trim().toUpperCase();
    if (t.startsWith("FC") || t.startsWith("FAC"))
      return "color-facturado";
    if (t.startsWith("NC"))
      return "color-aceptado";
    if (t.startsWith("ND"))
      return "color-refacturado";
    if (t.startsWith("RC") || t.startsWith("REC"))
      return "color-cobranza";
    return "color-facturado";
  }
  // ---------------------------------------------------------------------------
  // Bucles de Insistencia
  // ---------------------------------------------------------------------------
  cargarBucles() {
    if (!this.directorioService.getBuclesInsistencia)
      return;
    this.cargandoBucles = true;
    const financiador = this.codigoCoberturaSeleccionada !== "TODAS" ? this.codigoCoberturaSeleccionada : void 0;
    this.directorioService.getBuclesInsistencia(financiador).subscribe({
      next: (data) => {
        this.buclesDatos = (data || []).map((c) => __spreadProps(__spreadValues({}, c), {
          expanded: false
        }));
        this.cargandoBucles = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar bucles de insistencia:", err);
        this.cargandoBucles = false;
        this.cdr.markForCheck();
      }
    });
  }
  // ---------------------------------------------------------------------------
  // Desempeño Operativo a 3 Niveles (Analistas, Médicos, Operadores)
  // ---------------------------------------------------------------------------
  cargarDesempenoOperativo() {
    if (!this.directorioService.getDesempenoGlobal)
      return;
    this.cargandoAnalistas = true;
    this.cargandoMedicos = true;
    this.cargandoOperadores = true;
    const periodo = this.fechaDesde && this.fechaHasta ? this.fechaDesde.substring(0, 7) : void 0;
    this.directorioService.getDesempenoGlobal(periodo).subscribe({
      next: (data) => {
        this.analistasDatos = (data?.analistas || []).map((a) => __spreadProps(__spreadValues({}, a), {
          expanded: false,
          motivos: (a.motivos || []).map((m) => __spreadProps(__spreadValues({}, m), {
            expanded: false
          }))
        }));
        this.medicosDatos = (data?.medicos || []).map((med) => __spreadProps(__spreadValues({}, med), {
          expanded: false,
          motivos: (med.motivos || []).map((m) => __spreadProps(__spreadValues({}, m), {
            expanded: false
          }))
        }));
        this.operadoresDatos = (data?.operadores || []).map((op) => __spreadProps(__spreadValues({}, op), {
          expanded: false,
          motivos: (op.motivos || []).map((m) => __spreadProps(__spreadValues({}, m), {
            expanded: false
          }))
        }));
        this.cargandoAnalistas = false;
        this.cargandoMedicos = false;
        this.cargandoOperadores = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error al cargar desempe\xF1o operativo global:", err);
        this.cargandoAnalistas = false;
        this.cargandoMedicos = false;
        this.cargandoOperadores = false;
        this.cdr.markForCheck();
      }
    });
  }
  toggleAnalista(analista) {
    analista.expanded = !analista.expanded;
  }
  ordenarAnalistas(columna) {
    if (this.columnaOrdenAnalista === columna) {
      this.direccionOrdenAnalista = this.direccionOrdenAnalista === "asc" ? "desc" : "asc";
    } else {
      this.columnaOrdenAnalista = columna;
      this.direccionOrdenAnalista = columna === "analista" ? "asc" : "desc";
    }
    const factor = this.direccionOrdenAnalista === "asc" ? 1 : -1;
    this.analistasDatos.sort((a, b) => {
      switch (columna) {
        case "analista":
          return (a.analista || "").localeCompare(b.analista || "") * factor;
        case "documentos":
          return ((a.cantidadRegistros || 0) - (b.cantidadRegistros || 0)) * factor;
        case "aceptados":
          return ((a.debitosAceptados || 0) - (b.debitosAceptados || 0)) * factor;
        case "refacturados":
          return ((a.debitosRefacturados || 0) - (b.debitosRefacturados || 0)) * factor;
        case "ticket":
          return ((a.ticketPromedio || 0) - (b.ticketPromedio || 0)) * factor;
        case "atencion":
          return ((a.porcentajeAmb ?? 100) - (b.porcentajeAmb ?? 100)) * factor;
        case "recupero":
          return ((a.tasaRecupero || 0) - (b.tasaRecupero || 0)) * factor;
        default:
          return 0;
      }
    });
  }
  toggleMedico(medico) {
    medico.expanded = !medico.expanded;
  }
  toggleOperador(operador) {
    operador.expanded = !operador.expanded;
  }
  toggleMotivo(motivo) {
    motivo.expanded = !motivo.expanded;
  }
  trackByAnalista(index, item) {
    return item.analista;
  }
  trackByMedico(index, item) {
    return item.medico;
  }
  trackByOperador(index, item) {
    return item.operador;
  }
  trackByMotivo(index, item) {
    return item.motivo;
  }
  trackByFinanciadorAnalista(index, item) {
    return item.financiador;
  }
  static \u0275fac = function DirectorioDashboardComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DirectorioDashboardComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DirectorioDashboardComponent, selectors: [["app-directorio-dashboard"]], decls: 427, vars: 116, consts: [[1, "directorio-container"], [1, "directorio-header"], [1, "header-titles"], [1, "main-title"], [1, "subtitle"], ["aria-label", "Sectores del Tablero", 1, "directorio-tab-strip"], ["type", "button", 1, "tab-strip-item", 3, "click"], [1, "tab-strip-icon"], [1, "tab-strip-text"], [1, "filter-card"], [1, "filter-group"], ["for", "select-cobertura"], ["id", "select-cobertura", 1, "form-control", "select-custom", 3, "ngModelChange", "change", "ngModel"], ["value", "TODAS"], [3, "value", 4, "ngFor", "ngForOf"], ["for", "select-tipo-doc"], ["id", "select-tipo-doc", 1, "form-control", "select-custom", 3, "ngModelChange", "change", "ngModel"], ["value", "TODOS"], ["for", "fecha-desde"], ["type", "date", "id", "fecha-desde", 1, "form-control", 3, "ngModelChange", "change", "ngModel"], ["for", "fecha-hasta"], ["type", "date", "id", "fecha-hasta", 1, "form-control", 3, "ngModelChange", "change", "ngModel"], [1, "filter-actions"], ["type", "button", "title", "Aplicar filtros de b\xFAsqueda", 1, "btn", "btn-primary", 3, "click"], [1, "icon"], ["type", "button", "title", "Ver mes anterior manteniendo filtros", 1, "btn", "btn-secondary", 3, "click"], [1, "dashboard-tab-pane", 3, "hidden"], [1, "kpi-grid", "kpi-grid--six"], [1, "kpi-card", "card-facturacion-fc"], [1, "kpi-header"], [1, "kpi-title"], [1, "kpi-value", "kpi-val-fc"], [4, "ngIf"], ["class", "skeleton-text", 4, "ngIf"], [1, "kpi-footer-simple"], [1, "kpi-desc"], [1, "kpi-card", "card-incrementos-nd"], [1, "kpi-value", "kpi-val-nd"], [1, "kpi-card", "card-debitos-nc"], [1, "kpi-value", "kpi-val-nc"], [1, "kpi-card", "card-refacturacion-nd"], [1, "kpi-value", "kpi-val-ref"], [1, "kpi-card", "card-cobranzas-rc"], [1, "kpi-value", "kpi-val-rc"], [1, "kpi-card", "card-saldo-real"], [1, "kpi-value", "kpi-val-saldo"], [1, "graficos-section"], [1, "graficos-grid"], [1, "grafico-card", "grafico-card--wide"], [1, "grafico-card-header"], [1, "grafico-title-group"], [1, "grafico-icon"], [1, "grafico-title"], [1, "grafico-subtitle"], [1, "header-badge-container"], ["title", "Universo total de comprobantes \xEDntegro y mapeado al 100%", 1, "badge-cabeceras"], [1, "badge-dot"], [1, "grafico-body"], ["class", "grafico-loading", 4, "ngIf"], ["class", "grafico-empty", 4, "ngIf"], ["id", "chart-evolucion", "baseChart", "", 3, "type", "data", "options", 4, "ngIf"], [1, "grafico-card"], ["id", "chart-distribucion", "baseChart", "", 3, "type", "data", "options", 4, "ngIf"], [1, "grid-section", "balance-financiero-section"], [1, "section-card"], [1, "section-card-header"], [1, "section-title"], [1, "section-subtitle"], ["class", "loading-state", 4, "ngIf"], ["class", "empty-state", 4, "ngIf"], ["class", "table-responsive", 4, "ngIf"], [1, "grid-section"], [1, "grid-tools"], ["type", "button", 1, "btn", "btn-outline-sm", 3, "click"], [1, "tiempos-cobranza-section"], [1, "tiempos-top-grid"], [1, "tiempos-box", "kpi-dso-box"], [1, "kpi-dso-title"], [1, "kpi-dso-main"], [1, "kpi-dso-val"], [1, "kpi-dso-sub"], [1, "kpi-dso-divider"], [1, "kpi-dso-footer"], [1, "kpi-dso-col"], [1, "kpi-dso-col-lbl"], [1, "kpi-dso-col-val", "text-green"], [1, "kpi-dso-col-val", "text-red"], [1, "tiempos-box", "grafico-aging-box"], [1, "tiempos-box-header"], [1, "tiempos-box-icon"], ["viewBox", "0 0 20 20", "fill", "currentColor"], ["d", "M2 10a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM14 8a1 1 0 011-1h2a1 1 0 011 1v8a1 1 0 01-1 1h-2a1 1 0 01-1-1V8z"], [1, "tiempos-box-title"], [1, "aging-canvas-container"], ["id", "chart-aging", "baseChart", "", 3, "type", "data", "options", 4, "ngIf"], [1, "tiempos-box", "tabla-aging-box"], ["viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2"], ["stroke-linecap", "round", "stroke-linejoin", "round", "d", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"], [1, "tabla-aging-wrap"], [1, "tabla-aging-exact"], [2, "text-align", "left"], [2, "text-align", "center"], [2, "text-align", "right"], [4, "ngFor", "ngForOf"], [1, "dashboard-tab-pane", "dashboard-tab-pane--matriz", 3, "hidden"], [1, "section-card", "section-card--matriz"], [1, "grid-tools", "matriz-tools"], ["for", "select-anio-matriz", 1, "matriz-select-label"], ["id", "select-anio-matriz", 1, "form-control", "select-custom", "select-anio", 3, "ngModelChange", "ngModel"], ["class", "table-responsive matriz-table-responsive", 4, "ngIf"], [1, "motivos-info-alert"], [1, "motivos-info-icon"], [1, "motivos-info-text"], [1, "contadores-motivos-grid"], [1, "card-contador-motivo", "card-debitado-nc"], [1, "contador-header"], [1, "contador-title"], [1, "contador-value"], [1, "contador-footer"], [1, "card-contador-motivo", "card-debito-aceptado"], [1, "card-contador-motivo", "card-total-refacturado"], [1, "card-contador-motivo", "card-motivos-identificados"], [1, "section-header"], [1, "graficos-grid", "graficos-grid--single"], [1, "grafico-card", "grafico-card--wide", "grafico-card--fullwidth"], [1, "grafico-body", "grafico-body--tall"], ["id", "chart-motivos", "baseChart", "", 3, "type", "data", "options", 4, "ngIf"], [1, "analytics-section"], ["class", "total-debitado-badge", 4, "ngIf"], ["class", "chart-layout", 4, "ngIf"], ["class", "badge-analistas-activos", 4, "ngIf"], [3, "value"], [1, "skeleton-text"], [1, "grafico-loading"], [1, "spinner-icon"], [1, "grafico-empty"], ["id", "chart-evolucion", "baseChart", "", 3, "type", "data", "options"], ["id", "chart-distribucion", "baseChart", "", 3, "type", "data", "options"], [1, "loading-state"], [1, "spinner"], [1, "empty-state"], [1, "empty-icon"], [1, "table-responsive"], [1, "table-sanatorial", "table-balance"], [1, "th-financiador", "text-left"], [1, "text-right"], [1, "text-right", "th-saldo"], ["class", "tr-balance-row", 4, "ngFor", "ngForOf"], [1, "tr-total-balance"], [1, "text-left", "font-bold"], [1, "text-right", "font-bold"], [1, "text-right", "font-bold", "td-debito"], [1, "text-right", "font-bold", "td-refacturado"], [1, "text-right", "font-bold", "td-cobrado"], [1, "text-right", "font-bold", "td-saldo-total"], [1, "tr-balance-row"], [1, "td-financiador", "text-left", "font-semibold"], [1, "text-right", "td-debito"], [1, "text-right", "td-refacturado"], [1, "text-right", "td-cobrado"], [1, "text-right", "td-saldo", "font-bold"], [1, "table-sanatorial"], [1, "th-tree"], [1, "text-center"], [1, "tr-financiador", 3, "click"], [1, "td-tree-node", "td-financiador"], ["type", "button", 1, "btn-toggle-expand"], [1, "financiador-icon"], [1, "financiador-nombre"], [1, "text-center", "text-muted"], [1, "text-right", "font-weight-bold", "color-facturado"], [1, "text-right", "color-incremento"], [1, "text-right", "color-aceptado"], [1, "text-right", "color-refacturado"], [1, "text-right", "color-cobranza"], [1, "text-right", "font-weight-bold", 3, "ngClass"], [1, "tr-periodo", 3, "click"], [1, "td-tree-node", "td-periodo"], ["type", "button", 1, "btn-toggle-expand", "btn-toggle-sm"], [1, "periodo-icon"], [1, "periodo-tag"], [1, "text-right", "color-facturado"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "tr-factura", 3, "click"], [1, "td-tree-node", "td-factura-node"], ["type", "button", "class", "btn-toggle-expand btn-toggle-xs", 3, "is-expanded", "click", 4, "ngIf"], ["class", "tree-bullet", 4, "ngIf"], [1, "badge-tipo-doc", 3, "ngClass"], [1, "comprobante-numero"], [1, "text-center", "text-fecha"], ["type", "button", 1, "btn-toggle-expand", "btn-toggle-xs", 3, "click"], [1, "tree-bullet"], ["class", "tr-comprobante-hijo", 4, "ngFor", "ngForOf"], [1, "tr-comprobante-hijo"], [1, "td-tree-node", "td-comprobante-hijo-node"], [1, "tree-branch"], ["id", "chart-aging", "baseChart", "", 3, "type", "data", "options"], [1, "td-aging-rango"], [1, "td-aging-comprobantes"], [1, "td-aging-saldo"], [1, "td-aging-porcentaje"], ["colspan", "4", 2, "text-align", "center", "padding", "24px", "color", "#94a3b8"], [1, "table-responsive", "matriz-table-responsive"], [1, "table-sanatorial", "table-bordered", "table-matriz"], [1, "th-financiador"], [1, "th-mes"], [1, "th-total-anual"], ["class", "tr-matriz-fila", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "tr-matriz-total"], [1, "td-matriz-financiador", "font-weight-bold"], ["class", "td-mes-total font-weight-bold", 3, "valor-cero", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "td-gran-total", "font-weight-bold"], [1, "tr-matriz-fila"], ["class", "td-mes-valor", 3, "valor-cero", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "td-total-anual", "font-weight-bold"], [1, "td-mes-valor"], [1, "td-mes-total", "font-weight-bold"], ["id", "chart-motivos", "baseChart", "", 3, "type", "data", "options"], [1, "total-debitado-badge"], [1, "chart-layout"], [1, "donut-container"], ["viewBox", "0 0 200 200", 1, "donut-svg"], ["class", "donut-slice", 3, "slice-active", "mouseenter", "mouseleave", "click", 4, "ngFor", "ngForOf"], ["cx", "100", "cy", "100", "r", "50", 1, "donut-center-circle"], ["x", "100", "y", "93", "text-anchor", "middle", 1, "donut-center-title"], ["x", "100", "y", "112", "text-anchor", "middle", 1, "donut-center-subtitle"], [1, "donut-hint"], [1, "legend-container"], [1, "legend-header"], [1, "legend-list"], ["class", "legend-item", 3, "legend-hover", "title", "mouseenter", "mouseleave", "click", 4, "ngFor", "ngForOf"], [1, "donut-slice", 3, "mouseenter", "mouseleave", "click"], [1, "legend-item", 3, "mouseenter", "mouseleave", "click", "title"], [1, "legend-col-motivo"], [1, "color-dot"], [1, "motivo-nombre"], [1, "casos-badge"], [1, "legend-col-monto"], [1, "legend-col-porc"], [1, "mini-bar-wrapper"], [1, "mini-bar-fill"], [1, "porc-text"], [1, "legend-col-action"], ["type", "button", 1, "btn-drilldown", 3, "click"], [1, "badge-analistas-activos"], [1, "table-sanatorial", "table-bordered", "table-analistas"], [1, "th-btn-col"], [1, "th-analista", "sortable-col", 3, "click"], [1, "sort-indicator"], [1, "text-center", "th-casos", "sortable-col", 3, "click"], [1, "text-right", "th-monto", "sortable-col", 3, "click"], [1, "text-center", "th-atencion", "sortable-col", 3, "click"], [1, "text-right", "th-tasa", "sortable-col", 3, "click"], [1, "tr-analista", 3, "click"], [1, "text-center", "td-btn-box"], ["type", "button", 1, "btn-toggle-box", 3, "click"], [1, "td-tree-node", "td-analista"], [1, "analista-nombre"], [1, "text-center", "font-weight-bold"], [1, "badge-docs-analista"], [1, "text-right", "font-weight-bold", "color-aceptado"], [1, "text-right", "font-weight-bold", "color-refacturado"], [1, "text-right", "font-weight-bold", "color-ticket-promedio"], [1, "badge-atencion"], [1, "badge-recupero"], [1, "tr-sub-header", "tr-sub-header-motivo"], ["colspan", "2", 1, "td-sub-header-title"], [1, "text-center", "td-sub-header-col"], [1, "text-right", "td-sub-header-col"], [1, "tr-motivo", 3, "click"], ["colspan", "2", 1, "td-tree-node", "td-motivo"], [1, "motivo-icon"], [1, "motivo-tag"], [1, "badge-count"], ["class", "badge-atencion badge-atencion-sm", 4, "ngIf"], ["class", "text-muted", 4, "ngIf"], [1, "badge-recupero", "badge-recupero-sm"], [1, "badge-atencion", "badge-atencion-sm"], [1, "text-muted"], [1, "tr-sub-header", "tr-sub-header-financiador"], ["colspan", "2", 1, "td-sub-header-sub-title"], ["colspan", "4", 1, "text-right", "td-sub-header-col"], ["class", "tr-financiador-sub", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "tr-financiador-sub"], ["colspan", "2", 1, "td-tree-node", "td-financiador-sub-item"], [1, "financiador-nombre-sub"], ["colspan", "4", 1, "text-right", "font-weight-bold", "color-facturado"], [1, "table-sanatorial", "table-bordered"], [1, "text-center", 2, "width", "45px"], [1, "tr-parent-nivel1", 3, "click"], ["type", "button", 1, "btn-toggle-expand", 3, "click"], [1, "text-muted", 2, "font-size", "0.78rem"], [1, "badge-medico", 2, "font-size", "0.8rem", "color", "#475569"], [1, "text-right", "color-facturado", "font-weight-bold"], [1, "text-right", "color-aceptado", "font-weight-bold"], ["class", "tr-child-nivel2", 4, "ngIf"], [1, "tr-child-nivel2"], ["colspan", "6", 1, "td-child-container"], [1, "chain-wrapper"], [1, "chain-header-info"], [1, "chain-badge-expediente"], ["class", "chain-badge-medico", 4, "ngIf"], [1, "chain-total-eventos"], [1, "chain-timeline"], ["class", "chain-step", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "chain-badge-medico"], [1, "chain-step"], [1, "chain-node", 3, "ngClass"], [1, "chain-connector"], [1, "chain-card"], [1, "chain-card-header"], [1, "chain-comprobante"], [1, "chain-fecha"], [1, "chain-card-body"], [1, "chain-desc"], [1, "chain-monto", 3, "ngClass"], ["class", "chain-card-footer", 4, "ngIf"], [1, "chain-card-footer"], [1, "chain-responsable"], [1, "th-analista"], [1, "text-right", "th-casos"], [1, "text-right", "th-monto"], [1, "text-right", "th-tasa"], [1, "tr-analista", "tr-operador", 3, "click"], [1, "analista-icon"], [1, "text-right", "font-weight-bold"], [1, "text-right", "font-weight-bold", "color-ticket"], [1, "td-sub-header-title"], [1, "td-tree-node", "td-motivo"], [1, "td-sub-header-sub-title"], ["colspan", "3", 1, "text-right", "td-sub-header-col"], [1, "td-tree-node", "td-financiador-sub-item"], [1, "text-right", "text-muted"], ["colspan", "3", 1, "text-right", "font-weight-bold", "color-facturado"], [1, "tr-analista", "tr-medico", 3, "click"]], template: function DirectorioDashboardComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "div", 2)(3, "h1", 3);
      \u0275\u0275text(4, "Tablero de Control Financiero");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "p", 4);
      \u0275\u0275text(6, "Monitoreo de facturaci\xF3n, cobranza efectiva, d\xE9bitos aplicados y cadena de refacturaciones por instituci\xF3n m\xE9dica.");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(7, "nav", 5)(8, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_8_listener() {
        return ctx.seleccionarSolapa("tablero");
      });
      \u0275\u0275elementStart(9, "span", 7);
      \u0275\u0275text(10, "\u2601\uFE0F");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(11, "span", 8);
      \u0275\u0275text(12, "Tablero de Control");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(13, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_13_listener() {
        return ctx.seleccionarSolapa("cuenta-corriente");
      });
      \u0275\u0275elementStart(14, "span", 7);
      \u0275\u0275text(15, "\u{1F4C4}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(16, "span", 8);
      \u0275\u0275text(17, "Cuenta Corriente (3 Niveles)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(18, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_18_listener() {
        return ctx.seleccionarSolapa("tiempos-cobranza");
      });
      \u0275\u0275elementStart(19, "span", 7);
      \u0275\u0275text(20, "\u23F3");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(21, "span", 8);
      \u0275\u0275text(22, "Tiempos de Cobranza");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(23, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_23_listener() {
        return ctx.seleccionarSolapa("matriz-cobranzas");
      });
      \u0275\u0275elementStart(24, "span", 7);
      \u0275\u0275text(25, "\u{1F4C5}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(26, "span", 8);
      \u0275\u0275text(27, "Matriz de Cobranzas");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(28, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_28_listener() {
        return ctx.seleccionarSolapa("motivos");
      });
      \u0275\u0275elementStart(29, "span", 7);
      \u0275\u0275text(30, "\u{1F6E1}\uFE0F");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(31, "span", 8);
      \u0275\u0275text(32, "Motivos de D\xE9bito y Refacturaci\xF3n");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(33, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_33_listener() {
        return ctx.seleccionarSolapa("analistas");
      });
      \u0275\u0275elementStart(34, "span", 7);
      \u0275\u0275text(35, "\u{1F464}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(36, "span", 8);
      \u0275\u0275text(37, "Analista de D\xE9bito (3 Niveles)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(38, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_38_listener() {
        return ctx.seleccionarSolapa("bucles");
      });
      \u0275\u0275elementStart(39, "span", 7);
      \u0275\u0275text(40, "\u2B55");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(41, "span", 8);
      \u0275\u0275text(42, "Bucles de Insistencia");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(43, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_43_listener() {
        return ctx.seleccionarSolapa("usuarios-carga");
      });
      \u0275\u0275elementStart(44, "span", 7);
      \u0275\u0275text(45, "\u{1F4C7}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(46, "span", 8);
      \u0275\u0275text(47, "Usuario de Carga (3 Niveles)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(48, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_48_listener() {
        return ctx.seleccionarSolapa("medicos");
      });
      \u0275\u0275elementStart(49, "span", 7);
      \u0275\u0275text(50, "\u{1F468}\u200D\u2695\uFE0F");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(51, "span", 8);
      \u0275\u0275text(52, "Prestadores / M\xE9dicos (3 Niveles)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(53, "button", 6);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_53_listener() {
        return ctx.seleccionarSolapa("trazabilidad");
      });
      \u0275\u0275elementStart(54, "span", 7);
      \u0275\u0275text(55, "\u{1F517}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(56, "span", 8);
      \u0275\u0275text(57, "Detalle y Trazabilidad");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(58, "div", 9)(59, "div", 10)(60, "label", 11);
      \u0275\u0275text(61, "Instituci\xF3n / Cobertura");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(62, "select", 12);
      \u0275\u0275twoWayListener("ngModelChange", function DirectorioDashboardComponent_Template_select_ngModelChange_62_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.codigoCoberturaSeleccionada, $event) || (ctx.codigoCoberturaSeleccionada = $event);
        return $event;
      });
      \u0275\u0275listener("change", function DirectorioDashboardComponent_Template_select_change_62_listener() {
        return ctx.aplicarFiltros();
      });
      \u0275\u0275elementStart(63, "option", 13);
      \u0275\u0275text(64, "-- Todas las Instituciones --");
      \u0275\u0275elementEnd();
      \u0275\u0275template(65, DirectorioDashboardComponent_option_65_Template, 2, 3, "option", 14);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(66, "div", 10)(67, "label", 15);
      \u0275\u0275text(68, "Tipo de Comprobante");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(69, "select", 16);
      \u0275\u0275twoWayListener("ngModelChange", function DirectorioDashboardComponent_Template_select_ngModelChange_69_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.tipoDocSeleccionado, $event) || (ctx.tipoDocSeleccionado = $event);
        return $event;
      });
      \u0275\u0275listener("change", function DirectorioDashboardComponent_Template_select_change_69_listener() {
        return ctx.aplicarFiltros();
      });
      \u0275\u0275elementStart(70, "option", 17);
      \u0275\u0275text(71, "-- Todos los Tipos --");
      \u0275\u0275elementEnd();
      \u0275\u0275template(72, DirectorioDashboardComponent_option_72_Template, 2, 2, "option", 14);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(73, "div", 10)(74, "label", 18);
      \u0275\u0275text(75, "Fecha Desde");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(76, "input", 19);
      \u0275\u0275twoWayListener("ngModelChange", function DirectorioDashboardComponent_Template_input_ngModelChange_76_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.fechaDesde, $event) || (ctx.fechaDesde = $event);
        return $event;
      });
      \u0275\u0275listener("change", function DirectorioDashboardComponent_Template_input_change_76_listener() {
        return ctx.aplicarFiltros();
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(77, "div", 10)(78, "label", 20);
      \u0275\u0275text(79, "Fecha Hasta");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(80, "input", 21);
      \u0275\u0275twoWayListener("ngModelChange", function DirectorioDashboardComponent_Template_input_ngModelChange_80_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.fechaHasta, $event) || (ctx.fechaHasta = $event);
        return $event;
      });
      \u0275\u0275listener("change", function DirectorioDashboardComponent_Template_input_change_80_listener() {
        return ctx.aplicarFiltros();
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(81, "div", 22)(82, "button", 23);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_82_listener() {
        return ctx.aplicarFiltros();
      });
      \u0275\u0275elementStart(83, "span", 24);
      \u0275\u0275text(84, "\u{1F50D}");
      \u0275\u0275elementEnd();
      \u0275\u0275text(85, " Filtrar ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(86, "button", 25);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_86_listener() {
        return ctx.irAlMesAnterior();
      });
      \u0275\u0275elementStart(87, "span", 24);
      \u0275\u0275text(88, "\u21BA");
      \u0275\u0275elementEnd();
      \u0275\u0275text(89, " Mes Anterior ");
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(90, "div", 26)(91, "section", 27)(92, "div", 28)(93, "div", 29)(94, "span", 30);
      \u0275\u0275text(95, "FACTURACI\xD3N ORIGINAL (FC)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(96, "div", 31);
      \u0275\u0275template(97, DirectorioDashboardComponent_span_97_Template, 2, 1, "span", 32)(98, DirectorioDashboardComponent_span_98_Template, 2, 0, "span", 33);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(99, "div", 34)(100, "span", 35);
      \u0275\u0275text(101, "Comprobantes FC emitidos");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(102, "div", 36)(103, "div", 29)(104, "span", 30);
      \u0275\u0275text(105, "INCREMENTOS (ND)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(106, "div", 37);
      \u0275\u0275template(107, DirectorioDashboardComponent_span_107_Template, 2, 1, "span", 32)(108, DirectorioDashboardComponent_span_108_Template, 2, 0, "span", 33);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(109, "div", 34)(110, "span", 35);
      \u0275\u0275text(111, "Ajustes positivos asociados");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(112, "div", 38)(113, "div", 29)(114, "span", 30);
      \u0275\u0275text(115, "D\xC9BITOS RECIBIDOS (NC)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(116, "div", 39);
      \u0275\u0275template(117, DirectorioDashboardComponent_span_117_Template, 2, 1, "span", 32)(118, DirectorioDashboardComponent_span_118_Template, 2, 0, "span", 33);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(119, "div", 34)(120, "span", 35);
      \u0275\u0275text(121, "Total glosas debitadas");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(122, "div", 40)(123, "div", 29)(124, "span", 30);
      \u0275\u0275text(125, "REFACTURACI\xD3N (ND-NC)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(126, "div", 41);
      \u0275\u0275template(127, DirectorioDashboardComponent_span_127_Template, 2, 1, "span", 32)(128, DirectorioDashboardComponent_span_128_Template, 2, 0, "span", 33);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(129, "div", 34)(130, "span", 35);
      \u0275\u0275text(131);
      \u0275\u0275pipe(132, "number");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(133, "div", 42)(134, "div", 29)(135, "span", 30);
      \u0275\u0275text(136, "COBRANZAS (RC)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(137, "div", 43);
      \u0275\u0275template(138, DirectorioDashboardComponent_span_138_Template, 2, 1, "span", 32)(139, DirectorioDashboardComponent_span_139_Template, 2, 0, "span", 33);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(140, "div", 34)(141, "span", 35);
      \u0275\u0275text(142);
      \u0275\u0275pipe(143, "number");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(144, "div", 44)(145, "div", 29)(146, "span", 30);
      \u0275\u0275text(147, "SALDO PENDIENTE REAL");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(148, "div", 45);
      \u0275\u0275template(149, DirectorioDashboardComponent_span_149_Template, 2, 1, "span", 32)(150, DirectorioDashboardComponent_span_150_Template, 2, 0, "span", 33);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(151, "div", 34)(152, "span", 35);
      \u0275\u0275text(153);
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(154, "section", 46)(155, "div", 47)(156, "div", 48)(157, "div", 49)(158, "div", 50)(159, "span", 51);
      \u0275\u0275text(160, "\u{1F4C8}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(161, "div")(162, "h3", 52);
      \u0275\u0275text(163, 'Evoluci\xF3n Mensual (Imputada por Per\xEDodo de Factura Original - Sin "S/P")');
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(164, "p", 53);
      \u0275\u0275text(165, "Facturaci\xF3n FC \xB7 D\xE9bitos Recibidos NC \xB7 Cobranzas RC");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(166, "div", 54)(167, "span", 55)(168, "span", 56);
      \u0275\u0275text(169, "\u25CF");
      \u0275\u0275elementEnd();
      \u0275\u0275text(170, " Cabeceras 100% ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(171, "div", 57);
      \u0275\u0275template(172, DirectorioDashboardComponent_div_172_Template, 4, 0, "div", 58)(173, DirectorioDashboardComponent_div_173_Template, 3, 0, "div", 59)(174, DirectorioDashboardComponent_canvas_174_Template, 1, 3, "canvas", 60);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(175, "div", 61)(176, "div", 49)(177, "div", 50)(178, "span", 51);
      \u0275\u0275text(179, "\u{1F369}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(180, "div")(181, "h3", 52);
      \u0275\u0275text(182, "Distribuci\xF3n de Cartera por Financiador");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(183, "p", 53);
      \u0275\u0275text(184, "Saldo pendiente de cobro (Saldos > $0)");
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(185, "div", 57);
      \u0275\u0275template(186, DirectorioDashboardComponent_div_186_Template, 4, 0, "div", 58)(187, DirectorioDashboardComponent_div_187_Template, 3, 0, "div", 59)(188, DirectorioDashboardComponent_canvas_188_Template, 1, 3, "canvas", 62);
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(189, "section", 63)(190, "div", 64)(191, "div", 65)(192, "div")(193, "h2", 66);
      \u0275\u0275text(194, "Resumen de Cartera y Balance Financiero");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(195, "p", 67);
      \u0275\u0275text(196, "Consolidado por financiador: Facturaci\xF3n, Incrementos, D\xE9bitos, Refacturaciones y Cobranzas");
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(197, DirectorioDashboardComponent_div_197_Template, 4, 0, "div", 68)(198, DirectorioDashboardComponent_div_198_Template, 5, 0, "div", 69)(199, DirectorioDashboardComponent_div_199_Template, 36, 7, "div", 70);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(200, "div", 26)(201, "section", 71)(202, "div", 64)(203, "div", 65)(204, "div")(205, "h2", 66);
      \u0275\u0275text(206, "Cuenta Corriente a 3 Niveles");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(207, "p", 67);
      \u0275\u0275text(208, "Estructura jer\xE1rquica: Financiador \u2794 Per\xEDodo \u2794 Comprobantes detallados con saldos y estados de refacturaci\xF3n.");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(209, "div", 72)(210, "button", 73);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_210_listener() {
        return ctx.expandirTodosCuentaCorriente(true);
      });
      \u0275\u0275text(211, " [+] Expandir Todo ");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(212, "button", 73);
      \u0275\u0275listener("click", function DirectorioDashboardComponent_Template_button_click_212_listener() {
        return ctx.expandirTodosCuentaCorriente(false);
      });
      \u0275\u0275text(213, " [-] Contraer Todo ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(214, DirectorioDashboardComponent_div_214_Template, 4, 0, "div", 68)(215, DirectorioDashboardComponent_div_215_Template, 5, 0, "div", 69)(216, DirectorioDashboardComponent_div_216_Template, 22, 1, "div", 70);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(217, "div", 26)(218, "div", 74)(219, "div", 75)(220, "div", 76)(221, "div")(222, "div", 77);
      \u0275\u0275text(223, "DSO GLOBAL PONDERADO POR MONTO");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(224, "div", 78)(225, "div", 79);
      \u0275\u0275text(226);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(227, "p", 80);
      \u0275\u0275text(228, "D\xEDas promedio ponderados de atraso en cartera de facturas pendientes.");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(229, "div");
      \u0275\u0275element(230, "hr", 81);
      \u0275\u0275elementStart(231, "div", 82)(232, "div", 83)(233, "span", 84);
      \u0275\u0275text(234, "Cobro Real Promedio:");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(235, "span", 85);
      \u0275\u0275text(236);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(237, "div", 83)(238, "span", 84);
      \u0275\u0275text(239, "Saldo Total en Mora:");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(240, "span", 86);
      \u0275\u0275text(241);
      \u0275\u0275pipe(242, "number");
      \u0275\u0275elementEnd()()()()();
      \u0275\u0275elementStart(243, "div", 87)(244, "div", 88)(245, "span", 89);
      \u0275\u0275namespaceSVG();
      \u0275\u0275elementStart(246, "svg", 90);
      \u0275\u0275element(247, "path", 91);
      \u0275\u0275elementEnd()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275elementStart(248, "h3", 92);
      \u0275\u0275text(249, "Distribuci\xF3n de Deuda por Rangos de Vencimiento (Aging)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(250, "div", 93);
      \u0275\u0275template(251, DirectorioDashboardComponent_div_251_Template, 4, 0, "div", 58)(252, DirectorioDashboardComponent_div_252_Template, 3, 0, "div", 59)(253, DirectorioDashboardComponent_canvas_253_Template, 1, 3, "canvas", 94);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(254, "div", 95)(255, "div", 88)(256, "span", 89);
      \u0275\u0275namespaceSVG();
      \u0275\u0275elementStart(257, "svg", 96);
      \u0275\u0275element(258, "path", 97);
      \u0275\u0275elementEnd()();
      \u0275\u0275namespaceHTML();
      \u0275\u0275elementStart(259, "h3", 92);
      \u0275\u0275text(260, "Detalle de Antig\xFCedad de Deuda por Rango");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(261, "div", 98)(262, "table", 99)(263, "thead")(264, "tr")(265, "th", 100);
      \u0275\u0275text(266, "RANGO DE ANTIG\xDCEDAD");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(267, "th", 101);
      \u0275\u0275text(268, "CANTIDAD DE COMPROBANTES");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(269, "th", 102);
      \u0275\u0275text(270, "SALDO EN MORA");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(271, "th", 102);
      \u0275\u0275text(272, "% DE CARTERA MOROSA");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(273, "tbody");
      \u0275\u0275template(274, DirectorioDashboardComponent_tr_274_Template, 12, 16, "tr", 103)(275, DirectorioDashboardComponent_tr_275_Template, 3, 0, "tr", 32);
      \u0275\u0275elementEnd()()()()()();
      \u0275\u0275elementStart(276, "div", 104)(277, "section", 71)(278, "div", 105)(279, "div", 65)(280, "div")(281, "h2", 66);
      \u0275\u0275text(282, "\u{1F9FE} Matriz Anual de Recaudaci\xF3n por Fecha Real de Recibo (RC)");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(283, "p", 67);
      \u0275\u0275text(284, "Imputaci\xF3n basada estrictamente en la fecha real de cobro (cabeceras.fecha)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(285, "div", 106)(286, "label", 107);
      \u0275\u0275text(287, "A\xF1o Calendario:");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(288, "select", 108);
      \u0275\u0275listener("ngModelChange", function DirectorioDashboardComponent_Template_select_ngModelChange_288_listener($event) {
        return ctx.onAnioMatrizChange($event);
      });
      \u0275\u0275template(289, DirectorioDashboardComponent_option_289_Template, 2, 2, "option", 14);
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(290, DirectorioDashboardComponent_div_290_Template, 4, 0, "div", 68)(291, DirectorioDashboardComponent_div_291_Template, 5, 0, "div", 69)(292, DirectorioDashboardComponent_div_292_Template, 42, 9, "div", 109);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(293, "div", 26)(294, "div", 110)(295, "span", 111);
      \u0275\u0275text(296, "\u2139\uFE0F");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(297, "span", 112)(298, "strong");
      \u0275\u0275text(299, "Motivos de D\xE9bito y Refacturaci\xF3n (2 Niveles):");
      \u0275\u0275elementEnd();
      \u0275\u0275text(300, " Desglose por resoluci\xF3n y refacturaci\xF3n. Todos los filtros aplican. ");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(301, "section", 113)(302, "div", 114)(303, "div", 115)(304, "span", 116);
      \u0275\u0275text(305, "TOTAL DEBITADO EN NC");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(306, "div", 117);
      \u0275\u0275text(307);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(308, "div", 118);
      \u0275\u0275text(309);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(310, "div", 119)(311, "div", 115)(312, "span", 116);
      \u0275\u0275text(313, "D\xC9BITO ACEPTADO (P\xC9RDIDA)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(314, "div", 117);
      \u0275\u0275text(315);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(316, "div", 118);
      \u0275\u0275text(317);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(318, "div", 120)(319, "div", 115)(320, "span", 116);
      \u0275\u0275text(321, "TOTAL REFACTURADO (DISPUTADO)");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(322, "div", 117);
      \u0275\u0275text(323);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(324, "div", 118);
      \u0275\u0275text(325);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(326, "div", 121)(327, "div", 115)(328, "span", 116);
      \u0275\u0275text(329, "MOTIVOS IDENTIFICADOS");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(330, "div", 117);
      \u0275\u0275text(331);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(332, "div", 118);
      \u0275\u0275text(333, " Glosas distintas ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(334, "section", 46)(335, "div", 122)(336, "h2", 66);
      \u0275\u0275text(337, "\u{1F6E1}\uFE0F Motivos de D\xE9bito y Refacturaci\xF3n (Pareto)");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(338, "p", 67);
      \u0275\u0275text(339, "Top 10 motivos de rechazo \xB7 Monto refacturado vs. P\xE9rdida asumida definitivamente");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(340, "div", 123)(341, "div", 124)(342, "div", 49)(343, "span", 51);
      \u0275\u0275text(344, "\u{1F4CB}");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(345, "div")(346, "h3", 52);
      \u0275\u0275text(347, "Pareto de Glosas");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(348, "p", 53);
      \u0275\u0275text(349, "Top 10 motivos \xB7 Refacturado vs. P\xE9rdida asumida");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(350, "div", 125);
      \u0275\u0275template(351, DirectorioDashboardComponent_div_351_Template, 4, 0, "div", 58)(352, DirectorioDashboardComponent_div_352_Template, 3, 0, "div", 59)(353, DirectorioDashboardComponent_canvas_353_Template, 1, 3, "canvas", 126);
      \u0275\u0275elementEnd()()()();
      \u0275\u0275elementStart(354, "section", 127)(355, "div", 64)(356, "div", 65)(357, "div")(358, "h2", 66);
      \u0275\u0275text(359, "Distribuci\xF3n de D\xE9bitos por Causa / Motivo");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(360, "p", 67);
      \u0275\u0275text(361, "Haga clic en cualquier porci\xF3n del anillo o motivo de la lista para acceder al detalle con los comentarios de los operadores. ");
      \u0275\u0275elementEnd()();
      \u0275\u0275template(362, DirectorioDashboardComponent_div_362_Template, 4, 1, "div", 128);
      \u0275\u0275elementEnd();
      \u0275\u0275template(363, DirectorioDashboardComponent_div_363_Template, 4, 0, "div", 68)(364, DirectorioDashboardComponent_div_364_Template, 5, 0, "div", 69)(365, DirectorioDashboardComponent_div_365_Template, 24, 4, "div", 129);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(366, "div", 26)(367, "section", 71)(368, "div", 64)(369, "div", 65)(370, "div")(371, "h2", 66);
      \u0275\u0275text(372, "\u{1F464} Desempe\xF1o y Gesti\xF3n por Analista de D\xE9bito (3 Niveles)");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(373, "p", 67);
      \u0275\u0275text(374, " Nivel 1: Analista > Nivel 2: Motivos de D\xE9bito > Nivel 3: Instituci\xF3n / Financiador ");
      \u0275\u0275elementEnd()();
      \u0275\u0275template(375, DirectorioDashboardComponent_div_375_Template, 2, 1, "div", 130);
      \u0275\u0275elementEnd();
      \u0275\u0275template(376, DirectorioDashboardComponent_div_376_Template, 4, 0, "div", 68)(377, DirectorioDashboardComponent_div_377_Template, 5, 0, "div", 69)(378, DirectorioDashboardComponent_div_378_Template, 36, 9, "div", 70);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(379, "div", 26)(380, "section", 71)(381, "div", 64)(382, "div", 65)(383, "div")(384, "h2", 66);
      \u0275\u0275text(385, "\u2B55 Auditor\xEDa de Bucles de Insistencia");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(386, "p", 67);
      \u0275\u0275text(387, "Prestaciones cr\xEDticas con 2 o m\xE1s d\xE9bitos recibidos (NC) tras intentos de refacturaci\xF3n.");
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(388, DirectorioDashboardComponent_div_388_Template, 4, 0, "div", 68)(389, DirectorioDashboardComponent_div_389_Template, 5, 0, "div", 69)(390, DirectorioDashboardComponent_div_390_Template, 17, 2, "div", 70);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(391, "div", 26)(392, "section", 71)(393, "div", 64)(394, "div", 65)(395, "div")(396, "h2", 66);
      \u0275\u0275text(397, "\u{1F4C7} Desempe\xF1o por Usuarios de Carga (Operadores)");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(398, "p", 67);
      \u0275\u0275text(399, " Auditor\xEDa de emisi\xF3n original a 3 niveles: Nivel 1 (Operador FC) \u2794 Nivel 2 (Motivo de D\xE9bito) \u2794 Nivel 3 (Financiador Afectado). ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(400, DirectorioDashboardComponent_div_400_Template, 4, 0, "div", 68)(401, DirectorioDashboardComponent_div_401_Template, 5, 0, "div", 69)(402, DirectorioDashboardComponent_div_402_Template, 18, 2, "div", 70);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(403, "div", 26)(404, "section", 71)(405, "div", 64)(406, "div", 65)(407, "div")(408, "h2", 66);
      \u0275\u0275text(409, "\u{1F468}\u200D\u2695\uFE0F Desempe\xF1o por Prestadores / M\xE9dicos");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(410, "p", 67);
      \u0275\u0275text(411, " Auditor\xEDa m\xE9dica a 3 niveles: Nivel 1 (M\xE9dico) \u2794 Nivel 2 (Motivo de D\xE9bito) \u2794 Nivel 3 (Financiador Afectado). ");
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(412, DirectorioDashboardComponent_div_412_Template, 4, 0, "div", 68)(413, DirectorioDashboardComponent_div_413_Template, 5, 0, "div", 69)(414, DirectorioDashboardComponent_div_414_Template, 18, 2, "div", 70);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(415, "div", 26)(416, "section", 71)(417, "div", 64)(418, "div", 65)(419, "div")(420, "h2", 66);
      \u0275\u0275text(421, "\u{1F517} Detalle y Trazabilidad (\xC1rbol Encadenado)");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(422, "p", 67);
      \u0275\u0275text(423, "Historial cronol\xF3gico de vida de expedientes: Facturaci\xF3n (FC) \u2794 D\xE9bitos (NC) \u2794 Refacturaci\xF3n / Incremento (ND) \u2794 Cobranza (RC).");
      \u0275\u0275elementEnd()()();
      \u0275\u0275template(424, DirectorioDashboardComponent_div_424_Template, 4, 0, "div", 68)(425, DirectorioDashboardComponent_div_425_Template, 5, 0, "div", 69)(426, DirectorioDashboardComponent_div_426_Template, 17, 2, "div", 70);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(8);
      \u0275\u0275classProp("active", ctx.solapaActiva === "tablero");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "cuenta-corriente");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "tiempos-cobranza");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "matriz-cobranzas");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "motivos");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "analistas");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "bucles");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "usuarios-carga");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "medicos");
      \u0275\u0275advance(5);
      \u0275\u0275classProp("active", ctx.solapaActiva === "trazabilidad");
      \u0275\u0275advance(9);
      \u0275\u0275twoWayProperty("ngModel", ctx.codigoCoberturaSeleccionada);
      \u0275\u0275advance(3);
      \u0275\u0275property("ngForOf", ctx.coberturas);
      \u0275\u0275advance(4);
      \u0275\u0275twoWayProperty("ngModel", ctx.tipoDocSeleccionado);
      \u0275\u0275advance(3);
      \u0275\u0275property("ngForOf", ctx.tiposDocumento);
      \u0275\u0275advance(4);
      \u0275\u0275twoWayProperty("ngModel", ctx.fechaDesde);
      \u0275\u0275advance(4);
      \u0275\u0275twoWayProperty("ngModel", ctx.fechaHasta);
      \u0275\u0275advance(10);
      \u0275\u0275property("hidden", ctx.solapaActiva !== "tablero");
      \u0275\u0275advance(7);
      \u0275\u0275property("ngIf", !ctx.cargandoTotales);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoTotales);
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", !ctx.cargandoTotales);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoTotales);
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", !ctx.cargandoTotales);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoTotales);
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", !ctx.cargandoTotales);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoTotales);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate1("Recupero: ", \u0275\u0275pipeBind2(132, 106, ctx.totales.tasaRecupero || 0, "1.1-1"), "%");
      \u0275\u0275advance(7);
      \u0275\u0275property("ngIf", !ctx.cargandoTotales);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoTotales);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate1("Efectividad: ", \u0275\u0275pipeBind2(143, 109, ctx.totales.efectividadCobro || 0, "1.1-1"), "%");
      \u0275\u0275advance(7);
      \u0275\u0275property("ngIf", !ctx.cargandoTotales);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoTotales);
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate1("DSO Ponderado: ", ctx.totales.dsoPonderadoDias, " d\xEDas");
      \u0275\u0275advance(19);
      \u0275\u0275property("ngIf", ctx.cargandoGraficos);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && (ctx.evolucionChartData.labels == null ? null : ctx.evolucionChartData.labels.length) === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && ((ctx.evolucionChartData.labels == null ? null : ctx.evolucionChartData.labels.length) ?? 0) > 0);
      \u0275\u0275advance(12);
      \u0275\u0275property("ngIf", ctx.cargandoGraficos);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && (ctx.distribucionChartData.labels == null ? null : ctx.distribucionChartData.labels.length) === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && ((ctx.distribucionChartData.labels == null ? null : ctx.distribucionChartData.labels.length) ?? 0) > 0);
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", ctx.cargandoBalance);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoBalance && ctx.balanceFinanciadores.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoBalance && ctx.balanceFinanciadores.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "cuenta-corriente");
      \u0275\u0275advance(14);
      \u0275\u0275property("ngIf", ctx.cargandoCuentaCorriente);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoCuentaCorriente && ctx.cuentaCorrienteDatos.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoCuentaCorriente && ctx.cuentaCorrienteDatos.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "tiempos-cobranza");
      \u0275\u0275advance(9);
      \u0275\u0275textInterpolate((ctx.tiemposCobranzaDatos == null ? null : ctx.tiemposCobranzaDatos.dsoGlobal) ?? 0);
      \u0275\u0275advance(10);
      \u0275\u0275textInterpolate1("", (ctx.tiemposCobranzaDatos == null ? null : ctx.tiemposCobranzaDatos.cobroRealPromedio) ?? 0, " d\xEDas");
      \u0275\u0275advance(5);
      \u0275\u0275textInterpolate1("$", \u0275\u0275pipeBind3(242, 112, (ctx.tiemposCobranzaDatos == null ? null : ctx.tiemposCobranzaDatos.saldoTotalMora) ?? 0, "1.0-0", "es-AR"));
      \u0275\u0275advance(10);
      \u0275\u0275property("ngIf", ctx.cargandoGraficos);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && (ctx.agingChartData.labels == null ? null : ctx.agingChartData.labels.length) === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && ((ctx.agingChartData.labels == null ? null : ctx.agingChartData.labels.length) ?? 0) > 0);
      \u0275\u0275advance(21);
      \u0275\u0275property("ngForOf", ctx.tiemposCobranzaDatos == null ? null : ctx.tiemposCobranzaDatos.detalles);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !(ctx.tiemposCobranzaDatos == null ? null : ctx.tiemposCobranzaDatos.detalles == null ? null : ctx.tiemposCobranzaDatos.detalles.length));
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "matriz-cobranzas");
      \u0275\u0275advance(12);
      \u0275\u0275property("ngModel", ctx.matrizRecaudacion == null ? null : ctx.matrizRecaudacion.anioSeleccionado);
      \u0275\u0275advance();
      \u0275\u0275property("ngForOf", ctx.matrizRecaudacion == null ? null : ctx.matrizRecaudacion.aniosDisponibles);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoMatriz);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoMatriz && (!(ctx.matrizRecaudacion == null ? null : ctx.matrizRecaudacion.filas) || (ctx.matrizRecaudacion == null ? null : ctx.matrizRecaudacion.filas == null ? null : ctx.matrizRecaudacion.filas.length) === 0));
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoMatriz && (ctx.matrizRecaudacion == null ? null : ctx.matrizRecaudacion.filas == null ? null : ctx.matrizRecaudacion.filas.length));
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "motivos");
      \u0275\u0275advance(14);
      \u0275\u0275textInterpolate1(" ", ctx.formatearMontoContador(ctx.totalDebitadoMotivos), " ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" ", ctx.totalCasosAfectadosMotivos, " casos afectados ");
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate1(" ", ctx.formatearMontoContador(ctx.debitoAceptadoPerdidaMotivos), " ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" Tasa de P\xE9rdida: ", ctx.tasaPerdidaMotivos, "% ");
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate1(" ", ctx.formatearMontoContador(ctx.totalRefacturadoMotivos), " ");
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1(" Tasa de Recupero: ", ctx.tasaRecuperoMotivos, "% ");
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate1(" ", ctx.motivosIdentificadosCount, " ");
      \u0275\u0275advance(20);
      \u0275\u0275property("ngIf", ctx.cargandoGraficos);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && (ctx.motivosChartData.labels == null ? null : ctx.motivosChartData.labels.length) === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoGraficos && ((ctx.motivosChartData.labels == null ? null : ctx.motivosChartData.labels.length) ?? 0) > 0);
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", ctx.motivosDebito.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoMotivos);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoMotivos && ctx.motivosDebito.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoMotivos && ctx.motivosDebito.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "analistas");
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", ctx.analistasDatos.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargandoAnalistas);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoAnalistas && ctx.analistasDatos.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoAnalistas && ctx.analistasDatos.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "bucles");
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", ctx.cargandoBucles);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoBucles && ctx.buclesDatos.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoBucles && ctx.buclesDatos.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "usuarios-carga");
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", ctx.cargandoOperadores);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoOperadores && ctx.operadoresDatos.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoOperadores && ctx.operadoresDatos.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "medicos");
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", ctx.cargandoMedicos);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoMedicos && ctx.medicosDatos.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoMedicos && ctx.medicosDatos.length > 0);
      \u0275\u0275advance();
      \u0275\u0275property("hidden", ctx.solapaActiva !== "trazabilidad");
      \u0275\u0275advance(9);
      \u0275\u0275property("ngIf", ctx.cargandoTrazabilidad);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoTrazabilidad && ctx.trazabilidadDatos.length === 0);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargandoTrazabilidad && ctx.trazabilidadDatos.length > 0);
    }
  }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, SelectControlValueAccessor, NgControlStatus, NgModel, BaseChartDirective, DecimalPipe, CurrencyPipe, DatePipe], styles: ['\n.directorio-container[_ngcontent-%COMP%] {\n  max-width: 1780px;\n  width: 100%;\n  margin: 0 auto;\n  padding: 1.5rem 1.25rem 3rem 1.25rem;\n  color: #1e293b;\n  font-family:\n    system-ui,\n    -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    Roboto,\n    Oxygen,\n    Ubuntu,\n    Cantarell,\n    sans-serif;\n}\n.directorio-header[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n}\n.header-badge-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.6rem;\n  align-items: center;\n  margin-bottom: 0.5rem;\n}\n.badge-modulo[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #4f46e5,\n      #7c3aed);\n  color: #ffffff;\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n  text-transform: uppercase;\n}\n.badge-readonly[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n  font-size: 0.72rem;\n  font-weight: 600;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n}\n.main-title[_ngcontent-%COMP%] {\n  font-size: 1.85rem;\n  font-weight: 800;\n  color: #0f172a;\n  margin: 0 0 0.35rem 0;\n  letter-spacing: -0.02em;\n}\n.subtitle[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.95rem;\n  margin: 0 0 1.25rem 0;\n}\n.directorio-tab-strip[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.25rem 0.5rem;\n  background: #ffffff;\n  border-bottom: 2px solid #e2e8f0;\n  padding: 0.35rem 0.6rem 0 0.6rem;\n  margin-bottom: 1.5rem;\n  border-radius: 8px 8px 0 0;\n}\n.tab-strip-item[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.45rem;\n  padding: 0.65rem 0.85rem;\n  background: transparent;\n  border: none;\n  border-bottom: 3px solid transparent;\n  color: #475569;\n  font-size: 0.84rem;\n  font-weight: 600;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: all 0.15s ease-in-out;\n  margin-bottom: -2px;\n  border-radius: 4px 4px 0 0;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.tab-strip-item[_ngcontent-%COMP%]:hover {\n  color: #1d4ed8;\n  background-color: #f8fafc;\n}\n.tab-strip-item.active[_ngcontent-%COMP%] {\n  color: #2563eb;\n  font-weight: 700;\n  border-bottom: 3px solid #2563eb;\n  background-color: transparent;\n}\n.tab-strip-icon[_ngcontent-%COMP%] {\n  font-size: 0.95rem;\n  display: inline-flex;\n  align-items: center;\n  line-height: 1;\n}\n.tab-strip-text[_ngcontent-%COMP%] {\n  letter-spacing: -0.01em;\n}\n.grafico-card--fullwidth[_ngcontent-%COMP%] {\n  grid-column: 1 / -1;\n  width: 100%;\n}\n.sub-filter-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 0.75rem 1.25rem;\n  margin-bottom: 1.5rem;\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  flex-wrap: wrap;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);\n}\n.sub-filter-title[_ngcontent-%COMP%] {\n  font-size: 0.8rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #64748b;\n  white-space: nowrap;\n}\n.sub-filter-pills[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n  flex-wrap: wrap;\n}\n.sub-pill[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding: 0.4rem 0.85rem;\n  border-radius: 8px;\n  border: 1px solid #cbd5e1;\n  background: #f8fafc;\n  color: #334155;\n  font-size: 0.82rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.15s ease-in-out;\n}\n.sub-pill[_ngcontent-%COMP%]:hover {\n  background: #e2e8f0;\n  color: #0f172a;\n}\n.sub-pill.active[_ngcontent-%COMP%] {\n  background: #0284c7;\n  color: #ffffff;\n  border-color: #0284c7;\n  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.28);\n}\n.sub-pill[_ngcontent-%COMP%]   .pill-icon[_ngcontent-%COMP%] {\n  font-size: 0.95rem;\n}\n.dashboard-tab-pane[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_fadeInPane 0.22s ease-out;\n}\n@keyframes _ngcontent-%COMP%_fadeInPane {\n  from {\n    opacity: 0;\n    transform: translateY(4px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.graficos-grid--single[_ngcontent-%COMP%] {\n  grid-template-columns: 1fr !important;\n}\n.graficos-grid--single[_ngcontent-%COMP%]   .grafico-card[_ngcontent-%COMP%] {\n  min-height: 420px;\n}\n.filter-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.25rem 1.5rem;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: flex-end;\n  gap: 1.25rem;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);\n}\n.filter-group[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.4rem;\n  flex: 1;\n  min-width: 200px;\n}\n.filter-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #475569;\n}\n.form-control[_ngcontent-%COMP%] {\n  border: 1px solid #cbd5e1;\n  background-color: #f8fafc;\n  color: #0f172a;\n  padding: 0.55rem 0.85rem;\n  border-radius: 8px;\n  font-size: 0.9rem;\n  outline: none;\n  transition: all 0.2s ease;\n}\n.form-control[_ngcontent-%COMP%]:focus {\n  border-color: #3b82f6;\n  background-color: #ffffff;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);\n}\n.filter-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.6rem;\n  align-items: center;\n}\n.btn[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding: 0.58rem 1.1rem;\n  font-size: 0.88rem;\n  font-weight: 600;\n  border-radius: 8px;\n  cursor: pointer;\n  border: none;\n  transition: all 0.2s ease;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #2563eb,\n      #1d4ed8);\n  color: #ffffff;\n  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #1d4ed8,\n      #1e40af);\n  transform: translateY(-1px);\n}\n.btn-secondary[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #334155;\n  border: 1px solid #cbd5e1;\n}\n.btn-secondary[_ngcontent-%COMP%]:hover {\n  background: #e2e8f0;\n  color: #0f172a;\n}\n.btn-outline-sm[_ngcontent-%COMP%] {\n  background: transparent;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n  font-size: 0.78rem;\n  padding: 0.35rem 0.75rem;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.btn-outline-sm[_ngcontent-%COMP%]:hover {\n  background: #f1f5f9;\n  color: #0f172a;\n}\n.kpi-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n  gap: 1.25rem;\n  margin-bottom: 2rem;\n}\n.kpi-grid--six[_ngcontent-%COMP%] {\n  grid-template-columns: repeat(6, minmax(0, 1fr));\n  gap: 0.85rem;\n}\n@media (max-width: 1400px) {\n  .kpi-grid--six[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n}\n@media (max-width: 768px) {\n  .kpi-grid--six[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(1, minmax(0, 1fr));\n  }\n}\n.kpi-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border-radius: 12px;\n  padding: 1.15rem 1.25rem;\n  border: 1px solid #e2e8f0;\n  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);\n  position: relative;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n.kpi-card[_ngcontent-%COMP%]:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.07);\n}\n.card-facturacion-fc[_ngcontent-%COMP%] {\n  border: 2.5px solid #2563eb !important;\n}\n.card-incrementos-nd[_ngcontent-%COMP%] {\n  border: 2.5px solid #f59e0b !important;\n}\n.card-debitos-nc[_ngcontent-%COMP%] {\n  border: 2.5px solid #ef4444 !important;\n}\n.card-refacturacion-nd[_ngcontent-%COMP%] {\n  border: 2.5px solid #06b6d4 !important;\n}\n.card-cobranzas-rc[_ngcontent-%COMP%] {\n  border: 2.5px solid #16a34a !important;\n}\n.card-saldo-real[_ngcontent-%COMP%] {\n  border: 2.5px solid #0f172a !important;\n}\n.kpi-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.45rem;\n}\n.kpi-title[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  color: #475569;\n  text-transform: uppercase;\n}\n.kpi-value[_ngcontent-%COMP%] {\n  font-size: 1.55rem;\n  font-weight: 800;\n  color: #0f172a;\n  margin-bottom: 0.45rem;\n  letter-spacing: -0.02em;\n  white-space: nowrap;\n}\n.kpi-val-fc[_ngcontent-%COMP%] {\n  color: #2563eb;\n}\n.kpi-val-nd[_ngcontent-%COMP%] {\n  color: #b45309;\n}\n.kpi-val-nc[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\n.kpi-val-ref[_ngcontent-%COMP%] {\n  color: #0284c7;\n}\n.kpi-val-rc[_ngcontent-%COMP%] {\n  color: #16a34a;\n}\n.kpi-val-saldo[_ngcontent-%COMP%] {\n  color: #0f172a;\n}\n.kpi-footer-simple[_ngcontent-%COMP%] {\n  font-size: 0.74rem;\n  color: #64748b;\n  font-weight: 500;\n}\n.kpi-footer[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 0.8rem;\n  color: #64748b;\n  border-top: 1px solid #f1f5f9;\n  padding-top: 0.6rem;\n}\n.kpi-count[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #3b82f6;\n}\n.kpi-badge-positive[_ngcontent-%COMP%] {\n  background: #dcfce7;\n  color: #166534;\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n}\n.kpi-badge-negative[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #991b1b;\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n}\n.kpi-formula[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-family: monospace;\n  background: #f1f5f9;\n  padding: 0.2rem 0.45rem;\n  border-radius: 4px;\n  color: #475569;\n}\n.skeleton-text[_ngcontent-%COMP%] {\n  color: #94a3b8;\n  font-size: 1rem;\n  font-style: italic;\n}\n.section-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 14px;\n  padding: 1.5rem;\n  margin-bottom: 2rem;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);\n}\n.section-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  flex-wrap: wrap;\n  gap: 1rem;\n  margin-bottom: 1.5rem;\n  padding-bottom: 1rem;\n  border-bottom: 1px solid #f1f5f9;\n}\n.section-title[_ngcontent-%COMP%] {\n  font-size: 1.25rem;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0 0 0.25rem 0;\n}\n.section-subtitle[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.85rem;\n  margin: 0;\n}\n.total-debitado-badge[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  border: 1px solid #cbd5e1;\n  padding: 0.4rem 0.85rem;\n  border-radius: 8px;\n  font-size: 0.85rem;\n  color: #334155;\n}\n.total-debitado-badge[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  color: #dc2626;\n  font-size: 0.95rem;\n}\n.loading-state[_ngcontent-%COMP%], \n.empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 3rem 1rem;\n  color: #64748b;\n  text-align: center;\n}\n.spinner[_ngcontent-%COMP%] {\n  width: 32px;\n  height: 32px;\n  border: 3px solid #e2e8f0;\n  border-top-color: #3b82f6;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 0.8s linear infinite;\n  margin-bottom: 0.75rem;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.empty-icon[_ngcontent-%COMP%] {\n  font-size: 2.2rem;\n  margin-bottom: 0.5rem;\n}\n.chart-layout[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 2rem;\n  align-items: center;\n}\n.donut-container[_ngcontent-%COMP%] {\n  flex: 0 0 300px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n}\n.donut-svg[_ngcontent-%COMP%] {\n  width: 100%;\n  max-width: 260px;\n  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.06));\n}\n.donut-slice[_ngcontent-%COMP%] {\n  cursor: pointer;\n  transition: transform 0.2s ease, opacity 0.2s ease;\n  transform-origin: 100px 100px;\n}\n.donut-slice[_ngcontent-%COMP%]:hover, \n.donut-slice.slice-active[_ngcontent-%COMP%] {\n  transform: scale(1.05);\n  opacity: 0.95;\n}\n.donut-center-circle[_ngcontent-%COMP%] {\n  fill: #ffffff;\n  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));\n}\n.donut-center-title[_ngcontent-%COMP%] {\n  font-size: 1.15rem;\n  font-weight: 800;\n  fill: #0f172a;\n}\n.donut-center-subtitle[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-weight: 600;\n  fill: #64748b;\n}\n.donut-hint[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: #64748b;\n  margin-top: 0.75rem;\n  text-align: center;\n}\n.legend-container[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 320px;\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  overflow: hidden;\n}\n.legend-header[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 2.5fr 1.2fr 1fr 1fr;\n  padding: 0.65rem 1rem;\n  background: #f1f5f9;\n  font-size: 0.72rem;\n  font-weight: 700;\n  color: #475569;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  border-bottom: 1px solid #e2e8f0;\n}\n.legend-list[_ngcontent-%COMP%] {\n  max-height: 280px;\n  overflow-y: auto;\n}\n.legend-item[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 2.5fr 1.2fr 1fr 1fr;\n  align-items: center;\n  padding: 0.65rem 1rem;\n  border-bottom: 1px solid #edf2f7;\n  cursor: pointer;\n  transition: background 0.15s ease;\n}\n.legend-item[_ngcontent-%COMP%]:hover, \n.legend-item.legend-hover[_ngcontent-%COMP%] {\n  background: #ffffff;\n  box-shadow: inset 3px 0 0 #3b82f6;\n}\n.legend-col-motivo[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.color-dot[_ngcontent-%COMP%] {\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  flex-shrink: 0;\n}\n.motivo-nombre[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  font-weight: 600;\n  color: #1e293b;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 220px;\n}\n.casos-badge[_ngcontent-%COMP%] {\n  font-size: 0.7rem;\n  background: #e2e8f0;\n  color: #475569;\n  padding: 0.1rem 0.35rem;\n  border-radius: 4px;\n}\n.legend-col-monto[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  font-weight: 700;\n  color: #0f172a;\n}\n.legend-col-porc[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.mini-bar-wrapper[_ngcontent-%COMP%] {\n  flex: 1;\n  height: 6px;\n  background: #e2e8f0;\n  border-radius: 3px;\n  overflow: hidden;\n}\n.mini-bar-fill[_ngcontent-%COMP%] {\n  height: 100%;\n  border-radius: 3px;\n}\n.porc-text[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  font-weight: 600;\n  color: #475569;\n  min-width: 38px;\n}\n.btn-drilldown[_ngcontent-%COMP%] {\n  background: #eff6ff;\n  border: 1px solid #bfdbfe;\n  color: #1d4ed8;\n  font-size: 0.75rem;\n  font-weight: 700;\n  padding: 0.25rem 0.6rem;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\n.btn-drilldown[_ngcontent-%COMP%]:hover {\n  background: #2563eb;\n  color: #ffffff;\n}\n.table-responsive[_ngcontent-%COMP%] {\n  overflow-x: auto;\n}\n.table-sanatorial[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.88rem;\n  background: #ffffff;\n}\n.table-sanatorial[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  color: #475569;\n  font-weight: 700;\n  font-size: 0.75rem;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  padding: 0.75rem 1rem;\n  border-bottom: 2px solid #cbd5e1;\n}\n.table-sanatorial[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.7rem 1rem;\n  border-bottom: 1px solid #e2e8f0;\n  color: #1e293b;\n  font-variant-numeric: tabular-nums;\n}\n.tr-financiador[_ngcontent-%COMP%] {\n  background-color: #f1f5f9;\n  font-weight: 700;\n  cursor: pointer;\n  border-left: 4px solid #3b82f6;\n  transition: background-color 0.15s ease;\n}\n.tr-financiador[_ngcontent-%COMP%]:hover {\n  background-color: #e2e8f0;\n}\n.tr-financiador.is-expanded[_ngcontent-%COMP%] {\n  background-color: #e2e8f0;\n  border-left-color: #1d4ed8;\n}\n.td-financiador[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.financiador-icon[_ngcontent-%COMP%] {\n  font-size: 1rem;\n}\n.financiador-nombre[_ngcontent-%COMP%] {\n  font-size: 0.92rem;\n  color: #0f172a;\n}\n.tr-periodo[_ngcontent-%COMP%] {\n  background-color: #f8fafc;\n  font-weight: 600;\n  cursor: pointer;\n  border-left: 4px solid #94a3b8;\n  transition: background-color 0.15s ease;\n}\n.tr-periodo[_ngcontent-%COMP%]:hover {\n  background-color: #f1f5f9;\n}\n.tr-periodo.is-expanded[_ngcontent-%COMP%] {\n  background-color: #f1f5f9;\n  border-left-color: #64748b;\n}\n.td-periodo[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding-left: 2rem !important;\n}\n.periodo-icon[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n}\n.periodo-tag[_ngcontent-%COMP%] {\n  font-family: monospace;\n  font-size: 0.88rem;\n  color: #334155;\n  background: #e2e8f0;\n  padding: 0.1rem 0.4rem;\n  border-radius: 4px;\n}\n.tr-factura[_ngcontent-%COMP%] {\n  background-color: #ffffff;\n  font-size: 0.84rem;\n  font-weight: 600;\n  cursor: pointer;\n  border-left: 4px solid #3b82f6;\n  transition: background-color 0.12s ease;\n}\n.tr-factura[_ngcontent-%COMP%]:hover {\n  background-color: #f8fafc;\n}\n.tr-factura.is-expanded[_ngcontent-%COMP%] {\n  background-color: #f0f7ff;\n  border-left-color: #2563eb;\n}\n.td-factura-node[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n  padding-left: 3rem !important;\n}\n.tr-comprobante-hijo[_ngcontent-%COMP%] {\n  background-color: #f8fafc;\n  font-size: 0.82rem;\n  transition: background-color 0.12s ease;\n  border-left: 4px solid #e2e8f0;\n}\n.tr-comprobante-hijo[_ngcontent-%COMP%]:hover {\n  background-color: #f1f5f9;\n}\n.td-comprobante-hijo-node[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n}\n.tree-branch[_ngcontent-%COMP%] {\n  display: inline-block;\n  width: 18px;\n  color: #94a3b8;\n  font-family: monospace;\n  font-size: 0.85rem;\n  -webkit-user-select: none;\n  user-select: none;\n  text-align: left;\n}\n.tree-bullet[_ngcontent-%COMP%] {\n  display: inline-block;\n  width: 18px;\n  text-align: center;\n  color: #94a3b8;\n  font-size: 0.85rem;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.comprobante-numero[_ngcontent-%COMP%] {\n  color: #0f172a;\n  font-family: monospace;\n}\n.text-fecha[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.82rem;\n}\n.btn-toggle-sm[_ngcontent-%COMP%] {\n  width: 20px;\n  height: 20px;\n  font-size: 0.62rem;\n}\n.btn-toggle-xs[_ngcontent-%COMP%] {\n  width: 18px;\n  height: 18px;\n  font-size: 0.55rem;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 3px;\n  border: 1px solid #cbd5e1;\n  background: #ffffff;\n  cursor: pointer;\n  color: #475569;\n  padding: 0;\n  line-height: 1;\n  transition: all 0.15s ease;\n}\n.btn-toggle-xs[_ngcontent-%COMP%]:hover {\n  background: #f1f5f9;\n  border-color: #94a3b8;\n  color: #0f172a;\n}\n.btn-toggle-xs.is-expanded[_ngcontent-%COMP%] {\n  background: #e2e8f0;\n  color: #1e293b;\n}\n.badge-origen[_ngcontent-%COMP%] {\n  display: inline-block;\n  padding: 1px 5px;\n  border-radius: 3px;\n  font-size: 0.68rem;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n  flex-shrink: 0;\n  vertical-align: middle;\n}\n.badge-deb[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #991b1b;\n  border: 1px solid #fecaca;\n}\n.badge-cob[_ngcontent-%COMP%] {\n  background: #e0e7ff;\n  color: #3730a3;\n  border: 1px solid #c7d2fe;\n}\n.badge-ref[_ngcontent-%COMP%] {\n  background: #dbeafe;\n  color: #1e40af;\n  border: 1px solid #bfdbfe;\n}\n.badge-inc[_ngcontent-%COMP%] {\n  background: #fef3c7;\n  color: #92400e;\n  border: 1px solid #fde68a;\n}\n.badge-count[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-weight: 500;\n  color: #64748b;\n  background: #ffffff;\n  border: 1px solid #cbd5e1;\n  padding: 0.1rem 0.4rem;\n  border-radius: 12px;\n  margin-left: 0.3rem;\n}\n.color-incremento[_ngcontent-%COMP%] {\n  color: #b45309;\n  font-weight: 600;\n}\n.color-saldo-positivo[_ngcontent-%COMP%] {\n  color: #166534;\n  font-weight: 700;\n}\n.color-saldo-negativo[_ngcontent-%COMP%] {\n  color: #dc2626;\n  font-weight: 700;\n}\n.color-saldo-cero[_ngcontent-%COMP%] {\n  color: #64748b;\n}\n.text-muted[_ngcontent-%COMP%] {\n  color: #94a3b8;\n}\n.table-facturas[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.88rem;\n}\n.table-facturas[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  color: #475569;\n  font-weight: 700;\n  font-size: 0.75rem;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  padding: 0.75rem 1rem;\n  border-bottom: 2px solid #e2e8f0;\n  text-align: left;\n}\n.table-facturas[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.85rem 1rem;\n  border-bottom: 1px solid #f1f5f9;\n  color: #1e293b;\n}\n.row-factura-raiz[_ngcontent-%COMP%] {\n  cursor: pointer;\n  transition: background 0.15s ease;\n}\n.row-factura-raiz[_ngcontent-%COMP%]:hover {\n  background-color: #f8fafc;\n}\n.row-factura-raiz.row-expanded[_ngcontent-%COMP%] {\n  background-color: #f1f5f9;\n  border-left: 4px solid #3b82f6;\n}\n.th-expander[_ngcontent-%COMP%], \n.td-expander[_ngcontent-%COMP%] {\n  width: 40px;\n  text-align: center;\n  padding: 0.5rem !important;\n}\n.btn-toggle-expand[_ngcontent-%COMP%] {\n  background: #e2e8f0;\n  border: none;\n  width: 24px;\n  height: 24px;\n  border-radius: 4px;\n  color: #334155;\n  font-size: 0.7rem;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: transform 0.2s ease, background 0.2s;\n}\n.btn-toggle-expand.is-expanded[_ngcontent-%COMP%] {\n  background: #3b82f6;\n  color: #ffffff;\n}\n.badge-tipo-doc[_ngcontent-%COMP%] {\n  display: inline-block;\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n  margin-right: 0.4rem;\n}\n.badge-fc[_ngcontent-%COMP%] {\n  background: #dbeafe;\n  color: #1d4ed8;\n  border: 1px solid #bfdbfe;\n}\n.cobertura-tag[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #334155;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  font-size: 0.82rem;\n  font-weight: 500;\n}\n.color-facturado[_ngcontent-%COMP%] {\n  color: #1e40af;\n}\n.color-aceptado[_ngcontent-%COMP%] {\n  color: #dc2626;\n  font-weight: 600;\n}\n.color-no-aceptado[_ngcontent-%COMP%] {\n  color: #ea580c;\n}\n.color-cobranza[_ngcontent-%COMP%] {\n  color: #059669;\n  font-weight: 600;\n}\n.color-refacturado[_ngcontent-%COMP%] {\n  color: #7c3aed;\n  font-weight: 600;\n}\n.refactura-badge[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #64748b;\n  font-size: 0.75rem;\n  font-weight: 700;\n  padding: 0.2rem 0.5rem;\n  border-radius: 9999px;\n  border: 1px solid #e2e8f0;\n}\n.refactura-badge.has-refactura[_ngcontent-%COMP%] {\n  background: #faf5ff;\n  color: #7c3aed;\n  border-color: #e9d5ff;\n}\n.badge-derivados-count[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: #64748b;\n  background: #f8fafc;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  border: 1px solid #e2e8f0;\n}\n.text-right[_ngcontent-%COMP%] {\n  text-align: right;\n}\n.text-center[_ngcontent-%COMP%] {\n  text-align: center;\n}\n.font-weight-bold[_ngcontent-%COMP%] {\n  font-weight: 700;\n}\n.row-accordion-detail[_ngcontent-%COMP%] {\n  background: #f8fafc;\n}\n.td-accordion-container[_ngcontent-%COMP%] {\n  padding: 1.25rem 1.5rem !important;\n  background: #f8fafc;\n  border-bottom: 2px solid #cbd5e1 !important;\n}\n.derived-tree-wrapper[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 1rem 1.25rem;\n  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.02);\n}\n.tree-header[_ngcontent-%COMP%] {\n  margin-bottom: 0.85rem;\n}\n.tree-title[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  font-weight: 700;\n  color: #475569;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n.empty-derived[_ngcontent-%COMP%] {\n  padding: 1.5rem;\n  text-align: center;\n  color: #94a3b8;\n  font-style: italic;\n  font-size: 0.85rem;\n}\n.table-sub-derivados[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.82rem;\n}\n.table-sub-derivados[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #475569;\n  font-size: 0.72rem;\n  text-transform: uppercase;\n  padding: 0.5rem 0.75rem;\n  border-bottom: 1px solid #cbd5e1;\n}\n.table-sub-derivados[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.6rem 0.75rem;\n  border-bottom: 1px solid #edf2f7;\n}\n.doc-badge-pill[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.badge-sub-doc[_ngcontent-%COMP%] {\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.4rem;\n  border-radius: 4px;\n}\n.badge-nc[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #b91c1c;\n}\n.badge-nd[_ngcontent-%COMP%] {\n  background: #f3e8ff;\n  color: #6b21a8;\n}\n.badge-rc[_ngcontent-%COMP%] {\n  background: #dcfce7;\n  color: #15803d;\n}\n.sub-doc-number[_ngcontent-%COMP%] {\n  font-weight: 600;\n  color: #0f172a;\n}\n.origen-badge[_ngcontent-%COMP%] {\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n}\n.origen-deb[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #991b1b;\n}\n.origen-ref[_ngcontent-%COMP%] {\n  background: #f3e8ff;\n  color: #6b21a8;\n}\n.origen-cob[_ngcontent-%COMP%] {\n  background: #dcfce7;\n  color: #166534;\n}\n.origen-iva[_ngcontent-%COMP%] {\n  background: #e0f2fe;\n  color: #0369a1;\n}\n@media (max-width: 1024px) {\n  .chart-layout[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n  .donut-container[_ngcontent-%COMP%] {\n    flex: 0 0 auto;\n    width: 100%;\n  }\n}\n@media (max-width: 768px) {\n  .directorio-container[_ngcontent-%COMP%] {\n    padding: 1rem;\n  }\n  .filter-card[_ngcontent-%COMP%] {\n    flex-direction: column;\n    align-items: stretch;\n  }\n  .filter-actions[_ngcontent-%COMP%] {\n    justify-content: flex-end;\n  }\n}\n.graficos-section[_ngcontent-%COMP%] {\n  margin-top: 2.5rem;\n  padding-top: 0.5rem;\n}\n.graficos-section[_ngcontent-%COMP%]   .section-header[_ngcontent-%COMP%] {\n  margin-bottom: 1.25rem;\n}\n.graficos-section[_ngcontent-%COMP%]   .section-title[_ngcontent-%COMP%] {\n  font-size: 1.15rem;\n  font-weight: 700;\n  color: #1e293b;\n  margin: 0 0 0.25rem 0;\n}\n.graficos-section[_ngcontent-%COMP%]   .section-subtitle[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  color: #64748b;\n  margin: 0;\n}\n.graficos-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.6fr 1fr;\n  gap: 1.25rem;\n}\n.grafico-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 14px;\n  padding: 1.25rem 1.5rem 1.5rem 1.5rem;\n  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n.grafico-card--wide[_ngcontent-%COMP%] {\n}\n.grafico-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.75rem;\n  flex-wrap: wrap;\n}\n.grafico-title-group[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex: 1;\n}\n.grafico-icon[_ngcontent-%COMP%] {\n  font-size: 1.6rem;\n  line-height: 1;\n  flex-shrink: 0;\n}\n.grafico-title[_ngcontent-%COMP%] {\n  font-size: 0.95rem;\n  font-weight: 700;\n  color: #1e293b;\n  margin: 0 0 0.2rem 0;\n}\n.grafico-subtitle[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  color: #64748b;\n  margin: 0;\n}\n.header-badge-container[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n}\n.badge-cabeceras[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  background: #ecfdf5;\n  color: #059669;\n  border: 1px solid #a7f3d0;\n  padding: 0.25rem 0.75rem;\n  border-radius: 9999px;\n  font-size: 0.78rem;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.1);\n}\n.badge-cabeceras[_ngcontent-%COMP%]   .badge-dot[_ngcontent-%COMP%] {\n  font-size: 0.65rem;\n  color: #10b981;\n}\n.balance-financiero-section[_ngcontent-%COMP%] {\n  margin-top: 1.5rem;\n}\n.table-balance[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n}\n.table-balance[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  color: #475569;\n  font-size: 0.75rem;\n  font-weight: 700;\n  letter-spacing: 0.04em;\n  padding: 0.75rem 1rem;\n  border-bottom: 2px solid #e2e8f0;\n}\n.table-balance[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.7rem 1rem;\n  font-size: 0.85rem;\n  border-bottom: 1px solid #f1f5f9;\n  font-variant-numeric: tabular-nums;\n}\n.table-balance[_ngcontent-%COMP%]   .tr-balance-row[_ngcontent-%COMP%]:hover {\n  background-color: #f8fafc;\n}\n.table-balance[_ngcontent-%COMP%]   .td-debito[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\n.table-balance[_ngcontent-%COMP%]   .td-refacturado[_ngcontent-%COMP%] {\n  color: #0284c7;\n}\n.table-balance[_ngcontent-%COMP%]   .td-cobrado[_ngcontent-%COMP%] {\n  color: #16a34a;\n}\n.table-balance[_ngcontent-%COMP%]   .th-saldo[_ngcontent-%COMP%], \n.table-balance[_ngcontent-%COMP%]   .td-saldo[_ngcontent-%COMP%] {\n  background-color: rgba(241, 245, 249, 0.6);\n  color: #0f172a;\n  font-weight: 700;\n}\n.table-balance[_ngcontent-%COMP%]   .tr-total-balance[_ngcontent-%COMP%] {\n  background-color: #f1f5f9;\n  border-top: 2px solid #cbd5e1;\n  border-bottom: 2px solid #cbd5e1;\n}\n.table-balance[_ngcontent-%COMP%]   .tr-total-balance[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.85rem 1rem;\n  font-size: 0.88rem;\n}\n.table-balance[_ngcontent-%COMP%]   .td-saldo-total[_ngcontent-%COMP%] {\n  background-color: #e2e8f0;\n  color: #0f172a;\n  font-weight: 800;\n}\n.grafico-body[_ngcontent-%COMP%] {\n  position: relative;\n  height: 300px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.grafico-body[_ngcontent-%COMP%]   canvas[_ngcontent-%COMP%] {\n  max-width: 100%;\n  max-height: 100%;\n}\n.grafico-loading[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  color: #94a3b8;\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.spinner-icon[_ngcontent-%COMP%] {\n  animation: _ngcontent-%COMP%_spin 1.5s linear infinite;\n  display: inline-block;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.grafico-empty[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  color: #94a3b8;\n  text-align: center;\n}\n.grafico-body--tall[_ngcontent-%COMP%] {\n  height: 380px;\n}\n@media (max-width: 900px) {\n  .graficos-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n.table-bordered[_ngcontent-%COMP%] {\n  border: 1px solid #cbd5e1;\n}\n.table-bordered[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.table-bordered[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  border: 1px solid #e2e8f0;\n}\n.section-card--matriz[_ngcontent-%COMP%] {\n  padding: 1.25rem 0.75rem;\n  width: 100%;\n  box-sizing: border-box;\n}\n.matriz-table-responsive[_ngcontent-%COMP%] {\n  width: 100%;\n  overflow-x: auto;\n  -webkit-overflow-scrolling: touch;\n  scrollbar-width: thin;\n  scrollbar-color: #cbd5e1 #f8fafc;\n}\n.matriz-table-responsive[_ngcontent-%COMP%]::-webkit-scrollbar {\n  height: 6px;\n}\n.matriz-table-responsive[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: #f8fafc;\n}\n.matriz-table-responsive[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 3px;\n}\n.table-matriz[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  white-space: nowrap;\n  border-collapse: collapse;\n  width: 100%;\n  border: 1px solid #e2e8f0;\n}\n.table-matriz[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  padding: 0.6rem 0.35rem;\n  font-size: 0.70rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.03em;\n  color: #475569;\n  background-color: #ffffff;\n  border: 1px solid #e2e8f0;\n  text-align: center;\n}\n.table-matriz[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.55rem 0.35rem;\n  border: 1px solid #e2e8f0;\n  font-size: 0.76rem;\n}\n.th-financiador[_ngcontent-%COMP%] {\n  text-align: left !important;\n  min-width: 160px;\n  max-width: 210px;\n  padding-left: 0.65rem !important;\n}\n.th-mes[_ngcontent-%COMP%] {\n  min-width: 72px;\n  text-align: center !important;\n}\n.th-total-anual[_ngcontent-%COMP%] {\n  background-color: #dcfce7 !important;\n  color: #14532d !important;\n  font-weight: 700 !important;\n  border-left: 2px solid #86efac !important;\n  min-width: 105px;\n  text-align: right !important;\n  padding-right: 0.65rem !important;\n  position: sticky;\n  right: 0;\n  z-index: 3;\n  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.05);\n}\n.tr-matriz-fila[_ngcontent-%COMP%]:hover {\n  background-color: #f8fafc;\n}\n.td-matriz-financiador[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.35rem;\n  color: #0f172a;\n  white-space: normal;\n  font-weight: 700;\n  font-size: 0.74rem;\n  line-height: 1.25;\n  padding-left: 0.65rem !important;\n}\n.td-mes-valor[_ngcontent-%COMP%] {\n  font-variant-numeric: tabular-nums;\n  color: #0f172a;\n  font-weight: 600;\n  text-align: right;\n  font-size: 0.75rem;\n  letter-spacing: -0.01em;\n}\n.td-mes-valor.valor-cero[_ngcontent-%COMP%] {\n  color: #94a3b8;\n  font-weight: 400;\n  text-align: center;\n}\n.td-total-anual[_ngcontent-%COMP%] {\n  background-color: #dcfce7 !important;\n  color: #14532d !important;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n  border-left: 2px solid #86efac !important;\n  text-align: right;\n  font-size: 0.76rem;\n  padding-right: 0.65rem !important;\n  position: sticky;\n  right: 0;\n  z-index: 2;\n  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.05);\n}\n.tr-matriz-total[_ngcontent-%COMP%] {\n  background-color: #f1f5f9;\n  font-weight: 700;\n  border-top: 2px solid #64748b !important;\n}\n.td-mes-total[_ngcontent-%COMP%] {\n  color: #0f172a;\n  font-variant-numeric: tabular-nums;\n  background-color: #f1f5f9;\n  font-weight: 700;\n  text-align: right;\n  font-size: 0.75rem;\n}\n.td-mes-total.valor-cero[_ngcontent-%COMP%] {\n  color: #94a3b8;\n  font-weight: 400;\n  text-align: center;\n}\n.td-gran-total[_ngcontent-%COMP%] {\n  background-color: #bbf7d0 !important;\n  color: #14532d !important;\n  font-weight: 800;\n  font-size: 0.82rem;\n  font-variant-numeric: tabular-nums;\n  border-left: 2px solid #86efac !important;\n  text-align: right;\n  padding-right: 0.65rem !important;\n  position: sticky;\n  right: 0;\n  z-index: 2;\n  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.05);\n}\n.matriz-tools[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.matriz-select-label[_ngcontent-%COMP%] {\n  font-size: 0.8rem;\n  font-weight: 700;\n  color: #475569;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n.select-anio[_ngcontent-%COMP%] {\n  width: auto;\n  min-width: 110px;\n  font-weight: 600;\n  padding: 0.35rem 0.75rem;\n  font-size: 0.85rem;\n}\n.tr-parent-nivel1[_ngcontent-%COMP%] {\n  cursor: pointer;\n  transition: background-color 0.15s ease;\n}\n.tr-parent-nivel1[_ngcontent-%COMP%]:hover {\n  background-color: #f1f5f9;\n}\n.tr-parent-nivel1.is-expanded[_ngcontent-%COMP%] {\n  background-color: #e2e8f0;\n}\n.btn-toggle-expand[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  font-size: 0.75rem;\n  color: #64748b;\n  cursor: pointer;\n  padding: 0.2rem 0.4rem;\n  transition: transform 0.15s ease;\n}\n.btn-toggle-expand.is-expanded[_ngcontent-%COMP%] {\n  transform: rotate(90deg);\n  color: #1e3a8a;\n}\n.tr-child-nivel2[_ngcontent-%COMP%] {\n  background-color: #f8fafc;\n}\n.td-child-container[_ngcontent-%COMP%] {\n  padding: 1rem 1.5rem !important;\n  background-color: #f8fafc;\n  border-bottom: 2px solid #cbd5e1 !important;\n}\n.chain-wrapper[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.25rem;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);\n}\n.chain-header-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 1.25rem;\n  padding-bottom: 0.75rem;\n  border-bottom: 1px solid #f1f5f9;\n}\n.chain-badge-expediente[_ngcontent-%COMP%] {\n  background: #eff6ff;\n  color: #1d4ed8;\n  font-weight: 700;\n  font-size: 0.8rem;\n  padding: 0.25rem 0.6rem;\n  border-radius: 6px;\n  border: 1px solid #bfdbfe;\n}\n.chain-badge-medico[_ngcontent-%COMP%] {\n  background: #f1f5f9;\n  color: #334155;\n  font-size: 0.8rem;\n  font-weight: 600;\n  padding: 0.25rem 0.6rem;\n  border-radius: 6px;\n  border: 1px solid #cbd5e1;\n}\n.chain-total-eventos[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  color: #64748b;\n  margin-left: auto;\n}\n.chain-timeline[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1.25rem;\n  align-items: stretch;\n  position: relative;\n}\n.chain-step[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  position: relative;\n  flex: 1;\n  min-width: 180px;\n  max-width: 240px;\n}\n.chain-node[_ngcontent-%COMP%] {\n  width: 38px;\n  height: 38px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 800;\n  font-size: 0.78rem;\n  letter-spacing: 0.05em;\n  color: #ffffff;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n  z-index: 2;\n  margin-bottom: 0.6rem;\n}\n.bg-primary[_ngcontent-%COMP%] {\n  background-color: #2563eb !important;\n  color: #ffffff !important;\n}\n.bg-danger[_ngcontent-%COMP%] {\n  background-color: #dc2626 !important;\n  color: #ffffff !important;\n}\n.bg-warning[_ngcontent-%COMP%] {\n  background-color: #d97706 !important;\n  color: #ffffff !important;\n}\n.bg-success[_ngcontent-%COMP%] {\n  background-color: #059669 !important;\n  color: #ffffff !important;\n}\n.chain-connector[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 19px;\n  left: calc(50% + 19px);\n  width: calc(100% - 18px);\n  height: 2px;\n  background: #cbd5e1;\n  z-index: 1;\n}\n.chain-step[_ngcontent-%COMP%]:last-child   .chain-connector[_ngcontent-%COMP%] {\n  display: none;\n}\n.chain-card[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 0.75rem 0.85rem;\n  width: 100%;\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);\n  display: flex;\n  flex-direction: column;\n  gap: 0.4rem;\n}\n.chain-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 0.4rem;\n}\n.chain-comprobante[_ngcontent-%COMP%] {\n  color: #0f172a;\n  font-family: monospace;\n  font-size: 0.82rem;\n}\n.chain-fecha[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.72rem;\n}\n.chain-card-body[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.chain-desc[_ngcontent-%COMP%] {\n  font-size: 0.76rem;\n  color: #475569;\n  font-weight: 500;\n}\n.chain-monto[_ngcontent-%COMP%] {\n  font-weight: 800;\n  font-size: 0.9rem;\n  font-variant-numeric: tabular-nums;\n}\n.chain-card-footer[_ngcontent-%COMP%] {\n  margin-top: 0.25rem;\n  padding-top: 0.35rem;\n  border-top: 1px dashed #f1f5f9;\n  color: #64748b;\n  font-size: 0.7rem;\n}\n.table-analistas[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.table-analistas[_ngcontent-%COMP%]   th.th-btn-col[_ngcontent-%COMP%] {\n  width: 48px;\n  text-align: center;\n  padding: 0.5rem 0.25rem !important;\n}\n.table-analistas[_ngcontent-%COMP%]   th.th-analista[_ngcontent-%COMP%] {\n  min-width: 280px;\n}\n.table-analistas[_ngcontent-%COMP%]   th.th-casos[_ngcontent-%COMP%] {\n  width: 110px;\n}\n.table-analistas[_ngcontent-%COMP%]   th.th-monto[_ngcontent-%COMP%] {\n  width: 145px;\n}\n.table-analistas[_ngcontent-%COMP%]   th.th-atencion[_ngcontent-%COMP%] {\n  width: 175px;\n  text-align: center;\n}\n.table-analistas[_ngcontent-%COMP%]   th.th-tasa[_ngcontent-%COMP%] {\n  width: 110px;\n}\n.sortable-col[_ngcontent-%COMP%] {\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.sortable-col[_ngcontent-%COMP%]:hover {\n  background-color: rgba(0, 0, 0, 0.04);\n}\n.sort-indicator[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  margin-left: 0.25rem;\n  color: #94a3b8;\n}\n.td-btn-box[_ngcontent-%COMP%] {\n  width: 48px;\n  text-align: center;\n}\n.btn-toggle-box[_ngcontent-%COMP%] {\n  width: 26px;\n  height: 26px;\n  border: 1px solid #cbd5e1;\n  border-radius: 6px;\n  background-color: #ffffff;\n  color: #475569;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.95rem;\n  font-weight: 700;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  line-height: 1;\n}\n.btn-toggle-box[_ngcontent-%COMP%]:hover {\n  background-color: #f1f5f9;\n  border-color: #94a3b8;\n  color: #0f172a;\n}\n.btn-toggle-box.is-expanded[_ngcontent-%COMP%] {\n  background-color: #e0e7ff;\n  border-color: #818cf8;\n  color: #4338ca;\n}\n.badge-docs-analista[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 28px;\n  padding: 0.2rem 0.6rem;\n  border-radius: 9999px;\n  background-color: #475569;\n  color: #ffffff;\n  font-size: 0.78rem;\n  font-weight: 700;\n}\n.badge-atencion[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.76rem;\n  font-weight: 600;\n  padding: 0.22rem 0.75rem;\n  border-radius: 9999px;\n  background-color: #f1f5f9;\n  color: #334155;\n  border: 1px solid #e2e8f0;\n  white-space: nowrap;\n}\n.badge-atencion-sm[_ngcontent-%COMP%] {\n  font-size: 0.7rem;\n  padding: 0.15rem 0.5rem;\n}\n.badge-analistas-activos[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.4rem 0.9rem;\n  background-color: #0d6efd;\n  color: #ffffff;\n  font-size: 0.82rem;\n  font-weight: 700;\n  border-radius: 9999px;\n  box-shadow: 0 1px 3px rgba(13, 110, 253, 0.25);\n  white-space: nowrap;\n}\n.color-ticket-promedio[_ngcontent-%COMP%] {\n  color: #0f172a;\n  font-weight: 700;\n}\n.tr-analista[_ngcontent-%COMP%] {\n  background-color: #ffffff;\n  font-weight: 600;\n  cursor: pointer;\n  border-left: 4px solid #6366f1;\n  transition: background-color 0.15s ease;\n}\n.tr-analista[_ngcontent-%COMP%]:hover {\n  background-color: #f8fafc;\n}\n.tr-analista.is-expanded[_ngcontent-%COMP%] {\n  background-color: #f5f3ff;\n  border-left-color: #4f46e5;\n}\n.td-analista[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.analista-icon[_ngcontent-%COMP%] {\n  font-size: 1.05rem;\n}\n.analista-nombre[_ngcontent-%COMP%] {\n  font-size: 0.94rem;\n  color: #0f172a;\n  font-weight: 700;\n}\n.color-ticket[_ngcontent-%COMP%] {\n  color: #0284c7;\n  font-weight: 700;\n}\n.badge-recupero[_ngcontent-%COMP%] {\n  display: inline-block;\n  font-size: 0.8rem;\n  font-weight: 700;\n  padding: 0.2rem 0.55rem;\n  border-radius: 9999px;\n  text-align: center;\n}\n.badge-recupero-sm[_ngcontent-%COMP%] {\n  font-size: 0.74rem;\n  padding: 0.15rem 0.45rem;\n}\n.recupero-alto[_ngcontent-%COMP%] {\n  background-color: #dcfce7;\n  color: #15803d;\n  border: 1px solid #bbf7d0;\n}\n.recupero-medio[_ngcontent-%COMP%] {\n  background-color: #fef3c7;\n  color: #b45309;\n  border: 1px solid #fde68a;\n}\n.recupero-cero[_ngcontent-%COMP%] {\n  background-color: #fee2e2;\n  color: #b91c1c;\n  border: 1px solid #fecaca;\n}\n.tr-sub-header[_ngcontent-%COMP%] {\n  background-color: #f8fafc;\n  font-size: 0.72rem;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #64748b;\n  border-bottom: 1px solid #e2e8f0;\n}\n.tr-sub-header-motivo[_ngcontent-%COMP%] {\n  background-color: #f1f5f9;\n}\n.tr-sub-header-motivo[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  padding: 0.4rem 0.75rem !important;\n  font-weight: 700;\n}\n.td-sub-header-title[_ngcontent-%COMP%] {\n  padding-left: 2rem !important;\n  color: #475569;\n}\n.tr-sub-header-financiador[_ngcontent-%COMP%] {\n  background-color: #f8fafc;\n}\n.tr-sub-header-financiador[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  padding: 0.35rem 0.75rem !important;\n  font-weight: 600;\n  font-size: 0.68rem;\n}\n.td-sub-header-sub-title[_ngcontent-%COMP%] {\n  padding-left: 3.5rem !important;\n  color: #64748b;\n}\n.td-sub-header-col[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.7rem;\n}\n.tr-motivo[_ngcontent-%COMP%] {\n  background-color: #f8fafc;\n  font-weight: 500;\n  cursor: pointer;\n  border-left: 4px solid #f59e0b;\n  transition: background-color 0.15s ease;\n}\n.tr-motivo[_ngcontent-%COMP%]:hover {\n  background-color: #f1f5f9;\n}\n.tr-motivo.is-expanded[_ngcontent-%COMP%] {\n  background-color: #fef3c7;\n  border-left-color: #d97706;\n}\n.td-motivo[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding-left: 2rem !important;\n}\n.motivo-icon[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n}\n.motivo-tag[_ngcontent-%COMP%] {\n  font-size: 0.88rem;\n  color: #334155;\n  font-weight: 600;\n}\n.tr-financiador-sub[_ngcontent-%COMP%] {\n  background-color: #ffffff;\n  font-size: 0.84rem;\n  transition: background-color 0.12s ease;\n  border-left: 4px solid transparent;\n}\n.tr-financiador-sub[_ngcontent-%COMP%]:hover {\n  background-color: #f8fafc;\n}\n.td-financiador-sub-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding-left: 3.5rem !important;\n}\n.financiador-nombre-sub[_ngcontent-%COMP%] {\n  color: #334155;\n  font-weight: 600;\n}\n.tr-medico[_ngcontent-%COMP%] {\n  border-left-color: #0d9488;\n}\n.tr-medico.is-expanded[_ngcontent-%COMP%] {\n  background-color: #f0fdfa;\n  border-left-color: #0f766e;\n}\n.tr-operador[_ngcontent-%COMP%] {\n  border-left-color: #8b5cf6;\n}\n.tr-operador.is-expanded[_ngcontent-%COMP%] {\n  background-color: #f5f3ff;\n  border-left-color: #7c3aed;\n}\n.tiempos-cobranza-section[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  width: 100%;\n}\n.tiempos-top-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 360px 1fr;\n  gap: 16px;\n  align-items: stretch;\n}\n@media (max-width: 960px) {\n  .tiempos-top-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n.tiempos-box[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);\n  padding: 20px 24px;\n  box-sizing: border-box;\n}\n.kpi-dso-box[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  text-align: center;\n}\n.kpi-dso-title[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.04em;\n  color: #475569;\n  text-transform: uppercase;\n  margin-top: 4px;\n}\n.kpi-dso-main[_ngcontent-%COMP%] {\n  padding: 12px 0;\n}\n.kpi-dso-val[_ngcontent-%COMP%] {\n  font-size: 3.8rem;\n  font-weight: 800;\n  color: #1e66f5;\n  line-height: 1;\n  margin-bottom: 8px;\n}\n.kpi-dso-sub[_ngcontent-%COMP%] {\n  font-size: 0.74rem;\n  color: #64748b;\n  margin: 0;\n  line-height: 1.35;\n}\n.kpi-dso-divider[_ngcontent-%COMP%] {\n  border: 0;\n  border-top: 1px solid #e2e8f0;\n  margin: 16px 0 14px 0;\n}\n.kpi-dso-footer[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 8px;\n}\n.kpi-dso-col[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  text-align: center;\n}\n.kpi-dso-col-lbl[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  color: #64748b;\n}\n.kpi-dso-col-val[_ngcontent-%COMP%] {\n  font-size: 0.88rem;\n  font-weight: 700;\n}\n.kpi-dso-col-val.text-green[_ngcontent-%COMP%] {\n  color: #16a34a;\n}\n.kpi-dso-col-val.text-red[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\n.grafico-aging-box[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n}\n.tiempos-box-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 12px;\n}\n.tiempos-box-icon[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 16px;\n  height: 16px;\n  color: #3b82f6;\n  flex-shrink: 0;\n}\n.tiempos-box-icon[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n}\n.tiempos-box-title[_ngcontent-%COMP%] {\n  font-size: 0.84rem;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0;\n}\n.aging-canvas-container[_ngcontent-%COMP%] {\n  position: relative;\n  height: 250px;\n  width: 100%;\n}\n.tabla-aging-box[_ngcontent-%COMP%] {\n  padding: 16px 20px;\n}\n.tabla-aging-wrap[_ngcontent-%COMP%] {\n  overflow-x: auto;\n}\n.tabla-aging-exact[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8rem;\n  margin-top: 4px;\n}\n.tabla-aging-exact[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  padding: 10px 14px;\n  border-bottom: 1px solid #cbd5e1;\n  color: #1e3a8a;\n  font-size: 0.70rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  background: transparent;\n}\n.tabla-aging-exact[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 12px 14px;\n  border-bottom: 1px solid #f1f5f9;\n  font-variant-numeric: tabular-nums;\n  font-size: 0.80rem;\n}\n.tabla-aging-exact[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:hover {\n  background-color: #fafafa;\n}\n.td-aging-rango[_ngcontent-%COMP%] {\n  font-weight: 700;\n  color: #000000;\n  text-align: left;\n}\n.td-aging-comprobantes[_ngcontent-%COMP%] {\n  color: #334155;\n  text-align: center;\n}\n.td-aging-saldo[_ngcontent-%COMP%] {\n  font-weight: 700;\n  color: #dc2626;\n  text-align: right;\n}\n.td-aging-porcentaje[_ngcontent-%COMP%] {\n  color: #334155;\n  text-align: right;\n}\n.motivos-info-alert[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.65rem;\n  background: #eff6ff;\n  border-left: 4px solid #3b82f6;\n  color: #1e40af;\n  border-radius: 6px;\n  padding: 0.7rem 1.15rem;\n  font-size: 0.85rem;\n  margin-bottom: 1.25rem;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);\n}\n.motivos-info-icon[_ngcontent-%COMP%] {\n  font-size: 1.15rem;\n  line-height: 1;\n}\n.motivos-info-text[_ngcontent-%COMP%] {\n  line-height: 1.4;\n}\n.motivos-info-text[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  font-weight: 700;\n  color: #1e3a8a;\n}\n.contadores-motivos-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 1.25rem;\n  margin-bottom: 1.75rem;\n}\n@media (max-width: 1200px) {\n  .contadores-motivos-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n@media (max-width: 640px) {\n  .contadores-motivos-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n.card-contador-motivo[_ngcontent-%COMP%] {\n  background: #ffffff;\n  border-radius: 10px;\n  padding: 1.2rem 1.35rem;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  min-height: 112px;\n  transition: transform 0.18s ease, box-shadow 0.18s ease;\n}\n.card-contador-motivo[_ngcontent-%COMP%]:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);\n}\n.card-contador-motivo.card-debitado-nc[_ngcontent-%COMP%] {\n  border: 2px solid #ef4444;\n}\n.card-contador-motivo.card-debito-aceptado[_ngcontent-%COMP%] {\n  border: 2px solid #881337;\n}\n.card-contador-motivo.card-total-refacturado[_ngcontent-%COMP%] {\n  border: 2px solid #2563eb;\n}\n.card-contador-motivo.card-motivos-identificados[_ngcontent-%COMP%] {\n  border: 2px solid #06b6d4;\n}\n.card-contador-motivo[_ngcontent-%COMP%]   .contador-header[_ngcontent-%COMP%] {\n  margin-bottom: 0.25rem;\n}\n.card-contador-motivo[_ngcontent-%COMP%]   .contador-title[_ngcontent-%COMP%] {\n  font-size: 0.74rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #334155;\n}\n.card-contador-motivo[_ngcontent-%COMP%]   .contador-value[_ngcontent-%COMP%] {\n  font-size: 1.9rem;\n  font-weight: 800;\n  line-height: 1.15;\n  margin: 0.35rem 0 0.25rem 0;\n  letter-spacing: -0.02em;\n}\n.card-contador-motivo.card-debitado-nc[_ngcontent-%COMP%]   .contador-value[_ngcontent-%COMP%] {\n  color: #ef4444;\n}\n.card-contador-motivo.card-debito-aceptado[_ngcontent-%COMP%]   .contador-value[_ngcontent-%COMP%] {\n  color: #881337;\n}\n.card-contador-motivo.card-total-refacturado[_ngcontent-%COMP%]   .contador-value[_ngcontent-%COMP%] {\n  color: #2563eb;\n}\n.card-contador-motivo.card-motivos-identificados[_ngcontent-%COMP%]   .contador-value[_ngcontent-%COMP%] {\n  color: #06b6d4;\n}\n.card-contador-motivo[_ngcontent-%COMP%]   .contador-footer[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  color: #64748b;\n  font-weight: 500;\n}\n/*# sourceMappingURL=directorio-dashboard.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DirectorioDashboardComponent, [{
    type: Component,
    args: [{ selector: "app-directorio-dashboard", standalone: true, imports: [CommonModule, FormsModule, BaseChartDirective, CurrencyPipe], template: `<div class="directorio-container">

  <!-- Header Superior & Contexto -->
  <header class="directorio-header">
    <div class="header-titles">
      <h1 class="main-title">Tablero de Control Financiero</h1>
      <p class="subtitle">Monitoreo de facturaci\xF3n, cobranza efectiva, d\xE9bitos aplicados y cadena de
        refacturaciones por instituci\xF3n m\xE9dica.</p>
    </div>

    <!-- =====================================================================
         BARRA DE SOLAPAS INDIVIDUALES (ESTILO REFERENCIA)
         ===================================================================== -->
    <nav class="directorio-tab-strip" aria-label="Sectores del Tablero">
      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'tablero'" (click)="seleccionarSolapa('tablero')">
        <span class="tab-strip-icon">\u2601\uFE0F</span>
        <span class="tab-strip-text">Tablero de Control</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'cuenta-corriente'" (click)="seleccionarSolapa('cuenta-corriente')">
        <span class="tab-strip-icon">\u{1F4C4}</span>
        <span class="tab-strip-text">Cuenta Corriente (3 Niveles)</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'tiempos-cobranza'" (click)="seleccionarSolapa('tiempos-cobranza')">
        <span class="tab-strip-icon">\u23F3</span>
        <span class="tab-strip-text">Tiempos de Cobranza</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'matriz-cobranzas'" (click)="seleccionarSolapa('matriz-cobranzas')">
        <span class="tab-strip-icon">\u{1F4C5}</span>
        <span class="tab-strip-text">Matriz de Cobranzas</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'motivos'" (click)="seleccionarSolapa('motivos')">
        <span class="tab-strip-icon">\u{1F6E1}\uFE0F</span>
        <span class="tab-strip-text">Motivos de D\xE9bito y Refacturaci\xF3n</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'analistas'" (click)="seleccionarSolapa('analistas')">
        <span class="tab-strip-icon">\u{1F464}</span>
        <span class="tab-strip-text">Analista de D\xE9bito (3 Niveles)</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'bucles'" (click)="seleccionarSolapa('bucles')">
        <span class="tab-strip-icon">\u2B55</span>
        <span class="tab-strip-text">Bucles de Insistencia</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'usuarios-carga'" (click)="seleccionarSolapa('usuarios-carga')">
        <span class="tab-strip-icon">\u{1F4C7}</span>
        <span class="tab-strip-text">Usuario de Carga (3 Niveles)</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'medicos'" (click)="seleccionarSolapa('medicos')">
        <span class="tab-strip-icon">\u{1F468}\u200D\u2695\uFE0F</span>
        <span class="tab-strip-text">Prestadores / M\xE9dicos (3 Niveles)</span>
      </button>

      <button type="button" class="tab-strip-item" [class.active]="solapaActiva === 'trazabilidad'" (click)="seleccionarSolapa('trazabilidad')">
        <span class="tab-strip-icon">\u{1F517}</span>
        <span class="tab-strip-text">Detalle y Trazabilidad</span>
      </button>
    </nav>

    <!-- Barra de Filtros -->
    <div class="filter-card">
      <div class="filter-group">
        <label for="select-cobertura">Instituci\xF3n / Cobertura</label>
        <select id="select-cobertura" class="form-control select-custom" [(ngModel)]="codigoCoberturaSeleccionada"
          (change)="aplicarFiltros()">
          <option value="TODAS">-- Todas las Instituciones --</option>
          <option *ngFor="let cob of coberturas" [value]="cob.codigo">
            {{ cob.nombre }} ({{ cob.codigo }})
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="select-tipo-doc">Tipo de Comprobante</label>
        <select id="select-tipo-doc" class="form-control select-custom" [(ngModel)]="tipoDocSeleccionado"
          (change)="aplicarFiltros()">
          <option value="TODOS">-- Todos los Tipos --</option>
          <option *ngFor="let tipo of tiposDocumento" [value]="tipo">
            {{ tipo }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="fecha-desde">Fecha Desde</label>
        <input type="date" id="fecha-desde" class="form-control" [(ngModel)]="fechaDesde" (change)="aplicarFiltros()">
      </div>

      <div class="filter-group">
        <label for="fecha-hasta">Fecha Hasta</label>
        <input type="date" id="fecha-hasta" class="form-control" [(ngModel)]="fechaHasta" (change)="aplicarFiltros()">
      </div>

      <div class="filter-actions">
        <button type="button" class="btn btn-primary" (click)="aplicarFiltros()" title="Aplicar filtros de b\xFAsqueda">
          <span class="icon">\u{1F50D}</span> Filtrar
        </button>
        <button type="button" class="btn btn-secondary" (click)="irAlMesAnterior()"
          title="Ver mes anterior manteniendo filtros">
          <span class="icon">\u21BA</span> Mes Anterior
        </button>
      </div>
    </div>
  </header>

  <!-- =====================================================================
       SOLAPA 1: TABLERO DE CONTROL (KPIS Y RESUMEN EJECUTIVO)
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'tablero'">

    <!-- Panel Macro: 6 Tarjetas de Totales Financieros (KPIs) -->
    <section class="kpi-grid kpi-grid--six">
      <!-- 1. Facturaci\xF3n Original (FC) -->
      <div class="kpi-card card-facturacion-fc">
        <div class="kpi-header">
          <span class="kpi-title">FACTURACI\xD3N ORIGINAL (FC)</span>
        </div>
        <div class="kpi-value kpi-val-fc">
          <span *ngIf="!cargandoTotales">{{ formatearMoneda(totales.totalFacturado) }}</span>
          <span *ngIf="cargandoTotales" class="skeleton-text">Cargando...</span>
        </div>
        <div class="kpi-footer-simple">
          <span class="kpi-desc">Comprobantes FC emitidos</span>
        </div>
      </div>

      <!-- 2. Incrementos (ND) -->
      <div class="kpi-card card-incrementos-nd">
        <div class="kpi-header">
          <span class="kpi-title">INCREMENTOS (ND)</span>
        </div>
        <div class="kpi-value kpi-val-nd">
          <span *ngIf="!cargandoTotales">{{ formatearMoneda(totales.totalIncrementosNd) }}</span>
          <span *ngIf="cargandoTotales" class="skeleton-text">Cargando...</span>
        </div>
        <div class="kpi-footer-simple">
          <span class="kpi-desc">Ajustes positivos asociados</span>
        </div>
      </div>

      <!-- 3. D\xE9bitos Recibidos (NC) -->
      <div class="kpi-card card-debitos-nc">
        <div class="kpi-header">
          <span class="kpi-title">D\xC9BITOS RECIBIDOS (NC)</span>
        </div>
        <div class="kpi-value kpi-val-nc">
          <span *ngIf="!cargandoTotales">{{ formatearMoneda(totales.totalDebitosNc) }}</span>
          <span *ngIf="cargandoTotales" class="skeleton-text">Cargando...</span>
        </div>
        <div class="kpi-footer-simple">
          <span class="kpi-desc">Total glosas debitadas</span>
        </div>
      </div>

      <!-- 4. Refacturaci\xF3n (ND-NC) -->
      <div class="kpi-card card-refacturacion-nd">
        <div class="kpi-header">
          <span class="kpi-title">REFACTURACI\xD3N (ND-NC)</span>
        </div>
        <div class="kpi-value kpi-val-ref">
          <span *ngIf="!cargandoTotales">{{ formatearMoneda(totales.totalRefacturacionNd) }}</span>
          <span *ngIf="cargandoTotales" class="skeleton-text">Cargando...</span>
        </div>
        <div class="kpi-footer-simple">
          <span class="kpi-desc">Recupero: {{ (totales.tasaRecupero || 0) | number:'1.1-1' }}%</span>
        </div>
      </div>

      <!-- 5. Cobranzas (RC) -->
      <div class="kpi-card card-cobranzas-rc">
        <div class="kpi-header">
          <span class="kpi-title">COBRANZAS (RC)</span>
        </div>
        <div class="kpi-value kpi-val-rc">
          <span *ngIf="!cargandoTotales">{{ formatearMoneda(totales.totalCobranzas) }}</span>
          <span *ngIf="cargandoTotales" class="skeleton-text">Cargando...</span>
        </div>
        <div class="kpi-footer-simple">
          <span class="kpi-desc">Efectividad: {{ (totales.efectividadCobro || 0) | number:'1.1-1' }}%</span>
        </div>
      </div>

      <!-- 6. Saldo Pendiente Real -->
      <div class="kpi-card card-saldo-real">
        <div class="kpi-header">
          <span class="kpi-title">SALDO PENDIENTE REAL</span>
        </div>
        <div class="kpi-value kpi-val-saldo">
          <span *ngIf="!cargandoTotales">{{ formatearMoneda(totales.saldoPendienteReal) }}</span>
          <span *ngIf="cargandoTotales" class="skeleton-text">Cargando...</span>
        </div>
        <div class="kpi-footer-simple">
          <span class="kpi-desc">DSO Ponderado: {{ totales.dsoPonderadoDias }} d\xEDas</span>
        </div>
      </div>
    </section>

    <!-- Gr\xE1ficos de Resumen: Evoluci\xF3n Mensual Imputada y Cartera -->
    <section class="graficos-section">
      <div class="graficos-grid">

        <!-- Card 1 (Izquierda): Evoluci\xF3n Mensual Imputada -->
        <div class="grafico-card grafico-card--wide">
          <div class="grafico-card-header">
            <div class="grafico-title-group">
              <span class="grafico-icon">\u{1F4C8}</span>
              <div>
                <h3 class="grafico-title">Evoluci\xF3n Mensual (Imputada por Per\xEDodo de Factura Original - Sin "S/P")</h3>
                <p class="grafico-subtitle">Facturaci\xF3n FC \xB7 D\xE9bitos Recibidos NC \xB7 Cobranzas RC</p>
              </div>
            </div>
            <div class="header-badge-container">
              <span class="badge-cabeceras" title="Universo total de comprobantes \xEDntegro y mapeado al 100%">
                <span class="badge-dot">\u25CF</span> Cabeceras 100%
              </span>
            </div>
          </div>

          <div class="grafico-body">
            <div *ngIf="cargandoGraficos" class="grafico-loading">
              <span class="spinner-icon">\u23F3</span> Cargando datos\u2026
            </div>
            <div *ngIf="!cargandoGraficos && (evolucionChartData.labels?.length === 0)" class="grafico-empty">
              <span>Sin datos de evoluci\xF3n disponibles</span>
            </div>
            <canvas *ngIf="!cargandoGraficos && (evolucionChartData.labels?.length ?? 0) > 0"
              id="chart-evolucion"
              baseChart
              [type]="'line'"
              [data]="evolucionChartData"
              [options]="evolucionChartOptions">
            </canvas>
          </div>
        </div>

        <!-- Card 2 (Derecha): Distribuci\xF3n de Cartera (Doughnut) -->
        <div class="grafico-card">
          <div class="grafico-card-header">
            <div class="grafico-title-group">
              <span class="grafico-icon">\u{1F369}</span>
              <div>
                <h3 class="grafico-title">Distribuci\xF3n de Cartera por Financiador</h3>
                <p class="grafico-subtitle">Saldo pendiente de cobro (Saldos > $0)</p>
              </div>
            </div>
          </div>

          <div class="grafico-body">
            <div *ngIf="cargandoGraficos" class="grafico-loading">
              <span class="spinner-icon">\u23F3</span> Cargando datos\u2026
            </div>
            <div *ngIf="!cargandoGraficos && (distribucionChartData.labels?.length === 0)" class="grafico-empty">
              <span>Sin datos de saldo pendiente</span>
            </div>
            <canvas *ngIf="!cargandoGraficos && (distribucionChartData.labels?.length ?? 0) > 0"
              id="chart-distribucion"
              baseChart
              [type]="'doughnut'"
              [data]="distribucionChartData"
              [options]="distribucionChartOptions">
            </canvas>
          </div>
        </div>

      </div>
    </section>

    <!-- Tabla: Resumen de Cartera y Balance Financiero -->
    <section class="grid-section balance-financiero-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">Resumen de Cartera y Balance Financiero</h2>
            <p class="section-subtitle">Consolidado por financiador: Facturaci\xF3n, Incrementos, D\xE9bitos, Refacturaciones y Cobranzas</p>
          </div>
        </div>

        <div *ngIf="cargandoBalance" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando balance financiero por financiador...</p>
        </div>

        <div *ngIf="!cargandoBalance && balanceFinanciadores.length === 0" class="empty-state">
          <span class="empty-icon">\u{1F4CA}</span>
          <p>No se encontraron datos de balance financiero.</p>
        </div>

        <div *ngIf="!cargandoBalance && balanceFinanciadores.length > 0" class="table-responsive">
          <table class="table-sanatorial table-balance">
            <thead>
              <tr>
                <th class="th-financiador text-left">FINANCIADOR</th>
                <th class="text-right">FACTURACI\xD3N (FC)</th>
                <th class="text-right">INCREMENTOS (ND)</th>
                <th class="text-right">D\xC9BITOS (NC)</th>
                <th class="text-right">REFACTURADO (ND-NC)</th>
                <th class="text-right">COBRADO (RC)</th>
                <th class="text-right th-saldo">SALDO PENDIENTE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of balanceFinanciadores" class="tr-balance-row">
                <td class="td-financiador text-left font-semibold">{{ b.financiador }}</td>
                <td class="text-right">{{ formatearMoneda(b.facturacionFc) }}</td>
                <td class="text-right">{{ formatearMoneda(b.incrementosNd) }}</td>
                <td class="text-right td-debito">{{ formatearMoneda(b.debitosNc) }}</td>
                <td class="text-right td-refacturado">{{ formatearMoneda(b.refacturadoNd) }}</td>
                <td class="text-right td-cobrado">{{ formatearMoneda(b.cobradoRc) }}</td>
                <td class="text-right td-saldo font-bold">{{ formatearMoneda(b.saldoPendiente) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="tr-total-balance">
                <td class="text-left font-bold">TOTAL GENERAL</td>
                <td class="text-right font-bold">{{ formatearMoneda(totalesBalance.facturacionFc) }}</td>
                <td class="text-right font-bold">{{ formatearMoneda(totalesBalance.incrementosNd) }}</td>
                <td class="text-right font-bold td-debito">{{ formatearMoneda(totalesBalance.debitosNc) }}</td>
                <td class="text-right font-bold td-refacturado">{{ formatearMoneda(totalesBalance.refacturadoNd) }}</td>
                <td class="text-right font-bold td-cobrado">{{ formatearMoneda(totalesBalance.cobradoRc) }}</td>
                <td class="text-right font-bold td-saldo-total">{{ formatearMoneda(totalesBalance.saldoPendiente) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>

  </div><!-- /tab-pane tablero -->

  <!-- =====================================================================
       SOLAPA 2: CUENTA CORRIENTE A 3 NIVELES
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'cuenta-corriente'">
    <section class="grid-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">Cuenta Corriente a 3 Niveles</h2>
            <p class="section-subtitle">Estructura jer\xE1rquica: Financiador \u2794 Per\xEDodo \u2794 Comprobantes detallados con saldos y estados de refacturaci\xF3n.</p>
          </div>
          <div class="grid-tools">
            <button type="button" class="btn btn-outline-sm" (click)="expandirTodosCuentaCorriente(true)">
              [+] Expandir Todo
            </button>
            <button type="button" class="btn btn-outline-sm" (click)="expandirTodosCuentaCorriente(false)">
              [-] Contraer Todo
            </button>
          </div>
        </div>

        <div *ngIf="cargandoCuentaCorriente" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando cuenta corriente a 3 niveles...</p>
        </div>

        <div *ngIf="!cargandoCuentaCorriente && cuentaCorrienteDatos.length === 0" class="empty-state">
          <span class="empty-icon">\u{1F4C1}</span>
          <p>No se encontraron registros de cuenta corriente para los filtros aplicados.</p>
        </div>

        <div *ngIf="!cargandoCuentaCorriente && cuentaCorrienteDatos.length > 0" class="table-responsive">
          <table class="table-sanatorial">
            <thead>
              <tr>
                <th class="th-tree">Entidad / Per\xEDodo / Comprobante</th>
                <th class="text-center">Fecha</th>
                <th class="text-right">Facturaci\xF3n (FC)</th>
                <th class="text-right">Incrementos (ND)</th>
                <th class="text-right">D\xE9bitos (NC)</th>
                <th class="text-right">Refacturaci\xF3n (ND)</th>
                <th class="text-right">Cobranzas (RC)</th>
                <th class="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let f of cuentaCorrienteDatos">

                <!-- NIVEL 1: Financiador -->
                <tr class="tr-financiador" (click)="toggleFinanciador(f)" [class.is-expanded]="f.expanded">
                  <td class="td-tree-node td-financiador">
                    <button type="button" class="btn-toggle-expand" [class.is-expanded]="f.expanded">
                      {{ f.expanded ? '\u25BC' : '\u25B6' }}
                    </button>
                    <span class="financiador-icon">\u{1F3E2}</span>
                    <span class="financiador-nombre">{{ f.financiador }}</span>
                  </td>
                  <td class="text-center text-muted">\u2014</td>
                  <td class="text-right font-weight-bold color-facturado">
                    {{ f.facturacionFc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right color-incremento">
                    {{ f.incrementosNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right color-aceptado">
                    {{ f.debitosNc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right color-refacturado">
                    {{ f.refacturacionNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right color-cobranza">
                    {{ f.cobranzasRc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right font-weight-bold" [ngClass]="f.saldo > 0 ? 'color-saldo-positivo' : (f.saldo < 0 ? 'color-saldo-negativo' : 'color-saldo-cero')">
                    {{ f.saldo | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                </tr>

                <!-- NIVEL 2: Per\xEDodos (solo si financiador est\xE1 expandido) -->
                <ng-container *ngIf="f.expanded">
                  <ng-container *ngFor="let p of f.periodos">

                    <tr class="tr-periodo" (click)="togglePeriodo(p)" [class.is-expanded]="p.expanded">
                      <td class="td-tree-node td-periodo">
                        <button type="button" class="btn-toggle-expand btn-toggle-sm" [class.is-expanded]="p.expanded">
                          {{ p.expanded ? '\u25BC' : '\u25B6' }}
                        </button>
                        <span class="periodo-icon">\u{1F4C5}</span>
                        <span class="periodo-tag">{{ p.periodo }}</span>
                      </td>
                      <td class="text-center text-muted">\u2014</td>
                      <td class="text-right color-facturado">
                        {{ p.facturacionFc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-incremento">
                        {{ p.incrementosNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-aceptado">
                        {{ p.debitosNc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-refacturado">
                        {{ p.refacturacionNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-cobranza">
                        {{ p.cobranzasRc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right font-weight-bold" [ngClass]="p.saldo > 0 ? 'color-saldo-positivo' : (p.saldo < 0 ? 'color-saldo-negativo' : 'color-saldo-cero')">
                        {{ p.saldo | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                    </tr>

                    <!-- NIVEL 3: Facturas Madres y Comprobantes Hijos -->
                    <ng-container *ngIf="p.expanded">
                      <ng-container *ngFor="let fc of p.comprobantes; trackBy: trackByComprobante">
                        <!-- Fila Factura Madre -->
                        <tr class="tr-factura" (click)="toggleFactura(fc)" [class.is-expanded]="fc.expanded">
                          <td class="td-tree-node td-factura-node">
                            <button *ngIf="fc.hijos && fc.hijos.length > 0" type="button" class="btn-toggle-expand btn-toggle-xs" [class.is-expanded]="fc.expanded" (click)="$event.stopPropagation(); toggleFactura(fc)">
                              {{ fc.expanded ? '\u25BC' : '\u25B6' }}
                            </button>
                            <span *ngIf="!fc.hijos || fc.hijos.length === 0" class="tree-bullet">\u2022</span>
                            <span class="badge-tipo-doc" [ngClass]="obtenerBadgeClase(fc.tipo)">{{ fc.tipo }}</span>
                            <strong class="comprobante-numero">{{ fc.comprobante }}</strong>
                          </td>
                          <td class="text-center text-fecha">
                            {{ fc.fecha | date:'dd/MM/yyyy' }}
                          </td>
                          <td class="text-right color-facturado">
                            {{ fc.facturacionFc > 0 ? (fc.facturacionFc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                          </td>
                          <td class="text-right color-incremento">
                            {{ fc.incrementosNd > 0 ? (fc.incrementosNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                          </td>
                          <td class="text-right color-aceptado">
                            {{ fc.debitosNc > 0 ? (fc.debitosNc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                          </td>
                          <td class="text-right color-refacturado">
                            {{ fc.refacturacionNd > 0 ? (fc.refacturacionNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                          </td>
                          <td class="text-right color-cobranza">
                            {{ fc.cobranzasRc > 0 ? (fc.cobranzasRc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                          </td>
                          <td class="text-right font-weight-bold" [ngClass]="fc.saldo > 0 ? 'color-saldo-positivo' : (fc.saldo < 0 ? 'color-saldo-negativo' : 'color-saldo-cero')">
                            {{ fc.saldo | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                          </td>
                        </tr>

                        <!-- Comprobantes Hijos (solo si la Factura Madre est\xE1 expandida) -->
                        <ng-container *ngIf="fc.expanded && fc.hijos && fc.hijos.length > 0">
                          <tr *ngFor="let h of fc.hijos" class="tr-comprobante-hijo">
                            <td class="td-tree-node td-comprobante-hijo-node" [style.padding-left.px]="74 + ((h.nivel || 1) - 1) * 25">
                              <span class="tree-branch">\u2514\u2500</span>
                              <span class="badge-tipo-doc" [ngClass]="obtenerBadgeClase(h.tipo)">{{ h.tipo }}</span>
                              <strong class="comprobante-numero">{{ h.comprobante }}</strong>
                            </td>
                            <td class="text-center text-fecha">
                              {{ h.fecha | date:'dd/MM/yyyy' }}
                            </td>
                            <td class="text-right color-facturado">
                              {{ h.facturacionFc > 0 ? (h.facturacionFc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                            </td>
                            <td class="text-right color-incremento">
                              {{ h.incrementosNd > 0 ? (h.incrementosNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                            </td>
                            <td class="text-right color-aceptado">
                              {{ h.debitosNc > 0 ? (h.debitosNc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                            </td>
                            <td class="text-right color-refacturado">
                              {{ h.refacturacionNd > 0 ? (h.refacturacionNd | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                            </td>
                            <td class="text-right color-cobranza">
                              {{ h.cobranzasRc > 0 ? (h.cobranzasRc | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                            </td>
                            <td class="text-right font-weight-bold" [ngClass]="h.saldo > 0 ? 'color-saldo-positivo' : (h.saldo < 0 ? 'color-saldo-negativo' : 'color-saldo-cero')">
                              {{ h.saldo | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                            </td>
                          </tr>
                        </ng-container>
                      </ng-container>
                    </ng-container>

                  </ng-container>
                </ng-container>

              </ng-container>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  </div><!-- /tab-pane cuenta-corriente -->

  <!-- =====================================================================
       SOLAPA 3: TIEMPOS DE COBRANZA (AGING DE DEUDA)
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'tiempos-cobranza'">
    <div class="tiempos-cobranza-section">
      <!-- Fila 1: Grid 2 Columnas (KPI Card a la izquierda, Gr\xE1fico a la derecha) -->
      <div class="tiempos-top-grid">

        <!-- Columna 1: Tarjeta KPI DSO -->
        <div class="tiempos-box kpi-dso-box">
          <div>
            <div class="kpi-dso-title">DSO GLOBAL PONDERADO POR MONTO</div>
            <div class="kpi-dso-main">
              <div class="kpi-dso-val">{{ tiemposCobranzaDatos?.dsoGlobal ?? 0 }}</div>
              <p class="kpi-dso-sub">D\xEDas promedio ponderados de atraso en cartera de facturas pendientes.</p>
            </div>
          </div>

          <div>
            <hr class="kpi-dso-divider">
            <div class="kpi-dso-footer">
              <div class="kpi-dso-col">
                <span class="kpi-dso-col-lbl">Cobro Real Promedio:</span>
                <span class="kpi-dso-col-val text-green">{{ tiemposCobranzaDatos?.cobroRealPromedio ?? 0 }} d\xEDas</span>
              </div>
              <div class="kpi-dso-col">
                <span class="kpi-dso-col-lbl">Saldo Total en Mora:</span>
                <span class="kpi-dso-col-val text-red">\${{ (tiemposCobranzaDatos?.saldoTotalMora ?? 0) | number:'1.0-0':'es-AR' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna 2: Tarjeta Gr\xE1fico Aging Vertical -->
        <div class="tiempos-box grafico-aging-box">
          <div class="tiempos-box-header">
            <span class="tiempos-box-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM14 8a1 1 0 011-1h2a1 1 0 011 1v8a1 1 0 01-1 1h-2a1 1 0 01-1-1V8z"/>
              </svg>
            </span>
            <h3 class="tiempos-box-title">Distribuci\xF3n de Deuda por Rangos de Vencimiento (Aging)</h3>
          </div>

          <div class="aging-canvas-container">
            <div *ngIf="cargandoGraficos" class="grafico-loading">
              <span class="spinner-icon">\u23F3</span> Cargando datos\u2026
            </div>
            <div *ngIf="!cargandoGraficos && (agingChartData.labels?.length === 0)" class="grafico-empty">
              <span>Sin deuda pendiente en los rangos configurados</span>
            </div>
            <canvas *ngIf="!cargandoGraficos && (agingChartData.labels?.length ?? 0) > 0"
              id="chart-aging"
              baseChart
              [type]="'bar'"
              [data]="agingChartData"
              [options]="agingChartOptions">
            </canvas>
          </div>
        </div>

      </div>

      <!-- Fila 2: Tabla Inferior -->
      <div class="tiempos-box tabla-aging-box">
        <div class="tiempos-box-header">
          <span class="tiempos-box-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h3 class="tiempos-box-title">Detalle de Antig\xFCedad de Deuda por Rango</h3>
        </div>

        <div class="tabla-aging-wrap">
          <table class="tabla-aging-exact">
            <thead>
              <tr>
                <th style="text-align: left;">RANGO DE ANTIG\xDCEDAD</th>
                <th style="text-align: center;">CANTIDAD DE COMPROBANTES</th>
                <th style="text-align: right;">SALDO EN MORA</th>
                <th style="text-align: right;">% DE CARTERA MOROSA</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of tiemposCobranzaDatos?.detalles">
                <td class="td-aging-rango">{{ item.rango }}</td>
                <td class="td-aging-comprobantes">{{ item.cantidadComprobantes | number:'1.0-0':'es-AR' }}</td>
                <td class="td-aging-saldo">\${{ item.saldoEnMora | number:'1.0-0':'es-AR' }}</td>
                <td class="td-aging-porcentaje">{{ item.porcentajeCartera | number:'1.1-1':'es-AR' }}%</td>
              </tr>
              <tr *ngIf="!tiemposCobranzaDatos?.detalles?.length">
                <td colspan="4" style="text-align: center; padding: 24px; color: #94a3b8;">
                  Sin datos de antig\xFCedad disponibles
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div><!-- /tab-pane tiempos-cobranza -->

  <!-- =====================================================================
       SOLAPA 4: MATRIZ DE COBRANZAS (RECAUDACI\xD3N ANUAL)
       ===================================================================== -->
  <div class="dashboard-tab-pane dashboard-tab-pane--matriz" [hidden]="solapaActiva !== 'matriz-cobranzas'">
    <section class="grid-section">
      <div class="section-card section-card--matriz">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">\u{1F9FE} Matriz Anual de Recaudaci\xF3n por Fecha Real de Recibo (RC)</h2>
            <p class="section-subtitle">Imputaci\xF3n basada estrictamente en la fecha real de cobro (cabeceras.fecha)</p>
          </div>
          <div class="grid-tools matriz-tools">
            <label for="select-anio-matriz" class="matriz-select-label">A\xF1o Calendario:</label>
            <select id="select-anio-matriz" class="form-control select-custom select-anio"
                    [ngModel]="matrizRecaudacion?.anioSeleccionado"
                    (ngModelChange)="onAnioMatrizChange($event)">
              <option *ngFor="let anio of matrizRecaudacion?.aniosDisponibles" [value]="anio">
                {{ anio }}
              </option>
            </select>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="cargandoMatriz" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando matriz anual de cobranzas...</p>
        </div>

        <!-- Estado Vac\xEDo -->
        <div *ngIf="!cargandoMatriz && (!matrizRecaudacion?.filas || matrizRecaudacion?.filas?.length === 0)" class="empty-state">
          <span class="empty-icon">\u{1F4C1}</span>
          <p>No se encontraron registros de cobros para el a\xF1o seleccionado.</p>
        </div>

        <!-- Tabla Sanatorial Matriz -->
        <div *ngIf="!cargandoMatriz && matrizRecaudacion?.filas?.length" class="table-responsive matriz-table-responsive">
          <table class="table-sanatorial table-bordered table-matriz">
            <thead>
              <tr>
                <th class="th-financiador">FINANCIADOR</th>
                <th class="th-mes">ENE</th>
                <th class="th-mes">FEB</th>
                <th class="th-mes">MAR</th>
                <th class="th-mes">ABR</th>
                <th class="th-mes">MAY</th>
                <th class="th-mes">JUN</th>
                <th class="th-mes">JUL</th>
                <th class="th-mes">AGO</th>
                <th class="th-mes">SEP</th>
                <th class="th-mes">OCT</th>
                <th class="th-mes">NOV</th>
                <th class="th-mes">DIC</th>
                <th class="th-total-anual">TOTAL ANUAL</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let fila of matrizRecaudacion?.filas; trackBy: trackByFinanciadorFila" class="tr-matriz-fila">
                <td class="td-matriz-financiador font-weight-bold">
                  <span class="financiador-icon">\u{1F3E2}</span>
                  <span>{{ fila.financiador }}</span>
                </td>
                <td *ngFor="let mes of fila.meses; trackBy: trackByMes" class="td-mes-valor" [class.valor-cero]="mes === 0">
                  {{ mes > 0 ? ('$' + (mes | number:'1.0-0':'es-AR')) : '-' }}
                </td>
                <td class="td-total-anual font-weight-bold">
                  \${{ fila.totalAnual | number:'1.0-0':'es-AR' }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="tr-matriz-total">
                <td class="td-matriz-financiador font-weight-bold">TOTAL GENERAL</td>
                <td *ngFor="let totalMes of matrizRecaudacion?.totalesMes; trackBy: trackByMes" class="td-mes-total font-weight-bold" [class.valor-cero]="totalMes === 0">
                  {{ totalMes > 0 ? ('$' + (totalMes | number:'1.0-0':'es-AR')) : '-' }}
                </td>
                <td class="td-gran-total font-weight-bold">
                  \${{ (matrizRecaudacion?.granTotal || 0) | number:'1.0-0':'es-AR' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </section>
  </div><!-- /tab-pane matriz-cobranzas -->

  <!-- =====================================================================
       SOLAPA 5: MOTIVOS DE D\xC9BITO Y REFACTURACI\xD3N
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'motivos'">

    <!-- Banner informativo de contexto (Estilo Referencia) -->
    <div class="motivos-info-alert">
      <span class="motivos-info-icon">\u2139\uFE0F</span>
      <span class="motivos-info-text">
        <strong>Motivos de D\xE9bito y Refacturaci\xF3n (2 Niveles):</strong> Desglose por resoluci\xF3n y refacturaci\xF3n. Todos los filtros aplican.
      </span>
    </div>

    <!-- 4 Contadores KPI Superiores (Estilo Referencia) -->
    <section class="contadores-motivos-grid">
      <!-- 1. TOTAL DEBITADO EN NC -->
      <div class="card-contador-motivo card-debitado-nc">
        <div class="contador-header">
          <span class="contador-title">TOTAL DEBITADO EN NC</span>
        </div>
        <div class="contador-value">
          {{ formatearMontoContador(totalDebitadoMotivos) }}
        </div>
        <div class="contador-footer">
          {{ totalCasosAfectadosMotivos }} casos afectados
        </div>
      </div>

      <!-- 2. D\xC9BITO ACEPTADO (P\xC9RDIDA) -->
      <div class="card-contador-motivo card-debito-aceptado">
        <div class="contador-header">
          <span class="contador-title">D\xC9BITO ACEPTADO (P\xC9RDIDA)</span>
        </div>
        <div class="contador-value">
          {{ formatearMontoContador(debitoAceptadoPerdidaMotivos) }}
        </div>
        <div class="contador-footer">
          Tasa de P\xE9rdida: {{ tasaPerdidaMotivos }}%
        </div>
      </div>

      <!-- 3. TOTAL REFACTURADO (DISPUTADO) -->
      <div class="card-contador-motivo card-total-refacturado">
        <div class="contador-header">
          <span class="contador-title">TOTAL REFACTURADO (DISPUTADO)</span>
        </div>
        <div class="contador-value">
          {{ formatearMontoContador(totalRefacturadoMotivos) }}
        </div>
        <div class="contador-footer">
          Tasa de Recupero: {{ tasaRecuperoMotivos }}%
        </div>
      </div>

      <!-- 4. MOTIVOS IDENTIFICADOS -->
      <div class="card-contador-motivo card-motivos-identificados">
        <div class="contador-header">
          <span class="contador-title">MOTIVOS IDENTIFICADOS</span>
        </div>
        <div class="contador-value">
          {{ motivosIdentificadosCount }}
        </div>
        <div class="contador-footer">
          Glosas distintas
        </div>
      </div>
    </section>

    <!-- Pareto de Glosas -->
    <section class="graficos-section">
      <div class="section-header">
        <h2 class="section-title">\u{1F6E1}\uFE0F Motivos de D\xE9bito y Refacturaci\xF3n (Pareto)</h2>
        <p class="section-subtitle">Top 10 motivos de rechazo \xB7 Monto refacturado vs. P\xE9rdida asumida definitivamente</p>
      </div>

      <div class="graficos-grid graficos-grid--single">
        <div class="grafico-card grafico-card--wide grafico-card--fullwidth">
          <div class="grafico-card-header">
            <span class="grafico-icon">\u{1F4CB}</span>
            <div>
              <h3 class="grafico-title">Pareto de Glosas</h3>
              <p class="grafico-subtitle">Top 10 motivos \xB7 Refacturado vs. P\xE9rdida asumida</p>
            </div>
          </div>

          <div class="grafico-body grafico-body--tall">
            <div *ngIf="cargandoGraficos" class="grafico-loading">
              <span class="spinner-icon">\u23F3</span> Cargando datos\u2026
            </div>
            <div *ngIf="!cargandoGraficos && (motivosChartData.labels?.length === 0)" class="grafico-empty">
              <span>Sin datos de motivos de d\xE9bito disponibles</span>
            </div>
            <canvas *ngIf="!cargandoGraficos && (motivosChartData.labels?.length ?? 0) > 0"
              id="chart-motivos"
              baseChart
              [type]="'bar'"
              [data]="motivosChartData"
              [options]="motivosChartOptions">
            </canvas>
          </div>
        </div>
      </div>
    </section>

    <!-- Distribuci\xF3n de D\xE9bitos por Causa / Motivo (Donut SVG Interactivo) -->
    <section class="analytics-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">Distribuci\xF3n de D\xE9bitos por Causa / Motivo</h2>
            <p class="section-subtitle">Haga clic en cualquier porci\xF3n del anillo o motivo de la lista para acceder al
              detalle con los comentarios de los operadores.
            </p>
          </div>
          <div class="total-debitado-badge" *ngIf="motivosDebito.length > 0">
            Total Debitado: <strong>{{ formatearMoneda(obtenerTotalDebitadoGeneral()) }}</strong>
          </div>
        </div>

        <div *ngIf="cargandoMotivos" class="loading-state">
          <div class="spinner"></div>
          <p>Analizando motivos de d\xE9bito...</p>
        </div>

        <div *ngIf="!cargandoMotivos && motivosDebito.length === 0" class="empty-state">
          <span class="empty-icon">\u{1F4CA}</span>
          <p>No se registran d\xE9bitos para el per\xEDodo y cobertura seleccionados.</p>
        </div>

        <div *ngIf="!cargandoMotivos && motivosDebito.length > 0" class="chart-layout">

          <!-- Gr\xE1fico Donut SVG Interactivo -->
          <div class="donut-container">
            <svg viewBox="0 0 200 200" class="donut-svg">
              <g>
                <path *ngFor="let slice of slicesDonut" [attr.d]="slice.pathData" [attr.fill]="slice.color"
                  class="donut-slice" [class.slice-active]="sectorHover?.motivo === slice.motivo"
                  (mouseenter)="onHoverSector(slice)" (mouseleave)="onHoverSector(null)"
                  (click)="navegarADetalleMotivo(slice.motivo)">
                </path>
              </g>
              <!-- Centro del Donut -->
              <circle cx="100" cy="100" r="50" class="donut-center-circle"></circle>
              <!-- Texto Central Din\xE1mico -->
              <text x="100" y="93" text-anchor="middle" class="donut-center-title">
                {{ sectorHover ? sectorHover.porcentaje + '%' : (motivosDebito.length + ' Motivos') }}
              </text>
              <text x="100" y="112" text-anchor="middle" class="donut-center-subtitle">
                {{ sectorHover ? formatearMoneda(sectorHover.montoTotal) : 'Total D\xE9bitos' }}
              </text>
            </svg>
            <div class="donut-hint">\u{1F4A1} Clic en un sector para ver prestaciones</div>
          </div>

          <!-- Leyenda y Ranking de Motivos con Clic para Drill-Down -->
          <div class="legend-container">
            <div class="legend-header">
              <span>Motivo / Causa de Rechazo</span>
              <span>Monto ($)</span>
              <span>% Part.</span>
              <span>Acci\xF3n</span>
            </div>

            <div class="legend-list">
              <div *ngFor="let item of motivosDebito" class="legend-item"
                [class.legend-hover]="sectorHover?.motivo === item.motivo"
                (mouseenter)="onHoverSector({ motivo: item.motivo, montoTotal: item.montoTotal, porcentaje: item.porcentaje, cantidadCasos: item.cantidadCasos, color: item.color || '#38bdf8', pathData: '', middleAngle: 0 })"
                (mouseleave)="onHoverSector(null)" (click)="navegarADetalleMotivo(item.motivo)"
                title="Ver detalle de prestaciones para: {{ item.motivo }}">

                <div class="legend-col-motivo">
                  <span class="color-dot" [style.background-color]="item.color"></span>
                  <span class="motivo-nombre">{{ item.motivo }}</span>
                  <span class="casos-badge">{{ item.cantidadCasos }} casos</span>
                </div>

                <div class="legend-col-monto">
                  {{ formatearMoneda(item.montoTotal) }}
                </div>

                <div class="legend-col-porc">
                  <div class="mini-bar-wrapper">
                    <div class="mini-bar-fill" [style.width.%]="item.porcentaje" [style.background-color]="item.color">
                    </div>
                  </div>
                  <span class="porc-text">{{ item.porcentaje }}%</span>
                </div>

                <div class="legend-col-action">
                  <button type="button" class="btn-drilldown"
                    (click)="$event.stopPropagation(); navegarADetalleMotivo(item.motivo)">
                    Ver Detalle \u2794
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div><!-- /tab-pane motivos -->

  <!-- =====================================================================
       SOLAPA 6: ANALISTA DE D\xC9BITO (3 NIVELES)
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'analistas'">
    <section class="grid-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">\u{1F464} Desempe\xF1o y Gesti\xF3n por Analista de D\xE9bito (3 Niveles)</h2>
            <p class="section-subtitle">
              Nivel 1: Analista &gt; Nivel 2: Motivos de D\xE9bito &gt; Nivel 3: Instituci\xF3n / Financiador
            </p>
          </div>
          <div *ngIf="analistasDatos.length > 0" class="badge-analistas-activos">
            {{ analistasDatos.length }} Analistas Activos
          </div>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="cargandoAnalistas" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando m\xE9tricas de analistas de d\xE9bito...</p>
        </div>

        <!-- Estado Vac\xEDo -->
        <div *ngIf="!cargandoAnalistas && analistasDatos.length === 0" class="empty-state">
          <span class="empty-icon">\u{1F4C1}</span>
          <p>No se encontraron d\xE9bitos registrados para los analistas en el per\xEDodo seleccionado.</p>
        </div>

        <!-- Tabla Sanatorial Analistas a 3 Niveles -->
        <div *ngIf="!cargandoAnalistas && analistasDatos.length > 0" class="table-responsive">
          <table class="table-sanatorial table-bordered table-analistas">
            <thead>
              <tr>
                <th class="th-btn-col">#</th>
                <th class="th-analista sortable-col" (click)="ordenarAnalistas('analista')">
                  ANALISTA / AUDITOR <span class="sort-indicator">{{ columnaOrdenAnalista === 'analista' ? (direccionOrdenAnalista === 'asc' ? '\u2191' : '\u2193') : '\u2195' }}</span>
                </th>
                <th class="text-center th-casos sortable-col" (click)="ordenarAnalistas('documentos')">
                  DOCUMENTOS <span class="sort-indicator">{{ columnaOrdenAnalista === 'documentos' ? (direccionOrdenAnalista === 'asc' ? '\u2191' : '\u2193') : '\u2195' }}</span>
                </th>
                <th class="text-right th-monto sortable-col" (click)="ordenarAnalistas('aceptados')">
                  D\xC9BITOS ACEPTADOS ($) <span class="sort-indicator">{{ columnaOrdenAnalista === 'aceptados' ? (direccionOrdenAnalista === 'asc' ? '\u2191' : '\u2193') : '\u2195' }}</span>
                </th>
                <th class="text-right th-monto sortable-col" (click)="ordenarAnalistas('refacturados')">
                  REFACTURADOS ($) <span class="sort-indicator">{{ columnaOrdenAnalista === 'refacturados' ? (direccionOrdenAnalista === 'asc' ? '\u2191' : '\u2193') : '\u2195' }}</span>
                </th>
                <th class="text-right th-monto sortable-col" (click)="ordenarAnalistas('ticket')">
                  TICKET PROMEDIO <span class="sort-indicator">{{ columnaOrdenAnalista === 'ticket' ? (direccionOrdenAnalista === 'asc' ? '\u2191' : '\u2193') : '\u2195' }}</span>
                </th>
                <th class="text-center th-atencion sortable-col" (click)="ordenarAnalistas('atencion')">
                  ATENCI\xD3N (AMB / INT) <span class="sort-indicator">{{ columnaOrdenAnalista === 'atencion' ? (direccionOrdenAnalista === 'asc' ? '\u2191' : '\u2193') : '' }}</span>
                </th>
                <th class="text-right th-tasa sortable-col" (click)="ordenarAnalistas('recupero')">
                  % RECUPERO <span class="sort-indicator">{{ columnaOrdenAnalista === 'recupero' ? (direccionOrdenAnalista === 'asc' ? '\u2191' : '\u2193') : '\u2195' }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let a of analistasDatos; trackBy: trackByAnalista">

                <!-- NIVEL 1: Analista -->
                <tr class="tr-analista" (click)="toggleAnalista(a)" [class.is-expanded]="a.expanded">
                  <td class="text-center td-btn-box">
                    <button type="button" class="btn-toggle-box" [class.is-expanded]="a.expanded" (click)="toggleAnalista(a); $event.stopPropagation()">
                      {{ a.expanded ? '\u2212' : '+' }}
                    </button>
                  </td>
                  <td class="td-tree-node td-analista">
                    <span class="analista-nombre">{{ a.analista }}</span>
                  </td>
                  <td class="text-center font-weight-bold">
                    <span class="badge-docs-analista">{{ a.cantidadRegistros }}</span>
                  </td>
                  <td class="text-right font-weight-bold color-aceptado">
                    {{ a.debitosAceptados | currency:'ARS':'symbol-narrow':'1.0-0':'es-AR' }}
                  </td>
                  <td class="text-right font-weight-bold color-refacturado">
                    {{ a.debitosRefacturados | currency:'ARS':'symbol-narrow':'1.0-0':'es-AR' }}
                  </td>
                  <td class="text-right font-weight-bold color-ticket-promedio">
                    {{ a.ticketPromedio | currency:'ARS':'symbol-narrow':'1.0-0':'es-AR' }}
                  </td>
                  <td class="text-center">
                    <span class="badge-atencion">
                      {{ a.distribucionAtencion || '100% Amb / 0% Int' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <span class="badge-recupero"
                          [class.recupero-alto]="a.tasaRecupero >= 50"
                          [class.recupero-medio]="a.tasaRecupero > 0 && a.tasaRecupero < 50"
                          [class.recupero-cero]="a.tasaRecupero === 0">
                      {{ a.tasaRecupero | number:'1.1-1' }}%
                    </span>
                  </td>
                </tr>

                <!-- NIVEL 2: Motivos (solo si analista est\xE1 expandido) -->
                <ng-container *ngIf="a.expanded">
                  <tr class="tr-sub-header tr-sub-header-motivo">
                    <th colspan="2" class="td-sub-header-title">\u21B3 Motivo de D\xE9bito</th>
                    <th class="text-center td-sub-header-col">Casos</th>
                    <th class="text-right td-sub-header-col">Monto Debitado</th>
                    <th class="text-right td-sub-header-col">Aceptado</th>
                    <th class="text-right td-sub-header-col">Refacturado</th>
                    <th class="text-center td-sub-header-col">Atenci\xF3n (AMB / INT)</th>
                    <th class="text-right td-sub-header-col">% Rec.</th>
                  </tr>

                  <ng-container *ngFor="let m of a.motivos; trackBy: trackByMotivo">
                    <tr class="tr-motivo" (click)="toggleMotivo(m)" [class.is-expanded]="m.expanded">
                      <td colspan="2" class="td-tree-node td-motivo">
                        <button type="button" class="btn-toggle-expand btn-toggle-sm" [class.is-expanded]="m.expanded">
                          {{ m.expanded ? '\u25BC' : '\u25B6' }}
                        </button>
                        <span class="motivo-icon">\u{1F4CB}</span>
                        <span class="motivo-tag">{{ m.motivo }}</span>
                        <span class="badge-count">{{ m.financiadores.length }} financiadores</span>
                      </td>
                      <td class="text-center font-weight-bold">{{ m.casos }}</td>
                      <td class="text-right font-weight-bold color-facturado">
                        {{ m.montoDebitado | currency:'ARS':'symbol-narrow':'1.0-0':'es-AR' }}
                      </td>
                      <td class="text-right color-aceptado">
                        {{ m.aceptado | currency:'ARS':'symbol-narrow':'1.0-0':'es-AR' }}
                      </td>
                      <td class="text-right color-refacturado">
                        {{ m.refacturado | currency:'ARS':'symbol-narrow':'1.0-0':'es-AR' }}
                      </td>
                      <td class="text-center">
                        <span class="badge-atencion badge-atencion-sm" *ngIf="m.distribucionAtencion">
                          {{ m.distribucionAtencion }}
                        </span>
                        <span class="text-muted" *ngIf="!m.distribucionAtencion">\u2014</span>
                      </td>
                      <td class="text-right">
                        <span class="badge-recupero badge-recupero-sm"
                              [class.recupero-alto]="m.montoDebitado > 0 && (m.refacturado * 100 / m.montoDebitado) >= 50"
                              [class.recupero-medio]="m.montoDebitado > 0 && (m.refacturado * 100 / m.montoDebitado) > 0 && (m.refacturado * 100 / m.montoDebitado) < 50"
                              [class.recupero-cero]="m.refacturado === 0">
                          {{ (m.montoDebitado > 0 ? (m.refacturado * 100 / m.montoDebitado) : 0) | number:'1.1-1' }}%
                        </span>
                      </td>
                    </tr>

                    <!-- NIVEL 3: Financiadores Afectados (solo si motivo y analista est\xE1n expandidos) -->
                    <ng-container *ngIf="m.expanded">
                      <tr class="tr-sub-header tr-sub-header-financiador">
                        <th colspan="2" class="td-sub-header-sub-title">\u2514\u2500\u2500 Financiador Afectado</th>
                        <th class="text-center td-sub-header-col">Casos</th>
                        <th colspan="4" class="text-right td-sub-header-col">Monto</th>
                        <th class="text-center td-sub-header-col">\u2014</th>
                      </tr>

                      <tr *ngFor="let fin of m.financiadores; trackBy: trackByFinanciadorAnalista" class="tr-financiador-sub">
                        <td colspan="2" class="td-tree-node td-financiador-sub-item">
                          <span class="tree-branch">\u2514\u2500</span>
                          <span class="financiador-icon">\u{1F3E2}</span>
                          <strong class="financiador-nombre-sub">{{ fin.financiador }}</strong>
                        </td>
                        <td class="text-center text-muted">{{ fin.casos }}</td>
                        <td colspan="4" class="text-right font-weight-bold color-facturado">
                          {{ fin.monto | currency:'ARS':'symbol-narrow':'1.0-0':'es-AR' }}
                        </td>
                        <td class="text-center text-muted">\u2014</td>
                      </tr>
                    </ng-container>

                  </ng-container>
                </ng-container>

              </ng-container>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  </div><!-- /tab-pane analistas -->

  <!-- =====================================================================
       SOLAPA 7: BUCLES DE INSISTENCIA
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'bucles'">
    <section class="grid-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">\u2B55 Auditor\xEDa de Bucles de Insistencia</h2>
            <p class="section-subtitle">Prestaciones cr\xEDticas con 2 o m\xE1s d\xE9bitos recibidos (NC) tras intentos de refacturaci\xF3n.</p>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="cargandoBucles" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando bucles de insistencia...</p>
        </div>

        <!-- Estado Vac\xEDo -->
        <div *ngIf="!cargandoBucles && buclesDatos.length === 0" class="empty-state">
          <span class="empty-icon">\u2705</span>
          <p>No se detectaron bucles de insistencia (expedientes con 2 o m\xE1s d\xE9bitos NC) para los filtros seleccionados.</p>
        </div>

        <!-- Tabla Principal de Bucles -->
        <div *ngIf="!cargandoBucles && buclesDatos.length > 0" class="table-responsive">
          <table class="table-sanatorial table-bordered">
            <thead>
              <tr>
                <th style="width: 45px;" class="text-center"></th>
                <th>Prestaci\xF3n / Detalle</th>
                <th>Financiador</th>
                <th>M\xE9dico</th>
                <th class="text-right">Facturado</th>
                <th class="text-right">D\xE9bitos</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let cadena of buclesDatos; trackBy: trackByCadena">
                <!-- Fila Principal (Nivel 1) -->
                <tr class="tr-parent-nivel1" (click)="toggleCadena(cadena)" [class.is-expanded]="cadena.expanded">
                  <td class="text-center">
                    <button type="button" class="btn-toggle-expand" [class.is-expanded]="cadena.expanded" (click)="$event.stopPropagation(); toggleCadena(cadena)">
                      \u25B6
                    </button>
                  </td>
                  <td>
                    <strong class="comprobante-numero">{{ cadena.idPrestacion }}</strong>
                    <div class="text-muted" style="font-size: 0.78rem;">{{ cadena.descripcion }}</div>
                  </td>
                  <td>
                    <span>{{ cadena.financiador }}</span>
                  </td>
                  <td>
                    <span class="badge-medico" style="font-size: 0.8rem; color: #475569;">{{ cadena.medico }}</span>
                  </td>
                  <td class="text-right color-facturado font-weight-bold">
                    {{ cadena.montoFacturadoOriginal | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right color-aceptado font-weight-bold">
                    {{ cadena.totalDebitado > 0 ? (cadena.totalDebitado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                  </td>
                </tr>

                <!-- Fila Colapsable de Eventos (Nivel 2) -->
                <tr class="tr-child-nivel2" *ngIf="cadena.expanded">
                  <td colspan="6" class="td-child-container">
                    <div class="chain-wrapper">
                      <div class="chain-header-info">
                        <span class="chain-badge-expediente">Expediente: {{ cadena.idPrestacion }}</span>
                        <span class="chain-badge-medico" *ngIf="cadena.medico && cadena.medico !== 'No especificado'">M\xE9dico: {{ cadena.medico }}</span>
                        <span class="chain-total-eventos">{{ cadena.historialEventos.length }} evento(s) en la cadena</span>
                      </div>

                      <div class="chain-timeline">
                        <div class="chain-step" *ngFor="let evento of cadena.historialEventos; trackBy: trackByEvento">
                          <div class="chain-node" [ngClass]="obtenerClaseNodo(evento.tipo)">
                            {{ evento.tipo }}
                          </div>
                          <div class="chain-connector"></div>
                          <div class="chain-card">
                            <div class="chain-card-header">
                              <strong class="chain-comprobante">{{ evento.comprobante }}</strong>
                              <span class="chain-fecha">{{ evento.fecha | date:'dd/MM/yyyy' }}</span>
                            </div>
                            <div class="chain-card-body">
                              <span class="chain-desc">{{ evento.descripcion }}</span>
                              <span class="chain-monto" [ngClass]="obtenerClaseMonto(evento.tipo)">
                                {{ evento.monto | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                              </span>
                            </div>
                            <div class="chain-card-footer" *ngIf="evento.responsable">
                              <small class="chain-responsable">\u{1F464} {{ evento.responsable }}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  </div><!-- /tab-pane bucles -->

  <!-- =====================================================================
       SOLAPA 8: USUARIO DE CARGA (3 NIVELES)
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'usuarios-carga'">
    <section class="grid-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">\u{1F4C7} Desempe\xF1o por Usuarios de Carga (Operadores)</h2>
            <p class="section-subtitle">
              Auditor\xEDa de emisi\xF3n original a 3 niveles: Nivel 1 (Operador FC) \u2794 Nivel 2 (Motivo de D\xE9bito) \u2794 Nivel 3 (Financiador Afectado).
            </p>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="cargandoOperadores" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando m\xE9tricas de operadores de carga...</p>
        </div>

        <!-- Estado Vac\xEDo -->
        <div *ngIf="!cargandoOperadores && operadoresDatos.length === 0" class="empty-state">
          <span class="empty-icon">\u{1F4C1}</span>
          <p>No se encontraron d\xE9bitos vinculados a operadores de carga en el per\xEDodo seleccionado.</p>
        </div>

        <!-- Tabla Sanatorial Operadores a 3 Niveles -->
        <div *ngIf="!cargandoOperadores && operadoresDatos.length > 0" class="table-responsive">
          <table class="table-sanatorial table-bordered table-analistas">
            <thead>
              <tr>
                <th class="th-analista">Operador / Motivo / Financiador</th>
                <th class="text-right th-casos">Documentos</th>
                <th class="text-right th-monto">Aceptados (P\xE9rdida)</th>
                <th class="text-right th-monto">Refacturados</th>
                <th class="text-right th-monto">Ticket Promedio</th>
                <th class="text-right th-tasa">% Recupero</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let op of operadoresDatos; trackBy: trackByOperador">

                <!-- NIVEL 1: Operador -->
                <tr class="tr-analista tr-operador" (click)="toggleOperador(op)" [class.is-expanded]="op.expanded">
                  <td class="td-tree-node td-analista">
                    <button type="button" class="btn-toggle-expand" [class.is-expanded]="op.expanded">
                      {{ op.expanded ? '\u25BC' : '\u25B6' }}
                    </button>
                    <span class="analista-icon">\u{1F4BB}</span>
                    <span class="analista-nombre">{{ op.operador }}</span>
                    <span class="badge-count">{{ op.motivos.length }} motivos</span>
                  </td>
                  <td class="text-right font-weight-bold">
                    {{ op.cantidadRegistros }}
                  </td>
                  <td class="text-right font-weight-bold color-aceptado">
                    {{ op.debitosAceptados | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right font-weight-bold color-refacturado">
                    {{ op.debitosRefacturados | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right font-weight-bold color-ticket">
                    {{ op.ticketPromedio | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right">
                    <span class="badge-recupero"
                          [class.recupero-alto]="op.tasaRecupero >= 50"
                          [class.recupero-medio]="op.tasaRecupero > 0 && op.tasaRecupero < 50"
                          [class.recupero-cero]="op.tasaRecupero === 0">
                      {{ op.tasaRecupero | number:'1.1-1' }}%
                    </span>
                  </td>
                </tr>

                <!-- NIVEL 2: Motivos (solo si operador est\xE1 expandido) -->
                <ng-container *ngIf="op.expanded">
                  <tr class="tr-sub-header tr-sub-header-motivo">
                    <th class="td-sub-header-title">\u21B3 Motivo de D\xE9bito</th>
                    <th class="text-right td-sub-header-col">Casos</th>
                    <th class="text-right td-sub-header-col">Monto Debitado</th>
                    <th class="text-right td-sub-header-col">Aceptado</th>
                    <th class="text-right td-sub-header-col">Refacturado</th>
                    <th class="text-right td-sub-header-col">% Rec.</th>
                  </tr>

                  <ng-container *ngFor="let m of op.motivos; trackBy: trackByMotivo">
                    <tr class="tr-motivo" (click)="toggleMotivo(m)" [class.is-expanded]="m.expanded">
                      <td class="td-tree-node td-motivo">
                        <button type="button" class="btn-toggle-expand btn-toggle-sm" [class.is-expanded]="m.expanded">
                          {{ m.expanded ? '\u25BC' : '\u25B6' }}
                        </button>
                        <span class="motivo-icon">\u{1F4CB}</span>
                        <span class="motivo-tag">{{ m.motivo }}</span>
                        <span class="badge-count">{{ m.financiadores.length }} financiadores</span>
                      </td>
                      <td class="text-right">{{ m.casos }}</td>
                      <td class="text-right font-weight-bold color-facturado">
                        {{ m.montoDebitado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-aceptado">
                        {{ m.aceptado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-refacturado">
                        {{ m.refacturado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right">
                        <span class="badge-recupero badge-recupero-sm"
                              [class.recupero-alto]="m.montoDebitado > 0 && (m.refacturado * 100 / m.montoDebitado) >= 50"
                              [class.recupero-medio]="m.montoDebitado > 0 && (m.refacturado * 100 / m.montoDebitado) > 0 && (m.refacturado * 100 / m.montoDebitado) < 50"
                              [class.recupero-cero]="m.refacturado === 0">
                          {{ (m.montoDebitado > 0 ? (m.refacturado * 100 / m.montoDebitado) : 0) | number:'1.1-1' }}%
                        </span>
                      </td>
                    </tr>

                    <!-- NIVEL 3: Financiadores Afectados (solo si motivo y operador est\xE1n expandidos) -->
                    <ng-container *ngIf="m.expanded">
                      <tr class="tr-sub-header tr-sub-header-financiador">
                        <th class="td-sub-header-sub-title">\u2514\u2500\u2500 Financiador Afectado</th>
                        <th class="text-right td-sub-header-col">Casos</th>
                        <th colspan="3" class="text-right td-sub-header-col">Monto</th>
                        <th class="text-center td-sub-header-col">\u2014</th>
                      </tr>

                      <tr *ngFor="let fin of m.financiadores; trackBy: trackByFinanciadorAnalista" class="tr-financiador-sub">
                        <td class="td-tree-node td-financiador-sub-item">
                          <span class="tree-branch">\u2514\u2500</span>
                          <span class="financiador-icon">\u{1F3E2}</span>
                          <strong class="financiador-nombre-sub">{{ fin.financiador }}</strong>
                        </td>
                        <td class="text-right text-muted">{{ fin.casos }}</td>
                        <td colspan="3" class="text-right font-weight-bold color-facturado">
                          {{ fin.monto | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                        </td>
                        <td class="text-center text-muted">\u2014</td>
                      </tr>
                    </ng-container>

                  </ng-container>
                </ng-container>

              </ng-container>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  </div><!-- /tab-pane usuarios-carga -->

  <!-- =====================================================================
       SOLAPA 9: PRESTADORES / M\xC9DICOS (3 NIVELES)
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'medicos'">
    <section class="grid-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">\u{1F468}\u200D\u2695\uFE0F Desempe\xF1o por Prestadores / M\xE9dicos</h2>
            <p class="section-subtitle">
              Auditor\xEDa m\xE9dica a 3 niveles: Nivel 1 (M\xE9dico) \u2794 Nivel 2 (Motivo de D\xE9bito) \u2794 Nivel 3 (Financiador Afectado).
            </p>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="cargandoMedicos" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando m\xE9tricas de m\xE9dicos / prestadores...</p>
        </div>

        <!-- Estado Vac\xEDo -->
        <div *ngIf="!cargandoMedicos && medicosDatos.length === 0" class="empty-state">
          <span class="empty-icon">\u{1F4C1}</span>
          <p>No se encontraron d\xE9bitos registrados para los m\xE9dicos en el per\xEDodo seleccionado.</p>
        </div>

        <!-- Tabla Sanatorial M\xE9dicos a 3 Niveles -->
        <div *ngIf="!cargandoMedicos && medicosDatos.length > 0" class="table-responsive">
          <table class="table-sanatorial table-bordered table-analistas">
            <thead>
              <tr>
                <th class="th-analista">M\xE9dico / Motivo / Financiador</th>
                <th class="text-right th-casos">Documentos</th>
                <th class="text-right th-monto">Aceptados (P\xE9rdida)</th>
                <th class="text-right th-monto">Refacturados</th>
                <th class="text-right th-monto">Ticket Promedio</th>
                <th class="text-right th-tasa">% Recupero</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let med of medicosDatos; trackBy: trackByMedico">

                <!-- NIVEL 1: M\xE9dico -->
                <tr class="tr-analista tr-medico" (click)="toggleMedico(med)" [class.is-expanded]="med.expanded">
                  <td class="td-tree-node td-analista">
                    <button type="button" class="btn-toggle-expand" [class.is-expanded]="med.expanded">
                      {{ med.expanded ? '\u25BC' : '\u25B6' }}
                    </button>
                    <span class="analista-icon">\u{1FA7A}</span>
                    <span class="analista-nombre">{{ med.medico }}</span>
                    <span class="badge-count">{{ med.motivos.length }} motivos</span>
                  </td>
                  <td class="text-right font-weight-bold">
                    {{ med.cantidadRegistros }}
                  </td>
                  <td class="text-right font-weight-bold color-aceptado">
                    {{ med.debitosAceptados | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right font-weight-bold color-refacturado">
                    {{ med.debitosRefacturados | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right font-weight-bold color-ticket">
                    {{ med.ticketPromedio | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right">
                    <span class="badge-recupero"
                          [class.recupero-alto]="med.tasaRecupero >= 50"
                          [class.recupero-medio]="med.tasaRecupero > 0 && med.tasaRecupero < 50"
                          [class.recupero-cero]="med.tasaRecupero === 0">
                      {{ med.tasaRecupero | number:'1.1-1' }}%
                    </span>
                  </td>
                </tr>

                <!-- NIVEL 2: Motivos (solo si m\xE9dico est\xE1 expandido) -->
                <ng-container *ngIf="med.expanded">
                  <tr class="tr-sub-header tr-sub-header-motivo">
                    <th class="td-sub-header-title">\u21B3 Motivo de D\xE9bito</th>
                    <th class="text-right td-sub-header-col">Casos</th>
                    <th class="text-right td-sub-header-col">Monto Debitado</th>
                    <th class="text-right td-sub-header-col">Aceptado</th>
                    <th class="text-right td-sub-header-col">Refacturado</th>
                    <th class="text-right td-sub-header-col">% Rec.</th>
                  </tr>

                  <ng-container *ngFor="let m of med.motivos; trackBy: trackByMotivo">
                    <tr class="tr-motivo" (click)="toggleMotivo(m)" [class.is-expanded]="m.expanded">
                      <td class="td-tree-node td-motivo">
                        <button type="button" class="btn-toggle-expand btn-toggle-sm" [class.is-expanded]="m.expanded">
                          {{ m.expanded ? '\u25BC' : '\u25B6' }}
                        </button>
                        <span class="motivo-icon">\u{1F4CB}</span>
                        <span class="motivo-tag">{{ m.motivo }}</span>
                        <span class="badge-count">{{ m.financiadores.length }} financiadores</span>
                      </td>
                      <td class="text-right">{{ m.casos }}</td>
                      <td class="text-right font-weight-bold color-facturado">
                        {{ m.montoDebitado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-aceptado">
                        {{ m.aceptado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right color-refacturado">
                        {{ m.refacturado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                      </td>
                      <td class="text-right">
                        <span class="badge-recupero badge-recupero-sm"
                              [class.recupero-alto]="m.montoDebitado > 0 && (m.refacturado * 100 / m.montoDebitado) >= 50"
                              [class.recupero-medio]="m.montoDebitado > 0 && (m.refacturado * 100 / m.montoDebitado) > 0 && (m.refacturado * 100 / m.montoDebitado) < 50"
                              [class.recupero-cero]="m.refacturado === 0">
                          {{ (m.montoDebitado > 0 ? (m.refacturado * 100 / m.montoDebitado) : 0) | number:'1.1-1' }}%
                        </span>
                      </td>
                    </tr>

                    <!-- NIVEL 3: Financiadores Afectados (solo si motivo y m\xE9dico est\xE1n expandidos) -->
                    <ng-container *ngIf="m.expanded">
                      <tr class="tr-sub-header tr-sub-header-financiador">
                        <th class="td-sub-header-sub-title">\u2514\u2500\u2500 Financiador Afectado</th>
                        <th class="text-right td-sub-header-col">Casos</th>
                        <th colspan="3" class="text-right td-sub-header-col">Monto</th>
                        <th class="text-center td-sub-header-col">\u2014</th>
                      </tr>

                      <tr *ngFor="let fin of m.financiadores; trackBy: trackByFinanciadorAnalista" class="tr-financiador-sub">
                        <td class="td-tree-node td-financiador-sub-item">
                          <span class="tree-branch">\u2514\u2500</span>
                          <span class="financiador-icon">\u{1F3E2}</span>
                          <strong class="financiador-nombre-sub">{{ fin.financiador }}</strong>
                        </td>
                        <td class="text-right text-muted">{{ fin.casos }}</td>
                        <td colspan="3" class="text-right font-weight-bold color-facturado">
                          {{ fin.monto | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                        </td>
                        <td class="text-center text-muted">\u2014</td>
                      </tr>
                    </ng-container>

                  </ng-container>
                </ng-container>

              </ng-container>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  </div><!-- /tab-pane medicos -->

  <!-- =====================================================================
       SOLAPA 10: DETALLE Y TRAZABILIDAD (\xC1RBOL ENCADENADO)
       ===================================================================== -->
  <div class="dashboard-tab-pane" [hidden]="solapaActiva !== 'trazabilidad'">
    <section class="grid-section">
      <div class="section-card">
        <div class="section-card-header">
          <div>
            <h2 class="section-title">\u{1F517} Detalle y Trazabilidad (\xC1rbol Encadenado)</h2>
            <p class="section-subtitle">Historial cronol\xF3gico de vida de expedientes: Facturaci\xF3n (FC) \u2794 D\xE9bitos (NC) \u2794 Refacturaci\xF3n / Incremento (ND) \u2794 Cobranza (RC).</p>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="cargandoTrazabilidad" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando trazabilidad de expedientes...</p>
        </div>

        <!-- Estado Vac\xEDo -->
        <div *ngIf="!cargandoTrazabilidad && trazabilidadDatos.length === 0" class="empty-state">
          <span class="empty-icon">\u{1F4C1}</span>
          <p>No se encontraron expedientes vinculados para los filtros seleccionados.</p>
        </div>

        <!-- Tabla Principal de Cadenas -->
        <div *ngIf="!cargandoTrazabilidad && trazabilidadDatos.length > 0" class="table-responsive">
          <table class="table-sanatorial table-bordered">
            <thead>
              <tr>
                <th style="width: 45px;" class="text-center"></th>
                <th>Prestaci\xF3n / Detalle</th>
                <th>Financiador</th>
                <th>M\xE9dico</th>
                <th class="text-right">Facturado</th>
                <th class="text-right">D\xE9bitos</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let cadena of trazabilidadDatos; trackBy: trackByCadena">
                <!-- Fila Principal (Nivel 1) -->
                <tr class="tr-parent-nivel1" (click)="toggleCadena(cadena)" [class.is-expanded]="cadena.expanded">
                  <td class="text-center">
                    <button type="button" class="btn-toggle-expand" [class.is-expanded]="cadena.expanded" (click)="$event.stopPropagation(); toggleCadena(cadena)">
                      \u25B6
                    </button>
                  </td>
                  <td>
                    <strong class="comprobante-numero">{{ cadena.idPrestacion }}</strong>
                    <div class="text-muted" style="font-size: 0.78rem;">{{ cadena.descripcion }}</div>
                  </td>
                  <td>
                    <span>{{ cadena.financiador }}</span>
                  </td>
                  <td>
                    <span class="badge-medico" style="font-size: 0.8rem; color: #475569;">{{ cadena.medico }}</span>
                  </td>
                  <td class="text-right color-facturado font-weight-bold">
                    {{ cadena.montoFacturadoOriginal | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                  </td>
                  <td class="text-right color-aceptado font-weight-bold">
                    {{ cadena.totalDebitado > 0 ? (cadena.totalDebitado | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR') : '\u2014' }}
                  </td>
                </tr>

                <!-- Fila Colapsable de Eventos (Nivel 2) -->
                <tr class="tr-child-nivel2" *ngIf="cadena.expanded">
                  <td colspan="6" class="td-child-container">
                    <div class="chain-wrapper">
                      <div class="chain-header-info">
                        <span class="chain-badge-expediente">Expediente: {{ cadena.idPrestacion }}</span>
                        <span class="chain-badge-medico" *ngIf="cadena.medico && cadena.medico !== 'No especificado'">M\xE9dico: {{ cadena.medico }}</span>
                        <span class="chain-total-eventos">{{ cadena.historialEventos.length }} evento(s) en la cadena</span>
                      </div>

                      <div class="chain-timeline">
                        <div class="chain-step" *ngFor="let evento of cadena.historialEventos; trackBy: trackByEvento">
                          <div class="chain-node" [ngClass]="obtenerClaseNodo(evento.tipo)">
                            {{ evento.tipo }}
                          </div>
                          <div class="chain-connector"></div>
                          <div class="chain-card">
                            <div class="chain-card-header">
                              <strong class="chain-comprobante">{{ evento.comprobante }}</strong>
                              <span class="chain-fecha">{{ evento.fecha | date:'dd/MM/yyyy' }}</span>
                            </div>
                            <div class="chain-card-body">
                              <span class="chain-desc">{{ evento.descripcion }}</span>
                              <span class="chain-monto" [ngClass]="obtenerClaseMonto(evento.tipo)">
                                {{ evento.monto | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}
                              </span>
                            </div>
                            <div class="chain-card-footer" *ngIf="evento.responsable">
                              <small class="chain-responsable">\u{1F464} {{ evento.responsable }}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  </div><!-- /tab-pane trazabilidad -->

</div>`, styles: ['/* src/app/features/directorio/directorio-dashboard.component.css */\n.directorio-container {\n  max-width: 1780px;\n  width: 100%;\n  margin: 0 auto;\n  padding: 1.5rem 1.25rem 3rem 1.25rem;\n  color: #1e293b;\n  font-family:\n    system-ui,\n    -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    Roboto,\n    Oxygen,\n    Ubuntu,\n    Cantarell,\n    sans-serif;\n}\n.directorio-header {\n  margin-bottom: 2rem;\n}\n.header-badge-row {\n  display: flex;\n  gap: 0.6rem;\n  align-items: center;\n  margin-bottom: 0.5rem;\n}\n.badge-modulo {\n  background:\n    linear-gradient(\n      135deg,\n      #4f46e5,\n      #7c3aed);\n  color: #ffffff;\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n  text-transform: uppercase;\n}\n.badge-readonly {\n  background: #f1f5f9;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n  font-size: 0.72rem;\n  font-weight: 600;\n  padding: 0.2rem 0.6rem;\n  border-radius: 6px;\n}\n.main-title {\n  font-size: 1.85rem;\n  font-weight: 800;\n  color: #0f172a;\n  margin: 0 0 0.35rem 0;\n  letter-spacing: -0.02em;\n}\n.subtitle {\n  color: #64748b;\n  font-size: 0.95rem;\n  margin: 0 0 1.25rem 0;\n}\n.directorio-tab-strip {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.25rem 0.5rem;\n  background: #ffffff;\n  border-bottom: 2px solid #e2e8f0;\n  padding: 0.35rem 0.6rem 0 0.6rem;\n  margin-bottom: 1.5rem;\n  border-radius: 8px 8px 0 0;\n}\n.tab-strip-item {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.45rem;\n  padding: 0.65rem 0.85rem;\n  background: transparent;\n  border: none;\n  border-bottom: 3px solid transparent;\n  color: #475569;\n  font-size: 0.84rem;\n  font-weight: 600;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: all 0.15s ease-in-out;\n  margin-bottom: -2px;\n  border-radius: 4px 4px 0 0;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.tab-strip-item:hover {\n  color: #1d4ed8;\n  background-color: #f8fafc;\n}\n.tab-strip-item.active {\n  color: #2563eb;\n  font-weight: 700;\n  border-bottom: 3px solid #2563eb;\n  background-color: transparent;\n}\n.tab-strip-icon {\n  font-size: 0.95rem;\n  display: inline-flex;\n  align-items: center;\n  line-height: 1;\n}\n.tab-strip-text {\n  letter-spacing: -0.01em;\n}\n.grafico-card--fullwidth {\n  grid-column: 1 / -1;\n  width: 100%;\n}\n.sub-filter-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 0.75rem 1.25rem;\n  margin-bottom: 1.5rem;\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  flex-wrap: wrap;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);\n}\n.sub-filter-title {\n  font-size: 0.8rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #64748b;\n  white-space: nowrap;\n}\n.sub-filter-pills {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n  flex-wrap: wrap;\n}\n.sub-pill {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding: 0.4rem 0.85rem;\n  border-radius: 8px;\n  border: 1px solid #cbd5e1;\n  background: #f8fafc;\n  color: #334155;\n  font-size: 0.82rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.15s ease-in-out;\n}\n.sub-pill:hover {\n  background: #e2e8f0;\n  color: #0f172a;\n}\n.sub-pill.active {\n  background: #0284c7;\n  color: #ffffff;\n  border-color: #0284c7;\n  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.28);\n}\n.sub-pill .pill-icon {\n  font-size: 0.95rem;\n}\n.dashboard-tab-pane {\n  animation: fadeInPane 0.22s ease-out;\n}\n@keyframes fadeInPane {\n  from {\n    opacity: 0;\n    transform: translateY(4px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.graficos-grid--single {\n  grid-template-columns: 1fr !important;\n}\n.graficos-grid--single .grafico-card {\n  min-height: 420px;\n}\n.filter-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.25rem 1.5rem;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: flex-end;\n  gap: 1.25rem;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);\n}\n.filter-group {\n  display: flex;\n  flex-direction: column;\n  gap: 0.4rem;\n  flex: 1;\n  min-width: 200px;\n}\n.filter-group label {\n  font-size: 0.78rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #475569;\n}\n.form-control {\n  border: 1px solid #cbd5e1;\n  background-color: #f8fafc;\n  color: #0f172a;\n  padding: 0.55rem 0.85rem;\n  border-radius: 8px;\n  font-size: 0.9rem;\n  outline: none;\n  transition: all 0.2s ease;\n}\n.form-control:focus {\n  border-color: #3b82f6;\n  background-color: #ffffff;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);\n}\n.filter-actions {\n  display: flex;\n  gap: 0.6rem;\n  align-items: center;\n}\n.btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding: 0.58rem 1.1rem;\n  font-size: 0.88rem;\n  font-weight: 600;\n  border-radius: 8px;\n  cursor: pointer;\n  border: none;\n  transition: all 0.2s ease;\n}\n.btn-primary {\n  background:\n    linear-gradient(\n      135deg,\n      #2563eb,\n      #1d4ed8);\n  color: #ffffff;\n  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);\n}\n.btn-primary:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #1d4ed8,\n      #1e40af);\n  transform: translateY(-1px);\n}\n.btn-secondary {\n  background: #f1f5f9;\n  color: #334155;\n  border: 1px solid #cbd5e1;\n}\n.btn-secondary:hover {\n  background: #e2e8f0;\n  color: #0f172a;\n}\n.btn-outline-sm {\n  background: transparent;\n  color: #475569;\n  border: 1px solid #cbd5e1;\n  font-size: 0.78rem;\n  padding: 0.35rem 0.75rem;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.btn-outline-sm:hover {\n  background: #f1f5f9;\n  color: #0f172a;\n}\n.kpi-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n  gap: 1.25rem;\n  margin-bottom: 2rem;\n}\n.kpi-grid--six {\n  grid-template-columns: repeat(6, minmax(0, 1fr));\n  gap: 0.85rem;\n}\n@media (max-width: 1400px) {\n  .kpi-grid--six {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n}\n@media (max-width: 768px) {\n  .kpi-grid--six {\n    grid-template-columns: repeat(1, minmax(0, 1fr));\n  }\n}\n.kpi-card {\n  background: #ffffff;\n  border-radius: 12px;\n  padding: 1.15rem 1.25rem;\n  border: 1px solid #e2e8f0;\n  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);\n  position: relative;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n.kpi-card:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.07);\n}\n.card-facturacion-fc {\n  border: 2.5px solid #2563eb !important;\n}\n.card-incrementos-nd {\n  border: 2.5px solid #f59e0b !important;\n}\n.card-debitos-nc {\n  border: 2.5px solid #ef4444 !important;\n}\n.card-refacturacion-nd {\n  border: 2.5px solid #06b6d4 !important;\n}\n.card-cobranzas-rc {\n  border: 2.5px solid #16a34a !important;\n}\n.card-saldo-real {\n  border: 2.5px solid #0f172a !important;\n}\n.kpi-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.45rem;\n}\n.kpi-title {\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  color: #475569;\n  text-transform: uppercase;\n}\n.kpi-value {\n  font-size: 1.55rem;\n  font-weight: 800;\n  color: #0f172a;\n  margin-bottom: 0.45rem;\n  letter-spacing: -0.02em;\n  white-space: nowrap;\n}\n.kpi-val-fc {\n  color: #2563eb;\n}\n.kpi-val-nd {\n  color: #b45309;\n}\n.kpi-val-nc {\n  color: #dc2626;\n}\n.kpi-val-ref {\n  color: #0284c7;\n}\n.kpi-val-rc {\n  color: #16a34a;\n}\n.kpi-val-saldo {\n  color: #0f172a;\n}\n.kpi-footer-simple {\n  font-size: 0.74rem;\n  color: #64748b;\n  font-weight: 500;\n}\n.kpi-footer {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 0.8rem;\n  color: #64748b;\n  border-top: 1px solid #f1f5f9;\n  padding-top: 0.6rem;\n}\n.kpi-count {\n  font-weight: 600;\n  color: #3b82f6;\n}\n.kpi-badge-positive {\n  background: #dcfce7;\n  color: #166534;\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n}\n.kpi-badge-negative {\n  background: #fee2e2;\n  color: #991b1b;\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n}\n.kpi-formula {\n  font-size: 0.72rem;\n  font-family: monospace;\n  background: #f1f5f9;\n  padding: 0.2rem 0.45rem;\n  border-radius: 4px;\n  color: #475569;\n}\n.skeleton-text {\n  color: #94a3b8;\n  font-size: 1rem;\n  font-style: italic;\n}\n.section-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 14px;\n  padding: 1.5rem;\n  margin-bottom: 2rem;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);\n}\n.section-card-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  flex-wrap: wrap;\n  gap: 1rem;\n  margin-bottom: 1.5rem;\n  padding-bottom: 1rem;\n  border-bottom: 1px solid #f1f5f9;\n}\n.section-title {\n  font-size: 1.25rem;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0 0 0.25rem 0;\n}\n.section-subtitle {\n  color: #64748b;\n  font-size: 0.85rem;\n  margin: 0;\n}\n.total-debitado-badge {\n  background: #f8fafc;\n  border: 1px solid #cbd5e1;\n  padding: 0.4rem 0.85rem;\n  border-radius: 8px;\n  font-size: 0.85rem;\n  color: #334155;\n}\n.total-debitado-badge strong {\n  color: #dc2626;\n  font-size: 0.95rem;\n}\n.loading-state,\n.empty-state {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 3rem 1rem;\n  color: #64748b;\n  text-align: center;\n}\n.spinner {\n  width: 32px;\n  height: 32px;\n  border: 3px solid #e2e8f0;\n  border-top-color: #3b82f6;\n  border-radius: 50%;\n  animation: spin 0.8s linear infinite;\n  margin-bottom: 0.75rem;\n}\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.empty-icon {\n  font-size: 2.2rem;\n  margin-bottom: 0.5rem;\n}\n.chart-layout {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 2rem;\n  align-items: center;\n}\n.donut-container {\n  flex: 0 0 300px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n}\n.donut-svg {\n  width: 100%;\n  max-width: 260px;\n  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.06));\n}\n.donut-slice {\n  cursor: pointer;\n  transition: transform 0.2s ease, opacity 0.2s ease;\n  transform-origin: 100px 100px;\n}\n.donut-slice:hover,\n.donut-slice.slice-active {\n  transform: scale(1.05);\n  opacity: 0.95;\n}\n.donut-center-circle {\n  fill: #ffffff;\n  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));\n}\n.donut-center-title {\n  font-size: 1.15rem;\n  font-weight: 800;\n  fill: #0f172a;\n}\n.donut-center-subtitle {\n  font-size: 0.72rem;\n  font-weight: 600;\n  fill: #64748b;\n}\n.donut-hint {\n  font-size: 0.75rem;\n  color: #64748b;\n  margin-top: 0.75rem;\n  text-align: center;\n}\n.legend-container {\n  flex: 1;\n  min-width: 320px;\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  overflow: hidden;\n}\n.legend-header {\n  display: grid;\n  grid-template-columns: 2.5fr 1.2fr 1fr 1fr;\n  padding: 0.65rem 1rem;\n  background: #f1f5f9;\n  font-size: 0.72rem;\n  font-weight: 700;\n  color: #475569;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  border-bottom: 1px solid #e2e8f0;\n}\n.legend-list {\n  max-height: 280px;\n  overflow-y: auto;\n}\n.legend-item {\n  display: grid;\n  grid-template-columns: 2.5fr 1.2fr 1fr 1fr;\n  align-items: center;\n  padding: 0.65rem 1rem;\n  border-bottom: 1px solid #edf2f7;\n  cursor: pointer;\n  transition: background 0.15s ease;\n}\n.legend-item:hover,\n.legend-item.legend-hover {\n  background: #ffffff;\n  box-shadow: inset 3px 0 0 #3b82f6;\n}\n.legend-col-motivo {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.color-dot {\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  flex-shrink: 0;\n}\n.motivo-nombre {\n  font-size: 0.85rem;\n  font-weight: 600;\n  color: #1e293b;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 220px;\n}\n.casos-badge {\n  font-size: 0.7rem;\n  background: #e2e8f0;\n  color: #475569;\n  padding: 0.1rem 0.35rem;\n  border-radius: 4px;\n}\n.legend-col-monto {\n  font-size: 0.85rem;\n  font-weight: 700;\n  color: #0f172a;\n}\n.legend-col-porc {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.mini-bar-wrapper {\n  flex: 1;\n  height: 6px;\n  background: #e2e8f0;\n  border-radius: 3px;\n  overflow: hidden;\n}\n.mini-bar-fill {\n  height: 100%;\n  border-radius: 3px;\n}\n.porc-text {\n  font-size: 0.78rem;\n  font-weight: 600;\n  color: #475569;\n  min-width: 38px;\n}\n.btn-drilldown {\n  background: #eff6ff;\n  border: 1px solid #bfdbfe;\n  color: #1d4ed8;\n  font-size: 0.75rem;\n  font-weight: 700;\n  padding: 0.25rem 0.6rem;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\n.btn-drilldown:hover {\n  background: #2563eb;\n  color: #ffffff;\n}\n.table-responsive {\n  overflow-x: auto;\n}\n.table-sanatorial {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.88rem;\n  background: #ffffff;\n}\n.table-sanatorial th {\n  background: #f8fafc;\n  color: #475569;\n  font-weight: 700;\n  font-size: 0.75rem;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  padding: 0.75rem 1rem;\n  border-bottom: 2px solid #cbd5e1;\n}\n.table-sanatorial td {\n  padding: 0.7rem 1rem;\n  border-bottom: 1px solid #e2e8f0;\n  color: #1e293b;\n  font-variant-numeric: tabular-nums;\n}\n.tr-financiador {\n  background-color: #f1f5f9;\n  font-weight: 700;\n  cursor: pointer;\n  border-left: 4px solid #3b82f6;\n  transition: background-color 0.15s ease;\n}\n.tr-financiador:hover {\n  background-color: #e2e8f0;\n}\n.tr-financiador.is-expanded {\n  background-color: #e2e8f0;\n  border-left-color: #1d4ed8;\n}\n.td-financiador {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.financiador-icon {\n  font-size: 1rem;\n}\n.financiador-nombre {\n  font-size: 0.92rem;\n  color: #0f172a;\n}\n.tr-periodo {\n  background-color: #f8fafc;\n  font-weight: 600;\n  cursor: pointer;\n  border-left: 4px solid #94a3b8;\n  transition: background-color 0.15s ease;\n}\n.tr-periodo:hover {\n  background-color: #f1f5f9;\n}\n.tr-periodo.is-expanded {\n  background-color: #f1f5f9;\n  border-left-color: #64748b;\n}\n.td-periodo {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding-left: 2rem !important;\n}\n.periodo-icon {\n  font-size: 0.9rem;\n}\n.periodo-tag {\n  font-family: monospace;\n  font-size: 0.88rem;\n  color: #334155;\n  background: #e2e8f0;\n  padding: 0.1rem 0.4rem;\n  border-radius: 4px;\n}\n.tr-factura {\n  background-color: #ffffff;\n  font-size: 0.84rem;\n  font-weight: 600;\n  cursor: pointer;\n  border-left: 4px solid #3b82f6;\n  transition: background-color 0.12s ease;\n}\n.tr-factura:hover {\n  background-color: #f8fafc;\n}\n.tr-factura.is-expanded {\n  background-color: #f0f7ff;\n  border-left-color: #2563eb;\n}\n.td-factura-node {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n  padding-left: 3rem !important;\n}\n.tr-comprobante-hijo {\n  background-color: #f8fafc;\n  font-size: 0.82rem;\n  transition: background-color 0.12s ease;\n  border-left: 4px solid #e2e8f0;\n}\n.tr-comprobante-hijo:hover {\n  background-color: #f1f5f9;\n}\n.td-comprobante-hijo-node {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n}\n.tree-branch {\n  display: inline-block;\n  width: 18px;\n  color: #94a3b8;\n  font-family: monospace;\n  font-size: 0.85rem;\n  -webkit-user-select: none;\n  user-select: none;\n  text-align: left;\n}\n.tree-bullet {\n  display: inline-block;\n  width: 18px;\n  text-align: center;\n  color: #94a3b8;\n  font-size: 0.85rem;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.comprobante-numero {\n  color: #0f172a;\n  font-family: monospace;\n}\n.text-fecha {\n  color: #64748b;\n  font-size: 0.82rem;\n}\n.btn-toggle-sm {\n  width: 20px;\n  height: 20px;\n  font-size: 0.62rem;\n}\n.btn-toggle-xs {\n  width: 18px;\n  height: 18px;\n  font-size: 0.55rem;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 3px;\n  border: 1px solid #cbd5e1;\n  background: #ffffff;\n  cursor: pointer;\n  color: #475569;\n  padding: 0;\n  line-height: 1;\n  transition: all 0.15s ease;\n}\n.btn-toggle-xs:hover {\n  background: #f1f5f9;\n  border-color: #94a3b8;\n  color: #0f172a;\n}\n.btn-toggle-xs.is-expanded {\n  background: #e2e8f0;\n  color: #1e293b;\n}\n.badge-origen {\n  display: inline-block;\n  padding: 1px 5px;\n  border-radius: 3px;\n  font-size: 0.68rem;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n  flex-shrink: 0;\n  vertical-align: middle;\n}\n.badge-deb {\n  background: #fee2e2;\n  color: #991b1b;\n  border: 1px solid #fecaca;\n}\n.badge-cob {\n  background: #e0e7ff;\n  color: #3730a3;\n  border: 1px solid #c7d2fe;\n}\n.badge-ref {\n  background: #dbeafe;\n  color: #1e40af;\n  border: 1px solid #bfdbfe;\n}\n.badge-inc {\n  background: #fef3c7;\n  color: #92400e;\n  border: 1px solid #fde68a;\n}\n.badge-count {\n  font-size: 0.72rem;\n  font-weight: 500;\n  color: #64748b;\n  background: #ffffff;\n  border: 1px solid #cbd5e1;\n  padding: 0.1rem 0.4rem;\n  border-radius: 12px;\n  margin-left: 0.3rem;\n}\n.color-incremento {\n  color: #b45309;\n  font-weight: 600;\n}\n.color-saldo-positivo {\n  color: #166534;\n  font-weight: 700;\n}\n.color-saldo-negativo {\n  color: #dc2626;\n  font-weight: 700;\n}\n.color-saldo-cero {\n  color: #64748b;\n}\n.text-muted {\n  color: #94a3b8;\n}\n.table-facturas {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.88rem;\n}\n.table-facturas th {\n  background: #f8fafc;\n  color: #475569;\n  font-weight: 700;\n  font-size: 0.75rem;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  padding: 0.75rem 1rem;\n  border-bottom: 2px solid #e2e8f0;\n  text-align: left;\n}\n.table-facturas td {\n  padding: 0.85rem 1rem;\n  border-bottom: 1px solid #f1f5f9;\n  color: #1e293b;\n}\n.row-factura-raiz {\n  cursor: pointer;\n  transition: background 0.15s ease;\n}\n.row-factura-raiz:hover {\n  background-color: #f8fafc;\n}\n.row-factura-raiz.row-expanded {\n  background-color: #f1f5f9;\n  border-left: 4px solid #3b82f6;\n}\n.th-expander,\n.td-expander {\n  width: 40px;\n  text-align: center;\n  padding: 0.5rem !important;\n}\n.btn-toggle-expand {\n  background: #e2e8f0;\n  border: none;\n  width: 24px;\n  height: 24px;\n  border-radius: 4px;\n  color: #334155;\n  font-size: 0.7rem;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: transform 0.2s ease, background 0.2s;\n}\n.btn-toggle-expand.is-expanded {\n  background: #3b82f6;\n  color: #ffffff;\n}\n.badge-tipo-doc {\n  display: inline-block;\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n  margin-right: 0.4rem;\n}\n.badge-fc {\n  background: #dbeafe;\n  color: #1d4ed8;\n  border: 1px solid #bfdbfe;\n}\n.cobertura-tag {\n  background: #f1f5f9;\n  color: #334155;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  font-size: 0.82rem;\n  font-weight: 500;\n}\n.color-facturado {\n  color: #1e40af;\n}\n.color-aceptado {\n  color: #dc2626;\n  font-weight: 600;\n}\n.color-no-aceptado {\n  color: #ea580c;\n}\n.color-cobranza {\n  color: #059669;\n  font-weight: 600;\n}\n.color-refacturado {\n  color: #7c3aed;\n  font-weight: 600;\n}\n.refactura-badge {\n  background: #f1f5f9;\n  color: #64748b;\n  font-size: 0.75rem;\n  font-weight: 700;\n  padding: 0.2rem 0.5rem;\n  border-radius: 9999px;\n  border: 1px solid #e2e8f0;\n}\n.refactura-badge.has-refactura {\n  background: #faf5ff;\n  color: #7c3aed;\n  border-color: #e9d5ff;\n}\n.badge-derivados-count {\n  font-size: 0.75rem;\n  color: #64748b;\n  background: #f8fafc;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  border: 1px solid #e2e8f0;\n}\n.text-right {\n  text-align: right;\n}\n.text-center {\n  text-align: center;\n}\n.font-weight-bold {\n  font-weight: 700;\n}\n.row-accordion-detail {\n  background: #f8fafc;\n}\n.td-accordion-container {\n  padding: 1.25rem 1.5rem !important;\n  background: #f8fafc;\n  border-bottom: 2px solid #cbd5e1 !important;\n}\n.derived-tree-wrapper {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 1rem 1.25rem;\n  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.02);\n}\n.tree-header {\n  margin-bottom: 0.85rem;\n}\n.tree-title {\n  font-size: 0.82rem;\n  font-weight: 700;\n  color: #475569;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n.empty-derived {\n  padding: 1.5rem;\n  text-align: center;\n  color: #94a3b8;\n  font-style: italic;\n  font-size: 0.85rem;\n}\n.table-sub-derivados {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.82rem;\n}\n.table-sub-derivados th {\n  background: #f1f5f9;\n  color: #475569;\n  font-size: 0.72rem;\n  text-transform: uppercase;\n  padding: 0.5rem 0.75rem;\n  border-bottom: 1px solid #cbd5e1;\n}\n.table-sub-derivados td {\n  padding: 0.6rem 0.75rem;\n  border-bottom: 1px solid #edf2f7;\n}\n.doc-badge-pill {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.badge-sub-doc {\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.4rem;\n  border-radius: 4px;\n}\n.badge-nc {\n  background: #fee2e2;\n  color: #b91c1c;\n}\n.badge-nd {\n  background: #f3e8ff;\n  color: #6b21a8;\n}\n.badge-rc {\n  background: #dcfce7;\n  color: #15803d;\n}\n.sub-doc-number {\n  font-weight: 600;\n  color: #0f172a;\n}\n.origen-badge {\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 4px;\n}\n.origen-deb {\n  background: #fee2e2;\n  color: #991b1b;\n}\n.origen-ref {\n  background: #f3e8ff;\n  color: #6b21a8;\n}\n.origen-cob {\n  background: #dcfce7;\n  color: #166534;\n}\n.origen-iva {\n  background: #e0f2fe;\n  color: #0369a1;\n}\n@media (max-width: 1024px) {\n  .chart-layout {\n    flex-direction: column;\n  }\n  .donut-container {\n    flex: 0 0 auto;\n    width: 100%;\n  }\n}\n@media (max-width: 768px) {\n  .directorio-container {\n    padding: 1rem;\n  }\n  .filter-card {\n    flex-direction: column;\n    align-items: stretch;\n  }\n  .filter-actions {\n    justify-content: flex-end;\n  }\n}\n.graficos-section {\n  margin-top: 2.5rem;\n  padding-top: 0.5rem;\n}\n.graficos-section .section-header {\n  margin-bottom: 1.25rem;\n}\n.graficos-section .section-title {\n  font-size: 1.15rem;\n  font-weight: 700;\n  color: #1e293b;\n  margin: 0 0 0.25rem 0;\n}\n.graficos-section .section-subtitle {\n  font-size: 0.82rem;\n  color: #64748b;\n  margin: 0;\n}\n.graficos-grid {\n  display: grid;\n  grid-template-columns: 1.6fr 1fr;\n  gap: 1.25rem;\n}\n.grafico-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 14px;\n  padding: 1.25rem 1.5rem 1.5rem 1.5rem;\n  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n.grafico-card--wide {\n}\n.grafico-card-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.75rem;\n  flex-wrap: wrap;\n}\n.grafico-title-group {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  flex: 1;\n}\n.grafico-icon {\n  font-size: 1.6rem;\n  line-height: 1;\n  flex-shrink: 0;\n}\n.grafico-title {\n  font-size: 0.95rem;\n  font-weight: 700;\n  color: #1e293b;\n  margin: 0 0 0.2rem 0;\n}\n.grafico-subtitle {\n  font-size: 0.78rem;\n  color: #64748b;\n  margin: 0;\n}\n.header-badge-container {\n  display: flex;\n  align-items: center;\n}\n.badge-cabeceras {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.4rem;\n  background: #ecfdf5;\n  color: #059669;\n  border: 1px solid #a7f3d0;\n  padding: 0.25rem 0.75rem;\n  border-radius: 9999px;\n  font-size: 0.78rem;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.1);\n}\n.badge-cabeceras .badge-dot {\n  font-size: 0.65rem;\n  color: #10b981;\n}\n.balance-financiero-section {\n  margin-top: 1.5rem;\n}\n.table-balance {\n  width: 100%;\n  border-collapse: collapse;\n}\n.table-balance th {\n  background: #f8fafc;\n  color: #475569;\n  font-size: 0.75rem;\n  font-weight: 700;\n  letter-spacing: 0.04em;\n  padding: 0.75rem 1rem;\n  border-bottom: 2px solid #e2e8f0;\n}\n.table-balance td {\n  padding: 0.7rem 1rem;\n  font-size: 0.85rem;\n  border-bottom: 1px solid #f1f5f9;\n  font-variant-numeric: tabular-nums;\n}\n.table-balance .tr-balance-row:hover {\n  background-color: #f8fafc;\n}\n.table-balance .td-debito {\n  color: #dc2626;\n}\n.table-balance .td-refacturado {\n  color: #0284c7;\n}\n.table-balance .td-cobrado {\n  color: #16a34a;\n}\n.table-balance .th-saldo,\n.table-balance .td-saldo {\n  background-color: rgba(241, 245, 249, 0.6);\n  color: #0f172a;\n  font-weight: 700;\n}\n.table-balance .tr-total-balance {\n  background-color: #f1f5f9;\n  border-top: 2px solid #cbd5e1;\n  border-bottom: 2px solid #cbd5e1;\n}\n.table-balance .tr-total-balance td {\n  padding: 0.85rem 1rem;\n  font-size: 0.88rem;\n}\n.table-balance .td-saldo-total {\n  background-color: #e2e8f0;\n  color: #0f172a;\n  font-weight: 800;\n}\n.grafico-body {\n  position: relative;\n  height: 300px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.grafico-body canvas {\n  max-width: 100%;\n  max-height: 100%;\n}\n.grafico-loading {\n  font-size: 0.85rem;\n  color: #94a3b8;\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n}\n.spinner-icon {\n  animation: spin 1.5s linear infinite;\n  display: inline-block;\n}\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.grafico-empty {\n  font-size: 0.85rem;\n  color: #94a3b8;\n  text-align: center;\n}\n.grafico-body--tall {\n  height: 380px;\n}\n@media (max-width: 900px) {\n  .graficos-grid {\n    grid-template-columns: 1fr;\n  }\n}\n.table-bordered {\n  border: 1px solid #cbd5e1;\n}\n.table-bordered th,\n.table-bordered td {\n  border: 1px solid #e2e8f0;\n}\n.section-card--matriz {\n  padding: 1.25rem 0.75rem;\n  width: 100%;\n  box-sizing: border-box;\n}\n.matriz-table-responsive {\n  width: 100%;\n  overflow-x: auto;\n  -webkit-overflow-scrolling: touch;\n  scrollbar-width: thin;\n  scrollbar-color: #cbd5e1 #f8fafc;\n}\n.matriz-table-responsive::-webkit-scrollbar {\n  height: 6px;\n}\n.matriz-table-responsive::-webkit-scrollbar-track {\n  background: #f8fafc;\n}\n.matriz-table-responsive::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 3px;\n}\n.table-matriz {\n  font-size: 0.78rem;\n  white-space: nowrap;\n  border-collapse: collapse;\n  width: 100%;\n  border: 1px solid #e2e8f0;\n}\n.table-matriz th {\n  padding: 0.6rem 0.35rem;\n  font-size: 0.70rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.03em;\n  color: #475569;\n  background-color: #ffffff;\n  border: 1px solid #e2e8f0;\n  text-align: center;\n}\n.table-matriz td {\n  padding: 0.55rem 0.35rem;\n  border: 1px solid #e2e8f0;\n  font-size: 0.76rem;\n}\n.th-financiador {\n  text-align: left !important;\n  min-width: 160px;\n  max-width: 210px;\n  padding-left: 0.65rem !important;\n}\n.th-mes {\n  min-width: 72px;\n  text-align: center !important;\n}\n.th-total-anual {\n  background-color: #dcfce7 !important;\n  color: #14532d !important;\n  font-weight: 700 !important;\n  border-left: 2px solid #86efac !important;\n  min-width: 105px;\n  text-align: right !important;\n  padding-right: 0.65rem !important;\n  position: sticky;\n  right: 0;\n  z-index: 3;\n  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.05);\n}\n.tr-matriz-fila:hover {\n  background-color: #f8fafc;\n}\n.td-matriz-financiador {\n  display: flex;\n  align-items: center;\n  gap: 0.35rem;\n  color: #0f172a;\n  white-space: normal;\n  font-weight: 700;\n  font-size: 0.74rem;\n  line-height: 1.25;\n  padding-left: 0.65rem !important;\n}\n.td-mes-valor {\n  font-variant-numeric: tabular-nums;\n  color: #0f172a;\n  font-weight: 600;\n  text-align: right;\n  font-size: 0.75rem;\n  letter-spacing: -0.01em;\n}\n.td-mes-valor.valor-cero {\n  color: #94a3b8;\n  font-weight: 400;\n  text-align: center;\n}\n.td-total-anual {\n  background-color: #dcfce7 !important;\n  color: #14532d !important;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n  border-left: 2px solid #86efac !important;\n  text-align: right;\n  font-size: 0.76rem;\n  padding-right: 0.65rem !important;\n  position: sticky;\n  right: 0;\n  z-index: 2;\n  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.05);\n}\n.tr-matriz-total {\n  background-color: #f1f5f9;\n  font-weight: 700;\n  border-top: 2px solid #64748b !important;\n}\n.td-mes-total {\n  color: #0f172a;\n  font-variant-numeric: tabular-nums;\n  background-color: #f1f5f9;\n  font-weight: 700;\n  text-align: right;\n  font-size: 0.75rem;\n}\n.td-mes-total.valor-cero {\n  color: #94a3b8;\n  font-weight: 400;\n  text-align: center;\n}\n.td-gran-total {\n  background-color: #bbf7d0 !important;\n  color: #14532d !important;\n  font-weight: 800;\n  font-size: 0.82rem;\n  font-variant-numeric: tabular-nums;\n  border-left: 2px solid #86efac !important;\n  text-align: right;\n  padding-right: 0.65rem !important;\n  position: sticky;\n  right: 0;\n  z-index: 2;\n  box-shadow: -3px 0 6px rgba(0, 0, 0, 0.05);\n}\n.matriz-tools {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.matriz-select-label {\n  font-size: 0.8rem;\n  font-weight: 700;\n  color: #475569;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n.select-anio {\n  width: auto;\n  min-width: 110px;\n  font-weight: 600;\n  padding: 0.35rem 0.75rem;\n  font-size: 0.85rem;\n}\n.tr-parent-nivel1 {\n  cursor: pointer;\n  transition: background-color 0.15s ease;\n}\n.tr-parent-nivel1:hover {\n  background-color: #f1f5f9;\n}\n.tr-parent-nivel1.is-expanded {\n  background-color: #e2e8f0;\n}\n.btn-toggle-expand {\n  background: none;\n  border: none;\n  font-size: 0.75rem;\n  color: #64748b;\n  cursor: pointer;\n  padding: 0.2rem 0.4rem;\n  transition: transform 0.15s ease;\n}\n.btn-toggle-expand.is-expanded {\n  transform: rotate(90deg);\n  color: #1e3a8a;\n}\n.tr-child-nivel2 {\n  background-color: #f8fafc;\n}\n.td-child-container {\n  padding: 1rem 1.5rem !important;\n  background-color: #f8fafc;\n  border-bottom: 2px solid #cbd5e1 !important;\n}\n.chain-wrapper {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 1.25rem;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);\n}\n.chain-header-info {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 1.25rem;\n  padding-bottom: 0.75rem;\n  border-bottom: 1px solid #f1f5f9;\n}\n.chain-badge-expediente {\n  background: #eff6ff;\n  color: #1d4ed8;\n  font-weight: 700;\n  font-size: 0.8rem;\n  padding: 0.25rem 0.6rem;\n  border-radius: 6px;\n  border: 1px solid #bfdbfe;\n}\n.chain-badge-medico {\n  background: #f1f5f9;\n  color: #334155;\n  font-size: 0.8rem;\n  font-weight: 600;\n  padding: 0.25rem 0.6rem;\n  border-radius: 6px;\n  border: 1px solid #cbd5e1;\n}\n.chain-total-eventos {\n  font-size: 0.78rem;\n  color: #64748b;\n  margin-left: auto;\n}\n.chain-timeline {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1.25rem;\n  align-items: stretch;\n  position: relative;\n}\n.chain-step {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  position: relative;\n  flex: 1;\n  min-width: 180px;\n  max-width: 240px;\n}\n.chain-node {\n  width: 38px;\n  height: 38px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 800;\n  font-size: 0.78rem;\n  letter-spacing: 0.05em;\n  color: #ffffff;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n  z-index: 2;\n  margin-bottom: 0.6rem;\n}\n.bg-primary {\n  background-color: #2563eb !important;\n  color: #ffffff !important;\n}\n.bg-danger {\n  background-color: #dc2626 !important;\n  color: #ffffff !important;\n}\n.bg-warning {\n  background-color: #d97706 !important;\n  color: #ffffff !important;\n}\n.bg-success {\n  background-color: #059669 !important;\n  color: #ffffff !important;\n}\n.chain-connector {\n  position: absolute;\n  top: 19px;\n  left: calc(50% + 19px);\n  width: calc(100% - 18px);\n  height: 2px;\n  background: #cbd5e1;\n  z-index: 1;\n}\n.chain-step:last-child .chain-connector {\n  display: none;\n}\n.chain-card {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 0.75rem 0.85rem;\n  width: 100%;\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);\n  display: flex;\n  flex-direction: column;\n  gap: 0.4rem;\n}\n.chain-card-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 0.4rem;\n}\n.chain-comprobante {\n  color: #0f172a;\n  font-family: monospace;\n  font-size: 0.82rem;\n}\n.chain-fecha {\n  color: #64748b;\n  font-size: 0.72rem;\n}\n.chain-card-body {\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.chain-desc {\n  font-size: 0.76rem;\n  color: #475569;\n  font-weight: 500;\n}\n.chain-monto {\n  font-weight: 800;\n  font-size: 0.9rem;\n  font-variant-numeric: tabular-nums;\n}\n.chain-card-footer {\n  margin-top: 0.25rem;\n  padding-top: 0.35rem;\n  border-top: 1px dashed #f1f5f9;\n  color: #64748b;\n  font-size: 0.7rem;\n}\n.table-analistas {\n  width: 100%;\n}\n.table-analistas th.th-btn-col {\n  width: 48px;\n  text-align: center;\n  padding: 0.5rem 0.25rem !important;\n}\n.table-analistas th.th-analista {\n  min-width: 280px;\n}\n.table-analistas th.th-casos {\n  width: 110px;\n}\n.table-analistas th.th-monto {\n  width: 145px;\n}\n.table-analistas th.th-atencion {\n  width: 175px;\n  text-align: center;\n}\n.table-analistas th.th-tasa {\n  width: 110px;\n}\n.sortable-col {\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n}\n.sortable-col:hover {\n  background-color: rgba(0, 0, 0, 0.04);\n}\n.sort-indicator {\n  font-size: 0.75rem;\n  margin-left: 0.25rem;\n  color: #94a3b8;\n}\n.td-btn-box {\n  width: 48px;\n  text-align: center;\n}\n.btn-toggle-box {\n  width: 26px;\n  height: 26px;\n  border: 1px solid #cbd5e1;\n  border-radius: 6px;\n  background-color: #ffffff;\n  color: #475569;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.95rem;\n  font-weight: 700;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  line-height: 1;\n}\n.btn-toggle-box:hover {\n  background-color: #f1f5f9;\n  border-color: #94a3b8;\n  color: #0f172a;\n}\n.btn-toggle-box.is-expanded {\n  background-color: #e0e7ff;\n  border-color: #818cf8;\n  color: #4338ca;\n}\n.badge-docs-analista {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 28px;\n  padding: 0.2rem 0.6rem;\n  border-radius: 9999px;\n  background-color: #475569;\n  color: #ffffff;\n  font-size: 0.78rem;\n  font-weight: 700;\n}\n.badge-atencion {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.76rem;\n  font-weight: 600;\n  padding: 0.22rem 0.75rem;\n  border-radius: 9999px;\n  background-color: #f1f5f9;\n  color: #334155;\n  border: 1px solid #e2e8f0;\n  white-space: nowrap;\n}\n.badge-atencion-sm {\n  font-size: 0.7rem;\n  padding: 0.15rem 0.5rem;\n}\n.badge-analistas-activos {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.4rem 0.9rem;\n  background-color: #0d6efd;\n  color: #ffffff;\n  font-size: 0.82rem;\n  font-weight: 700;\n  border-radius: 9999px;\n  box-shadow: 0 1px 3px rgba(13, 110, 253, 0.25);\n  white-space: nowrap;\n}\n.color-ticket-promedio {\n  color: #0f172a;\n  font-weight: 700;\n}\n.tr-analista {\n  background-color: #ffffff;\n  font-weight: 600;\n  cursor: pointer;\n  border-left: 4px solid #6366f1;\n  transition: background-color 0.15s ease;\n}\n.tr-analista:hover {\n  background-color: #f8fafc;\n}\n.tr-analista.is-expanded {\n  background-color: #f5f3ff;\n  border-left-color: #4f46e5;\n}\n.td-analista {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.analista-icon {\n  font-size: 1.05rem;\n}\n.analista-nombre {\n  font-size: 0.94rem;\n  color: #0f172a;\n  font-weight: 700;\n}\n.color-ticket {\n  color: #0284c7;\n  font-weight: 700;\n}\n.badge-recupero {\n  display: inline-block;\n  font-size: 0.8rem;\n  font-weight: 700;\n  padding: 0.2rem 0.55rem;\n  border-radius: 9999px;\n  text-align: center;\n}\n.badge-recupero-sm {\n  font-size: 0.74rem;\n  padding: 0.15rem 0.45rem;\n}\n.recupero-alto {\n  background-color: #dcfce7;\n  color: #15803d;\n  border: 1px solid #bbf7d0;\n}\n.recupero-medio {\n  background-color: #fef3c7;\n  color: #b45309;\n  border: 1px solid #fde68a;\n}\n.recupero-cero {\n  background-color: #fee2e2;\n  color: #b91c1c;\n  border: 1px solid #fecaca;\n}\n.tr-sub-header {\n  background-color: #f8fafc;\n  font-size: 0.72rem;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #64748b;\n  border-bottom: 1px solid #e2e8f0;\n}\n.tr-sub-header-motivo {\n  background-color: #f1f5f9;\n}\n.tr-sub-header-motivo th {\n  padding: 0.4rem 0.75rem !important;\n  font-weight: 700;\n}\n.td-sub-header-title {\n  padding-left: 2rem !important;\n  color: #475569;\n}\n.tr-sub-header-financiador {\n  background-color: #f8fafc;\n}\n.tr-sub-header-financiador th {\n  padding: 0.35rem 0.75rem !important;\n  font-weight: 600;\n  font-size: 0.68rem;\n}\n.td-sub-header-sub-title {\n  padding-left: 3.5rem !important;\n  color: #64748b;\n}\n.td-sub-header-col {\n  color: #64748b;\n  font-size: 0.7rem;\n}\n.tr-motivo {\n  background-color: #f8fafc;\n  font-weight: 500;\n  cursor: pointer;\n  border-left: 4px solid #f59e0b;\n  transition: background-color 0.15s ease;\n}\n.tr-motivo:hover {\n  background-color: #f1f5f9;\n}\n.tr-motivo.is-expanded {\n  background-color: #fef3c7;\n  border-left-color: #d97706;\n}\n.td-motivo {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding-left: 2rem !important;\n}\n.motivo-icon {\n  font-size: 0.9rem;\n}\n.motivo-tag {\n  font-size: 0.88rem;\n  color: #334155;\n  font-weight: 600;\n}\n.tr-financiador-sub {\n  background-color: #ffffff;\n  font-size: 0.84rem;\n  transition: background-color 0.12s ease;\n  border-left: 4px solid transparent;\n}\n.tr-financiador-sub:hover {\n  background-color: #f8fafc;\n}\n.td-financiador-sub-item {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding-left: 3.5rem !important;\n}\n.financiador-nombre-sub {\n  color: #334155;\n  font-weight: 600;\n}\n.tr-medico {\n  border-left-color: #0d9488;\n}\n.tr-medico.is-expanded {\n  background-color: #f0fdfa;\n  border-left-color: #0f766e;\n}\n.tr-operador {\n  border-left-color: #8b5cf6;\n}\n.tr-operador.is-expanded {\n  background-color: #f5f3ff;\n  border-left-color: #7c3aed;\n}\n.tiempos-cobranza-section {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  width: 100%;\n}\n.tiempos-top-grid {\n  display: grid;\n  grid-template-columns: 360px 1fr;\n  gap: 16px;\n  align-items: stretch;\n}\n@media (max-width: 960px) {\n  .tiempos-top-grid {\n    grid-template-columns: 1fr;\n  }\n}\n.tiempos-box {\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 6px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);\n  padding: 20px 24px;\n  box-sizing: border-box;\n}\n.kpi-dso-box {\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  text-align: center;\n}\n.kpi-dso-title {\n  font-size: 0.72rem;\n  font-weight: 700;\n  letter-spacing: 0.04em;\n  color: #475569;\n  text-transform: uppercase;\n  margin-top: 4px;\n}\n.kpi-dso-main {\n  padding: 12px 0;\n}\n.kpi-dso-val {\n  font-size: 3.8rem;\n  font-weight: 800;\n  color: #1e66f5;\n  line-height: 1;\n  margin-bottom: 8px;\n}\n.kpi-dso-sub {\n  font-size: 0.74rem;\n  color: #64748b;\n  margin: 0;\n  line-height: 1.35;\n}\n.kpi-dso-divider {\n  border: 0;\n  border-top: 1px solid #e2e8f0;\n  margin: 16px 0 14px 0;\n}\n.kpi-dso-footer {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 8px;\n}\n.kpi-dso-col {\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  text-align: center;\n}\n.kpi-dso-col-lbl {\n  font-size: 0.72rem;\n  color: #64748b;\n}\n.kpi-dso-col-val {\n  font-size: 0.88rem;\n  font-weight: 700;\n}\n.kpi-dso-col-val.text-green {\n  color: #16a34a;\n}\n.kpi-dso-col-val.text-red {\n  color: #dc2626;\n}\n.grafico-aging-box {\n  display: flex;\n  flex-direction: column;\n}\n.tiempos-box-header {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 12px;\n}\n.tiempos-box-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 16px;\n  height: 16px;\n  color: #3b82f6;\n  flex-shrink: 0;\n}\n.tiempos-box-icon svg {\n  width: 100%;\n  height: 100%;\n}\n.tiempos-box-title {\n  font-size: 0.84rem;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0;\n}\n.aging-canvas-container {\n  position: relative;\n  height: 250px;\n  width: 100%;\n}\n.tabla-aging-box {\n  padding: 16px 20px;\n}\n.tabla-aging-wrap {\n  overflow-x: auto;\n}\n.tabla-aging-exact {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.8rem;\n  margin-top: 4px;\n}\n.tabla-aging-exact th {\n  padding: 10px 14px;\n  border-bottom: 1px solid #cbd5e1;\n  color: #1e3a8a;\n  font-size: 0.70rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  background: transparent;\n}\n.tabla-aging-exact td {\n  padding: 12px 14px;\n  border-bottom: 1px solid #f1f5f9;\n  font-variant-numeric: tabular-nums;\n  font-size: 0.80rem;\n}\n.tabla-aging-exact tr:hover {\n  background-color: #fafafa;\n}\n.td-aging-rango {\n  font-weight: 700;\n  color: #000000;\n  text-align: left;\n}\n.td-aging-comprobantes {\n  color: #334155;\n  text-align: center;\n}\n.td-aging-saldo {\n  font-weight: 700;\n  color: #dc2626;\n  text-align: right;\n}\n.td-aging-porcentaje {\n  color: #334155;\n  text-align: right;\n}\n.motivos-info-alert {\n  display: flex;\n  align-items: center;\n  gap: 0.65rem;\n  background: #eff6ff;\n  border-left: 4px solid #3b82f6;\n  color: #1e40af;\n  border-radius: 6px;\n  padding: 0.7rem 1.15rem;\n  font-size: 0.85rem;\n  margin-bottom: 1.25rem;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);\n}\n.motivos-info-icon {\n  font-size: 1.15rem;\n  line-height: 1;\n}\n.motivos-info-text {\n  line-height: 1.4;\n}\n.motivos-info-text strong {\n  font-weight: 700;\n  color: #1e3a8a;\n}\n.contadores-motivos-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 1.25rem;\n  margin-bottom: 1.75rem;\n}\n@media (max-width: 1200px) {\n  .contadores-motivos-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n@media (max-width: 640px) {\n  .contadores-motivos-grid {\n    grid-template-columns: 1fr;\n  }\n}\n.card-contador-motivo {\n  background: #ffffff;\n  border-radius: 10px;\n  padding: 1.2rem 1.35rem;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  min-height: 112px;\n  transition: transform 0.18s ease, box-shadow 0.18s ease;\n}\n.card-contador-motivo:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);\n}\n.card-contador-motivo.card-debitado-nc {\n  border: 2px solid #ef4444;\n}\n.card-contador-motivo.card-debito-aceptado {\n  border: 2px solid #881337;\n}\n.card-contador-motivo.card-total-refacturado {\n  border: 2px solid #2563eb;\n}\n.card-contador-motivo.card-motivos-identificados {\n  border: 2px solid #06b6d4;\n}\n.card-contador-motivo .contador-header {\n  margin-bottom: 0.25rem;\n}\n.card-contador-motivo .contador-title {\n  font-size: 0.74rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  color: #334155;\n}\n.card-contador-motivo .contador-value {\n  font-size: 1.9rem;\n  font-weight: 800;\n  line-height: 1.15;\n  margin: 0.35rem 0 0.25rem 0;\n  letter-spacing: -0.02em;\n}\n.card-contador-motivo.card-debitado-nc .contador-value {\n  color: #ef4444;\n}\n.card-contador-motivo.card-debito-aceptado .contador-value {\n  color: #881337;\n}\n.card-contador-motivo.card-total-refacturado .contador-value {\n  color: #2563eb;\n}\n.card-contador-motivo.card-motivos-identificados .contador-value {\n  color: #06b6d4;\n}\n.card-contador-motivo .contador-footer {\n  font-size: 0.78rem;\n  color: #64748b;\n  font-weight: 500;\n}\n/*# sourceMappingURL=directorio-dashboard.component.css.map */\n'] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DirectorioDashboardComponent, { className: "DirectorioDashboardComponent", filePath: "src/app/features/directorio/directorio-dashboard.component.ts", lineNumber: 58 });
})();
export {
  DirectorioDashboardComponent
};
//# sourceMappingURL=chunk-JUWRUSUN.js.map
