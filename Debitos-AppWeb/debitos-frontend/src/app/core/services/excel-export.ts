import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Prestacion } from '../models/prestacion';
import { ComprobanteSinAsociar, PrestacionCandidata, ComprobanteCandidato } from '../models/admin.model';
import {
  BalanceFinanciadorDTO,
  CadenaTrazabilidadDTO,
  CcFinanciadorDTO,
  DirectorioMotivoDebito,
  DirectorioPrestacionDetalle,
  DirectorioPrestacionItem,
  DirectorioTotales,
  MatrizRecaudacionDTO,
  MetricaAnalistaDTO,
  MetricaMedicoDTO,
  MetricaOperadorDTO,
  ReciboSinImputarDTO,
  TiemposCobranzaDTO
} from '../models/directorio.model';

export interface ContextoFiltroExportacion {
  solapaTitulo: string;
  coberturaTexto: string;
  tipoComprobanteTexto?: string;
  criterioFechaTexto?: string;
  rangoFechasTexto?: string;
  filtrosLocalesTexto?: string;
}


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

  // ===========================================================================
  // EXPORTACIÓN A EXCEL DE LAS 10 SOLAPAS DEL TABLERO DE CONTROL FINANCIERO
  // ===========================================================================

  generarNombreArchivoTablero(prefijoSolapa: string): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `Tablero_${prefijoSolapa}_${yyyy}-${mm}-${dd}.xlsx`;
  }

  private configurarHojaJerarquica(worksheet: ExcelJS.Worksheet): void {
    worksheet.properties.outlineProperties = {
      summaryBelow: false,
      summaryRight: false
    };
    worksheet.views = [{ state: 'normal', showOutlineSymbols: true } as any];
  }

  private escribirEncabezadoTablero(
    worksheet: ExcelJS.Worksheet,
    totalColumnas: number,
    contexto: ContextoFiltroExportacion,
    resumenExtra?: string
  ): number {
    worksheet.mergeCells(1, 1, 1, totalColumnas);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `TABLERO DE CONTROL FINANCIERO — ${(contexto.solapaTitulo || '').toUpperCase()}`;
    titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells(2, 1, 2, totalColumnas);
    const subCell = worksheet.getCell(2, 1);
    const partesMeta: string[] = [];
    partesMeta.push(`Institución: ${contexto.coberturaTexto || 'Todas las Instituciones'}`);
    if (contexto.tipoComprobanteTexto) {
      partesMeta.push(`Tipo Comp.: ${contexto.tipoComprobanteTexto}`);
    }
    if (contexto.rangoFechasTexto) {
      partesMeta.push(`${contexto.criterioFechaTexto || 'Período'}: ${contexto.rangoFechasTexto}`);
    }
    if (contexto.filtrosLocalesTexto) {
      partesMeta.push(contexto.filtrosLocalesTexto);
    }
    if (resumenExtra) {
      partesMeta.push(resumenExtra);
    }
    partesMeta.push(`Exportado: ${new Date().toLocaleString('es-AR')}`);

    subCell.value = partesMeta.join('  |  ');
    subCell.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF334155' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    worksheet.getRow(2).height = 22;

    worksheet.getRow(3).height = 8;
    return 4;
  }

  private estilizarCabeceraTabla(
    row: ExcelJS.Row,
    headers: string[],
    bgArgb: string = 'FF1E293B'
  ): void {
    row.height = 25;
    headers.forEach((h, idx) => {
      const col = idx + 1;
      const cell = row.getCell(col);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: col === 1 ? 'left' : 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });
  }

  private estilizarFilaTotalTablero(
    row: ExcelJS.Row,
    totalColumnas: number,
    bgArgb: string = 'FFE0F2FE'
  ): void {
    row.height = 24;
    row.outlineLevel = 0;
    for (let col = 1; col <= totalColumnas; col++) {
      const cell = row.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0284C7' } },
        bottom: { style: 'double', color: { argb: 'FF0284C7' } },
        left: { style: 'thin', color: { argb: 'FFBAE6FD' } },
        right: { style: 'thin', color: { argb: 'FFBAE6FD' } }
      };
      if (!cell.font) {
        cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
      } else {
        cell.font = { ...cell.font, name: 'Calibri', size: 10.5, bold: true };
      }
    }
  }

  private estilizarFilaNivelJerarquico(
    row: ExcelJS.Row,
    totalColumnas: number,
    outlineLevel: number,
    bgArgb: string,
    bold: boolean,
    textColorArgb: string = 'FF1E293B'
  ): void {
    row.height = outlineLevel === 0 ? 22 : 20;
    row.outlineLevel = outlineLevel;
    for (let col = 1; col <= totalColumnas; col++) {
      const cell = row.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (!cell.font) {
        cell.font = { name: 'Calibri', size: outlineLevel === 0 ? 10.5 : 10, bold, color: { argb: textColorArgb } };
      }
    }
  }

  private ajustarAnchosTablero(
    worksheet: ExcelJS.Worksheet,
    minWidths: number[],
    filaInicio: number,
    filaFin: number
  ): void {
    for (let col = 1; col <= minWidths.length; col++) {
      let maxLen = 0;
      worksheet.getColumn(col).eachCell({ includeEmpty: false }, (cell) => {
        const r = Number(cell.row);
        if (r >= filaInicio && r <= filaFin) {
          const val = cell.value != null ? cell.value.toString() : '';
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        }
      });
      worksheet.getColumn(col).width = Math.min(62, Math.max(minWidths[col - 1], maxLen + 3));
    }
  }

  private formatearPeriodoCorto(periodoISO?: string): string {
    if (!periodoISO) return '—';
    const limpio = periodoISO.split('T')[0];
    const partes = limpio.split('-');
    if (partes.length >= 2) {
      return `${partes[1]}/${partes[0]}`;
    }
    return limpio;
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 1: TABLERO DE CONTROL (KPIs + Balance Financiero)
  // ---------------------------------------------------------------------------
  async exportarTableroControl(
    totales: DirectorioTotales,
    balance: BalanceFinanciadorDTO[],
    totalesBalance: {
      facturacionFc: number;
      incrementosNd: number;
      debitosNc: number;
      refacturadoNd: number;
      cobradoRc: number;
      saldoPendiente: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if ((!balance || balance.length === 0) && !totales) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tablero de Control');
    const totalCols = 7;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Financiadores en Cartera: ${balance?.length || 0}`
    );

    // Bloque 1: Tarjetas KPI Ejecutivas
    const kpiHeaders = [
      'FACTURACIÓN ORIGINAL (FC)',
      'INCREMENTOS (ND)',
      'DÉBITOS RECIBIDOS (NC)',
      'REFACTURACIÓN (ND-NC)',
      'COBRANZAS (RC)',
      'SALDO PENDIENTE REAL',
      'INDICADORES DE GESTIÓN'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), kpiHeaders, 'FF1E3A8A');
    currentRow++;

    const kpiRow = worksheet.getRow(currentRow);
    const kpiMontos = [
      totales?.totalFacturado || 0,
      totales?.totalIncrementosNd || 0,
      totales?.totalDebitosNc || 0,
      totales?.totalRefacturacionNd || 0,
      totales?.totalCobranzas || 0,
      totales?.saldoPendienteReal || 0
    ];
    kpiMontos.forEach((val, idx) => {
      const c = kpiRow.getCell(idx + 1);
      c.value = Number(val);
      c.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      c.alignment = { vertical: 'middle', horizontal: 'right' };
    });
    const cIndicadores = kpiRow.getCell(7);
    cIndicadores.value = `Recupero: ${(totales?.tasaRecupero || 0).toFixed(1)}%  |  Efectividad: ${(totales?.efectividadCobro || 0).toFixed(1)}%  |  DSO: ${totales?.dsoPonderadoDias ?? 0} días`;
    cIndicadores.alignment = { vertical: 'middle', horizontal: 'center' };
    this.estilizarFilaTotalTablero(kpiRow, totalCols, 'FFF8FAFC');
    currentRow++;

    // Espacio separador
    worksheet.getRow(currentRow).height = 10;
    currentRow++;

    // Bloque 2: Tabla Resumen de Cartera y Balance Financiero
    const filaCabeceraTabla = currentRow;
    const headersBalance = [
      'FINANCIADOR',
      'FACTURACIÓN (FC)',
      'INCREMENTOS (ND)',
      'DÉBITOS (NC)',
      'REFACTURADO (ND-NC)',
      'COBRADO (RC)',
      'SALDO PENDIENTE'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headersBalance, 'FF0F172A');
    currentRow++;

    // Fila TOTAL GENERAL Superior
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${balance?.length || 0} Financiadores)`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    const valsTotales = [
      totalesBalance?.facturacionFc || 0,
      totalesBalance?.incrementosNd || 0,
      totalesBalance?.debitosNc || 0,
      totalesBalance?.refacturadoNd || 0,
      totalesBalance?.cobradoRc || 0,
      totalesBalance?.saldoPendiente || 0
    ];
    valsTotales.forEach((v, idx) => {
      const c = totalRow.getCell(idx + 2);
      c.value = Number(v);
      c.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      c.alignment = { vertical: 'middle', horizontal: 'right' };
    });
    this.estilizarFilaTotalTablero(totalRow, totalCols, 'FFE0F2FE');
    currentRow++;

    // Filas por Financiador
    (balance || []).forEach((b, index) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = b.financiador || 'Sin especificar';
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      const montos = [
        b.facturacionFc || 0,
        b.incrementosNd || 0,
        b.debitosNc || 0,
        b.refacturadoNd || 0,
        b.cobradoRc || 0,
        b.saldoPendiente || 0
      ];
      montos.forEach((m, i) => {
        const cell = row.getCell(i + 2);
        cell.value = Number(m);
        cell.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (i === 5) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        }
      });

      const bg = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      this.estilizarFilaNivelJerarquico(row, totalCols, 0, bg, false);
      currentRow++;
    });

    this.ajustarAnchosTablero(worksheet, [36, 20, 20, 20, 20, 20, 24], 4, currentRow - 1);
    worksheet.autoFilter = {
      from: { row: filaCabeceraTabla, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Control_Financiero'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 2A: CUENTA CORRIENTE — IMPUTADOS (3 Niveles + Hijos con outlineLevel)
  // ---------------------------------------------------------------------------
  async exportarCuentaCorrienteImputados(
    datos: CcFinanciadorDTO[],
    totalesCc: {
      facturacion: number;
      incrementos: number;
      debitos: number;
      refacturacion: number;
      cobranzas: number;
      saldo: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!datos || datos.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cuenta Corriente Imputados');
    this.configurarHojaJerarquica(worksheet);
    const totalCols = 8;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Entidades: ${datos.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'ENTIDAD / PERÍODO / COMPROBANTE',
      'FECHA',
      'FACTURACIÓN (FC)',
      'INCREMENTOS (ND)',
      'DÉBITOS (NC)',
      'REFACTURACIÓN (ND)',
      'COBRANZAS (RC)',
      'SALDO'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${datos.length} ${datos.length === 1 ? 'entidad' : 'entidades'})`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    totalRow.getCell(2).value = '—';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    const montosTot = [
      totalesCc.facturacion || 0,
      totalesCc.incrementos || 0,
      totalesCc.debitos || 0,
      totalesCc.refacturacion || 0,
      totalesCc.cobranzas || 0,
      totalesCc.saldo || 0
    ];
    montosTot.forEach((m, idx) => {
      const c = totalRow.getCell(idx + 3);
      c.value = Number(m);
      c.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      c.alignment = { vertical: 'middle', horizontal: 'right' };
    });
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    const escribirMontosCc = (
      row: ExcelJS.Row,
      obj: {
        facturacionFc?: number;
        incrementosNd?: number;
        debitosNc?: number;
        refacturacionNd?: number;
        cobranzasRc?: number;
        saldo?: number;
      },
      esNivelHoja: boolean = false
    ) => {
      const valores = [
        obj.facturacionFc || 0,
        obj.incrementosNd || 0,
        obj.debitosNc || 0,
        obj.refacturacionNd || 0,
        obj.cobranzasRc || 0,
        obj.saldo || 0
      ];
      valores.forEach((val, idx) => {
        const c = row.getCell(idx + 3);
        if (esNivelHoja && idx < 5 && (!val || val === 0)) {
          c.value = '—';
          c.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          c.value = Number(val);
          c.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
          c.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      });
    };

    // Recorrido de los 3 niveles + hijos con outlineLevel
    datos.forEach((f) => {
      // NIVEL 0: Financiador
      const rowFin = worksheet.getRow(currentRow);
      rowFin.getCell(1).value = f.financiador || 'Sin financiador';
      rowFin.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      rowFin.getCell(2).value = '—';
      rowFin.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      escribirMontosCc(rowFin, f, false);
      this.estilizarFilaNivelJerarquico(rowFin, totalCols, 0, 'FFEFF6FF', true, 'FF0F172A');
      currentRow++;

      // NIVEL 1: Períodos
      (f.periodos || []).forEach((p) => {
        const rowPer = worksheet.getRow(currentRow);
        rowPer.getCell(1).value = `   Período ${p.periodo}`;
        rowPer.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        rowPer.getCell(2).value = '—';
        rowPer.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        escribirMontosCc(rowPer, p, false);
        this.estilizarFilaNivelJerarquico(rowPer, totalCols, 1, 'FFF8FAFC', true, 'FF1E293B');
        currentRow++;

        // NIVEL 2: Grupo / Factura Madre
        (p.comprobantes || []).forEach((fc) => {
          const rowFc = worksheet.getRow(currentRow);
          const compLimpio = (fc.comprobante || '').replace(/^(FC[A-Z]?|FAC)\s+/i, '');
          rowFc.getCell(1).value = `      [Grupo] ${compLimpio}`;
          rowFc.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
          rowFc.getCell(2).value = this.formatearFecha(fc.fecha || '');
          rowFc.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
          escribirMontosCc(rowFc, fc, true);
          this.estilizarFilaNivelJerarquico(rowFc, totalCols, 2, 'FFFFFFFF', true, 'FF334155');
          currentRow++;

          // NIVEL 3: Comprobantes Hijos (FC origen, NC, ND, RC)
          (fc.hijos || []).forEach((h) => {
            const rowHijo = worksheet.getRow(currentRow);
            const etiquetaOrigen = h.origenTipo === 'FC' ? ' (Origen)' : '';
            rowHijo.getCell(1).value = `         └─ [${h.tipo || 'DOC'}] ${h.comprobante || ''}${etiquetaOrigen}`;
            rowHijo.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 3 };
            rowHijo.getCell(2).value = this.formatearFecha(h.fecha || '');
            rowHijo.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
            escribirMontosCc(rowHijo, h, true);
            this.estilizarFilaNivelJerarquico(rowHijo, totalCols, 3, 'FFFAFAFA', false, 'FF475569');
            currentRow++;
          });
        });
      });
    });

    this.ajustarAnchosTablero(worksheet, [42, 14, 18, 18, 18, 18, 18, 20], filaHeader, currentRow - 1);
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Cuenta_Corriente_Imputados'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 2B: CUENTA CORRIENTE — RECIBOS NO IMPUTADOS
  // ---------------------------------------------------------------------------
  async exportarCuentaCorrienteNoImputados(
    recibos: ReciboSinImputarDTO[],
    totalMonto: number,
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!recibos || recibos.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Recibos No Imputados');
    const totalCols = 5;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Comprobantes Sin Imputar: ${recibos.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'COMPROBANTE',
      'FECHA',
      'FINANCIADOR / OBRA SOCIAL',
      'PERÍODO',
      'IMPORTE ($)'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${recibos.length} Comprobantes Sin Imputar)`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    totalRow.getCell(2).value = '—';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(3).value = '—';
    totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(4).value = '—';
    totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

    const cTotImp = totalRow.getCell(5);
    cTotImp.value = Number(totalMonto || 0);
    cTotImp.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    cTotImp.alignment = { vertical: 'middle', horizontal: 'right' };
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    recibos.forEach((r, idx) => {
      const row = worksheet.getRow(currentRow);
      const tipo = (r.tipo || 'RC').trim().toUpperCase();
      let comp = (r.comprobante || '').trim();
      if (tipo && comp.toUpperCase().startsWith(tipo)) {
        comp = comp.substring(tipo.length).trim();
      }
      row.getCell(1).value = `[${tipo}] ${comp}`;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(2).value = r.fecha ? this.formatearFecha(r.fecha) : '—';
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      const finStr = r.codigoCobertura && r.cobertura
        ? `${r.codigoCobertura} - ${r.cobertura}`
        : (r.cobertura || r.codigoCobertura || 'Sin financiador');
      row.getCell(3).value = finStr;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(4).value = this.formatearPeriodoCorto(r.periodo);
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

      const cImp = row.getCell(5);
      cImp.value = Number(r.importe || r.haber || 0);
      cImp.numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      cImp.alignment = { vertical: 'middle', horizontal: 'right' };

      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      this.estilizarFilaNivelJerarquico(row, totalCols, 0, bg, false);
      currentRow++;
    });

    this.ajustarAnchosTablero(worksheet, [26, 15, 38, 15, 20], filaHeader, currentRow - 1);
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Recibos_No_Imputados'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 3: TIEMPOS DE COBRANZA (AGING DE DEUDA)
  // ---------------------------------------------------------------------------
  async exportarTiemposCobranza(
    datos: TiemposCobranzaDTO | null,
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!datos || !datos.detalles || datos.detalles.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tiempos de Cobranza');
    const totalCols = 4;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `DSO Global: ${datos.dsoGlobal ?? 0} días  |  Cobro Promedio: ${datos.cobroRealPromedio ?? 0} días`
    );

    // Bloque KPI DSO
    const kpiHeaders = [
      'DSO GLOBAL PONDERADO (DÍAS)',
      'COBRO REAL PROMEDIO (DÍAS)',
      'SALDO TOTAL EN MORA ($)',
      'RANGOS EVALUADOS'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), kpiHeaders, 'FF1E3A8A');
    currentRow++;

    const kpiRow = worksheet.getRow(currentRow);
    kpiRow.getCell(1).value = Number(datos.dsoGlobal ?? 0);
    kpiRow.getCell(1).numFmt = '#,##0';
    kpiRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    kpiRow.getCell(2).value = Number(datos.cobroRealPromedio ?? 0);
    kpiRow.getCell(2).numFmt = '#,##0';
    kpiRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    kpiRow.getCell(3).value = Number(datos.saldoTotalMora ?? 0);
    kpiRow.getCell(3).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    kpiRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

    kpiRow.getCell(4).value = datos.detalles.length;
    kpiRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    this.estilizarFilaTotalTablero(kpiRow, totalCols, 'FFF8FAFC');
    currentRow++;

    worksheet.getRow(currentRow).height = 10;
    currentRow++;

    // Tabla Detalle de Cobranzas por Rango y Saldo Pendiente
    const filaHeader = currentRow;
    const headers = [
      'RANGO / ESTADO',
      'CANTIDAD DE COMPROBANTES',
      'MONTO ($)',
      '% DEL TOTAL'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    let totalComp = 0;
    let totalMonto = 0;
    datos.detalles.forEach((d) => {
      totalComp += d.cantidadComprobantes || 0;
      totalMonto += d.saldoEnMora || 0;
    });

    // Fila TOTAL GENERAL
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = 'TOTAL GENERAL';
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    totalRow.getCell(2).value = totalComp;
    totalRow.getCell(2).numFmt = '#,##0';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
    totalRow.getCell(3).value = totalMonto;
    totalRow.getCell(3).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
    totalRow.getCell(4).value = 1;
    totalRow.getCell(4).numFmt = '0.0%';
    totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    datos.detalles.forEach((item, idx) => {
      const row = worksheet.getRow(currentRow);
      const esNoCobrado = item.rango === 'Aún no cobrados';
      row.getCell(1).value = item.rango;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(2).value = Number(item.cantidadComprobantes || 0);
      row.getCell(2).numFmt = '#,##0';
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(3).value = Number(item.saldoEnMora || 0);
      row.getCell(3).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(4).value = Number(item.porcentajeCartera || 0) / 100;
      row.getCell(4).numFmt = '0.0%';
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };

      const bg = esNoCobrado ? 'FFFEF2F2' : (idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC');
      const colorTxt = esNoCobrado ? 'FFB91C1C' : 'FF1E293B';
      this.estilizarFilaNivelJerarquico(row, totalCols, 0, bg, esNoCobrado, colorTxt);
      currentRow++;
    });

    this.ajustarAnchosTablero(worksheet, [30, 26, 24, 18], 4, currentRow - 1);
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Tiempos_Cobranza'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 4: MATRIZ DE COBRANZAS (RECAUDACIÓN ANUAL)
  // ---------------------------------------------------------------------------
  async exportarMatrizCobranzas(
    matriz: MatrizRecaudacionDTO | null,
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!matriz || !matriz.filas || matriz.filas.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Matriz ${matriz.anioSeleccionado || ''}`.trim());
    const totalCols = 14;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Año Calendario: ${matriz.anioSeleccionado}  |  Financiadores: ${matriz.filas.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'FINANCIADOR',
      'ENE',
      'FEB',
      'MAR',
      'ABR',
      'MAY',
      'JUN',
      'JUL',
      'AGO',
      'SEP',
      'OCT',
      'NOV',
      'DIC',
      'TOTAL ANUAL'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    const escribirFilaTotalesMatriz = (row: ExcelJS.Row) => {
      row.getCell(1).value = 'TOTAL GENERAL';
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      for (let m = 0; m < 12; m++) {
        const valMes = matriz.totalesMes?.[m] || 0;
        const c = row.getCell(m + 2);
        c.value = Number(valMes);
        c.numFmt = '$ #,##0;($ #,##0);"-"';
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      const cGran = row.getCell(14);
      cGran.value = Number(matriz.granTotal || 0);
      cGran.numFmt = '$ #,##0;($ #,##0);"-"';
      cGran.alignment = { vertical: 'middle', horizontal: 'right' };
      this.estilizarFilaTotalTablero(row, totalCols);
    };

    // Fila Superior de Totales
    escribirFilaTotalesMatriz(worksheet.getRow(currentRow));
    currentRow++;

    // Filas de Financiadores
    matriz.filas.forEach((fila, idx) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = fila.financiador;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      for (let m = 0; m < 12; m++) {
        const val = fila.meses?.[m] || 0;
        const c = row.getCell(m + 2);
        c.value = Number(val);
        c.numFmt = '$ #,##0;($ #,##0);"-"';
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      const cTot = row.getCell(14);
      cTot.value = Number(fila.totalAnual || 0);
      cTot.numFmt = '$ #,##0;($ #,##0);"-"';
      cTot.alignment = { vertical: 'middle', horizontal: 'right' };
      cTot.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };

      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      this.estilizarFilaNivelJerarquico(row, totalCols, 0, bg, false);
      currentRow++;
    });

    this.ajustarAnchosTablero(
      worksheet,
      [34, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 18],
      filaHeader,
      currentRow - 1
    );
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      filename || this.generarNombreArchivoTablero(`Matriz_Cobranzas_${matriz.anioSeleccionado || ''}`)
    );
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 5: MOTIVOS DE DÉBITO Y REFACTURACIÓN
  // ---------------------------------------------------------------------------
  async exportarMotivosDebito(
    motivos: DirectorioMotivoDebito[],
    kpis: {
      totalDebitado: number;
      totalCasos: number;
      debitoAceptado: number;
      tasaPerdida: number;
      totalRefacturado: number;
      tasaRecupero: number;
      diferencia: number;
      tasaDiferencia: number;
      motivosIdentificados: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!motivos || motivos.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Motivos de Débito');
    const totalCols = 9;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Motivos Identificados: ${kpis.motivosIdentificados}  |  Casos Afectados: ${kpis.totalCasos}`
    );

    const filaHeader = currentRow;
    const headers = [
      'MOTIVO / CAUSA DE RECHAZO',
      'CASOS',
      'MONTO DEBITADO ($)',
      '% PARTICIPACIÓN',
      'DÉBITOS ACEPTADOS ($)',
      '% ACEPTADOS',
      'REFACTURADOS ($)',
      '% REFACTURADOS',
      'DIFERENCIA ($)'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${motivos.length} Motivos)`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    totalRow.getCell(2).value = Number(kpis.totalCasos || 0);
    totalRow.getCell(2).numFmt = '#,##0';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(3).value = Number(kpis.totalDebitado || 0);
    totalRow.getCell(3).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(4).value = 1;
    totalRow.getCell(4).numFmt = '0.0%';
    totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(5).value = Number(kpis.debitoAceptado || 0);
    totalRow.getCell(5).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(6).value = Number(kpis.tasaPerdida || 0) / 100;
    totalRow.getCell(6).numFmt = '0.0%';
    totalRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(7).value = Number(kpis.totalRefacturado || 0);
    totalRow.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(8).value = Number(kpis.tasaRecupero || 0) / 100;
    totalRow.getCell(8).numFmt = '0.0%';
    totalRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(9).value = Number(kpis.diferencia || 0);
    totalRow.getCell(9).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };

    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    motivos.forEach((m, idx) => {
      const row = worksheet.getRow(currentRow);
      const montoTot = Number(m.montoTotal || 0);
      const aceptado = Number(m.montoAceptado ?? 0);
      const refacturado = Number(m.montoRefacturado ?? 0);
      const diferencia = Math.max(0, montoTot - (aceptado + refacturado));

      row.getCell(1).value = m.motivo || 'Sin motivo especificado';
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(2).value = Number(m.cantidadCasos || 0);
      row.getCell(2).numFmt = '#,##0';
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(3).value = montoTot;
      row.getCell(3).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(4).value = Number(m.porcentaje || 0) / 100;
      row.getCell(4).numFmt = '0.0%';
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(5).value = aceptado;
      row.getCell(5).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(6).value = Number(m.porcentajeAceptados ?? 0) / 100;
      row.getCell(6).numFmt = '0.0%';
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(7).value = refacturado;
      row.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(8).value = Number(m.porcentajeRefacturados ?? 0) / 100;
      row.getCell(8).numFmt = '0.0%';
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(9).value = diferencia;
      row.getCell(9).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };

      const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      this.estilizarFilaNivelJerarquico(row, totalCols, 0, bg, false);
      currentRow++;
    });

    this.ajustarAnchosTablero(
      worksheet,
      [38, 12, 20, 16, 20, 15, 20, 16, 18],
      filaHeader,
      currentRow - 1
    );
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Motivos_Debito'));
  }

  // ---------------------------------------------------------------------------
  // DETALLE POR MOTIVO DE DÉBITO (DRILL-DOWN)
  // ---------------------------------------------------------------------------
  async exportarDetalleMotivo(
    prestaciones: DirectorioPrestacionDetalle[],
    kpis: {
      motivo: string;
      totalDebitado: number;
      totalCasos: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!prestaciones || prestaciones.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detalle de Prestaciones');
    const totalCols = 12;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Motivo: ${kpis.motivo || 'Sin especificar'}  |  Prestaciones: ${prestaciones.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'COMPROBANTE NC',
      'FECHA',
      'PACIENTE',
      'CARNET',
      'PLAN',
      'MÉDICO / EFECTOR',
      'CÓDIGO',
      'PRESTACIÓN MÉDICA',
      'MOTIVO DE DÉBITO',
      'COMENTARIOS DEL OPERADOR',
      'IMPORTE DEBITADO ($)',
      'DÉBITO ACEPTADO'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${prestaciones.length} Prestaciones)`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    for (let c = 2; c <= 10; c++) {
      totalRow.getCell(c).value = '—';
      totalRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    }

    const sumaTotalDebitado = prestaciones.reduce((acc, p) => acc + (p.importeDebitado || 0), 0);
    totalRow.getCell(11).value = Number(sumaTotalDebitado || 0);
    totalRow.getCell(11).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(11).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(12).value = '—';
    totalRow.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' };

    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    // Filas de Datos
    prestaciones.forEach((p, idx) => {
      const row = worksheet.getRow(currentRow);
      row.height = 20;

      // 1. Comprobante NC
      const compStr = `${p.tipoDoc || 'NC'} ${p.letraDoc ? p.letraDoc.trim() + ' ' : ''}${String(p.ptovtaDoc || 0).padStart(4, '0')}-${String(p.numeroDoc || 0).padStart(8, '0')}`.trim();
      row.getCell(1).value = compStr;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      // 2. Fecha (dd/MM/yyyy)
      const fechaVal = p.fechaPrestacion || p.fechaDoc || '';
      row.getCell(2).value = this.formatearFecha(fechaVal);
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      // 3. Paciente
      row.getCell(3).value = p.paciente || 'S/D';
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

      // 4. Carnet
      row.getCell(4).value = p.carnet || 'Sin Carnet';
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

      // 5. Plan
      row.getCell(5).value = p.plan || 'General';
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

      // 6. Médico / Efector
      row.getCell(6).value = p.medico || p.efector || 'Efector S/D';
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

      // 7. Código
      row.getCell(7).value = p.codigo || '';
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

      // 8. Prestación Médica
      row.getCell(8).value = p.descripcion || '';
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'left' };

      // 9. Motivo de Débito
      row.getCell(9).value = p.motivoDebito || '';
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'left' };

      // 10. Comentarios del Operador
      row.getCell(10).value = p.comentariosDebito || 'Sin observaciones registradas';
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'left' };

      // 11. Importe Debitado ($)
      row.getCell(11).value = Number(p.importeDebitado || 0);
      row.getCell(11).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'right' };

      // 12. Débito Aceptado
      row.getCell(12).value = p.debitoAceptado === true ? 'SÍ (Pérdida)' : 'NO (Refacturable)';
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' };

      // Estilizar bordes y colores alternados
      const bgArgb = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      for (let col = 1; col <= totalCols; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }

      currentRow++;
    });

    const minWidths = [18, 12, 26, 16, 14, 24, 12, 34, 28, 36, 18, 18];
    this.ajustarAnchosTablero(worksheet, minWidths, filaHeader, currentRow - 1);

    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Detalle_Motivo'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 6: ANALISTA DE DÉBITO (3 Niveles con outlineLevel)
  // ---------------------------------------------------------------------------
  async exportarAnalistasDebito(
    analistas: MetricaAnalistaDTO[],
    totales: {
      financiadores: number;
      casos: number;
      montoDebitado: number;
      aceptados: number;
      refacturados: number;
      diferencia: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!analistas || analistas.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analistas de Débito');
    this.configurarHojaJerarquica(worksheet);
    const totalCols = 10;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Analistas Exportados: ${analistas.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'ANALISTA / MOTIVO / FINANCIADOR',
      'FINANCIADORES',
      'DOCUMENTOS / CASOS',
      'MONTO DEBITADO ($)',
      'DÉBITOS ACEPTADOS ($)',
      'REFACTURADOS ($)',
      'DIFERENCIA ($)',
      'TICKET PROMEDIO',
      'ATENCIÓN (AMB / INT)',
      '% RECUPERO'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL (con Ticket Promedio, Atención y % Recupero vacíos como en UI)
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${analistas.length} ${analistas.length === 1 ? 'Analista' : 'Analistas'})`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    totalRow.getCell(2).value = Number(totales.financiadores || 0);
    totalRow.getCell(2).numFmt = '#,##0';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    totalRow.getCell(3).value = Number(totales.casos || 0);
    totalRow.getCell(3).numFmt = '#,##0';
    totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    const montosTot = [
      totales.montoDebitado || 0,
      totales.aceptados || 0,
      totales.refacturados || 0,
      totales.diferencia || 0
    ];
    montosTot.forEach((m, idx) => {
      const c = totalRow.getCell(idx + 4);
      c.value = Number(m);
      c.numFmt = '$ #,##0;($ #,##0);$ 0';
      c.alignment = { vertical: 'middle', horizontal: 'right' };
    });
    totalRow.getCell(8).value = '';
    totalRow.getCell(9).value = '';
    totalRow.getCell(10).value = '';
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    analistas.forEach((a) => {
      // NIVEL 0: Analista
      const rowA = worksheet.getRow(currentRow);
      const montoA = a.totalTramitado || ((a.debitosAceptados || 0) + (a.debitosRefacturados || 0));
      const difA = a.diferencia != null ? a.diferencia : Math.max(0, montoA - ((a.debitosAceptados || 0) + (a.debitosRefacturados || 0)));

      rowA.getCell(1).value = a.analista || 'Sin analista';
      rowA.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      rowA.getCell(2).value = Number(a.cantidadFinanciadores || 0);
      rowA.getCell(2).numFmt = '#,##0';
      rowA.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      rowA.getCell(3).value = Number(a.cantidadRegistros || 0);
      rowA.getCell(3).numFmt = '#,##0';
      rowA.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

      [montoA, a.debitosAceptados || 0, a.debitosRefacturados || 0, difA, a.ticketPromedio || 0].forEach((val, idx) => {
        const c = rowA.getCell(idx + 4);
        c.value = Number(val);
        c.numFmt = '$ #,##0;($ #,##0);$ 0';
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      rowA.getCell(9).value = a.distribucionAtencion || '100% Amb / 0% Int';
      rowA.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

      rowA.getCell(10).value = Number(a.tasaRecupero || 0) / 100;
      rowA.getCell(10).numFmt = '0.0%';
      rowA.getCell(10).alignment = { vertical: 'middle', horizontal: 'right' };

      this.estilizarFilaNivelJerarquico(rowA, totalCols, 0, 'FFEFF6FF', true, 'FF0F172A');
      currentRow++;

      // NIVEL 1: Motivos
      (a.motivos || []).forEach((m) => {
        const rowM = worksheet.getRow(currentRow);
        const montoM = m.montoDebitado || 0;
        const aceptadoM = m.aceptado || 0;
        const refactM = m.refacturado || 0;
        const difM = m.diferencia != null ? m.diferencia : Math.max(0, montoM - (aceptadoM + refactM));
        const ticketM = m.casos > 0 ? montoM / m.casos : 0;
        const recM = montoM > 0 ? (refactM * 100) / montoM : 0;

        rowM.getCell(1).value = `   ${m.motivo || 'Sin motivo'}`;
        rowM.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        rowM.getCell(2).value = Number(m.financiadores?.length || 0);
        rowM.getCell(2).numFmt = '#,##0';
        rowM.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

        rowM.getCell(3).value = Number(m.casos || 0);
        rowM.getCell(3).numFmt = '#,##0';
        rowM.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

        [montoM, aceptadoM, refactM, difM, ticketM].forEach((val, idx) => {
          const c = rowM.getCell(idx + 4);
          c.value = Number(val);
          c.numFmt = '$ #,##0;($ #,##0);$ 0';
          c.alignment = { vertical: 'middle', horizontal: 'right' };
        });

        rowM.getCell(9).value = m.distribucionAtencion || '—';
        rowM.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

        rowM.getCell(10).value = Number(recM) / 100;
        rowM.getCell(10).numFmt = '0.0%';
        rowM.getCell(10).alignment = { vertical: 'middle', horizontal: 'right' };

        this.estilizarFilaNivelJerarquico(rowM, totalCols, 1, 'FFF8FAFC', true, 'FF1E293B');
        currentRow++;

        // NIVEL 2: Financiadores
        (m.financiadores || []).forEach((fin) => {
          const rowF = worksheet.getRow(currentRow);
          const montoF = (fin.montoDebitado != null ? fin.montoDebitado : fin.monto) || 0;
          const aceptadoF = fin.aceptado || 0;
          const refactF = fin.refacturado || 0;
          const difF = fin.diferencia != null ? fin.diferencia : Math.max(0, montoF - (aceptadoF + refactF));
          const ticketF = fin.casos > 0 ? montoF / fin.casos : 0;
          const recF = montoF > 0 ? (refactF * 100) / montoF : 0;

          rowF.getCell(1).value = `      └─ ${fin.financiador || 'Sin financiador'}`;
          rowF.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };

          rowF.getCell(2).value = '—';
          rowF.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

          rowF.getCell(3).value = Number(fin.casos || 0);
          rowF.getCell(3).numFmt = '#,##0';
          rowF.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

          [montoF, aceptadoF, refactF, difF, ticketF].forEach((val, idx) => {
            const c = rowF.getCell(idx + 4);
            c.value = Number(val);
            c.numFmt = '$ #,##0;($ #,##0);$ 0';
            c.alignment = { vertical: 'middle', horizontal: 'right' };
          });

          rowF.getCell(9).value = fin.distribucionAtencion || '—';
          rowF.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

          rowF.getCell(10).value = Number(recF) / 100;
          rowF.getCell(10).numFmt = '0.0%';
          rowF.getCell(10).alignment = { vertical: 'middle', horizontal: 'right' };

          this.estilizarFilaNivelJerarquico(rowF, totalCols, 2, 'FFFFFFFF', false, 'FF334155');
          currentRow++;
        });
      });
    });

    this.ajustarAnchosTablero(
      worksheet,
      [40, 15, 18, 20, 20, 20, 18, 18, 22, 15],
      filaHeader,
      currentRow - 1
    );
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Analistas_Debito'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 7: BUCLES DE INSISTENCIA (3 Niveles con outlineLevel)
  // ---------------------------------------------------------------------------
  async exportarBuclesInsistencia(
    bucles: CadenaTrazabilidadDTO[],
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!bucles || bucles.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bucles de Insistencia');
    this.configurarHojaJerarquica(worksheet);
    const totalCols = 8;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Facturas con Bucle: ${bucles.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'FACTURA / PRESTACIÓN / COMPROBANTE',
      'NIVEL / TIPO',
      'FECHA',
      'DESCRIPCIÓN / PACIENTE',
      'FINANCIADOR',
      'MÉDICO / RESPONSABLE',
      'FACTURADO / MONTO ($)',
      'DÉBITOS ($)'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL
    let sumaFacturado = 0;
    let sumaDebitos = 0;
    bucles.forEach((b) => {
      sumaFacturado += b.montoFacturadoOriginal || 0;
      sumaDebitos += b.totalDebitado || 0;
    });

    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${bucles.length} Facturas con Bucle)`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    for (let c = 2; c <= 6; c++) {
      totalRow.getCell(c).value = '—';
      totalRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    }
    totalRow.getCell(7).value = Number(sumaFacturado);
    totalRow.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(8).value = Number(sumaDebitos);
    totalRow.getCell(8).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    bucles.forEach((cadena) => {
      // NIVEL 0: Factura Madre
      const rowCad = worksheet.getRow(currentRow);
      rowCad.getCell(1).value = cadena.idPrestacion || 'Sin comprobante';
      rowCad.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(2).value = 'FACTURA';
      rowCad.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      rowCad.getCell(3).value = this.formatearFecha(cadena.fechaFactura || '');
      rowCad.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

      rowCad.getCell(4).value = cadena.descripcion || '';
      rowCad.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(5).value = cadena.financiador || '';
      rowCad.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(6).value = cadena.medico || 'No especificado';
      rowCad.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(7).value = Number(cadena.montoFacturadoOriginal || 0);
      rowCad.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      rowCad.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

      rowCad.getCell(8).value = Number(cadena.totalDebitado || 0);
      rowCad.getCell(8).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      rowCad.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

      this.estilizarFilaNivelJerarquico(rowCad, totalCols, 0, 'FFEFF6FF', true, 'FF0F172A');
      currentRow++;

      if (cadena.prestaciones && cadena.prestaciones.length > 0) {
        // NIVEL 1: Prestaciones con bucle
        cadena.prestaciones.forEach((prest) => {
          const rowP = worksheet.getRow(currentRow);
          const codStr = prest.codigo ? `[${prest.codigo}] ` : '';
          rowP.getCell(1).value = `   ${codStr}${prest.descripcion || 'Prestación'}`;
          rowP.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

          rowP.getCell(2).value = prest.cantidadRefacturaciones
            ? `${prest.cantidadRefacturaciones} Refact. (ND)`
            : 'PRESTACIÓN';
          rowP.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

          rowP.getCell(3).value = '—';
          rowP.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

          const pacStr = prest.paciente
            ? `Paciente: ${prest.paciente}${prest.carnet ? ' (' + prest.carnet + ')' : ''}`
            : (prest.descripcion || '');
          rowP.getCell(4).value = pacStr;
          rowP.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

          rowP.getCell(5).value = cadena.financiador || '';
          rowP.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

          rowP.getCell(6).value = prest.medico || cadena.medico || 'No especificado';
          rowP.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

          rowP.getCell(7).value = Number(prest.montoFacturadoOriginal || 0);
          rowP.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
          rowP.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

          rowP.getCell(8).value = Number(prest.totalDebitado || 0);
          rowP.getCell(8).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
          rowP.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

          this.estilizarFilaNivelJerarquico(rowP, totalCols, 1, 'FFF8FAFC', true, 'FF1E293B');
          currentRow++;

          // NIVEL 2: Eventos de la prestación
          (prest.historialEventos || []).forEach((ev) => {
            const rowEv = worksheet.getRow(currentRow);
            rowEv.getCell(1).value = `      └─ ${ev.comprobante || ''}`;
            rowEv.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };

            rowEv.getCell(2).value = ev.tipo || '';
            rowEv.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

            rowEv.getCell(3).value = this.formatearFecha(ev.fecha || '');
            rowEv.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

            rowEv.getCell(4).value = ev.descripcion || '';
            rowEv.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

            rowEv.getCell(5).value = cadena.financiador || '';
            rowEv.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

            rowEv.getCell(6).value = ev.responsable || '—';
            rowEv.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

            rowEv.getCell(7).value = Number(ev.monto || 0);
            rowEv.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
            rowEv.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

            rowEv.getCell(8).value = '—';
            rowEv.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

            this.estilizarFilaNivelJerarquico(rowEv, totalCols, 2, 'FFFFFFFF', false, 'FF334155');
            currentRow++;
          });
        });
      } else {
        // Fallback: eventos directos sobre la cadena (Nivel 1)
        (cadena.historialEventos || []).forEach((ev) => {
          const rowEv = worksheet.getRow(currentRow);
          rowEv.getCell(1).value = `   └─ ${ev.comprobante || ''}`;
          rowEv.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

          rowEv.getCell(2).value = ev.tipo || '';
          rowEv.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

          rowEv.getCell(3).value = this.formatearFecha(ev.fecha || '');
          rowEv.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

          rowEv.getCell(4).value = ev.descripcion || '';
          rowEv.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

          rowEv.getCell(5).value = cadena.financiador || '';
          rowEv.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

          rowEv.getCell(6).value = ev.responsable || '—';
          rowEv.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

          rowEv.getCell(7).value = Number(ev.monto || 0);
          rowEv.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
          rowEv.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

          rowEv.getCell(8).value = '—';
          rowEv.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

          this.estilizarFilaNivelJerarquico(rowEv, totalCols, 1, 'FFFFFFFF', false, 'FF334155');
          currentRow++;
        });
      }
    });

    this.ajustarAnchosTablero(worksheet, [36, 16, 14, 38, 28, 24, 20, 20], filaHeader, currentRow - 1);
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Bucles_Insistencia'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 8: USUARIO DE CARGA / OPERADORES (3 Niveles con outlineLevel)
  // ---------------------------------------------------------------------------
  async exportarUsuariosCarga(
    operadores: MetricaOperadorDTO[],
    totales: {
      casos: number;
      montoDebitado: number;
      aceptados: number;
      refacturados: number;
      diferencia: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!operadores || operadores.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios de Carga');
    this.configurarHojaJerarquica(worksheet);
    const totalCols = 8;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Operadores Exportados: ${operadores.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'OPERADOR / MOTIVO / FINANCIADOR',
      'DOCUMENTOS / CASOS',
      'MONTO DEBITADO ($)',
      'DÉBITOS ACEPTADOS ($)',
      'REFACTURADOS ($)',
      'DIFERENCIA ($)',
      'TICKET PROMEDIO',
      '% RECUPERO'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL (con Ticket Promedio y % Recupero vacíos como fue solicitado en UI)
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${operadores.length} ${operadores.length === 1 ? 'Operador' : 'Operadores'})`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    totalRow.getCell(2).value = Number(totales.casos || 0);
    totalRow.getCell(2).numFmt = '#,##0';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

    [
      totales.montoDebitado || 0,
      totales.aceptados || 0,
      totales.refacturados || 0,
      totales.diferencia || 0
    ].forEach((m, idx) => {
      const c = totalRow.getCell(idx + 3);
      c.value = Number(m);
      c.numFmt = '$ #,##0;($ #,##0);$ 0';
      c.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    totalRow.getCell(7).value = '';
    totalRow.getCell(8).value = '';
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    operadores.forEach((op) => {
      // NIVEL 0: Operador
      const rowOp = worksheet.getRow(currentRow);
      const montoOp = op.totalTramitado || ((op.debitosAceptados || 0) + (op.debitosRefacturados || 0));
      const difOp = op.diferencia != null ? op.diferencia : Math.max(0, montoOp - ((op.debitosAceptados || 0) + (op.debitosRefacturados || 0)));

      rowOp.getCell(1).value = `${op.operador || 'Sin operador'} (${op.motivos?.length || 0} motivos)`;
      rowOp.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      rowOp.getCell(2).value = Number(op.cantidadRegistros || 0);
      rowOp.getCell(2).numFmt = '#,##0';
      rowOp.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

      [montoOp, op.debitosAceptados || 0, op.debitosRefacturados || 0, difOp, op.ticketPromedio || 0].forEach((val, idx) => {
        const c = rowOp.getCell(idx + 3);
        c.value = Number(val);
        c.numFmt = '$ #,##0;($ #,##0);$ 0';
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      rowOp.getCell(8).value = Number(op.tasaRecupero || 0) / 100;
      rowOp.getCell(8).numFmt = '0.0%';
      rowOp.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

      this.estilizarFilaNivelJerarquico(rowOp, totalCols, 0, 'FFEFF6FF', true, 'FF0F172A');
      currentRow++;

      // NIVEL 1: Motivos
      (op.motivos || []).forEach((m) => {
        const rowM = worksheet.getRow(currentRow);
        const montoM = m.montoDebitado || 0;
        const aceptadoM = m.aceptado || 0;
        const refactM = m.refacturado || 0;
        const difM = m.diferencia != null ? m.diferencia : Math.max(0, montoM - (aceptadoM + refactM));
        const ticketM = m.casos > 0 ? montoM / m.casos : 0;
        const recM = montoM > 0 ? (refactM * 100) / montoM : 0;

        rowM.getCell(1).value = `   ${m.motivo || 'Sin motivo'} (${m.financiadores?.length || 0} financiadores)`;
        rowM.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        rowM.getCell(2).value = Number(m.casos || 0);
        rowM.getCell(2).numFmt = '#,##0';
        rowM.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

        [montoM, aceptadoM, refactM, difM, ticketM].forEach((val, idx) => {
          const c = rowM.getCell(idx + 3);
          c.value = Number(val);
          c.numFmt = '$ #,##0;($ #,##0);$ 0';
          c.alignment = { vertical: 'middle', horizontal: 'right' };
        });

        rowM.getCell(8).value = Number(recM) / 100;
        rowM.getCell(8).numFmt = '0.0%';
        rowM.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

        this.estilizarFilaNivelJerarquico(rowM, totalCols, 1, 'FFF8FAFC', true, 'FF1E293B');
        currentRow++;

        // NIVEL 2: Financiadores
        (m.financiadores || []).forEach((fin) => {
          const rowF = worksheet.getRow(currentRow);
          const montoF = (fin.montoDebitado != null ? fin.montoDebitado : fin.monto) || 0;
          const aceptadoF = fin.aceptado || 0;
          const refactF = fin.refacturado || 0;
          const difF = fin.diferencia != null ? fin.diferencia : Math.max(0, montoF - (aceptadoF + refactF));
          const ticketF = fin.casos > 0 ? montoF / fin.casos : 0;
          const recF = montoF > 0 ? (refactF * 100) / montoF : 0;

          rowF.getCell(1).value = `      └─ ${fin.financiador || 'Sin financiador'}`;
          rowF.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };

          rowF.getCell(2).value = Number(fin.casos || 0);
          rowF.getCell(2).numFmt = '#,##0';
          rowF.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

          [montoF, aceptadoF, refactF, difF, ticketF].forEach((val, idx) => {
            const c = rowF.getCell(idx + 3);
            c.value = Number(val);
            c.numFmt = '$ #,##0;($ #,##0);$ 0';
            c.alignment = { vertical: 'middle', horizontal: 'right' };
          });

          rowF.getCell(8).value = Number(recF) / 100;
          rowF.getCell(8).numFmt = '0.0%';
          rowF.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

          this.estilizarFilaNivelJerarquico(rowF, totalCols, 2, 'FFFFFFFF', false, 'FF334155');
          currentRow++;
        });
      });
    });

    this.ajustarAnchosTablero(
      worksheet,
      [42, 18, 20, 20, 20, 18, 18, 15],
      filaHeader,
      currentRow - 1
    );
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Usuarios_Carga'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 9: PRESTADORES / MÉDICOS (3 Niveles con outlineLevel)
  // ---------------------------------------------------------------------------
  async exportarPrestadoresMedicos(
    medicos: MetricaMedicoDTO[],
    totales: {
      motivos: number;
      casos: number;
      montoDebitado: number;
      aceptados: number;
      refacturados: number;
      diferencia: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!medicos || medicos.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prestadores Médicos');
    this.configurarHojaJerarquica(worksheet);
    const totalCols = 9;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Médicos Exportados: ${medicos.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'MÉDICO / MOTIVO / FINANCIADOR',
      'CANT. MOTIVOS / FIN.',
      'DOCUMENTOS / CASOS',
      'MONTO DEBITADO ($)',
      'ACEPTADOS (PÉRDIDA)',
      'REFACTURADOS ($)',
      'DIFERENCIA ($)',
      'TICKET PROMEDIO',
      '% RECUPERO'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL (con Ticket Promedio y % Recupero vacíos)
    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${medicos.length} ${medicos.length === 1 ? 'médico' : 'médicos'})`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    totalRow.getCell(2).value = Number(totales.motivos || 0);
    totalRow.getCell(2).numFmt = '#,##0';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    totalRow.getCell(3).value = Number(totales.casos || 0);
    totalRow.getCell(3).numFmt = '#,##0';
    totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

    [
      totales.montoDebitado || 0,
      totales.aceptados || 0,
      totales.refacturados || 0,
      totales.diferencia || 0
    ].forEach((m, idx) => {
      const c = totalRow.getCell(idx + 4);
      c.value = Number(m);
      c.numFmt = '$ #,##0;($ #,##0);$ 0';
      c.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    totalRow.getCell(8).value = '';
    totalRow.getCell(9).value = '';
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    medicos.forEach((med) => {
      // NIVEL 0: Médico
      const rowMed = worksheet.getRow(currentRow);
      const montoMed = med.totalTramitado || ((med.debitosAceptados || 0) + (med.debitosRefacturados || 0));
      const difMed = med.diferencia != null ? med.diferencia : Math.max(0, montoMed - ((med.debitosAceptados || 0) + (med.debitosRefacturados || 0)));

      rowMed.getCell(1).value = med.medico || 'Médico no especificado';
      rowMed.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      rowMed.getCell(2).value = Number(med.motivos?.length || 0);
      rowMed.getCell(2).numFmt = '#,##0';
      rowMed.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      rowMed.getCell(3).value = Number(med.cantidadRegistros || 0);
      rowMed.getCell(3).numFmt = '#,##0';
      rowMed.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

      [montoMed, med.debitosAceptados || 0, med.debitosRefacturados || 0, difMed, med.ticketPromedio || 0].forEach((val, idx) => {
        const c = rowMed.getCell(idx + 4);
        c.value = Number(val);
        c.numFmt = '$ #,##0;($ #,##0);$ 0';
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      });

      rowMed.getCell(9).value = Number(med.tasaRecupero || 0) / 100;
      rowMed.getCell(9).numFmt = '0.0%';
      rowMed.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };

      this.estilizarFilaNivelJerarquico(rowMed, totalCols, 0, 'FFEFF6FF', true, 'FF0F172A');
      currentRow++;

      // NIVEL 1: Motivos
      (med.motivos || []).forEach((m) => {
        const rowM = worksheet.getRow(currentRow);
        const montoM = m.montoDebitado || 0;
        const aceptadoM = m.aceptado || 0;
        const refactM = m.refacturado || 0;
        const difM = m.diferencia != null ? m.diferencia : Math.max(0, montoM - (aceptadoM + refactM));
        const ticketM = m.casos > 0 ? montoM / m.casos : 0;
        const recM = montoM > 0 ? (refactM * 100) / montoM : 0;

        rowM.getCell(1).value = `   ${m.motivo || 'Sin motivo'}`;
        rowM.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        rowM.getCell(2).value = Number(m.financiadores?.length || 0);
        rowM.getCell(2).numFmt = '#,##0';
        rowM.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

        rowM.getCell(3).value = Number(m.casos || 0);
        rowM.getCell(3).numFmt = '#,##0';
        rowM.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

        [montoM, aceptadoM, refactM, difM, ticketM].forEach((val, idx) => {
          const c = rowM.getCell(idx + 4);
          c.value = Number(val);
          c.numFmt = '$ #,##0;($ #,##0);$ 0';
          c.alignment = { vertical: 'middle', horizontal: 'right' };
        });

        rowM.getCell(9).value = Number(recM) / 100;
        rowM.getCell(9).numFmt = '0.0%';
        rowM.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };

        this.estilizarFilaNivelJerarquico(rowM, totalCols, 1, 'FFF8FAFC', true, 'FF1E293B');
        currentRow++;

        // NIVEL 2: Financiadores
        (m.financiadores || []).forEach((fin) => {
          const rowF = worksheet.getRow(currentRow);
          const montoF = (fin.montoDebitado != null ? fin.montoDebitado : fin.monto) || 0;
          const aceptadoF = fin.aceptado || 0;
          const refactF = fin.refacturado || 0;
          const difF = fin.diferencia != null ? fin.diferencia : Math.max(0, montoF - (aceptadoF + refactF));
          const ticketF = fin.casos > 0 ? montoF / fin.casos : 0;
          const recF = montoF > 0 ? (refactF * 100) / montoF : 0;

          rowF.getCell(1).value = `      └─ ${fin.financiador || 'Sin financiador'}`;
          rowF.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };

          rowF.getCell(2).value = '—';
          rowF.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

          rowF.getCell(3).value = Number(fin.casos || 0);
          rowF.getCell(3).numFmt = '#,##0';
          rowF.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };

          [montoF, aceptadoF, refactF, difF, ticketF].forEach((val, idx) => {
            const c = rowF.getCell(idx + 4);
            c.value = Number(val);
            c.numFmt = '$ #,##0;($ #,##0);$ 0';
            c.alignment = { vertical: 'middle', horizontal: 'right' };
          });

          rowF.getCell(9).value = Number(recF) / 100;
          rowF.getCell(9).numFmt = '0.0%';
          rowF.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };

          this.estilizarFilaNivelJerarquico(rowF, totalCols, 2, 'FFFFFFFF', false, 'FF334155');
          currentRow++;
        });
      });
    });

    this.ajustarAnchosTablero(
      worksheet,
      [42, 18, 18, 20, 20, 20, 18, 18, 15],
      filaHeader,
      currentRow - 1
    );
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Prestadores_Medicos'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 10: DETALLE Y TRAZABILIDAD (ÁRBOL ENCADENADO con outlineLevel)
  // ---------------------------------------------------------------------------
  async exportarTrazabilidad(
    cadenas: CadenaTrazabilidadDTO[],
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!cadenas || cadenas.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detalle y Trazabilidad');
    this.configurarHojaJerarquica(worksheet);
    const totalCols = 8;

    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      `Expedientes Exportados: ${cadenas.length}`
    );

    const filaHeader = currentRow;
    const headers = [
      'EXPEDIENTE / COMPROBANTE',
      'TIPO',
      'FECHA',
      'PRESTACIÓN / DETALLE',
      'FINANCIADOR',
      'MÉDICO / RESPONSABLE',
      'FACTURADO / MONTO ($)',
      'DÉBITOS ($)'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers);
    currentRow++;

    // Fila TOTAL GENERAL
    let sumaFacturado = 0;
    let sumaDebitos = 0;
    cadenas.forEach((c) => {
      sumaFacturado += c.montoFacturadoOriginal || 0;
      sumaDebitos += c.totalDebitado || 0;
    });

    const totalRow = worksheet.getRow(currentRow);
    totalRow.getCell(1).value = `TOTAL GENERAL (${cadenas.length} Expedientes)`;
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    for (let c = 2; c <= 6; c++) {
      totalRow.getCell(c).value = '—';
      totalRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    }
    totalRow.getCell(7).value = Number(sumaFacturado);
    totalRow.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

    totalRow.getCell(8).value = Number(sumaDebitos);
    totalRow.getCell(8).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
    totalRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
    this.estilizarFilaTotalTablero(totalRow, totalCols);
    currentRow++;

    cadenas.forEach((cadena) => {
      // NIVEL 0: Expediente / Factura Madre
      const rowCad = worksheet.getRow(currentRow);
      rowCad.getCell(1).value = cadena.idPrestacion || 'Sin comprobante';
      rowCad.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(2).value = 'EXPEDIENTE';
      rowCad.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      const fechaRaiz = cadena.fechaFactura || (cadena.historialEventos?.[0]?.fecha ?? '');
      rowCad.getCell(3).value = this.formatearFecha(fechaRaiz);
      rowCad.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

      rowCad.getCell(4).value = cadena.descripcion || '';
      rowCad.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(5).value = cadena.financiador || '';
      rowCad.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(6).value = cadena.medico || 'No especificado';
      rowCad.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

      rowCad.getCell(7).value = Number(cadena.montoFacturadoOriginal || 0);
      rowCad.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      rowCad.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

      if (cadena.totalDebitado && cadena.totalDebitado > 0) {
        rowCad.getCell(8).value = Number(cadena.totalDebitado);
        rowCad.getCell(8).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
      } else {
        rowCad.getCell(8).value = '—';
      }
      rowCad.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

      this.estilizarFilaNivelJerarquico(rowCad, totalCols, 0, 'FFEFF6FF', true, 'FF0F172A');
      currentRow++;

      // NIVEL 1: Eventos cronológicos de la cadena
      (cadena.historialEventos || []).forEach((ev) => {
        const rowEv = worksheet.getRow(currentRow);
        rowEv.getCell(1).value = `   └─ ${ev.comprobante || ''}`;
        rowEv.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        rowEv.getCell(2).value = ev.tipo || '';
        rowEv.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

        rowEv.getCell(3).value = this.formatearFecha(ev.fecha || '');
        rowEv.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

        rowEv.getCell(4).value = ev.descripcion || '';
        rowEv.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

        rowEv.getCell(5).value = cadena.financiador || '';
        rowEv.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

        rowEv.getCell(6).value = ev.responsable || '—';
        rowEv.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

        rowEv.getCell(7).value = Number(ev.monto || 0);
        rowEv.getCell(7).numFmt = '$ #,##0.00;($ #,##0.00);$ 0.00';
        rowEv.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };

        rowEv.getCell(8).value = '—';
        rowEv.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

        this.estilizarFilaNivelJerarquico(rowEv, totalCols, 1, 'FFFFFFFF', false, 'FF334155');
        currentRow++;
      });
    });

    this.ajustarAnchosTablero(worksheet, [34, 15, 14, 40, 28, 24, 20, 20], filaHeader, currentRow - 1);
    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow - 1, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Detalle_Trazabilidad'));
  }

  // ---------------------------------------------------------------------------
  // SOLAPA 11: PRESTACIONES FACTURADAS
  // ---------------------------------------------------------------------------
  async exportarPrestacionesFacturadas(
    items: DirectorioPrestacionItem[],
    kpis: {
      totalRegistros?: number;
      totalMonto?: number;
      cantidadMedicos?: number;
      cantidadPacientes?: number;
      totalFacturado?: number;
      cantidadPrestaciones?: number;
      totalMedicos?: number;
      totalPacientes?: number;
    },
    contexto: ContextoFiltroExportacion,
    filename?: string
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prestaciones Facturadas');

    const totalCols = 13;
    let currentRow = this.escribirEncabezadoTablero(
      worksheet,
      totalCols,
      contexto,
      'Listado de prestaciones facturadas en Factura Madre'
    );

    // Fila resumen / KPIs
    const totalReg = kpis.totalRegistros ?? kpis.cantidadPrestaciones ?? items.length;
    const totalMto = kpis.totalMonto ?? kpis.totalFacturado ?? items.reduce((acc, it) => acc + (it.importeTotal || 0), 0);
    const cantMed = kpis.cantidadMedicos ?? kpis.totalMedicos ?? 0;
    const cantPac = kpis.cantidadPacientes ?? kpis.totalPacientes ?? 0;

    worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
    const kpiCell = worksheet.getCell(`A${currentRow}`);
    kpiCell.value = `TOTAL FACTURADO: $ ${totalMto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}   |   CANTIDAD PRESTACIONES: ${totalReg.toLocaleString('es-AR')}   |   MÉDICOS: ${cantMed}   |   PACIENTES: ${cantPac}`;
    kpiCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    kpiCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    kpiCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(currentRow).height = 24;
    currentRow += 2;

    const filaHeader = currentRow;
    const headers = [
      'COMPROBANTE FC',
      'FECHA PRESTACIÓN',
      'PACIENTE',
      'CARNET',
      'INSTITUCIÓN / COBERTURA',
      'PLAN',
      'CÓDIGO',
      'PRESTACIÓN',
      'ESPECIALIDAD',
      'CANTIDAD',
      'IMPORTE TOTAL',
      'MÉDICO / PRESTADOR',
      'TIPO ATENCIÓN'
    ];
    this.estilizarCabeceraTabla(worksheet.getRow(currentRow), headers, 'FF1E3A8A');
    currentRow++;

    let sumaCantidad = 0;
    let sumaImporte = 0;

    items.forEach((p, index) => {
      const row = worksheet.getRow(currentRow);
      row.height = 20;

      // 1. Comprobante FC
      const compStr = p.letraDoc && p.ptovtaDoc != null && p.numeroDoc != null
        ? `${p.tipoDoc || 'FAC'} ${p.letraDoc} ${String(p.ptovtaDoc).padStart(4, '0')}-${String(p.numeroDoc).padStart(8, '0')}`
        : (p.numeroDoc ? String(p.numeroDoc) : '-');
      row.getCell(1).value = compStr;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // 2. Fecha Prestación
      row.getCell(2).value = this.formatearFecha(p.fechaPrestacion || '');
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      // 3. Paciente
      row.getCell(3).value = p.paciente || 'SIN NOMBRE';
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

      // 4. Carnet
      row.getCell(4).value = p.carnet || '-';
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

      // 5. Institución / Cobertura
      row.getCell(5).value = p.cobertura || '-';
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'left' };

      // 6. Plan
      row.getCell(6).value = p.plan || '-';
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

      // 7. Código
      row.getCell(7).value = p.codigoPrestacion || '-';
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

      // 8. Prestación
      row.getCell(8).value = p.descripcionPrestacion || '-';
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'left' };

      // 9. Especialidad
      row.getCell(9).value = p.especialidad || '-';
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'left' };

      // 10. Cantidad
      const cant = p.cantidad != null ? Number(p.cantidad) : 1;
      sumaCantidad += cant;
      const cCant = row.getCell(10);
      cCant.value = cant;
      cCant.numFmt = '#,##0';
      cCant.alignment = { vertical: 'middle', horizontal: 'right' };

      // 11. Importe Total
      const imp = p.importeTotal != null ? Number(p.importeTotal) : 0;
      sumaImporte += imp;
      const cImp = row.getCell(11);
      cImp.value = imp;
      cImp.numFmt = '$ #,##0.00;($ #,##0.00);"-"';
      cImp.alignment = { vertical: 'middle', horizontal: 'right' };

      // 12. Médico / Prestador
      row.getCell(12).value = p.medico || '-';
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'left' };

      // 13. Tipo Atención
      row.getCell(13).value = p.tipoRegistro || '-';
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

      // Zebra striping suave
      const bgArgb = (index % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';
      for (let col = 1; col <= totalCols; col++) {
        const cell = row.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
      }

      currentRow++;
    });

    // Fila de Totales
    const totalRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const lblTotal = totalRow.getCell(1);
    lblTotal.value = `TOTAL (${items.length} REGISTROS):`;
    lblTotal.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    lblTotal.alignment = { vertical: 'middle', horizontal: 'right' };

    const cTotCant = totalRow.getCell(10);
    cTotCant.value = sumaCantidad;
    cTotCant.numFmt = '#,##0';
    cTotCant.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    cTotCant.alignment = { vertical: 'middle', horizontal: 'right' };

    const cTotImp = totalRow.getCell(11);
    cTotImp.value = sumaImporte;
    cTotImp.numFmt = '$ #,##0.00;($ #,##0.00);"-"';
    cTotImp.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    cTotImp.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= totalCols; col++) {
      const cell = totalRow.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF94A3B8' } }
      };
    }
    totalRow.height = 24;

    const minWidths = [18, 14, 26, 16, 24, 14, 12, 30, 20, 10, 16, 24, 14];
    this.ajustarAnchosTablero(worksheet, minWidths, filaHeader, currentRow);

    worksheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: currentRow, column: totalCols }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename || this.generarNombreArchivoTablero('Prestaciones_Facturadas'));
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
