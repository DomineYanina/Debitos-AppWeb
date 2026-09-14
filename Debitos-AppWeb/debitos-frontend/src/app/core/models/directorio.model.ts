export interface DirectorioCobertura {
  codigo: string;
  nombre: string;
}

export interface DirectorioTotales {
  totalFacturado: number;
  cobranzaEfectiva: number;
  perdidaAsumida: number;
  deudaNeta: number;
  cantidadFacturas: number;
  cantidadComprobantes: number;
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
