import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
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

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  describe('Método: buscarPrestaciones', () => {
    it('debería realizar un GET y enviar los filtros como query params', () => {
      const filtrosMocks = { tipo: 'FC', letra: 'A', puntoVenta: '10' };
      const respuestaMock = [{ id: 1, paciente: 'Yanina' }];

      service.buscarPrestaciones(filtrosMocks).subscribe(res => {
        expect(res).toEqual(respuestaMock as any);
      });

      const peticion = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/buscar?tipo=FC&letra=A&puntoVenta=10`);

      expect(peticion.request.method).toBe('GET');
      peticion.flush(respuestaMock);
    });
  });

  describe('Métodos de Guardado (POST)', () => {
    it('debería realizar un POST hacia guardar-parcialmente con el payload', () => {
      const payloadMock = { registros: [{ id: 1, motivo: 'Error' }] };

      service.guardarParcialmente(payloadMock).subscribe();

      const peticion = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/guardar-parcialmente`);
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual(payloadMock);

      peticion.flush({ status: 'OK' });
    });

    it('debería realizar un POST hacia nueva-nota-credito con el payload', () => {
      const payloadMock = { origen: 'FC', datosNota: {} };

      service.guardarNuevaNotaCredito(payloadMock).subscribe();

      const peticion = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/nueva-nota-credito`);
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual(payloadMock);

      peticion.flush({ status: 'OK' });
    });

    it('debería realizar un POST hacia nueva-nota-debito con el payload', () => {
      const payloadMock = { origen: 'FC', datosNota: {} };

      service.guardarNuevaNotaDebito(payloadMock).subscribe();

      const peticion = httpMock.expectOne(`${environment.apiUrl}/api/auditoria/nueva-nota-debito`);
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual(payloadMock);

      peticion.flush({ status: 'OK' });
    });
  });
});
