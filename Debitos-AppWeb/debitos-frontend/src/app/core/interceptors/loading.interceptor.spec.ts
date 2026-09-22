import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoadingService,
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería llamar a show y hide en peticiones normales', () => {
    const showSpy = vi.spyOn(loadingService, 'show');
    const hideSpy = vi.spyOn(loadingService, 'hide');

    http.get('/api/directorio/totales').subscribe();

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(hideSpy).not.toHaveBeenCalled();

    const req = httpMock.expectOne('/api/directorio/totales');
    req.flush({});

    expect(hideSpy).toHaveBeenCalledTimes(1);
  });

  it('no debería activar el loading en peticiones de notificaciones en segundo plano', () => {
    const showSpy = vi.spyOn(loadingService, 'show');
    const hideSpy = vi.spyOn(loadingService, 'hide');

    http.get('/api/notificaciones/recientes').subscribe();

    expect(showSpy).not.toHaveBeenCalled();

    const req = httpMock.expectOne('/api/notificaciones/recientes');
    req.flush([]);

    expect(hideSpy).not.toHaveBeenCalled();
  });

  it('no debería activar el loading si la petición incluye el header X-Skip-Loading', () => {
    const showSpy = vi.spyOn(loadingService, 'show');
    const hideSpy = vi.spyOn(loadingService, 'hide');

    http.get('/api/datos-silenciosos', {
      headers: { 'X-Skip-Loading': 'true' }
    }).subscribe();

    expect(showSpy).not.toHaveBeenCalled();

    const req = httpMock.expectOne('/api/datos-silenciosos');
    req.flush({});

    expect(hideSpy).not.toHaveBeenCalled();
  });
});
