import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AskListComponent } from './ask-list.component';

describe('AskListComponent', () => {
  let component: AskListComponent;
  let fixture: ComponentFixture<AskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AskListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
