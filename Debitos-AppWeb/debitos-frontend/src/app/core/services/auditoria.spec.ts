import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuditoriaService } from './auditoria';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuditoriaService,
        provideHttpClient(),
        provideHttpClientTesting() // Herramienta clave para interceptar HTTP en tests
      ]
    });

    service = TestBed.inject(AuditoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verificamos que no haya peticiones "colgadas" que nos olvidamos de atrapar
    httpMock.verify();
  });

  it('debería ser creado', () => {
    expect(service).toBeTruthy();
  });

  describe('Método: buscarPrestaciones', () => {
    it('debería realizar un GET y enviar los filtros como query params', () => {
      const filtrosMocks = { tipo: 'FC', letra: 'A', puntoVenta: '10' };
      const respuestaMock = [{ id: 1, paciente: 'Yanina' }];

      // 1. Ejecutamos el método
      service.buscarPrestaciones(filtrosMocks).subscribe(res => {
        expect(res).toEqual(respuestaMock as any);
      });

      // 2. Interceptamos la petición exigiendo que vaya a esta URL exacta
      const peticion = httpMock.expectOne('http://localhost:8080/api/auditoria/buscar?tipo=FC&letra=A&puntoVenta=10');

      // 3. Verificamos que sea un GET
      expect(peticion.request.method).toBe('GET');

      // 4. Simulamos la respuesta del backend en Java
      peticion.flush(respuestaMock);
    });
  });

  describe('Métodos de Guardado (POST)', () => {
    it('debería realizar un POST hacia guardar-parcialmente con el payload', () => {
      const payloadMock = { registros: [ { id: 1, motivo: 'Error' } ] };

      service.guardarParcialmente(payloadMock).subscribe();

      const peticion = httpMock.expectOne('http://localhost:8080/api/auditoria/guardar-parcialmente');
      expect(peticion.request.method).toBe('POST');
      // Verificamos que el payload que viaja en el body sea el correcto
      expect(peticion.request.body).toEqual(payloadMock);

      peticion.flush({ status: 'OK' });
    });

    it('debería realizar un POST hacia nueva-nota-credito con el payload', () => {
      const payloadMock = { origen: 'FC', datosNota: {} };

      service.guardarNuevaNotaCredito(payloadMock).subscribe();

      const peticion = httpMock.expectOne('http://localhost:8080/api/auditoria/nueva-nota-credito');
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual(payloadMock);

      peticion.flush({ status: 'OK' });
    });

    it('debería realizar un POST hacia nueva-nota-debito con el payload', () => {
      const payloadMock = { origen: 'FC', datosNota: {} };

      service.guardarNuevaNotaDebito(payloadMock).subscribe();

      const peticion = httpMock.expectOne('http://localhost:8080/api/auditoria/nueva-nota-debito');
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual(payloadMock);

      peticion.flush({ status: 'OK' });
    });
  });
});
