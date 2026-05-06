import { Injectable } from '@angular/core';
import { Prestacion } from '../models/prestacion';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaMathService {

  calcularTotales(prestaciones: Prestacion[]) {
    const totales = {
      totalFacturado: 0,
      totalDebitado: 0,
      totalCantidad: 0,
      totalNetoGlobal: 0,
      totalCoseguroGlobal: 0,
      totalRefacturadoGlobal: 0,
      cantAceptados: 0,
      totalDebitadoAceptado: 0,
      totalRefacturarRechazado: 0
    };

    for (const p of prestaciones) {
      totales.totalFacturado += (p.total || 0);
      totales.totalDebitado += (p.importeDebitado || 0);
      totales.totalCantidad += (p.cantidad || 0);
      totales.totalNetoGlobal += (p.totalNeto || 0);
      totales.totalCoseguroGlobal += (p.coseguro || 0);
      totales.totalRefacturadoGlobal += (p.importeRefactura || 0);

      if (p.debitoAceptado === 'SI') {
        totales.cantAceptados++;
        totales.totalDebitadoAceptado += (p.importeDebitado || 0);
      } else if (p.debitoAceptado === 'NO') {
        totales.totalRefacturarRechazado += (p.importeRefactura || 0);
      }
    }

    return totales;
  }
}
