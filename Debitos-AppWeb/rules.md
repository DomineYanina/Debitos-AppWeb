# Reglas de Desarrollo y Arquitectura - Sistema Débitos

## 1. Stack Tecnológico y Arquitectura

* **Backend**: Java 17 con Spring Boot 4.0.5, Spring Data JPA, Spring Security (JWT) y PostgreSQL.
* **Frontend**: Angular 21 (SPA) con arquitectura Standalone Components, RxJS 7.8, AG Grid Community v35, Chart.js v4 (ng2-charts v10) y Shepherd.js v22.
* **Estructura Backend**: Arquitectura en capas estricta dentro de `com.debitos.backend`:
  * `controller/`: Endpoints REST con anotaciones `@RestController`, `@RequestMapping("/api/...")`, `@CrossOrigin` y `@PreAuthorize`.
  * `service/`: Lógica de negocio transaccional con `@Service` y `@Transactional(readOnly = true)` por defecto.
  * `repository/`: Interfaces `JpaRepository` o consultas nativas optimizadas mediante `EntityManager`.
  * `dto/`: Transferencia de datos segregada por subdominios (`dto/directorio`, `dto/reportes`, etc.). Las entidades JPA jamás se exponen en controllers.
  * `model/`: Entidades persistentes JPA (`Cabecera`, `NotaDeCredito`, `NotaDeDebito`, etc.).
  * `exception/`: Manejo centralizado de errores con `@RestControllerAdvice`.
* **Estructura Frontend**: Organización modular por responsabilidades dentro de `src/app`:
  * `core/`: Elementos transversales únicos (`services/`, `models/`, `interceptors/`, `guards/`, `components/`, `constants/`).
  * `features/`: Módulos de funcionalidad (`auth/`, `auditoria/`, `directorio/`). Cada feature agrupa sus componentes standalone, plantillas HTML, CSS aislado y pruebas `.spec.ts`.
* **Inyección de Dependencias**: Prohibido usar inyección por constructor en Angular; utilizar exclusivamente la función `inject(...)` de `@angular/core`.

<details>
<summary>Reglas de Creación de Nuevos Módulos y Componentes</summary>

* **Nuevos Componentes Angular**: Deben declararse `standalone: true`, especificar `changeDetection: ChangeDetectionStrategy.OnPush` y cargar rutas hijas con lazy loading (`loadComponent: () => import(...)`).
* **Integración de Grillas**: En grillas tabulares complejas de auditoría se utiliza `AgGridModule` registrando previamente `ModuleRegistry.registerModules([AllCommunityModule])`.
* **Testing Obligatorio**: Cada nuevo servicio o componente debe incluir su archivo `.spec.ts` (Vitest/JSDOM en frontend) o clase de test con `@WebMvcTest`/`@DataJpaTest` (JUnit 5 en backend).
* **Compilación Frontend en Maven**: El empaquetado backend copia automáticamente el build de `debitos-frontend/dist/debitos-frontend/browser` a `src/main/resources/static` mediante `maven-resources-plugin`. No alterar estas rutas.
</details>

---

## 2. Convenciones de Nomenclatura

* **Clases y Tipos**: `PascalCase` para clases Java, componentes Angular, interfaces y tipos TypeScript (`DirectorioTotalesDTO`, `AuditoriaComponent`, `DirectorioService`).
* **Sufijos de Archivos Frontend**:
  * Componentes: `<nombre>.component.ts` (o `<nombre>.ts` si coincide con el módulo de feature), `<nombre>.component.html`, `<nombre>.component.css`.
  * Modelos/Interfaces: `<nombre>.model.ts` o `<nombre>.ts` dentro de `core/models/`.
  * Servicios: `<nombre>.service.ts` dentro de `core/services/`.
  * Interceptores y Guards: `<nombre>.interceptor.ts`, `<nombre>.guard.ts`.
* **Variables y Métodos**: `camelCase` tanto en Java como en TypeScript (`obtenerTotalesMacro`, `saldoPendienteReal`, `tipoDocSeleccionado`).
* **Constantes Globales**: `UPPER_SNAKE_CASE` tanto en Java como en TypeScript (`CACHE_COBERTURAS`, `LISTA_MOTIVOS_DEBITO`).
* **Endpoints REST y Carpetas**: `kebab-case` para URLs y directorios (`/api/directorio/motivo-detalle`, `usuarios-carga`, `help-drawer`).

<details>
<summary>Reglas de Nomenclatura de DTOs y Parámetros</summary>

* **Sufijo DTO**: Todo objeto de transferencia en backend debe llevar el sufijo `DTO` o `Request`/`Response` (`BalanceFinanciadorDTO`, `GuardarParcialRequest`, `ApiErrorResponse`).
* **Parámetros de Consulta HTTP**: Los query parameters deben mantenerse en `camelCase` (`codigoCobertura`, `tipoDoc`, `fechaDesde`, `fechaHasta`).
* **Campos Auxiliares de Ordenamiento**: Propiedades internas añadidas a colecciones en memoria deben prefijarse con guion bajo (`_originalIndex`).
</details>

---

## 3. Tipado y Manejo de Datos Financieros

* **Cálculos Monetarios en Backend**:
  * Prohibido el uso de `float` o `double` para importes y porcentajes. Usar estrictamente `java.math.BigDecimal`.
  * Escala Monetaria: `setScale(2, RoundingMode.HALF_UP)`.
  * Escala Porcentual: `setScale(1, RoundingMode.HALF_UP)`.
  * Validación Anti-División por Cero: Antes de dividir tasas o porcentajes, validar `compareTo(BigDecimal.ZERO) > 0`; en caso contrario retornar `BigDecimal.ZERO`.
* **Fórmulas Financieras Oficiales**:
  * **Saldo Pendiente Real**: `FC + Incrementos ND + Refacturación ND - Débitos NC - Cobranzas RC`.
  * **Tasa de Recupero (%)**: `(Refacturación ND / Débitos NC) * 100`.
  * **Efectividad de Cobro (%)**: `(Cobranzas RC / (FC + Incrementos ND)) * 100`.
* **Formateo Monetario en UI**:
  * Utilizar exclusivamente `CurrencyPipe` con localización argentina: `{{ valor | currency:'ARS':'symbol-narrow':'1.2-2':'es-AR' }}`.
  * Para números enteros resumidos (ej. tickets promedio o desgloses macro): `1.0-0`.
  * Valores nulos o cero en columnas de débitos/cobranzas no aplicables deben mostrar `'—'`.
* **Tipado de Fechas**:
  * Backend: `java.time.LocalDate` parseado con `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)` (`yyyy-MM-dd`).
  * Frontend: En interfaces TypeScript se tipan como `string` (formato ISO). En plantillas se formatean con `{{ fecha | date:'dd/MM/yyyy' }}`.

<details>
<summary>Detalles de Precisión y Registro de Locale</summary>

* **Configuración Regional**: `registerLocaleData(localeEsAr, 'es-AR')` debe mantenerse activo en `main.ts`.
* **Manejo de Valores Nulos**: Todo cálculo acumulador en frontend debe protegerse contra nulos: `(p.total || 0)`.
* **Identificadores de Comprobantes**: Los números de punto de venta y número de documento se tratan como `number` para ordenamiento y formateo, no como strings planos.
</details>

---

## 4. Interfaz de Usuario (UI) y Estilos

* **Motor de Estilos**: Vanilla CSS modular por componente. Prohibido agregar frameworks como TailwindCSS o Bootstrap; mantener el sistema CSS nativo.
* **Paleta de Colores Institucional**:
  * Fondo General de Aplicación: `#f5f7fa`.
  * Fondo de Superficies / Tarjetas: `#ffffff`.
  * Bordes y Separadores: `#e0e0e0`, `#cbd5e1`, `#e2e8f0`.
  * Texto Primario: `#0f172a` y `#1e293b`.
  * Texto Secundario / Labels: `#475569` y `#64748b`.
  * Acento Azul / Primario: `#2563eb` y `#3b82f6`.
  * Acento Verde / Cobranzas: `#10b981`.
  * Badges Institucionales: Gradiente `linear-gradient(135deg, #4f46e5, #7c3aed)`.
* **Línea Visual Neumórfica / Soft-UI**:
  * Tarjetas y Contenedores: Bordes sutiles combinados con sombras difusas multicapa: `box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03)`.
  * Hover en Tarjetas: Elevación y profundización: `box-shadow: 0 8px 22px rgba(0, 0, 0, 0.07); transform: translateY(-2px); transition: transform 0.2s ease, box-shadow 0.2s ease;`.
  * Estados Activos / Focus: Halo de luz suave sin borde tosco: `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15)`.
  * Elementos Hundidos (Inset): Para tabs inactivas o campos de búsqueda: `box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03)`.
* **Tooltips Nativos**:
  * Prohibido incluir librerías JS para tooltips.
  * Usar la clase global `.has-tooltip` con el atributo `data-tooltip="..."` estilizado por pseudoelementos `::before` y `::after` en `styles.css`.

<details>
<summary>Estándares de Tablas y Solapas</summary>

* **Indicadores de Ordenamiento**: Usar las clases `.sortable-col`, `.sortable-sub-col` y `.sort-indicator` para flechas de ordenación con alineación óptica.
* **Solapas de Navegación**: Mantener el patrón `.directorio-tab-strip` con `.tab-strip-item` que fusiona la solapa activa con el fondo del contenedor (`border-bottom: 2px solid #2563eb; color: #2563eb;`).
* **Tipografía**: Pila nativa corporativa: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
</details>

---

## 5. Manejo de Estados y Peticiones (API)

* **Estado Global y Reactividad**:
  * Servicios en `core/services/` actúan como Single Source of Truth mediante `BehaviorSubject` privados expuestos como `Observable` con sufijo `$` (ej. `auth.ts`, `notificacion.service.ts`, `tour.service.ts`).
* **Estado Local de Componentes**:
  * Propiedades de clase en componentes `OnPush` disparadas mediante eventos de usuario y refrescadas cuando sea necesario con `ChangeDetectorRef.markForCheck()`.
* **Peticiones HTTP**:
  * Realizadas exclusivamente a través de `HttpClient` inyectado en servicios de `core/services/`.
  * Todos los métodos de servicio deben retornar un `Observable<T>` fuertemente tipado con interfaces DTO.
  * Los parámetros dinámicos deben construirse obligatoriamente con `HttpParams`.
* **Pipeline de Interceptores**:
  * Registrados en `appConfig` mediante `withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])`.
  * `loadingInterceptor`: Incrementa/decrementa el contador de `LoadingService`.
  * `authInterceptor`: Inyecta el token Bearer JWT desde `AuthService`.
  * `errorInterceptor`: Captura fallos de infraestructura y muestra alertas globales.

<details>
<summary>Suscripciones y Ciclo de Vida</summary>

* **Cancelación de Suscripciones**: Todas las suscripciones manuales en componentes deben almacenarse en una `Subscription` o cancelarse en `ngOnDestroy` mediante `takeUntilDestroyed` o `Subject<void>`.
* **Protección ante Cierre Inesperado**: Componentes con edición en lote (como `AuditoriaComponent`) deben implementar `@HostListener('window:beforeunload')` para advertir si `modificadosSinGuardar.size > 0`.
</details>

---

## 6. Manejo de Errores y Logs

* **Estructura Estándar de Error en Backend**:
  * Todas las respuestas de error deben mapearse al DTO `ApiErrorResponse` conteniendo: `timestamp`, `status`, `error`, `message`, `path` y opcionalmente `details`.
* **Captura Global en Spring Boot**:
  * `GlobalExceptionHandler` captura `IllegalArgumentException` (400), `MethodArgumentNotValidException` (400) y `Exception` genérica (500).
* **Directrices de Logging en Backend**:
  * Usar SLF4J (`LoggerFactory.getLogger(...)`).
  * Advertencias de negocio o parámetros incorrectos: `log.warn(...)` indicando URI y motivo.
  * Excepciones críticas: `log.error(...)` registrando URI y el objeto `Throwable` para preservar el stacktrace en consola/archivo.
  * Seguridad: Prohibido exponer stacktraces de base de datos o queries SQL en el campo `message` enviado al cliente en producción.
* **Manejo de Errores en Frontend**:
  * Errores de red (`status === 0`): Mostrar notificación "Servidor no disponible. Por favor, intente más tarde." vía `NotificationService`.
  * Errores de servidor (`status >= 500`): Mostrar mensaje seguro provisto por `error.error?.message` o un texto genérico "Error del Servidor (500)".
  * Exclusión en Interceptores: Las URLs de autenticación (`/api/auth/login`) están excluidas del `errorInterceptor` para permitir que el formulario gestione localmente mensajes de credenciales inválidas.
