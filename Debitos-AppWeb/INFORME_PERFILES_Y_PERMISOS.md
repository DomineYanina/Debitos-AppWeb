# Informe Técnico y Funcional: Perfiles y Permisos del Sistema

> **Proyecto:** Débitos AppWeb (Gestión y Auditoría de Facturación y Débitos Médicos)  
> **Fecha de Actualización:** Noviembre 2026  
> **Versión:** 2.0  
> **Estado:** Documento oficial de referencia de perfiles, permisos y seguridad

---

## 1. Resumen Ejecutivo

El presente documento detalla la estructura completa y vigente de **perfiles de usuario, roles y permisos de acceso** implementados en la plataforma **Débitos AppWeb**, tanto en la capa de Backend (Java 17 / Spring Boot 3 con Spring Security y JWT) como en la capa de Frontend (Angular 21 con TypeScript, Route Guards reactivos y AG Grid Enterprise).

El sistema cuenta con un modelo de seguridad basado en roles (**RBAC - Role-Based Access Control**), protegiendo tanto el acceso a las rutas de navegación como la ejecución de endpoints REST y acciones de lectura/escritura en base de datos.

---

## 2. Usuarios y Roles Activos en Base de Datos

En la base de datos relacional PostgreSQL (tabla `usuarios`), los usuarios registrados cuentan con los siguientes perfiles asignados:

| ID | Usuario | Rol Técnico (DB / Spring Security) | Denominación en Interfaz (UI) | Enfoque Principal |
| :---: | :--- | :--- | :--- | :--- |
| **5** | `Yanina` | **`ADMIN`** | *Administrador del Sistema* | Control total del sistema, migraciones, sincronizaciones, conciliación de trámites y simulación. |
| **1** | `FernandaCortes` | **`OPERADOR`** | *Operador de Débitos* | Auditoría operativa diaria, edición de prestaciones, débito/refactura y emisión de comprobantes. |
| **2** | `CatalinaDanko` | **`OPERADOR`** | *Operador de Débitos* | Auditoría operativa diaria, edición de prestaciones, débito/refactura y emisión de comprobantes. |
| **3** | `CynthiaLeal` | **`OPERADOR`** | *Operador de Débitos* | Auditoría operativa diaria, edición de prestaciones, débito/refactura y emisión de comprobantes. |
| **6** | `NataliaMartinez` | **`OPERADOR`** | *Operador de Débitos* | Auditoría operativa diaria, edición de prestaciones, débito/refactura y emisión de comprobantes. |
| **4** | `PaolaBurniego` | **`GERENTE_DEBITOS`** | *Gerente de Débitos* | Supervisión general: facultades plenas de carga/auditoría junto con acceso al Tablero analítico. |
| **7** | `Directorio` | **`DIRECTORIO`** | *Directorio* | Acceso ejecutivo integral al Tablero de Control y análisis macroeconómico y estratégico. |
| **8** | `MarianoMarchi` | **`TESORERIA`** | *Tesorería* | Acceso financiero a cuenta corriente, balances y cobranzas; modo solo consulta en auditoría. |
| **9** | `ErikaLandriel` | **`TESORERIA`** | *Tesorería* | Acceso financiero a cuenta corriente, balances y cobranzas; modo solo consulta en auditoría. |
| — | *(Sin asignar)* | *`AUDITOR`* | *Auditor (Solo Consulta)* | Rol contemplado en UI para perfiles externos o de inspección de solo lectura sin edición. |

---

## 3. Matriz General de Permisos por Módulo

| Módulo / Funcionalidad | `ADMIN` | `OPERADOR` | `GERENTE_DEBITOS` | `DIRECTORIO` | `TESORERIA` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **MÓDULO ADMINISTRACIÓN (`/admin`)** | | | | | |
| Acceso a la vista `/admin` | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |
| Sincronización Cta. Cte. (Gestión → Cabecera) | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |
| Sincronización Prestaciones (`amb_liquidado`) | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |
| Reconciliación de Huérfanas con Facturas | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |
| Exportación de pendientes / sin asociar a Excel | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |
| **MÓDULO AUDITORÍA / BUSCADOR (`/auditoria`)** | | | | | |
| Búsqueda de facturas, NC, ND y Recibos | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí* | ✅ Sí |
| Visualización de prestaciones e historial | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí* | ✅ Sí |
| Edición en grilla (Motivo Débito, Refactura, Importes) | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Guardado parcial y Autoguardado (10s) | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Carga de Prestaciones Externas / Importar | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Emisión de Nueva Nota de Crédito / Débito | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Reabrir o Finalizar Trámite (`cambiarEstadoGrupo`) | ✅ **Exclusivo** | ❌ No | ❌ No | ❌ No | ❌ No |
| **MÓDULO TABLERO DE CONTROL (`/directorio`)** | | | | | |
| Acceso a la vista `/directorio` | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí |
| Solapas Financieras *(Tablero, Cta. Cte., Cobranzas, Matriz)* | ✅ Sí | ❌ No | ❌ No | ✅ Sí | ✅ Sí |
| Solapas Operativas *(Motivos, Analistas, Bucles, etc.)* | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí | ❌ No |
| Detalle de Motivo (`/directorio/motivo/:motivoId`) | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí | ❌ No |
| **CARACTERÍSTICAS ESPECIALES** | | | | | |
| Campana de Notificaciones Operativas | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |
| Simulador de Perfiles ("Ver como:" en Navbar) | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |
| Panel de Ayuda: FAQs Avanzadas de Administración | ✅ Sí | ❌ No | ❌ No | ❌ No | ❌ No |

*\* Nota sobre `DIRECTORIO`: El enlace a `/auditoria` se oculta en el Navbar por diseño para enfocar su flujo en el Tablero de Control, pero si navega a dicha URL el sistema bloquea todas las capacidades de edición (`puedeEditarPrestaciones = false`).*

---

## 4. Detalle de Permisos por Rol

### 👑 4.1. Perfil `ADMIN` (Administrador del Sistema)
Rol con jerarquía máxima en la plataforma.
- **Módulo Administración (`/admin`):**
  - Ejecución de procesos de sincronización desde la base de datos Gestión (Cuenta Corriente y Prestaciones Médicas).
  - Ejecución de reconciliación automática de prestaciones huérfanas con cabeceras de factura.
  - Exportación de previsualizaciones y comprobantes sin asociar a planillas Excel.
- **Módulo Auditoría (`/auditoria`):**
  - Control de Estado de Trámite: Único perfil facultado para **Reabrir** o **Finalizar** el trámite de un grupo (`PUT /api/auditoria/grupo/{idGrupo}/estado/{nuevoEstado}`).
  - Capacidades operativas plenas de búsqueda, edición, guardado parcial y emisión de NC/ND.
- **Módulo Tablero (`/directorio`):**
  - Acceso irrestricto a las 10 solapas del tablero y a la vista de detalle de motivos.
- **Herramientas de Supervisión:**
  - **Simulador de Perfiles ("Ver como:"):** Permite a `ADMIN` personificar la vista de cualquier rol en vivo (`OPERADOR`, `DIRECTORIO`, `GERENTE_DEBITOS`, `TESORERIA`) para auditar la experiencia de usuario.
  - **Campana de Notificaciones:** Recepción de avisos de comprobantes ausentes y cargas manuales.

---

### 💼 4.2. Perfil `OPERADOR` (Operador de Débitos)
Diseñado para los liquidadores y auditores de facturación médica en su trabajo diario.
- **Módulo Auditoría (`/auditoria`):**
  - Búsqueda y consulta de facturas, notas de débito, crédito y recibos.
  - Edición en tiempo real de celdas en AG Grid (motivos de débito, débitos aceptados, importes de refactura y comentarios).
  - Aplicación de motivos y acciones masivas sobre filas seleccionadas.
  - Guardado parcial manual y autoguardado asíncrono debounced de 10 segundos.
  - Carga de prestaciones externas no clínicas y traslado de prestaciones entre comprobantes.
  - Emisión de Notas de Crédito (totales, parciales, IVA o conjuntas) y Notas de Débito.
  - Botón *"Notificar a Administradores"* ante documentos no encontrados en Gestión.
- **Restricciones:**
  - ⛔ Bloqueado el acceso a `/admin` y `/directorio`.
  - ⛔ No puede alterar el estado de conciliación (finalizar o reabrir trámites).

---

### 💼📊 4.3. Perfil `GERENTE_DEBITOS` (Gerente de Débitos)
Diseñado para la jefatura o gerencia del sector de débitos, uniendo la capacidad de operación con la supervisión de métricas.
- **Módulo Auditoría (`/auditoria`):**
  - Mismas autorizaciones operativas plenas que el rol `OPERADOR`.
- **Módulo Tablero de Control (`/directorio`):**
  - Acceso permitido a las **6 solapas analíticas y de auditoría**:
    - ✅ *Motivos de Débito y Refacturación* (`motivos`): Pareto y desglose por causa.
    - ✅ *Analista de Débito* (`analistas`): productividad y recupero por analista.
    - ✅ *Bucles de Insistencia* (`bucles`): detección de débitos reiterados.
    - ✅ *Usuario de Carga* (`usuarios-carga`): volumen cargado por emisor.
    - ✅ *Prestadores / Médicos* (`medicos`): débitos concentrados por efector/médico.
    - ✅ *Detalle y Trazabilidad* (`trazabilidad`): trazabilidad punto a punto.
    - ✅ *Detalle de Motivos* (`/directorio/motivo/:motivoId`): drill-down individual.
  - Solapas financieras excluidas: *Tablero de Control, Cuenta Corriente, Tiempos de Cobranza y Matriz de Cobranzas*.
- **Restricciones:**
  - ⛔ Bloqueado el acceso a `/admin`.
  - ⛔ No puede reabrir o finalizar trámites conciliados.

---

### 📊 4.4. Perfil `DIRECTORIO` (Directorio / Comité Ejecutivo)
Diseñado para directores, gerentes generales y tomadores de decisiones estratégicas.
- **Módulo Tablero de Control (`/directorio`):**
  - Acceso total a las **10 solapas** del tablero analítico:
    - KPIs macro: Facturación Total, Débitos Totales, Recupero y Deuda Neta.
    - Gráfico Donut de cartera por financiador y series temporales.
    - Cuenta corriente, aging y tiempos de cobranza.
    - Rendimiento por prestador, médico y analista.
    - Detalle profundo por motivo de pérdida (`/directorio/motivo/:motivoId`).
- **Restricciones:**
  - ⛔ Perfil exclusivamente de lectura y análisis estratégico.
  - ⛔ No cuenta con permisos de modificación ni emisión de comprobantes.
  - ⛔ Bloqueado el acceso al módulo `/admin`.

---

### 🏛️ 4.5. Perfil `TESORERIA` (Finanzas y Tesorería)
Diseñado para el equipo de finanzas, cobranzas y tesorería institucional.
- **Módulo Tablero de Control (`/directorio`):**
  - Acceso exclusivo a las **4 solapas económico-financieras**:
    - ✅ *Tablero de Control* (`tablero`): KPIs de facturación, saldo cobrado y neto aceptado.
    - ✅ *Cuenta Corriente* (`cuenta-corriente`): saldos y composición de deuda.
    - ✅ *Tiempos de Cobranza* (`tiempos-cobranza`): rotación de cartera y plazos.
    - ✅ *Matriz de Cobranzas* (`matriz-cobranzas`): recaudación por financiador.
  - Excluido de solapas médicas/auditoras y bloqueada la ruta `/directorio/motivo/:motivoId`.
- **Módulo Auditoría (`/auditoria` - Modo Solo Consulta):**
  - Búsqueda de facturas, NC, ND y recibos con lectura completa de prestaciones e historial.
  - Visualización del badge de estado del trámite (*Pendiente / Finalizado*).
  - Exportación de resultados a Excel.
  - Todas las celdas y botones de edición/emisión permanecen bloqueados.
- **Restricciones:**
  - ⛔ Bloqueado el acceso a `/admin`.

---

## 5. Implementación Técnica y Seguridad

### 5.1. Backend (Spring Boot Security)
- **Anotación `@EnableMethodSecurity`:** Habilitada en [`SecurityConfig.java`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/src/main/java/com/debitos/backend/config/SecurityConfig.java) para validación de seguridad a nivel de método.
- **Endpoints de Administración:**
  - `@PreAuthorize("hasRole('ADMIN')")` en [`AdminPrestacionesController.java`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/src/main/java/com/debitos/backend/controller/AdminPrestacionesController.java) y [`AdminSincronizacionController.java`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/src/main/java/com/debitos/backend/controller/AdminSincronizacionController.java).
- **Endpoints de Auditoría y Modificación:**
  - `@PreAuthorize("hasAnyRole('OPERADOR', 'ADMIN', 'GERENTE_DEBITOS')")` en [`AuditoriaController.java`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/src/main/java/com/debitos/backend/controller/AuditoriaController.java) para:
    - `POST /api/auditoria/guardar-parcialmente`
    - `POST /api/auditoria/nueva-nota-credito`
    - `PUT /api/auditoria/editar-nc-ajuste-iva`
    - `POST /api/auditoria/nueva-nota-debito`
    - `POST /api/auditoria/nueva-nota-debito-ajuste-iva`
  - `@PreAuthorize("hasRole('ADMIN')")` exclusivo para `PUT /api/auditoria/grupo/{idGrupo}/estado/{nuevoEstado}`.
- **Endpoints de Tablero y Reportes:**
  - `@PreAuthorize("hasAnyRole('DIRECTORIO', 'ADMIN', 'GERENTE_DEBITOS', 'TESORERIA')")` en [`DirectorioController.java`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/src/main/java/com/debitos/backend/controller/DirectorioController.java) y [`GraficosController.java`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/src/main/java/com/debitos/backend/controller/GraficosController.java).

### 5.2. Frontend (Angular 21)
- **Guards de Enrutamiento ([`app.routes.ts`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/debitos-frontend/src/app/app.routes.ts)):**
  - `roleGuard` restringe `/admin` exclusivamente a `ADMIN`.
  - `roleGuard` restringe `/directorio` a `DIRECTORIO`, `ADMIN`, `GERENTE_DEBITOS` y `TESORERIA`.
  - `roleGuard` restringe `/directorio/motivo/:motivoId` a `DIRECTORIO`, `ADMIN` y `GERENTE_DEBITOS`.
- **Navegación Dinámica ([`navbar.html`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/debitos-frontend/src/app/core/components/navbar/navbar.html)):**
  - Muestra y oculta los accesos superiores según el rol activo.
  - Para `ADMIN`, habilita el menú de simulación de perfiles en tiempo real.
- **Control Reactivo en Auditoría ([`auditoria.ts`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/debitos-frontend/src/app/features/auditoria/auditoria.ts)):**
  - Getter `puedeEditarPrestaciones`: evalúa `hasAnyRole(['ADMIN', 'OPERADOR', 'GERENTE_DEBITOS'])`. Si es falso, bloquea la edición de AG Grid, oculta botones de acción y apaga los autoguardados.
- **Filtro de Solapas en Tablero ([`directorio-dashboard.component.ts`](file:///d:/yanina.domine/Escritorio/Debitos-AppWeb/Debitos-AppWeb/debitos-frontend/src/app/features/directorio/directorio-dashboard.component.ts)):**
  - Método `esSolapaPermitida(solapa)` segmenta la interfaz asegurando que cada perfil visualice únicamente la información afín a su responsabilidad.
