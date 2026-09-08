import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService]
    });
    service = TestBed.inject(LoadingService);
  });

  it('debería crearse con isLoading en false', () => {
    expect(service).toBeTruthy();
    expect(service.isLoading()).toBe(false);
  });

  it('debería incrementar contador y activar isLoading con show()', () => {
    service.show();
    expect(service.isLoading()).toBe(true);

    service.show();
    expect(service.isLoading()).toBe(true);

    service.hide();
    expect(service.isLoading()).toBe(true); // Todavía queda 1 activa

    service.hide();
    expect(service.isLoading()).toBe(false); // Llega a 0

    service.hide(); // No baja de 0
    expect(service.isLoading()).toBe(false);
  });
});
