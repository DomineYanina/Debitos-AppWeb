# Informe Funcional y Operativo: Cálculo de Métricas del Tablero de Gestión

> **Destinatarios:** Dirección, Gerencia de Administración y Finanzas, Jefatura de Facturación y Cobranzas, Auditoría Médica.  
> **Objetivo:** Explicar detalladamente el origen de los datos, las tablas y columnas del sistema utilizadas, y las fórmulas de cálculo de cada uno de los valores e indicadores reflejados en el Tablero de Gestión y Control.

---

## Índice del Contenido
1. [Introducción al Modelo de Datos](#1-introducción-al-modelo-de-datos)
2. [Solapa 1: Tiempos de Cobranza (Aging de Deuda y DSO)](#2-solapa-1-tiempos-de-cobranza-aging-de-deuda-y-dso)
3. [Solapa 2: Matriz Anual de Recaudación (Cobranzas por Fecha Real de Recibo)](#3-solapa-2-matriz-anual-de-recaudación-cobranzas-por-fecha-real-de-recibo)
4. [Solapa 3: Desempeño y Gestión por Analista de Débito](#4-solapa-3-desempeño-y-gestión-por-analista-de-débito)
5. [Solapa 4: Desempeño por Usuarios de Carga (Operadores de Facturación)](#5-solapa-4-desempeño-por-usuarios-de-carga-operadores-de-facturación)
6. [Solapa 5: Desempeño por Prestadores / Médicos](#6-solapa-5-desempeño-por-prestadores--médicos)
7. [Glosario Rápido de Tablas y Columnas](#7-glosario-rápido-de-tablas-y-columnas)

---

## 1. Introducción al Modelo de Datos

Para comprender cómo se calculan las métricas, es útil conocer cómo se estructura la información de las operaciones sanatoriales en el sistema:

1. **`cabecera` (Comprobantes Contables):** Registra cada comprobante emitido o recibido: Facturas de venta (`FC`), Notas de Crédito por débitos (`NC`), Notas de Débito por refacturación o ajustes (`ND`) y Recibos de cobro (`RC`).
2. **`amb_liquidado` (Detalle de Prestaciones Médicas):** Registra cada prestación o práctica individual que compone una factura, identificando al paciente, obra social/prepaga, médico interviniente y operador que cargó la orden.
3. **`notadecredito` (Detalle de Débitos Aplicados):** Registra cada débito puntual aplicado por una obra social o prepaga sobre una prestación facturada, indicando el motivo/glosa del débito, el importe debitado, el analista asignado y si el débito fue aceptado como pérdida.
4. **`notadedebito` (Detalle de Refacturaciones):** Registra los reclamos y refacturaciones realizados para recuperar prestaciones que habían sido debitadas, indicando el importe recuperado y el motivo.

---

## 2. Solapa 1: Tiempos de Cobranza (Aging de Deuda y DSO)

Esta pantalla evalúa la salud de la cartera a cobrar, identificando cuánto dinero deben los financiadores (obras sociales y prepagas) y cuántos días de atraso acumula dicha deuda.

```
+------------------------------------+---------------------------------------------------+
|    DSO GLOBAL PONDERADO: 363       |  Distribución de Deuda por Rangos (Aging)         |
|  Días promedio ponderados atraso   |  [0-30d] [31-60d] [61-90d] [91-180d] [>180 días]  |
+------------------------------------+---------------------------------------------------+
| Cobro Real: 0 días | Mora Total: $9.107.900.841                                       |
+--------------------+-------------------------------------------------------------------+
```

### Tablas y Columnas Utilizadas

* **Tabla `cabecera`:**
  * `tipo`: Tipo de comprobante. Solo se incluyen comprobantes de facturación de venta (`FC`, `FAC`, `FCE`, `FCA`).
  * `fecha`: Fecha de emisión de la factura.
  * `debe`: Importe facturado original.
  * `haber`: Pagos o compensaciones registrados sobre la factura.
  * `cobertura` / `codigo_cobertura`: Financiador (obra social o prepaga) asociado.

### Regla de Inclusión
Se toman únicamente las facturas cuya fecha esté registrada y que tengan **saldo pendiente de cobro**:
$$\text{Saldo Pendiente} = \text{debe} - \text{haber} > 0$$

---

### Métricas y Fórmulas de Cálculo

#### A. Días de Atraso por Factura
Para cada factura impaga, se calcula la cantidad de días transcurridos desde que se emitió hasta el día de hoy:
$$\text{Días de Atraso} = \text{Fecha de Hoy} - \text{Fecha de Emisión de la Factura}$$

#### B. Saldo Total en Mora ($9.107.900.841)
Es la sumatoria del saldo pendiente de todas las facturas impagas de la cartera:
$$\text{Saldo Total en Mora} = \sum (\text{debe} - \text{haber})$$

#### C. DSO Global Ponderado por Monto (363 días)
El **DSO** (*Days Sales Outstanding*) mide el plazo promedio de cobro de la cartera, pero **ponderado por el dinero que se adeuda**. Una factura millonaria atrasada 1 año tiene mucho más peso en el resultado que una factura de bajo monto atrasada 10 días:
1. Para cada factura se multiplica su saldo impago por sus días de atraso:
   $$\text{Impacto Ponderado} = \text{Saldo Pendiente} \times \text{Días de Atraso}$$
2. Se suman los impactos de todas las facturas y se divide por el Saldo Total en Mora:
   $$\text{DSO Global} = \frac{\sum (\text{Saldo Pendiente} \times \text{Días de Atraso})}{\text{Saldo Total en Mora}} = 363 \text{ días}$$

#### D. Cobro Real Promedio (0 días)
* Muestra el promedio real de días que tardan las facturas en ser efectivamente cobradas cuando se imputan sus recibos correspondientes. En el estado actual del corte contable se visualiza en 0 días.

#### E. Distribución de Deuda por Rangos (Aging) y Tabla de Maduración
Cada factura impaga se ubica en uno de los 5 tramos de vencimiento según sus **Días de Atraso**:
* **0 a 30 días:** Deuda corriente o reciente (dentro del plazo habitual de facturación).
* **31 a 60 días:** Mora temprana.
* **61 a 90 días:** Mora media.
* **91 a 180 días:** Mora extendida.
* **Más de 180 días:** Cartera antigua de alto riesgo de incobrabilidad.

Por cada rango se calculan:
1. **Cantidad de Comprobantes:** Cantidad de facturas cuyo atraso cae en ese tramo.
2. **Saldo en Mora ($):** Suma de los saldos impagos de esas facturas (altura de la barra del gráfico).
3. **% de Cartera Morosa:** Porcentaje que representa ese tramo sobre la deuda total:
   $$\% \text{ Cartera Morosa} = \frac{\text{Saldo en Mora del Rango}}{\text{Saldo Total en Mora}} \times 100$$

---

## 3. Solapa 2: Matriz Anual de Recaudación (Cobranzas por Fecha Real de Recibo)

Esta matriz refleja el **flujo de fondos real (caja efectiva)** ingresado al sanatorio mes a mes para cada obra social o prepaga durante el año seleccionado (por ejemplo, 2026).

```
+----------------------------------+-------------+-------------+-----+-------------+------------------+
| FINANCIADOR                      | ENE         | FEB         | ... | DIC         | TOTAL ANUAL      |
+----------------------------------+-------------+-------------+-----+-------------+------------------+
| ASOCIACION MUTUAL SANCOR SALUD   | $433.685.289| $501.335.406| ... | -           | $4.730.315.639   |
| O.S. SERVICIO PENITENCIARIO FED. | $268.279.575| $573.141.490| ... | -           | $3.884.743.319   |
+----------------------------------+-------------+-------------+-----+-------------+------------------+
| TOTAL GENERAL                    | $...        | $...        | ... | $...        | $...             |
+----------------------------------+-------------+-------------+-----+-------------+------------------+
```

### Tablas y Columnas Utilizadas

* **Tabla `cabecera`:**
  * `tipo`: Se filtran exclusivamente comprobantes de cobro/recaudación: `RC` (Recibo oficial), `RCA`, `RCB`, `REC` y `OP` (Orden de Pago).
  * `fecha`: Fecha en que efectivamente se cobró el recibo.
    * Se extrae el **Año** (`EXTRACT(YEAR FROM fecha)`) para filtrar el año calendario seleccionado.
    * Se extrae el **Mes** (`EXTRACT(MONTH FROM fecha)`) del 1 al 12 para imputar el monto en la columna que corresponda (ENE a DIC).
  * `haber` / `debe`: Importe efectivamente cobrado (generalmente asentado en `haber`, o en `debe` según la naturaleza del movimiento).
  * `cobertura` / `codigo_cobertura`: Nombre y código del financiador pagador.

### Fórmulas y Reglas de Visualización

1. **Imputación por Fecha Real (Criterio de Caja):**
   * El dinero se asigna al mes calendario en el que **ingresó el pago** (`cabecera.fecha`), sin importar en qué mes anterior se haya emitido la factura original.
2. **Columnas de Meses (ENE a DIC):**
   * Es la suma de todos los recibos cobrados a ese financiador entre el día 1 y el último día de ese mes.
   * Si en un mes no hubo cobros de esa entidad, se visualiza un guion (`-`).
3. **Columna TOTAL ANUAL (Columna verde a la derecha):**
   * Suma acumulada de los 12 meses para esa entidad:
     $$\text{Total Anual} = \text{ENE} + \text{FEB} + \text{MAR} + \dots + \text{DIC}$$
   * Las filas se ordenan de mayor a menor según este total (los mayores recaudadores arriba).
4. **Fila TOTAL GENERAL (Pie de tabla):**
   * **Totales Mensuales:** Suma de lo cobrado a todos los financiadores en ese mes.
   * **Gran Total Anual:** Suma total de cobranzas percibidas por la institución en todo el año.

---

## 4. Solapa 3: Desempeño y Gestión por Analista de Débito

Audita la productividad y efectividad de cada auditor/analista del equipo de facturación que tiene a cargo la gestión de reclamo, refacturación y aceptación de débitos.

```
+----------------+------------+-----------------------+------------------+-----------------+-------------------+-------------+
| ANALISTA       | DOCUMENTOS | DÉBITOS ACEPTADOS ($) | REFACTURADOS ($) | TICKET PROMEDIO | ATENCIÓN (AMB/INT)| % RECUPERO  |
+----------------+------------+-----------------------+------------------+-----------------+-------------------+-------------+
| NataliaMartinez| 1442       | $ 3.552.143           | $ 22.633.609     | $ 18.159        | 100% Amb / 0% Int | 86.4%       |
| FernandaCortes | 10         | $ 18.581.046          | $ 145.195        | $ 1.872.624     | 0% Amb / 100% Int | 0.8%        |
| PaolaBurniego  | 25         | $ 423.271             | $ 15.335.846     | $ 638.812       | 0% Amb / 100% Int | 96.0%       |
| CatalinaDanko  | 7          | $ 56.500              | $ 0              | $ 8.071         | 100% Amb / 0% Int | 0.0%        |
+----------------+------------+-----------------------+------------------+-----------------+-------------------+-------------+
```

### Tablas y Columnas Utilizadas

* **Tabla `notadecredito` (`nc`):**
  * `usuario`: Nombre de usuario del analista asignado a la gestión del débito.
  * `importedebitado`: Monto total que la obra social debitó a la prestación.
  * `debitoaceptado`: Indicador lógico (`true`/`false`) de si el débito se asumió como pérdida definitiva.
  * `importederefactura`: Importe indicado para refacturar.
  * `motivodedebito`: Causa o glosa del débito (Nivel 2 del desglose).
* **Tabla `notadedebito` (`nd`):**
  * `usuario`: Analista que emitió la nota de débito de refacturación.
  * `importerefactura`: Importe efectivamente reclamado y refacturado.
* **Tabla `cabecera` (`c`):**
  * `cobertura`: Nombre del financiador afectado (Nivel 3 del desglose).
  * `tiporegistro`: Clasificación de la prestación (`Ambulatorios` o `Internados`).
  * `fecha` / `periodo`: Para el filtrado temporal.

---

### Lógica de Cálculo de cada Columna

1. **DOCUMENTOS:**
   * Conteo total de prestaciones o prácticas médicas auditadas por ese analista.
2. **DÉBITOS ACEPTADOS ($) (Pérdida Asumida):**
   * Suma del dinero que la institución **perdió de forma definitiva** porque el débito fue aceptado (`debitoaceptado = true`):
     $$\text{Débitos Aceptados} = \sum (\text{importedebitado de casos con débito aceptado})$$
3. **REFACTURADOS ($):**
   * Suma del dinero que el analista **logró volver a facturar** a la obra social para su cobro:
     $$\text{Refacturados} = \sum (\text{importerefactura})$$
4. **TOTAL TRAMITADO:**
   * Es el volumen monetario total de débitos que pasaron por las manos del analista:
     $$\text{Total Tramitado} = \max(\text{Total Debitado}, \text{Aceptados} + \text{Refacturados})$$
5. **TICKET PROMEDIO:**
   * Importe medio involucrado en cada caso o prestación que tramita el analista:
     $$\text{Ticket Promedio} = \frac{\text{Total Tramitado}}{\text{Cantidad de Documentos}}$$
6. **ATENCIÓN (AMB / INT):**
   * Porcentaje de prácticas correspondientes a pacientes ambulatorios vs. internación:
     $$\% \text{ Ambulatorio} = \frac{\text{Docs Ambulatorios}}{\text{Docs Ambulatorios} + \text{Docs Internación}} \times 100$$
     $$\% \text{ Internación} = 100\% - \% \text{ Ambulatorio}$$
7. **% RECUPERO:**
   * **Métrica clave de efectividad:** Del total tramitado por el analista, ¿qué porcentaje logró refacturarse en lugar de darse por perdido?
     $$\% \text{ Recupero} = \frac{\text{Refacturados}}{\text{Total Tramitado}} \times 100$$
     * **Verde ($\ge 50\%$):** Excelente nivel de recupero (ej. PaolaBurniego con 96.0%, NataliaMartinez con 86.4%).
     * **Rojo o Cero ($< 50\%$):** Casos donde la mayor parte del débito no pudo defenderse y terminó en pérdida (ej. CatalinaDanko con 0.0%).

---

## 5. Solapa 4: Desempeño por Usuarios de Carga (Operadores de Facturación)

Esta auditoría no evalúa al analista que recupera el débito, sino a los **operadores que confeccionaron la factura original**. Su propósito es detectar si hay operadores que cometen errores sistemáticos de carga (código de práctica erróneo, falta de requisitos o autorizaciones) para capacitarlos preventivamente.

```
+----------------------+------------+---------------------+-----------------+-----------------+------------+
| OPERADOR             | DOCUMENTOS | ACEPTADOS (PÉRDIDA) | REFACTURADOS    | TICKET PROMEDIO | % RECUPERO |
+----------------------+------------+---------------------+-----------------+-----------------+------------+
| Sin operador asignado| 27         | $ 85.600.243,36     | $ 0,00          | $ 3.170.379,38  | 0.0%       |
| MARMIROLIM           | 2          | $ 19.175.482,11     | $ 0,00          | $ 9.587.741,06  | 0.0%       |
| ARANDAF              | 1          | $ 19.056.309,96     | $ 0,00          | $ 19.056.309,96 | 0.0%       |
| QUINTANAC            | 2          | $ 0,00              | $ 4.401.223,06  | $ 2.200.611,53  | 100.0%     |
+----------------------+------------+---------------------+-----------------+-----------------+------------+
```

### Tablas y Columnas Utilizadas

* **Tabla `amb_liquidado` (`al`):**
  * `operador`: Nombre del usuario que cargó originalmente la orden o práctica en el sistema. Si el campo está vacío, se categoriza como `"Sin operador asignado"`.
* **Tabla `cabecera` (`c`):**
  * `asociadogrupo` / `grupo` / `id`: Identificador que encadena la vida del comprobante (`FC` $\rightarrow$ `NC` $\rightarrow$ `ND`).
  * `tipo`: Identifica si la prestación tuvo una Nota de Crédito (`NC`) de débito y si luego tuvo una Nota de Débito (`ND`) de refacturación.
  * `haber` / `debe`: Monto debitado en la Nota de Crédito.
* **Tabla `notadecredito` (`nc`):**
  * `motivodedebito`: Motivo de la glosa recibida (Nivel 2 del desglose).
* **Tabla `cabecera` de la factura:**
  * `cobertura`: Financiador que aplicó la sanción (Nivel 3 del desglose).

---

### Lógica de Cálculo de cada Columna

1. **OPERADOR / MOTIVO / FINANCIADOR:**
   * Nombre de usuario del operador de carga obtenido de la prestación inicial (`al.operador`), junto a la cantidad de motivos de débitos en los que incurrió.
2. **DOCUMENTOS:**
   * Cantidad de facturas/prestaciones emitidas por ese operador que fueron observadas con débito.
3. **ACEPTADOS (PÉRDIDA):**
   * Suma de los débitos generados sobre facturas de ese operador que **no se pudieron refacturar** y quedaron como pérdida irrecuperable.
4. **REFACTURADOS:**
   * Suma de los débitos generados sobre facturas de ese operador que **sí pudieron ser subsanados y refacturados** con una Nota de Débito.
5. **TICKET PROMEDIO:**
   * Importe promedio de débito generado por cada factura de ese operador:
     $$\text{Ticket Promedio} = \frac{\text{Aceptados} + \text{Refacturados}}{\text{Documentos}}$$
6. **% RECUPERO:**
   * Porcentaje del impacto de los errores de carga que el equipo de auditoría logró recuperar:
     $$\% \text{ Recupero} = \frac{\text{Refacturados}}{\text{Aceptados} + \text{Refacturados}} \times 100$$
     * Si da `0.0%`, todo el débito causado por la emisión de ese operador terminó en pérdida pura para la clínica.
     * Si da `100.0%` (como en el caso de QUINTANAC), el error fue de forma y se pudo refacturar íntegramente.

---

## 6. Solapa 5: Desempeño por Prestadores / Médicos

Esta auditoría identifica qué **profesionales médicos o prestadores de la clínica generan débitos médicos** (por ejemplo, falta de justificación médica, historias clínicas incompletas, prácticas no autorizadas o firmas faltantes).

```
+--------------------------+------------+---------------------+-----------------+-----------------+------------+
| MÉDICO                   | DOCUMENTOS | ACEPTADOS (PÉRDIDA) | REFACTURADOS    | TICKET PROMEDIO | % RECUPERO |
+--------------------------+------------+---------------------+-----------------+-----------------+------------+
| Médico no especificado   | 28         | $ 71.204.210,36     | $ 1.030.322,55  | $ 2.579.804,75  | 1.4%       |
| ISRAEL MARCELO HERNAN    | 1          | $ 15.469.874,79     | $ 0,00          | $ 15.469.874,79 | 0.0%       |
| OBREDOR CARLOS           | 2          | $ 15.157.911,53     | $ 0,00          | $ 7.578.955,77  | 0.0%       |
| VILLACORTA PRADO ALVARO  | 1          | $ 9.693.131,74      | $ 0,00          | $ 9.693.131,74  | 0.0%       |
+--------------------------+------------+---------------------+-----------------+-----------------+------------+
```

### Tablas y Columnas Utilizadas

* **Tabla `amb_liquidado` (`al`):**
  * `medico`: Nombre y apellido del profesional médico interviniente en la práctica facturada. Si no vino registrado en la orden, se visualiza como `"Médico no especificado"`.
* **Tabla `cabecera` (`c`):**
  * `asociadogrupo` / `grupo` / `id`: Cadena de trazabilidad del expediente.
  * `tipo`: Identifica los comprobantes `FC` (factura), `NC` (débito) y `ND` (refacturación médica).
  * `haber` / `debe`: Monto del débito en la `NC`.
* **Tabla `notadecredito` (`nc`):**
  * `motivodedebito`: Razón médica del rechazo (Nivel 2 del desglose).
* **Tabla `cabecera`:**
  * `cobertura`: Obra social o prepaga que auditó al médico (Nivel 3 del desglose).

---

### Lógica de Cálculo de cada Columna

1. **MÉDICO / MOTIVO / FINANCIADOR:**
   * Nombre del médico asignado a la práctica médica original (`al.medico`), junto con el total de motivos de débitos que se le atribuyen.
2. **DOCUMENTOS:**
   * Total de prácticas o expedientes de ese médico que fueron observados y debitados.
3. **ACEPTADOS (PÉRDIDA):**
   * Monto de débitos médicos no subsanables (por ejemplo, falta de cobertura o práctica no autorizada definitiva) que la institución debió dar por perdidos.
4. **REFACTURADOS:**
   * Monto de débitos que se lograron revertir o refacturar (por ejemplo, luego de que el médico adjuntó el protocolo o el resumen de historia clínica faltante).
5. **TICKET PROMEDIO:**
   * Importe medio debitado por cada acto médico observado:
     $$\text{Ticket Promedio} = \frac{\text{Aceptados} + \text{Refacturados}}{\text{Documentos}}$$
6. **% RECUPERO:**
   * Capacidad de recuperar los débitos causados por actos de ese médico:
     $$\% \text{ Recupero} = \frac{\text{Refacturados}}{\text{Aceptados} + \text{Refacturados}} \times 100$$
     *(Ejemplo: el "Médico no especificado" tiene \$1.030.322 refacturados sobre un total tramitado de \$72.234.532 $\rightarrow$ tasa de recupero de `1.4%`)*.

---

## 7. Glosario Rápido de Tablas y Columnas

| Tabla en Sistema | Columna | ¿Para qué se usa en el Tablero? |
| :--- | :--- | :--- |
| **`cabecera`** | `tipo` | Determina si el comprobante es Factura (`FC`), Nota de Crédito (`NC`), Nota de Débito (`ND`) o Recibo de Cobro (`RC`). |
| **`cabecera`** | `fecha` | • En Facturas: Calcula la antigüedad y días de mora (Aging y DSO).<br>• En Recibos: Imputa la recaudación en el mes exacto en que ingresó el dinero (Matriz). |
| **`cabecera`** | `debe` | Importe original facturado o a cobrar. |
| **`cabecera`** | `haber` | Cobros cancelatorios en recibos o montos debitados en notas de crédito. |
| **`cabecera`** | `cobertura` | Nombre de la obra social o prepaga (Financiador). |
| **`cabecera`** | `tiporegistro` | Discrimina entre atención Ambulatoria (`AMB`) e Internación (`INT`). |
| **`cabecera`** | `asociadogrupo` | Código de enlace que une toda la vida del expediente (`FC` $\rightarrow$ `NC` $\rightarrow$ `ND` $\rightarrow$ `RC`). |
| **`amb_liquidado`** | `medico` | Identifica al profesional de salud que atendió la práctica. |
| **`amb_liquidado`** | `operador` | Identifica al administrativo o usuario que emitió la factura inicial. |
| **`notadecredito`**| `usuario` | Identifica al analista que recibió y tramitó el débito. |
| **`notadecredito`**| `importedebitado` | Importe descontado por la obra social. |
| **`notadecredito`**| `debitoaceptado` | Marca si el débito se asumió como pérdida definitiva (`true`). |
| **`notadecredito`**| `motivodedebito`| Razón o glosa del débito informado por el financiador. |
| **`notadedebito`** | `usuario` | Identifica al analista que confeccionó la refacturación. |
| **`notadedebito`** | `importerefactura`| Monto que se volvió a facturar para recuperar el dinero. |
