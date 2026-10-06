import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupedSelectEditor } from './grouped-select-editor';

describe('GroupedSelectEditor', () => {
  let component: GroupedSelectEditor;
  let fixture: ComponentFixture<GroupedSelectEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupedSelectEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupedSelectEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería inicializarse con agInit y devolver el valor con getValue', () => {
    expect(component).toBeTruthy();

    const mockParams = {
      value: '01 - Documentación faltante',
      grupos: [
        {
          categoria: 'Administrativos',
          motivos: ['01 - Documentación faltante', '02 - Falta firma']
        }
      ]
    };

    component.agInit(mockParams);
    expect(component.value).toBe('01 - Documentación faltante');
    expect(component.grupos.length).toBe(1);
    expect(component.getValue()).toBe('01 - Documentación faltante');

    fixture.detectChanges();
    const selectEl = fixture.nativeElement.querySelector('select');
    expect(selectEl).toBeTruthy();
    const optgroup = fixture.nativeElement.querySelector('optgroup');
    expect(optgroup).toBeTruthy();
    expect(optgroup.label).toBe('Administrativos');
  });

  it('agInit debería manejar params vacíos', () => {
    component.agInit({});
    expect(component.value).toBe('');
    expect(component.grupos).toEqual([]);
    expect(component.getValue()).toBe('');
  });
});
