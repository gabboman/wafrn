import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEditorComponent } from './new-editor.component';

describe('NewEditorComponent', () => {
  let component: NewEditorComponent;
  let fixture: ComponentFixture<NewEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
