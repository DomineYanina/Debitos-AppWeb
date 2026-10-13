# Informe Técnico y Funcional: Perfiles y Permisos del Sistema

> **Proyecto:** Débitos AppWeb (Gestión y Auditoría de Facturación y Débitos Médicos)  
> **Fecha de Elaboración:** Octubre 2026  
> **Versión:** 1.0  
> **Estado:** Documento de referencia de perfiles, permisos y seguridad

---

## 1. Resumen Ejecutivo

El presente documento detalla la estructura actual de **perfiles de usuario, roles y permisos de acceso** implementados en la aplicación **Débitos AppWeb**, tanto en la capa de Backend (Java / Spring Boot con Spring Security y JWT) como en la capa de Frontend (Angular con TypeScript, Route Guards e Inyección de Servicios reactivos).

Este relevamiento sirve como base y especificación técnica para futuras ampliaciones de módulos, refactorizaciones de seguridad o integración con sistemas de gestión de identidad corporativa.

---

## 2. Arquitectura de Autenticación y Autorización

### 2.1. Persistencia y Modelo de Datos
* **Entidad Usuario:** Mapeada en `com.debitos.backend.model.Usuario` sobre la tabla relacional `usuarios`.
* **Atributo `rol`:** Campo alfanumérico (`VARCHAR`) que define el rol asignado al operador o directivo.
* **Comportamiento por defecto:** Si un usuario existente en la base de datos no tiene definido un valor en el campo `rol`, el backend le asigna automáticamente el perfil `"OPERADOR"` durante la emisión del token.

### 2.2. Autenticación y Emisión de Tokens (Backend)
* **Controlador:** `AuthController.java` (`/api/auth/login`).
* **Seguridad:** Generación de token JWT firmado digitalmente mediante `JwtService`.
* **Payload JWT:** Incluye el nombre de usuario (`sub`), fecha de expiración y el claim personalizado `rol`.
* **Listado dinámico de roles:** El endpoint `GET /api/auth/roles` (`findDistinctRolesNoAdmin()`) expone los perfiles no administrativos existentes en la base de datos para habilitar herramientas de simulación.

### 2.3. Filtro de Autorización y Spring Security
* **Filtro:** `JwtAuthenticationFilter.java` intercepta cada petición HTTP bajo el header `Authorization: Bearer <TOKEN>`.
* **Normalización de Autoridades:** Limpia y formatea el rol a mayúsculas, anteponiendo el prefijo `ROLE_` (ej. `ROLE_ADMIN`, `ROLE_OPERADOR`, `ROLE_DIRECTORIO`), integrándolo al `SecurityContextHolder` de Spring Security.
* **Protección por Anotaciones:** El backend utiliza `@EnableMethodSecurity` en `SecurityConfig.java`, permitiendo el control granular de acceso mediante `@PreAuthorize("hasRole(...)")` y `@PreAuthorize("hasAnyRole(...)")`.

### 2.4. Control de Acceso en Frontend (Angular)
* **Servicio Central:** `AuthService` gestiona el estado de autenticación reactivo (`BehaviorSubject`), almacenamiento local (`localStorage`), decodificación de expiración y verificación de roles (`hasRole(rol)`, `hasAnyRole(roles)`, `isAdmin()`).
* **Route Guards:**
  * `authGuard`: Protege rutas contra accesos no autenticados (redirige a `/login`).
  * `roleGuard`: Valida que el rol activo del usuario coincida con la lista `data: { roles: [...] }` definida en `app.routes.ts`. Si no cumple, redirige a la ruta permitida por defecto (`/auditoria`).
* **Navegación Reactiva:** `NavbarComponent` monitorea cambios en el rol activo y valida en tiempo real la compatibilidad de la URL actual, redirigiendo de inmediato si el perfil no tiene permiso para la vista en pantalla.

---

## 3. Matriz de Perfiles Identificados

El sistema reconoce formalmente **4 perfiles de usuario** en su interfaz y lógica de negocio:

| Código de Rol | Denominación en Sistema | Propósito / Enfoque |
| :--- | :--- | :--- |
| **`ADMIN`** | **Administrador del Sistema** | Supervisión global, conciliación de trámites, monitoreo de incidentes y acceso total. |
| **`OPERADOR`** | **Operador de Débitos** | Carga operativa, auditoría individual, ajuste de prestaciones y generación de NC/ND. |
| **`DIRECTORIO`** | **Directorio** | Análisis macroeconómico, KPIs ejecutivos, balances por financiador y toma de decisiones. |
| **`AUDITOR`** | **Auditor (Solo Consulta)** | Inspección y seguimiento de comprobantes e historial de trámites sin capacidad de cierre. |

---

## 4. Detalle de Permisos por Perfil

### 👑 4.1. Perfil `ADMIN` (Administrador del Sistema)

Es el rol con jerarquía máxima dentro de la plataforma. Diseñado para jefes de área, coordinadores de facturación y administradores de sistemas.

#### Vistas y Rutas Autorizadas:
* ✅ `/auditoria` (Buscador de Documentos y Grilla de Auditoría).
* ✅ `/directorio` (Tablero de Control Financiero y Métricas Macro).
* ✅ `/directorio/motivo/:motivoId` (Detalle Profundo de Prestaciones por Motivo de Débito).

#### Permisos Exclusivos y Capacidades:
1. **Control del Estado de Conciliación del Trámite:**
   * **Finalizar Trámite:** Puede cerrar el grupo de comprobantes pasando del Estado 1 (*Pendiente*) al Estado 2 (*Finalizado*). Esta acción bloquea la edición de débitos y refacturaciones para todos los usuarios.
   * **Reabrir Trámite:** Puede devolver un trámite finalizado al estado pendiente para permitir ajustes posteriores.
   * *Seguridad Backend:* Protegido con `@PreAuthorize("hasRole('ADMIN')")` en el endpoint `PUT /api/auditoria/grupo/{idGrupo}/estado/{nuevoEstado}`.
2. **Centro de Notificaciones Operativas:**
   * Visualización del ícono de campana en el Navbar con contador dinámico de novedades no leídas.
   * Recepción de alertas por **Documentos No Encontrados** (`DOC_NO_ENCONTRADO` / etiqueta *AUSENTE*) reportados por los operadores.
   * Recepción de alertas por ingresos manuales de comprobantes.
   * Marcar notificaciones como leídas individualmente o en lote (`PUT /api/notificaciones/leer-todas`).
3. **Simulador de Perfiles ("Ver como"):**
   * Selector desplegable en el Navbar (`esAdminReal`) que permite impersonar visualmente la experiencia de cualquier otro rol (`OPERADOR`, `DIRECTORIO`, `AUDITOR`).
   * No degrada el token de seguridad del servidor; permite validar qué ve cada operador en tiempo real.
4. **Sección Avanzada en Panel de Ayuda (FAQ):**
   * Acceso exclusivo a guías operativas sobre:
     * Simulación de roles.
     * Gestión de comprobantes ausentes y reclamos.
     * Cierre y reapertura de conciliaciones.
     * Interpretación de KPIs ejecutivos.
     * Monitoreo de telemetría y tolerancia a fallos (*Store & Forward*).

---

### 💼 4.2. Perfil `OPERADOR` (Operador de Débitos)

Es el perfil de trabajo diario destinado a liquidadores, analistas de facturación y operadores de cuentas médicas.

#### Vistas y Rutas Autorizadas:
* ✅ `/auditoria` (Buscador de Documentos y Grilla de Prestaciones).
* ❌ `/directorio` **(Bloqueado por `roleGuard` y redirección automática en Navbar)**.

#### Permisos Operativos:
1. **Búsqueda y Exploración:**
   * Búsqueda por Tipo (Factura, Nota de Débito, Nota de Crédito, Recibo), Letra, Punto de Venta y Número.
   * Visualización de cabeceras, totales de factura y débitos preexistentes.
   * Consulta de documentos asociados (NC vinculadas a FC, ND vinculadas a NC, etc.).
   * Apertura del modal de **Historial de Comprobantes** y exportación de trazabilidad a Excel.
2. **Edición y Carga de Débitos:**
   * Modificación de estado de aceptación de débito (*Aceptado / Rechazado / Sin Selección*).
   * Asignación de motivos de débito agrupados por categoría (Formales, Médicos/Auditoría, Administrativos).
   * Edición de importes refacturados y recálculo dinámico en tiempo real.
   * Aplicación de modificaciones masivas sobre filas seleccionadas en lote.
   * Guardado parcial manual y autoguardado asíncrono cada 10 segundos.
3. **Emisión de Comprobantes:**
   * Generación de **Notas de Crédito** (totales, parciales o conjuntas).
   * Generación de **Notas de Débito**.
   * Generación y edición de ajustes por IVA.
4. **Reporte de Inconsistencias:**
   * Dispone del botón *"Reportar No Encontrado"* cuando una búsqueda no arroja resultados, notificando automáticamente al equipo de administración.

#### Restricciones Operativas:
* ⛔ No puede finalizar ni reabrir trámites de conciliación.
* ⛔ Se le oculta el indicador del estado del trámite en la cabecera para mantener su flujo de trabajo enfocado exclusivamente en la carga.
* ⛔ No tiene acceso al Tablero de Control ni a los endpoints analíticos de `/api/graficos` ni `/api/directorio`.
* ⛔ No recibe notificaciones de otros operadores ni cuenta con selector de simulación.

---

### 📊 4.3. Perfil `DIRECTORIO` (Perfil Directivo / Ejecutivo)

Diseñado para directores médicos, gerentes administrativos, contadores y miembros del comité directivo.

#### Vistas y Rutas Autorizadas:
* ✅ `/directorio` (Tablero de Control Financiero y Métricas Macro).
* ✅ `/directorio/motivo/:motivoId` (Detalle de Prestaciones por Causa de Pérdida).
* ❌ `/auditoria` **(Redirigido automáticamente a `/directorio` por el Navbar)**.

#### Permisos y Capacidades:
1. **KPIs Ejecutivos y Métricas Financieras:**
   * Visualización de tarjetas macro: Facturación Total, Débitos Totales, Refacturación, Tasa de Recupero Global y Saldos Pendientes Netos.
2. **Gráficos Financieros Interactivos (`/api/graficos`):**
   * Gráfico de Distribución Donut de Cartera por Financiador.
   * Gráficos temporales de evolución de facturación vs. débitos.
   * Ranking y distribución de Motivos de Débito.
3. **Tablas Analíticas Multidimensionales:**
   * Resumen de Cartera y Balance Financiero agrupado por Obra Social / Prepaga.
   * Desempeño y volumen por Médico Prestador.
   * Métricas de rendimiento por Analista / Operador.
   * Matriz de recaudación y análisis de Tiempos de Cobranza (aging).
4. **Filtros Estratégicos:**
   * Segmentación por período de fechas (desde / hasta con validación de fecha mínima permitida).
   * Filtro por Financiador / Cobertura y por Tipo de Comprobante.

#### Restricciones Operativas:
* ⛔ Perfil puramente analítico y de lectura estratégica.
* ⛔ No puede editar débitos, ni alterar prestaciones, ni generar comprobantes fiscales.
* ⛔ No visualiza la campana de notificaciones operativas ni el buscador individual de documentos.

---

### 🔍 4.4. Perfil `AUDITOR` (Auditor - Solo Consulta)

Orientado a auditores externos, peritos contables o personal de supervisión de calidad que necesita verificar la información sin modificarla.

#### Vistas y Rutas Autorizadas:
* ✅ `/auditoria` (Buscador de Documentos e Historial).
* ❌ `/directorio` **(Bloqueado por `roleGuard`)**.

#### Permisos y Capacidades:
1. **Búsqueda e Inspección Integral:**
   * Búsqueda y visualización de todas las facturas, notas de débito, crédito y recibos.
   * Visualización detallada de cada prestación, paciente, profesional y motivo debitado.
   * Consulta del historial de trazabilidad completo de comprobantes vinculados y exportación a Excel.
2. **Supervisión del Estado del Trámite:**
   * A diferencia del `OPERADOR`, este perfil **sí visualiza la insignia de estado del trámite** (`estado-tramite-indicador-container`), pudiendo constatar si el grupo se encuentra *Finalizado* (verde) o *Pendiente de conciliación* (ámbar).

#### Restricciones Operativas:
* ⛔ No posee privilegios para modificar el estado de conciliación (finalizar o reabrir).
* ⛔ No dispone de campana de notificaciones ni simulador de perfiles.

---

## 5. Tabla Comparativa de Permisos y Capacidades

| Módulo / Funcionalidad | ADMIN | OPERADOR | DIRECTORIO | AUDITOR | Nivel de Seguridad |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Buscador de Documentos (`/auditoria`)** | ✅ | ✅ | ❌ *(Redirige)* | ✅ | Frontend (`authGuard`) |
| **Edición de Débitos y Refacturación** | ✅ | ✅ | ❌ | ❌ | UI / Estado de Grupo |
| **Acciones Masivas sobre Prestaciones** | ✅ | ✅ | ❌ | ❌ | Frontend |
| **Emisión de NC y ND** | ✅ | ✅ | ❌ | ❌ | Backend (`/api/auditoria/*`) |
| **Finalizar / Reabrir Trámite Conciliación** | ✅ | ❌ | ❌ | ❌ | Backend (`@PreAuthorize("hasRole('ADMIN')")`) |
| **Ver Indicador Visual de Estado de Conciliación** | ✅ | ❌ | ❌ | ✅ | Frontend (`auditoria.html`) |
| **Reportar Documento No Encontrado** | ✅ | ✅ | ❌ | ✅ | Backend (`/api/notificaciones/reportar-*`) |
| **Tablero de Control Financiero (`/directorio`)** | ✅ | ❌ | ✅ | ❌ | Backend (`@PreAuthorize("hasAnyRole('DIRECTORIO','ADMIN')")`) |
| **Detalle por Motivo (`/directorio/motivo/:id`)** | ✅ | ❌ | ✅ | ❌ | Backend (`DirectorioController`) |
| **Acceso a Endpoints de Gráficos (`/api/graficos`)** | ✅ | ❌ | ✅ | ❌ | Backend (`GraficosController`) |
| **Campana de Notificaciones Operativas** | ✅ | ❌ | ❌ | ❌ | UI y Backend (`NotificacionController`) |
| **Selector de Simulación de Perfiles ("Ver como")** | ✅ | ❌ | ❌ | ❌ | Frontend (`AuthService.simularRol`) |
| **Preguntas Frecuentes Exclusivas de Admin** | ✅ | ❌ | ❌ | ❌ | Frontend (`HelpDrawerComponent`) |

---

## 6. Endpoints Críticos y Restricciones Backend

| Endpoint | Método | Restricción de Acceso | Control de Autorización |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | `POST` | Público (`permitAll`) | Autenticación y firma JWT |
| `/api/auth/roles` | `GET` | Autenticado | Retorna roles distintos sin `ADMIN` |
| `/api/auditoria/grupo/{id}/estado/{estado}` | `PUT` | **Solo `ADMIN`** | `@PreAuthorize("hasRole('ADMIN')")` |
| `/api/auditoria/**` | `GET/POST` | Autenticado (`ADMIN`, `OPERADOR`, `AUDITOR`) | Token JWT válido |
| `/api/directorio/**` | `GET` | **`DIRECTORIO` o `ADMIN`** | `@PreAuthorize("hasAnyRole('DIRECTORIO', 'ADMIN')")` |
| `/api/graficos/**` | `GET` | **`DIRECTORIO` o `ADMIN`** | `@PreAuthorize("hasAnyRole('DIRECTORIO', 'ADMIN')")` |
| `/api/notificaciones/recientes` | `GET` | **`ADMIN`** (por defecto) | Filtro por rol en repositorio |

---

## 7. Recomendaciones y Oportunidades de Mejora Futura

Para continuar evolucionando la arquitectura de seguridad y permisos en las próximas etapas, se recomienda considerar:

1. **Persistencia Explícita de Roles:**
   * Actualmente el rol es una cadena de texto libre en `usuarios.rol`. Se sugiere crear un enum Java (`com.debitos.backend.model.Rol`) o una tabla relacional `roles` con relación `ManyToMany` (`usuario_roles`) para soportar usuarios con múltiples perfiles.
2. **Encriptación de Contraseñas:**
   * La validación actual en `AuthController.java` realiza una comparación en texto plano (`getClave().equals(...)`). Se aconseja migrar a `BCryptPasswordEncoder` de Spring Security para el hash de contraseñas.
3. **Bloqueo Estricto de Edición en Backend para Perfiles de Consulta:**
   * Implementar `@PreAuthorize("hasAnyRole('OPERADOR', 'ADMIN')")` explícito en los endpoints `POST /api/auditoria/nueva-nota-credito`, `POST /api/auditoria/nueva-nota-debito` y `POST /api/auditoria/guardar-parcialmente` para prevenir modificaciones directas desde perfiles como `AUDITOR` o `DIRECTORIO`.
4. **Gestor de Usuarios en UI:**
   * Incorporar una solapa o módulo de administración para que los usuarios con rol `ADMIN` puedan dar de alta nuevos usuarios, restablecer contraseñas y asignar roles desde la interfaz gráfica.
