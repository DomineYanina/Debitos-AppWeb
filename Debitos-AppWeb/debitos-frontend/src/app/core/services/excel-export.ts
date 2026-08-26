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

    const registrosAExportar = tipoBusqueda === 'NC'
      ? data
      : data.filter(p => {
          const deb = p.debitoAceptado ? p.debitoAceptado.trim().toUpperCase() : '';
          return deb === 'SI' || deb === 'NO';
        });

    if (registrosAExportar.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Auditoría');

    // 1. Definición de Columnas según el tipo de documento
    const columnas = this.obtenerConfiguracionColumnas(tipoBusqueda);
    worksheet.columns = columnas;

    // 2. Mapeo y formateo de datos
    registrosAExportar.forEach(p => {
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
        { header: 'Comentarios Refactura', key: 'comentarios' }
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
      { header: 'Comentarios Refactura', key: 'comentarios' }
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

  async exportarHistorialComprobantes(
    filas: any[],
    documentoBuscadoInfo: { tipo: string; letra: string; puntoVenta: string | number; numero: string | number } | null,
    filename: string
  ) {
    if (!filas || filas.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial Comprobantes');

    // 1. Título y Fila Informativa Superior
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'HISTORIAL DE COMPROBANTES ASOCIADOS';
    titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells('A2:J2');
    const subTitleCell = worksheet.getCell('A2');
    const fechaDescarga = new Date().toLocaleString('es-AR');
    let docBuscadoStr = '';
    if (documentoBuscadoInfo) {
      docBuscadoStr = `Documento Consultado: ${documentoBuscadoInfo.tipo} ${documentoBuscadoInfo.letra}-${documentoBuscadoInfo.puntoVenta}-${documentoBuscadoInfo.numero}  |  `;
    }
    subTitleCell.value = `${docBuscadoStr}Total Comprobantes en la Cadena: ${filas.length}  |  Fecha de Reporte: ${fechaDescarga}`;
    subTitleCell.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF334155' } };
    subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // Fila 3 vacía
    worksheet.getRow(3).height = 8;

    // 2. Encabezados de la tabla (Fila 4)
    const encabezados = [
      'Tipo de Documento',
      'Rama / Origen',
      'Letra',
      'Punto de Venta',
      'Número',
      'Fecha',
      'Monto Neto',
      '% IVA',
      'Monto IVA',
      'Documento Antecesor (Padre)'
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.height = 24;
    encabezados.forEach((headerText, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = headerText;
      cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
    });

    // 3. Pila para determinar el antecesor (Padre)
    const ancestorStack: string[] = [];

    // 4. Filas de datos
    let currentRowIdx = 5;
    filas.forEach(fila => {
      const nivel = fila.nivel || 0;
      const tipoDisplay = this.obtenerTipoDisplay(fila.tipoDocumento);
      const docActualStr = `${tipoDisplay} ${fila.letra || ''}-${fila.puntoVenta || ''}-${fila.numero || ''}`.trim();

      // Antecesor
      let antecesorStr = '(Documento Origen)';
      if (nivel > 0 && ancestorStack[nivel - 1]) {
        antecesorStr = ancestorStack[nivel - 1];
      }
      ancestorStack[nivel] = docActualStr;
      ancestorStack.length = nivel + 1;

      // Conector tipo árbol
      const tipoConConector = nivel > 0 ? `${'   '.repeat(nivel)}└─ ${tipoDisplay}` : tipoDisplay;

      // Rama / Origen
      let ramaDisplay = 'Raíz';
      if (fila.origenTipo === 'REF') ramaDisplay = 'Refactura (REF)';
      else if (fila.origenTipo === 'IVA') ramaDisplay = 'Ajuste IVA (IVA)';

      const row = worksheet.getRow(currentRowIdx);
      row.height = 20;
      row.outlineLevel = nivel;

      const isBuscado = this.esDocBuscado(fila, documentoBuscadoInfo);

      // Celdas
      const c1 = row.getCell(1);
      c1.value = tipoConConector;
      c1.alignment = { vertical: 'middle', horizontal: 'left', indent: nivel };

      const c2 = row.getCell(2);
      c2.value = ramaDisplay;
      c2.alignment = { vertical: 'middle', horizontal: 'center' };

      const c3 = row.getCell(3);
      c3.value = fila.letra || '';
      c3.alignment = { vertical: 'middle', horizontal: 'center' };

      const c4 = row.getCell(4);
      c4.value = fila.puntoVenta != null ? Number(fila.puntoVenta) : '';
      c4.alignment = { vertical: 'middle', horizontal: 'center' };

      const c5 = row.getCell(5);
      c5.value = fila.numero != null ? Number(fila.numero) : '';
      c5.alignment = { vertical: 'middle', horizontal: 'center' };

      const c6 = row.getCell(6);
      c6.value = this.formatearFecha(fila.fechaDocumento || '');
      c6.alignment = { vertical: 'middle', horizontal: 'center' };

      const c7 = row.getCell(7);
      c7.value = fila.montoNeto != null ? Number(fila.montoNeto) : null;
      c7.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      c7.alignment = { vertical: 'middle', horizontal: 'right' };

      const c8 = row.getCell(8);
      if (fila.porcentajeIva != null) {
        c8.value = Number(fila.porcentajeIva) / 100;
        c8.numFmt = '0.0%';
      } else {
        c8.value = '';
      }
      c8.alignment = { vertical: 'middle', horizontal: 'center' };

      const c9 = row.getCell(9);
      c9.value = fila.montoIva != null ? Number(fila.montoIva) : (fila.origenTipo === 'IVA' ? 0 : 0);
      c9.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      c9.alignment = { vertical: 'middle', horizontal: 'right' };

      const c10 = row.getCell(10);
      c10.value = antecesorStr;
      c10.alignment = { vertical: 'middle', horizontal: 'left' };

      // Colores de fondo: solo verde claro para ajuste de IVA, blanco para los demás
      let bgArgb = 'FFFFFFFF';
      if (fila.origenTipo === 'IVA') {
        bgArgb = 'FFF0FDF4'; // Verde claro para ajuste de IVA
      }

      for (let col = 1; col <= 10; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: isBuscado || nivel === 0,
          color: { argb: 'FF1E293B' }
        };
      }

      currentRowIdx++;
    });

    // 5. Ajustar anchos de columnas
    const minWidths = [24, 18, 10, 15, 14, 14, 18, 12, 18, 28];
    for (let col = 1; col <= 10; col++) {
      let maxLen = 0;
      worksheet.getColumn(col).eachCell({ includeEmpty: false }, cell => {
        if (Number(cell.row) > 3) {
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) maxLen = val.length;
        }
      });
      worksheet.getColumn(col).width = Math.max(minWidths[col - 1], maxLen + 3);
    }

    worksheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 10 } };

    // 6. Descargar
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename);
  }

  private obtenerTipoDisplay(tipo: string): string {
    if (!tipo) return 'FC';
    const t = tipo.trim();
    if (t === 'Internados' || t === 'Ambulatorios') return 'FC';
    return t;
  }

  private esDocBuscado(fila: any, buscado: { tipo: string; letra: string; puntoVenta: string | number; numero: string | number } | null): boolean {
    if (!buscado || !fila) return false;
    if (fila.placeholderNdAjusteIva) return false;

    const tipo = (buscado.tipo || '').toUpperCase();
    const letra = (buscado.letra || '').toUpperCase();
    const ptovta = Number(buscado.puntoVenta);
    const numero = Number(buscado.numero);

    const filaTipo = this.obtenerTipoDisplay(fila.tipoDocumento).toUpperCase();
    const filaLetra = (fila.letra || '').toUpperCase();
    const filaPtovta = Number(fila.puntoVenta);
    const filaNumero = Number(fila.numero);

    if (filaLetra !== letra || filaPtovta !== ptovta || filaNumero !== numero) {
      return false;
    }

    if (tipo === 'FC' && filaTipo === 'FC') return true;
    if (tipo === 'NC' && (filaTipo === 'NC' || filaTipo === 'NCE')) return true;
    if (tipo === 'ND' && (filaTipo === 'ND' || filaTipo === 'NDE')) return true;

    return tipo === filaTipo;
  }

  private formatearFecha(fechaISO: string): string {
    if (!fechaISO) return '';
    const soloFecha = fechaISO.split('T')[0];
    const partes = soloFecha.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : soloFecha;
  }

}
