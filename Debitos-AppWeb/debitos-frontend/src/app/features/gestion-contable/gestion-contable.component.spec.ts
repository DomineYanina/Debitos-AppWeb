import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GestionContableComponent } from './gestion-contable.component';
import { GestionContableService } from '../../core/services/gestion-contable.service';
import { ExcelExportService } from '../../core/services/excel-export';
import { AuthService } from '../../core/services/auth';
import { NotificacionService } from '../../core/services/notificacion.service';

describe('GestionContableComponent', () => {
  let component: GestionContableComponent;
  let fixture: ComponentFixture<GestionContableComponent>;
  let contableServiceMock: any;
  let excelExportServiceMock: any;
  let authServiceMock: any;
  let notificacionServiceMock: any;

  const emptyPage = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
    first: true,
    last: true
  };

  beforeEach(async () => {
    contableServiceMock = {
      listarCoberturas: vi.fn().mockReturnValue(of(emptyPage)),
      listarFacturasPeriodoCorregido: vi.fn().mockReturnValue(of(emptyPage)),
      listarPrestaciones: vi.fn().mockReturnValue(of(emptyPage)),
      listarFacturasAnuladas: vi.fn().mockReturnValue(of(emptyPage)),
      obtenerHistorial: vi.fn().mockReturnValue(of(emptyPage)),
      buscarFacturaParaAnulacion: vi.fn(),
      listarCandidatosAnulador: vi.fn().mockReturnValue(of([])),
      cambiarEstadoAnulacion: vi.fn()
    };

    excelExportServiceMock = {
      exportarGestionCoberturas: vi.fn().mockResolvedValue(undefined),
      exportarGestionPeriodos: vi.fn().mockResolvedValue(undefined),
      exportarGestionPrestaciones: vi.fn().mockResolvedValue(undefined),
      exportarGestionFacturasAnuladas: vi.fn().mockResolvedValue(undefined),
      exportarGestionHistorial: vi.fn().mockResolvedValue(undefined)
    };

    authServiceMock = {
      obtenerUsuario: vi.fn().mockReturnValue('Yanina')
    };

    notificacionServiceMock = {
      rechazarSolicitudAnulacion: vi.fn().mockReturnValue(of({ mensaje: 'ok' }))
    };

    await TestBed.configureTestingModule({
      imports: [GestionContableComponent],
      providers: [
        provideRouter([]),
        { provide: GestionContableService, useValue: contableServiceMock },
        { provide: ExcelExportService, useValue: excelExportServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificacionService, useValue: notificacionServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GestionContableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe ciclar ordenamiento en 3 clics para columnas alfabéticas (asc -> desc -> natural) en Coberturas', () => {
    expect(component.getIconoOrden(component.ordenCoberturas, 'nombreMostrar')).toBe('↕');

    // Clic 1: ascendente
    contableServiceMock.listarCoberturas.mockClear();
    component.ordenarTabla('coberturas', 'nombreMostrar');
    expect(component.ordenCoberturas).toEqual({ columna: 'nombreMostrar', direccion: 'asc', paso: 1 });
    expect(component.getIconoOrden(component.ordenCoberturas, 'nombreMostrar')).toBe('▲');
    expect(contableServiceMock.listarCoberturas).toHaveBeenCalledWith('', 0, 20, 'nombreMostrar', 'asc');

    // Clic 2: descendente
    contableServiceMock.listarCoberturas.mockClear();
    component.ordenarTabla('coberturas', 'nombreMostrar');
    expect(component.ordenCoberturas).toEqual({ columna: 'nombreMostrar', direccion: 'desc', paso: 2 });
    expect(component.getIconoOrden(component.ordenCoberturas, 'nombreMostrar')).toBe('▼');
    expect(contableServiceMock.listarCoberturas).toHaveBeenCalledWith('', 0, 20, 'nombreMostrar', 'desc');

    // Clic 3: restaurar orden natural del servidor
    contableServiceMock.listarCoberturas.mockClear();
    component.ordenarTabla('coberturas', 'nombreMostrar');
    expect(component.ordenCoberturas.columna).toBe('');
    expect(component.ordenCoberturas.paso).toBe(0);
    expect(component.getIconoOrden(component.ordenCoberturas, 'nombreMostrar')).toBe('↕');
    expect(contableServiceMock.listarCoberturas).toHaveBeenCalledWith('', 0, 20, undefined, undefined);
  });

  it('debe iniciar descendente por defecto en fechas e importes (Facturas Anuladas e Historial)', () => {
    // Importe en Facturas Anuladas
    contableServiceMock.listarFacturasAnuladas.mockClear();
    component.ordenarTabla('anuladas', 'importe');
    expect(component.ordenAnuladas).toEqual({ columna: 'importe', direccion: 'desc', paso: 1 });
    expect(contableServiceMock.listarFacturasAnuladas).toHaveBeenCalledWith(0, 15, 'importe', 'desc');

    contableServiceMock.listarFacturasAnuladas.mockClear();
    component.ordenarTabla('anuladas', 'importe');
    expect(component.ordenAnuladas).toEqual({ columna: 'importe', direccion: 'asc', paso: 2 });
    expect(contableServiceMock.listarFacturasAnuladas).toHaveBeenCalledWith(0, 15, 'importe', 'asc');

    // Fecha y Hora en Historial
    contableServiceMock.obtenerHistorial.mockClear();
    component.ordenarTabla('historial', 'fechaHora');
    expect(component.ordenHistorial).toEqual({ columna: 'fechaHora', direccion: 'desc', paso: 1 });
    expect(contableServiceMock.obtenerHistorial).toHaveBeenCalledWith('', 0, 20, 'fechaHora', 'desc');
  });

  it('debe ordenar Prestaciones a No Considerar manteniendo los filtros actuales (texto y estado)', () => {
    component.filtroPrestacionCodigo = '420';
    component.filtroPrestacionEstadoAmb = 'No considerar';
    contableServiceMock.listarPrestaciones.mockClear();
    component.ordenarTabla('prestaciones', 'estadoAmbulatorio');

    expect(component.ordenPrestaciones).toEqual({ columna: 'estadoAmbulatorio', direccion: 'asc', paso: 1 });
    expect(contableServiceMock.listarPrestaciones).toHaveBeenCalledWith('420', 0, 20, 'estadoAmbulatorio', 'asc', 'No considerar', undefined);
  });

  it('debe filtrar Prestaciones por estado ambulatorio e internado y limpiar filtros al presionar Limpiar', () => {
    component.subSolapaActiva = 'prestaciones';
    fixture.detectChanges();

    component.filtroPrestacionCodigo = 'CONSULTA';
    component.filtroPrestacionEstadoAmb = 'No considerar';
    component.filtroPrestacionEstadoInt = 'Considerar';
    contableServiceMock.listarPrestaciones.mockClear();

    component.buscarPrestacionesConFiltro();
    expect(contableServiceMock.listarPrestaciones).toHaveBeenCalledWith('CONSULTA', 0, 20, undefined, undefined, 'No considerar', 'Considerar');

    contableServiceMock.listarPrestaciones.mockClear();
    component.limpiarFiltroPrestaciones();
    expect(component.filtroPrestacionCodigo).toBe('');
    expect(component.filtroPrestacionEstadoAmb).toBe('');
    expect(component.filtroPrestacionEstadoInt).toBe('');
    expect(contableServiceMock.listarPrestaciones).toHaveBeenCalledWith('', 0, 20, undefined, undefined, undefined, undefined);
  });

  it('debe renderizar cabeceras ordenables en las tablas', () => {
    const ths = fixture.nativeElement.querySelectorAll('th.sortable-col');
    expect(ths.length).toBe(3); // Código, Nombre Original, Nombre a Mostrar en Coberturas
  });

  describe('Exportar a Excel en Gestión Contable', () => {
    it('debe renderizar el botón Exportar a Excel en el panel header de la solapa activa', () => {
      const btnExportar = fixture.nativeElement.querySelector('.panel-header .btn-exportar-excel');
      expect(btnExportar).toBeTruthy();
      expect(btnExportar.textContent).toContain('Exportar a Excel');
    });

    it('exportarAExcel en Coberturas debe llamar al servicio contable con size 10000 y exportar con excelExportService', async () => {
      component.subSolapaActiva = 'coberturas';
      component.busquedaCobCodigo = 'OSDE';
      const mockData = { content: [{ codigoCobertura: '443', nombreOriginal: 'OSDE', nombreMostrar: 'OSDE' }] };
      contableServiceMock.listarCoberturas.mockReturnValue(of(mockData));

      await component.exportarAExcel();

      expect(contableServiceMock.listarCoberturas).toHaveBeenCalledWith('OSDE', 0, 10000, undefined, undefined);
      expect(excelExportServiceMock.exportarGestionCoberturas).toHaveBeenCalled();
      expect(excelExportServiceMock.exportarGestionCoberturas.mock.calls[0][0]).toEqual(mockData.content);
      expect(excelExportServiceMock.exportarGestionCoberturas.mock.calls[0][1]).toBe('OSDE');
      expect(excelExportServiceMock.exportarGestionCoberturas.mock.calls[0][2]).toContain('gestion_coberturas_');
      expect(component.mensajeExito).toContain('Archivo Excel de Coberturas generado exitosamente.');
    });

    it('exportarAExcel en Periodos debe llamar a listarFacturasPeriodoCorregido y exportar con excelExportService', async () => {
      component.subSolapaActiva = 'periodos';
      const mockData = {
        content: [{
          idCabecera: 1,
          tipo: 'FC',
          letra: 'A',
          ptovta: 30,
          numero: 1001,
          fecha: '2026-05-10',
          periodoOriginal: '2026-05-01',
          periodoCorregido: '2026-06-01',
          codigoCobertura: '443',
          cobertura: 'OSDE',
          importe: 50000
        }]
      };
      contableServiceMock.listarFacturasPeriodoCorregido.mockReturnValue(of(mockData));

      await component.exportarAExcel();

      expect(contableServiceMock.listarFacturasPeriodoCorregido).toHaveBeenCalledWith(0, 10000);
      expect(excelExportServiceMock.exportarGestionPeriodos).toHaveBeenCalled();
      expect(excelExportServiceMock.exportarGestionPeriodos.mock.calls[0][0]).toEqual(mockData.content);
      expect(excelExportServiceMock.exportarGestionPeriodos.mock.calls[0][1]).toContain('gestion_periodos_corregidos_');
      expect(component.mensajeExito).toContain('Archivo Excel de Períodos de Facturas generado exitosamente.');
    });

    it('exportarAExcel en Prestaciones debe llamar a listarPrestaciones con size 10000 y exportar', async () => {
      component.subSolapaActiva = 'prestaciones';
      component.filtroPrestacionCodigo = '420';
      component.filtroPrestacionEstado = 'No considerar';
      const mockData = { content: [{ codigo: '420101', descripcion: 'CONSULTA', estado: 'No considerar' }] };
      contableServiceMock.listarPrestaciones.mockReturnValue(of(mockData));

      await component.exportarAExcel();

      expect(contableServiceMock.listarPrestaciones).toHaveBeenCalledWith('420', 0, 10000, undefined, undefined, 'No considerar', undefined);
      expect(excelExportServiceMock.exportarGestionPrestaciones).toHaveBeenCalled();
      expect(excelExportServiceMock.exportarGestionPrestaciones.mock.calls[0][0]).toEqual(mockData.content);
      expect(excelExportServiceMock.exportarGestionPrestaciones.mock.calls[0][1]).toBe('420 | Estado: No considerar');
      expect(excelExportServiceMock.exportarGestionPrestaciones.mock.calls[0][2]).toContain('gestion_prestaciones_');
      expect(component.mensajeExito).toContain('Archivo Excel de Prestaciones generado exitosamente.');
    });

    it('exportarAExcel en Facturas Anuladas debe llamar a listarFacturasAnuladas con size 10000 y exportar', async () => {
      component.subSolapaActiva = 'anuladas';
      const mockData = {
        content: [{
          idCabecera: 10,
          comprobante: 'FC A 0030-00001001',
          tipo: 'FC',
          letra: 'A',
          ptovta: 30,
          numero: 1001,
          fecha: '2026-05-10',
          periodo: '2026-05-01',
          codigoCobertura: '443',
          cobertura: 'OSDE',
          importe: 15000,
          anulada: true,
          origenAnulacion: 'MANUAL'
        }]
      };
      contableServiceMock.listarFacturasAnuladas.mockReturnValue(of(mockData));

      await component.exportarAExcel();

      expect(contableServiceMock.listarFacturasAnuladas).toHaveBeenCalledWith(0, 10000, undefined, undefined);
      expect(excelExportServiceMock.exportarGestionFacturasAnuladas).toHaveBeenCalled();
      expect(excelExportServiceMock.exportarGestionFacturasAnuladas.mock.calls[0][0]).toEqual(mockData.content);
      expect(excelExportServiceMock.exportarGestionFacturasAnuladas.mock.calls[0][1]).toContain('gestion_facturas_anuladas_');
      expect(component.mensajeExito).toContain('Archivo Excel de Facturas Anuladas generado exitosamente.');
    });

    it('exportarAExcel en Historial debe llamar a obtenerHistorial con size 10000 y exportar', async () => {
      component.subSolapaActiva = 'historial';
      component.filtroHistorialRef = 'REF123';
      const mockData = {
        content: [{
          id: 1,
          tipoOperacionCodigo: 'CAMBIO_ALIAS_COBERTURA',
          tipoOperacionDescripcion: 'Cambio de Alias Cobertura',
          referencia: 'REF123',
          valorAnterior: 'OSDE',
          valorNuevo: 'OSDE BINARIO',
          usuario: 'admin',
          fechaHora: '2026-05-10 10:00:00'
        }]
      };
      contableServiceMock.obtenerHistorial.mockReturnValue(of(mockData));

      await component.exportarAExcel();

      expect(contableServiceMock.obtenerHistorial).toHaveBeenCalledWith('REF123', 0, 10000, undefined, undefined);
      expect(excelExportServiceMock.exportarGestionHistorial).toHaveBeenCalled();
      expect(excelExportServiceMock.exportarGestionHistorial.mock.calls[0][0]).toEqual(mockData.content);
      expect(excelExportServiceMock.exportarGestionHistorial.mock.calls[0][1]).toBe('REF123');
      expect(excelExportServiceMock.exportarGestionHistorial.mock.calls[0][2]).toContain('gestion_historial_ajustes_');
      expect(component.mensajeExito).toContain('Archivo Excel de Historial de Ajustes generado exitosamente.');
    });

    it('exportarAExcel debe mostrar error si la lista devuelta está vacía', async () => {
      component.subSolapaActiva = 'coberturas';
      contableServiceMock.listarCoberturas.mockReturnValue(of({ content: [] }));

      await component.exportarAExcel();

      expect(component.mensajeError).toBe('No hay coberturas para exportar.');
      expect(excelExportServiceMock.exportarGestionCoberturas).not.toHaveBeenCalled();
    });
  });

  describe('Modal Anulación con Documento Anulador', () => {
    it('abrirModalAnulacion debe reiniciar campos y visibilizar modal', () => {
      component.abrirModalAnulacion();
      expect(component.modalAnulacionVisible).toBe(true);
      expect(component.modalAnulTipo).toBe('FC');
      expect(component.modalAnulLetra).toBe('A');
      expect(component.modalAnulPtoVta).toBe(30);
      expect(component.modalAnulNumero).toBeNull();
      expect(component.docAAnularModal).toBeNull();
      expect(component.candidatosAnulador).toEqual([]);
      expect(component.filtroCandidatoAnulador).toBe('');
      expect(component.docAnuladorModal).toBeNull();
    });

    it('cerrarModalAnulacion debe ocultar modal', () => {
      component.modalAnulacionVisible = true;
      component.cerrarModalAnulacion();
      expect(component.modalAnulacionVisible).toBe(false);
    });

    it('abrirModalConFactura debe pre-cargar el documento a anular y cargar candidatos del mismo asociadogrupo', () => {
      const mockFactura = {
        idCabecera: 101,
        asociadogrupo: 220587,
        comprobante: 'FC A 0030-00001001',
        tipo: 'FC',
        letra: 'A',
        ptovta: 30,
        numero: 1001,
        fecha: '2026-05-10',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: false,
        origenAnulacion: null
      };
      const mockCand = {
        ...mockFactura,
        idCabecera: 202,
        comprobante: 'NC A 0030-00000888',
        tipo: 'NC',
        numero: 888
      };
      contableServiceMock.listarCandidatosAnulador.mockReturnValue(of([mockCand]));

      component.abrirModalConFactura(mockFactura);
      expect(component.modalAnulacionVisible).toBe(true);
      expect(component.docAAnularModal).toBe(mockFactura);
      expect(component.modalAnulNumero).toBe(1001);
      expect(contableServiceMock.listarCandidatosAnulador).toHaveBeenCalledWith(101);
      expect(component.candidatosAnulador).toEqual([mockCand]);
    });

    it('buscarDocAAnularModal debe setear docAAnularModal y cargar candidatos si la factura es activa y tiene grupo', () => {
      component.modalAnulTipo = 'FC';
      component.modalAnulLetra = 'A';
      component.modalAnulPtoVta = 30;
      component.modalAnulNumero = 1001;

      const mockDoc = {
        idCabecera: 101,
        asociadogrupo: 220587,
        comprobante: 'FC A 0030-00001001',
        tipo: 'FC',
        letra: 'A',
        ptovta: 30,
        numero: 1001,
        fecha: '2026-05-10',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: false,
        origenAnulacion: null
      };

      const mockCandidato = {
        ...mockDoc,
        idCabecera: 202,
        tipo: 'NC',
        numero: 888,
        comprobante: 'NC A 0030-00000888'
      };

      contableServiceMock.buscarFacturaParaAnulacion.mockReturnValue(of(mockDoc));
      contableServiceMock.listarCandidatosAnulador.mockReturnValue(of([mockCandidato]));
      component.buscarDocAAnularModal();

      expect(contableServiceMock.buscarFacturaParaAnulacion).toHaveBeenCalledWith('FC', 'A', 30, 1001);
      expect(component.docAAnularModal).toEqual(mockDoc);
      expect(contableServiceMock.listarCandidatosAnulador).toHaveBeenCalledWith(101);
      expect(component.candidatosAnulador).toEqual([mockCandidato]);
      expect(component.errorModalDoc).toBe('');
    });

    it('buscarDocAAnularModal debe bloquear candidatos si el documento no posee asociadogrupo', () => {
      component.modalAnulTipo = 'FC';
      component.modalAnulLetra = 'A';
      component.modalAnulPtoVta = 30;
      component.modalAnulNumero = 1001;

      const mockDocSinGrupo = {
        idCabecera: 101,
        asociadogrupo: null,
        comprobante: 'FC A 0030-00001001',
        tipo: 'FC',
        letra: 'A',
        ptovta: 30,
        numero: 1001,
        fecha: '2026-05-10',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: false,
        origenAnulacion: null
      };

      contableServiceMock.buscarFacturaParaAnulacion.mockReturnValue(of(mockDocSinGrupo));
      component.buscarDocAAnularModal();

      expect(contableServiceMock.listarCandidatosAnulador).not.toHaveBeenCalled();
      expect(component.errorCandidatosAnulador).toContain('no posee asociadogrupo');
    });

    it('buscarDocAAnularModal debe mostrar error si la factura ya está anulada', () => {
      component.modalAnulTipo = 'FC';
      component.modalAnulLetra = 'A';
      component.modalAnulPtoVta = 30;
      component.modalAnulNumero = 1001;

      const mockDoc = {
        idCabecera: 101,
        asociadogrupo: 220587,
        comprobante: 'FC A 0030-00001001',
        tipo: 'FC',
        letra: 'A',
        ptovta: 30,
        numero: 1001,
        fecha: '2026-05-10',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: true,
        origenAnulacion: 'MANUAL' as const
      };

      contableServiceMock.buscarFacturaParaAnulacion.mockReturnValue(of(mockDoc));
      component.buscarDocAAnularModal();

      expect(component.docAAnularModal).toBeNull();
      expect(component.errorModalDoc).toContain('ya se encuentra anulado');
    });

    it('seleccionarCandidatoAnulador debe validar mismo asociadogrupo y filtrar candidatos localmente', () => {
      component.docAAnularModal = {
        idCabecera: 8542,
        asociadogrupo: 220587,
        comprobante: 'FAC A0031-00008983',
        tipo: 'FAC',
        letra: 'A',
        ptovta: 31,
        numero: 8983,
        fecha: '2026-02-02',
        periodo: '2026-02-01',
        codigoCobertura: '100',
        cobertura: 'PREMEDIC',
        importe: 32147603.49,
        anulada: false,
        origenAnulacion: null
      };

      const candValido = {
        ...component.docAAnularModal,
        idCabecera: 8544,
        tipo: 'NC',
        numero: 1775,
        comprobante: 'NC A0031-00001775',
        importe: 2624625.56
      };
      const candOtroGrupo = {
        ...candValido,
        idCabecera: 9999,
        asociadogrupo: 999999
      };
      component.candidatosAnulador = [candValido];
      component.filtroCandidatoAnulador = '1775';
      expect(component.candidatosAnuladorFiltrados).toEqual([candValido]);

      component.seleccionarCandidatoAnulador(candOtroGrupo);
      expect(component.docAnuladorModal).toBeNull();
      expect(component.errorModalAnulador).toContain('mismo asociadogrupo');

      component.seleccionarCandidatoAnulador(candValido);
      expect(component.docAnuladorModal).toEqual(candValido);
      expect(component.errorModalAnulador).toBe('');
    });

    it('confirmarAnulacionModal debe enviar idCabecera, anulada=true y comprobante anulador del mismo grupo', () => {
      component.docAAnularModal = {
        idCabecera: 101,
        asociadogrupo: 220587,
        comprobante: 'FC A 0030-00001001',
        tipo: 'FC',
        letra: 'A',
        ptovta: 30,
        numero: 1001,
        fecha: '2026-05-10',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: false,
        origenAnulacion: null
      };

      component.docAnuladorModal = {
        idCabecera: 202,
        asociadogrupo: 220587,
        comprobante: 'NCE A 0030-00000888',
        tipo: 'NCE',
        letra: 'A',
        ptovta: 30,
        numero: 888,
        fecha: '2026-05-11',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: false,
        origenAnulacion: null
      };

      const mockResponse = {
        ...component.docAAnularModal,
        anulada: true,
        origenAnulacion: 'MANUAL' as const,
        idCabeceraAnulador: 202,
        comprobanteAnulador: 'NCE A 0030-00000888'
      };

      contableServiceMock.cambiarEstadoAnulacion.mockReturnValue(of(mockResponse));
      component.modalAnulacionVisible = true;

      component.confirmarAnulacionModal();

      expect(contableServiceMock.cambiarEstadoAnulacion).toHaveBeenCalledWith({
        idCabecera: 101,
        anulada: true,
        idCabeceraAnulador: 202,
        comprobanteAnulador: 'NCE A 0030-00000888'
      });
      expect(component.modalAnulacionVisible).toBe(false);
      expect(component.mensajeExito).toContain('anulada con éxito asociando NCE A 0030-00000888');
      expect(component.modalExitoVisible).toBe(true);
      expect(component.modalExitoTitulo).toBe('Factura Anulada con Éxito');
      expect(component.modalExitoMensaje).toContain('FC A 0030-00001001');
    });

    it('cambiarAnulacion con anular=false debe reactivar directamente la factura y abrir modal de éxito', () => {
      contableServiceMock.cambiarEstadoAnulacion.mockReturnValue(of({
        idCabecera: 101,
        comprobante: 'FC A 0030-00001001',
        tipo: 'FC',
        letra: 'A',
        ptovta: 30,
        numero: 1001,
        fecha: '2026-05-10',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: false,
        origenAnulacion: null
      }));

      component.cambiarAnulacion(101, false);

      expect(contableServiceMock.cambiarEstadoAnulacion).toHaveBeenCalledWith({
        idCabecera: 101,
        anulada: false
      });
      expect(component.mensajeExito).toContain('Factura reactivada (anulación revertida).');
      expect(component.modalExitoVisible).toBe(true);
      expect(component.modalExitoTitulo).toBe('Comprobante Reactivado con Éxito');
    });

    it('debe abrir y cerrar el modal de éxito correctamente con métodos y eventos de teclado', () => {
      expect(component.modalExitoVisible).toBe(false);

      component.mostrarModalExito('Test Éxito', 'Mensaje de prueba');
      expect(component.modalExitoVisible).toBe(true);
      expect(component.modalExitoTitulo).toBe('Test Éxito');
      expect(component.modalExitoMensaje).toBe('Mensaje de prueba');

      fixture.detectChanges();
      let modalEl = fixture.nativeElement.querySelector('.modal-backdrop-success');
      expect(modalEl).toBeTruthy();
      expect(modalEl.querySelector('.modal-success-title')?.textContent).toContain('Test Éxito');

      // Cerrar por Escape
      component.manejarTecladoModalExito(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.modalExitoVisible).toBe(false);

      fixture.detectChanges();
      modalEl = fixture.nativeElement.querySelector('.modal-backdrop-success');
      expect(modalEl).toBeNull();

      // Abrir de nuevo y cerrar con Enter
      component.mostrarModalExito('Segundo Éxito', 'Otro mensaje');
      expect(component.modalExitoVisible).toBe(true);
      component.manejarTecladoModalExito(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.modalExitoVisible).toBe(false);
    });

    it('debe renderizar los 4 filtros de búsqueda de documento (incluyendo FC, NC y ND) y botón en .doc-search-grid de Anuladas', () => {
      component.subSolapaActiva = 'anuladas';
      fixture.detectChanges();

      const grid: HTMLElement | null = fixture.nativeElement.querySelector('.doc-search-grid');
      expect(grid).toBeTruthy();

      const tipo = grid?.querySelector('#anulTipo') as HTMLSelectElement | null;
      const letra = grid?.querySelector('#anulLetra') as HTMLSelectElement | null;
      const ptoVta = grid?.querySelector('#anulPtoVta') as HTMLInputElement | null;
      const numero = grid?.querySelector('#anulNumero') as HTMLInputElement | null;
      const boton = grid?.querySelector('.form-group-btn button.btn-primary') as HTMLButtonElement | null;

      expect(tipo).toBeTruthy();
      const opcionesTipo = Array.from(tipo?.options || []).map(opt => opt.value);
      expect(opcionesTipo).toEqual(['FC', 'FAC', 'FCE', 'FCA', 'NCE', 'NC', 'NDE', 'ND']);
      expect(letra).toBeTruthy();
      expect(ptoVta).toBeTruthy();
      expect(numero).toBeTruthy();
      expect(boton?.textContent?.trim()).toBe('Buscar Documento');
    });

    it('buscarFacturaAnulacion debe permitir buscar Notas de Crédito y Notas de Débito desde el buscador principal', () => {
      const mockNce = {
        idCabecera: 303,
        asociadogrupo: 220587,
        comprobante: 'NCE A 0031-00000888',
        tipo: 'NCE',
        letra: 'A',
        ptovta: 31,
        numero: 888,
        fecha: '2026-05-11',
        periodo: '2026-05-01',
        codigoCobertura: '443',
        cobertura: 'OSDE',
        importe: 50000,
        anulada: false,
        origenAnulacion: null
      };
      contableServiceMock.buscarFacturaParaAnulacion.mockReturnValue(of(mockNce));

      component.busquedaAnulTipo = 'NCE';
      component.busquedaAnulLetra = 'A';
      component.busquedaAnulPtoVta = 31;
      component.busquedaAnulNumero = 888;
      component.buscarFacturaAnulacion();

      expect(contableServiceMock.buscarFacturaParaAnulacion).toHaveBeenCalledWith('NCE', 'A', 31, 888);
      expect(component.facturaAnulacionSeleccionada).toEqual(mockNce);
    });

    it('buscarFacturaAnulacion sin número específico debe filtrar la tabla de documentos anulados por el tipo seleccionado', () => {
      contableServiceMock.listarFacturasAnuladas.mockClear();
      component.busquedaAnulTipo = 'FC';
      component.busquedaAnulNumero = null;

      component.buscarFacturaAnulacion();

      expect(contableServiceMock.buscarFacturaParaAnulacion).not.toHaveBeenCalled();
      expect(component.filtroAnuladasTipo).toBe('FC');
      expect(contableServiceMock.listarFacturasAnuladas).toHaveBeenCalledWith(0, 15, undefined, undefined, 'FC', undefined);
    });

    it('debe filtrar la tabla de documentos anulados por tipo/categoría y texto, y limpiar filtros al presionar Limpiar', () => {
      component.subSolapaActiva = 'anuladas';
      fixture.detectChanges();

      component.filtroAnuladasTipo = 'FACTURAS';
      component.filtroAnuladasTexto = 'OSDE';
      contableServiceMock.listarFacturasAnuladas.mockClear();

      component.buscarFacturasAnuladasConFiltro();
      expect(contableServiceMock.listarFacturasAnuladas).toHaveBeenCalledWith(0, 15, undefined, undefined, 'FACTURAS', 'OSDE');

      contableServiceMock.listarFacturasAnuladas.mockClear();
      component.limpiarFiltroFacturasAnuladas();
      expect(component.filtroAnuladasTipo).toBe('');
      expect(component.filtroAnuladasTexto).toBe('');
      expect(contableServiceMock.listarFacturasAnuladas).toHaveBeenCalledWith(0, 15, undefined, undefined);
    });

    it('debe abrir el modal de detalle al hacer clic en una fila de documentos anulados y mostrar datos del documento anulado y su anulador', () => {
      const mockItem = {
        idCabecera: 951,
        asociadogrupo: 220587,
        comprobante: 'NCE A0031-00000951',
        tipo: 'NCE',
        letra: 'A',
        ptovta: 31,
        numero: 951,
        fecha: '2026-10-25',
        periodo: '2026-10-01',
        codigoCobertura: '679',
        cobertura: 'SWISS MEDICAL GROUP',
        importe: 1278968.29,
        tipoRegistro: 'Ambulatorios',
        anulada: true,
        origenAnulacion: 'MANUAL' as const,
        usuarioAnulacion: 'operador1',
        idCabeceraAnulador: 516,
        comprobanteAnulador: 'NDE A0031-00000516',
        tipoAnulador: 'NDE',
        letraAnulador: 'A',
        ptovtaAnulador: 31,
        numeroAnulador: 516,
        fechaAnulador: '2026-10-25',
        periodoAnulador: '2026-10-01',
        codigoCoberturaAnulador: '679',
        coberturaAnulador: 'SWISS MEDICAL GROUP',
        importeAnulador: 1278968.29,
        asociadogrupoAnulador: 220587
      };

      component.subSolapaActiva = 'anuladas';
      component.facturasAnuladasPage = {
        content: [mockItem],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 15,
        first: true,
        last: true,
        empty: false
      };
      fixture.detectChanges();

      const row = fixture.nativeElement.querySelector('tr.clickable-row') as HTMLTableRowElement | null;
      expect(row).toBeTruthy();

      row?.click();
      fixture.detectChanges();

      expect(component.modalDetalleAnulacionVisible).toBe(true);
      expect(component.detalleAnulacionSeleccionada).toEqual(mockItem);

      const modalText = fixture.nativeElement.textContent;
      expect(modalText).toContain('Detalle de Documento Anulado y su Anulador');
      expect(modalText).toContain('NCE A0031-00000951');
      expect(modalText).toContain('NDE A0031-00000516');
      expect(modalText).toContain('SWISS MEDICAL GROUP');

      component.cerrarModalDetalleAnulacion();
      expect(component.modalDetalleAnulacionVisible).toBe(false);
      expect(component.detalleAnulacionSeleccionada).toBeNull();
    });

    it('debería procesar queryParams y abrir modal de anulación si vienen en la ruta', () => {
      const buscarSpy = vi.spyOn(component, 'buscarDocAAnularModal').mockImplementation(() => {});
      const route = TestBed.inject(ActivatedRoute);
      (route as any).queryParams = of({
        subSolapa: 'anuladas',
        abrirModal: 'true',
        tipo: 'FC',
        letra: 'A',
        ptoVta: '31',
        numero: '1865'
      });

      component.ngOnInit();

      expect(component.subSolapaActiva).toBe('anuladas');
      expect(component.modalAnulacionVisible).toBe(true);
      expect(component.modalAnulTipo).toBe('FC');
      expect(component.modalAnulLetra).toBe('A');
      expect(component.modalAnulPtoVta).toBe(31);
      expect(component.modalAnulNumero).toBe(1865);
      expect(buscarSpy).toHaveBeenCalled();
    });

    it('debe abrir modal de rechazo y llamar a notificacionService.rechazarSolicitudAnulacion', () => {
      component.docAAnularModal = {
        idCabecera: 123,
        tipo: 'NDE',
        letra: 'A',
        ptovta: 32,
        numero: 1137,
        comprobante: 'NDE A0032-00001137',
        tieneSolicitudAnulacion: true,
        idNotificacionSolicitud: 16,
        usuarioSolicitante: 'PaolaBurniego',
        motivoSolicitudAnulacion: 'Error en carga'
      } as any;

      component.abrirModalRechazoSolicitud();
      expect(component.modalRechazoVisible).toBe(true);

      component.motivoRechazoSolicitud = 'No corresponde la anulación';
      component.confirmarRechazarSolicitud();

      expect(notificacionServiceMock.rechazarSolicitudAnulacion).toHaveBeenCalledWith({
        idNotificacion: 16,
        tipoDoc: 'NDE',
        letraDoc: 'A',
        puntoVenta: 32,
        numero: 1137,
        motivoRechazo: 'No corresponde la anulación'
      });
      expect(component.modalRechazoVisible).toBe(false);
      expect(component.modalAnulacionVisible).toBe(false);
    });
  });
});
