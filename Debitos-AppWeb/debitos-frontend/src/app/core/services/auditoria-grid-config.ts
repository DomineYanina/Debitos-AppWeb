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
    editorComponent: any // Recibe el GroupedSelectEditor por parámetro
  ): ColDef[] {
    const esSoloLectura = tipo === 'NC';

    let columnas: ColDef[] = [
      { headerName: '', field: 'seleccionada', checkboxSelection: true, headerCheckboxSelection: true, width: 50, pinned: 'left' },
      { headerName: 'Paciente', field: 'paciente', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Plan', field: 'plan', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Efector', field: 'efector', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Médico', field: 'medico', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Fecha', field: 'fecha', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 105, minWidth: 105, suppressAutoSize: true, valueFormatter: params => params.value ? new Date(params.value).toLocaleDateString() : '' },
      { headerName: 'Código', field: 'codigo', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 84, minWidth: 84, suppressAutoSize: true },
      { headerName: 'Descripción', field: 'descripcion', cellClass: 'bg-celeste', headerClass: 'bg-celeste' },
      { headerName: 'Cant.', field: 'cantidad', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 67, minWidth: 67, suppressAutoSize: true },
      { headerName: 'Total\nNeto', field: 'totalNeto', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 103, minWidth: 103, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' },
      { headerName: 'Coseguro', field: 'coseguro', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 103, minWidth: 103, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' },
      { headerName: 'Total', field: 'total', cellClass: 'bg-celeste', headerClass: 'bg-celeste', width: 99, minWidth: 99, suppressAutoSize: true, valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' }
    ];

    if (tipo === 'ND' || (tipo === 'NC' && tieneComentariosPrevios)) {
      columnas.push({ headerName: 'Comentarios\nPrevios', field: 'comentarioPrevio', editable: false, cellClass: 'bg-azul-auditoria', headerClass: 'bg-azul-auditoria' });
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
      editable: params => !esSoloLectura && !!params.data.motivoDebito && params.data.motivoDebito !== '',
      cellClassRules: {
        'bg-gris': params => !esSoloLectura && !!params.data.motivoDebito && params.data.motivoDebito !== '',
        'bg-naranja': params => esSoloLectura || (!params.data.motivoDebito || params.data.motivoDebito === '')
      }
    });

    columnas.push(
      { headerName: 'Motivo\nRefactura', field: 'motivoRefactura', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', cellEditor: editorComponent, cellEditorParams: { grupos: motivosRefactura } },
      { headerName: 'Imp.\nRefactura', field: 'importeRefactura', editable: !esSoloLectura, cellClass: 'bg-gris', headerClass: 'bg-gris', width: 94,
        valueFormatter: params => params.value != null ? `$${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
      },
      { headerName: 'Comentarios', field: 'comentarios', headerClass: 'bg-naranja',
        editable: params => !esSoloLectura && params.data.debitoAceptado === 'NO',
        cellClassRules: {
          'bg-gris': params => !esSoloLectura && params.data.debitoAceptado === 'NO',
          'bg-naranja': params => esSoloLectura || params.data.debitoAceptado !== 'NO'
        }
      }
    );

    return columnas;
  }
}
