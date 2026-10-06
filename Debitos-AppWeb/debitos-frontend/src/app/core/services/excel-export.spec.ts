import { TestBed } from '@angular/core/testing';
import { ExcelExportService } from './excel-export';
import { vi } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

import { saveAs } from 'file-saver';

describe('ExcelExportService', () => {
  let service: ExcelExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExcelExportService]
    });
    service = TestBed.inject(ExcelExportService);
    vi.clearAllMocks();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('exportarPrestaciones no debería ejecutar si la lista está vacía', async () => {
    await service.exportarPrestaciones([], 'FC', 'test.xlsx');
    expect(saveAs).not.toHaveBeenCalled();

    await service.exportarPrestaciones(null as any, 'FC', 'test.xlsx');
    expect(saveAs).not.toHaveBeenCalled();
  });

  it('exportarPrestaciones debería exportar para tipo NC y guardar archivo', async () => {
    const data: any[] = [
      {
        carnet: '123',
        paciente: 'Perez Juan',
        cobertura: 'OSDE',
        plan: '210',
        grupomodulo: 'MOD1',
        medico: 'Dr. House',
        fecha: '2025-05-10',
        codigo: '420101',
        descripcion: 'Consulta',
        cantidad: 1,
        totalNeto: 1000,
        coseguro: 0,
        total: 1000,
        comentarioPrevio: 'Obs previa',
        motivoRefactura: '01',
        importeRefactura: 500,
        comentarios: 'Refacturado'
      }
    ];

    await service.exportarPrestaciones(data, 'NC', 'export_nc.xlsx');
    expect(saveAs).toHaveBeenCalled();
  });

  it('exportarPrestaciones debería filtrar registros con debitoAceptado SI/NO para tipo FC', async () => {
    const data: any[] = [
      { carnet: '1', paciente: 'P1', debitoAceptado: 'SI', fecha: '2025-01-01T00:00:00' },
      { carnet: '2', paciente: 'P2', debitoAceptado: 'NO', fecha: '' },
      { carnet: '3', paciente: 'P3', debitoAceptado: '', fecha: null }
    ];

    await service.exportarPrestaciones(data, 'FC', 'export_fc.xlsx');
    expect(saveAs).toHaveBeenCalled();
  });

  it('exportarHistorialComprobantes no debería ejecutar si no hay filas', async () => {
    await service.exportarHistorialComprobantes([], null, 'historial.xlsx');
    expect(saveAs).not.toHaveBeenCalled();
  });

  it('exportarHistorialComprobantes debería procesar árbol jerárquico con diferentes orígenes y niveles', async () => {
    const filas: any[] = [
      {
        nivel: 0,
        tipoDocumento: 'FAC',
        letra: 'A',
        puntoVenta: 1,
        numero: 1000,
        fechaDocumento: '2025-01-01',
        montoNeto: 10000,
        porcentajeIva: 21,
        montoIva: 2100,
        origenTipo: null
      },
      {
        nivel: 1,
        tipoDocumento: 'NC',
        letra: 'A',
        puntoVenta: 1,
        numero: 2000,
        fechaDocumento: '2025-01-05',
        montoNeto: 2000,
        porcentajeIva: null,
        montoIva: null,
        origenTipo: 'DEB'
      },
      {
        nivel: 2,
        tipoDocumento: 'ND',
        letra: 'A',
        puntoVenta: 1,
        numero: 3000,
        fechaDocumento: '2025-01-10',
        montoNeto: 1500,
        porcentajeIva: 21,
        montoIva: 315,
        origenTipo: 'REF'
      },
      {
        nivel: 1,
        tipoDocumento: 'RC',
        letra: 'X',
        puntoVenta: 1,
        numero: 50,
        fechaDocumento: '2025-01-15',
        montoNeto: 8000,
        origenTipo: 'COB'
      },
      {
        nivel: 1,
        tipoDocumento: 'NC',
        letra: 'A',
        puntoVenta: 1,
        numero: 2005,
        fechaDocumento: '2025-01-20',
        montoNeto: 500,
        origenTipo: 'IVA'
      }
    ];

    const buscado = { tipo: 'FC', letra: 'A', puntoVenta: 1, numero: 1000 };

    await service.exportarHistorialComprobantes(filas, buscado, 'historial_completo.xlsx');
    expect(saveAs).toHaveBeenCalled();
  });
});
