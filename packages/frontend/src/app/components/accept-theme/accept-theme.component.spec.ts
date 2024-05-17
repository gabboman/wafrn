import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptThemeComponent } from './accept-theme.component';

describe('AcceptThemeComponent', () => {
  let component: AcceptThemeComponent;
  let fixture: ComponentFixture<AcceptThemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptThemeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcceptThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
