# Manual de Operaciones, Soporte y Resolución de Problemas (Troubleshooting)
## Sistema de Débitos - Débitos Web Backend & Frontend

Este documento tiene como propósito servir de guía operativa y de resolución de incidentes para desarrolladores, administradores de sistemas y personal de soporte que deban mantener, desplegar o resolver fallas en el Sistema de Débitos.

---

## 1. Arquitectura y Topología del Entorno

* **Servidor de Producción**: `SRV-APLICACIONE` (Dirección IP: `172.16.14.210`, Dominio: `debitos-auditoria.cmm.com.ar`).
* **Frontend**:
  * Single Page Application (SPA) desarrollada en Angular.
  * Servida por **IIS (Internet Information Services)** en el puerto HTTP estándar `80` (`http://debitos-auditoria.cmm.com.ar`).
  * Ruta de configuración de endpoints: `debitos-frontend/src/environments/environment.prod.ts` (apunta a `http://debitos-auditoria.cmm.com.ar:8080`).
* **Backend**:
  * Spring Boot (Java 17) empaquetado como JAR autoejecutable (`backend-0.0.1-SNAPSHOT.jar`).
  * Se ejecuta como **Servicio de Windows** mediante **WinSW (Windows Service Wrapper)** bajo el nombre de servicio: `DebitosBackendApp` ("*Debitos Web Backend*").
  * Servidor web embebido Tomcat escuchando en el puerto TCP `8080`.
  * Ubicación en el servidor: `C:\Procesos_Datos\AppWeb\Débitos\`.
* **Bases de Datos PostgreSQL**:
  * **Base Principal (Débitos)**: `jdbc:postgresql://localhost:54321/Debitos` (Gestiona comprobantes, cabeceras, notas de débito/crédito y usuarios).
  * **Base Secundaria (Gestión / Solo Lectura)**: `jdbc:postgresql://172.16.15.41:9090/gestion` (Consultas de coberturas y afiliados).
* **Regla de Puntos de Venta Contemplados en el Tablero de Control**:
  * Solo se computan Facturas (`FC`, `FAC`, `FCE`, `FCA`) con puntos de venta: **`30`, `31`, `32`, `36` y `53`**.
  * Los comprobantes asociados (NC, ND, Recibos) que cancelen o provengan de facturas fuera de estos puntos de venta son descartados del tablero.
  * Centralizado en: `DirectorioService.PTO_VTA_PERMITIDOS = Set.of(30, 31, 32, 36, 53)`.

---

## 2. Gestión del Servicio Windows (WinSW)

El backend no se corre abriendo una consola negra `java -jar`, sino a través del servicio administrado de Windows para asegurar alta disponibilidad y reinicio automático.

### Comandos de Administración (PowerShell como Administrador en el Servidor)

Ubicarse en el directorio del servicio:
```powershell
cd "C:\Procesos_Datos\AppWeb\Débitos"
```

| Acción | Comando WinSW | Comando Nativo PowerShell |
| :--- | :--- | :--- |
| **Consultar estado** | `.\DebitosBackendApp.exe status` | `Get-Service DebitosBackendApp` |
| **Iniciar servicio** | `.\DebitosBackendApp.exe start` | `Start-Service DebitosBackendApp` |
| **Detener servicio** | `.\DebitosBackendApp.exe stop` | `Stop-Service DebitosBackendApp` |
| **Reiniciar servicio** | `.\DebitosBackendApp.exe restart` | `Restart-Service DebitosBackendApp` |

### Procedimiento para Reinstalar el Servicio (Si se cambia configuración XML o binario WinSW)
```powershell
.\DebitosBackendApp.exe stop
.\DebitosBackendApp.exe uninstall
.\DebitosBackendApp.exe install
.\DebitosBackendApp.exe start
```

---

## 3. Dónde Encontrar los Logs y Qué Significa Cada Uno

En `C:\Procesos_Datos\AppWeb\Débitos\` se generan tres tipos de archivos:

1. **`debitos-backend.out.log` (El más importante para Desarrolladores)**:
   * Contiene la salida completa de la aplicación Spring Boot (`stdout`).
   * Aquí se visualiza:
     * El banner de arranque y el tiempo total (`Started BackendApplication in X seconds`).
     * Inicialización del pool HikariCP y migraciones automáticas.
     * Peticiones HTTP registradas por los controladores (ej: `Petición de login recibida para el usuario: ...`).
     * Traza de excepciones (`NullPointerException`, `PSQLException`, etc.).
2. **`debitos-backend.wrapper.log`**:
   * Registra **únicamente las acciones del wrapper de Windows** (WinSW).
   * Muestra cuándo arrancó el servicio, el comando `java` lanzado y el PID del proceso (`Started process 4656`).
   * **Atención**: Si aquí dice `INFO - Service started successfully`, solo significa que el servicio de Windows se inició; **no** garantiza que Spring Boot haya terminado de levantar. Para ver el estado real de la app, consultar siempre `debitos-backend.out.log`.
3. **`debitos-backend.err.log`**:
   * Registra errores graves a nivel de la máquina virtual Java (`stderr`) ocurridos antes de que Spring Boot tome control del logging (ej. errores de memoria JVM o parámetros Java inválidos).

---

## 4. Comandos de Diagnóstico Rápido

### A. Desde el Servidor (`SRV-APLICACIONE`)

1. **Verificar si el proceso Java está vivo:**
   ```powershell
   Get-Process java
   ```
2. **Verificar si el puerto 8080 está escuchando en todas las interfaces:**
   ```powershell
   netstat -ano | findstr :8080
   ```
   *Respuesta esperada:*
   ```text
   TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       <PID>
   ```
3. **Probar el endpoint de salud localmente dentro del servidor:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8080/api/test/ping" -Method Get -UseBasicParsing
   ```

### B. Desde una Computadora Cliente (Puesto de Usuario o Desarrollador)

1. **Verificar conectividad de red con el puerto 8080:**
   ```powershell
   Test-NetConnection -ComputerName debitos-auditoria.cmm.com.ar -Port 8080
   ```
   *Debe responder `TcpTestSucceeded : True`.*
2. **Verificar conectividad con el frontend (Puerto 80):**
   ```powershell
   Test-NetConnection -ComputerName debitos-auditoria.cmm.com.ar -Port 80
   ```
3. **Comprobar respuesta de la API vía HTTP:**
   ```powershell
   Invoke-WebRequest -Uri "http://debitos-auditoria.cmm.com.ar:8080/api/test/ping" -Method Get -UseBasicParsing
   ```

---

## 5. Matriz de Errores Comunes y Soluciones (Troubleshooting)

### Caso 1: `net::ERR_CONNECTION_TIMED_OUT` en el Navegador
* **Síntoma**: Al intentar ingresar o iniciar sesión, la pantalla queda congelada 20 segundos y muestra:  
  `"El servidor no está disponible. Por favor, verifique que el servicio esté activo o intente más tarde."`  
  En la consola de desarrollador (F12) se observa: `POST ...:8080/api/auth/login net::ERR_CONNECTION_TIMED_OUT`.
* **Causa**: El Firewall de Windows en el servidor (o el firewall perimetral entre las VLANs `172.16.13.x` y `172.16.14.x`) está descartando silenciosamente los paquetes dirigidos al puerto `8080`.
* **Solución**:
  Ejecutar en PowerShell como Administrador en el servidor para habilitar el puerto:
  ```powershell
  New-NetFirewallRule -DisplayName "Backend Debitos (Puerto 8080)" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
  ```

---

### Caso 2: `net::ERR_CONNECTION_REFUSED` en el Navegador
* **Síntoma**: El error aparece instantáneamente sin esperar timeout.
* **Causa**: El servidor de Windows está activo, pero **el backend de Java no está corriendo** en el puerto 8080 (se cayó durante el arranque o el servicio está detenido).
* **Solución**:
  1. Revisar `debitos-backend.out.log` para encontrar el motivo de la caída (ej. base de datos desconectada, error de memoria, variables de entorno faltantes).
  2. Levantar el servicio:
     ```powershell
     Start-Service DebitosBackendApp
     ```

---

### Caso 3: `HTTP 500 Internal Server Error` durante el Login o Consultas
* **Síntoma**: La llamada a `/api/auth/login` o cualquier consulta del tablero responde con código 500.
* **Causa**:
  1. Base de datos PostgreSQL principal o secundaria (`gestion`) inaccesible o credenciales expiradas.
  2. Error de consulta SQL o tabla bloqueada.
* **Solución**:
  1. Abrir `debitos-backend.out.log` y buscar `ERROR` o `PSQLException`.
  2. Comprobar que el servicio PostgreSQL (`localhost:54321`) esté iniciado.
  3. Comprobar conectividad con la base secundaria (`172.16.15.41:9090`).

---

### Caso 4: `HTTP 401 Unauthorized` al Iniciar Sesión
* **Síntoma**: Mensaje en pantalla: *"Usuario o contraseña incorrectos"*.
* **Causa**: Las credenciales ingresadas no coinciden con la tabla `usuarios` de la base de datos o el usuario no existe.
* **Solución**:
  1. Probar en el navegador o PowerShell si el usuario existe:
     ```text
     GET http://debitos-auditoria.cmm.com.ar:8080/api/auth/verificar-usuario/{nombre_usuario}
     ```
  2. Verificar en la tabla `usuarios` de la base `Debitos` que el campo `usuario` y `clave` sean correctos (las contraseñas se almacenan validadas contra el texto plano configurado en `AuthController.java`).

---

### Caso 5: Error de CORS (`Blocked by CORS Policy`)
* **Síntoma**: En la consola de F12 aparece:  
  `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`.
* **Causa**: Se intentó acceder a la aplicación mediante una IP o dominio nuevo que no está registrado en `cors.allowed.origins`.
* **Solución**:
  1. En `application-prod.properties` (o en la variable de entorno `CORS_ALLOWED_ORIGINS`), agregar el nuevo dominio/IP separado por coma:
     ```properties
     cors.allowed.origins=http://172.16.14.210,http://localhost:4200,http://debitos-auditoria.cmm.com.ar,http://nuevo-dominio.com.ar
     ```
  2. Reiniciar el servicio: `Restart-Service DebitosBackendApp`.

---

### Caso 6: Advertencia `No active transaction for update or delete query` en `mv_ids_anulados`
* **Síntoma**: En `debitos-backend.out.log` aparece un `WARN` indicando que no se pudo refrescar la vista materializada `mv_ids_anulados`.
* **Causa**: No se corrió el script de creación de la vista materializada en la base de datos de producción.
* **Solución**:
  Ejecutar el script SQL localizado en el proyecto:  
  `src/main/resources/create_mv_ids_anulados.sql`  
  conectado a la base de datos `Debitos`.

---

## 6. Procedimiento Estándar de Despliegue de una Nueva Versión

Cuando se deban desplegar nuevas modificaciones en producción:

1. **Compilar el proyecto completo** (incluye compilación de Angular embebida en Maven):
   ```powershell
   ./mvnw clean package -DskipTests
   ```
   *(El build generará el archivo `target/backend-0.0.1-SNAPSHOT.jar` con el frontend estático ya incorporado en `/static`).*

2. **Detener el servicio en el servidor:**
   ```powershell
   Stop-Service DebitosBackendApp
   ```

3. **Reemplazar el archivo JAR:**
   Copiar el nuevo `backend-0.0.1-SNAPSHOT.jar` a:
   `C:\Procesos_Datos\AppWeb\Débitos\backend-0.0.1-SNAPSHOT.jar`

4. **Si se actualizó IIS (Frontend desacoplado):**
   Reemplazar los archivos estáticos en la carpeta configurada en IIS (usualmente la raíz del sitio web).

5. **Iniciar el servicio:**
   ```powershell
   Start-Service DebitosBackendApp
   ```

6. **Monitorear el arranque:**
   Abrir en tiempo real `debitos-backend.out.log` hasta verificar:
   ```text
   Tomcat started on port 8080 (http) with context path '/'
   Started BackendApplication in ... seconds
   ```

7. **Prueba final de humo (Smoke Test):**
   * Abrir `http://debitos-auditoria.cmm.com.ar` en el navegador del puesto de trabajo.
   * Realizar login y verificar carga del tablero principal.
