import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-drawer.component.html',
  styleUrl: './help-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDrawerComponent {
  /**
   * Estado visual del panel lateral (abierto/cerrado).
   * Angular 21 Signal input con valor por defecto false.
   */
  isOpen = input<boolean>(false);

  /**
   * Evento emitido cuando el usuario solicita cerrar el panel.
   */
  closeDrawer = output<void>();

  /**
   * Evento opcional para reiniciar el tour guiado interactivo.
   */
  startTourRequested = output<void>();

  /**
   * Notifica al componente padre el cierre del panel.
   */
  onClose(): void {
    this.closeDrawer.emit();
  }

  /**
   * Manejador del botón inferior para volver a ver el recorrido guiado.
   */
  onRestartTour(): void {
    this.startTourRequested.emit();
  }
}
