import {
  DefaultValueAccessor,
  FormBuilder,
  FormControlName,
  FormGroupDirective,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-EAMCXTSE.js";
import {
  AuthService,
  Router
} from "./chunk-VA5JIUGY.js";
import {
  ChangeDetectorRef,
  CommonModule,
  Component,
  NgIf,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-QD5XYPYB.js";

// src/app/features/auth/login/login.ts
function LoginComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "span", 18);
    \u0275\u0275text(2, "\u26A0\uFE0F");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r0.mensajeError);
  }
}
function LoginComponent__svg_svg_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 19);
    \u0275\u0275element(1, "path", 20)(2, "circle", 21);
    \u0275\u0275elementEnd();
  }
}
function LoginComponent__svg_svg_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 19);
    \u0275\u0275element(1, "path", 22)(2, "line", 23);
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_span_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Olvid\xE9 mi contrase\xF1a");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_span_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275element(1, "span", 25);
    \u0275\u0275text(2, " Verificando usuario... ");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_span_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Ingresar");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_span_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275element(1, "span", 26);
    \u0275\u0275text(2, " Ingresando... ");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_div_24_div_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "span", 18);
    \u0275\u0275text(2, "\u26A0\uFE0F");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r0.mensajeErrorModal);
  }
}
function LoginComponent_div_24_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 42)(1, "span", 43);
    \u0275\u0275text(2, "\u2713");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r0.mensajeExitoModal);
  }
}
function LoginComponent_div_24__svg_svg_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 19);
    \u0275\u0275element(1, "path", 20)(2, "circle", 21);
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_div_24__svg_svg_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 19);
    \u0275\u0275element(1, "path", 22)(2, "line", 23);
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_div_24__svg_svg_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 19);
    \u0275\u0275element(1, "path", 20)(2, "circle", 21);
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_div_24__svg_svg_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 19);
    \u0275\u0275element(1, "path", 22)(2, "line", 23);
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_div_24_span_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span");
    \u0275\u0275text(1, "Modificar Contrase\xF1a");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_div_24_span_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275element(1, "span", 26);
    \u0275\u0275text(2, " Guardando... ");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_div_24_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275listener("click", function LoginComponent_div_24_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.cerrarModalOlvideClave());
    });
    \u0275\u0275elementStart(1, "div", 28);
    \u0275\u0275listener("click", function LoginComponent_div_24_Template_div_click_1_listener($event) {
      return $event.stopPropagation();
    });
    \u0275\u0275elementStart(2, "div", 29)(3, "h3");
    \u0275\u0275text(4, "Cambiar Contrase\xF1a");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 30);
    \u0275\u0275listener("click", function LoginComponent_div_24_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.cerrarModalOlvideClave());
    });
    \u0275\u0275text(6, "\xD7");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 31)(8, "p", 32);
    \u0275\u0275text(9, " Modificando contrase\xF1a para el usuario: ");
    \u0275\u0275elementStart(10, "strong");
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(12, LoginComponent_div_24_div_12_Template, 5, 1, "div", 2)(13, LoginComponent_div_24_div_13_Template, 5, 1, "div", 33);
    \u0275\u0275elementStart(14, "form", 34);
    \u0275\u0275listener("ngSubmit", function LoginComponent_div_24_Template_form_ngSubmit_14_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.onSubmitCambiarClave());
    });
    \u0275\u0275elementStart(15, "div", 3)(16, "label", 35);
    \u0275\u0275text(17, "Nueva Contrase\xF1a");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "div", 7);
    \u0275\u0275element(19, "input", 36);
    \u0275\u0275elementStart(20, "button", 9);
    \u0275\u0275listener("click", function LoginComponent_div_24_Template_button_click_20_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.toggleMostrarNuevaPassword());
    });
    \u0275\u0275template(21, LoginComponent_div_24__svg_svg_21_Template, 3, 0, "svg", 10)(22, LoginComponent_div_24__svg_svg_22_Template, 3, 0, "svg", 10);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(23, "div", 3)(24, "label", 37);
    \u0275\u0275text(25, "Confirmar Nueva Contrase\xF1a");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "div", 7);
    \u0275\u0275element(27, "input", 38);
    \u0275\u0275elementStart(28, "button", 9);
    \u0275\u0275listener("click", function LoginComponent_div_24_Template_button_click_28_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.toggleMostrarConfirmarPassword());
    });
    \u0275\u0275template(29, LoginComponent_div_24__svg_svg_29_Template, 3, 0, "svg", 10)(30, LoginComponent_div_24__svg_svg_30_Template, 3, 0, "svg", 10);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(31, "div", 39)(32, "button", 40);
    \u0275\u0275listener("click", function LoginComponent_div_24_Template_button_click_32_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.cerrarModalOlvideClave());
    });
    \u0275\u0275text(33, " Cancelar ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "button", 41);
    \u0275\u0275template(35, LoginComponent_div_24_span_35_Template, 2, 0, "span", 13)(36, LoginComponent_div_24_span_36_Template, 3, 0, "span", 14);
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(11);
    \u0275\u0275textInterpolate(ctx_r0.usuarioVerificado);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.mensajeErrorModal);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.mensajeExitoModal);
    \u0275\u0275advance();
    \u0275\u0275property("formGroup", ctx_r0.modalForm);
    \u0275\u0275advance(5);
    \u0275\u0275property("type", ctx_r0.mostrarNuevaPassword ? "text" : "password");
    \u0275\u0275advance();
    \u0275\u0275property("title", ctx_r0.mostrarNuevaPassword ? "Ocultar contrase\xF1a" : "Mostrar contrase\xF1a");
    \u0275\u0275attribute("aria-label", ctx_r0.mostrarNuevaPassword ? "Ocultar contrase\xF1a" : "Mostrar contrase\xF1a");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.mostrarNuevaPassword);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.mostrarNuevaPassword);
    \u0275\u0275advance(5);
    \u0275\u0275property("type", ctx_r0.mostrarConfirmarPassword ? "text" : "password");
    \u0275\u0275advance();
    \u0275\u0275property("title", ctx_r0.mostrarConfirmarPassword ? "Ocultar contrase\xF1a" : "Mostrar contrase\xF1a");
    \u0275\u0275attribute("aria-label", ctx_r0.mostrarConfirmarPassword ? "Ocultar contrase\xF1a" : "Mostrar contrase\xF1a");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.mostrarConfirmarPassword);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.mostrarConfirmarPassword);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r0.cargandoCambioClave);
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r0.modalForm.invalid || ctx_r0.cargandoCambioClave);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !ctx_r0.cargandoCambioClave);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r0.cargandoCambioClave);
  }
}
var LoginComponent = class _LoginComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  cargando = false;
  verificandoUsuario = false;
  mensajeError = "";
  mostrarPassword = false;
  // Estado para modal "Olvidé mi contraseña"
  mostrarModalOlvideClave = false;
  usuarioVerificado = "";
  cargandoCambioClave = false;
  mensajeErrorModal = "";
  mensajeExitoModal = "";
  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;
  toggleMostrarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }
  toggleMostrarNuevaPassword() {
    this.mostrarNuevaPassword = !this.mostrarNuevaPassword;
  }
  toggleMostrarConfirmarPassword() {
    this.mostrarConfirmarPassword = !this.mostrarConfirmarPassword;
  }
  // Definimos las reglas del formulario principal
  loginForm = this.fb.group({
    usuario: ["", Validators.required],
    password: ["", Validators.required]
  });
  // Formulario del modal de cambio de clave
  modalForm = this.fb.group({
    nuevaClave: ["", [Validators.required, Validators.minLength(4)]],
    confirmarClave: ["", [Validators.required]]
  });
  onOlvidePassword() {
    const usuario = this.loginForm.get("usuario")?.value?.trim();
    if (!usuario) {
      this.mensajeError = "Por favor, ingrese su nombre de usuario para recuperar la contrase\xF1a.";
      this.cdr.detectChanges();
      return;
    }
    this.verificandoUsuario = true;
    this.mensajeError = "";
    this.cdr.detectChanges();
    this.authService.verificarUsuario(usuario).subscribe({
      next: (resp) => {
        this.verificandoUsuario = false;
        this.usuarioVerificado = resp.usuario || usuario;
        this.mostrarModalOlvideClave = true;
        this.mensajeErrorModal = "";
        this.mensajeExitoModal = "";
        this.modalForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.verificandoUsuario = false;
        if (err.status === 404) {
          this.mensajeError = "El usuario ingresado no existe en el sistema. Por favor, verifique el nombre e intente nuevamente.";
        } else if (err.status === 0) {
          this.mensajeError = "El servidor no est\xE1 disponible. Por favor, verifique que el servicio est\xE9 activo.";
        } else {
          this.mensajeError = "Ocurri\xF3 un error al verificar el usuario. Por favor, intente nuevamente.";
        }
        this.cdr.detectChanges();
      }
    });
  }
  cerrarModalOlvideClave() {
    this.mostrarModalOlvideClave = false;
    this.usuarioVerificado = "";
    this.mensajeErrorModal = "";
    this.mensajeExitoModal = "";
    this.modalForm.reset();
    this.cdr.detectChanges();
  }
  onSubmitCambiarClave() {
    if (this.modalForm.invalid || this.cargandoCambioClave) {
      return;
    }
    const nuevaClave = this.modalForm.get("nuevaClave")?.value;
    const confirmarClave = this.modalForm.get("confirmarClave")?.value;
    if (nuevaClave !== confirmarClave) {
      this.mensajeErrorModal = "Las contrase\xF1as ingresadas no coinciden.";
      this.cdr.detectChanges();
      return;
    }
    this.cargandoCambioClave = true;
    this.mensajeErrorModal = "";
    this.mensajeExitoModal = "";
    this.cdr.detectChanges();
    this.authService.cambiarClave(this.usuarioVerificado, nuevaClave).subscribe({
      next: () => {
        this.cargandoCambioClave = false;
        this.mensajeExitoModal = "\xA1Contrase\xF1a modificada con \xE9xito! Ya pod\xE9s ingresar con tu nueva contrase\xF1a.";
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cerrarModalOlvideClave();
        }, 1800);
      },
      error: (err) => {
        this.cargandoCambioClave = false;
        if (err.status === 404) {
          this.mensajeErrorModal = "El usuario no fue encontrado en la base de datos.";
        } else {
          this.mensajeErrorModal = "Ocurri\xF3 un error al intentar modificar la contrase\xF1a. Por favor, reintente.";
        }
        this.cdr.detectChanges();
      }
    });
  }
  onSubmit() {
    if (this.loginForm.valid && !this.cargando) {
      this.cargando = true;
      this.mensajeError = "";
      this.cdr.detectChanges();
      this.authService.login(this.loginForm.value).subscribe({
        next: (respuesta) => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.authService.guardarToken(respuesta.token, respuesta.usuario);
          this.router.navigate(["/auditoria"]);
        },
        error: (err) => {
          this.cargando = false;
          const status = err?.status;
          if (status === 401 || status === 400) {
            this.mensajeError = "Las credenciales ingresadas son incorrectas. Por favor, verifique su usuario y contrase\xF1a.";
          } else if (status === 0 || status && status >= 500) {
            this.mensajeError = "El servidor no est\xE1 disponible. Por favor, verifique que el servicio est\xE9 activo o intente m\xE1s tarde.";
          } else {
            this.mensajeError = "Ocurri\xF3 un error al intentar iniciar sesi\xF3n. Por favor, intente nuevamente.";
          }
          this.cdr.detectChanges();
        }
      });
    }
  }
  static \u0275fac = function LoginComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LoginComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LoginComponent, selectors: [["app-login"]], decls: 25, vars: 14, consts: [[1, "login-container"], [1, "login-form", 3, "ngSubmit", "formGroup"], ["class", "error-banner", 4, "ngIf"], [1, "form-group"], ["for", "usuario"], ["id", "usuario", "type", "text", "formControlName", "usuario", "placeholder", "Ingres\xE1 tu usuario"], ["for", "password"], [1, "password-input-wrapper"], ["id", "password", "formControlName", "password", "placeholder", "Ingres\xE1 tu contrase\xF1a", 3, "type"], ["type", "button", 1, "btn-toggle-password", 3, "click", "title"], ["xmlns", "http://www.w3.org/2000/svg", "width", "18", "height", "18", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round", 4, "ngIf"], [1, "olvide-clave-wrapper"], ["type", "button", 1, "btn-olvide-clave", 3, "click", "disabled"], [4, "ngIf"], ["class", "spinner-container", 4, "ngIf"], ["type", "submit", 1, "btn-ingresar", 3, "disabled"], ["class", "modal-backdrop", 3, "click", 4, "ngIf"], [1, "error-banner"], [1, "error-icon"], ["xmlns", "http://www.w3.org/2000/svg", "width", "18", "height", "18", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"], ["d", "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"], ["cx", "12", "cy", "12", "r", "3"], ["d", "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"], ["x1", "1", "y1", "1", "x2", "23", "y2", "23"], [1, "spinner-container"], [1, "spinner-btn", "spinner-small"], [1, "spinner-btn"], [1, "modal-backdrop", 3, "click"], [1, "modal-content", 3, "click"], [1, "modal-header"], ["type", "button", "aria-label", "Cerrar", 1, "btn-close-modal", 3, "click"], [1, "modal-body"], [1, "modal-user-info"], ["class", "success-banner", 4, "ngIf"], [3, "ngSubmit", "formGroup"], ["for", "nuevaClave"], ["id", "nuevaClave", "formControlName", "nuevaClave", "placeholder", "Ingres\xE1 tu nueva contrase\xF1a", 3, "type"], ["for", "confirmarClave"], ["id", "confirmarClave", "formControlName", "confirmarClave", "placeholder", "Repetir nueva contrase\xF1a", 3, "type"], [1, "modal-footer"], ["type", "button", 1, "btn-cancelar", 3, "click", "disabled"], ["type", "submit", 1, "btn-modificar-clave", 3, "disabled"], [1, "success-banner"], [1, "success-icon"]], template: function LoginComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "form", 1);
      \u0275\u0275listener("ngSubmit", function LoginComponent_Template_form_ngSubmit_1_listener() {
        return ctx.onSubmit();
      });
      \u0275\u0275elementStart(2, "h2");
      \u0275\u0275text(3, "Sistema de D\xE9bitos");
      \u0275\u0275elementEnd();
      \u0275\u0275template(4, LoginComponent_div_4_Template, 5, 1, "div", 2);
      \u0275\u0275elementStart(5, "div", 3)(6, "label", 4);
      \u0275\u0275text(7, "Usuario");
      \u0275\u0275elementEnd();
      \u0275\u0275element(8, "input", 5);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "div", 3)(10, "label", 6);
      \u0275\u0275text(11, "Contrase\xF1a");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(12, "div", 7);
      \u0275\u0275element(13, "input", 8);
      \u0275\u0275elementStart(14, "button", 9);
      \u0275\u0275listener("click", function LoginComponent_Template_button_click_14_listener() {
        return ctx.toggleMostrarPassword();
      });
      \u0275\u0275template(15, LoginComponent__svg_svg_15_Template, 3, 0, "svg", 10)(16, LoginComponent__svg_svg_16_Template, 3, 0, "svg", 10);
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(17, "div", 11)(18, "button", 12);
      \u0275\u0275listener("click", function LoginComponent_Template_button_click_18_listener() {
        return ctx.onOlvidePassword();
      });
      \u0275\u0275template(19, LoginComponent_span_19_Template, 2, 0, "span", 13)(20, LoginComponent_span_20_Template, 3, 0, "span", 14);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(21, "button", 15);
      \u0275\u0275template(22, LoginComponent_span_22_Template, 2, 0, "span", 13)(23, LoginComponent_span_23_Template, 3, 0, "span", 14);
      \u0275\u0275elementEnd()();
      \u0275\u0275template(24, LoginComponent_div_24_Template, 37, 18, "div", 16);
      \u0275\u0275elementEnd();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275property("formGroup", ctx.loginForm);
      \u0275\u0275advance(3);
      \u0275\u0275property("ngIf", ctx.mensajeError);
      \u0275\u0275advance(9);
      \u0275\u0275property("type", ctx.mostrarPassword ? "text" : "password");
      \u0275\u0275advance();
      \u0275\u0275property("title", ctx.mostrarPassword ? "Ocultar contrase\xF1a" : "Mostrar contrase\xF1a");
      \u0275\u0275attribute("aria-label", ctx.mostrarPassword ? "Ocultar contrase\xF1a" : "Mostrar contrase\xF1a");
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.mostrarPassword);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.mostrarPassword);
      \u0275\u0275advance(2);
      \u0275\u0275property("disabled", ctx.verificandoUsuario);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.verificandoUsuario);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.verificandoUsuario);
      \u0275\u0275advance();
      \u0275\u0275property("disabled", ctx.loginForm.invalid || ctx.cargando);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.cargando);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.cargando);
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.mostrarModalOlvideClave);
    }
  }, dependencies: [ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName, CommonModule, NgIf], styles: ["\n.login-container[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  background-color: #f5f7fa;\n}\n.login-form[_ngcontent-%COMP%] {\n  background: white;\n  padding: 2.5rem;\n  border-radius: 8px;\n  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);\n  width: 100%;\n  max-width: 400px;\n}\n.login-form[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin-bottom: 1.5rem;\n  color: #2d3748;\n  text-align: center;\n  font-size: 1.8rem;\n}\n.login-form[_ngcontent-%COMP%]   .error-banner[_ngcontent-%COMP%] {\n  background-color: #fff5f5;\n  border: 1px solid #feb2b2;\n  color: #c53030;\n  padding: 0.75rem 1rem;\n  border-radius: 6px;\n  margin-bottom: 1.2rem;\n  font-size: 0.9rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  line-height: 1.4;\n}\n.login-form[_ngcontent-%COMP%]   .error-banner[_ngcontent-%COMP%]   .error-icon[_ngcontent-%COMP%] {\n  font-size: 1.1rem;\n  flex-shrink: 0;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%] {\n  margin-bottom: 1.2rem;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 0.5rem;\n  color: #4a5568;\n  font-weight: 600;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.75rem;\n  border: 1px solid #e2e8f0;\n  border-radius: 4px;\n  font-size: 1rem;\n  transition: border-color 0.2s;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #4299e1;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  padding-right: 2.75rem;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   .btn-toggle-password[_ngcontent-%COMP%] {\n  position: absolute;\n  right: 0.5rem;\n  background: transparent;\n  border: none;\n  padding: 0.35rem;\n  width: auto;\n  height: auto;\n  color: #718096;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 4px;\n  transition: color 0.2s, background-color 0.2s;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   .btn-toggle-password[_ngcontent-%COMP%]:hover {\n  color: #2d3748;\n  background-color: #edf2f7;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   .btn-toggle-password[_ngcontent-%COMP%]:focus {\n  outline: none;\n  color: #3182ce;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .olvide-clave-wrapper[_ngcontent-%COMP%] {\n  margin-top: 0.5rem;\n  text-align: right;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .btn-olvide-clave[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  color: #3182ce;\n  font-size: 0.85rem;\n  font-weight: 500;\n  cursor: pointer;\n  padding: 0;\n  text-decoration: underline;\n  transition: color 0.2s;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .btn-olvide-clave[_ngcontent-%COMP%]:hover:not(:disabled) {\n  color: #2b6cb0;\n}\n.login-form[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .btn-olvide-clave[_ngcontent-%COMP%]:disabled {\n  color: #a0aec0;\n  cursor: not-allowed;\n  text-decoration: none;\n}\n.login-form[_ngcontent-%COMP%]   .btn-ingresar[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.75rem;\n  background-color: #3182ce;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-size: 1rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background-color 0.2s;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.login-form[_ngcontent-%COMP%]   .btn-ingresar[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #2b6cb0;\n}\n.login-form[_ngcontent-%COMP%]   .btn-ingresar[_ngcontent-%COMP%]:disabled {\n  background-color: #a0aec0;\n  cursor: not-allowed;\n}\n.spinner-container[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n}\n.spinner-btn[_ngcontent-%COMP%] {\n  width: 18px;\n  height: 18px;\n  border: 2.5px solid rgba(255, 255, 255, 0.4);\n  border-top-color: #ffffff;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 0.8s linear infinite;\n  display: inline-block;\n}\n.spinner-small[_ngcontent-%COMP%] {\n  width: 14px;\n  height: 14px;\n  border-width: 2px;\n}\n.modal-backdrop[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  background-color: rgba(0, 0, 0, 0.5);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  z-index: 1000;\n  -webkit-backdrop-filter: blur(2px);\n  backdrop-filter: blur(2px);\n  animation: _ngcontent-%COMP%_fadeIn 0.2s ease-out;\n}\n.modal-content[_ngcontent-%COMP%] {\n  background: white;\n  border-radius: 8px;\n  width: 90%;\n  max-width: 440px;\n  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);\n  overflow: hidden;\n  animation: _ngcontent-%COMP%_slideDown 0.25s ease-out;\n}\n.modal-header[_ngcontent-%COMP%] {\n  padding: 1.25rem 1.5rem;\n  background-color: #f7fafc;\n  border-bottom: 1px solid #e2e8f0;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.modal-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.25rem;\n  color: #2d3748;\n  font-weight: 600;\n}\n.modal-header[_ngcontent-%COMP%]   .btn-close-modal[_ngcontent-%COMP%] {\n  background: transparent;\n  border: none;\n  font-size: 1.5rem;\n  line-height: 1;\n  color: #a0aec0;\n  cursor: pointer;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  transition: color 0.2s, background-color 0.2s;\n}\n.modal-header[_ngcontent-%COMP%]   .btn-close-modal[_ngcontent-%COMP%]:hover {\n  color: #2d3748;\n  background-color: #edf2f7;\n}\n.modal-body[_ngcontent-%COMP%] {\n  padding: 1.5rem;\n}\n.modal-body[_ngcontent-%COMP%]   .modal-user-info[_ngcontent-%COMP%] {\n  font-size: 0.95rem;\n  color: #4a5568;\n  margin-bottom: 1.25rem;\n  padding-bottom: 0.75rem;\n  border-bottom: 1px dashed #e2e8f0;\n}\n.modal-body[_ngcontent-%COMP%]   .modal-user-info[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  color: #2b6cb0;\n}\n.modal-body[_ngcontent-%COMP%]   .success-banner[_ngcontent-%COMP%] {\n  background-color: #f0fff4;\n  border: 1px solid #9ae6b4;\n  color: #276749;\n  padding: 0.75rem 1rem;\n  border-radius: 6px;\n  margin-bottom: 1.2rem;\n  font-size: 0.9rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  line-height: 1.4;\n}\n.modal-body[_ngcontent-%COMP%]   .success-banner[_ngcontent-%COMP%]   .success-icon[_ngcontent-%COMP%] {\n  font-size: 1.1rem;\n  font-weight: bold;\n  flex-shrink: 0;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%] {\n  margin-bottom: 1.2rem;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  margin-bottom: 0.5rem;\n  color: #4a5568;\n  font-weight: 600;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.75rem;\n  border: 1px solid #e2e8f0;\n  border-radius: 4px;\n  font-size: 1rem;\n  transition: border-color 0.2s;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: #4299e1;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%] {\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  padding-right: 2.75rem;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   .btn-toggle-password[_ngcontent-%COMP%] {\n  position: absolute;\n  right: 0.5rem;\n  background: transparent;\n  border: none;\n  padding: 0.35rem;\n  width: auto;\n  height: auto;\n  color: #718096;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 4px;\n  transition: color 0.2s, background-color 0.2s;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   .btn-toggle-password[_ngcontent-%COMP%]:hover {\n  color: #2d3748;\n  background-color: #edf2f7;\n}\n.modal-body[_ngcontent-%COMP%]   .form-group[_ngcontent-%COMP%]   .password-input-wrapper[_ngcontent-%COMP%]   .btn-toggle-password[_ngcontent-%COMP%]:focus {\n  outline: none;\n  color: #3182ce;\n}\n.modal-footer[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.75rem;\n  margin-top: 1.5rem;\n  padding-top: 1rem;\n  border-top: 1px solid #edf2f7;\n}\n.modal-footer[_ngcontent-%COMP%]   .btn-cancelar[_ngcontent-%COMP%] {\n  padding: 0.65rem 1.2rem;\n  background-color: #edf2f7;\n  color: #4a5568;\n  border: 1px solid #cbd5e0;\n  border-radius: 4px;\n  font-weight: 600;\n  font-size: 0.95rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.modal-footer[_ngcontent-%COMP%]   .btn-cancelar[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #e2e8f0;\n}\n.modal-footer[_ngcontent-%COMP%]   .btn-cancelar[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n.modal-footer[_ngcontent-%COMP%]   .btn-modificar-clave[_ngcontent-%COMP%] {\n  padding: 0.65rem 1.2rem;\n  background-color: #3182ce;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-weight: 600;\n  font-size: 0.95rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.modal-footer[_ngcontent-%COMP%]   .btn-modificar-clave[_ngcontent-%COMP%]:hover:not(:disabled) {\n  background-color: #2b6cb0;\n}\n.modal-footer[_ngcontent-%COMP%]   .btn-modificar-clave[_ngcontent-%COMP%]:disabled {\n  background-color: #a0aec0;\n  cursor: not-allowed;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n@keyframes _ngcontent-%COMP%_fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@keyframes _ngcontent-%COMP%_slideDown {\n  from {\n    transform: translateY(-20px);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n@media (max-width: 480px) {\n  .login-container[_ngcontent-%COMP%] {\n    padding: 1rem;\n  }\n  .login-form[_ngcontent-%COMP%] {\n    padding: 1.5rem;\n    max-width: 100%;\n  }\n  .login-form[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n    font-size: 1.4rem;\n    margin-bottom: 1.2rem;\n  }\n  .modal-content[_ngcontent-%COMP%] {\n    width: 95%;\n  }\n}\n/*# sourceMappingURL=login.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LoginComponent, [{
    type: Component,
    args: [{ selector: "app-login", standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `<div class="login-container">
  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
    <h2>Sistema de D\xE9bitos</h2>

    <div *ngIf="mensajeError" class="error-banner">
      <span class="error-icon">\u26A0\uFE0F</span>
      <span>{{ mensajeError }}</span>
    </div>

    <div class="form-group">
      <label for="usuario">Usuario</label>
      <input id="usuario" type="text" formControlName="usuario" placeholder="Ingres\xE1 tu usuario">
    </div>

    <div class="form-group">
      <label for="password">Contrase\xF1a</label>
      <div class="password-input-wrapper">
        <input 
          id="password" 
          [type]="mostrarPassword ? 'text' : 'password'" 
          formControlName="password" 
          placeholder="Ingres\xE1 tu contrase\xF1a"
        >
        <button 
          type="button" 
          class="btn-toggle-password" 
          (click)="toggleMostrarPassword()" 
          [attr.aria-label]="mostrarPassword ? 'Ocultar contrase\xF1a' : 'Mostrar contrase\xF1a'"
          [title]="mostrarPassword ? 'Ocultar contrase\xF1a' : 'Mostrar contrase\xF1a'"
        >
          <svg *ngIf="!mostrarPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <svg *ngIf="mostrarPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </button>
      </div>
      <div class="olvide-clave-wrapper">
        <button type="button" class="btn-olvide-clave" (click)="onOlvidePassword()" [disabled]="verificandoUsuario">
          <span *ngIf="!verificandoUsuario">Olvid\xE9 mi contrase\xF1a</span>
          <span *ngIf="verificandoUsuario" class="spinner-container">
            <span class="spinner-btn spinner-small"></span> Verificando usuario...
          </span>
        </button>
      </div>
    </div>

    <button type="submit" [disabled]="loginForm.invalid || cargando" class="btn-ingresar">
      <span *ngIf="!cargando">Ingresar</span>
      <span *ngIf="cargando" class="spinner-container">
        <span class="spinner-btn"></span> Ingresando...
      </span>
    </button>
  </form>

  <!-- Modal de Cambio de Contrase\xF1a -->
  <div *ngIf="mostrarModalOlvideClave" class="modal-backdrop" (click)="cerrarModalOlvideClave()">
    <div class="modal-content" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Cambiar Contrase\xF1a</h3>
        <button type="button" class="btn-close-modal" (click)="cerrarModalOlvideClave()" aria-label="Cerrar">&times;</button>
      </div>

      <div class="modal-body">
        <p class="modal-user-info">
          Modificando contrase\xF1a para el usuario: <strong>{{ usuarioVerificado }}</strong>
        </p>

        <div *ngIf="mensajeErrorModal" class="error-banner">
          <span class="error-icon">\u26A0\uFE0F</span>
          <span>{{ mensajeErrorModal }}</span>
        </div>

        <div *ngIf="mensajeExitoModal" class="success-banner">
          <span class="success-icon">\u2713</span>
          <span>{{ mensajeExitoModal }}</span>
        </div>

        <form [formGroup]="modalForm" (ngSubmit)="onSubmitCambiarClave()">
          <div class="form-group">
            <label for="nuevaClave">Nueva Contrase\xF1a</label>
            <div class="password-input-wrapper">
              <input 
                id="nuevaClave" 
                [type]="mostrarNuevaPassword ? 'text' : 'password'" 
                formControlName="nuevaClave" 
                placeholder="Ingres\xE1 tu nueva contrase\xF1a"
              >
              <button 
                type="button" 
                class="btn-toggle-password" 
                (click)="toggleMostrarNuevaPassword()" 
                [attr.aria-label]="mostrarNuevaPassword ? 'Ocultar contrase\xF1a' : 'Mostrar contrase\xF1a'"
                [title]="mostrarNuevaPassword ? 'Ocultar contrase\xF1a' : 'Mostrar contrase\xF1a'"
              >
                <svg *ngIf="!mostrarNuevaPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg *ngIf="mostrarNuevaPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmarClave">Confirmar Nueva Contrase\xF1a</label>
            <div class="password-input-wrapper">
              <input 
                id="confirmarClave" 
                [type]="mostrarConfirmarPassword ? 'text' : 'password'" 
                formControlName="confirmarClave" 
                placeholder="Repetir nueva contrase\xF1a"
              >
              <button 
                type="button" 
                class="btn-toggle-password" 
                (click)="toggleMostrarConfirmarPassword()" 
                [attr.aria-label]="mostrarConfirmarPassword ? 'Ocultar contrase\xF1a' : 'Mostrar contrase\xF1a'"
                [title]="mostrarConfirmarPassword ? 'Ocultar contrase\xF1a' : 'Mostrar contrase\xF1a'"
              >
                <svg *ngIf="!mostrarConfirmarPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg *ngIf="mostrarConfirmarPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancelar" (click)="cerrarModalOlvideClave()" [disabled]="cargandoCambioClave">
              Cancelar
            </button>
            <button type="submit" class="btn-modificar-clave" [disabled]="modalForm.invalid || cargandoCambioClave">
              <span *ngIf="!cargandoCambioClave">Modificar Contrase\xF1a</span>
              <span *ngIf="cargandoCambioClave" class="spinner-container">
                <span class="spinner-btn"></span> Guardando...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
`, styles: ["/* src/app/features/auth/login/login.css */\n.login-container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  background-color: #f5f7fa;\n}\n.login-form {\n  background: white;\n  padding: 2.5rem;\n  border-radius: 8px;\n  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);\n  width: 100%;\n  max-width: 400px;\n}\n.login-form h2 {\n  margin-bottom: 1.5rem;\n  color: #2d3748;\n  text-align: center;\n  font-size: 1.8rem;\n}\n.login-form .error-banner {\n  background-color: #fff5f5;\n  border: 1px solid #feb2b2;\n  color: #c53030;\n  padding: 0.75rem 1rem;\n  border-radius: 6px;\n  margin-bottom: 1.2rem;\n  font-size: 0.9rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  line-height: 1.4;\n}\n.login-form .error-banner .error-icon {\n  font-size: 1.1rem;\n  flex-shrink: 0;\n}\n.login-form .form-group {\n  margin-bottom: 1.2rem;\n}\n.login-form .form-group label {\n  display: block;\n  margin-bottom: 0.5rem;\n  color: #4a5568;\n  font-weight: 600;\n}\n.login-form .form-group input {\n  width: 100%;\n  padding: 0.75rem;\n  border: 1px solid #e2e8f0;\n  border-radius: 4px;\n  font-size: 1rem;\n  transition: border-color 0.2s;\n}\n.login-form .form-group input:focus {\n  outline: none;\n  border-color: #4299e1;\n}\n.login-form .form-group .password-input-wrapper {\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n.login-form .form-group .password-input-wrapper input {\n  padding-right: 2.75rem;\n}\n.login-form .form-group .password-input-wrapper .btn-toggle-password {\n  position: absolute;\n  right: 0.5rem;\n  background: transparent;\n  border: none;\n  padding: 0.35rem;\n  width: auto;\n  height: auto;\n  color: #718096;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 4px;\n  transition: color 0.2s, background-color 0.2s;\n}\n.login-form .form-group .password-input-wrapper .btn-toggle-password:hover {\n  color: #2d3748;\n  background-color: #edf2f7;\n}\n.login-form .form-group .password-input-wrapper .btn-toggle-password:focus {\n  outline: none;\n  color: #3182ce;\n}\n.login-form .form-group .olvide-clave-wrapper {\n  margin-top: 0.5rem;\n  text-align: right;\n}\n.login-form .form-group .btn-olvide-clave {\n  background: none;\n  border: none;\n  color: #3182ce;\n  font-size: 0.85rem;\n  font-weight: 500;\n  cursor: pointer;\n  padding: 0;\n  text-decoration: underline;\n  transition: color 0.2s;\n}\n.login-form .form-group .btn-olvide-clave:hover:not(:disabled) {\n  color: #2b6cb0;\n}\n.login-form .form-group .btn-olvide-clave:disabled {\n  color: #a0aec0;\n  cursor: not-allowed;\n  text-decoration: none;\n}\n.login-form .btn-ingresar {\n  width: 100%;\n  padding: 0.75rem;\n  background-color: #3182ce;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-size: 1rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background-color 0.2s;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.login-form .btn-ingresar:hover:not(:disabled) {\n  background-color: #2b6cb0;\n}\n.login-form .btn-ingresar:disabled {\n  background-color: #a0aec0;\n  cursor: not-allowed;\n}\n.spinner-container {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n}\n.spinner-btn {\n  width: 18px;\n  height: 18px;\n  border: 2.5px solid rgba(255, 255, 255, 0.4);\n  border-top-color: #ffffff;\n  border-radius: 50%;\n  animation: spin 0.8s linear infinite;\n  display: inline-block;\n}\n.spinner-small {\n  width: 14px;\n  height: 14px;\n  border-width: 2px;\n}\n.modal-backdrop {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  background-color: rgba(0, 0, 0, 0.5);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  z-index: 1000;\n  -webkit-backdrop-filter: blur(2px);\n  backdrop-filter: blur(2px);\n  animation: fadeIn 0.2s ease-out;\n}\n.modal-content {\n  background: white;\n  border-radius: 8px;\n  width: 90%;\n  max-width: 440px;\n  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);\n  overflow: hidden;\n  animation: slideDown 0.25s ease-out;\n}\n.modal-header {\n  padding: 1.25rem 1.5rem;\n  background-color: #f7fafc;\n  border-bottom: 1px solid #e2e8f0;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.modal-header h3 {\n  margin: 0;\n  font-size: 1.25rem;\n  color: #2d3748;\n  font-weight: 600;\n}\n.modal-header .btn-close-modal {\n  background: transparent;\n  border: none;\n  font-size: 1.5rem;\n  line-height: 1;\n  color: #a0aec0;\n  cursor: pointer;\n  padding: 0.2rem 0.5rem;\n  border-radius: 4px;\n  transition: color 0.2s, background-color 0.2s;\n}\n.modal-header .btn-close-modal:hover {\n  color: #2d3748;\n  background-color: #edf2f7;\n}\n.modal-body {\n  padding: 1.5rem;\n}\n.modal-body .modal-user-info {\n  font-size: 0.95rem;\n  color: #4a5568;\n  margin-bottom: 1.25rem;\n  padding-bottom: 0.75rem;\n  border-bottom: 1px dashed #e2e8f0;\n}\n.modal-body .modal-user-info strong {\n  color: #2b6cb0;\n}\n.modal-body .success-banner {\n  background-color: #f0fff4;\n  border: 1px solid #9ae6b4;\n  color: #276749;\n  padding: 0.75rem 1rem;\n  border-radius: 6px;\n  margin-bottom: 1.2rem;\n  font-size: 0.9rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  line-height: 1.4;\n}\n.modal-body .success-banner .success-icon {\n  font-size: 1.1rem;\n  font-weight: bold;\n  flex-shrink: 0;\n}\n.modal-body .form-group {\n  margin-bottom: 1.2rem;\n}\n.modal-body .form-group label {\n  display: block;\n  margin-bottom: 0.5rem;\n  color: #4a5568;\n  font-weight: 600;\n}\n.modal-body .form-group input {\n  width: 100%;\n  padding: 0.75rem;\n  border: 1px solid #e2e8f0;\n  border-radius: 4px;\n  font-size: 1rem;\n  transition: border-color 0.2s;\n}\n.modal-body .form-group input:focus {\n  outline: none;\n  border-color: #4299e1;\n}\n.modal-body .form-group .password-input-wrapper {\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n.modal-body .form-group .password-input-wrapper input {\n  padding-right: 2.75rem;\n}\n.modal-body .form-group .password-input-wrapper .btn-toggle-password {\n  position: absolute;\n  right: 0.5rem;\n  background: transparent;\n  border: none;\n  padding: 0.35rem;\n  width: auto;\n  height: auto;\n  color: #718096;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 4px;\n  transition: color 0.2s, background-color 0.2s;\n}\n.modal-body .form-group .password-input-wrapper .btn-toggle-password:hover {\n  color: #2d3748;\n  background-color: #edf2f7;\n}\n.modal-body .form-group .password-input-wrapper .btn-toggle-password:focus {\n  outline: none;\n  color: #3182ce;\n}\n.modal-footer {\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.75rem;\n  margin-top: 1.5rem;\n  padding-top: 1rem;\n  border-top: 1px solid #edf2f7;\n}\n.modal-footer .btn-cancelar {\n  padding: 0.65rem 1.2rem;\n  background-color: #edf2f7;\n  color: #4a5568;\n  border: 1px solid #cbd5e0;\n  border-radius: 4px;\n  font-weight: 600;\n  font-size: 0.95rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.modal-footer .btn-cancelar:hover:not(:disabled) {\n  background-color: #e2e8f0;\n}\n.modal-footer .btn-cancelar:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n.modal-footer .btn-modificar-clave {\n  padding: 0.65rem 1.2rem;\n  background-color: #3182ce;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  font-weight: 600;\n  font-size: 0.95rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.modal-footer .btn-modificar-clave:hover:not(:disabled) {\n  background-color: #2b6cb0;\n}\n.modal-footer .btn-modificar-clave:disabled {\n  background-color: #a0aec0;\n  cursor: not-allowed;\n}\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n@keyframes fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@keyframes slideDown {\n  from {\n    transform: translateY(-20px);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n@media (max-width: 480px) {\n  .login-container {\n    padding: 1rem;\n  }\n  .login-form {\n    padding: 1.5rem;\n    max-width: 100%;\n  }\n  .login-form h2 {\n    font-size: 1.4rem;\n    margin-bottom: 1.2rem;\n  }\n  .modal-content {\n    width: 95%;\n  }\n}\n/*# sourceMappingURL=login.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LoginComponent, { className: "LoginComponent", filePath: "src/app/features/auth/login/login.ts", lineNumber: 15 });
})();
export {
  LoginComponent
};
//# sourceMappingURL=chunk-PNMUA2C2.js.map
