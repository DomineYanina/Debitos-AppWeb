import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaGridConfigService {

  getConfiguracionColumnas(
    tipo: string,
    mostrarEnglobante: boolean,
    tieneComentariosPrevios: boolean,
    motivosDebito: any[],
    motivosRefactura: any[],
    editorComponent: any, // Recibe el GroupedSelectEditor por parámetro
    tramiteFinalizado: boolean = false,
    tienePrestacionesImportadas: boolean = false,
    onQuitarPrestacion?: (prestacion: any) => void
  ): ColDef[] {
    const esSoloLectura = tipo === 'NC' || tipo === 'NCE' || tramiteFinalizado;

    let columnas: ColDef[] = [
      { headerName: '', field: 'seleccionada', checkboxSelection: true, headerCheckboxSelection: true, headerTooltip: 'Seleccionar o deseleccionar todas las filas cargadas', width: 50, pinned: 'left' }
    ];

    const esNc = tipo === 'NC' || tipo === 'NCE';
    if (esNc || tienePrestacionesImportadas) {
      columnas.push({
        headerName: 'Factura\nOrigen',
        field: 'facturaOrigenComprobante',
        headerTooltip: 'Factura original a la que pertenece esta prestación (ORI: Original, IMP: Importada de otra factura)',
        width: 175,
        minWidth: 165,
        cellClass: params => params.data?.esImportada ? 'bg-importada-tag' : 'bg-celeste',
        headerClass: 'bg-celeste',
        cellRenderer: (params: any) => {
          if (!params.value) return '';
          const esImp = !!params.data?.esImportada;
          const badgeStyle = esImp
            ? 'background: #fae8ff; color: #86198f; border: 1px solid #f0abfc;'
            : 'background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;';
          const badgeTexto = esImp ? 'IMP' : 'ORI';
          const badgeTitle = esImp ? 'Prestación importada de otra factura' : 'Prestación de la factura original';
          return `<div class="factura-origen-celda" style="display:inline-flex; align-items:center; gap:8px; width:100%; height:100%;">` +
            `<span class="badge-origen-tag ${esImp ? 'badge-tag-imp' : 'badge-tag-ori'}" style="display:inline-flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800; line-height:1; padding:2px 5px; border-radius:3px; letter-spacing:0.5px; text-transform:uppercase; flex-shrink:0; margin-right:6px; ${badgeStyle}" title="${badgeTitle}">${badgeTexto}</span>` +
            `<span class="factura-origen-nro" style="font-size:0.81rem; font-weight:600; color:#1e293b; white-space:nowrap;">${params.value}</span>` +
          `</div>`;
        }
      });
    }

    columnas.push(
      { headerName: 'Paciente', field: 'paciente', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Plan', field: 'plan', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Efector', field: 'efector', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Médico', field: 'medico', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Fecha', field: 'fecha', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 105, minWidth: 105, suppressAutoSize: true, valueFormatter: params => { if (!params.value) return ''; const [anio, mes, dia] = params.value.split('-'); return `${dia}/${mes}/${anio}`; } },
      { headerName: 'Código', field: 'codigo', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 84, minWidth: 84, suppressAutoSize: true },
      { headerName: 'Descripción', field: 'descripcion', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Cant.', field: 'cantidad', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 67, minWidth: 67, suppressAutoSize: true },
      { headerName: 'Total\nNeto', field: 'totalNeto', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 103, minWidth: 103, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' },
      { headerName: 'Coseguro', field: 'coseguro', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 103, minWidth: 103, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' },
      { headerName: 'Total', field: 'total', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 99, minWidth: 99, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' }
    );

    const esNd = tipo === 'ND' || tipo === 'NDE';
    if (esNd || (esNc && tieneComentariosPrevios)) {
      columnas.push({
        headerName: 'Comentarios\nPrevios',
        field: 'comentarioPrevio',
        headerTooltip: 'Historial de comentarios y observaciones de auditorías anteriores',
        tooltipValueGetter: params => params.value || '',
        editable: false,
        cellClass: 'bg-azul-auditoria',
        headerClass: 'bg-azul-auditoria'
      });
    }

    columnas.push(
      { headerName: 'Débito\nAceptado', field: 'debitoAceptado', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['', 'SI', 'NO'] }, width: 95, minWidth: 95, suppressAutoSize: true },
      { headerName: 'Motivo\nDébito', field: 'motivoDebito', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', cellEditor: editorComponent, cellEditorParams: { grupos: motivosDebito } },
      { headerName: 'Días\nFact.', field: 'diasFacturados', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', width: 63 }
    );

    if (mostrarEnglobante) {
      columnas.push({ headerName: 'Prestación\nEnglobante', field: 'prestacionEnglobante', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris' });
    }

    columnas.push({
      headerName: 'Imp.\nDebitado', field: 'importeDebitado', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', width: 93,
      valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
    });

    columnas.push({
      headerName: 'Comentarios\nDébito', field: 'comentariosDebito', headerClass: 'bg-naranja',
      headerTooltip: 'Observaciones específicas sobre el débito aplicado a esta prestación',
      tooltipValueGetter: params => params.value || '',
      editable: params => !esSoloLectura && !!params.data.motivoDebito && params.data.motivoDebito !== '',
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true,
      cellEditorPopupPosition: 'under',
      cellEditorParams: {
        maxLength: 2000,
        rows: 4,
        cols: 30
      },
      cellClassRules: {
        'bg-gris': params => !esSoloLectura && !!params.data.motivoDebito && params.data.motivoDebito !== '',
        'bg-naranja': params => esSoloLectura || (!params.data.motivoDebito || params.data.motivoDebito === '')
      }
    });

    columnas.push(
      {
        headerName: 'Motivo\nRefactura',
        field: 'motivoRefactura',
        editable: params => !esSoloLectura && params.data.debitoAceptado !== 'SI',
        cellClass: 'bg-gris',
        headerClass: 'bg-gris',
        cellEditor: editorComponent,
        cellEditorParams: { grupos: motivosRefactura },
        cellClassRules: {
          'bg-naranja': params => esSoloLectura || params.data.debitoAceptado === 'SI',
          'bg-gris': params => !esSoloLectura && params.data.debitoAceptado !== 'SI'
        }
      },
      {
        headerName: 'Imp.\nRefactura',
        field: 'importeRefactura',
        editable: params => !esSoloLectura && params.data.debitoAceptado !== 'SI',
        cellClass: 'bg-gris',
        headerClass: 'bg-gris',
        width: 94,
        valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
        cellClassRules: {
          'bg-naranja': params => esSoloLectura || params.data.debitoAceptado === 'SI',
          'bg-gris': params => !esSoloLectura && params.data.debitoAceptado !== 'SI'
        }
      },
      {
        headerName: 'Comentarios\nRefactura',
        field: 'comentarios',
        headerClass: 'bg-naranja',
        headerTooltip: 'Notas y aclaraciones sobre el proceso de refacturación',
        tooltipValueGetter: params => params.value || '',
        editable: params => !esSoloLectura && params.data.debitoAceptado === 'NO',
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
        cellEditorPopupPosition: 'under',
        cellEditorParams: {
          maxLength: 2000,
          rows: 4,
          cols: 30
        },
        cellClassRules: {
          'bg-gris': params => !esSoloLectura && params.data.debitoAceptado === 'NO',
          'bg-naranja': params => esSoloLectura || params.data.debitoAceptado !== 'NO'
        }
      }
    );

    if (tienePrestacionesImportadas && onQuitarPrestacion) {
      columnas.push({
        headerName: 'Acción',
        field: 'esImportada',
        width: 90,
        minWidth: 90,
        suppressAutoSize: true,
        cellRenderer: (params: any) => {
          if (params.data?.esImportada) {
            return `<button type="button" class="btn-quitar-importada-grid" title="Quitar prestación importada de esta auditoría">✕ Quitar</button>`;
          }
          return '';
        },
        onCellClicked: (params: any) => {
          if (params.data?.esImportada && onQuitarPrestacion) {
            onQuitarPrestacion(params.data);
          }
        }
      });
    }

    return columnas;
  }
}
