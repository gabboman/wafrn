import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AskDialogContentComponent } from './ask-dialog-content.component';

describe('AskDialogContentComponent', () => {
  let component: AskDialogContentComponent;
  let fixture: ComponentFixture<AskDialogContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AskDialogContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AskDialogContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
