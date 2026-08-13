import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
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
   * Estado desplegable de cada grupo de preguntas frecuentes (por defecto todos colapsados/ocultos).
   */
  openGroups = signal<Record<string, boolean>>({
    busqueda: false,
    edicion: false,
    motivos: false,
    grilla: false,
    calculos: false,
    documentos: false,
    exportacion: false
  });

  /**
   * Alterna la visibilidad de un grupo de preguntas (abierto / cerrado).
   */
  toggleGroup(groupId: string): void {
    this.openGroups.update(state => ({
      ...state,
      [groupId]: !state[groupId]
    }));
  }

  /**
   * Indica si un grupo en específico está desplegado.
   */
  isGroupOpen(groupId: string): boolean {
    return !!this.openGroups()[groupId];
  }

  /**
   * Estado desplegable de cada pregunta individual (por defecto todas colapsadas/ocultas).
   */
  openQuestions = signal<Record<string, boolean>>({});

  /**
   * Alterna la visibilidad de la respuesta a una pregunta individual.
   */
  toggleQuestion(questionId: string): void {
    this.openQuestions.update(state => ({
      ...state,
      [questionId]: !state[questionId]
    }));
  }

  /**
   * Indica si la respuesta a una pregunta individual está desplegada.
   */
  isQuestionOpen(questionId: string): boolean {
    return !!this.openQuestions()[questionId];
  }

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

