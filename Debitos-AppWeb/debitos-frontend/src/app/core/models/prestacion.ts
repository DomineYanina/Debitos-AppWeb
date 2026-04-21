export interface Prestacion {
  seleccionada?: boolean; // Para marcar la prestación seleccionada en la tabla
  id?: number;
  paciente: string;
  plan: string;
  medico: string;
  fecha: string;
  codigo: string;
  modulo: string;
  grupomodulo?: string;
  cantidad: number;
  total: number;
  // Campos de auditoría (los que el usuario edita)
  importeDebitado?: number;
  motivoDebito?: string;
  importeRefactura?: number;
  motivoRefactura?: string;
  comentarios?: string;
}
