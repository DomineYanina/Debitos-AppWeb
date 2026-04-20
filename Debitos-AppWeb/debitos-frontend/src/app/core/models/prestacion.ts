export interface Prestacion {
  id?: number;
  paciente: string;
  plan: string;
  medico: string;
  fecha: string;
  codigo: string;
  modulo: string;
  cantidad: number;
  total: number;
  // Campos de auditoría (los que el usuario edita)
  importeDebitado?: number;
  motivoDebito?: string;
  importeRefactura?: number;
  motivoRefactura?: string;
  comentarios?: string;
}
