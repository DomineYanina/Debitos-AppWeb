import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService (Toasts)', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
  });

  it('debería crearse con lista vacía de toasts', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it('debería agregar toasts de tipo success, error, warning, info', () => {
    service.success('Operación exitosa', 'Éxito');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Operación exitosa');
    expect(service.toasts()[0].title).toBe('Éxito');

    service.error('Ocurrió un error', 'Error');
    expect(service.toasts().length).toBe(2);
    expect(service.toasts()[1].type).toBe('error');

    service.warning('Cuidado con la acción', 'Advertencia');
    expect(service.toasts().length).toBe(3);
    expect(service.toasts()[2].type).toBe('warning');

    service.info('Información adicional', 'Info');
    expect(service.toasts().length).toBe(4);
    expect(service.toasts()[3].type).toBe('info');
  });

  it('debería remover toast al invocar dismiss', () => {
    service.success('Mensaje');
    const toastId = service.toasts()[0].id;

    service.dismiss(toastId);
    expect(service.toasts().length).toBe(0);
  });

  it('debería descartar automáticamente por timeout y respetar duration 0', () => {
    vi.useFakeTimers();
    try {
      service.show({ type: 'info', message: 'Auto dismiss', duration: 1000 });
      expect(service.toasts().length).toBe(1);
      vi.advanceTimersByTime(1000);
      expect(service.toasts().length).toBe(0);

      service.show({ type: 'warning', message: 'No auto dismiss', duration: 0 });
      expect(service.toasts().length).toBe(1);
      vi.advanceTimersByTime(5000);
      expect(service.toasts().length).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
