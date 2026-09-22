export interface DirectorioCobertura {
  codigo: string;
  nombre: string;
}

export interface DirectorioTotales {
  totalFacturado: number;
  cantidadFacturas: number;
  totalIncrementosNd: number;
  totalDebitosNc: number;
  totalRefacturacionNd: number;
  tasaRecupero: number;
  totalCobranzas: number;
  efectividadCobro: number;
  saldoPendienteReal: number;
  dsoPonderadoDias: number;

  cobranzaEfectiva?: number;
  perdidaAsumida?: number;
  deudaNeta?: number;
  cantidadComprobantes?: number;
}

export interface DirectorioComprobante {
  id: number;
  tipo: string;
  letra: string;
  ptovta: number;
  numero: number;
  fecha: string;
  montoNeto: number;
  montoIva: number;
  total: number;
  debitoAceptado: number;
  debitoNoAceptado: number;
  refacturado: number;
  origenTipo: 'DEB' | 'IVA' | 'REF' | 'COB' | string;
  nivel: number;
}

export interface DirectorioGrupoFactura {
  id: number;
  tipo: string;
  letra: string;
  ptovta: number;
  numero: number;
  fecha: string;
  periodo?: string;
  codigoCobertura: string;
  cobertura: string;
  asociadogrupo: number;
  totalFacturado: number;
  totalDebitadoAceptado: number;
  totalDebitadoNoAceptado: number;
  totalCobranza: number;
  cantidadRefacturaciones: number;
  idEstado: number;
  comprobantesDerivados: DirectorioComprobante[];
  expandido?: boolean;
}

export interface DirectorioMotivoDebito {
  motivo: string;
  montoTotal: number;
  porcentaje: number;
  cantidadCasos: number;
  color?: string;
}

export interface DirectorioPrestacionDetalle {
  id: number;
  paciente: string;
  carnet: string;
  plan: string;
  efector: string;
  medico: string;
  fechaPrestacion: string;
  codigo: string;
  descripcion: string;
  tipoDoc: string;
  letraDoc: string;
  ptovtaDoc: number;
  numeroDoc: number;
  fechaDoc: string;
  motivoDebito: string;
  comentariosDebito: string;
  importeDebitado: number;
  debitoAceptado: boolean | null;
}

/** Interfaces para gráficos financieros (Chart.js / ng2-charts) */
export interface PuntoGraficoDTO {
  etiqueta: string;
  valor: number;
}

export interface DatasetGraficoDTO {
  tituloDataset: string;
  puntos: PuntoGraficoDTO[];
}

/** Interfaces para la Cuenta Corriente a 3 Niveles */
export interface CcComprobanteDTO {
  id?: number;
  asociado?: number;
  asociadogrupo?: number;
  nivel?: number;
  origenTipo?: string;
  tipo: string;
  comprobante: string;
  fecha: string;
  facturacionFc: number;
  incrementosNd: number;
  debitosNc: number;
  refacturacionNd: number;
  cobranzasRc: number;
  saldo: number;
  expanded?: boolean;
  hijos?: CcComprobanteDTO[];
  _originalIndex?: number;
}

export interface CcPeriodoDTO {
  periodo: string;
  facturacionFc: number;
  incrementosNd: number;
  debitosNc: number;
  refacturacionNd: number;
  cobranzasRc: number;
  saldo: number;
  comprobantes: CcComprobanteDTO[];
  expanded?: boolean;
  _originalIndex?: number;
}

export interface CcFinanciadorDTO {
  financiador: string;
  facturacionFc: number;
  incrementosNd: number;
  debitosNc: number;
  refacturacionNd: number;
  cobranzasRc: number;
  saldo: number;
  periodos: CcPeriodoDTO[];
  expanded?: boolean;
  _originalIndex?: number;
}

/** Interfaces para la Matriz Anual de Recaudación */
export interface MatrizRecaudacionFilaDTO {
  financiador: string;
  meses: number[];
  totalAnual: number;
  _originalIndex?: number;
}

export interface MatrizRecaudacionDTO {
  anioSeleccionado: number;
  aniosDisponibles: number[];
  filas: MatrizRecaudacionFilaDTO[];
  totalesMes: number[];
  granTotal: number;
}

/** Interfaces para el Módulo de Detalle y Trazabilidad (Árbol Encadenado) */
export interface EventoTrazabilidadDTO {
  tipo: string;
  comprobante: string;
  fecha: string;
  monto: number;
  descripcion: string;
  responsable: string;
}

export interface CadenaTrazabilidadDTO {
  idPrestacion: string;
  descripcion: string;
  financiador: string;
  codigoCobertura?: string;
  fechaFactura?: string;
  medico: string;
  montoFacturadoOriginal: number;
  totalDebitado: number;
  tipoRegistro?: string;
  historialEventos: EventoTrazabilidadDTO[];
  expanded?: boolean;
  _originalIndex?: number;
}

/** Interfaces para el Reporte de Desempeño por Analistas de Débito (Tabla a 3 Niveles) */
export interface DesgloseFinanciadorDTO {
  financiador: string;
  casos: number;
  monto: number;
  montoDebitado?: number;
  aceptado?: number;
  refacturado?: number;
  distribucionAtencion?: string;
  tasaRecupero?: number;
  _originalIndex?: number;
}

export interface DesgloseMotivoDTO {
  motivo: string;
  casos: number;
  montoDebitado: number;
  aceptado: number;
  refacturado: number;
  financiadores: DesgloseFinanciadorDTO[];
  distribucionAtencion?: string;
  porcentajeAmb?: number;
  porcentajeInt?: number;
  cantidadAmb?: number;
  cantidadInt?: number;
  expanded?: boolean;
  _originalIndex?: number;
}

export interface MetricaAnalistaDTO {
  analista: string;
  cantidadRegistros: number;
  debitosAceptados: number;
  debitosRefacturados: number;
  totalTramitado: number;
  ticketPromedio: number;
  tasaRecupero: number;
  motivos: DesgloseMotivoDTO[];
  distribucionAtencion?: string;
  porcentajeAmb?: number;
  porcentajeInt?: number;
  cantidadAmb?: number;
  cantidadInt?: number;
  expanded?: boolean;
  _originalIndex?: number;
}

export interface MetricaMedicoDTO {
  medico: string;
  cantidadRegistros: number;
  debitosAceptados: number;
  debitosRefacturados: number;
  totalTramitado: number;
  ticketPromedio: number;
  tasaRecupero: number;
  motivos: DesgloseMotivoDTO[];
  expanded?: boolean;
  _originalIndex?: number;
}

export interface MetricaOperadorDTO {
  operador: string;
  cantidadRegistros: number;
  debitosAceptados: number;
  debitosRefacturados: number;
  totalTramitado: number;
  ticketPromedio: number;
  tasaRecupero: number;
  motivos: DesgloseMotivoDTO[];
  expanded?: boolean;
  _originalIndex?: number;
}

export interface DesempenoGlobalDTO {
  analistas: MetricaAnalistaDTO[];
  medicos: MetricaMedicoDTO[];
  operadores: MetricaOperadorDTO[];
}

/** Resumen de Cartera y Balance Financiero por Financiador */
export interface BalanceFinanciadorDTO {
  financiador: string; // Formato "COD - Nombre"
  facturacionFc: number;
  incrementosNd: number;
  debitosNc: number;
  refacturadoNd: number;
  cobradoRc: number;
  saldoPendiente: number;
}

/** Punto para Gráfico Donut de Distribución de Cartera */
export interface PuntoDonutDTO {
  etiqueta: string; // "COD - Nombre"
  saldo: number;
}

/** Tiempos de Cobranza (KPIs y Desglose de Antigüedad de Deuda) */
export interface RangoAntiguedadDTO {
  rango: string;
  cantidadComprobantes: number;
  saldoEnMora: number;
  porcentajeCartera: number;
}

export interface TiemposCobranzaDTO {
  dsoGlobal: number;
  cobroRealPromedio: number;
  saldoTotalMora: number;
  detalles: RangoAntiguedadDTO[];
}

