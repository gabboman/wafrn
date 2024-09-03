import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AacForAlexComponent } from './aac-for-alex.component';

describe('AacForAlexComponent', () => {
  let component: AacForAlexComponent;
  let fixture: ComponentFixture<AacForAlexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AacForAlexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AacForAlexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
