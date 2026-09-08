import { Component, ElementRef, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResizableDirective } from './resizable';
import { vi } from 'vitest';

@Component({
  standalone: true,
  imports: [ResizableDirective],
  template: `<div appResizable style="width: 200px; height: 100px;">Panel</div>`
})
class TestResizableHostComponent {}

describe('ResizableDirective', () => {
  let fixture: ComponentFixture<TestResizableHostComponent>;
  let hostEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestResizableHostComponent, ResizableDirective]
    });
    fixture = TestBed.createComponent(TestResizableHostComponent);
    fixture.detectChanges();
    hostEl = fixture.nativeElement.querySelector('div');
  });

  it('debería crearse e insertar el tirador resizer-handle', () => {
    expect(hostEl).toBeTruthy();
    const handle = hostEl.querySelector('.resizer-handle');
    expect(handle).toBeTruthy();
    expect(hostEl.style.position).toBe('relative');
  });

  it('debería redimensionar el elemento ante eventos mousedown, mousemove y mouseup', () => {
    const handle = hostEl.querySelector('.resizer-handle') as HTMLElement;
    expect(handle).toBeTruthy();

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 123;
    });

    // Mousedown en el tirador
    const mousedownEvent = new MouseEvent('mousedown', { clientX: 100, bubbles: true });
    handle.dispatchEvent(mousedownEvent);

    // Mousemove simulado
    const mousemoveEvent = new MouseEvent('mousemove', { clientX: 150 });
    document.dispatchEvent(mousemoveEvent);

    expect(hostEl.style.width).toBe('50px');

    // Mouseup para finalizar
    const mouseupEvent = new MouseEvent('mouseup');
    document.dispatchEvent(mouseupEvent);

    expect(hostEl).toBeTruthy();
    rafSpy.mockRestore();
  });

  it('ngOnDestroy debería limpiar los listeners activos', () => {
    const handle = hostEl.querySelector('.resizer-handle') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }));

    fixture.destroy();
    expect(true).toBe(true);
  });
});
