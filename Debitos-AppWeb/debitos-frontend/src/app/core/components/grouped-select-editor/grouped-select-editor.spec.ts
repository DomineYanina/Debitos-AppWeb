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
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
