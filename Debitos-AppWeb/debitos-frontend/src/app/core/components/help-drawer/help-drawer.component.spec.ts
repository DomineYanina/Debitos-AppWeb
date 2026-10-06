import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HelpDrawerComponent } from './help-drawer.component';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  imports: [HelpDrawerComponent],
  template: `
    <app-help-drawer
      [isOpen]="isOpen"
      (closeDrawer)="onClose()"
      (startTourRequested)="onStartTour()"
    ></app-help-drawer>
  `
})
class TestHostComponent {
  isOpen = true;
  closed = false;
  tourStarted = false;

  onClose() {
    this.closed = true;
  }

  onStartTour() {
    this.tourStarted = true;
  }
}

describe('HelpDrawerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let drawerComponent: HelpDrawerComponent;
  let rolActivo = 'ADMIN';

  const mockAuthService = {
    hasRole: (rol: string) => rol === rolActivo,
    isAdmin: () => rolActivo === 'ADMIN'
  };

  beforeEach(async () => {
    rolActivo = 'ADMIN';
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, HelpDrawerComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    drawerComponent = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(drawerComponent).toBeTruthy();
    expect(drawerComponent.isGroupOpen('busqueda')).toBe(false);
  });

  it('debería alternar apertura de grupos y preguntas individuales', () => {
    drawerComponent.toggleGroup('busqueda');
    expect(drawerComponent.isGroupOpen('busqueda')).toBe(true);

    drawerComponent.toggleGroup('busqueda');
    expect(drawerComponent.isGroupOpen('busqueda')).toBe(false);

    drawerComponent.toggleGroup('historial');
    expect(drawerComponent.isGroupOpen('historial')).toBe(true);

    drawerComponent.toggleQuestion('busqueda-q3');
    expect(drawerComponent.isQuestionOpen('busqueda-q3')).toBe(true);
    drawerComponent.toggleQuestion('busqueda-q3');
    expect(drawerComponent.isQuestionOpen('busqueda-q3')).toBe(false);

    drawerComponent.toggleQuestion('historial-q1');
    expect(drawerComponent.isQuestionOpen('historial-q1')).toBe(true);

    drawerComponent.toggleQuestion('busqueda-q1');
    expect(drawerComponent.isQuestionOpen('busqueda-q1')).toBe(true);

    drawerComponent.toggleQuestion('busqueda-q1');
    expect(drawerComponent.isQuestionOpen('busqueda-q1')).toBe(false);
  });

  it('debería emitir eventos onClose y onRestartTour', () => {
    drawerComponent.onClose();
    expect(hostComponent.closed).toBe(true);

    drawerComponent.onRestartTour();
    expect(hostComponent.tourStarted).toBe(true);
  });

  it('debería renderizar panel abierto cuando isOpen es true', () => {
    const drawer = fixture.nativeElement.querySelector('.drawer-container.open');
    expect(drawer).toBeTruthy();
  });

  it('debería mostrar la sección de administración cuando el rol es ADMIN', () => {
    expect(drawerComponent.esAdmin()).toBe(true);
    const adminDivider = fixture.nativeElement.querySelector('.admin-faq-divider');
    expect(adminDivider).toBeTruthy();

    drawerComponent.toggleGroup('adminSimulacion');
    expect(drawerComponent.isGroupOpen('adminSimulacion')).toBe(true);

    drawerComponent.toggleQuestion('admin-q1');
    expect(drawerComponent.isQuestionOpen('admin-q1')).toBe(true);
  });

  it('debería ocultar la sección de administración cuando no es ADMIN (o simula otro rol)', () => {
    rolActivo = 'OPERADOR';
    drawerComponent.cdr.markForCheck();
    fixture.detectChanges();

    expect(drawerComponent.esAdmin()).toBe(false);
    const adminDivider = fixture.nativeElement.querySelector('.admin-faq-divider');
    expect(adminDivider).toBeFalsy();
  });
});
