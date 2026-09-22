import {
  HttpClient,
  environment
} from "./chunk-FKTKYBCK.js";
import {
  BehaviorSubject,
  Injectable,
  inject,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-IXY2MHCK.js";

// src/app/core/services/auth.ts
var AuthService = class _AuthService {
  http = inject(HttpClient);
  apiUrl = `${environment.apiUrl}/api/auth`;
  autenticadoSubject = new BehaviorSubject(this.isLoggedIn());
  autenticado$ = this.autenticadoSubject.asObservable();
  rolSimuladoSubject = new BehaviorSubject(null);
  rolSimulado$ = this.rolSimuladoSubject.asObservable();
  rolActualSubject = new BehaviorSubject(this.obtenerRol());
  rolActual$ = this.rolActualSubject.asObservable();
  login(credenciales) {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }
  verificarUsuario(usuario) {
    return this.http.get(`${this.apiUrl}/verificar-usuario/${encodeURIComponent(usuario)}`);
  }
  cambiarClave(usuario, nuevaClave) {
    return this.http.post(`${this.apiUrl}/cambiar-clave`, { usuario, nuevaClave });
  }
  guardarToken(token, usuario, rol) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", usuario);
    if (rol) {
      localStorage.setItem("rol", rol);
    }
    this.rolSimuladoSubject.next(null);
    this.rolActualSubject.next(this.obtenerRol());
    this.autenticadoSubject.next(true);
  }
  isTokenExpired() {
    const token = localStorage.getItem("token");
    if (!token)
      return true;
    try {
      const parts = token.split(".");
      if (parts.length < 2)
        return true;
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decodedJson = JSON.parse(decodeURIComponent(escape(atob(payloadBase64))));
      if (!decodedJson.exp)
        return false;
      return Date.now() >= decodedJson.exp * 1e3;
    } catch {
      return true;
    }
  }
  isLoggedIn() {
    const token = localStorage.getItem("token");
    if (!token)
      return false;
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    this.rolSimuladoSubject.next(null);
    this.rolActualSubject.next("");
    this.autenticadoSubject.next(false);
  }
  obtenerUsuario() {
    if (!this.isLoggedIn())
      return "";
    return localStorage.getItem("usuario") || "";
  }
  obtenerRolReal() {
    if (!this.isLoggedIn())
      return "";
    return (localStorage.getItem("rol") || "").toUpperCase();
  }
  obtenerRol() {
    if (!this.isLoggedIn())
      return "";
    const simulado = this.rolSimuladoSubject.value;
    if (simulado && simulado.trim().length > 0) {
      return simulado.toUpperCase();
    }
    return this.obtenerRolReal();
  }
  simularRol(rol) {
    this.rolSimuladoSubject.next(rol);
    this.rolActualSubject.next(this.obtenerRol());
  }
  esAdminReal() {
    return this.obtenerRolReal() === "ADMIN";
  }
  hasRole(rol) {
    if (!rol)
      return false;
    return this.obtenerRol() === rol.trim().toUpperCase();
  }
  hasAnyRole(roles) {
    if (!roles || roles.length === 0)
      return true;
    const rolActual = this.obtenerRol();
    return roles.some((r) => r.trim().toUpperCase() === rolActual);
  }
  isAdmin() {
    return this.hasRole("ADMIN");
  }
  obtenerRolesDisponibles() {
    return this.http.get(`${this.apiUrl}/roles`);
  }
  static \u0275fac = function AuthService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AuthService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AuthService, factory: _AuthService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AuthService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

export {
  AuthService
};
//# sourceMappingURL=chunk-5ICC65UF.js.map
