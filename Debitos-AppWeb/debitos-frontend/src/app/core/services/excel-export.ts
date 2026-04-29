import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Prestacion } from '../models/prestacion';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  async exportarPrestaciones(data: Prestacion[], tipoBusqueda: string, filename: string) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Auditoría');

    // 1. Definición de Columnas según el tipo de documento
    const columnas = this.obtenerConfiguracionColumnas(tipoBusqueda);
    worksheet.columns = columnas;

    // 2. Mapeo y formateo de datos
    data.forEach(p => {
      const registro = { ...p } as any;
      registro.fecha = this.formatearFecha(p.fecha || '');
      worksheet.addRow(registro);
    });

    // 3. Aplicar Estilos (Header, Auto-size, Colores, Bordes)
    this.aplicarEstilosVistosos(worksheet, columnas.length);

    // 4. Generar y descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename);
  }

  private obtenerConfiguracionColumnas(tipo: string): any[] {
    const baseCols = [
      { header: 'Carnet', key: 'carnet' },
      { header: 'Paciente', key: 'paciente' },
      { header: 'Cobertura', key: 'cobertura' },
      { header: 'Plan', key: 'plan' }
    ];

    if (tipo === 'NC') {
      return [
        ...baseCols,
        { header: 'Grupo Módulo', key: 'grupomodulo' },
        { header: 'Médico', key: 'medico' },
        { header: 'Fecha', key: 'fecha' },
        { header: 'Código', key: 'codigo' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Cant.', key: 'cantidad' },
        { header: 'Total Neto', key: 'totalNeto', style: { numFmt: '#,##0.00' } },
        { header: 'Coseguro', key: 'coseguro', style: { numFmt: '#,##0.00' } },
        { header: 'Total', key: 'total', style: { numFmt: '#,##0.00' } },
        { header: 'Comentario Previo', key: 'comentarioPrevio' },
        { header: 'Motivo Refactura', key: 'motivoRefactura' },
        { header: 'Imp. Refactura', key: 'importeRefactura', style: { numFmt: '#,##0.00' } },
        { header: 'Comentarios', key: 'comentarios' }
      ];
    }

    return [
      ...baseCols,
      { header: 'Efector', key: 'efector' },
      { header: 'Médico', key: 'medico' },
      { header: 'Fecha', key: 'fecha' },
      { header: 'Código', key: 'codigo' },
      { header: 'Descripción', key: 'descripcion' },
      { header: 'Cant.', key: 'cantidad' },
      { header: 'Total Neto', key: 'totalNeto', style: { numFmt: '#,##0.00' } },
      { header: 'Coseguro', key: 'coseguro', style: { numFmt: '#,##0.00' } },
      { header: 'Total', key: 'total', style: { numFmt: '#,##0.00' } },
      { header: 'Débito Aceptado', key: 'debitoAceptado' },
      { header: 'Motivo Débito', key: 'motivoDebito' },
      { header: 'Días Fact.', key: 'diasFacturados' },
      { header: 'Imp. Debitado', key: 'importeDebitado', style: { numFmt: '#,##0.00' } },
      { header: 'Motivo Refactura', key: 'motivoRefactura' },
      { header: 'Imp. Refactura', key: 'importeRefactura', style: { numFmt: '#,##0.00' } },
      { header: 'Comentarios', key: 'comentarios' }
    ];
  }

  private aplicarEstilosVistosos(worksheet: ExcelJS.Worksheet, totalColumnas: number) {
    // Auto-size de columnas
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength < 12 ? 12 : maxLength + 3;
    });

    // Estilo Encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    // Forzamos el recorrido exacto por cantidad de columnas
    for (let col = 1; col <= totalColumnas; col++) {
      const cell = headerRow.getCell(col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
    }

    // Filas intercaladas y bordes
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Forzamos la creación y pintado de TODAS las celdas, tengan o no datos
        for (let col = 1; col <= totalColumnas; col++) {
          const cell = row.getCell(col);

          if (rowNumber % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F8FC' } };
          }
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

          // Divisor de bloque (columna 13)
          if (col === 13) {
            cell.border.right = { style: 'medium' };
          }
        }
      }
    });

    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: totalColumnas } };
  }

  private formatearFecha(fechaISO: string): string {
    if (!fechaISO) return '';
    const soloFecha = fechaISO.split('T')[0];
    const partes = soloFecha.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : soloFecha;
  }

}
