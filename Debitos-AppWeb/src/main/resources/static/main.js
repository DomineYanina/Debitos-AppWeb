import {
  AuthService,
  Router,
  RouterOutlet,
  bootstrapApplication,
  provideHttpClient,
  provideRouter,
  withInterceptors
} from "./chunk-VA5JIUGY.js";
import {
  CommonModule,
  Component,
  Injectable,
  NgClass,
  NgForOf,
  NgIf,
  __spreadValues,
  catchError,
  finalize,
  inject,
  setClassMetadata,
  signal,
  throwError,
  ɵsetClassDebugInfo,
  ɵɵadvance,
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
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-QD5XYPYB.js";

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

// src/app/app.routes.ts
var routes = [
  {
    path: "login",
    loadComponent: () => import("./chunk-PNMUA2C2.js").then((m) => m.LoginComponent)
  },
  {
    path: "auditoria",
    loadComponent: () => import("./chunk-QJZ44TNW.js").then((m) => m.AuditoriaComponent),
    canActivate: [authGuard]
  },
  { path: "", redirectTo: "login", pathMatch: "full" }
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
    if (error.status === 401 && !req.url.includes("/login") && !req.url.includes("/auth")) {
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

// src/app/app.ts
var App = class _App {
  title = signal("debitos-frontend", ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function App_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _App)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _App, selectors: [["app-root"]], decls: 3, vars: 0, template: function App_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275element(0, "app-loading-bar")(1, "app-notification-toast")(2, "router-outlet");
    }
  }, dependencies: [RouterOutlet, LoadingBarComponent, NotificationToastComponent], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(App, [{
    type: Component,
    args: [{ selector: "app-root", standalone: true, imports: [RouterOutlet, LoadingBarComponent, NotificationToastComponent], template: "<app-loading-bar></app-loading-bar>\r\n<app-notification-toast></app-notification-toast>\r\n<router-outlet></router-outlet>\r\n" }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(App, { className: "App", filePath: "src/app/app.ts", lineNumber: 13 });
})();

// src/main.ts
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
//# sourceMappingURL=main.js.map
