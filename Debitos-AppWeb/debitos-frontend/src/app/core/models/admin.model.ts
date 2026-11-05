export interface EstadoSincronizacion {
  conexionOk: boolean;
  mensajeConexion: string;
  anio: number;
  totalGestion: number;
  pendientes: number;
  ultimaSincronizacion?: string;
  ultimoUsuario?: string;
  ultimosInsertados?: number;
  totalOrigenBdd: number;
  totalOrigenApp: number;
  comprobantesSinAsociar: number;
}

export interface ResumenSincronizacion {
  exito: boolean;
  mensaje: string;
  anioProcesado: number;
  totalLeidosGestion: number;
  nuevosInsertados: number;
  existentesOmitidos: number;
  asociadosActualizados: number;
  huerfanosReconciliados?: number;
  duracionMs: number;
  fechaHora: string;
}

export interface ComprobanteCandidato {
  tipo: string;
  letra: string;
  ptovta: number;
  numero: number;
  comprobante: string;
  fecha: string;
  periodo: string;
  debe: number;
  haber: number;
  codigoCobertura?: string;
  cobertura?: string;
  comprobanteAsociado?: string;
  asociadogrupo?: number;
  idAsignacion?: number;
}

export interface PrevisualizacionSincronizacion {
  anio: number;
  totalPendientes: number;
  desglosePorTipo: Record<string, number>;
  totalDebe: number;
  totalHaber: number;
  comprobantes: ComprobanteCandidato[];
}

export interface ComprobanteSinAsociar {
  id: number;
  tipo: string;
  letra: string;
  ptovta: number;
  numero: number;
  comprobante: string;
  fecha?: string;
  periodo?: string;
  debe: number;
  haber: number;
  importe: number;
  codigoCobertura?: string;
  cobertura?: string;
  origen?: string;
  comprobanteAsociado?: string;
  asociadogrupo?: number;
}

export interface EstadoSincronizacionPrestaciones {
  conexionOk: boolean;
  mensajeConexion: string;
  anio: number;
  totalGestion: number;
  totalGestionAmbulatorios: number;
  totalGestionInternados: number;
  totalDebitos: number;
  pendientes: number;
  vinculadasCabecera: number;
  huerfanasCabecera: number;
  totalVinculadas?: number;
  totalHuerfanas?: number;
  pendientesAmbulatorios?: number;
  pendientesInternados?: number;
  ultimaSincronizacion?: string;
  ultimoUsuario?: string;
  ultimasInsertadas?: number;
}

export interface PrestacionCandidata {
  idregistro: number;
  tiporegistro: string;
  fecha?: string;
  paciente?: string;
  carnet?: string;
  codigo?: string;
  descripcion?: string;
  cantidad?: number;
  medico?: string;
  efector?: string;
  codigoCobertura?: string;
  plan?: string;
  totalNeto: number;
  iva: number;
  total: number;
  facturaComprobante?: string;
  idcabecera?: number;
  facturaExisteEnDebitos: boolean;
  vinculadaConCabecera?: boolean;
}

export interface PrevisualizacionPrestaciones {
  anio: number;
  totalPendientes: number;
  totalAmbulatorios: number;
  totalInternados: number;
  conFacturaEnCabecera: number;
  sinFacturaEnCabecera: number;
  sumaTotalNeto: number;
  sumaIva: number;
  sumaTotal: number;
  prestaciones: PrestacionCandidata[];
  pendientesAmbulatorios?: number;
  pendientesInternados?: number;
  totalNetoPendiente?: number;
  totalPendiente?: number;
}

export interface ResumenSincronizacionPrestaciones {
  exito: boolean;
  mensaje: string;
  anioProcesado: number;
  totalLeidosGestion: number;
  nuevasInsertadas: number;
  existentesOmitidas: number;
  vinculadasCabecera: number;
  huerfanasSinCabecera: number;
  huerfanasPreviasReconciliadas: number;
  duracionMs: number;
  fechaHora: string;
}



