import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HelpDrawerComponent } from './help-drawer.component';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, HelpDrawerComponent]
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
});
