import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingBarComponent } from './loading-bar.component';
import { LoadingService } from '../../services/loading.service';

describe('LoadingBarComponent', () => {
  let component: LoadingBarComponent;
  let fixture: ComponentFixture<LoadingBarComponent>;
  let loadingService: LoadingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingBarComponent],
      providers: [LoadingService]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingBarComponent);
    component = fixture.componentInstance;
    loadingService = TestBed.inject(LoadingService);
    fixture.detectChanges();
  });

  it('debería crearse y no mostrar la barra si isLoading es false', () => {
    expect(component).toBeTruthy();
    const container = fixture.nativeElement.querySelector('.loading-bar-container');
    expect(container).toBeNull();
  });

  it('debería mostrar la barra si isLoading es true', () => {
    loadingService.show();
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.loading-bar-container');
    expect(container).toBeTruthy();
  });
});
