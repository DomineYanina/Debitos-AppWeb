import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Prestacion } from '../models/prestacion';
import { ComprobanteSinAsociar, PrestacionCandidata, ComprobanteCandidato } from '../models/admin.model';

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
      const isBuscadoRecibo = (documentoBuscadoInfo.tipo || '').trim().toUpperCase() === 'RC';
      docBuscadoStr = isBuscadoRecibo
        ? `Documento Consultado: RC ${documentoBuscadoInfo.numero}  |  `
        : `Documento Consultado: ${documentoBuscadoInfo.tipo} ${documentoBuscadoInfo.letra}-${documentoBuscadoInfo.puntoVenta}-${documentoBuscadoInfo.numero}  |  `;
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
      const isRecibo = this.esRecibo(fila);
      const docActualStr = isRecibo
        ? `RC ${fila.numero || ''}`.trim()
        : `${tipoDisplay} ${fila.letra || ''}-${fila.puntoVenta || ''}-${fila.numero || ''}`.trim();

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
      if (fila.origenTipo === 'DEB') ramaDisplay = 'Débito (DEB)';
      else if (fila.origenTipo === 'COB') ramaDisplay = 'Cobro / Recibo (COB)';
      else if (fila.origenTipo === 'REF') ramaDisplay = 'Refactura (REF)';
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
      c3.value = isRecibo ? '' : (fila.letra || '');
      c3.alignment = { vertical: 'middle', horizontal: 'center' };

      const c4 = row.getCell(4);
      c4.value = isRecibo || fila.puntoVenta == null ? '' : Number(fila.puntoVenta);
      c4.alignment = { vertical: 'middle', horizontal: 'center' };
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
    if (t === 'Internados' || t === 'Ambulatorios' || t === 'FAC' || t === 'FCE') return 'FC';
    return t;
  }

  private esRecibo(fila: any): boolean {
    if (!fila) return false;
    const tipo = (fila.tipoDocumento || '').trim().toUpperCase();
    return tipo === 'RC' || tipo === 'RCA' || tipo === 'RCB' || tipo === 'REC';
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

    if ((tipo === 'FC' || tipo === 'FAC' || tipo === 'FCE') && (filaTipo === 'FC' || filaTipo === 'FAC' || filaTipo === 'FCE')) return true;
    if ((tipo === 'NC' || tipo === 'NCE') && (filaTipo === 'NC' || filaTipo === 'NCE')) return true;
    if ((tipo === 'ND' || tipo === 'NDE') && (filaTipo === 'ND' || filaTipo === 'NDE')) return true;

    return tipo === filaTipo;
  }

  private formatearFecha(fechaISO: string): string {
    if (!fechaISO) return '';
    const soloFecha = fechaISO.split('T')[0];
    const partes = soloFecha.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : soloFecha;
  }

  async exportarComprobantesSinAsociar(data: ComprobanteSinAsociar[], filename: string) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Documentos Sin Asociar');

    // Título y metadatos
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE COMPROBANTES SIN ASOCIAR A DOCUMENTO PADRE';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    worksheet.getRow(1).height = 32;

    worksheet.mergeCells('A2:K2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `Fecha de emisión: ${new Date().toLocaleDateString('es-AR')} - Total registros: ${data.length}`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // Encabezados en fila 4
    const headers = [
      'ID',
      'Tipo',
      'Comprobante',
      'Fecha Emisión',
      'Período Contable',
      'Cód. Cobertura',
      'Financiador / Obra Social',
      'Importe / Haber',
      'Origen',
      'Comp. Referencia',
      'Grupo Gestión'
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });

    let currentRow = 5;
    let sumaImporte = 0;

    data.forEach((item, index) => {
      const row = worksheet.getRow(currentRow);
      const imp = item.importe != null ? Number(item.importe) : 0;
      sumaImporte += imp;

      row.getCell(1).value = item.id;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(2).value = item.tipo;
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(3).value = item.comprobante;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(4).value = this.formatearFecha(item.fecha || '');
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(5).value = this.formatearFecha(item.periodo || '');
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(6).value = item.codigoCobertura || '-';
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(7).value = item.cobertura || 'SIN COBERTURA';
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'left' };

      const cImporte = row.getCell(8);
      cImporte.value = imp;
      cImporte.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      cImporte.alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(9).value = item.origen || 'APP';
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(10).value = item.comprobanteAsociado || '-';
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(11).value = item.asociadogrupo != null ? item.asociadogrupo : '-';
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };

      // Filas intercaladas (zebra striping)
      const bgArgb = (index % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';
      for (let col = 1; col <= 11; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      }
      row.height = 20;
      currentRow++;
    });

    // Fila de Total
    const totalRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const lblTotal = totalRow.getCell(1);
    lblTotal.value = `TOTAL (${data.length} COMPROBANTES):`;
    lblTotal.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    lblTotal.alignment = { vertical: 'middle', horizontal: 'right' };

    const valTotal = totalRow.getCell(8);
    valTotal.value = sumaImporte;
    valTotal.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    valTotal.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    valTotal.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= 11; col++) {
      const cell = totalRow.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF94A3B8' } }
      };
    }
    totalRow.height = 24;

    // Auto-ajuste de anchos de columna
    const minWidths = [10, 8, 22, 14, 15, 15, 35, 18, 15, 22, 14];
    for (let col = 1; col <= 11; col++) {
      let maxLen = 0;
      worksheet.getColumn(col).eachCell({ includeEmpty: false }, (cell) => {
        if (Number(cell.row) >= 4 && Number(cell.row) < currentRow) {
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) maxLen = val.length;
        }
      });
      worksheet.getColumn(col).width = Math.max(minWidths[col - 1], maxLen + 3);
    }

    worksheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: currentRow - 1, column: 11 } };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename);
  }

  async exportarPrestacionesCandidatas(data: PrestacionCandidata[], anio: number, filename: string) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prestaciones a Importar');

    // 1. Título y Metadatos Superiores
    worksheet.mergeCells('A1:Q1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PRESTACIONES DE GESTIÓN CANDIDATAS A IMPORTAR A DÉBITOS (amb_liquidado)';
    titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF581C87' } }; // Purple 900
    worksheet.getRow(1).height = 32;

    worksheet.mergeCells('A2:Q2');
    const subCell = worksheet.getCell('A2');
    const fechaDescarga = new Date().toLocaleString('es-AR');
    subCell.value = `Año: ${anio}  |  Total prestaciones exportadas: ${data.length}  |  Fecha de reporte: ${fechaDescarga}`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF4A044E' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
    worksheet.getRow(2).height = 20;

    // Fila 3 vacía
    worksheet.getRow(3).height = 8;

    // 2. Encabezados de Columnas en Fila 4
    const headers = [
      'ID Registro',
      'Tipo Registro',
      'Fecha',
      'Paciente',
      'Carnet',
      'Cód. Práctica',
      'Descripción Práctica',
      'Cantidad',
      'Médico Prestador',
      'Médico Efector',
      'Cód. Cobertura',
      'Plan',
      'Factura Gestión',
      'Vínculo Débitos',
      'Total Neto',
      'IVA',
      'Total'
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } }; // Dark indigo/slate
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF4338CA' } },
        bottom: { style: 'medium', color: { argb: 'FF4338CA' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });

    let currentRow = 5;
    let sumaNeto = 0;
    let sumaIva = 0;
    let sumaTotal = 0;

    data.forEach((item, index) => {
      const row = worksheet.getRow(currentRow);
      const neto = item.totalNeto != null ? Number(item.totalNeto) : 0;
      const iva = item.iva != null ? Number(item.iva) : 0;
      const tot = item.total != null ? Number(item.total) : (neto + iva);

      sumaNeto += neto;
      sumaIva += iva;
      sumaTotal += tot;

      row.getCell(1).value = item.idregistro;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(2).value = item.tiporegistro || 'Ambulatorios';
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(3).value = this.formatearFecha(item.fecha || '');
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(4).value = item.paciente || '-';
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(5).value = item.carnet || '-';
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(6).value = item.codigo || '-';
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(7).value = item.descripcion || '-';
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(8).value = item.cantidad != null ? Number(item.cantidad) : 1;
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(9).value = item.medico || '-';
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(10).value = item.efector || '-';
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(11).value = item.codigoCobertura || '-';
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(12).value = item.plan || '-';
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(13).value = item.facturaComprobante || 'Sin Factura';
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(14).value = item.facturaExisteEnDebitos ? '✓ Enlazada a Cabecera' : '⚠️ Sin Factura en Cabecera';
      row.getCell(14).alignment = { vertical: 'middle', horizontal: 'center' };

      const cNeto = row.getCell(15);
      cNeto.value = neto;
      cNeto.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      cNeto.alignment = { vertical: 'middle', horizontal: 'right' };

      const cIva = row.getCell(16);
      cIva.value = iva;
      cIva.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      cIva.alignment = { vertical: 'middle', horizontal: 'right' };

      const cTot = row.getCell(17);
      cTot.value = tot;
      cTot.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      cTot.alignment = { vertical: 'middle', horizontal: 'right' };

      // Zebra striping suave
      const bgArgb = (index % 2 === 0) ? 'FFFFFFFF' : 'FFFAF5FF';
      for (let col = 1; col <= 17; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      }

      row.height = 20;
      currentRow++;
    });

    // 3. Fila de Totales
    const totalRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:N${currentRow}`);
    const lblTotal = totalRow.getCell(1);
    lblTotal.value = `TOTALES (${data.length} PRESTACIONES):`;
    lblTotal.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    lblTotal.alignment = { vertical: 'middle', horizontal: 'right' };

    const cTotalNeto = totalRow.getCell(15);
    cTotalNeto.value = sumaNeto;
    cTotalNeto.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    cTotalNeto.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    cTotalNeto.alignment = { vertical: 'middle', horizontal: 'right' };

    const cTotalIva = totalRow.getCell(16);
    cTotalIva.value = sumaIva;
    cTotalIva.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    cTotalIva.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    cTotalIva.alignment = { vertical: 'middle', horizontal: 'right' };

    const cTotalGeneral = totalRow.getCell(17);
    cTotalGeneral.value = sumaTotal;
    cTotalGeneral.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    cTotalGeneral.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF15803D' } };
    cTotalGeneral.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= 17; col++) {
      const cell = totalRow.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF94A3B8' } }
      };
    }
    totalRow.height = 24;

    // 4. Auto-ajuste de Anchos de Columna
    const minWidths = [12, 14, 12, 28, 14, 14, 30, 10, 24, 24, 14, 16, 20, 22, 16, 14, 16];
    for (let col = 1; col <= 17; col++) {
      let maxLen = 0;
      worksheet.getColumn(col).eachCell({ includeEmpty: false }, (cell) => {
        if (Number(cell.row) >= 4 && Number(cell.row) < currentRow) {
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) maxLen = val.length;
        }
      });
      worksheet.getColumn(col).width = Math.max(minWidths[col - 1], maxLen + 3);
    }

    worksheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: currentRow - 1, column: 17 } };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename);
  }

  async exportarComprobantesCandidatos(data: ComprobanteCandidato[], anio: number, filename: string) {
    if (!data || data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Comprobantes a Importar');

    // 1. Título y Metadatos Superiores
    worksheet.mergeCells('A1:N1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'COMPROBANTES DE GESTIÓN CANDIDATOS A IMPORTAR A DÉBITOS (cabecera)';
    titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
    worksheet.getRow(1).height = 32;

    worksheet.mergeCells('A2:N2');
    const subCell = worksheet.getCell('A2');
    const fechaDescarga = new Date().toLocaleString('es-AR');
    subCell.value = `Año: ${anio}  |  Total comprobantes a importar: ${data.length}  |  Fecha de reporte: ${fechaDescarga}`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    worksheet.getRow(2).height = 20;

    // Fila 3 vacía
    worksheet.getRow(3).height = 8;

    // 2. Encabezados de Columnas en Fila 4
    const headers = [
      'Tipo',
      'Letra',
      'Pto. Venta',
      'Número',
      'Comprobante',
      'Fecha Emisión',
      'Período Contable',
      'Cód. Cobertura',
      'Financiador / Obra Social',
      'Debe ($)',
      'Haber ($)',
      'Comprobante Asociado (Padre)',
      'Grupo Gestión',
      'ID Asignación'
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });

    let currentRow = 5;
    let sumaDebe = 0;
    let sumaHaber = 0;

    data.forEach((item, index) => {
      const row = worksheet.getRow(currentRow);
      const debe = item.debe != null ? Number(item.debe) : 0;
      const haber = item.haber != null ? Number(item.haber) : 0;
      sumaDebe += debe;
      sumaHaber += haber;

      row.getCell(1).value = item.tipo;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(2).value = item.letra || 'X';
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(3).value = item.ptovta != null ? item.ptovta : 0;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(4).value = item.numero;
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(5).value = item.comprobante;
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(6).value = this.formatearFecha(item.fecha || '');
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(7).value = this.formatearFecha(item.periodo || '');
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(8).value = item.codigoCobertura || '-';
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(9).value = item.cobertura || 'SIN COBERTURA';
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'left' };

      const cDebe = row.getCell(10);
      cDebe.value = debe;
      cDebe.numFmt = '$ #,##0.00;($ #,##0.00);"-"';
      cDebe.alignment = { vertical: 'middle', horizontal: 'right' };

      const cHaber = row.getCell(11);
      cHaber.value = haber;
      cHaber.numFmt = '$ #,##0.00;($ #,##0.00);"-"';
      cHaber.alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(12).value = item.comprobanteAsociado || '-';
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(13).value = item.asociadogrupo != null ? item.asociadogrupo : '-';
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(14).value = item.idAsignacion != null ? item.idAsignacion : '-';
      row.getCell(14).alignment = { vertical: 'middle', horizontal: 'center' };

      // Zebra striping suave
      const bgArgb = (index % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';
      for (let col = 1; col <= 14; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      }

      row.height = 20;
      currentRow++;
    });

    // 3. Fila de Totales
    const totalRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const lblTotal = totalRow.getCell(1);
    lblTotal.value = `TOTAL (${data.length} COMPROBANTES):`;
    lblTotal.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    lblTotal.alignment = { vertical: 'middle', horizontal: 'right' };

    const cTotalDebe = totalRow.getCell(10);
    cTotalDebe.value = sumaDebe;
    cTotalDebe.numFmt = '$ #,##0.00;($ #,##0.00);"-"';
    cTotalDebe.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    cTotalDebe.alignment = { vertical: 'middle', horizontal: 'right' };

    const cTotalHaber = totalRow.getCell(11);
    cTotalHaber.value = sumaHaber;
    cTotalHaber.numFmt = '$ #,##0.00;($ #,##0.00);"-"';
    cTotalHaber.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF15803D' } };
    cTotalHaber.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= 14; col++) {
      const cell = totalRow.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF94A3B8' } }
      };
    }
    totalRow.height = 24;

    // 4. Auto-ajuste de Anchos de Columna
    const minWidths = [10, 8, 14, 14, 24, 15, 16, 15, 36, 18, 18, 26, 16, 16];
    for (let col = 1; col <= 14; col++) {
      let maxLen = 0;
      worksheet.getColumn(col).eachCell({ includeEmpty: false }, (cell) => {
        if (Number(cell.row) >= 4 && Number(cell.row) < currentRow) {
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) maxLen = val.length;
        }
      });
      worksheet.getColumn(col).width = Math.max(minWidths[col - 1], maxLen + 3);
    }

    worksheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: currentRow - 1, column: 14 } };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename);
  }

}
