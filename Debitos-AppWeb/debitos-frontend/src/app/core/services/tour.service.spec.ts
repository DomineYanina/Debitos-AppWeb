import { TestBed } from '@angular/core/testing';
import { TourService } from './tour.service';
import { ShepherdService } from 'angular-shepherd';
import { expect, vi } from 'vitest';

describe('TourService', () => {
  let service: TourService;
  let shepherdMock: any;

  beforeEach(() => {
    localStorage.clear();
    shepherdMock = {
      defaultStepOptions: {},
      modal: false,
      confirmCancel: false,
      tourObject: {
        steps: [],
        once: vi.fn()
      },
      addSteps: vi.fn(),
      start: vi.fn(),
      next: vi.fn(),
      back: vi.fn(),
      complete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TourService,
        { provide: ShepherdService, useValue: shepherdMock }
      ]
    });
    service = TestBed.inject(TourService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería crearse correctamente con tour inactivo inicialmente', () => {
    expect(service).toBeTruthy();
    let activo: boolean | undefined;
    service.tourActivo$.subscribe(val => activo = val);
    expect(activo).toBe(false);
  });

  it('startSearchTour no debería iniciar si ya fue completado', () => {
    localStorage.setItem('tour_busqueda_completado', 'true');
    service.startSearchTour();
    expect(shepherdMock.addSteps).not.toHaveBeenCalled();
    expect(shepherdMock.start).not.toHaveBeenCalled();
  });

  it('startSearchTour debería configurar pasos, suscribir eventos y arrancar', () => {
    service.startSearchTour();
    expect(shepherdMock.addSteps).toHaveBeenCalled();
    expect(shepherdMock.start).toHaveBeenCalled();

    let activo: boolean | undefined;
    service.tourActivo$.subscribe(val => activo = val);
    expect(activo).toBe(true);

    const pasos = shepherdMock.addSteps.mock.calls[0][0];
    expect(pasos.length).toBe(2);

    pasos[0].buttons[0].action();
    expect(shepherdMock.next).toHaveBeenCalled();

    pasos[1].buttons[0].action();
    expect(shepherdMock.back).toHaveBeenCalled();
    pasos[1].buttons[1].action();
    expect(shepherdMock.complete).toHaveBeenCalled();
  });

  it('startResultsTour no debería iniciar si ya fue completado', () => {
    localStorage.setItem('tour_resultados_completado', 'true');
    service.startResultsTour();
    expect(shepherdMock.addSteps).not.toHaveBeenCalled();
  });

  it('startResultsTour debería armar pasos y arrancar', () => {
    service.startResultsTour();
    expect(shepherdMock.addSteps).toHaveBeenCalled();
    expect(shepherdMock.start).toHaveBeenCalled();

    const pasos = shepherdMock.addSteps.mock.calls[0][0];
    expect(pasos.length).toBeGreaterThan(5);
    pasos.forEach((p: any) => {
      if (p.buttons) {
        p.buttons.forEach((b: any) => {
          if (typeof b.action === 'function') {
            b.action();
          }
        });
      }
    });

    (service as any).finalizarTourBusqueda();
    expect(localStorage.getItem('tour_busqueda_completado')).toBe('true');

    (service as any).finalizarTourResultados();
    expect(localStorage.getItem('tour_resultados_completado')).toBe('true');
  });

  it('startFullTour debería iniciar el tour completo si no fue completado o forzado', () => {
    service.startFullTour(true);
    expect(shepherdMock.addSteps).toHaveBeenCalled();
    expect(shepherdMock.start).toHaveBeenCalled();

    const pasosTrue = shepherdMock.addSteps.mock.calls[0][0];
    pasosTrue.forEach((p: any) => {
      if (p.buttons) {
        p.buttons.forEach((b: any) => {
          if (typeof b.action === 'function') {
            b.action();
          }
        });
      }
    });

    shepherdMock.addSteps.mockClear();
    service.startFullTour(false);
    const pasosFalse = shepherdMock.addSteps.mock.calls[0][0];
    pasosFalse.forEach((p: any) => {
      if (p.buttons) {
        p.buttons.forEach((b: any) => {
          if (typeof b.action === 'function') {
            b.action();
          }
        });
      }
    });
  });

  it('suscribirEventosFin debería registrar callbacks para complete y cancel', () => {
    let completeCb: any;
    let cancelCb: any;
    shepherdMock.tourObject.once = vi.fn((event: string, cb: any) => {
      if (event === 'complete') completeCb = cb;
      if (event === 'cancel') cancelCb = cb;
    });

    const onFin = vi.fn();
    (service as any).suscribirEventosFin(onFin);

    expect(shepherdMock.tourObject.once).toHaveBeenCalledWith('complete', expect.any(Function));
    expect(shepherdMock.tourObject.once).toHaveBeenCalledWith('cancel', expect.any(Function));

    completeCb();
    expect(onFin).toHaveBeenCalled();
    cancelCb();
    expect(onFin).toHaveBeenCalledTimes(2);
  });
});
