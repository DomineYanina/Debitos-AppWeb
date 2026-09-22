import {
  NotificacionService,
  TourService
} from "./chunk-ITHAQXHK.js";
import {
  AuthService
} from "./chunk-5ICC65UF.js";
import {
  Chart,
  registerables
} from "./chunk-TXAAD75R.js";
import {
  FormsModule,
  NavigationEnd,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet,
  SelectControlValueAccessor,
  bootstrapApplication,
  provideHttpClient,
  provideRouter,
  withInterceptors,
  ɵNgSelectMultipleOption
} from "./chunk-FKTKYBCK.js";
import {
  ChangeDetectorRef,
  CommonModule,
  Component,
  ElementRef,
  HostListener,
  Injectable,
  NgClass,
  NgForOf,
  NgIf,
  Subscription,
  __spreadValues,
  catchError,
  finalize,
  inject,
  registerLocaleData,
  setClassMetadata,
  signal,
  throwError,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-IXY2MHCK.js";

// node_modules/@angular/common/locales/es-AR.js
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
var u = void 0;
function plural(val) {
  const n = val, i = Math.floor(Math.abs(val)), v = val.toString().replace(/^[^.]*\.?/, "").length, e = parseInt(val.toString().replace(/^[^e]*(e([-+]?\d+))?/, "$2")) || 0;
  if (n === 1)
    return 1;
  if (e === 0 && (!(i === 0) && (i % 1e6 === 0 && v === 0)) || !(e >= 0 && e <= 5))
    return 4;
  return 5;
}
var es_AR_default = ["es-AR", [["a.\u202Fm.", "p.\u202Fm."], u, ["a.\xA0m.", "p.\xA0m."]], u, [["D", "L", "M", "M", "J", "V", "S"], ["dom", "lun", "mar", "mi\xE9", "jue", "vie", "s\xE1b"], ["domingo", "lunes", "martes", "mi\xE9rcoles", "jueves", "viernes", "s\xE1bado"], ["DO", "LU", "MA", "MI", "JU", "VI", "SA"]], u, [["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"], ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]], u, [["a.C.", "d.C."], u, ["antes de Cristo", "despu\xE9s de Cristo"]], 1, [6, 0], ["d/M/yy", "d MMM y", "d 'de' MMMM 'de' y", "EEEE, d 'de' MMMM 'de' y"], ["h:mm\u202Fa", "h:mm:ss\u202Fa", "h:mm:ss\u202Fa z", "h:mm:ss\u202Fa zzzz"], ["{1}, {0}", u, u, u], [",", ".", ";", "%", "+", "-", "E", "\xD7", "\u2030", "\u221E", "NaN", ":"], ["#,##0.###", "#,##0%", "\xA4\xA0#,##0.00", "#E0"], "ARS", "$", "peso argentino", { "ARS": ["$"], "AUD": [u, "$"], "BRL": [u, "R$"], "BYN": [u, "\u0440."], "CAD": [u, "$"], "CNY": [u, "\xA5"], "ESP": ["\u20A7"], "EUR": [u, "\u20AC"], "FKP": [u, "FK\xA3"], "GBP": [u, "\xA3"], "HKD": [u, "$"], "ILS": [u, "\u20AA"], "INR": [u, "\u20B9"], "JPY": [u, "\xA5"], "KRW": [u, "\u20A9"], "MXN": [u, "$"], "NZD": [u, "$"], "PHP": [u, "\u20B1"], "RON": [u, "L"], "SSP": [u, "SD\xA3"], "SYP": [u, "S\xA3"], "TWD": [u, "NT$"], "USD": ["US$", "$"], "VEF": [u, "BsF"], "VND": [u, "\u20AB"], "XAF": [], "XCD": [u, "$"], "XOF": [] }, "ltr", plural];

// src/app/core/guards/auth.guard.ts
var authGuard = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn()) {
    return true;
  }
  router.navigate(["/login"]);
  return false;
};

// src/app/core/guards/role.guard.ts
var roleGuard = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isLoggedIn()) {
    router.navigate(["/login"]);
    return false;
  }
  const expectedRoles = route.data?.["roles"] || [];
  if (expectedRoles.length === 0) {
    return true;
  }
  if (authService.hasAnyRole(expectedRoles)) {
    return true;
  }
  router.navigate(["/auditoria"]);
  return false;
};

// src/app/app.routes.ts
var routes = [
  {
    path: "login",
    loadComponent: () => import("./chunk-B5MV5BOZ.js").then((m) => m.LoginComponent)
  },
  {
    path: "auditoria",
    loadComponent: () => import("./chunk-VPRP6QAG.js").then((m) => m.AuditoriaComponent),
    canActivate: [authGuard]
  },
  {
    path: "directorio",
    loadComponent: () => import("./chunk-JUWRUSUN.js").then((m) => m.DirectorioDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ["DIRECTORIO", "ADMIN"] }
  },
  {
    path: "directorio/motivo/:motivoId",
    loadComponent: () => import("./chunk-2LO6WTVM.js").then((m) => m.DirectorioMotivoDetalleComponent),
    canActivate: [roleGuard],
    data: { roles: ["DIRECTORIO", "ADMIN"] }
  },
  { path: "", redirectTo: "login", pathMatch: "full" },
  { path: "**", redirectTo: "login" }
];

// src/app/core/interceptors/auth-interceptor.ts
var authInterceptor = (req, next) => {
  const token = localStorage.getItem("token");
  const authService = inject(AuthService);
  const router = inject(Router);
  let peticionClonada = req;
  if (token && !req.url.includes("/login") && !req.url.includes("/auth")) {
    peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(peticionClonada).pipe(catchError((error) => {
    if ((error.status === 401 || error.status === 403) && !req.url.includes("/login") && !req.url.includes("/auth")) {
      authService.logout();
      router.navigate(["/login"]);
    }
    return throwError(() => error);
  }));
};

// src/app/core/services/loading.service.ts
var LoadingService = class _LoadingService {
  activeRequests = signal(0, ...ngDevMode ? [{ debugName: "activeRequests" }] : (
    /* istanbul ignore next */
    []
  ));
  isLoading = signal(false, ...ngDevMode ? [{ debugName: "isLoading" }] : (
    /* istanbul ignore next */
    []
  ));
  show() {
    this.activeRequests.update((count) => {
      const next = count + 1;
      this.isLoading.set(next > 0);
      return next;
    });
  }
  hide() {
    this.activeRequests.update((count) => {
      const next = Math.max(0, count - 1);
      this.isLoading.set(next > 0);
      return next;
    });
  }
  static \u0275fac = function LoadingService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LoadingService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _LoadingService, factory: _LoadingService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LoadingService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// src/app/core/interceptors/loading.interceptor.ts
var loadingInterceptor = (req, next) => {
  if (req.url.includes("/api/notificaciones") || req.headers.has("X-Skip-Loading")) {
    return next(req);
  }
  const loadingService = inject(LoadingService);
  loadingService.show();
  return next(req).pipe(finalize(() => {
    loadingService.hide();
  }));
};

// src/app/core/services/notification.service.ts
var NotificationService = class _NotificationService {
  toasts = signal([], ...ngDevMode ? [{ debugName: "toasts" }] : (
    /* istanbul ignore next */
    []
  ));
  show(toast) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = __spreadValues({
      id,
      duration: 4e3
    }, toast);
    this.toasts.update((list) => [...list, newToast]);
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.duration);
    }
  }
  success(message, title) {
    this.show({ type: "success", message, title });
  }
  error(message, title) {
    this.show({ type: "error", message, title, duration: 6e3 });
  }
  warning(message, title) {
    this.show({ type: "warning", message, title });
  }
  info(message, title) {
    this.show({ type: "info", message, title });
  }
  dismiss(id) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
  static \u0275fac = function NotificationService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NotificationService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _NotificationService, factory: _NotificationService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NotificationService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// src/app/core/interceptors/error.interceptor.ts
var errorInterceptor = (req, next) => {
  const notificationService = inject(NotificationService);
  return next(req).pipe(catchError((error) => {
    if (!req.url.includes("/api/auth/login") && !req.url.includes("/api/auth/verificar-usuario")) {
      if (error.status === 0) {
        notificationService.error("Servidor no disponible. Por favor, intente m\xE1s tarde.", "Error de Conexi\xF3n");
      } else if (error.status >= 500) {
        const mensajeServer = error.error?.message || "Ocurri\xF3 un error inesperado en el servidor.";
        notificationService.error(mensajeServer, "Error del Servidor (500)");
      }
    }
    return throwError(() => error);
  }));
};

// src/app/app.config.ts
var appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor]))
    // ShepherdService (angular-shepherd v22) es providedIn: 'root' automáticamente.
    // No requiere ShepherdModule ni importProvidersFrom.
  ]
};

// src/app/core/components/loading-bar/loading-bar.component.ts
function LoadingBarComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275element(1, "div", 2);
    \u0275\u0275elementEnd();
  }
}
var LoadingBarComponent = class _LoadingBarComponent {
  loadingService = inject(LoadingService);
  static \u0275fac = function LoadingBarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LoadingBarComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LoadingBarComponent, selectors: [["app-loading-bar"]], decls: 1, vars: 1, consts: [["class", "loading-bar-container", 4, "ngIf"], [1, "loading-bar-container"], [1, "loading-bar"]], template: function LoadingBarComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, LoadingBarComponent_div_0_Template, 2, 0, "div", 0);
    }
    if (rf & 2) {
      \u0275\u0275property("ngIf", ctx.loadingService.isLoading());
    }
  }, dependencies: [CommonModule, NgIf], styles: ["\n.loading-bar-container[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 3px;\n  background-color: rgba(66, 153, 225, 0.2);\n  z-index: 99999;\n  overflow: hidden;\n}\n.loading-bar[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  background-color: #3182ce;\n  animation: _ngcontent-%COMP%_loadingAnimation 1.5s infinite ease-in-out;\n  transform-origin: 0% 50%;\n}\n@keyframes _ngcontent-%COMP%_loadingAnimation {\n  0% {\n    transform: translateX(-100%) scaleX(0.2);\n  }\n  50% {\n    transform: translateX(0%) scaleX(0.5);\n  }\n  100% {\n    transform: translateX(100%) scaleX(0.2);\n  }\n}\n/*# sourceMappingURL=loading-bar.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LoadingBarComponent, [{
    type: Component,
    args: [{ selector: "app-loading-bar", standalone: true, imports: [CommonModule], template: '<div *ngIf="loadingService.isLoading()" class="loading-bar-container">\n  <div class="loading-bar"></div>\n</div>\n', styles: ["/* src/app/core/components/loading-bar/loading-bar.component.css */\n.loading-bar-container {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 3px;\n  background-color: rgba(66, 153, 225, 0.2);\n  z-index: 99999;\n  overflow: hidden;\n}\n.loading-bar {\n  width: 100%;\n  height: 100%;\n  background-color: #3182ce;\n  animation: loadingAnimation 1.5s infinite ease-in-out;\n  transform-origin: 0% 50%;\n}\n@keyframes loadingAnimation {\n  0% {\n    transform: translateX(-100%) scaleX(0.2);\n  }\n  50% {\n    transform: translateX(0%) scaleX(0.5);\n  }\n  100% {\n    transform: translateX(100%) scaleX(0.2);\n  }\n}\n/*# sourceMappingURL=loading-bar.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LoadingBarComponent, { className: "LoadingBarComponent", filePath: "src/app/core/components/loading-bar/loading-bar.component.ts", lineNumber: 12 });
})();

// src/app/core/components/notification-toast/notification-toast.component.ts
function NotificationToastComponent_div_1_span_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u2713");
    \u0275\u0275elementEnd();
  }
}
function NotificationToastComponent_div_1_span_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u26A0\uFE0F");
    \u0275\u0275elementEnd();
  }
}
function NotificationToastComponent_div_1_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u26A1");
    \u0275\u0275elementEnd();
  }
}
function NotificationToastComponent_div_1_span_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "\u2139\uFE0F");
    \u0275\u0275elementEnd();
  }
}
function NotificationToastComponent_div_1_strong_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "strong", 9);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const toast_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(toast_r2.title);
  }
}
function NotificationToastComponent_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 2)(1, "div", 3);
    \u0275\u0275template(2, NotificationToastComponent_div_1_span_2_Template, 2, 0, "span", 4)(3, NotificationToastComponent_div_1_span_3_Template, 2, 0, "span", 4)(4, NotificationToastComponent_div_1_span_4_Template, 2, 0, "span", 4)(5, NotificationToastComponent_div_1_span_5_Template, 2, 0, "span", 4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 5);
    \u0275\u0275template(7, NotificationToastComponent_div_1_strong_7_Template, 2, 1, "strong", 6);
    \u0275\u0275elementStart(8, "span", 7);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "button", 8);
    \u0275\u0275listener("click", function NotificationToastComponent_div_1_Template_button_click_10_listener() {
      const toast_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.cerrar(toast_r2.id));
    });
    \u0275\u0275text(11, "\xD7");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const toast_r2 = ctx.$implicit;
    \u0275\u0275property("ngClass", "toast-" + toast_r2.type);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", toast_r2.type === "success");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", toast_r2.type === "error");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", toast_r2.type === "warning");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", toast_r2.type === "info");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", toast_r2.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(toast_r2.message);
  }
}
var NotificationToastComponent = class _NotificationToastComponent {
  notificationService = inject(NotificationService);
  cerrar(id) {
    this.notificationService.dismiss(id);
  }
  static \u0275fac = function NotificationToastComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NotificationToastComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NotificationToastComponent, selectors: [["app-notification-toast"]], decls: 2, vars: 1, consts: [[1, "toast-container"], ["class", "toast-card", 3, "ngClass", 4, "ngFor", "ngForOf"], [1, "toast-card", 3, "ngClass"], [1, "toast-icon"], [4, "ngIf"], [1, "toast-content"], ["class", "toast-title", 4, "ngIf"], [1, "toast-message"], ["type", "button", "aria-label", "Cerrar", 1, "btn-close-toast", 3, "click"], [1, "toast-title"]], template: function NotificationToastComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275template(1, NotificationToastComponent_div_1_Template, 12, 7, "div", 1);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275property("ngForOf", ctx.notificationService.toasts());
    }
  }, dependencies: [CommonModule, NgClass, NgForOf, NgIf], styles: ["\n.toast-container[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 1.5rem;\n  right: 1.5rem;\n  z-index: 100000;\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n  max-width: 400px;\n  width: calc(100% - 3rem);\n  pointer-events: none;\n}\n.toast-card[_ngcontent-%COMP%] {\n  pointer-events: auto;\n  display: flex;\n  align-items: flex-start;\n  gap: 0.75rem;\n  padding: 1rem 1.25rem;\n  border-radius: 8px;\n  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);\n  background: white;\n  animation: _ngcontent-%COMP%_slideInRight 0.3s ease-out;\n  border-left: 5px solid #cbd5e0;\n}\n.toast-success[_ngcontent-%COMP%] {\n  border-left-color: #38a169;\n  background-color: #f0fff4;\n  color: #22543d;\n}\n.toast-success[_ngcontent-%COMP%]   .toast-icon[_ngcontent-%COMP%] {\n  color: #38a169;\n  font-weight: bold;\n}\n.toast-error[_ngcontent-%COMP%] {\n  border-left-color: #e53e3e;\n  background-color: #fff5f5;\n  color: #742a2a;\n}\n.toast-error[_ngcontent-%COMP%]   .toast-icon[_ngcontent-%COMP%] {\n  color: #e53e3e;\n}\n.toast-warning[_ngcontent-%COMP%] {\n  border-left-color: #dd6b20;\n  background-color: #fffaf0;\n  color: #7b341e;\n}\n.toast-warning[_ngcontent-%COMP%]   .toast-icon[_ngcontent-%COMP%] {\n  color: #dd6b20;\n}\n.toast-info[_ngcontent-%COMP%] {\n  border-left-color: #3182ce;\n  background-color: #ebf8ff;\n  color: #2c5282;\n}\n.toast-info[_ngcontent-%COMP%]   .toast-icon[_ngcontent-%COMP%] {\n  color: #3182ce;\n}\n.toast-icon[_ngcontent-%COMP%] {\n  font-size: 1.2rem;\n  flex-shrink: 0;\n  line-height: 1;\n  margin-top: 2px;\n}\n.toast-content[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.toast-content[_ngcontent-%COMP%]   .toast-title[_ngcontent-%COMP%] {\n  font-size: 0.95rem;\n  font-weight: 600;\n}\n.toast-content[_ngcontent-%COMP%]   .toast-message[_ngcontent-%COMP%] {\n  font-size: 0.88rem;\n  line-height: 1.4;\n}\n.btn-close-toast[_ngcontent-%COMP%] {\n  background: transparent;\n  border: none;\n  font-size: 1.2rem;\n  line-height: 1;\n  color: #a0aec0;\n  cursor: pointer;\n  padding: 0 0.3rem;\n  margin-left: 0.5rem;\n  border-radius: 4px;\n  transition: color 0.2s;\n}\n.btn-close-toast[_ngcontent-%COMP%]:hover {\n  color: #2d3748;\n}\n@keyframes _ngcontent-%COMP%_slideInRight {\n  from {\n    transform: translateX(100%);\n    opacity: 0;\n  }\n  to {\n    transform: translateX(0);\n    opacity: 1;\n  }\n}\n/*# sourceMappingURL=notification-toast.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NotificationToastComponent, [{
    type: Component,
    args: [{ selector: "app-notification-toast", standalone: true, imports: [CommonModule], template: `<div class="toast-container">
  <div 
    *ngFor="let toast of notificationService.toasts()" 
    class="toast-card" 
    [ngClass]="'toast-' + toast.type"
  >
    <div class="toast-icon">
      <span *ngIf="toast.type === 'success'">\u2713</span>
      <span *ngIf="toast.type === 'error'">\u26A0\uFE0F</span>
      <span *ngIf="toast.type === 'warning'">\u26A1</span>
      <span *ngIf="toast.type === 'info'">\u2139\uFE0F</span>
    </div>
    <div class="toast-content">
      <strong *ngIf="toast.title" class="toast-title">{{ toast.title }}</strong>
      <span class="toast-message">{{ toast.message }}</span>
    </div>
    <button type="button" class="btn-close-toast" (click)="cerrar(toast.id)" aria-label="Cerrar">&times;</button>
  </div>
</div>
`, styles: ["/* src/app/core/components/notification-toast/notification-toast.component.css */\n.toast-container {\n  position: fixed;\n  top: 1.5rem;\n  right: 1.5rem;\n  z-index: 100000;\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n  max-width: 400px;\n  width: calc(100% - 3rem);\n  pointer-events: none;\n}\n.toast-card {\n  pointer-events: auto;\n  display: flex;\n  align-items: flex-start;\n  gap: 0.75rem;\n  padding: 1rem 1.25rem;\n  border-radius: 8px;\n  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);\n  background: white;\n  animation: slideInRight 0.3s ease-out;\n  border-left: 5px solid #cbd5e0;\n}\n.toast-success {\n  border-left-color: #38a169;\n  background-color: #f0fff4;\n  color: #22543d;\n}\n.toast-success .toast-icon {\n  color: #38a169;\n  font-weight: bold;\n}\n.toast-error {\n  border-left-color: #e53e3e;\n  background-color: #fff5f5;\n  color: #742a2a;\n}\n.toast-error .toast-icon {\n  color: #e53e3e;\n}\n.toast-warning {\n  border-left-color: #dd6b20;\n  background-color: #fffaf0;\n  color: #7b341e;\n}\n.toast-warning .toast-icon {\n  color: #dd6b20;\n}\n.toast-info {\n  border-left-color: #3182ce;\n  background-color: #ebf8ff;\n  color: #2c5282;\n}\n.toast-info .toast-icon {\n  color: #3182ce;\n}\n.toast-icon {\n  font-size: 1.2rem;\n  flex-shrink: 0;\n  line-height: 1;\n  margin-top: 2px;\n}\n.toast-content {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 0.2rem;\n}\n.toast-content .toast-title {\n  font-size: 0.95rem;\n  font-weight: 600;\n}\n.toast-content .toast-message {\n  font-size: 0.88rem;\n  line-height: 1.4;\n}\n.btn-close-toast {\n  background: transparent;\n  border: none;\n  font-size: 1.2rem;\n  line-height: 1;\n  color: #a0aec0;\n  cursor: pointer;\n  padding: 0 0.3rem;\n  margin-left: 0.5rem;\n  border-radius: 4px;\n  transition: color 0.2s;\n}\n.btn-close-toast:hover {\n  color: #2d3748;\n}\n@keyframes slideInRight {\n  from {\n    transform: translateX(100%);\n    opacity: 0;\n  }\n  to {\n    transform: translateX(0);\n    opacity: 1;\n  }\n}\n/*# sourceMappingURL=notification-toast.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NotificationToastComponent, { className: "NotificationToastComponent", filePath: "src/app/core/components/notification-toast/notification-toast.component.ts", lineNumber: 12 });
})();

// src/app/core/components/navbar/navbar.ts
function NavbarComponent_header_0_span_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "ADMIN");
    \u0275\u0275elementEnd();
  }
}
function NavbarComponent_header_0_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("VISTA: ", ctx_r1.rolSimulado);
  }
}
function NavbarComponent_header_0_span_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.rolActual);
  }
}
function NavbarComponent_header_0_a_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 23)(1, "span", 24);
    \u0275\u0275text(2, "Buscador de Documentos");
    \u0275\u0275elementEnd()();
  }
}
function NavbarComponent_header_0_a_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 25)(1, "span", 24);
    \u0275\u0275text(2, "Tablero de Control");
    \u0275\u0275elementEnd()();
  }
}
function NavbarComponent_header_0_div_14_option_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "option", 31);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const rol_r4 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275property("value", rol_r4);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.formatearNombreRol(rol_r4), " ");
  }
}
function NavbarComponent_header_0_div_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 26)(1, "span", 27);
    \u0275\u0275text(2, "Ver como:");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "select", 28);
    \u0275\u0275listener("ngModelChange", function NavbarComponent_header_0_div_14_Template_select_ngModelChange_3_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.cambiarRolSimulado($event));
    });
    \u0275\u0275elementStart(4, "option", 29);
    \u0275\u0275text(5, "Administrador (Actual)");
    \u0275\u0275elementEnd();
    \u0275\u0275template(6, NavbarComponent_header_0_div_14_option_6_Template, 2, 2, "option", 30);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngModel", ctx_r1.rolSimulado ? ctx_r1.rolSimulado : "REAL");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.rolesDisponibles);
  }
}
function NavbarComponent_header_0_div_19_span_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 37);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.noLeidasCount > 99 ? "99+" : ctx_r1.noLeidasCount, " ");
  }
}
function NavbarComponent_header_0_div_19_div_5_div_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 46)(1, "span", 47);
    \u0275\u0275text(2, "\u{1F4ED}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p");
    \u0275\u0275text(4, "No hay notificaciones registradas");
    \u0275\u0275elementEnd()();
  }
}
function NavbarComponent_header_0_div_19_div_5_div_11_span_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 60);
    \u0275\u0275text(1, "\u25CF NUEVA");
    \u0275\u0275elementEnd();
  }
}
function NavbarComponent_header_0_div_19_div_5_div_11_button_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 61);
    \u0275\u0275listener("click", function NavbarComponent_header_0_div_19_div_5_div_11_button_15_Template_button_click_0_listener($event) {
      \u0275\u0275restoreView(_r9);
      const notif_r8 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.marcarComoLeida(notif_r8, $event));
    });
    \u0275\u0275text(1, " \u2713 Marcar vista ");
    \u0275\u0275elementEnd();
  }
}
function NavbarComponent_header_0_div_19_div_5_div_11_span_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 62);
    \u0275\u0275text(1, " \u2713 Vista ");
    \u0275\u0275elementEnd();
  }
}
function NavbarComponent_header_0_div_19_div_5_div_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 48);
    \u0275\u0275listener("click", function NavbarComponent_header_0_div_19_div_5_div_11_Template_div_click_0_listener() {
      const notif_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.abrirComprobante(notif_r8));
    });
    \u0275\u0275elementStart(1, "div", 49);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 50)(4, "div", 51)(5, "span", 52);
    \u0275\u0275text(6);
    \u0275\u0275template(7, NavbarComponent_header_0_div_19_div_5_div_11_span_7_Template, 2, 0, "span", 53);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 54);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "p", 55);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 56)(13, "button", 57);
    \u0275\u0275text(14);
    \u0275\u0275elementEnd();
    \u0275\u0275template(15, NavbarComponent_header_0_div_19_div_5_div_11_button_15_Template, 2, 0, "button", 58)(16, NavbarComponent_header_0_div_19_div_5_div_11_span_16_Template, 2, 0, "span", 59);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const notif_r8 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275classProp("unread", !notif_r8.leida)("read", notif_r8.leida);
    \u0275\u0275advance();
    \u0275\u0275classProp("badge-nc", notif_r8.tipoDoc === "NC" && notif_r8.tipoNotificacion !== "DOC_NO_ENCONTRADO")("badge-nd", notif_r8.tipoDoc === "ND" && notif_r8.tipoNotificacion !== "DOC_NO_ENCONTRADO")("badge-faltante", notif_r8.tipoNotificacion === "DOC_NO_ENCONTRADO" || notif_r8.evento === "DOC_NO_ENCONTRADO");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", notif_r8.tipoNotificacion === "DOC_NO_ENCONTRADO" || notif_r8.evento === "DOC_NO_ENCONTRADO" ? "AUSENTE" : notif_r8.tipoDoc || "DOC", " ");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", notif_r8.usuario, " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !notif_r8.leida);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.formatearFecha(notif_r8.fechaHora));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(notif_r8.mensaje);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", notif_r8.tipoNotificacion === "DOC_NO_ENCONTRADO" || notif_r8.evento === "DOC_NO_ENCONTRADO" ? "Ver Reporte \u2794" : "Ver en Auditor\xEDa \u2794", " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !notif_r8.leida);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", notif_r8.leida);
  }
}
function NavbarComponent_header_0_div_19_div_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 38);
    \u0275\u0275listener("click", function NavbarComponent_header_0_div_19_div_5_Template_div_click_0_listener($event) {
      return $event.stopPropagation();
    });
    \u0275\u0275elementStart(1, "div", 39)(2, "div", 40)(3, "span", 41);
    \u0275\u0275text(4, "\u{1F514}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h4");
    \u0275\u0275text(6, "Notificaciones");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "button", 42);
    \u0275\u0275listener("click", function NavbarComponent_header_0_div_19_div_5_Template_button_click_7_listener($event) {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.marcarTodasComoLeidas($event));
    });
    \u0275\u0275text(8, " \u2713 Ver todas ");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 43);
    \u0275\u0275template(10, NavbarComponent_header_0_div_19_div_5_div_10_Template, 5, 0, "div", 44)(11, NavbarComponent_header_0_div_19_div_5_div_11_Template, 17, 18, "div", 45);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(10);
    \u0275\u0275property("ngIf", ctx_r1.notificaciones.length === 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.notificaciones);
  }
}
function NavbarComponent_header_0_div_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 32)(1, "button", 33);
    \u0275\u0275listener("click", function NavbarComponent_header_0_div_19_Template_button_click_1_listener($event) {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.toggleNotificaciones($event));
    });
    \u0275\u0275elementStart(2, "span", 34);
    \u0275\u0275text(3, "\u{1F514}");
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, NavbarComponent_header_0_div_19_span_4_Template, 2, 1, "span", 35);
    \u0275\u0275elementEnd();
    \u0275\u0275template(5, NavbarComponent_header_0_div_19_div_5_Template, 12, 2, "div", 36);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r1.noLeidasCount > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.notificacionesAbiertas);
  }
}
function NavbarComponent_header_0_div_28_small_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "small");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.formatearNombreRol(ctx_r1.rolActual));
  }
}
function NavbarComponent_header_0_div_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 63);
    \u0275\u0275listener("click", function NavbarComponent_header_0_div_28_Template_div_click_0_listener($event) {
      return $event.stopPropagation();
    });
    \u0275\u0275elementStart(1, "div", 64)(2, "div", 65);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 66)(5, "strong");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, NavbarComponent_header_0_div_28_small_7_Template, 2, 1, "small", 7);
    \u0275\u0275elementEnd()();
    \u0275\u0275element(8, "div", 67);
    \u0275\u0275elementStart(9, "button", 68);
    \u0275\u0275listener("click", function NavbarComponent_header_0_div_28_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.onLogout());
    });
    \u0275\u0275elementStart(10, "span", 69);
    \u0275\u0275text(11, "\u{1F6AA}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "span");
    \u0275\u0275text(13, "Cerrar Sesi\xF3n");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.usuarioLogueado.charAt(0).toUpperCase());
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.usuarioLogueado);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.mostrarSubtituloRol);
  }
}
function NavbarComponent_header_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "header", 1)(1, "div", 2)(2, "div", 3)(3, "a", 4)(4, "span", 5);
    \u0275\u0275text(5, "D\xE9bitos");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 6);
    \u0275\u0275template(7, NavbarComponent_header_0_span_7_Template, 2, 0, "span", 7)(8, NavbarComponent_header_0_span_8_Template, 2, 1, "span", 7)(9, NavbarComponent_header_0_span_9_Template, 2, 1, "span", 7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 8)(11, "nav", 9);
    \u0275\u0275template(12, NavbarComponent_header_0_a_12_Template, 3, 0, "a", 10)(13, NavbarComponent_header_0_a_13_Template, 3, 0, "a", 11);
    \u0275\u0275elementEnd();
    \u0275\u0275template(14, NavbarComponent_header_0_div_14_Template, 7, 2, "div", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(15, "div", 13)(16, "button", 14);
    \u0275\u0275listener("click", function NavbarComponent_header_0_Template_button_click_16_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.iniciarTourGuiado());
    });
    \u0275\u0275elementStart(17, "span", 15);
    \u0275\u0275text(18, "Ver Tour Guiado");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(19, NavbarComponent_header_0_div_19_Template, 6, 2, "div", 16);
    \u0275\u0275elementStart(20, "div", 17)(21, "button", 18);
    \u0275\u0275listener("click", function NavbarComponent_header_0_Template_button_click_21_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.toggleMenuUsuario($event));
    });
    \u0275\u0275elementStart(22, "div", 19);
    \u0275\u0275text(23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "span", 20);
    \u0275\u0275text(25);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "span", 21);
    \u0275\u0275text(27, "\u25BC");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(28, NavbarComponent_header_0_div_28_Template, 14, 3, "div", 22);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275classProp("badge-admin", ctx_r1.rolActual === "ADMIN")("badge-simulated", ctx_r1.rolSimulado);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.rolActual === "ADMIN" && !ctx_r1.rolSimulado);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.rolSimulado);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.rolActual !== "ADMIN" && !ctx_r1.rolSimulado);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.rolActual !== "DIRECTORIO");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.rolActual === "DIRECTORIO" || ctx_r1.rolActual === "ADMIN");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.esAdminReal);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx_r1.esAdminReal || ctx_r1.rolActual === "ADMIN");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.usuarioLogueado.charAt(0).toUpperCase());
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.usuarioLogueado);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.menuUsuarioAbierto);
  }
}
var NavbarComponent = class _NavbarComponent {
  authService = inject(AuthService);
  notificacionService = inject(NotificacionService);
  tourService = inject(TourService);
  router = inject(Router);
  elementRef = inject(ElementRef);
  cdr = inject(ChangeDetectorRef);
  usuarioLogueado = "";
  rolActual = "";
  esAdminReal = false;
  rolSimulado = "";
  rolesDisponibles = [];
  notificaciones = [];
  noLeidasCount = 0;
  notificacionesAbiertas = false;
  menuUsuarioAbierto = false;
  subs = new Subscription();
  get mostrarNavbar() {
    const enLogin = this.router.url.includes("/login");
    return this.authService.isLoggedIn() && !enLogin;
  }
  ngOnInit() {
    this.actualizarEstadoUsuario();
    this.subs.add(this.authService.autenticado$.subscribe((isAuth) => {
      if (isAuth) {
        this.actualizarEstadoUsuario();
      } else {
        this.usuarioLogueado = "";
        this.esAdminReal = false;
        this.rolActual = "";
        this.rolSimulado = "";
        this.rolesDisponibles = [];
      }
      this.cdr.markForCheck();
    }));
    this.subs.add(this.authService.rolActual$.subscribe((rol) => {
      if (this.authService.isLoggedIn()) {
        this.rolActual = rol;
        this.usuarioLogueado = this.authService.obtenerUsuario();
        this.esAdminReal = this.authService.esAdminReal();
        this.validarRutaParaRol(rol);
        this.cdr.markForCheck();
      }
    }));
    this.subs.add(this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.actualizarEstadoUsuario();
      }
    }));
    this.subs.add(this.notificacionService.notificaciones$.subscribe((list) => {
      this.notificaciones = list;
      this.cdr.markForCheck();
    }));
    this.subs.add(this.notificacionService.noLeidasCount$.subscribe((count) => {
      this.noLeidasCount = count;
      this.cdr.markForCheck();
    }));
  }
  actualizarEstadoUsuario() {
    if (this.authService.isLoggedIn()) {
      this.usuarioLogueado = this.authService.obtenerUsuario();
      this.esAdminReal = this.authService.esAdminReal();
      this.rolActual = this.authService.obtenerRol();
      this.rolSimulado = this.authService.obtenerRolReal() !== this.rolActual ? this.rolActual : "";
      if (this.esAdminReal) {
        this.authService.obtenerRolesDisponibles().subscribe({
          next: (roles) => {
            this.rolesDisponibles = roles || [];
            this.cdr.markForCheck();
          },
          error: (err) => console.warn("Error al cargar roles din\xE1micos:", err)
        });
        this.notificacionService.cargarNotificaciones();
      }
    } else {
      this.usuarioLogueado = "";
      this.esAdminReal = false;
      this.rolActual = "";
      this.rolSimulado = "";
      this.rolesDisponibles = [];
    }
    this.cdr.markForCheck();
  }
  formatearNombreRol(rol) {
    if (!rol)
      return "";
    const upper = rol.trim().toUpperCase();
    if (upper === "ADMIN")
      return "Administrador del Sistema";
    if (upper === "OPERADOR")
      return "Operador de D\xE9bitos";
    if (upper === "AUDITOR")
      return "Auditor (Solo Consulta)";
    if (upper === "DIRECTORIO")
      return "Directorio";
    return rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
  }
  get mostrarSubtituloRol() {
    if (!this.rolActual)
      return false;
    const desc = this.formatearNombreRol(this.rolActual);
    return desc.trim().toLowerCase() !== this.usuarioLogueado.trim().toLowerCase();
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  toggleNotificaciones(event) {
    if (event) {
      event.stopPropagation();
    }
    this.notificacionesAbiertas = !this.notificacionesAbiertas;
    this.menuUsuarioAbierto = false;
    if (this.notificacionesAbiertas) {
      this.notificacionService.cargarNotificaciones();
    }
  }
  toggleMenuUsuario(event) {
    if (event) {
      event.stopPropagation();
    }
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
    this.notificacionesAbiertas = false;
  }
  cambiarRolSimulado(nuevoRol) {
    if (nuevoRol === "REAL" || !nuevoRol) {
      this.authService.simularRol(null);
      this.rolSimulado = "";
    } else {
      this.authService.simularRol(nuevoRol);
      this.rolSimulado = nuevoRol;
    }
    this.validarRutaParaRol(this.authService.obtenerRol());
  }
  validarRutaParaRol(rol) {
    if (!rol)
      return;
    const rolUpper = rol.toUpperCase();
    const urlActual = this.router.url;
    if (urlActual.includes("/directorio") && rolUpper !== "ADMIN" && rolUpper !== "DIRECTORIO") {
      this.router.navigate(["/auditoria"]);
    } else if (urlActual.includes("/auditoria") && rolUpper === "DIRECTORIO") {
      this.router.navigate(["/directorio"]);
    }
  }
  marcarComoLeida(notif, event) {
    event.stopPropagation();
    this.notificacionService.marcarComoLeida(notif.id);
  }
  marcarTodasComoLeidas(event) {
    if (event) {
      event.stopPropagation();
    }
    this.notificacionService.marcarTodasComoLeidas();
  }
  iniciarTourGuiado() {
    if (this.router.url !== "/auditoria") {
      this.router.navigate(["/auditoria"]).then(() => {
        setTimeout(() => {
          this.tourService.startFullTour(true);
        }, 350);
      });
    } else {
      this.tourService.startFullTour(true);
    }
  }
  abrirComprobante(notif) {
    this.notificacionesAbiertas = false;
    this.notificacionService.navegarAComprobante(notif);
  }
  onLogout() {
    this.menuUsuarioAbierto = false;
    this.notificacionesAbiertas = false;
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
  formatearFecha(fechaStr) {
    if (!fechaStr)
      return "";
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime()))
        return fechaStr;
      const hoy = /* @__PURE__ */ new Date();
      const diffMs = hoy.getTime() - fecha.getTime();
      const diffMins = Math.floor(diffMs / 6e4);
      const diffHoras = Math.floor(diffMins / 60);
      if (diffMins < 1)
        return "Hace un momento";
      if (diffMins < 60)
        return `Hace ${diffMins} min`;
      if (diffHoras < 24)
        return `Hace ${diffHoras} h`;
      return fecha.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return fechaStr;
    }
  }
  trackByNotifId(_index, notif) {
    return notif.id;
  }
  onDocumentClick(event) {
    const target = event.target;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.notificacionesAbiertas = false;
      this.menuUsuarioAbierto = false;
    }
  }
  static \u0275fac = function NavbarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NavbarComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NavbarComponent, selectors: [["app-navbar"]], hostBindings: function NavbarComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275listener("click", function NavbarComponent_click_HostBindingHandler($event) {
        return ctx.onDocumentClick($event);
      }, \u0275\u0275resolveDocument);
    }
  }, decls: 1, vars: 1, consts: [["class", "app-navbar", 4, "ngIf"], [1, "app-navbar"], [1, "navbar-container"], [1, "navbar-left"], ["routerLink", "/auditoria", 1, "navbar-brand"], [1, "brand-title"], [1, "role-badge"], [4, "ngIf"], [1, "navbar-center"], [1, "nav-links"], ["routerLink", "/auditoria", "routerLinkActive", "active-link", "class", "nav-item", 4, "ngIf"], ["routerLink", "/directorio", "routerLinkActive", "active-link", "class", "nav-item", 4, "ngIf"], ["class", "role-switcher-container", 4, "ngIf"], [1, "navbar-right"], ["type", "button", "title", "Iniciar Tour Guiado interactivo", 1, "btn-navbar-tour", 3, "click"], [1, "tour-label"], ["class", "notification-wrapper", 4, "ngIf"], [1, "user-menu-wrapper"], [1, "btn-user-profile", 3, "click"], [1, "user-avatar"], [1, "user-name"], [1, "dropdown-chevron"], ["class", "dropdown-panel user-dropdown", 3, "click", 4, "ngIf"], ["routerLink", "/auditoria", "routerLinkActive", "active-link", 1, "nav-item"], [1, "nav-label"], ["routerLink", "/directorio", "routerLinkActive", "active-link", 1, "nav-item"], [1, "role-switcher-container"], [1, "switcher-label"], [1, "role-select", 3, "ngModelChange", "ngModel"], ["value", "REAL"], [3, "value", 4, "ngFor", "ngForOf"], [3, "value"], [1, "notification-wrapper"], ["title", "Notificaciones de ingresos de comprobantes", 1, "btn-icon-bell", 3, "click"], [1, "bell-icon"], ["class", "notification-badge", 4, "ngIf"], ["class", "dropdown-panel notification-dropdown", 3, "click", 4, "ngIf"], [1, "notification-badge"], [1, "dropdown-panel", "notification-dropdown", 3, "click"], [1, "dropdown-header"], [1, "dropdown-header-title"], [1, "header-icon"], [1, "btn-mark-all", 3, "click"], [1, "notification-list"], ["class", "empty-notifications", 4, "ngIf"], ["class", "notification-item", 3, "unread", "read", "click", 4, "ngFor", "ngForOf"], [1, "empty-notifications"], [1, "empty-icon"], [1, "notification-item", 3, "click"], [1, "notif-doc-badge"], [1, "notif-content"], [1, "notif-header-line"], [1, "notif-user"], ["class", "new-dot-pill", 4, "ngIf"], [1, "notif-time"], [1, "notif-msg"], [1, "notif-actions"], [1, "btn-view-doc"], ["class", "btn-mark-read", 3, "click", 4, "ngIf"], ["class", "label-already-read", 4, "ngIf"], [1, "new-dot-pill"], [1, "btn-mark-read", 3, "click"], [1, "label-already-read"], [1, "dropdown-panel", "user-dropdown", 3, "click"], [1, "user-info-card"], [1, "avatar-large"], [1, "user-info-text"], [1, "dropdown-divider"], [1, "dropdown-item", "logout-item", 3, "click"], [1, "item-icon"]], template: function NavbarComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, NavbarComponent_header_0_Template, 29, 14, "header", 0);
    }
    if (rf & 2) {
      \u0275\u0275property("ngIf", ctx.mostrarNavbar);
    }
  }, dependencies: [CommonModule, NgForOf, NgIf, RouterModule, RouterLink, RouterLinkActive, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, SelectControlValueAccessor, NgControlStatus, NgModel], styles: ["\n.app-navbar[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  left: 0;\n  right: 0;\n  width: 100%;\n  height: 64px;\n  background: #0f172a;\n  background:\n    linear-gradient(\n      135deg,\n      #0b0f19 0%,\n      #0f172a 50%,\n      #1e293b 100%);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);\n  z-index: 1000;\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  -webkit-user-select: none;\n  user-select: none;\n}\n.navbar-container[_ngcontent-%COMP%] {\n  max-width: 1600px;\n  margin: 0 auto;\n  height: 100%;\n  padding: 0 1.5rem;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n}\n.navbar-left[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1.25rem;\n}\n.navbar-brand[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n  text-decoration: none;\n  cursor: pointer;\n  transition: transform 0.2s ease;\n}\n.navbar-brand[_ngcontent-%COMP%]:hover {\n  transform: translateY(-1px);\n}\n.brand-icon[_ngcontent-%COMP%] {\n  font-size: 1.4rem;\n  background: rgba(99, 102, 241, 0.15);\n  border: 1px solid rgba(99, 102, 241, 0.3);\n  padding: 0.25rem 0.45rem;\n  border-radius: 8px;\n  box-shadow: 0 0 12px rgba(99, 102, 241, 0.25);\n}\n.brand-title[_ngcontent-%COMP%] {\n  font-size: 1.25rem;\n  font-weight: 700;\n  color: #f8fafc;\n  letter-spacing: -0.02em;\n}\n.brand-subtitle[_ngcontent-%COMP%] {\n  color: #38bdf8;\n  font-weight: 600;\n}\n.role-badge[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  padding: 0.25rem 0.65rem;\n  border-radius: 9999px;\n  background: rgba(148, 163, 184, 0.12);\n  color: #94a3b8;\n  border: 1px solid rgba(148, 163, 184, 0.25);\n  display: inline-flex;\n  align-items: center;\n  gap: 0.35rem;\n}\n.role-badge.badge-admin[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(99, 102, 241, 0.2) 0%,\n      rgba(168, 85, 247, 0.2) 100%);\n  color: #c084fc;\n  border: 1px solid rgba(192, 132, 252, 0.4);\n  box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);\n}\n.role-badge.badge-simulated[_ngcontent-%COMP%] {\n  background: rgba(245, 158, 11, 0.18);\n  color: #fbbf24;\n  border: 1px solid rgba(245, 158, 11, 0.4);\n}\n.navbar-center[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1.5rem;\n}\n.nav-links[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.nav-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.45rem 0.85rem;\n  border-radius: 8px;\n  color: #94a3b8;\n  text-decoration: none;\n  font-size: 0.9rem;\n  font-weight: 500;\n  transition: all 0.2s ease;\n  background: transparent;\n}\n.nav-item[_ngcontent-%COMP%]:hover {\n  color: #f8fafc;\n  background: rgba(255, 255, 255, 0.06);\n}\n.nav-item.active-link[_ngcontent-%COMP%] {\n  color: #38bdf8;\n  background: rgba(56, 189, 248, 0.1);\n  border: 1px solid rgba(56, 189, 248, 0.25);\n}\n.role-switcher-container[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  background: rgba(15, 23, 42, 0.6);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  padding: 0.25rem 0.6rem;\n  border-radius: 8px;\n}\n.switcher-label[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  font-weight: 600;\n  color: #94a3b8;\n  text-transform: uppercase;\n}\n.role-select[_ngcontent-%COMP%] {\n  background: #1e293b;\n  color: #f8fafc;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  padding: 0.25rem 0.5rem;\n  font-size: 0.82rem;\n  border-radius: 6px;\n  cursor: pointer;\n  outline: none;\n  transition: border-color 0.2s;\n}\n.role-select[_ngcontent-%COMP%]:focus {\n  border-color: #38bdf8;\n}\n.navbar-right[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n.btn-navbar-tour[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n  background:\n    linear-gradient(\n      135deg,\n      #0284c7 0%,\n      #0369a1 100%);\n  border: 1px solid rgba(56, 189, 248, 0.4);\n  color: #ffffff;\n  padding: 0.42rem 0.9rem;\n  border-radius: 8px;\n  font-size: 0.84rem;\n  font-weight: 600;\n  cursor: pointer;\n  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);\n  transition: all 0.2s ease-in-out;\n}\n.btn-navbar-tour[_ngcontent-%COMP%]:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #0369a1 0%,\n      #075985 100%);\n  border-color: #38bdf8;\n  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);\n  transform: translateY(-1px);\n}\n.btn-navbar-tour[_ngcontent-%COMP%]   .tour-icon[_ngcontent-%COMP%] {\n  font-size: 0.95rem;\n}\n.notification-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n}\n.btn-icon-bell[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  width: 40px;\n  height: 40px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  position: relative;\n  transition: all 0.2s ease;\n  color: #cbd5e1;\n}\n.btn-icon-bell[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.12);\n  color: #f8fafc;\n  transform: scale(1.05);\n}\n.bell-icon[_ngcontent-%COMP%] {\n  font-size: 1.15rem;\n}\n.notification-badge[_ngcontent-%COMP%] {\n  position: absolute;\n  top: -2px;\n  right: -2px;\n  background: #ef4444;\n  color: #ffffff;\n  font-size: 0.68rem;\n  font-weight: 700;\n  min-width: 18px;\n  height: 18px;\n  border-radius: 9999px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0 4px;\n  border: 2px solid #0f172a;\n  animation: _ngcontent-%COMP%_pulse-badge 2s infinite;\n}\n@keyframes _ngcontent-%COMP%_pulse-badge {\n  0% {\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);\n  }\n  70% {\n    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);\n  }\n  100% {\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);\n  }\n}\n.dropdown-panel[_ngcontent-%COMP%] {\n  position: absolute;\n  top: calc(100% + 12px);\n  right: 0;\n  background: #1e293b;\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  border-radius: 12px;\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);\n  -webkit-backdrop-filter: blur(16px);\n  backdrop-filter: blur(16px);\n  animation: _ngcontent-%COMP%_dropdown-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n  z-index: 1050;\n}\n@keyframes _ngcontent-%COMP%_dropdown-fade-in {\n  from {\n    opacity: 0;\n    transform: translateY(-8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.notification-dropdown[_ngcontent-%COMP%] {\n  width: 380px;\n  max-width: 90vw;\n  overflow: hidden;\n}\n.dropdown-header[_ngcontent-%COMP%] {\n  padding: 0.85rem 1.1rem;\n  background: rgba(15, 23, 42, 0.85);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n.dropdown-header-title[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.dropdown-header-title[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 0.9rem;\n  font-weight: 600;\n  color: #f8fafc;\n}\n.unread-count-tag[_ngcontent-%COMP%] {\n  background: rgba(56, 189, 248, 0.15);\n  color: #38bdf8;\n  border: 1px solid rgba(56, 189, 248, 0.3);\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 9999px;\n}\n.btn-mark-all[_ngcontent-%COMP%] {\n  background: rgba(56, 189, 248, 0.1);\n  border: 1px solid rgba(56, 189, 248, 0.25);\n  color: #38bdf8;\n  font-size: 0.74rem;\n  font-weight: 600;\n  cursor: pointer;\n  padding: 0.25rem 0.55rem;\n  border-radius: 6px;\n  transition: all 0.15s ease;\n}\n.btn-mark-all[_ngcontent-%COMP%]:hover {\n  background: #38bdf8;\n  color: #0f172a;\n}\n.notification-list[_ngcontent-%COMP%] {\n  max-height: 420px;\n  overflow-y: auto;\n}\n.notification-list[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 6px;\n}\n.notification-list[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: #334155;\n  border-radius: 3px;\n}\n.empty-notifications[_ngcontent-%COMP%] {\n  padding: 2.5rem 1rem;\n  text-align: center;\n  color: #64748b;\n}\n.empty-icon[_ngcontent-%COMP%] {\n  font-size: 2rem;\n  display: block;\n  margin-bottom: 0.5rem;\n}\n.empty-notifications[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 0.88rem;\n}\n.notification-item[_ngcontent-%COMP%] {\n  padding: 0.9rem 1rem;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n  display: flex;\n  gap: 0.85rem;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n.notification-item.unread[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(30, 41, 59, 0.95) 0%,\n      rgba(30, 58, 138, 0.25) 100%);\n  border-left: 4px solid #38bdf8;\n  box-shadow: inset 0 0 12px rgba(56, 189, 248, 0.06);\n}\n.notification-item.unread[_ngcontent-%COMP%]:hover {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(51, 65, 85, 0.95) 0%,\n      rgba(30, 58, 138, 0.35) 100%);\n}\n.notification-item.unread[_ngcontent-%COMP%]   .notif-user[_ngcontent-%COMP%] {\n  color: #ffffff;\n  font-weight: 700;\n}\n.notification-item.unread[_ngcontent-%COMP%]   .notif-msg[_ngcontent-%COMP%] {\n  color: #f1f5f9;\n  font-weight: 500;\n}\n.notification-item.read[_ngcontent-%COMP%] {\n  background: rgba(15, 23, 42, 0.45);\n  border-left: 4px solid transparent;\n  opacity: 0.8;\n}\n.notification-item.read[_ngcontent-%COMP%]:hover {\n  background: rgba(30, 41, 59, 0.6);\n  opacity: 1;\n}\n.notification-item.read[_ngcontent-%COMP%]   .notif-user[_ngcontent-%COMP%] {\n  color: #94a3b8;\n}\n.notification-item.read[_ngcontent-%COMP%]   .notif-msg[_ngcontent-%COMP%] {\n  color: #64748b;\n}\n.notification-item.read[_ngcontent-%COMP%]   .notif-doc-badge[_ngcontent-%COMP%] {\n  opacity: 0.7;\n}\n.new-dot-pill[_ngcontent-%COMP%] {\n  background: rgba(56, 189, 248, 0.2);\n  color: #38bdf8;\n  border: 1px solid rgba(56, 189, 248, 0.4);\n  font-size: 0.62rem;\n  font-weight: 800;\n  border-radius: 4px;\n  padding: 0.1rem 0.35rem;\n  margin-left: 0.35rem;\n  letter-spacing: 0.05em;\n  display: inline-block;\n}\n.notif-doc-badge[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.3rem 0.5rem;\n  height: fit-content;\n  border-radius: 6px;\n  background: #334155;\n  color: #f8fafc;\n}\n.notif-doc-badge.badge-nc[_ngcontent-%COMP%] {\n  background: #6366f1;\n  color: #ffffff;\n}\n.notif-doc-badge.badge-nd[_ngcontent-%COMP%] {\n  background: #ea580c;\n  color: #ffffff;\n}\n.notif-doc-badge.badge-faltante[_ngcontent-%COMP%] {\n  background: #ef4444;\n  color: #ffffff;\n  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);\n}\n.notif-content[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.notif-header-line[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.25rem;\n}\n.notif-user[_ngcontent-%COMP%] {\n  font-size: 0.78rem;\n  font-weight: 600;\n  color: #e2e8f0;\n  display: flex;\n  align-items: center;\n}\n.notif-time[_ngcontent-%COMP%] {\n  font-size: 0.72rem;\n  color: #64748b;\n}\n.notif-msg[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem 0;\n  font-size: 0.82rem;\n  line-height: 1.35;\n}\n.notif-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  align-items: center;\n}\n.btn-view-doc[_ngcontent-%COMP%] {\n  background: rgba(56, 189, 248, 0.15);\n  color: #38bdf8;\n  border: 1px solid rgba(56, 189, 248, 0.3);\n  padding: 0.2rem 0.55rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.btn-view-doc[_ngcontent-%COMP%]:hover {\n  background: #38bdf8;\n  color: #0f172a;\n}\n.btn-mark-read[_ngcontent-%COMP%] {\n  background: transparent;\n  color: #94a3b8;\n  border: 1px solid rgba(148, 163, 184, 0.2);\n  padding: 0.2rem 0.5rem;\n  font-size: 0.72rem;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.btn-mark-read[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.08);\n  color: #f8fafc;\n}\n.label-already-read[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.72rem;\n  font-weight: 500;\n  display: inline-flex;\n  align-items: center;\n  gap: 0.25rem;\n}\n.user-menu-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n}\n.btn-user-profile[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  padding: 0.35rem 0.75rem 0.35rem 0.45rem;\n  border-radius: 9999px;\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n  cursor: pointer;\n  color: #f8fafc;\n  transition: all 0.2s ease;\n}\n.btn-user-profile[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.1);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n.user-avatar[_ngcontent-%COMP%] {\n  width: 30px;\n  height: 30px;\n  border-radius: 50%;\n  background:\n    linear-gradient(\n      135deg,\n      #6366f1 0%,\n      #38bdf8 100%);\n  color: #ffffff;\n  font-weight: 700;\n  font-size: 0.85rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.user-name[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  font-weight: 600;\n  max-width: 120px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.dropdown-chevron[_ngcontent-%COMP%] {\n  font-size: 0.65rem;\n  color: #94a3b8;\n}\n.user-dropdown[_ngcontent-%COMP%] {\n  width: 240px;\n  padding: 0.5rem;\n}\n.user-info-card[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.75rem;\n}\n.avatar-large[_ngcontent-%COMP%] {\n  width: 40px;\n  height: 40px;\n  border-radius: 50%;\n  background:\n    linear-gradient(\n      135deg,\n      #6366f1 0%,\n      #38bdf8 100%);\n  color: #ffffff;\n  font-weight: 700;\n  font-size: 1.1rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.user-info-text[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.9rem;\n  color: #f8fafc;\n}\n.user-info-text[_ngcontent-%COMP%]   small[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: #94a3b8;\n}\n.dropdown-divider[_ngcontent-%COMP%] {\n  height: 1px;\n  background: rgba(255, 255, 255, 0.08);\n  margin: 0.35rem 0;\n}\n.dropdown-item[_ngcontent-%COMP%] {\n  width: 100%;\n  background: transparent;\n  border: none;\n  padding: 0.6rem 0.75rem;\n  color: #cbd5e1;\n  font-size: 0.85rem;\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  text-align: left;\n}\n.dropdown-item[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.06);\n  color: #f8fafc;\n}\n.logout-item[_ngcontent-%COMP%]:hover {\n  background: rgba(239, 68, 68, 0.15);\n  color: #f87171;\n}\n@media (max-width: 768px) {\n  .navbar-container[_ngcontent-%COMP%] {\n    padding: 0 0.85rem;\n  }\n  .brand-title[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .role-switcher-container[_ngcontent-%COMP%]   .switcher-label[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .nav-label[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .user-name[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .notification-dropdown[_ngcontent-%COMP%] {\n    width: 320px;\n  }\n}\n/*# sourceMappingURL=navbar.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NavbarComponent, [{
    type: Component,
    args: [{ selector: "app-navbar", standalone: true, imports: [CommonModule, RouterModule, FormsModule], template: `<header class="app-navbar" *ngIf="mostrarNavbar">
  <div class="navbar-container">

    <!-- Lado Izquierdo: Branding & Rol -->
    <div class="navbar-left">
      <a routerLink="/auditoria" class="navbar-brand">
        <span class="brand-title">D\xE9bitos</span>
      </a>

      <div class="role-badge" [class.badge-admin]="rolActual === 'ADMIN'" [class.badge-simulated]="rolSimulado">
        <span *ngIf="rolActual === 'ADMIN' && !rolSimulado">ADMIN</span>
        <span *ngIf="rolSimulado">VISTA: {{ rolSimulado }}</span>
        <span *ngIf="rolActual !== 'ADMIN' && !rolSimulado">{{ rolActual }}</span>
      </div>
    </div>

    <!-- Centro: Navegaci\xF3n & Selector de Simulaci\xF3n (para Admin) -->
    <div class="navbar-center">
      <nav class="nav-links">
        <a routerLink="/auditoria" routerLinkActive="active-link" class="nav-item" *ngIf="rolActual !== 'DIRECTORIO'">
          <span class="nav-label">Buscador de Documentos</span>
        </a>
        <a routerLink="/directorio" routerLinkActive="active-link" class="nav-item" *ngIf="rolActual === 'DIRECTORIO' || rolActual === 'ADMIN'">
          <span class="nav-label">Tablero de Control</span>
        </a>
      </nav>

      <!-- Selector exclusivo para Administrador: Ver como otro rol -->
      <div class="role-switcher-container" *ngIf="esAdminReal">
        <span class="switcher-label">Ver como:</span>
        <select class="role-select" [ngModel]="rolSimulado ? rolSimulado : 'REAL'"
          (ngModelChange)="cambiarRolSimulado($event)">
          <option value="REAL">Administrador (Actual)</option>
          <option *ngFor="let rol of rolesDisponibles" [value]="rol">
            {{ formatearNombreRol(rol) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Lado Derecho: Tour Guiado, Notificaciones & Men\xFA de Perfil -->
    <div class="navbar-right">

      <!-- Bot\xF3n Ver Tour Guiado -->
      <button type="button" class="btn-navbar-tour" (click)="iniciarTourGuiado()"
        title="Iniciar Tour Guiado interactivo">
        <span class="tour-label">Ver Tour Guiado</span>
      </button>

      <!-- Campana de Notificaciones (para Admin) -->
      <div class="notification-wrapper" *ngIf="esAdminReal || rolActual === 'ADMIN'">
        <button class="btn-icon-bell" (click)="toggleNotificaciones($event)"
          title="Notificaciones de ingresos de comprobantes">
          <span class="bell-icon">\u{1F514}</span>
          <span class="notification-badge" *ngIf="noLeidasCount > 0">
            {{ noLeidasCount > 99 ? '99+' : noLeidasCount }}
          </span>
        </button>

        <!-- Dropdown de Notificaciones -->
        <div class="dropdown-panel notification-dropdown" *ngIf="notificacionesAbiertas"
          (click)="$event.stopPropagation()">
          <div class="dropdown-header">
            <div class="dropdown-header-title">
              <span class="header-icon">\u{1F514}</span>
              <h4>Notificaciones</h4>
            </div>
            <button class="btn-mark-all" (click)="marcarTodasComoLeidas($event)">
              \u2713 Ver todas
            </button>
          </div>

          <div class="notification-list">
            <div *ngIf="notificaciones.length === 0" class="empty-notifications">
              <span class="empty-icon">\u{1F4ED}</span>
              <p>No hay notificaciones registradas</p>
            </div>

            <div *ngFor="let notif of notificaciones" class="notification-item" [class.unread]="!notif.leida"
              [class.read]="notif.leida" (click)="abrirComprobante(notif)">

              <div class="notif-doc-badge"
                [class.badge-nc]="notif.tipoDoc === 'NC' && notif.tipoNotificacion !== 'DOC_NO_ENCONTRADO'"
                [class.badge-nd]="notif.tipoDoc === 'ND' && notif.tipoNotificacion !== 'DOC_NO_ENCONTRADO'"
                [class.badge-faltante]="notif.tipoNotificacion === 'DOC_NO_ENCONTRADO' || notif.evento === 'DOC_NO_ENCONTRADO'">
                {{ (notif.tipoNotificacion === 'DOC_NO_ENCONTRADO' || notif.evento === 'DOC_NO_ENCONTRADO') ? 'AUSENTE'
                : (notif.tipoDoc || 'DOC') }}
              </div>

              <div class="notif-content">
                <div class="notif-header-line">
                  <span class="notif-user">
                    {{ notif.usuario }}
                    <span class="new-dot-pill" *ngIf="!notif.leida">\u25CF NUEVA</span>
                  </span>
                  <span class="notif-time">{{ formatearFecha(notif.fechaHora) }}</span>
                </div>
                <p class="notif-msg">{{ notif.mensaje }}</p>
                <div class="notif-actions">
                  <button class="btn-view-doc">
                    {{ (notif.tipoNotificacion === 'DOC_NO_ENCONTRADO' || notif.evento === 'DOC_NO_ENCONTRADO') ? 'Ver
                    Reporte \u2794' : 'Ver en Auditor\xEDa \u2794' }}
                  </button>
                  <button class="btn-mark-read" *ngIf="!notif.leida" (click)="marcarComoLeida(notif, $event)">
                    \u2713 Marcar vista
                  </button>
                  <span class="label-already-read" *ngIf="notif.leida">
                    \u2713 Vista
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Men\xFA de Usuario -->
      <div class="user-menu-wrapper">
        <button class="btn-user-profile" (click)="toggleMenuUsuario($event)">
          <div class="user-avatar">{{ usuarioLogueado.charAt(0).toUpperCase() }}</div>
          <span class="user-name">{{ usuarioLogueado }}</span>
          <span class="dropdown-chevron">\u25BC</span>
        </button>

        <!-- Dropdown de Usuario -->
        <div class="dropdown-panel user-dropdown" *ngIf="menuUsuarioAbierto" (click)="$event.stopPropagation()">
          <div class="user-info-card">
            <div class="avatar-large">{{ usuarioLogueado.charAt(0).toUpperCase() }}</div>
            <div class="user-info-text">
              <strong>{{ usuarioLogueado }}</strong>
              <small *ngIf="mostrarSubtituloRol">{{ formatearNombreRol(rolActual) }}</small>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <button class="dropdown-item logout-item" (click)="onLogout()">
            <span class="item-icon">\u{1F6AA}</span>
            <span>Cerrar Sesi\xF3n</span>
          </button>
        </div>
      </div>

    </div>

  </div>
</header>`, styles: ["/* src/app/core/components/navbar/navbar.css */\n.app-navbar {\n  position: sticky;\n  top: 0;\n  left: 0;\n  right: 0;\n  width: 100%;\n  height: 64px;\n  background: #0f172a;\n  background:\n    linear-gradient(\n      135deg,\n      #0b0f19 0%,\n      #0f172a 50%,\n      #1e293b 100%);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);\n  z-index: 1000;\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  -webkit-user-select: none;\n  user-select: none;\n}\n.navbar-container {\n  max-width: 1600px;\n  margin: 0 auto;\n  height: 100%;\n  padding: 0 1.5rem;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n}\n.navbar-left {\n  display: flex;\n  align-items: center;\n  gap: 1.25rem;\n}\n.navbar-brand {\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n  text-decoration: none;\n  cursor: pointer;\n  transition: transform 0.2s ease;\n}\n.navbar-brand:hover {\n  transform: translateY(-1px);\n}\n.brand-icon {\n  font-size: 1.4rem;\n  background: rgba(99, 102, 241, 0.15);\n  border: 1px solid rgba(99, 102, 241, 0.3);\n  padding: 0.25rem 0.45rem;\n  border-radius: 8px;\n  box-shadow: 0 0 12px rgba(99, 102, 241, 0.25);\n}\n.brand-title {\n  font-size: 1.25rem;\n  font-weight: 700;\n  color: #f8fafc;\n  letter-spacing: -0.02em;\n}\n.brand-subtitle {\n  color: #38bdf8;\n  font-weight: 600;\n}\n.role-badge {\n  font-size: 0.75rem;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  padding: 0.25rem 0.65rem;\n  border-radius: 9999px;\n  background: rgba(148, 163, 184, 0.12);\n  color: #94a3b8;\n  border: 1px solid rgba(148, 163, 184, 0.25);\n  display: inline-flex;\n  align-items: center;\n  gap: 0.35rem;\n}\n.role-badge.badge-admin {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(99, 102, 241, 0.2) 0%,\n      rgba(168, 85, 247, 0.2) 100%);\n  color: #c084fc;\n  border: 1px solid rgba(192, 132, 252, 0.4);\n  box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);\n}\n.role-badge.badge-simulated {\n  background: rgba(245, 158, 11, 0.18);\n  color: #fbbf24;\n  border: 1px solid rgba(245, 158, 11, 0.4);\n}\n.navbar-center {\n  display: flex;\n  align-items: center;\n  gap: 1.5rem;\n}\n.nav-links {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.nav-item {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.45rem 0.85rem;\n  border-radius: 8px;\n  color: #94a3b8;\n  text-decoration: none;\n  font-size: 0.9rem;\n  font-weight: 500;\n  transition: all 0.2s ease;\n  background: transparent;\n}\n.nav-item:hover {\n  color: #f8fafc;\n  background: rgba(255, 255, 255, 0.06);\n}\n.nav-item.active-link {\n  color: #38bdf8;\n  background: rgba(56, 189, 248, 0.1);\n  border: 1px solid rgba(56, 189, 248, 0.25);\n}\n.role-switcher-container {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  background: rgba(15, 23, 42, 0.6);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  padding: 0.25rem 0.6rem;\n  border-radius: 8px;\n}\n.switcher-label {\n  font-size: 0.75rem;\n  font-weight: 600;\n  color: #94a3b8;\n  text-transform: uppercase;\n}\n.role-select {\n  background: #1e293b;\n  color: #f8fafc;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  padding: 0.25rem 0.5rem;\n  font-size: 0.82rem;\n  border-radius: 6px;\n  cursor: pointer;\n  outline: none;\n  transition: border-color 0.2s;\n}\n.role-select:focus {\n  border-color: #38bdf8;\n}\n.navbar-right {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n.btn-navbar-tour {\n  display: flex;\n  align-items: center;\n  gap: 0.45rem;\n  background:\n    linear-gradient(\n      135deg,\n      #0284c7 0%,\n      #0369a1 100%);\n  border: 1px solid rgba(56, 189, 248, 0.4);\n  color: #ffffff;\n  padding: 0.42rem 0.9rem;\n  border-radius: 8px;\n  font-size: 0.84rem;\n  font-weight: 600;\n  cursor: pointer;\n  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);\n  transition: all 0.2s ease-in-out;\n}\n.btn-navbar-tour:hover {\n  background:\n    linear-gradient(\n      135deg,\n      #0369a1 0%,\n      #075985 100%);\n  border-color: #38bdf8;\n  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);\n  transform: translateY(-1px);\n}\n.btn-navbar-tour .tour-icon {\n  font-size: 0.95rem;\n}\n.notification-wrapper {\n  position: relative;\n}\n.btn-icon-bell {\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  width: 40px;\n  height: 40px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  position: relative;\n  transition: all 0.2s ease;\n  color: #cbd5e1;\n}\n.btn-icon-bell:hover {\n  background: rgba(255, 255, 255, 0.12);\n  color: #f8fafc;\n  transform: scale(1.05);\n}\n.bell-icon {\n  font-size: 1.15rem;\n}\n.notification-badge {\n  position: absolute;\n  top: -2px;\n  right: -2px;\n  background: #ef4444;\n  color: #ffffff;\n  font-size: 0.68rem;\n  font-weight: 700;\n  min-width: 18px;\n  height: 18px;\n  border-radius: 9999px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0 4px;\n  border: 2px solid #0f172a;\n  animation: pulse-badge 2s infinite;\n}\n@keyframes pulse-badge {\n  0% {\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);\n  }\n  70% {\n    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);\n  }\n  100% {\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);\n  }\n}\n.dropdown-panel {\n  position: absolute;\n  top: calc(100% + 12px);\n  right: 0;\n  background: #1e293b;\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  border-radius: 12px;\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);\n  -webkit-backdrop-filter: blur(16px);\n  backdrop-filter: blur(16px);\n  animation: dropdown-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n  z-index: 1050;\n}\n@keyframes dropdown-fade-in {\n  from {\n    opacity: 0;\n    transform: translateY(-8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.notification-dropdown {\n  width: 380px;\n  max-width: 90vw;\n  overflow: hidden;\n}\n.dropdown-header {\n  padding: 0.85rem 1.1rem;\n  background: rgba(15, 23, 42, 0.85);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n.dropdown-header-title {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.dropdown-header-title h4 {\n  margin: 0;\n  font-size: 0.9rem;\n  font-weight: 600;\n  color: #f8fafc;\n}\n.unread-count-tag {\n  background: rgba(56, 189, 248, 0.15);\n  color: #38bdf8;\n  border: 1px solid rgba(56, 189, 248, 0.3);\n  font-size: 0.7rem;\n  font-weight: 700;\n  padding: 0.15rem 0.45rem;\n  border-radius: 9999px;\n}\n.btn-mark-all {\n  background: rgba(56, 189, 248, 0.1);\n  border: 1px solid rgba(56, 189, 248, 0.25);\n  color: #38bdf8;\n  font-size: 0.74rem;\n  font-weight: 600;\n  cursor: pointer;\n  padding: 0.25rem 0.55rem;\n  border-radius: 6px;\n  transition: all 0.15s ease;\n}\n.btn-mark-all:hover {\n  background: #38bdf8;\n  color: #0f172a;\n}\n.notification-list {\n  max-height: 420px;\n  overflow-y: auto;\n}\n.notification-list::-webkit-scrollbar {\n  width: 6px;\n}\n.notification-list::-webkit-scrollbar-thumb {\n  background: #334155;\n  border-radius: 3px;\n}\n.empty-notifications {\n  padding: 2.5rem 1rem;\n  text-align: center;\n  color: #64748b;\n}\n.empty-icon {\n  font-size: 2rem;\n  display: block;\n  margin-bottom: 0.5rem;\n}\n.empty-notifications p {\n  margin: 0;\n  font-size: 0.88rem;\n}\n.notification-item {\n  padding: 0.9rem 1rem;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n  display: flex;\n  gap: 0.85rem;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n.notification-item.unread {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(30, 41, 59, 0.95) 0%,\n      rgba(30, 58, 138, 0.25) 100%);\n  border-left: 4px solid #38bdf8;\n  box-shadow: inset 0 0 12px rgba(56, 189, 248, 0.06);\n}\n.notification-item.unread:hover {\n  background:\n    linear-gradient(\n      135deg,\n      rgba(51, 65, 85, 0.95) 0%,\n      rgba(30, 58, 138, 0.35) 100%);\n}\n.notification-item.unread .notif-user {\n  color: #ffffff;\n  font-weight: 700;\n}\n.notification-item.unread .notif-msg {\n  color: #f1f5f9;\n  font-weight: 500;\n}\n.notification-item.read {\n  background: rgba(15, 23, 42, 0.45);\n  border-left: 4px solid transparent;\n  opacity: 0.8;\n}\n.notification-item.read:hover {\n  background: rgba(30, 41, 59, 0.6);\n  opacity: 1;\n}\n.notification-item.read .notif-user {\n  color: #94a3b8;\n}\n.notification-item.read .notif-msg {\n  color: #64748b;\n}\n.notification-item.read .notif-doc-badge {\n  opacity: 0.7;\n}\n.new-dot-pill {\n  background: rgba(56, 189, 248, 0.2);\n  color: #38bdf8;\n  border: 1px solid rgba(56, 189, 248, 0.4);\n  font-size: 0.62rem;\n  font-weight: 800;\n  border-radius: 4px;\n  padding: 0.1rem 0.35rem;\n  margin-left: 0.35rem;\n  letter-spacing: 0.05em;\n  display: inline-block;\n}\n.notif-doc-badge {\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.3rem 0.5rem;\n  height: fit-content;\n  border-radius: 6px;\n  background: #334155;\n  color: #f8fafc;\n}\n.notif-doc-badge.badge-nc {\n  background: #6366f1;\n  color: #ffffff;\n}\n.notif-doc-badge.badge-nd {\n  background: #ea580c;\n  color: #ffffff;\n}\n.notif-doc-badge.badge-faltante {\n  background: #ef4444;\n  color: #ffffff;\n  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);\n}\n.notif-content {\n  flex: 1;\n}\n.notif-header-line {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.25rem;\n}\n.notif-user {\n  font-size: 0.78rem;\n  font-weight: 600;\n  color: #e2e8f0;\n  display: flex;\n  align-items: center;\n}\n.notif-time {\n  font-size: 0.72rem;\n  color: #64748b;\n}\n.notif-msg {\n  margin: 0 0 0.5rem 0;\n  font-size: 0.82rem;\n  line-height: 1.35;\n}\n.notif-actions {\n  display: flex;\n  gap: 0.5rem;\n  align-items: center;\n}\n.btn-view-doc {\n  background: rgba(56, 189, 248, 0.15);\n  color: #38bdf8;\n  border: 1px solid rgba(56, 189, 248, 0.3);\n  padding: 0.2rem 0.55rem;\n  font-size: 0.75rem;\n  font-weight: 600;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.btn-view-doc:hover {\n  background: #38bdf8;\n  color: #0f172a;\n}\n.btn-mark-read {\n  background: transparent;\n  color: #94a3b8;\n  border: 1px solid rgba(148, 163, 184, 0.2);\n  padding: 0.2rem 0.5rem;\n  font-size: 0.72rem;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.btn-mark-read:hover {\n  background: rgba(255, 255, 255, 0.08);\n  color: #f8fafc;\n}\n.label-already-read {\n  color: #64748b;\n  font-size: 0.72rem;\n  font-weight: 500;\n  display: inline-flex;\n  align-items: center;\n  gap: 0.25rem;\n}\n.user-menu-wrapper {\n  position: relative;\n}\n.btn-user-profile {\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  padding: 0.35rem 0.75rem 0.35rem 0.45rem;\n  border-radius: 9999px;\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n  cursor: pointer;\n  color: #f8fafc;\n  transition: all 0.2s ease;\n}\n.btn-user-profile:hover {\n  background: rgba(255, 255, 255, 0.1);\n  border-color: rgba(255, 255, 255, 0.2);\n}\n.user-avatar {\n  width: 30px;\n  height: 30px;\n  border-radius: 50%;\n  background:\n    linear-gradient(\n      135deg,\n      #6366f1 0%,\n      #38bdf8 100%);\n  color: #ffffff;\n  font-weight: 700;\n  font-size: 0.85rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.user-name {\n  font-size: 0.85rem;\n  font-weight: 600;\n  max-width: 120px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.dropdown-chevron {\n  font-size: 0.65rem;\n  color: #94a3b8;\n}\n.user-dropdown {\n  width: 240px;\n  padding: 0.5rem;\n}\n.user-info-card {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.75rem;\n}\n.avatar-large {\n  width: 40px;\n  height: 40px;\n  border-radius: 50%;\n  background:\n    linear-gradient(\n      135deg,\n      #6366f1 0%,\n      #38bdf8 100%);\n  color: #ffffff;\n  font-weight: 700;\n  font-size: 1.1rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.user-info-text strong {\n  display: block;\n  font-size: 0.9rem;\n  color: #f8fafc;\n}\n.user-info-text small {\n  font-size: 0.75rem;\n  color: #94a3b8;\n}\n.dropdown-divider {\n  height: 1px;\n  background: rgba(255, 255, 255, 0.08);\n  margin: 0.35rem 0;\n}\n.dropdown-item {\n  width: 100%;\n  background: transparent;\n  border: none;\n  padding: 0.6rem 0.75rem;\n  color: #cbd5e1;\n  font-size: 0.85rem;\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  text-align: left;\n}\n.dropdown-item:hover {\n  background: rgba(255, 255, 255, 0.06);\n  color: #f8fafc;\n}\n.logout-item:hover {\n  background: rgba(239, 68, 68, 0.15);\n  color: #f87171;\n}\n@media (max-width: 768px) {\n  .navbar-container {\n    padding: 0 0.85rem;\n  }\n  .brand-title {\n    display: none;\n  }\n  .role-switcher-container .switcher-label {\n    display: none;\n  }\n  .nav-label {\n    display: none;\n  }\n  .user-name {\n    display: none;\n  }\n  .notification-dropdown {\n    width: 320px;\n  }\n}\n/*# sourceMappingURL=navbar.css.map */\n"] }]
  }], null, { onDocumentClick: [{
    type: HostListener,
    args: ["document:click", ["$event"]]
  }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NavbarComponent, { className: "NavbarComponent", filePath: "src/app/core/components/navbar/navbar.ts", lineNumber: 18 });
})();

// src/app/app.ts
var App = class _App {
  title = signal("debitos-frontend", ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function App_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _App)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _App, selectors: [["app-root"]], decls: 4, vars: 0, template: function App_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275element(0, "app-loading-bar")(1, "app-notification-toast")(2, "app-navbar")(3, "router-outlet");
    }
  }, dependencies: [RouterOutlet, LoadingBarComponent, NotificationToastComponent, NavbarComponent], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(App, [{
    type: Component,
    args: [{ selector: "app-root", standalone: true, imports: [RouterOutlet, LoadingBarComponent, NotificationToastComponent, NavbarComponent], template: "<app-loading-bar></app-loading-bar>\r\n<app-notification-toast></app-notification-toast>\r\n<app-navbar></app-navbar>\r\n<router-outlet></router-outlet>\r\n\r\n" }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(App, { className: "App", filePath: "src/app/app.ts", lineNumber: 14 });
})();

// src/main.ts
registerLocaleData(es_AR_default, "es-AR");
Chart.register(...registerables);
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
//# sourceMappingURL=main.js.map
