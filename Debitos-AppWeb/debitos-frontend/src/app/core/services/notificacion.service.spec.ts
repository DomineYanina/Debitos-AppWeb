import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { NotificacionService } from './notificacion.service';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';
import { Notificacion } from '../models/notificacion.model';
import { vi } from 'vitest';

describe('NotificacionService', () => {
  let service: NotificacionService;
  let httpMock: HttpTestingController;
  let authServiceMock: any;
  let autenticadoSubject: Subject<boolean>;

  beforeEach(() => {
    autenticadoSubject = new Subject<boolean>();
    authServiceMock = {
      isLoggedIn: vi.fn().mockReturnValue(true),
      esAdminReal: vi.fn().mockReturnValue(true),
      isAdmin: vi.fn().mockReturnValue(true),
      obtenerUsuario: vi.fn().mockReturnValue('admin'),
      autenticado$: autenticadoSubject.asObservable()
    };

    TestBed.configureTestingModule({
      providers: [
        NotificacionService,
        { provide: AuthService, useValue: authServiceMock },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(NotificacionService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse e iniciar polling/carga inicial si es admin', () => {
    expect(service).toBeTruthy();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('debería responder ante emisiones de autenticado$', () => {
    const reqInit = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    reqInit.flush([]);

    // Simular logout
    autenticadoSubject.next(false);
    service.notificaciones$.subscribe(list => expect(list).toEqual([]));
    service.noLeidasCount$.subscribe(count => expect(count).toBe(0));

    // Simular login admin
    autenticadoSubject.next(true);
    const reqAuth = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    expect(reqAuth.request.method).toBe('GET');
    reqAuth.flush([]);
  });

  it('debería cargar notificaciones y actualizar contadores de no leídas', () => {
    const reqInit = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    reqInit.flush([]);

    const mockNotifs: Partial<Notificacion>[] = [
      { id: 1, titulo: 'NC creada', leida: false },
      { id: 2, titulo: 'FC reporte', leida: true }
    ];

    let notifsCount: number | undefined;
    let noLeidasCount: number | undefined;

    service.notificaciones$.subscribe(list => notifsCount = list.length);
    service.noLeidasCount$.subscribe(count => noLeidasCount = count);

    service.cargarNotificaciones();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifs);

    expect(notifsCount).toBe(2);
    expect(noLeidasCount).toBe(1);
  });

  it('no debería cargar notificaciones si el usuario no está logueado', () => {
    const reqInit = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    reqInit.flush([]);

    authServiceMock.isLoggedIn.mockReturnValue(false);
    service.cargarNotificaciones();
    httpMock.expectNone(`${environment.apiUrl}/api/notificaciones/recientes`);
  });

  it('debería marcar como leída optimistamente y llamar al endpoint PUT', () => {
    const reqInit = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    const notifs: any[] = [{ id: 10, titulo: 'Notif 1', leida: false }, { id: 11, titulo: 'Notif 2', leida: false }];
    reqInit.flush(notifs);

    service.marcarComoLeida(10);

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/10/leer`);
    expect(req.request.method).toBe('PUT');
    req.flush({});

    service.notificaciones$.subscribe(list => {
      const item = list.find(n => n.id === 10);
      expect(item?.leida).toBe(true);
    });
  });

  it('debería marcar todas como leídas optimistamente y llamar al endpoint PUT', () => {
    const reqInit = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    const notifs: any[] = [{ id: 10, titulo: 'Notif 1', leida: false }, { id: 11, titulo: 'Notif 2', leida: false }];
    reqInit.flush(notifs);

    service.marcarTodasComoLeidas();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/leer-todas`);
    expect(req.request.method).toBe('PUT');
    req.flush({});

    service.noLeidasCount$.subscribe(count => {
      expect(count).toBe(0);
    });
  });

  it('navegarAComprobante debería marcar como leída y emitir en notificacionSeleccionada$', () => {
    const reqInit = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    reqInit.flush([]);

    const notif = { id: 25, titulo: 'NC generada', tipoDoc: 'NC', leida: false } as Notificacion;
    let emitida: Notificacion | undefined;
    service.notificacionSeleccionada$.subscribe(n => emitida = n);

    service.navegarAComprobante(notif);

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/25/leer`);
    expect(req.request.method).toBe('PUT');
    req.flush({});

    expect(emitida).toEqual(notif);
  });

  it('reportarDocumentoNoEncontrado debería enviar POST con los datos del documento', () => {
    const reqInit = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/recientes`);
    reqInit.flush([]);

    const doc = { tipo: 'FC', letra: 'A', puntoVenta: 1, numero: 999 };
    service.reportarDocumentoNoEncontrado(doc, 'Detalle no encontrado').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notificaciones/reportar-no-encontrado`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      usuario: 'admin',
      tipoDoc: 'FC',
      letraDoc: 'A',
      puntoVenta: 1,
      numero: 999,
      detalle: 'Detalle no encontrado'
    });
    req.flush({ exito: true });
  });
});
