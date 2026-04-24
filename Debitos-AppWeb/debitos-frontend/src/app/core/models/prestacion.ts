export interface Prestacion {
  seleccionada?: boolean;
  id?: number;
  paciente: string;
  plan: string;           // NUEVO
  efector: string;        // NUEVO
  medico: string;
  fecha: string;
  codigo: string;
  descripcion: string;    // NUEVO
  modulo: string;
  grupomodulo?: string;
  cantidad: number;
  totalNeto: number;      // NUEVO
  coseguro: number;       // NUEVO
  total: number;
  debitoAceptado?: string;// NUEVO
  diasFacturados?: number;// NUEVO
  importeDebitado?: number;
  motivoDebito?: string;
  importeRefactura?: number;
  motivoRefactura?: string;
  comentarios?: string;
  comentarioPrevio?: string;
  carnet?: string;
  cobertura?: string;
  prestacionEnglobante?: string;
}
