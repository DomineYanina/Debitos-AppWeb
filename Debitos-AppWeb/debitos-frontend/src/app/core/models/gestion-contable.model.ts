export interface CoberturaAliasDTO {
  codigoCobertura: string;
  nombreOriginal: string;
  nombreMostrar: string;
}

export interface GuardarAliasRequest {
  codigoCobertura: string;
  nombreOriginal?: string;
  nombreMostrar: string;
}

export interface FacturaPeriodoDTO {
  idCabecera: number;
  tipo: string;
  letra: string;
  ptovta: number;
  numero: number;
  fecha: string;
  periodoOriginal: string | null;
  periodoCorregido: string | null;
  codigoCobertura: string;
  cobertura: string;
  importe: number;
}

export interface CorregirPeriodoRequest {
  idCabecera: number;
  periodoCorregido: string; // "DD/MM/YYYY" o "YYYY-MM-DD"
}

export interface PrestacionConsideracionDTO {
  codigo: string;
  descripcion: string;
  estado?: string; // 'Considerar' | 'No considerar' (legacy)
  estadoAmbulatorio: string; // 'Considerar' | 'No considerar'
  estadoInternado: string; // 'Considerar' | 'No considerar'
}

export interface CambiarEstadoPrestacionRequest {
  codigo: string;
  estado?: string;
  estadoAmbulatorio: string;
  estadoInternado: string;
  motivo?: string;
}

export interface FacturaAnuladaDTO {
  idCabecera: number;
  asociadogrupo?: number | null;
  comprobante: string;
  tipo: string;
  letra: string;
  ptovta: number;
  numero: number;
  fecha: string;
  periodo: string;
  codigoCobertura: string;
  cobertura: string;
  importe: number;
  tipoRegistro?: string | null;
  comprobanteAsociado?: string | null;
  anulada: boolean;
  origenAnulacion: 'MANUAL' | 'GESTION' | null;
  fechaAnulacion?: string | null;
  usuarioAnulacion?: string | null;
  idCabeceraAnulador?: number | null;
  comprobanteAnulador?: string | null;
  tipoAnulador?: string | null;
  letraAnulador?: string | null;
  ptovtaAnulador?: number | null;
  numeroAnulador?: number | null;
  fechaAnulador?: string | null;
  periodoAnulador?: string | null;
  codigoCoberturaAnulador?: string | null;
  coberturaAnulador?: string | null;
  importeAnulador?: number | null;
  asociadogrupoAnulador?: number | null;
  tipoRegistroAnulador?: string | null;
  tieneSolicitudAnulacion?: boolean;
  idNotificacionSolicitud?: number | null;
  usuarioSolicitante?: string | null;
  motivoSolicitudAnulacion?: string | null;
}

export interface CambiarAnulacionRequest {
  idCabecera: number;
  anulada: boolean;
  idCabeceraAnulador?: number | null;
  comprobanteAnulador?: string | null;
  tieneSolicitudAnulacion?: boolean;
  idNotificacionSolicitud?: number | null;
  usuarioSolicitante?: string | null;
  motivoSolicitudAnulacion?: string | null;
}

export interface HistorialAjusteDTO {
  id: number;
  tipoOperacionCodigo: string;
  tipoOperacionDescripcion: string;
  referencia: string;
  valorAnterior: string;
  valorNuevo: string;
  usuario: string;
  fechaHora: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
