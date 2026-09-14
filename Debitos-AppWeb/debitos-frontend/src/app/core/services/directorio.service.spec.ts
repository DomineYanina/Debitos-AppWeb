import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DirectorioService } from './directorio.service';
import { environment } from '../../../environments/environment';

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
    const mockTotales = {
      totalFacturado: 100,
      cobranzaEfectiva: 50,
      perdidaAsumida: 10,
      deudaNeta: 40,
      cantidadFacturas: 2,
      cantidadComprobantes: 5
    };

    service.obtenerTotales('OSDE', 'FCE', '2026-08-01', '2026-08-31').subscribe(res => {
      expect(res).toEqual(mockTotales);
    });

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/totales` && r.params.get('codigoCobertura') === 'OSDE' && r.params.get('tipoDoc') === 'FCE');
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
});
