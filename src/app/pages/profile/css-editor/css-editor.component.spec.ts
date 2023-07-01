import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CssEditorComponent } from './css-editor.component';

describe('CssEditorComponent', () => {
  let component: CssEditorComponent;
  let fixture: ComponentFixture<CssEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CssEditorComponent]
    });
    fixture = TestBed.createComponent(CssEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
