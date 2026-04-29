import { Directive, ElementRef, Renderer2, OnInit, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appResizable]',
  standalone: true
})
export class ResizableDirective implements OnInit, OnDestroy {
  private startX!: number;
  private startWidth!: number;
  private resizer!: HTMLElement;
  private isResizing = false;

  // Guardamos las referencias de los eventos para limpiarlos después
  private mouseMoveListener?: () => void;
  private mouseUpListener?: () => void;
  private animationFrameId?: number;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private zone: NgZone // <-- Inyectamos NgZone
  ) {}

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.resizer = this.renderer.createElement('div');
    this.renderer.addClass(this.resizer, 'resizer-handle');
    this.renderer.appendChild(this.el.nativeElement, this.resizer);

    // Escuchamos el mousedown
    this.renderer.listen(this.resizer, 'mousedown', (event: MouseEvent) => {
      this.isResizing = true;
      this.startX = event.clientX;
      this.startWidth = this.el.nativeElement.offsetWidth;
      event.preventDefault();

      // MAGIA: Ejecutamos los eventos de arrastre AFUERA de Angular
      this.zone.runOutsideAngular(() => {
        // Enlazamos los eventos al documento solo cuando empezamos a arrastrar
        this.mouseMoveListener = this.renderer.listen('document', 'mousemove', this.onMouseMove.bind(this));
        this.mouseUpListener = this.renderer.listen('document', 'mouseup', this.onMouseUp.bind(this));
      });
    });
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;

    // requestAnimationFrame asegura que el DOM se actualice de forma fluida a 60fps
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      // Calculamos el nuevo ancho (y le ponemos un límite mínimo de 50px para que no desaparezca)
      const newWidth = Math.max(50, this.startWidth + (event.clientX - this.startX));

      this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
      this.renderer.setStyle(this.el.nativeElement, 'min-width', `${newWidth}px`);
      // Opcional: forzar max-width ayuda en algunas versiones de Chrome
      this.renderer.setStyle(this.el.nativeElement, 'max-width', `${newWidth}px`);
    });
  }

  onMouseUp() {
    this.isResizing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Limpiamos los eventos del documento para no gastar memoria
    if (this.mouseMoveListener) this.mouseMoveListener();
    if (this.mouseUpListener) this.mouseUpListener();
  }

  ngOnDestroy() {
    // Si el componente se destruye, aseguramos que no queden eventos fantasma
    if (this.mouseMoveListener) this.mouseMoveListener();
    if (this.mouseUpListener) this.mouseUpListener();
  }

}
