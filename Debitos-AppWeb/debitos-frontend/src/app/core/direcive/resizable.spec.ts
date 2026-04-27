import { ElementRef, NgZone, Renderer2 } from '@angular/core';
import { ResizableDirective } from './resizable';

describe('ResizableDirective', () => {
  it('should create an instance', () => {
    const mockElementRef = { nativeElement: document.createElement('th') } as ElementRef;

    // Objetos JS puros con funciones vacías
    const mockRenderer = { listen: () => {}, setStyle: () => {}, addClass: () => {}, removeClass: () => {} } as any;
    const mockNgZone = { runOutsideAngular: (fn: any) => fn() } as any;

    const directive = new ResizableDirective(mockElementRef, mockRenderer, mockNgZone);
    expect(directive).toBeTruthy();
  });
});
