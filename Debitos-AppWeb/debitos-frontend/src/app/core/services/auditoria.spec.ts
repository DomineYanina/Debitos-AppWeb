import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuditoriaService } from './auditoria';
import { environment } from '../../../environments/environment';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuditoriaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuditoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('buscarPrestaciones debería enviar parámetros GET', () => {
    const filtros = { tipo: 'FC', letra: 'A', puntoVenta: 1, numero: 100 };
    service.buscarPrestaciones(filtros).subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/buscar`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('tipo')).toBe('FC');
    expect(req.request.params.get('numero')).toBe('100');
    req.flush([]);
  });

  it('guardarParcialmente debería enviar POST', () => {
    const payload = { idCabecera: 1, prestaciones: [] };
    service.guardarParcialmente(payload).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/guardar-parcialmente`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ exito: true });
  });

  it('guardarNuevaNotaCredito debería enviar POST', () => {
    const payload = { datosNota: { tipo: 'NC' } };
    service.guardarNuevaNotaCredito(payload).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/nueva-nota-credito`);
    expect(req.request.method).toBe('POST');
    req.flush({ exito: true });
  });

  it('editarNcAjusteIva debería enviar PUT', () => {
    const payload = { datosNota: { tipo: 'NC', id: 5 } };
    service.editarNcAjusteIva(payload).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/editar-nc-ajuste-iva`);
    expect(req.request.method).toBe('PUT');
    req.flush({ exito: true });
  });

  it('guardarNuevaNotaDebito debería enviar POST', () => {
    const payload = { datosNota: { tipo: 'ND' } };
    service.guardarNuevaNotaDebito(payload).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/nueva-nota-debito`);
    expect(req.request.method).toBe('POST');
    req.flush({ exito: true });
  });

  it('guardarNuevaNotaDebitoAjusteIva debería enviar POST', () => {
    const payload = { tipo: 'ND', ajusteIva: true };
    service.guardarNuevaNotaDebitoAjusteIva(payload).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/nueva-nota-debito-ajuste-iva`);
    expect(req.request.method).toBe('POST');
    req.flush({ exito: true });
  });

  it('verificarTieneNC debería enviar GET con parámetros', () => {
    service.verificarTieneNC('A', 1, 1000).subscribe(res => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/tiene-nc`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('letra')).toBe('A');
    expect(req.request.params.get('puntoVenta')).toBe('1');
    expect(req.request.params.get('numero')).toBe('1000');
    req.flush([]);
  });

  it('verificarTieneNcAjusteIva debería enviar GET con mayúsculas en tipo y letra', () => {
    service.verificarTieneNcAjusteIva('nc', 'a', 2, 2000).subscribe(res => {
      expect(res).toBe(true);
    });

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/tiene-nc-ajuste-iva`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('tipo')).toBe('nc');
    expect(req.request.params.get('letra')).toBe('A');
    expect(req.request.params.get('puntoVenta')).toBe('2');
    expect(req.request.params.get('numero')).toBe('2000');
    req.flush(true);
  });

  it('verificarTieneND debería enviar GET', () => {
    service.verificarTieneND('B', 3, 3000).subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/tiene-nd`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('letra')).toBe('B');
    req.flush([]);
  });

  it('verificarTieneNCParaND debería enviar GET', () => {
    service.verificarTieneNCParaND('A', 1, 500).subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/tiene-nc-para-nd`);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('obtenerDocumentoAsociadoNC debería enviar GET', () => {
    service.obtenerDocumentoAsociadoNC('A', 1, 500).subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/documento-asociado-nc`);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('obtenerCabecerasDisponibles debería enviar parámetros opcionales correctamente', () => {
    // Con todos los parámetros
    service.obtenerCabecerasDisponibles('NC', 'ORIGEN_APP', 'A', 1, 5000).subscribe();
    const req1 = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/cabeceras-disponibles`);
    expect(req1.request.params.get('tipo')).toBe('NC');
    expect(req1.request.params.get('origen')).toBe('ORIGEN_APP');
    expect(req1.request.params.get('letra')).toBe('A');
    expect(req1.request.params.get('puntoVenta')).toBe('1');
    expect(req1.request.params.get('numero')).toBe('5000');
    req1.flush([]);

    // Solo tipo
    service.obtenerCabecerasDisponibles('ND').subscribe();
    const req2 = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/cabeceras-disponibles`);
    expect(req2.request.params.get('tipo')).toBe('ND');
    expect(req2.request.params.has('letra')).toBe(false);
    req2.flush([]);
  });

  it('obtenerHistorialComprobantes debería enviar parámetros opcionales y default a FC', () => {
    service.obtenerHistorialComprobantes('', 'a', 2, 8000).subscribe();
    const req1 = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/historial-comprobantes`);
    expect(req1.request.params.get('tipo')).toBe('FC');
    expect(req1.request.params.get('letra')).toBe('A');
    expect(req1.request.params.get('puntoVenta')).toBe('2');
    expect(req1.request.params.get('numero')).toBe('8000');
    req1.flush([]);

    service.obtenerHistorialComprobantes('ND', undefined, undefined, 9000).subscribe();
    const req2 = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/historial-comprobantes`);
    expect(req2.request.params.get('tipo')).toBe('ND');
    expect(req2.request.params.has('letra')).toBe(false);
    expect(req2.request.params.has('puntoVenta')).toBe(false);
    expect(req2.request.params.get('numero')).toBe('9000');
    req2.flush([]);
  });

  it('registrarMetricaUsabilidad y registrarMetricasLote deberían enviar POST', () => {
    const metrica = { evento: 'CLICK', usuario: 'admin' };
    service.registrarMetricaUsabilidad(metrica).subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/telemetria/usabilidad`);
    expect(req1.request.method).toBe('POST');
    req1.flush({ ok: true });

    service.registrarMetricasLote([metrica]).subscribe();
    const req2 = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/telemetria/usabilidad/lote`);
    expect(req2.request.method).toBe('POST');
    req2.flush({ ok: true });
  });

  it('cambiarEstadoGrupo debería enviar PUT con forzarCierre en params', () => {
    service.cambiarEstadoGrupo(100, 2, true).subscribe();
    const req1 = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/grupo/100/estado/2`);
    expect(req1.request.method).toBe('PUT');
    expect(req1.request.params.get('forzarCierre')).toBe('true');
    req1.flush({ exito: true });

    service.cambiarEstadoGrupo(100, 1).subscribe();
    const req2 = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/auditoria/grupo/100/estado/1`);
    expect(req2.request.params.get('forzarCierre')).toBe('false');
    req2.flush({ exito: true });
  });
});
