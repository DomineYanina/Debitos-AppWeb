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
  estado: string; // 'Considerar' | 'No considerar'
}

export interface CambiarEstadoPrestacionRequest {
  codigo: string;
  estado: string;
}

export interface FacturaAnuladaDTO {
  idCabecera: number;
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
  anulada: boolean;
  origenAnulacion: 'MANUAL' | 'GESTION' | null;
}

export interface CambiarAnulacionRequest {
  idCabecera: number;
  anulada: boolean;
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
