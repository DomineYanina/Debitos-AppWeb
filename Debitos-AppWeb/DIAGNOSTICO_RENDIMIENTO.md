# Diagnóstico Técnico: Rendimiento del Tablero de Control e Intermitencia en Operarias de Débitos

**Fecha de emisión:** 23 de Septiembre de 2026  
**Sistema:** Débitos AppWeb (Spring Boot 3 + PostgreSQL + Angular)  
**Objetivo del informe:** Identificar y detallar con precisión técnica la causa de la lentitud en la navegación del Tablero de Control (perfil Administrador / Directorio) y la degradación intermitente del servicio experimentada por las operarias de auditoría de débitos en el entorno desplegado.

---

## 1. Resumen Ejecutivo del Problema

Se reportó que:
1. Al cambiar de solapas en el Tablero de Control (Administrador / Directorio), la carga de los componentes y gráficos presenta demoras considerables.
2. Al dar acceso a un usuario administrador para pruebas en el entorno desplegado, las operarias de débitos comenzaron a experimentar caídas, tiempos de espera excesivos y fallos de manera **intermitente** en sus tareas habituales de auditoría y carga.

### Conclusión Principal
El sistema no sufre un fallo aleatorio de red o de código aislado: se trata de un clásico escenario de **Agotamiento del Pool de Conexiones de Base de Datos (Connection Pool Starvation)** potenciado por **consultas N+1**, **carga excesiva de entidades en memoria JVM (Garbage Collection Thrashing)** y **saturación de CPU en PostgreSQL**. 

Un solo usuario administrador navegando el Tablero de Control acapara todas las conexiones y recursos disponibles del backend y de la base de datos, provocando que las peticiones concurrentes de las operarias queden bloqueadas en cola hasta agotar el tiempo de espera (*timeout*).

---

## 2. Anatomía Técnica del Fallo: ¿Por qué fallan las Operarias?

```
                                      +------------------------------------+
                                      |  Servidor PostgreSQL (Base Datos)  |
                                      +-----------------+------------------+
                                                        ^
                         Pool HikariCP agotado          |
                         (20/20 conexiones ocupadas)    |
                                      +-----------------+------------------+
                                      |   Backend Spring Boot (JVM / API)  |
                                      +--------+------------------+--------+
                                               ^                  ^
                     Peticiones pesadas        |                  | Peticiones bloqueadas
                     masivas y simultáneas     |                  | (Timeout > 15s -> Error 500)
                                               |                  |
                                  +------------+----+       +-----+-------------+
                                  | Admin / Tablero |       | Operarias Débitos |
                                  | (10 peticiones) |       | (Buscar / Guardar)|
                                  +-----------------+       +-------------------+
```

### A. Agotamiento del Pool de Conexiones (HikariCP Starvation)
En la configuración de producción (`application-prod.properties`):
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=15000 # 15 segundos
```
- La aplicación tiene un límite máximo de **20 conexiones simultáneas** a la base de datos.
- Cuando el Administrador ingresa al Tablero de Control, el frontend de Angular dispara entre **8 y 10 peticiones HTTP en paralelo** (`/api/directorio/totales`, `/api/directorio/grupos`, `/api/graficos/bucles`, `/api/graficos/balance`, `/api/graficos/evolucion`, etc.).
- Cada petición toma una conexión de base de datos. Como varias de estas peticiones demoran varios segundos en responder (debido a consultas complejas o bucles secuenciales), **las 20 conexiones quedan tomadas**.
- En ese instante, una operaria de débitos hace clic en "Buscar" (`/api/auditoria/buscar`) o "Guardar" (`/api/auditoria/guardar-parcialmente`).
- Spring Boot intenta obtener una conexión para la operaria: **no hay ninguna disponible**.
- La petición de la operaria queda esperando en la cola de HikariCP.
  - Si una conexión se libera antes de los 15 segundos, la pantalla de la operaria responde tras 8 a 14 segundos de congelamiento.
  - Si ninguna se libera a los 15 segundos, Hikari arroja `ConnectionTimeoutException` y la operaria recibe un **Error 500** o fallo de conexión.
- **Resultado:** Intermitencia constante según el momento exacto en que el Administrador hace clic en las solapas.

### B. Pausas "Stop-The-World" del Recolector de Basura (JVM Garbage Collection)
- Ciertos métodos del tablero (`findCabecerasParaCuentaCorriente()`, `findComprobantesParaTrazabilidad()`) cargan prácticamente **toda la tabla `cabecera` y miles de registros de `amb_liquidado`, `notadecredito` y `notadedebito` a la memoria RAM de Java** como entidades JPA completas para agruparlas con Java Streams.
- Esto crea cientos de miles de objetos efímeros en la memoria Heap.
- Cuando la memoria RAM de la JVM se llena, el recolector de basura de Java congela todos los hilos del servidor (*Stop-the-World GC Pause*) para limpiar la memoria.
- Durante esa pausa (que puede durar de 1 a 4 segundos), **ningún usuario del sistema recibe respuesta**.

### C. Saturación de CPU y Disco en el Motor PostgreSQL
- Consultas como `obtenerBalanceFinanciero()` y `obtenerTotalesMacro()` ejecutan dentro de la cláusula `SUM(CASE ...)` tres subconsultas correlacionadas `EXISTS`:
  ```sql
  EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id AND nd.id_notadecredito IS NOT NULL)
  OR EXISTS (SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND ...)
  OR EXISTS (SELECT 1 FROM nd_ajustedeiva iva WHERE iva.idcabecera = c.id)
  ```
- Si la tabla `cabecera` tiene decenas de miles de registros y no existen índices específicos de clave foránea en `notadedebito(idcabecera)`, `notadecredito(idcabecera)` y `cabecera(asociado)`, PostgreSQL tiene que recorrer las tablas completas una y otra vez para cada fila.
- Esto eleva el uso de CPU del motor de base de datos al **100%**, ralentizando incluso las consultas más sencillas de las operarias.

---

## 3. Puntos Críticos Identificados en el Código Fuente

### 1. `precargarBucles()` en `ngOnInit` del Tablero (Frontend)
- **Ubicación:** `directorio-dashboard.component.ts` (línea 512).
- **Problema:** Apenas se inicializa la pantalla del Tablero de Control, se invoca `precargarBucles()`.
- **Efecto:** Llama a `/api/graficos/bucles`, el cual ejecuta `getTrazabilidad()` en el backend. Este método es el más pesado de todo el sistema: consulta todas las cadenas de comprobantes de la historia de la clínica, sus prestaciones médicas y todas las notas de crédito y débito. Se ejecuta incluso si el usuario jamás visita la solapa de bucles.

### 2. Bucle N+1 en `obtenerGruposFacturas` (Backend)
- **Ubicación:** `DirectorioService.java` (líneas 221 a 312).
- **Problema:**
  ```java
  List<Object[]> rows = query.getResultList(); // Hasta 200 facturas
  for (Object[] r : rows) {
      // 1 consulta por cada fila:
      List<Cabecera> familia = cabeceraRepository.findByGrupoOrAsociadogrupoOrId(idGrupo);

      for (Cabecera c : familia) {
          // Consultas adicionales por cada comprobante derivado:
          notaDeCreditoRepository.findByCabecera_Id(c.getId());
          notaDeDebitoRepository.findByCabecera_Id(c.getId());
      }
  }
  ```
- **Efecto:** Para responder una sola petición de `/api/directorio/grupos`, el backend realiza **entre 300 y 1.200 consultas SQL individuales** de manera secuencial, manteniendo retenida la conexión del pool durante varios segundos.

### 3. Falta de Cancelación de Peticiones al Cambiar Rápido de Solapa (Frontend)
- **Ubicación:** `directorio-dashboard.component.ts` (`seleccionarSolapa`).
- **Problema:** Si el Administrador hace clic en varias solapas sucesivamente (por ejemplo: Tablero -> Cuenta Corriente -> Motivos -> Analistas), las peticiones de las solapas anteriores no se cancelan con `switchMap` o `takeUntil`.
- **Efecto:** Todas las peticiones continúan ejecutándose en el servidor y saturando el pool de conexiones, aun cuando el usuario ya cambió de pantalla y descartó los datos.

### 4. Ausencia de Capa de Caché en el Backend para Métricas Agregadas
- **Ubicación:** `DirectorioService.java` / `GraficosController.java`.
- **Problema:** Métricas como el Aging Financiero, el Pareto de Motivos, la Matriz Anual de Recaudación y la Distribución de Cartera son cálculos macro agregados.
- **Efecto:** Al no contar con `@Cacheable` de Spring, cada vez que un usuario hace clic en una solapa, la base de datos vuelve a computar millones de registros desde cero.

---

## 4. Matriz de Corrección Propuesta (Los 5 Pasos)

| Paso | Área | Acción Técnica | Impacto Esperado |
| :--- | :--- | :--- | :--- |
| **1** | **Frontend** | Eliminar `precargarBucles()` de `ngOnInit`, cargar solapas de forma *Lazy* (bajo demanda) y cancelar peticiones huérfanas al cambiar de solapa. | Reduce de 10 a 2-3 las peticiones al entrar. Despeja el pool inmediatamente. |
| **2** | **Backend** | Reescribir `obtenerGruposFacturas` eliminando el bucle N+1 mediante consultas por lotes (`IN`) o JOINs. | Reduce de ~1.000 consultas a 2 consultas. Pasa de 5 segundos a ~80 milisegundos. |
| **3** | **Backend** | Implementar Spring Cache (`@Cacheable` con Caffeine o ConcurrentHashMap) en los reportes macro con TTL de 5 a 10 min. | Tiempo de respuesta pasa a 2 ms para peticiones recurrentes. Cero consumo de conexiones de BD en lecturas en caché. |
| **4** | **Configuración** | Ajustar el pool HikariCP (garantizar `prod` con 30 conexiones y verificar `max_connections` en Postgres). | Permite suficiente holgura para que múltiples administradores y operarias convivan sin encolamiento. |
| **5** | **Base de Datos** | Crear índices compuestos estratégicos en PostgreSQL (`cabecera`, `notadecredito`, `notadedebito`). | Elimina *Sequential Scans*, bajando el uso de CPU de PostgreSQL de 100% a valores normales (<20%). |

---

## 5. Dictamen de Robustez y Concurrencia Futura

Una vez implementados estos 5 pasos:
- **Múltiples Administradores simultáneos:** Gracias a la **capa de caché en memoria (Paso 3)**, cuando un segundo o tercer administrador ingrese al tablero, los datos calculados por el primero se servirán directamente desde la memoria RAM del servidor en milisegundos. No generarán carga en la base de datos ni bloquearán conexiones.
- **Convivencia con Operarias:** Al tardar las consultas del tablero milisegundos en vez de segundos, las conexiones de base de datos se liberan de forma casi instantánea, garantizando que las operarias dispongan siempre de conexiones libres para sus tareas operativas sin cortes ni esperas.
