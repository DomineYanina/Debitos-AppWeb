import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellEditorAngularComp } from 'ag-grid-angular';

@Component({
  selector: 'app-grouped-select-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <select [(ngModel)]="value" class="input-grilla" style="width: 100%; height: 100%; border: none; outline: none;">
      <option value="">Seleccionar...</option>
      <optgroup *ngFor="let grupo of grupos" [label]="grupo.categoria">
        <option *ngFor="let motivo of grupo.motivos" [value]="motivo">{{ motivo }}</option>
      </optgroup>
    </select>
  `
})
export class GroupedSelectEditor implements ICellEditorAngularComp {
  value: string = '';
  grupos: any[] = [];

  agInit(params: any): void {
    this.value = params.value || '';
    this.grupos = params.grupos || [];
  }

  getValue(): string {
    return this.value;
  }
}
