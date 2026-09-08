export interface Notificacion {
  id: number;
  tipoNotificacion?: string;
  titulo?: string;
  usuario: string;
  fechaHora: string;
  documentoReferencia: string;
  tipoDoc: string;
  letra: string;
  puntoVenta: number;
  numero: number;
  evento: string;
  mensaje: string;
  leida?: boolean;
}

