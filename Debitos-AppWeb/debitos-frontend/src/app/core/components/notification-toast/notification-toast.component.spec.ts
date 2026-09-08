import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationToastComponent } from './notification-toast.component';
import { NotificationService } from '../../services/notification.service';

describe('NotificationToastComponent', () => {
  let component: NotificationToastComponent;
  let fixture: ComponentFixture<NotificationToastComponent>;
  let service: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationToastComponent],
      providers: [NotificationService]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationToastComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar tarjetas toast con sus íconos y títulos para cada tipo', () => {
    service.success('Guardado correctamente', 'Éxito');
    service.error('Error al guardar', 'Error');
    service.warning('Precaución', 'Alerta');
    service.info('Dato relevante', 'Info');
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.toast-card');
    expect(cards.length).toBe(4);

    const closeBtn = fixture.nativeElement.querySelector('.btn-close-toast');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();

    expect(service.toasts().length).toBe(3);
  });
});
