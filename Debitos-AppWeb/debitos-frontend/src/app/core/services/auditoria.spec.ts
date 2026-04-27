import { TestBed } from '@angular/core/testing';

import { AuditoriaService } from './auditoria';

describe('Auditoria', () => {
  let service: AuditoriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditoriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
