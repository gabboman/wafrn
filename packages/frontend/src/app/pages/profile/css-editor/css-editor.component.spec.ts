import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CssEditorComponent } from './css-editor.component';

describe('CssEditorComponent', () => {
  let component: CssEditorComponent;
  let fixture: ComponentFixture<CssEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CssEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CssEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
