import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DirectorioService } from './directorio.service';
import { environment } from '../../../environments/environment';
import { DirectorioTotales } from '../models/directorio.model';

describe('DirectorioService', () => {
  let service: DirectorioService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/directorio`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DirectorioService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(DirectorioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtenerCoberturas debería hacer GET a /api/directorio/coberturas', () => {
    const mockData = [{ codigo: 'OSDE', nombre: 'OSDE' }];

    service.obtenerCoberturas().subscribe(res => {
      expect(res).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${apiUrl}/coberturas`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('obtenerTiposDocumento debería hacer GET a /api/directorio/tipos-documento', () => {
    const mockTipos = ['FAC', 'FC', 'FCA', 'FCE'];

    service.obtenerTiposDocumento().subscribe(res => {
      expect(res).toEqual(mockTipos);
    });

    const req = httpMock.expectOne(`${apiUrl}/tipos-documento`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTipos);
  });

  it('obtenerTotales debería incluir queryParams de cobertura, tipoDoc y fechas', () => {
    const mockTotales: DirectorioTotales = {
      totalFacturado: 100,
      cantidadFacturas: 2,
      totalIncrementosNd: 10,
      totalDebitosNc: 15,
      totalRefacturacionNd: 5,
      tasaRecupero: 33.3,
      totalCobranzas: 50,
      efectividadCobro: 50,
      saldoPendienteReal: 40,
      dsoPonderadoDias: 429,
      cobranzaEfectiva: 50,
      perdidaAsumida: 10,
      deudaNeta: 40,
      cantidadComprobantes: 5
    };

    service.obtenerTotales('OSDE', 'FCE', '2026-08-01', '2026-08-31').subscribe(res => {
      expect(res).toEqual(mockTotales);
    });

    const req = httpMock.expectOne(r =>
      r.url === `${apiUrl}/totales` &&
      r.params.get('codigoCobertura') === 'OSDE' &&
      r.params.get('tipoDoc') === 'FCE' &&
      r.params.get('fechaDesde') === '2026-08-01' &&
      r.params.get('fechaHasta') === '2026-08-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockTotales);
  });

  it('obtenerGrupos debería invocar /api/directorio/grupos con filtros', () => {
    service.obtenerGrupos('OSDE', 'FC', '2026-08-01', '2026-08-31').subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/grupos` && r.params.get('tipoDoc') === 'FC');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('obtenerMotivos debería invocar /api/directorio/motivos con filtros', () => {
    service.obtenerMotivos('OSDE', 'FC', '2026-08-01', '2026-08-31').subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/motivos` && r.params.get('tipoDoc') === 'FC');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('obtenerMotivoDetalle debería enviar el parámetro motivo y tipoDoc', () => {
    service.obtenerMotivoDetalle('Falta de autorización', 'OSDE', 'FCE').subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/motivo-detalle` && r.params.get('motivo') === 'Falta de autorización' && r.params.get('tipoDoc') === 'FCE');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMatrizRecaudacion debería enviar parámetros anio y financiador', () => {
    service.getMatrizRecaudacion(2026, '679').subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(r =>
      r.url.includes('/matriz-recaudacion') &&
      r.params.get('anio') === '2026' &&
      r.params.get('financiador') === '679'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ anioSeleccionado: 2026, aniosDisponibles: [2026], filas: [], totalesMes: [], granTotal: 0 });
  });

  it('getParetoMotivos debería enviar filtros de cobertura, tipoDoc y fechas', () => {
    service.getParetoMotivos('766', 'FC', '2026-08-01', '2026-08-31').subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(r =>
      r.url.includes('/motivos') &&
      r.params.get('codigoCobertura') === '766' &&
      r.params.get('tipoDoc') === 'FC' &&
      r.params.get('fechaDesde') === '2026-08-01' &&
      r.params.get('fechaHasta') === '2026-08-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getDesempenoGlobal debería llamar a /api/graficos/desempeno con periodo opcional', () => {
    const mockDesempeno = {
      analistas: [
        {
          analista: 'Maria',
          cantidadRegistros: 15,
          debitosAceptados: 10000,
          debitosRefacturados: 5000,
          ticketPromedio: 1000,
          tasaRecupero: 33.3,
          distribucionAtencion: '100% Amb / 0% Int',
          porcentajeAmb: 100,
          porcentajeInt: 0,
          cantidadAmb: 15,
          cantidadInt: 0,
          motivos: []
        }
      ],
      medicos: [],
      operadores: []
    };

    service.getDesempenoGlobal('2026-08').subscribe((res: any) => {
      expect(res).toEqual(mockDesempeno);
      expect(res.analistas[0].distribucionAtencion).toBe('100% Amb / 0% Int');
    });

    const req = httpMock.expectOne(r =>
      r.url.includes('/api/graficos/desempeno') &&
      r.params.get('periodo') === '2026-08'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockDesempeno);
  });

  it('getDesempenoGlobal debería enviar fechaDesde y fechaHasta en los parámetros HTTP', () => {
    service.getDesempenoGlobal('2026-08', '2026-08-01', '2026-08-31').subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/api/graficos/desempeno') &&
      r.params.get('periodo') === '2026-08' &&
      r.params.get('fechaDesde') === '2026-08-01' &&
      r.params.get('fechaHasta') === '2026-08-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ analistas: [], medicos: [], operadores: [] });
  });

  it('getBalanceFinanciero debería enviar parámetros de cobertura, tipoDoc y fechas', () => {
    service.getBalanceFinanciero('443', 'FC', '2026-05-01', '2026-05-31').subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/api/graficos/balance') &&
      r.params.get('codigoCobertura') === '443' &&
      r.params.get('tipoDoc') === 'FC' &&
      r.params.get('fechaDesde') === '2026-05-01' &&
      r.params.get('fechaHasta') === '2026-05-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getCarteraDonut debería enviar parámetros de cobertura, tipoDoc y fechas', () => {
    service.getCarteraDonut('443', 'FC', '2026-05-01', '2026-05-31').subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/api/graficos/cartera-donut') &&
      r.params.get('codigoCobertura') === '443' &&
      r.params.get('tipoDoc') === 'FC' &&
      r.params.get('fechaDesde') === '2026-05-01' &&
      r.params.get('fechaHasta') === '2026-05-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getEvolucionMensual debería enviar parámetros de cobertura, tipoDoc y fechas', () => {
    service.getEvolucionMensual('443', 'FC', '2026-05-01', '2026-05-31').subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/api/graficos/evolucion') &&
      r.params.get('codigoCobertura') === '443' &&
      r.params.get('tipoDoc') === 'FC' &&
      r.params.get('fechaDesde') === '2026-05-01' &&
      r.params.get('fechaHasta') === '2026-05-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTiemposCobranza debería enviar parámetros de cobertura, tipoDoc y fechas', () => {
    service.getTiemposCobranza('443', 'FC', '2026-05-01', '2026-05-31').subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/api/graficos/tiempos-cobranza') &&
      r.params.get('codigoCobertura') === '443' &&
      r.params.get('tipoDoc') === 'FC' &&
      r.params.get('fechaDesde') === '2026-05-01' &&
      r.params.get('fechaHasta') === '2026-05-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ dsoGlobal: 120, cobroRealPromedio: 0, saldoTotalMora: 50000, detalles: [] });
  });
});
